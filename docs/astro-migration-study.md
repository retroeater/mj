# jpml_titles.html Astro試作 調査・設計メモ（#20、クローズ済み）

> **前提が変わっている（2026-09-12 追記）。**
> このメモは issue #20（`jpml_titles.html` をAstroで試作する）向けの事前調査として
> 書いたが、**#20 は実装しないままクローズ済み**で、Astro 試作の対象は
> `index.html`（トップページ）に変更された（理由は `docs/new-site-design.md`
> §1「着手順序: 最初に作るのは index.html（トップページ）」、#101）。
> **Astro 採用の判断を追っているのは #21。**
>
> 本文は `jpml_titles.html` を対象にした当時の調査のまま残してある。
> 2章以降（Astroを入れた場合の負担・リスク・URL構造・`dist/`の扱い）は
> 対象ページに依存しないため #21 の判断材料として引き続き有効。
> 1章「jpml_titles.js の現状整理」だけがこのページ固有の内容で、
> 試作対象を index.html に読み替える場合は当てはまらない。

issue #20（jpml_titles.html をAstroで試作する）向けの事前調査。実装は行っていない。

## 1. jpml_titles.js の現状整理

### データソース
- スプレッドシート: `1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0`（`プロ`シートと同じブック）の「タイトル」シート
- クエリ: `SELECT A,B,C,D,E,F WHERE G = "Y"`
  - A名前, BプロフィールURL, C画像URL, D順位, Eタイトル, F公開日, G表示フラグ(SELECTには含めず絞り込みだけに使用)
  - URLパラメータ `name` があれば `AND A = "<name>"` をそのまま文字列連結で追加（エスケープなし。名前に `"` を含む選手がいると壊れる潜在バグだが、実害は未確認）

### 表示内容・加工
スプレッドシートの6列をそのまま出さず、JS側で**2列に集約**して表示している点が jpml_pros と違う。

- 「写真」列: `imageUrl` があれば `<img>`、なければ共通のデフォルトアイコン。`profileUrl` があれば `<a>` でラップ。画像失敗時は `onerror` インライン属性で同じデフォルトアイコンに差し替え(CSP導入時にブロックされる書き方。jpml_pros側は `data-fallback` + 委譲イベントに直してあるが、こちらは未対応)
- 「概要」列: `公開日<br>タイトル<br>名前<br>順位位` を1セルに連結した文字列（allowHtmlで描画）
- Google Charts の `Table` + `Dashboard` + `ControlWrapper(StringFilter)` 構成。ページング100件/ページ。ソートUIは組んでおらず、Table標準機能まかせ（HTML文字列セルなので、ヘッダークリックしても意図した並びにはならない可能性が高い＝実質使われていない機能）

### フィルターの挙動
- テキスト入力1つ（`info_filter_div`）のみ。対象列は「概要」列（filterColumnIndex: 1）、`matchType: 'any'`（部分一致）
- ラベルなし・placeholderのみ「概要」→ jpml_pros で直した a11y 対応（visually-hidden label）はまだ未反映

### URLパラメータ対応
- `name`: サーバー側（gvizクエリ）で選手名の完全一致フィルター
- `tag`: フィルター入力欄の初期値として使われる（クライアント側、部分一致）
- この2つの役割の違い（クエリで絞る vs フィルター初期値）は jpml_pros にはない、jpml_titles 固有の設計

## 2. Astro化した場合の構成案

### a. レイアウト共通化で1箇所にまとまるもの
27ページの`<head>`〜`navbar.js`呼び出しまでを比較すると、**index.html以外の26ページはほぼ完全に同一のボイラープレート**を持っている。

- `<meta charset>` / viewport / favicon
- Bootstrap CSS/JS の読み込み、`style.css`
- Cloudflare Web Analyticsのビーコン（`data-cf-beacon`のトークンも全ページ同一値であることを確認済み）
- `navbar.js`（`document.write`でナビバー全体を書き出す方式。Astroなら`<Navbar />`コンポーネント化でき、`document.write`という古い書き方自体も解消できる副産物がある）

