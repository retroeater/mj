# 引継ぎメモ

新しい会話でこのプロジェクトを再開するときに、最初に読む文書。
**このファイルを読めば、それまでの経緯を知らなくても作業を再開できる**ことを目的にしている。

最終更新: 2026年9月10日

---

## 0. 新しい会話の始め方

次のように伝えれば、必要な文脈が渡る。

```
ryoei.pro の改善を進めています。
リポジトリは https://github.com/retroeater/mj の cloudflare ブランチです。
docs/handover.md を読んでから、docs/issues-snapshot.md で
現在のタスク状況を確認してください。
今日は #◯◯ に取り組みます。
```

会話が長くなると1回あたりのコストが上がるため、
**大きな作業の区切りごとに新しい会話を始める**とよい。

---

## 1. このプロジェクトは何か

平野良栄（日本プロ麻雀連盟のプロ雀士・理事）の個人サイト `ryoei.pro` の改善。

中心となるコンテンツは**日本プロ麻雀連盟のプロ雀士1,100名超のデータベース**と、
鳳凰戦・女流桜花などの成績記録。事業上の目的は、企業案件（出演・タイアップ・
イベント）の入口として機能させること。

### 経緯

もともとは「GitHub Pages では静的コンテンツしか扱えないので、
別のホスティングへ移行したい」という相談から始まった。
Cloudflare への移行を進める中で改善点を洗い出し、50件以上を実施した。

2026年9月9日にドメイン切替が完了し、**現在は Cloudflare Workers で配信中**。

---

## 2. いまの構成

### 配信

| 項目 | 内容 |
|---|---|
| 本番 | Cloudflare Workers（静的アセット配信）。`cloudflare` ブランチ |
| ドメイン | `ryoei.pro` / `www.ryoei.pro`。DNS・レジストラともCloudflare |
| 旧環境 | GitHub Pages（`gh-pages` ブランチ）。切り戻し用に残している（#84で無効化予定） |
| ビルド | **なし**。静的ファイルをそのまま配信する |
| プラン | **Cloudflare Pro**（2026年9月9日〜）。$25/月 |

`wrangler.jsonc` の `assets.directory` がリポジトリ全体（`./`）を指すため、
公開したくないファイルは `.assetsignore` に列挙している。

`html_handling` は `"none"` を明示している（#89）。
既定の `auto-trailing-slash` だと `/file.html` が `/file` へ
307リダイレクトされ、canonical・og:url・sitemap がすべて
リダイレクト先を指す状態になるため。

**この設定はディレクトリインデックスの解決も無効にする。**
そのため `_redirects` の先頭にある次の1行が必須で、
これを消すとトップページが404になる。

```
/  /index.html  200
```

`_headers` はセキュリティヘッダ5件に加えて、
キャッシュ制御を持つ（#92）。

| 対象 | Cache-Control |
|---|---|
| `/img/*` `/favicon.ico` `/apple-touch-icon.png` | 1年・immutable |
| `/assets/vendor/*` | 30日 |
| HTML・ルート直下の `.css` / `.js` | 既定のまま（毎回再検証） |

ファイル名にハッシュを持たないため、HTMLとルート直下の
スクリプトには意図的にTTLを付けていない。

**`assets/vendor` 配下を更新した場合、ブラウザには最大30日
キャッシュが残る。** Cloudflareのキャッシュパージでは消えない。
即座に反映させたい場合はファイルのパスを変えること。

### ページ構成

HTMLは27ページ。大きく3系統に分かれる。

| 系統 | ページ数 | 状態 |
|---|---|---|
| `index.html` | 1 | Webサイトテンプレート（iPortfolio）由来。`index.css` と11個のvendorライブラリを使う |
| ビルド時生成（型A・15列） | 1 | `jpml_pros.html`。独自の`generate_jpml_pros.py`のまま |
| ビルド時生成（型A・2列/3列） | 9 | `jpml_titles.html` / `jpml_test.html` / `resource_logs.html` / `video_live.html` / `video_wayhome.html` / `video_en.html` / `rh_paifu.html` / `saikyo_mens.html` / `video_mtsuku.html`(3列)。`scripts/lib/page.py` + 共有JS `table.js` を使う（#7） |
| Google Charts依存 | **12** | ブラウザから直接スプレッドシートを読む。#7の対象 |
| 静的なページ | 4 | `404.html` / `jpml_links.html` / `resource_dictionary.html` / `rh_links.html` |

### データの流れ

選手データや成績はすべて**Googleスプレッドシート**にある（5冊）。

- `jpml_pros.html`と型A・2列/3列の9ページ(`jpml_titles` / `jpml_test` /
  `resource_logs` / `video_live` / `video_wayhome` / `video_en` / `rh_paifu` /
  `saikyo_mens` / `video_mtsuku`) … それぞれ`scripts/generate_<ページ名>.py`
  がビルド時に取得してHTMLに焼き込む。`jpml_pros`以外は`scripts/lib/page.py`
  の共通処理を使う（#7）
- 残り12ページ … 訪問者がページを開くたびにブラウザが `docs.google.com` へクエリを投げる