ページごとに異なるのは実質 `<title>`、（一部ページのみの）`<meta description>`、ページ固有の`<script>`（google.charts loaderの要不要、対応する`.js`ファイル名）だけ。Astroの`Layout.astro`に`title`・`description`・`headScripts`をprops/slotで渡す形にすれば、この共通部分は1ファイルにまとまり、今後CSP導入時のヘッダー方針変更も1箇所の修正で済むようになる。

index.html（トップページ、iPortfolioテンプレート）は11個のvendor JS等を抱える別物なので、共通レイアウトの対象から外して独立させるのが妥当（無理に共通化すると他26ページ用のLayoutが肥大化する）。

### b. scripts/lib/sheets.py・generate_jpml_pros.py の扱い

**案A: Pythonを残し、中間JSONを吐かせてAstroが読む**
- `sheets.py`の`fetch_sheet()`はそのまま使い、`generate_jpml_titles_data.py`のようなスクリプトで`data/jpml_titles.json`等を出力
- Astro側は`getStaticPaths`ではなく単純に`import`か`fs.readFileSync`でJSONを読み、`.astro`のテンプレートでHTML化
- 利点: 選手データの取得ロジック（gvizクエリ、`_normalize`の数値↔文字列変換など）を書き換えずに再利用できる。`check_image_links.py`等の既存メンテナンススクリプトとも足並みが揃う
- 欠点: ビルドが2段階（Python→JSON→Astro）になり、CIのステップが増える。JSONのスキーマをPython側とAstro側で暗黙的に共有することになり、片方だけ直すと壊れる

**案B: 取得ロジックごとAstro(JS/TS)に書き直す**
- gvizエンドポイントを叩く処理をAstro内の`fetch()`（ビルド時に実行される`.astro`のfrontmatterやAstroのcontent loaderで）で書く
- 利点: 単一言語・単一ビルドで完結。Astroの型チェックやcontent collectionsの恩恵を受けやすい
- 欠点: `sheets.py`にある gvizレスポンスのパース（`setResponse(...)`のJSONP剥がし、floatの整数化など）を丸ごとJSに移植する必要があり、Python版と処理が二重管理になる。`scripts/`配下の他のメンテナンススクリプト（リンク切れ検知等）はPythonのままなので、データ取得ロジックがPython/JSの2箇所に分裂する

→ 1ページだけの試作段階なら**案Aの方が低リスク**（既存の取得・整形ロジックに手を入れずに済み、Astro側の評価に集中できる）。全面移行する場合は案Bで一本化する価値はあるが、それは今回のスコープ外。

### c. ビルド工程

現状は「ビルドなし、`regenerate-page.yml`がpush検知でPythonを実行しHTMLをコミットする」運用。Astroを導入すると新たに**Astroのビルド（`astro build` → `dist/`）**が加わり、ワークフローが二重になる。

1. 対象ソース変更→push
2. `regenerate-page.yml`相当のジョブが Python で中間JSON生成
3. 新設するジョブが `npm run build`（Astro）でdist/を生成
4. dist/の中身（試作ページ分だけ）を本体へコミット、または配信方法自体を変える（下記d参照）

「生成物をコミットする」現行方式をAstro後も続けるなら、`jpml_titles.html`は変わらず**生成された静的ファイルとしてリポジトリに残る**（Astroのソースは`src/`配下に増える）。ここが一番の分岐点で、以下の判断が必要になる。

- 生成物コミット方式を続ける → リポジトリ内に「手書きHTML」と「Astro生成HTML」が混在する移行期間が発生する（27ページ全部を一気に移すわけではないため）
- Cloudflare側でAstroビルド自体を実行する方式に切り替える → コミットは不要になるが、「静的アセットのみ配信」から「Cloudflareにビルドさせる」に配信モデルが変わり、wrangler設定・Pages/Workers Buildsの構成見直しが要る

1ページの試作段階では前者（生成物コミット継続）で十分だが、後述の通り試作の結論次第でこの判断が変わる。

### d. Cloudflare Workersへの配信

現行: `wrangler.jsonc`の`assets.directory`が`"./"`＝リポジトリルート全体を配信し、`.assetsignore`で`scripts/`等を除外する方式。

Astroは`dist/`にアウトプットするため、素直にやるなら以下のようになる。