**移行済みページは、スプレッドシートを直しただけでは反映されない。**
`regenerate-page.yml` はスクリプトと対応する`.js`の変更をpushで検知する
作りで、スプレッドシートの変更そのものは検知しない。データだけを
更新したときは、ワークフローを`workflow_dispatch`で手動実行する
（`target_page`にページ名、または`all`）。旧方式（Google Charts）は
「スプレッドシートを直せば即反映」だったので、移行が進むほど手動実行の
機会が増える。定期実行（週次など）を設けるかどうかは#103で別途判断する。
**`gh-pages`ブランチは旧方式のままなので、この制約は受けない。**

### 自動化

`.github/workflows/` に3本ある。

| ワークフロー | 内容 |
|---|---|
| `regenerate-page.yml` | ページの再生成。対象は `scripts/generate_<名前>.py` の有無から自動判別する |
| `check-image-links.yml` | 毎週月曜3時、画像1,985枚のリンク切れを確認しissueに書き出す |
| `check-ron2-images.yml` | 毎週月曜4時、龍龍の画像とサイトの表示が一致するか確認する |

---

## 3. 作業の進め方

### 役割分担

| 場所 | 担当する作業 |
|---|---|
| **Claudeとのチャット** | 設計の相談、調査、原因の切り分け、実装案の作成 |
| **Claude Code**（Codespace内） | ファイルの編集、`gh` コマンドでのissue操作、コミット・push |

Claude Codeは Codespace のターミナルで動いている（`/workspaces/mj` で `claude`）。
`gh` が認証済みのため、issueの開閉やラベル操作がそのまま通る。
ただし **GitHub Projects の操作は権限不足で弾かれる**（ボードへの追加はブラウザで行う）。

### 重要な約束事

**Claudeが作成した下書き（Claude Codeに貼る文面など）には、必ず見出しを付ける。**

```
## 📋 Claude Codeへ貼る文面（Claudeが作成した下書き）
```

これは、後から会話を読み返したときに
**平野さんの発言とClaudeの下書きが区別できなくなる**問題への対策。

### タスク管理

**GitHub Issues + Projects** で管理している。

- ラベルは3系統: `状況:`（対応中/保留/待ち。未着手はラベルなし）、
  `分野:`（SEO/パフォーマンス/自動化/セキュリティ/整理・保守/インフラ/UI-UX）、
  `対象:`（jpml_pros/index/houou_results/全ページ）
- 優先順位は Projects ボード（`ryoei.pro enhancements`）の並びで表す
- 完了分もcloseした状態で残している（判断の経緯を後から追えるように）
- **`docs/issues-snapshot.md` は本文込みのエクスポート。**
  `docs/issues-snapshot.md` は Claude Code の PostToolUse フックで
  `gh issue` 操作のたびに自動再生成される
  (`scripts/build_issues_snapshot.py`)。
  ワークフローではないため、Codespace の外で issue を操作した場合は
  反映されない。念のため正確な状態は `gh issue list` で確認すること

---

## 4. 押さえておくべき方針

### 現行サイトに作り込みすぎない

**新サイトを別途新規構築する方針**が決まっている（`docs/new-site-design.md`）。
現行サイトはいずれ役目を終えるため、大きな投資は避ける。

具体的には、次のような判断をしてきた。

- 構造化データ（#13）は現行サイトでは見送り、新サイトで対応
- SNSシェアボタン（#82）も新サイトの選手個別ページに置く
- Astroへの移行（#20/#21）は新サイト構築時に判断。現行サイトの残作業はPythonで進める

**新サイトの第一弾は index.html（トップページ）とする（#101）。**
他26ページと構造が独立しており、依存が最も少ないため。
Astro の試作対象も jpml_titles.html から index.html に変更した
（#20 をクローズ）。

ボトルネックは #21（Astroへの移行を検討する）の判断。
ここが保留のままだと新サイトの着手ができない。

### 外部ドメインへの依存を増やさない

CSP（#9）の導入を予定しているため。Bootstrapのローカル化やインライン
`onerror` の廃止も、この方針に沿ったもの。

現在の外部依存は次のとおり。

| ドメイン | 用途 |
|---|---|
| `www.gstatic.com` / `docs.google.com` | Google Charts（残り12ページ） |
| `static.cloudflareinsights.com` | Web Analytics のビーコン本体。**送信先は自ドメインの `/cdn-cgi/rum`**（ゾーン配下で登録し直したため）。CSPでは `script-src` にのみ必要 |
| 画像7ドメイン | 選手のプロフィール画像 |

**#7（Charts依存の解消）が終わると2つ減る。** `saikyo_mens.html`の移行(2026-09-11)で
`abs.twimg.com`（Xアカウントなし選手の既定アイコン）への依存はすでに解消済み
（フォールバックを`img/avatar.svg`に差し替えた）。

**生成済みページの `<img src>` に含まれる外部ドメインは、選手のプロフィール
画像7ドメインだけではない。** `jpml_test.html` は `img.youtube.com`（12件）と
`ron2.jp`（22件）、`resource_logs.html` は `pbs.twimg.com`（全2,630件。
Xの画像への直リンクで、再配信ではない）、`video_live.html` は
`img.youtube.com`（2,332件）に加えて `hayabusa.io`（1件。OpenREC配信回の
サムネイルCDN）を使っている。#9でCSPの`img-src`を書くときは、生成済み
HTMLから実際に使われているドメインを機械的に洗い出すこと（すでに
`img.youtube.com` / `ron2.jp` / `pbs.twimg.com` / `hayabusa.io` が
判明している）。

### gh-pages ブランチは触らない

GitHub Pages 用に凍結している。23ページがGoogle Charts方式なので、
**スプレッドシートを更新するだけでデータが反映される**（コミット不要）。

---

## 5. 次にやること

`docs/issues-snapshot.md` に全件あるが、着手可能な主なものは以下。

| # | 内容 | 備考 |
|---|---|---|
| **#7** | 他17ページのGoogle Charts依存を解消 | **最大の残件。** #9 の前提でもある |
| #76 | WAF（Cloudflare Managed Rulesetのみ、まずログモード） | Logモードで24時間運用し誤検知ゼロを確認済み(2026-09-11)。残件はManaged RulesetをBlockへ切り替えるダッシュボード操作のみ |
| #78 | OGP画像を作成 | 画像制作がボトルネック。デジタル庁素材が候補 |
| #8 | 龍龍の所属・出身地等との照合 | #61の仕組みを流用できる |
| #9 | CSP設定 | #7の後にやると強いポリシーが書ける |
| #4 | SentryでJSエラー検知 | 外部サービスの登録が必要 |
| #96 | カレンダーの参照・更新を自動化 | スコープ未定。決めるべき項目が4つある |

### #7 の進め方（検討済み）

対象の21ページ(9ページ完了・残12)は5つの型に分かれる。

| 型 | ページ数 | 内容 | 該当ページ |
|---|---|---|---|
| A. 表とフィルターのみ | 13(**完了9・残4**) | `jpml_pros` と同じ構造。移行しやすい | `jpml_titles`(完了)、`jpml_test`(完了)、`resource_logs`(完了)、`video_live`(完了)、`video_wayhome`(完了)、`video_en`(完了)、`rh_paifu`(完了)、`saikyo_mens`(完了)、`video_mtsuku`(完了)、ランキング3、`saikyo_results` |
| A'. 多列テーブル（表のみ） | 2(**完了0・残2**) | `jpml_pros`と同じ表構成だが6〜8列あり、`.mj-table-2col`/`.mj-table-3col`がそのままでは使えない（#109） | `rh_results`(12行・6列) / `rh_results_detail`(321行・8列) |
| B. 表＋ローソク足 | 3 | `CandlestickChart` が加わる | `houou_results` / `ouka_results` / `wrc_results` |
| C. 縦棒グラフ | 2 | `ColumnChart` | `houou_leagues` / `ouka_leagues` |
| D. 横棒グラフ | 1 | `BarChart` | `resource_efficiency` |

※ ランキング3ページは `league_ranking.js`（772行）を共用している。
　 レーダーチャートの指標もこのファイルの集計ロジックを使う（新サイト）

**#7の期待値の修正（2026-09-11、Lighthouse実測を受けて）**

これまで「Charts依存の解消＝パフォーマンス改善」として進めてきたが、
実測で前提が変わった。

- **「移行済みだから速い」は成り立たない。データ件数に依存する。**
  Lighthouse実測（`docs/lighthouse-baseline.md`、2026-09-11）で判明
- 件数が少ないページは移行でTBT・LCPともに改善する
  （`jpml_test`: mobile perf 92 / TBT 0ms）
- 件数が多いページは移行しても解決しない。むしろ悪化する
  （`jpml_pros`: mobile perf 37 / TBT 1,902ms / LCP 5,642ms /
  DOM 26,886要素 / メインスレッド専有10.4秒）
- 原因はDOM要素数。現行のページ送り（`.mj-pager`）は非表示行を
  `row.hidden = true` で隠すだけでDOMからは削除していないため、
  全行のコストが常にかかる。**Google Chartsの Table chart は
  `page: 'enable'` で本当にページ単位のDOM描画に留めており、
  この点で現行の自前実装より優れている**（#7残りページの行数調査、
  `docs/lighthouse-baseline.md`で確認）
- **ただし #7 の目的はパフォーマンスだけではない。** 外部ドメイン依存の
  解消（#9 の前提）とインラインハンドラの排除は、件数に関わらず達成される。
  #7 は続ける
- 件数の多いページの根本解決は表示件数を絞ること（#24の五十音タブ、
  新サイトで対応）。既存のINP 458msの記録と同根の問題
- **残り17ページの行数調査で `saikyo_results`（2,560行、`?name`指定なしで
  全件描画）が `jpml_pros`（1,099行）を上回る最大の懸念ページと判明した。**
  一方、`houou_leagues` / `houou_results` / `ouka_leagues` / `ouka_results` /
  `wrc_results` はスプレッドシート自体は1,000〜16,000行超と大きいが、
  ローソク足・縦棒グラフへの集計後、または `?name` 必須の個人別絞り込み後は
  数行〜数十行しか描画しないため、実際のDOM規模リスクは低い。詳細は
  `docs/lighthouse-baseline.md` の行数調査表を参照

未移行ページ側の参考値も記録しておく。

- 未移行ページは「Reduce unused JavaScript」の指摘を受けている
  （`video_wayhome` 410ms / `saikyo_results` 570ms）。Google Charts
  ライブラリの未使用分で、#7の移行で自動的に解消する