- `assets.directory`を`"./dist"`に変更し、Astroの出力をそのままCloudflareに配信
- ただし今は**リポジトリ直下のファイルがそのままURLパスになる**設計（`jpml_pros.html`→`/jpml_pros.html`）なので、Astroの`dist/`構成（デフォルトでは各ページが`dist/jpml_titles/index.html`のようなディレクトリ構成になりうる）が既存のURL構造・`sitemap.xml`・`_redirects`・`houou_results.html?name=...`のようなクエリ文字列付きリンクと食い違わないか確認が要る
  - Astroの`build.format: 'file'`設定を使えば`dist/jpml_titles.html`のようにフラットな出力にできるので、既存URL構造は維持できそうだが要検証
- 1ページだけの試作では、**`dist/`を配信対象にする本格切り替えまではやらない**方が安全。試作段階では「Astroでビルドしたファイルを手動または簡易スクリプトで`jpml_titles.html`の位置にコピーする」程度に留め、`wrangler.jsonc`は変更しないのが試作の趣旨（負担の見極め）に合う
- `_headers`/`_redirects`はAstroの`public/`にそのまま置けば`dist/`にコピーされる仕様なので、ここは大きな障害にはならない見込み

**外部ドメインを増やさない方針との整合**: Astro自体はビルドツールなのでランタイムに新しい外部ドメインを追加するものではない（npm依存はビルド時のみ）。ただしAstroの一部インテグレーションはCDN経由のクライアントJSを注入することがあるため、試作では素のAstro（フレームワーク統合なし、`output: 'static'`）に留め、既存のBootstrap/vendorローカル配信方針を崩さないことを明記しておくべき。

## 3. 移行しない場合（Pythonスクリプトをもう1本書く）との比較

| 観点 | Astro試作 | Pythonスクリプト追加のみ |
|---|---|---|
| 得られるもの | レイアウト共通化・型安全・将来27ページ全部を1つの仕組みに揃える土台 | `jpml_pros.html`と全く同じパターンの繰り返しで、学習コストゼロ |
| 新規負担 | Node/npmという新しいツールチェーンがリポジトリに入る。CI（GitHub Actions）にAstroビルドのステップが増え、`regenerate-page.yml`との二重構成を整理する必要がある。`dist/`出力とCloudflareへの配信方法の整合を取る作業が発生 | 既存の`generate_jpml_pros.py`をコピーして`generate_jpml_titles.py`を書くだけ。`sheets.py`・GitHub Actionsのワークフロー・`.assetsignore`など既存の仕組みをそのまま使い回せる |
| 一貫性 | 27ページのうち1ページだけAstro化した状態が続くと、「Astro組」と「素のHTML+Python生成組」が混在し、CLAUDE.mdの構成説明も複雑になる | 既存の「Pythonで生成する静的ページ」というパターンが単純に1つ増えるだけで、リポジトリの説明が変わらない |
| 将来の27ページ全移行 | 今回の共通レイアウト設計がそのまま活きる。ただし全ページ移行は別途大きな作業（特にgoogle.charts依存の20ページはグラフ描画のAstro化まで踏み込むと論点が増える） | 「同じヘッダー・navbar.jsを27回書く」重複は解消されないまま。将来DRY化したくなった時に結局同じ検討が必要になる |
| リスク | Cloudflare配信方法の変更（`assets.directory`）は本番影響があるため、試作段階でどこまで踏み込むか線引きが必要 | 生成される`jpml_titles.html`の見た目は`jpml_pros.html`と同じ配信経路なので、リスクは低い（実績あり） |

## まとめ

「試作」という位置づけなら、Astroを入れる価値は主に2.aのレイアウト共通化とビルド工程の負担感を実測することにある。issue #20の目的（Astro移行の可否判断）に照らすと、`wrangler.jsonc`の変更やCI二重化には深入りせず、**ローカルでAstroビルド→出力を`jpml_titles.html`に置き換えて比較する**という最小構成での試作が、負担とリターンを見極めるのに適切と考える。

次に進める場合、以下を決めてから着手する。

- データ取得: 案A（Python + 中間JSON）/ 案B（Astro/JSに書き直し）
- 配信: 現状維持（手動/スクリプトでコピー）/ `dist/`切替