- 未移行ページはLCPが悪い傾向。`saikyo_results` はdesktopでも2,038ms
  （他ページは500〜950ms台）。`docs.google.com` への往復待ちが原因

**`jpml_titles.html`（型Aの代表）・`jpml_test.html`（2ページ目）・
`resource_logs.html`（3ページ目）・`video_live.html`（4ページ目）の
移行が完了し、型ができた。**
共通部品として `.mj-table` / `.mj-pager` / `.mj-left` / `.mj-plain`
（style.css）ができたので、残り11ページはこれを踏襲して展開する。
ページ送りは各ページの現行仕様（件数・表示条件）をそのまま引き継ぐ方針で、
`jpml_titles` / `resource_logs` は Google Charts版の `pageSize:100`、
`jpml_test` / `video_live` は `pageSize:50` を踏襲した。
`resource_logs.html` はページ内にハードコードされた内部リンク（名前の
セレクトボックス3件、タグリンク16本）を持つ唯一の型Aページで、これらは
`scripts/generate_resource_logs.py` 側の定数として引き継いだ。
`video_live.js` は `jpml_test.js` とテーブルidが違うだけでほぼ同一
（型Aの実装が収束してきた最初の例）。
Python側のライブラリ化・JSの共有ファイル化はまだしていない
（4ページ目〈`video_live`〉を終えた段階でも見送っており、5ページ目
着手前に判断する）。
#6（ワークフローの汎用化）は完了済みなので、次ページを追加する準備は整っている。

**→ 2026-09-11、この判断を実行した。** `scripts/lib/page.py` + `table.js`
に共通化したうえで5〜9ページ目を移行した。詳細は「#7（型Aの静的化）で
用意した共通部品」の節を参照。

**テーブル描画ライブラリの選定（#95）は #7 の前提から外した。**
#7 は現行方式（`jpml_pros.html` と同じ自前実装）で残り12ページを
揃える。AG Grid 等の検討は新サイトのスタック決定（#21）と
併せて行う。

**列ヘッダによるソートは `jpml_pros.html` 専用の機能とする。**
型Aの他ページには既定で載せず、必要と判断したページにだけ個別に
追加する方針にした（基本なし、明示的に指定があったときだけ追加）。
Google Charts版のTable chartは既定でソート可能だったため、これは
意図的な機能削減にあたる。既定の並びがシート順（日付の新しい順）で、
絞り込みと `?name=`（またはページ内の絞り込み欄）で目的の行に到達できる
ため、影響は小さいと判断した。`jpml_titles.html` はこの方針の最初の
適用例で、`jpml_test.html` / `resource_logs.html` / `video_live.html` も
同様にソート機能を持たない。

**`jpml_titles` / `jpml_test` / `resource_logs` / `video_live` の比較で
見えた、共通化前に揃えるべき差分。** 2026-09-11に`scripts/lib/page.py` /
`table.js`へ共通化する際、以下はすべて`TableConfig`の設定項目
（`name_mode` / `filter_param` / 画像サイズ・フォールバックの引数）として
吸収した。詳細は「#7（型Aの静的化）で用意した共通部品」の節を参照。

- `?name=` の意味がページによって違う: `jpml_titles` / `resource_logs`
  では入力欄を持たない完全一致フィルター（旧WHERE句相当）、`jpml_test` /
  `video_live` では絞り込み入力欄の初期値（部分一致）
- `PAGE_SIZE` がページごとに違う（`jpml_titles` / `resource_logs` は100、
  `jpml_test` / `video_live` は50）。いずれも旧Google Charts版の
  `pageSize` をそのまま踏襲した値
- 画像の縦横比とフォールバック先がページごとに違う: `jpml_titles` は
  80×80正方形・`img/avatar.svg`、`jpml_test` / `resource_logs` /
  `video_live` は160×90(16:9)・`img/125_arr_hoso.png`
- `resource_logs` だけ、ページ内にハードコードされた内部リンク
  （名前セレクトボックス3件・タグリンク16本）を持つ。生成スクリプト側の
  定数として引き継いだが、他ページにはない構造なので共通化の対象からは
  いったん外れる可能性がある
- `video_live.js` は `?name=`・`PAGE_SIZE`・ソートなしのいずれも
  `jpml_test.js` と一致しており、実質的にテーブルidの違いしかない
  （手本ページとして次の共通化検討にそのまま使える）

**型Aの2列ページ（画像 + 概要）には `.mj-table-2col` を付ける。**
画像列を168px固定、概要列を残り幅に伸縮させ、概要は折り返す
（style.cssの`.mj-table-2col`）。`.mj-table`本体は変えず修飾クラスとして
追加したため、15列の`jpml_pros`（`table-layout: fixed` / `width: 934px`
のまま）には影響しない。
移行済みの8ページ（`jpml_titles` / `jpml_test` / `video_live` /
`resource_logs` / `video_wayhome` / `video_en` / `rh_paifu` /
`saikyo_mens`）に適用済み。`video_mtsuku`のみ3列のため、新設した
`.mj-table-3col`（画像列168px固定＋残り2列を折り返し）を使う。
**未移行の`saikyo_results`**も2列構成なので、#7で移行するときに
`.mj-table-2col`を付けること。

---

## 6. これまでに分かったこと

同じ調査を繰り返さないための記録。

### パフォーマンス

- **INPは458ms**（良好とされる200msの2倍以上）。ソート操作でのみ発生する
- 内訳は**描画443ms・JSの処理0.0ms**。JavaScriptは問題ない
- 原因は**1,102行すべてを描画し直すこと**。DOM操作の方法を2通り試したが
  （`DocumentFragment` / `replaceChild`）いずれも改善しなかった
- `content-visibility: auto` はスクロール時には効くが、DOM順序が入れ替わる場面では効かない
- **仮想スクロールは採用しない。** DOMにない行は Ctrl+F で見つけられなくなるため
- 根本解決は表示件数を絞ること（#24の五十音タブ）。新サイトで対応する

### 配信まわりの整理（2026年9月10日に完了）

9月9日〜10日で以下を実施し、配信まわりが一区切りついた。

| # | 内容 | 効果 |
|---|---|---|
| #94 | アイコンフォント2種を廃止しSVG化 | 使用は19種類のみだったのにフォント2セットを全ページで配信していた |
| #93 | Google Fonts の廃止 | index.html のみが Open Sans / Poppins / Raleway を読んでいた。外部2ドメインが消えた |
| #99 | Bootstrapのソースマップ参照を削除 | `.map` への404が24時間で28件発生していた |
| #92 | 静的アセットのキャッシュヘッダ | 画像に1年、vendorに30日 |
| #98 | php-email-form の削除 | PHPが動かない環境でPHP用フォーム検証を配信していた |
| #100 | フッターの著作権表示を修正 | テンプレートのプレースホルダが残っていた |

### #7（型Aの静的化）で用意した共通部品

`jpml_titles.html` の移行(#7)で、型A(表とフィルターのみ)の残りページで
使い回せる汎用クラスを style.css に用意した: `.mj-table`(表の見た目)、
`.mj-pager`(ページ送りのUI)、`.mj-left`(列ごとの左寄せ)、`.mj-plain`
(リンクの下線を消す。`resource_logs.html`の移行で追加)。
ページ固有の列幅・列固定・行高(`contain-intrinsic-size`)などはIDセレクタ
側に残している。`.mj-sort`(ソート見出し用のbuttonスタイル)は
`jpml_pros.html`専用の機能のため`#pros_table`側に置き、`.mj-table`側には
汎用化していない。`jpml_test.html` / `resource_logs.html` /
`video_live.html` の移行で2〜4ページ目の適用例ができた。
`video_live.js`は`jpml_test.js`とテーブルidが違うだけでほぼ同一で、
型Aの実装が収束してきた最初の例。

**2026-09-11、上記4ページを`scripts/lib/page.py` + `table.js`に共通化し、
続けて5ページ（`video_wayhome` / `video_en` / `rh_paifu` / `saikyo_mens` /
`video_mtsuku`）を移行した。** 残りページを移行する人向けに仕組みを記録する。

**`scripts/lib/page.py`**（Python側の共通処理）

- `PageMeta`: head用の設定(title/description/og_url/h1/caption)
- `TableConfig`: テーブル・検索欄・ページ送りの設定。主な項目:
  - `table_id` / `headers`(リスト。2列とは限らない。`video_mtsuku`は3列)
  - `extra_table_class`(既定`"mj-table-2col"`。3列ページは`""`にして
    代わりに`.mj-table-3col`を`headers`の列数に応じて明示的に指定する)
  - `page_size`(既定100。`None`にするとページ送りなし。`video_mtsuku`が該当)
  - `name_mode`(`"exact"`で`?name=`をdata-nameの完全一致に使う。
    `jpml_titles`/`resource_logs`/`saikyo_mens`が該当)
  - `filter_param`(絞り込み欄の初期値に使うURLパラメータ。`"name"`か`"tag"`)
  - `filter_label` / `filter_placeholder`
  - `search_boxes_before` / `search_boxes_after`(ページ固有UIの差し込み。
    `resource_logs`の名前セレクトボックス・タグリンクで使用)
  - `extra_script`(ページ固有の小さなJSをheadにもう1本追加する)
- `build_image_cell(alt, url, image_url, css_class, width, height, fallback)`:
  画像セル共通処理。`url`が空なら`<a>`で包まず`<img>`のみを返す
  (`saikyo_mens`のXアカウントなし行で使う分岐)
- `generate(spreadsheet_id, sheet_name, query, output_path, meta, table_config,
  build_row_html)`: 取得〜書き出しまでの`main()`相当
- 各`generate_<ページ名>.py`は「設定(`PageMeta`/`TableConfig`) + 行組み立て
  関数(`build_row_html`)」だけを持てばよい

**`table.js`**（JS側の共通処理。リポジトリ直下に配置）

- `<table>`要素の`data-page-size` / `data-name-mode` / `data-filter-param`
  属性を読んで動く。属性はテーブルに付けるため、table.js自体はページごとの
  設定を一切ハードコードしていない
- `data-page-size`を省略するとページ送りなし(`video_mtsuku`)。`.mj-pager`の
  `<nav>`自体をHTML側で出力しなければ、table.js側は`pagerEl`がnullになり
  何もしない
- 絞り込み対象の列を1列だけに絞りたい場合(`video_mtsuku`の3列目「選手」)は、
  table.js側に新しい属性は不要。`data-info`に検索対象にしたい文字列だけを
  入れれば、他の列の文言は自動的に検索対象から外れる(`resource_logs`が
  非表示の駅名・カテゴリを検索対象に含めているのと逆の応用)
- ページ固有のUIは共通化せず、`window.mjTable.getSearchParam`を最小限の
  フックとして公開している。`resource_logs.js`(26行に縮小)はこれを使って
  名前セレクトボックスの初期値・遷移だけを担当する

**移行時の個別事情**（`docs/lighthouse-baseline.md`の行数調査で判明した内容と合わせて）

- `rh_paifu`: 画像クラス`videos`がstyle.css未定義だったため、
  `img.rectangle`と同じ160×90を追加した。リンクは`videoUrl + '&t=' +
  videoStartTime + 's'`の形式を維持
- `saikyo_mens`: フォールバックを`abs.twimg.com`の既定アイコンから
  `img/avatar.svg`に差し替え、外部ドメイン依存を1つ解消した。Xアカウント
  なし行は`<img>`のみ(`<a>`で包まない)という分岐を維持。`?name=`(完全一致)
  と`?tag=`(絞り込み欄の初期値)を両方持つ、`jpml_titles`と同型の構成
- `video_mtsuku`: 3列(動画/概要/選手)。`.mj-table-2col`ではなく新設した
  `.mj-table-3col`を使う。ページ送りなし。絞り込み対象は3列目(選手)のみで、
  `data-info`には選手名・所属だけを入れ概要列の文言は含めない

### ランキング系3ページ（houou_ranking / ouka_ranking / wrc_ranking）の性質

型Aの残り11ページのうち、この3ページは他と性質が違うため#7での
移行難度が高い。

- 共用している`league_ranking.js`（772行）は表示ロジックではなく
  **集計エンジン**。スプレッドシートから生データを取り、「通算得点」
  「期最高得点」「期連続浮き回数」「節単位浮き率」など9部門の指標を
  ブラウザ側で計算している
- 部門ごとにクエリが異なり、リーグごとに閾値も違う（期連続浮きの
  最小回数は鳳凰6、桜花・JWRC・特昇3 など）
- そのため移行は「行をHTMLにする」作業ではなく、**集計ロジックを
  Pythonへ移植する**作業になる。他の型Aとは性質が違い、分量も大きい
- 上位100件に絞る`DEFAULT_RANK_LIMIT`があるため、出力自体は小さい
- **進め方の案**: 8部門すべてを1つのHTMLに焼き込み、`?division=`を
  ページ内の表示切替パラメータとして扱えば、現在のURL形式を維持できる
- **検証の進め方**: 集計ロジックだけ先にPythonへ移植して結果を書き出し、
  現行ページの表示と突合して一致を確認してから、HTML生成とページ側の
  JSを作る。ロジックの誤りとマークアップの誤りを同時にデバッグしない
  ため

### 画像ドメインの実測結果（#9 の材料）

生成済みページの`<img src>`に出てくる外部ドメインは以下。選手の
プロフィール画像7ドメインだけではない。

| ページ | ドメイン | 件数 |
|---|---|---|
| `jpml_test` | `img.youtube.com` / `ron2.jp` | 12 / 22 |
| `resource_logs` | `pbs.twimg.com` | 2,630 |
| `video_live` | `img.youtube.com` | 2,332 |
| `video_wayhome` | `img.youtube.com` | 38 |
| `video_en` | `img.youtube.com` | 76 |
| `rh_paifu` | `img.youtube.com` | 57 |
| `saikyo_mens` | `pbs.twimg.com` | 90 |
| `video_mtsuku` | `img.youtube.com` | 61 |

`video_live`には`hayabusa.io`が1件だけ混じっていた（スプレッドシートに
手入力されたもので、2026年9月10日に削除済み）。このように少数の例外が
紛れ込むため、#9でCSPの`img-src`を書くときは、生成済みHTMLから実際に
使われているドメインを機械的に洗い出すこと。

### index.html の特殊性（#15）

トップページのみテンプレート（BootstrapMade の iPortfolio）由来で、
他26ページと構造が異なる。

**index.html 専用のライブラリ232KBは、すべて稼働中である。**
「未使用」ではない点に注意。

| ライブラリ | 用途 | サイズ |
|---|---|---|
| glightbox | portfolioの画像ライトボックス | 84K |
| aos | スクロール時のフェードイン | 52K |
| isotope-layout | portfolioの絞り込み | 40K |
| waypoints | スクロール位置の検知 | 28K |
| typed.js | heroのタイピング風アニメーション | 16K |
| purecounter | factsの数字カウントアップ | 12K |

これらを削除するには「その演出をやめる」という設計判断が要る。
トップページの作り直し（#101、新サイトで実施）の際に解消する。

**ライセンス上の制約**: 無料ライセンスのため、フッターの
「Designed by BootstrapMade」は削除できない。
テンプレートから離れれば制約もなくなる。

**トップページの位置づけ（決定済み）**: 個人の実績を見せる場。
選手データベースはポートフォリオを構成する要素の一つ。

### SEO

- Search Console のデータで、**検索結果に出た22URLのうち14件が `?name=` 付き**だった。
  訪問者は特定の選手を探して来ている
- **CTRは約4%**（表示48回・クリック2回）。掲載順位は1〜12位と悪くない
- 原因は `<title>` と考えられ、#5で26ページ分を整備した（効果の測定はこれから）
- 削除済みURL（`jpml_articles.html` 等）へのアクセスは**0件**だった
- Search Console にインデックスされているのは **`.html` 形式のみ**。
  拡張子なしURLは1件も登録されていない（#89の判断根拠）
- `?name=` 付きURLの中身は「上位が突出せず裾野が広い」分布。
  元氏なづは・白銀紗希・野村駿・猿川真寿・如月明日香などが
  1〜3回ずつ。選手個別ページを作る構想（新サイト）の後押しになる

### URLパラメータの棚卸し（#7）

各ページの `?name=` `?tag=` 等が、他ページからのリンクで実際に使われて
いるか調べた結果。#7でページを移行するたびに、そのページのパラメータを
削除してよいか個別に判断する材料にする。**削除はまだしていない。**

**内部リンクがあるもの（残す）**

| リンク先 | パラメータ | 件数 | 発生元 |
|---|---|---|---|
| `jpml_pros.html` | `name` | 1,099 | `jpml_titles` の各行 |
| `houou_leagues.html` | `name` | 716 | `jpml_pros` |
| `houou_results.html` | `name` | 691 | `jpml_pros` |
| `jpml_titles.html` | `name` | 419 | `jpml_pros` |
| `video_live.html` | `name` | 319 | `jpml_pros`（**移行済み**） |
| `ouka_results.html` | `name` | 178 | `jpml_pros` |
| `ouka_leagues.html` | `name` | 178 | `jpml_pros` |
| `saikyo_results.html` | `tag` | 156 | `jpml_pros` |
| `resource_logs.html` | `name` / `tag` | 1 + 16 | ページ内にハードコード |

**内部リンクが見つからないもの**

| ページ | パラメータ |
|---|---|
| `jpml_pros` | `place` / `league` / `ouka` |
| `jpml_titles` | `tag` |
| `jpml_test` | `name` |
| `houou_results` / `ouka_results` | `class` |
| `league_ranking`（ランキング3ページ） | `division` / `name` |
| `saikyo_results` | `name` |
| `saikyo_mens` | `name` / `tag`（**移行済み**） |
| `rh_paifu` | `name`（**移行済み**） |
| `video_en` / `video_mtsuku` / `video_wayhome` | `name`（**移行済み**） |
| `wrc_results` | `name` |

内部リンクがないことは「不要」を意味しない。Search Consoleのデータで
「検索結果に出た22URLのうち14件が`?name=`付き」と分かっているが（SEO節）、
どのページのものかは未確認。消すと検索流入が全件表示に落ちる恐れがある。

削除の判断は、Search Consoleで`?name=`付きURLの内訳を確認してから行う。
それまでは、各ページを#7で移行するタイミングで個別に決める。
`resource_logs`は移行済み・内部リンク（名前セレクトボックス3件・
タグリンク16本）は静的HTMLへそのまま引き継いだ。`video_wayhome` /
`video_en` / `rh_paifu` / `saikyo_mens` / `video_mtsuku`
（2026-09-11移行）はいずれも`?name=`パラメータをそのまま引き継いだ
（`saikyo_mens`は`?tag=`も）。

### 外部サービス

- **ron2.jp（龍龍）は `/wp-json/` が nginx の段階で403。** HTMLページは200で取得できる。
  そのため `check_ron2_images.py` はHTMLを解析している
- X・note の画像を自サイトで再配信することは**規約上グレー**。著作権も選手個人にある。
  ron2.jp の845枚は連盟の資産なので、そこだけなら許諾のハードルが低い（#25は保留）
- **Supabase の無料枠は1週間アクセスがないと自動停止する**ため却下した
- microCMS はメンバー数が有料プランでも3人のため却下した

### Cloudflare

- **AI Crawl Control が管理 robots.txt を自動で前置する。** そのため自作の
  `robots.txt` は `Sitemap:` の宣言のみにしている
- AI学習用クローラー（GPTBot/ClaudeBot等）はブロック、検索エンジンとAIの検索・回答は許可
- Tiered Cache は**効果がない**（Workersの静的アセットにはオリジンサーバーがないため）

### Cloudflare Pro でできること・できないこと

**HTTP Traffic 分析（Analytics → Traffic）**

- パス別の内訳が出る（Freeでは出ない）
- **Query string をフィルタ条件に使える。** ただし値ごとの
  内訳は出ないため、「どの選手名が多いか」は
  Search Console 側で見る
- 他の軸: Cache status / Source browser / Source device type /
  Data center / Source ASN / Edge status code など
- Download data は表示中の上位5系列を15分刻みで出すのみ。
  生ログではない
- Bot score はこの画面にはない。Bot Report は
  Security → Bots の別画面

**オリジンを前提とする機能は効かない**

Workers静的アセットにはオリジンサーバーが存在しないため、
以下はいずれも効果がないか対象がない。#71（Tiered Cache）を
見送ったのと同じ理由。

| 機能 | 判断 |
|---|---|
| Polish | 不採用。自前画像は11枚178KBで、主要3枚はすでにWebP。選手画像1,985枚は外部7ドメインにあり対象外 |
| Mirage | 不採用。同上に加え、`<img>`をエッジで書き換えるため #9 と競合 |
| Argo Smart Routing | 不採用。Proに含まれず別課金（月$5＋$0.10/GB） |
| Load Balancing | 不採用。別課金かつ分散対象がない |

### トラフィックの実測値（2026年9月9日）

**ドメイン切替が同日12時頃のため、以下は約10時間分。
1日分の数字ではない。**

| 出所 | 数値 |
|---|---|
| エッジ / 総リクエスト | 3,030（キャッシュ済み2,430・未キャッシュ602） |
| エッジ / ユニーク訪問者 | 197 |
| Web Analytics / ページビュー | 114 |
| Web Analytics / 訪問 | 75 |

ユニーク197に対し訪問75。差はクローラーとJS非実行分と推測
しているが、内訳は #90 で確認する。

サーバーサイド計測を自前で作る場合（#19で検討・見送り）も、
この規模なら Analytics Engine の Free 枠（1日10万書き込み）に
十分収まる。

### 検討して見送った技術(2026-09-09〜10)

| 項目 | 判断 | 理由 |
|---|---|---|
| PWA化 | 却下 | オフライン利用の場面がない |
| iOSアプリ / Androidアプリ化 | 却下 | Webサイトを包んだだけのアプリは審査で弾かれる。年$99の登録と審査対応が恒久的に発生する |
| minify / mangling | 却下 | 自前JS・CSSは小さく、Brotliが効けば削減幅はさらに縮む。ビルド工程を持たない構成を崩す対価に見合わない |
| Tree shaking | 却下 | バンドラを前提とする最適化のため、現行構成では適用できない |
| stale-if-error | 却下 | オリジンサーバーが存在せず、守る対象がない |
| CodeRabbit | 却下 | PR運用が前提だが、現在は cloudflare ブランチへ直接pushしている |
| GitHub Copilot | 却下 | Claude Code と役割が重複する |
| X API | 却下 | 無料枠が実質廃止され有料プランは月$100から。APIを必要とする機能がない |
| Super Bot Fight Mode | 却下 | Proで遮断できるのは Definitely automated のみ。実測で最大の塊は Likely automated（41%）で手が出ない（#91） |
| Polish / Mirage / Argo Smart Routing | 却下 | Workers静的アセットにはオリジンが存在しないため効果がない（#71と同じ理由） |

### 検討して見送った技術(2026-09-11)

| 項目 | 判断 | 理由 |
|---|---|---|
| JWTのHttpOnly Cookie | 対象外 | 認証機能もログインもユーザーデータもない静的サイト。将来SDPに管理画面を作る場合もCloudflare Accessのほうが適切 |
| IWA（Isolated Web Apps） | 却下 | 署名済みバンドルの配布が前提のエンタープライズ向け技術。PWA化を却下した理由がそのまま当てはまる |
| workbox.precaching | 却下 | PWA却下済み、かつビルド工程を持たない構成 |
| `<link rel="prerender">` | 却下 | Chrome独自で非推奨。Speculation Rules APIに置き換わっている（要否は#105で判断） |
| CSS @function / if() | 却下 | if()はChrome 137以降のみでFirefox・Safari未実装。@functionも同様。Baselineに遠い |
| @supports at-rule() | 却下 | 上2つを安全に使うための道具。使わないなら不要 |
| CSS text-fit | 却下 | 提案段階で実装がない |
| `<meta name="text-scale">` | 却下 | Chrome 146以降のみでFirefox・Safari未対応。使う場合は最大300%超の拡大に耐えるかのテストが必要で、対価に見合わない |
| スクロールバーを考慮したビューポート単位 | 見送り | .mj-table-2col を width: 100% にしたため当面出番がない |
| Reduce unused CSS（Bootstrap CSSの削減） | 見送り | Lighthouseの改善提案1位（mobile合計約1,090ms）だが、ビルド工程を持たない構成を崩す対価に見合わない。minifyを却下したのと同じ理由。Bootstrapをやめるかどうかは新サイト（#101）で判断する |
| Initial server response time の改善 | 対処不可 | 全6ページで指摘（最大 resource_logs 400ms）。Cloudflare Workers の静的アセット配信そのものの応答時間で、ページ側の対処手段がない |

**すでに対応済みだったもの**

- HTML5 doctype: 27ページ全部に入っている
- OWASP推奨対策: 静的サイトで該当するヘッダ系は `_headers` に導入済み（X-Frame-Options / X-Content-Type-Options / Referrer-Policy / Permissions-Policy / HSTS）。残るのはCSPのみで、それが #9
- 入力値の検証とサニタイズ: `<form>` は27ページに0個。入力経路はURLパラメータのみで、移行済みページは生成時に esc() を通し、絞り込みは textContent 比較のためXSSの経路がない。innerHTML は index.js に1箇所（アイコン切替の定数）だけ

---

## 7. 関連文書

| ファイル | 内容 |
|---|---|
| `CLAUDE.md` | Claude Code がセッション開始時に読む。プロジェクトの前提 |
| `docs/new-site-design.md` | **新サイトの設計方針。**中断中で、再開手順まで書いてある |
| `docs/astro-migration-study.md` | Astro移行の技術調査（Claude Codeによる） |
| `docs/issues-snapshot.md` | issue一覧のエクスポート（本文込み） |
