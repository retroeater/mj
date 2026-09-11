# GitHub Issues スナップショット（全件）

生成日時: 2026-09-12 03:55 JST

このファイルは会話でissueの内容を共有するためのスナップショットです。
本文・コメントを含みます（他のClaudeチャットに経緯まで正しく
理解してもらうため）。Closed分も含む全件です。

【参照ルール】セッション開始時はこのファイルではなく issues-open.md を
読んでください。このファイルは、セッション中に指示が正しく実施されたかを
確認するときに参照します（完了するとOpen側から消えるため）。

最新化が必要になったら `/issues` コマンドを実行するか、以下のコマンドで
issues-open.md と同時に再生成してください。

```
gh issue list --repo retroeater/mj --state all --limit 200 \
  --json number,title,state,stateReason,labels,body,comments,createdAt,closedAt
```

件数: 156件（open/closed含む）。番号降順。

---

## #156 次回データ更新後、エッジキャッシュのETagを比較して置き換わりを確認する

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 状況: 待ち, 分野: パフォーマンス, 対象: 全ページ

### 本文

### 何を確認するのか

デプロイ（GitHub Actionsによる `*_leagues_data.json` の再生成・push）が、
Cloudflareのエッジキャッシュのエントリを実際に置き換えるかどうかを確認する。

### 手順とベースライン

手順・実測ベースライン（2026-09-12時点のETag/cf-cache-status）は
#154 のコメントに記録済み。そちらを参照して同じ手順で再実行する。

### 実施タイミング

- 鳳凰戦のデータ更新は1月、女流桜花は9〜11月の予定
- 女流桜花のほうが直近に更新が来る見込みのため、
  `ouka_leagues_data.json` の再生成・デプロイが走ったら、その直後に実施する
- 鳳凰戦側でも同様に確認できるが、どちらか一方で判定がつけば足りる
  （両方待つ必要はない）

判定基準と、その場で対処せず結果を報告するだけでよいという扱いも
#154 のコメントに記録済み。

---

## #155 wrangler dev起動コマンド(--persist-to)の無限リロード対策を検証した結果を記録する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: インフラ

### 本文

## 経緯

コミット `8b4c078` で、`.assetsignore` への `.wrangler` 追加と、CLAUDE.md への `wrangler dev` 起動コマンド（`--persist-to` 付き）の記載を行った。設定を入れただけで実際には直っていなかった、という状態を避けるため、CLAUDE.md に書いた手順どおりに `wrangler dev` を起動し、無限リロード（#153 参照）が再発しないかを検証した。

## やったこと

1. 検証前に、リポジトリ直下に残っていた `.wrangler/` を一旦削除
2. CLAUDE.md に記載されたコマンドをそのまま実行（改変なし）
   ```
   npx wrangler dev --port 8789 --ip 127.0.0.1 --persist-to /tmp/wrangler-state
   ```
3. 起動後、ログの `⎔ Reloading local server...` の出現回数を5秒間隔で継続的にポーリングし、少なくとも合計2分程度（起動直後の様子見30秒＋その後1分半の追加監視）観察した
4. `curl` でルートページと `jpml_pros.html`（サイズの大きいページ）を取得
5. リポジトリ直下の `.wrangler/` と `--persist-to` 指定先（`/tmp/wrangler-state`）の中身をそれぞれ確認
6. 確認後、`wrangler dev` プロセスを停止

## 結果

### 1. 無限リロードの再発有無

- 起動直後（0〜38秒）に `⎔ Reloading local server...` が計14回発生（1回目は通常の起動時リロード、残りは `.wrangler/tmp` ・ `.wrangler/cache` 配下への新規ファイル作成による一過性のもの）
- 38秒経過時点（reload_count=14）から、5秒間隔のポーリングで**90秒以上**追加監視したが、リロース回数は一切増加せず14のまま完全に停止
- 元の症状（#153、数百ms間隔で無限に続く）とは明確に異なるパターンで、初回起動時のファイル作成が一段落した後は安定した

### 2. curl での取得確認

| 対象 | 結果 |
|---|---|
| ルート `/` | `HTTP 200` |
| `/jpml_pros.html`（1,244,503 bytes） | `HTTP 200`、タイムアウト・接続拒否なし |

### 3. `.wrangler/` の生成有無・`--persist-to` 先への書き込み

- `/tmp/wrangler-state`（`--persist-to` 指定先）: state配下（cache/d1/kv/observability/r2、計15ファイル）が正しく書き込まれていた
- リポジトリ直下の `.wrangler/`: 事前削除したにもかかわらず、起動後に**再生成された**（`cache/cf.json` 1件、`tmp/dev-*` `tmp/bundle-*` 計5件。90秒以上の追加監視でもファイル数の増加なし）

`--persist-to` は「state」（KV/D1/R2/observability の sqlite など、元の無限リロードの原因だった継続的に書き換わり続けるファイル）のみをリポジトリ外に退避するオプションであり、`tmp`（dev セッションごとのバンドル出力）と `cache`（`cf.json`）はその対象外で、常に対象ディレクトリ直下の `.wrangler/` に書かれる仕様と見られる。

## 結論

- CLAUDE.md に記載した `--persist-to` 付き起動コマンドで、無限リロード（#153 の症状）の再発は確認されなかった。実運用上の対策としては機能している
- ただし `.wrangler/` はリポジトリ直下に一部（`tmp`・`cache`、起動時のみ生成されそれ以降増加しない）残る。「作業ディレクトリに `.wrangler/` が一切生成されない」という完全な意味では成立していない
  - `.assetsignore` に `.wrangler` を追加済み（コミット `8b4c078`）のため、公開への影響はない
  - CLAUDE.md の記述を「stateのみ退避される」等に補足するかは、対応不要（許容範囲）とみて保留にするか、対応方針を別途判断する必要がある

---
この下書きはClaude Codeが作成しました（2026-09-11）。

### コメント (1件)

**retroeater** (2026-09-11):

CLAUDE.mdに補足を追記したため対応完了。

`--persist-to`で退避されるのはstate（KV/D1/R2/observability）のみで、`.wrangler/tmp`・`.wrangler/cache`は起動時にリポジトリ直下へ作られるが正常であり無限リロードの原因ではない旨を1行追記した（コミット `e19abe2`）。

---
この下書きはClaude Codeが作成しました（2026-09-12）。

---

## #154 _headers に *_leagues_data.json のキャッシュ指定がない

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: パフォーマンス, 対象: 全ページ

### 本文

### 現象

#127 で追加した `houou_leagues_data.json`（104KB）と
`ouka_leagues_data.json`（12KB）に、`_headers` のキャッシュ指定がない。
`/*` のセキュリティヘッダのみが当たり、Cache-Control は付いていない。

`leagues.js` は `?name=` が指定されたときだけこのJSONを fetch する。
選手を切り替えるたびにページ遷移が起きるため、キャッシュが効かないと
そのたびに再取得することになる。

### 検討事項

**ファイル名にハッシュが入っていないため `immutable` は使えない。**
スプレッドシートの更新で GitHub Actions が再生成すると、同じURLのまま
中身が変わる。`/img/*` と同じ1年 immutable は不可。

候補:
- 短めの `max-age` + `stale-while-revalidate`
- `max-age` を短くして ETag による再検証に任せる
- `/assets/vendor/*` と同じ30日にしたうえで、更新時にURLを変える仕組みを足す

どの頻度で鳳凰/桜花シートが更新されるか（期の途中で毎節更新されるのか、
期末にまとめてか）で適切な値が変わる。**平野さんに確認してから決める。**

### 関連

- `_headers` の現状は `/img/*`・`favicon`・`apple-touch-icon` が1年 immutable、
  `/assets/vendor/*` が30日、`/*` がセキュリティヘッダのみ
- #123（HTMLのエッジキャッシュ検討）と方針を揃えられるか確認する

### コメント (3件)

**retroeater** (2026-09-11):

## 決定・実装（2026-09-12）

平野さんの確認結果（鳳凰戦: 半年に2回、女流桜花: 年2回の更新）を踏まえ、
`_headers` に以下を追加した。

```
/houou_leagues_data.json
  Cache-Control: public, max-age=86400

/ouka_leagues_data.json
  Cache-Control: public, max-age=86400
```

### 値の決定経緯

当初 `max-age=604800`（7日）を提案したが、平野さんから「結果発表を見に
来る→まだ更新されていない→後日更新される→再訪問時にキャッシュが残って
いて見えない」というケースを避けたいとの指摘があり、**1日
（max-age=86400）に変更した**。選手を切り替えるたびの再取得を防ぐという
当初の目的は同一訪問中のセッションで足りるため、1日でも解決できる。
連続したアクセス（同日中の再訪問）のみキャッシュを効かせ、日をまたいだ
再訪問では必ず再検証させる方針。

### 補足: ETagによる自動再検証

`wrangler dev`で確認したところ、Cloudflare Workersの静的アセットは
何もせずともETagを自動付与している。そのため`max-age`切れ後も304での
条件付き再検証が効き、内容が変わっていなければ104KB/12KBの本体は
再ダウンロードされない。

### 更新後、最長でどれだけ古いデータが表示されうるか

**最長1日。** GitHub Actions再生成の直前にキャッシュされた場合、
最大1日は古いデータが表示され続ける（1日経過後は自動でETag再検証が
走り、変更があれば新しいデータに切り替わる）。

### 確認

`wrangler dev`で両JSONへの`Cache-Control: public, max-age=86400`適用、
`/*`のセキュリティヘッダが従来どおり当たっていること、
`/assets/vendor/*`（30日）が影響を受けていないことを確認した。

コミット: 7005ea0

**retroeater** (2026-09-11):

## エッジキャッシュの実測ベースライン記録（2026-09-12）

`_headers` の `max-age=86400` はブラウザ側の値で、Cloudflareのエッジ
キャッシュとは別軸で効く。デプロイ（=GitHub Actionsによる再生成・push）が
エッジのキャッシュエントリを無効化するかどうかは未確認だったため、
まずは現時点のETag/cf-cache-statusを記録する。

```
$ curl -sI https://ryoei.pro/houou_leagues_data.json
date: Fri, 11 Sep 2026 18:17:12 GMT
cf-cache-status: HIT
cache-control: public, max-age=86400
etag: "0e3790548971b2728b8d050002a314bf"

$ curl -sI https://ryoei.pro/ouka_leagues_data.json
date: Fri, 11 Sep 2026 18:17:13 GMT
cf-cache-status: MISS
cache-control: public, max-age=86400
etag: "6d98fd5a23a9072a8e7979f8d90d05bf"
```

### 次回確認手順（次回のデータ更新後に実施）

鳳凰・女流桜花のどちらかでスプレッドシートが更新され、GitHub Actionsに
よる再生成・デプロイが走った後、同じ `curl -sI` を再実行してETagを比較する。

- **デプロイ直後にETagが変わっていれば** → デプロイがエッジキャッシュを
  置き換えている。陳腐化は`_headers`の1日（ブラウザ側）のみで、追加対応は
  不要。
- **ETagが古いまま最大1日残るようであれば** → エッジ側のTTLが独立して
  効いている。この場合、max-ageを下げるか、デプロイ時にキャッシュ
  パージ（Cloudflare API経由）を入れるかを検討する必要がある。その場では
  対処せず、あらためて報告する。

### 注意

鳳凰戦は半年に2回、女流桜花は年2回の更新頻度のため、次回更新まで
このissueは待ち状態。次回の`houou_leagues_data.json`または
`ouka_leagues_data.json`の再生成コミット（`chore: regenerate
houou_leagues.html via GitHub Actions`等）を見かけたら、このissueに
戻って上記手順を実施すること。

**retroeater** (2026-09-11):

追跡用issue #156 を起票した。次回データ更新後の確認はそちらで実施する。

---

## #153 名前列CSS統合(pros_table)後の固定表示・フィルタ/ソート動作を3画面幅で検証する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: UI/UX, 対象: jpml_pros

### 本文

## 経緯

`style.css` の `#pros_table` で、1列目（名前）に対する以下3つの指定が離れた場所に分かれていた。

- 幅・padding
- 横スクロール時の固定表示（`position: sticky; left: 0;`）
- 重なり順（`z-index`）

列順を変えるたびに複数箇所を直す必要があったため、`:nth-child(1)` の1ブロックに統合した（コミット `be4e0f5`）。

## やったこと

Playwright（Chromium・headless）で `jpml_pros.html` をローカル配信し、375px / 768px / 1280px の3幅で以下を実測した。

- 固定列（`th:nth-child(1)` / `td:nth-child(1)`）の `position` / `left` / `background-color` / `z-index`
- 実際に `scrollLeft` を動かした上での `left` の不変性、2列目セルとの重なり
- `--content-offset` カスタムプロパティの値（ナビバー・検索ボックスの高さ追従）
- 名前フィルタ・列ソートの動作（1280px、全1100行）

## 結果

### 固定列の数値検証（3幅とも同一）

| 項目 | th:nth-child(1) | td:nth-child(1) |
|---|---|---|
| position | sticky | sticky |
| left | 0px（不変） | 0px（不変） |
| background-color | rgb(250,250,250)（不透明） | rgb(255,255,255)（不透明） |
| z-index | 4 | 2 |

- `scrollLeft` を実際に動かしても `left` は3幅とも常に0pxのまま
- 通常の見出しセル（2列目th）は `z-index: 3` で、コメント通りの重なり順（4 > 3 > 2）を実測で確認
- スクロール後、2列目セルが1列目の下に潜り込む（`td2Left` が負値/1列目幅未満になる）ことを確認し、交差セルの重なりも意図通りと確認

### `--content-offset` の追従

- 375px/768px: `94.765625px`（検索ボックス折りたたみ状態を反映）
- 1280px: `80px`（デスクトップのナビバー高さのみ）

幅によって値が変わっており、CSS統合後もResizeObserverによる追従は正常。

### フィルタ・ソート動作確認（1280px、全1100行）

- 名前フィルタに「蒼井」入力 → 1件のみ表示（「蒼井ゆりか」）、`#result_count` も「1件を表示しています」と正しく更新
- 名前列ソートボタンをクリック → `aria-sort="ascending"`、あ行順で変化なし（元々あいうえお順のため妥当）
- 再クリック → `aria-sort="descending"`、わ行が先頭に来る降順表示に反転

## 結論

統合前の仕様（見た目・スクロール挙動を一切変えない）通りであることを確認した。回帰なし。

---
この下書きはClaude Codeが作成しました（2026-09-11）。

### コメント (2件)

**retroeater** (2026-09-11):

検証完了。3画面幅とも想定通りの結果で、回帰なし。

**retroeater** (2026-09-11):

## 追加確認: コミットa849755（列入れ替え）とデプロイ反映

本issueの検証はコミット時点でCSS統合（当時be4e0f5、以後の作業で列入れ替え本体と合わせてa849755としてpush済み）を対象にしていたが、別セッションでの実施と並行して、a849755時点のjpml_pros.htmlを対象に独立してPlaywright(Chromium)・wrangler dev上で再検証した。結果は一致（回帰なし）。加えて本issueには含まれていなかったデプロイ反映側も確認した。

### 環境メモ: wrangler devの無限リロードへの対処

このCodespace環境でwrangler dev（4.131.1）を素のオプションで起動すると、
「Wrangler detected this dev session is running in an AI agent」のログ後、
`⎔ Reloading local server...` が数百ms間隔で無限に続き、リクエストが
一切通らない(`curl`がタイムアウトまたは接続拒否)状態になった。

原因は `.wrangler/state/v3/observability/miniflare-wobs-trace-store/` の
sqlite(WAL)への書き込みを、`assets.directory`(`./` = リポジトリ全体)を
見ている資産監視が「アセット変更」と誤検知し、リロード→トレース書き込み
→リロード…と自己増殖するため（`.wrangler` は `.assetsignore` の対象外）。

`--persist-to` で状態の保存先をリポジトリ外に逃がすことで解消した。

```
npx wrangler dev --port 8789 --ip 127.0.0.1 \
  --persist-to /tmp/.../wrangler-state
```

再現性が高そうなので別issueとして起票する。

### 1. 実描画確認（375px / 768px / 1280px、Playwright/Chromium・wrangler dev）

3幅とも下記いずれも合格。

| 項目 | 結果 |
|---|---|
| 横スクロール後もtd:nth-child(1)のleftが不変 | 3幅とも0px→0px（不変） |
| 同セルのbackground-colorが不透明 | rgb(255,255,255)（alpha=1） |
| thead th:nth-child(1)の重なりが最前面 | z-index 4 > 通常th 3 > 固定td 2 > 通常td 0（elementFromPointでもth自身がヒット） |
| 検索ボックス開閉で--content-offsetが実測に追従 | 375/768px: 94.765625px→278.765625px(94.765625+184)、1280px: 80px→264px(80+184) |
| ハンバーガー開閉で--navbar-heightが更新 | 375px: 94.77→614.77→106.19px、768px: 94.77→608.58→94.77px（1280pxはデスクトップ表示のためハンバーガー非表示、対象外） |

機能面（1280px基準、全ページ共通ロジックのため3幅で同一結果）:

- 名前欄に「青木」→ 2件（藍いちな表記ゆれ含まず、青木いちな/青木惇のみ）、`#result_count`が「2件を表示しています」に更新
- 名前「田」+所属/出身地「東京」同時入力 → 90件、全件がAND条件（名前に「田」・所属欄に「東京」）を満たす
- `?name=青木&place=東京`で開く → 両欄に値が入り、表示2件に絞り込まれた状態で開く
- 「名前」ヘッダークリック → 元々あいうえお順のため見た目上昇順は変化なし、`aria-sort`は`ascending`に。再クリックで「わ」行が先頭に来る降順に反転、`aria-sort`は`descending`
- 「所属/出身地」ヘッダークリック → 所属列が五十音順に整列（名前列は非整列のまま = 名前列で並んでいないことを確認）
- 龍龍/X/note/YouTube列ヘッダーにはボタン自体が存在せず（`NO_SORT_COLUMNS`によりJS側もクリックを無視）、クリックしてもソートされない
- コンソールエラーは`cloudflareinsights.com`向けビーコンのCORSエラーのみ（本番ゾーン限定のRUM機能がローカルで動かないための既知のローカル限定事象、過去issueと同様）。ページのロジックに起因するエラー・警告は0件

### 2. デプロイ反映の確認

- デプロイ経路: **Cloudflare Workers Builds（Git連携によるpush時自動デプロイ）**。`.github/workflows/`配下にwrangler deployを実行するジョブは無く、GitHub上のcheck-runsに`Cloudflare Workers and Pages`アプリ（GitHub App）による`Workers Builds: mj`が記録されている。
  ```
  gh api repos/retroeater/mj/commits/a849755/check-runs
  → "Workers Builds: mj", conclusion: success,
     started_at/completed_at: 2026-09-11T15:37:18Z
     詳細: https://dash.cloudflare.com/53052826dbd2f8e079ed9a34563c1725/workers/services/view/mj/production/builds/f52737f9-bf5b-4543-b951-3ae365216c21
  ```
  pushからビルド開始までのタイムラグはほぼ無し（同一分内）。
- 反映確認: `curl -sI https://ryoei.pro/jpml_pros.html` → `200`。取得した本番HTML(1,244,503バイト)とローカルのコミット済み`jpml_pros.html`(同バイト数)を`diff`した結果、**差分0件（完全一致）**。`<thead>`最初の`<th>`が「名前」、`#searchBoxes`最初の入力欄が`name_filter`であることも確認済み。
- 結論: **a849755は本番に完全反映済み。追加の手動デプロイ操作は不要。**
- ダッシュボードでのみ確認できる事項（未操作）: Cloudflareダッシュボード → Workers & Pages → `mj` → **Deployments**タブで、各デプロイのトリガー種別（Git commit / Wrangler CLI）とタイムスタンプの一覧を確認できる。今回はcheck-runsのURLから該当ビルド詳細に直接遷移可能。

スクリーンショット（3幅・横スクロール後の状態）は手元に保存済み（本コメントには添付していない）。

---
本コメントはClaude Codeが作成しました（2026-09-11）。

---

## #152 牌効率ページの見出しのフォントサイズが大きすぎる

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: UI/UX, 対象: resource_efficiency

### 本文

### 状況

`resource_efficiency.html` の見出し

> どの牌を残すとメンツができやすいか | Efficiency to create a new group from an existing group and/or an isolated tile

は `<h1>` にクラス指定がなく、Bootstrap既定の見出しサイズ（かなり大きい）
のまま表示されている。下の「計算方法」等の本文（`.mj-margin-text`、
Bootstrap既定の16px）と比べて不釣り合いに大きい。

### やること

見出しのフォントサイズを本文と同じサイズに揃える。

### 対象ファイル

- `resource_efficiency.html`
- `style.css`（見出し用のスタイルを追加する場合）

### コメント (1件)

**retroeater** (2026-09-11):

## ⚠️ このissueのコミットに #127（型C）のCSSが混入しています

**revert する場合は `houou_leagues.html` / `ouka_leagues.html` が壊れます。**

### 何が起きているか

コミット [`4738d8d`](``https://github.com/retroeater/mj/commit/4738d8dc28eeb7d9251cf2dba2ef394b93868c1e)（「牌効率ページの見出しフォントサイズを本文と揃える(#152)」）の`` `style.css` は **+49行**ですが、その内訳は次のとおりです。

| 範囲 | 内容 | 本来の帰属 |
|---|---|---|
| 6行 | `.mj-page-heading` | **#152**（このissue） |
| 約43行 | `.mj-league-chart-desktop` / `.mj-league-chart-mobile` + `@media (max-width: 480px)` の切替、`.mj-chart-legend` / `-item` / `-swatch` | **#127**（型C） |

#127 に取り組んだセッションの作業が、このissueのコミットに紛れ込んだものです。

### なぜ消せないか

#127 の実装コミット [`03cb23b`](https://github.com/retroeater/mj/commit/03cb23b0224db3ad87e2b47960704851fd097f8b) は **`style.css` を1行も変更していません**。5クラスすべてが実際に使われており（`houou_leagues.html` / `ouka_leagues.html` / `scripts/generate_houou_leagues.py` / `scripts/generate_ouka_leagues.py` / `scripts/lib/chart.py`）、型Cの2ページはこのコミットのCSSに依存して動いています。

つまり **#152 のコミットが #127 の前提になっている**という、履歴上は逆立ちした依存関係になっています。

### 調査の範囲

`4738d8d` の他4ファイルは混入なしを確認済みです。

- `resource_efficiency.html` / `scripts/generate_resource_efficiency.py` … `.mj-page-heading` の付与のみ（純粋に #152）
- `docs/issues-open.md` / `docs/issues-snapshot.md` … フックによる自動再生成。増分は #153 と #152 の本文のみで、`127` / `leagues` / `型C` の文字列は差分に1件もなし

`git log --all -S` で `mj-league-chart` / `mj-chart-legend` を追跡した結果、`style.css` へこれらを持ち込んだコミットは `4738d8d` だけで、他コミットへの飛び火はありません。

### 対応方針

すでに両方 push 済みのため、CSSを #127 側へ付け替えるには履歴の書き換えが必要で、労力に見合いません。**このコメントを残すことで対応済み**とし、`style.css` はそのままにします。

---
_Generated by [Claude Code](https://claude.ai/code)_

---

## #151 牌効率のモバイル用グラフの文字サイズを本文に合わせる

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: UI/UX, 対象: resource_efficiency

### 本文

### 状況

#149 でデスクトップ用SVGの文字サイズを本文（計算方法の段落、
Bootstrap既定16px）に合わせたが、モバイル用SVGは
`font-size="9"` のまま据え置いた。#149 の本文に確認事項として
残していた分を、こちらに切り出す。

現状のモバイル用SVGの設計値（`scripts/generate_resource_efficiency.py`）:

```python
design_width=420, design_height=428,
chart_left=60, chart_top=8, chart_right=30,
font_size=9,
```

`width="100%"` で伸縮するため、実際の文字の大きさは画面幅で変わる。

| 画面幅 | SVGの文字の実寸 | 本文 |
|---|---|---|
| 360px | 7.7px | 16px |
| 390px | 8.4px | 16px |
| 430px | 9.2px | 16px |

本文の半分程度の大きさで、デスクトップとの差も大きい。

### 単純に font_size だけ上げてはいけない理由

行の高さが `design_height` から逆算されているため、文字だけ大きくすると
隣の行と重なる。現状の計算:

- `plot_height` = 428 − 8 = 420
- 1行あたりの縦幅（slot） = 420 ÷ 30行 = **14.0px**
- 棒の太さ = 14.0 × 0.7 = 9.8px

390px幅で実寸16pxにするには `font_size` を約17.2まで上げる必要があるが、
slotが14.0しかないので確実に重なる。`scripts/lib/chart.py` の
モジュールdocstringに、#128 実装時に同じ失敗（CSSで font-size だけ
引き上げて文字が行をはみ出した）を記録してある。

### やること（案）

デスクトップ用（#149）と同じ考え方で、**SVGを等倍以上に拡大させない**
うえで、行間を文字サイズから設計し直す。

1. `style.css` に上限幅を追加し、1ユーザー単位 = 1CSSピクセルに固定する

   ```css
   .mj-bar-chart-mobile {
       max-width: 360px;
   }
   ```

2. `generate_resource_efficiency.py` のモバイル用の設計値を組み直す

   | 項目 | 現状 | 案 | 根拠 |
   |---|---|---|---|
   | `design_width` | 420 | 360 | 想定する最小のモバイル幅。ここを上限にして等倍固定する |
   | `design_height` | 428 | 728 | `chart_top` 8 + slot 24 × 30行 |
   | `chart_left` | 60 | 60 | 16pxで「3456」4文字は約32px。x=52 から右寄せなので足りる |
   | `chart_right` | 30 | 36 | 値ラベル「174」3桁が約24px + 棒との隙間4px。30だと収まらない |
   | `font_size` | 9 | 16 | 本文と同じ |

   これで slot = 720 ÷ 30 = 24px、棒の太さ = 16.8px となり、
   文字16pxが行の高さに収まる。

3. `chart.py` のdocstringに、モバイル用も等倍固定方式に変えた旨を追記する

### 確認事項（着手前に判断が必要）

- **グラフの縦の長さが約1.7倍になる**（428 → 728ユーザー単位）。
  文字を本文サイズに合わせる以上、30行ぶんの行間を確保せざるを得ない。
  スマホでのスクロール量が増えるのを許容するかどうか。
- 許容できない場合の代替案:
  - (a) 本文サイズより一段小さい妥協値（例: 13px、slot 20 → `design_height` 608）にする
  - (b) モバイルは現状のまま据え置き、このissueをcloseする
- `@media (max-width: 480px)` の切り替え幅は現状のままでよいか
  （`design_width` を360にしても、480px以下でモバイル用が表示される点は変わらない）

### 対象ファイル

- `style.css`
- `scripts/generate_resource_efficiency.py`
- `scripts/lib/chart.py`（docstringのみ）
- （自動再生成）`resource_efficiency.html`

### 関連

- #149（デスクトップ用。対応済み）
- #128（デスクトップ用・モバイル用の2枚構成にした経緯）

### コメント (1件)

**retroeater** (2026-09-11):

実装しました(4138ec2)。

確認事項について、「スマホでのスクロール量が増えるのを許容する」方針
（本文の代替案(a)(b)は採用しない）で対応。font_size=16、
design_height 428→728（縦に約1.7倍）、design_width 420→360、
chart_right 30→36 に変更し、style.cssに`.mj-bar-chart-mobile`の
`max-width: 360px`を追加。`@media (max-width: 480px)`の切り替え幅は
変更なし。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

---

## #150 Mつくの概要列幅(暫定40%)の妥当性を検討する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 状況: 保留, 分野: UI/UX, 対象: video_mtsuku

### 本文

#148 で `#mtsuku_table` の概要列に `width: 40%` を暫定で入れた(e5cc420)。

## 経緯

#148 の下書き時点で「概要列の幅は暫定で40%。% と px のどちらがよいか、
値をいくつにするか」という確認事項が残っていたが、他の5件と合わせて
先に着手する方針だったため、暫定値のまま実装した。

## やること

実際の表示（できればスクリーンショットと画面幅）を見たうえで、

- 単位は % のままでよいか、px 指定にすべきか
- 40% という値が適切か（3列目「選手」が氏名（団体）で最大4行になる
  想定とのバランス）

を確認し、必要なら `style.css` の `#mtsuku_table thead th:nth-child(2),
#mtsuku_table td:nth-child(2) { width: 40%; }` を調整する。

## 対象ファイル

- `style.css`

---
この下書きはClaude Codeが作成しました。

### コメント (4件)

**retroeater** (2026-09-11):

`#mtsuku_table` 概要列の幅を実データの最長行に合わせて確認した。

## 確認結果

- 全61件のデータから概要欄（日付・名前(団体)・チーム名の3行）を抽出し、最長行を計測
- 最長は「純白のアトミックチャンピオン」(14文字、13px換算で約182px)
- padding(4px×2)を足すと190px。実フォント(Hiragino Sans / Yu Gothic Medium / Meiryo)は計測環境のIPAGothicと厳密には一致しないため、10px程度の余裕を見て **200px** に固定した
- 単位はpxを採用(%だと画面幅によって折り返し位置が動く問題が解消しないため)

`style.css` の `#mtsuku_table thead th:nth-child(2), #mtsuku_table td:nth-child(2)` を `width: 40%` から `width: 200px` に変更してpushした(f1f957c)。

---
_Generated by [Claude Code](https://claude.ai/code)_

**retroeater** (2026-09-11):

対応済みのためクローズします。

**retroeater** (2026-09-11):

仕様変更: 「選手」欄を最大幅の固定幅、「概要」欄をauto-fitに変更。

## 変更内容

- 3列目(選手、最大4行「氏名（団体）」)に固定幅を指定: 実データの最長行「近藤誠一（最高位戦）」等(10文字、13px換算130px)+padding(8px)+余裕(10px)で **150px**
- 2列目(概要)は幅指定を外し、table-layout: fixedの既定(幅指定のない列に残り幅を回す)でauto-fitさせる

前回の対応(200pxで概要列を固定)から役割を入れ替えた。style.cssをpushした(5e5687d)。

---
_Generated by [Claude Code](https://claude.ai/code)_

**retroeater** (2026-09-11):

対応済みのため再度クローズします。

---

## #149 牌効率のグラフの文字サイズを、本文（計算方法）と同じにする

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: UI/UX, 対象: resource_efficiency

### 本文

## 状況

`resource_efficiency.html` のグラフは静的SVGで、デスクトップ用が `viewBox="0 0 1200 700" width="100%" font-size="13"`。`width="100%"` なので**SVG全体が画面幅に合わせて拡大縮小され、文字サイズも一緒に変わる**。

一方、下の「計算方法：」の段落は `<p class="mj-margin-text">` で、Bootstrap既定の16px固定。結果として両者が一致するのはビューポート幅がちょうど1200pxのときだけになっている。

実際の見え方（デスクトップ用SVG）:

| 画面幅 | SVGの文字の実寸 | 計算方法 |
|---|---|---|
| 1200px | 13.0px | 16px |
| 1280px | 13.9px | 16px |
| 1536px | 16.6px | 16px |
| 1920px | 20.8px | 16px |

## やること（案）

SVGを等倍以上に拡大しないようにしたうえで、`font_size` を16にする。

1. `style.css` に `.mj-bar-chart-desktop { max-width: 1200px; }` を追加
   （1ユーザー単位 = 1CSSピクセルになり、文字が16px固定になる）
2. `scripts/generate_resource_efficiency.py` の
   `font_size=13` を `font_size=16` に変更
3. ラベル用の左余白 `chart_left=100` が16pxで足りるか確認
   （現状は13pxで「3456」4文字ぶん）。足りなければ `chart_left` を広げる

## 確認事項

モバイル用SVG（`viewBox="0 0 420 428" font-size="9"`、390px幅で実寸8.4px）も16pxにそろえるかどうか。そろえる場合は行の高さ（9.8px）を文字が超えて重なるため、`design_height` と行間の設計をやり直す必要がある（`scripts/lib/chart.py` のdocstringに同じ失敗の経緯あり）。デスクトップ用のみ先に対応するのを推奨。

## 対象ファイル

- `style.css`
- `scripts/generate_resource_efficiency.py`
- （自動再生成）`resource_efficiency.html`

---
この下書きはClaude Codeが作成しました（2026-09-12）。

### コメント (3件)

**retroeater** (2026-09-11):

デスクトップ用のみ対応しました（55ac3de）。font_size=16に対しchart_left=100で足りるか確認したところ、最長ラベル「3456」等4文字でも実測width方向に余裕があったため、chart_leftは変更していません。モバイル用は下書きの推奨通り今回は対象外としています（対応する場合はdesign_height・行間の設計をやり直す必要あり）。

**retroeater** (2026-09-11):

デスクトップ用のみ対応済み(55ac3de)。font_size=16に変更し、.mj-bar-chart-desktopにmax-width: 1200pxを追加して等倍以上に拡大されないようにしました。モバイル用は今回対象外です。

**retroeater** (2026-09-11):

モバイル用SVGの文字サイズは #151 に切り出した。

---

## #148 Mつくの概要列に明示的な幅を与える

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: UI/UX, 対象: video_mtsuku

### 本文

## 状況

`#mtsuku_table` は `.mj-table-3col`（動画／概要／選手）。写真列は `width: 168px` で固定済みだが、概要列と選手列は `table-layout: fixed` の既定どおり**残り幅の均等割り**になっている。そのため画面幅によって概要列の幅が変わり、折り返し位置が動く。

## やること

概要列に明示的な幅を与え、選手列に残りを割り当てる。選手列は「氏名（団体）」が最大4行、概要列は日付・名前・チーム名の3行。

```css
/* ==== #mtsuku_table 固有(Mつく) ====
   3列目(選手)は「氏名（団体）」が最大4行。2列目(概要)に明示的な
   幅を与え、残りを選手列に回す。 */
#mtsuku_table thead th:nth-child(2),
#mtsuku_table td:nth-child(2) {
    width: 40%;
}
```

## 確認事項

- 概要列の幅は暫定で40%。% と px のどちらがよいか、値をいくつにするか
- 写真列（168px固定・画像160×90）は、同じ構成の帰り道が問題なしと確認できたため対象外とした。Mつくだけ崩れて見えるようならスクリーンショットと画面幅をいただければ再調査する

## 対象ファイル

- `style.css`

---
この下書きはClaude Codeが作成しました（2026-09-12）。

### コメント (2件)

**retroeater** (2026-09-11):

概要列の幅を暫定で40%にして対応しました（e5cc420）。値は下書き段階の仮値のままです。実際の見た目が崩れている場合はスクリーンショットと画面幅を教えてください。調整します。

**retroeater** (2026-09-11):

対応済み(e5cc420)。概要列に暫定でwidth: 40%を指定しました。値の妥当性は別issueで検討します。

---

## #147 画像が80×80のページで、写真列の幅を画像に合わせて詰める

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: UI/UX, 対象: jpml_titles

### 本文

## 状況

`.mj-table-2col` の写真列 `width: 168px` は「画像160px + 左右padding 4px×2」という160×90サムネイル用の値。タイトルの画像は `img.avatar` の80×80なので、列の中に**左右あわせて80px分の余白**が残り、概要列が不必要に狭くなっている。

160×90の画像を持つページ（プロテスト・放送対局・帰り道・English）は168pxがちょうど収まる値なので、対象外とする。

## やること

`style.css` に以下を追加する。

```css
/* ==== 画像が80×80のページの写真列 ====
   .mj-table-2col の168pxは160×90サムネイル用の値。80×80の
   ページでは左右に40pxずつ余ってしまうため、88pxに詰める。 */
#titles_table thead th:nth-child(1),
#titles_table td:nth-child(1),
#saikyo_results_table thead th:nth-child(1),
#saikyo_results_table td:nth-child(1) {
    width: 88px;
}
```

`#saikyo_results_table` は #146 で80×80になる前提。#146 と同時に入れること（順序が逆だと最強戦の画像がはみ出す）。

## 対象ファイル

- `style.css`

---
この下書きはClaude Codeが作成しました（2026-09-12）。

### コメント (1件)

**retroeater** (2026-09-11):

対応済み(65d171e、#146と同一コミット)。#titles_table / #saikyo_results_table の写真列を88pxに詰めました。

---

## #146 最強戦の写真を80×80の正方形にし、列幅と行高を合わせる

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: UI/UX, 対象: saikyo_results

### 本文

## 状況

`saikyo_results.html` の写真は `img.rectangle`（160×90）だが、中身は人物のプロフィール写真（kinmaweb.jp / X のアイコン）で、16:9にトリミングすると顔が切れる。タイトル（`img.avatar` 80×80）や最強戦 読者アンケート（`img.x` 80×80）と同じ正方形にそろえたい。

## やること

1. `scripts/generate_saikyo_results.py` の `build_image_cell(...)` を
   `css_class="rectangle", width=160, height=90` から
   `css_class="avatar", width=80, height=80` に変更する
2. `style.css` の `#saikyo_results_table tbody tr` の
   `contain-intrinsic-size: auto 98px` を `auto 88px` に変更する
   （写真80px + 上下padding 4px×2 = 88px。`#titles_table` と同値）
3. 写真列の幅を88pxにする（Issue D のCSSに含める）

## 対象ファイル

- `scripts/generate_saikyo_results.py`
- `style.css`
- （自動再生成）`saikyo_results.html`

## 備考

写真が空の行が528件（全体の約20%）ある。フォールバックの `img/avatar.svg` は正方形なので、正方形化でむしろ自然になる。

Issue D（写真列の幅調整）と同時に対応すること。順序が逆だと最強戦の画像が列からはみ出す。

---
この下書きはClaude Codeが作成しました（2026-09-12）。

### コメント (1件)

**retroeater** (2026-09-11):

対応済み(65d171e、#147と同一コミット)。写真をavatar(80×80)に変更し、行高も88pxに合わせました。saikyo_results.htmlも自動再生成されています。

---

## #145 プロテストの列見出しを「記事」→「動画・記事」にする

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: UI/UX, 対象: jpml_test

### 本文

## 状況

`jpml_test.html` の1列目の見出しが「記事」だが、実際の中身はYouTube動画（連盟チャンネルのインタビュー等）と、連盟サイトのコラム記事が混在している。34件中、動画が過半。

## やること

`scripts/generate_jpml_test.py` の `TABLE = TableConfig(...)` にある

```python
headers=["記事", "概要"],
```

を

```python
headers=["動画・記事", "概要"],
```

に変更する。push すると `regenerate-page.yml` が `jpml_test.html` を自動で再生成する。

## 対象ファイル

- `scripts/generate_jpml_test.py`
- （自動再生成）`jpml_test.html`

---
この下書きはClaude Codeが作成しました（2026-09-12）。

### コメント (1件)

**retroeater** (2026-09-11):

対応済み(f3253a5)。見出しを「動画・記事」に変更し、jpml_test.htmlも自動再生成されています。

---

## #144 型Aの2列ページ6枚で、概要列を上寄せにする

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: UI/UX, 対象: 全ページ

### 本文

## 状況

`.mj-table thead th, .mj-table td` が `vertical-align: middle` を
全セルに当てているため、概要列の文章が画像の高さの中央に置かれる。概要が2行のときと5行のときで文章の開始位置が上下にずれて読みにくい。

## やること

`style.css` に以下を追加し、6ページの概要列（2列目）だけ上寄せにする。

```css
/* ==== 概要列の上寄せ ====
   画像列の高さ(88〜98px)に対して概要が可変行数のため、中央寄せだと
   行数によって文章の開始位置が上下にずれる。画像の上端に揃える。
   .mj-table-2col 全体には当てない(resource_logs / saikyo_mens /
   rh_paifu は対象外のため)。 */
#titles_table td:nth-child(2),
#test_table td:nth-child(2),
#saikyo_results_table td:nth-child(2),
#live_table td:nth-child(2),
#wayhome_table td:nth-child(2),
#en_table td:nth-child(2) {
    vertical-align: top;
}
```

対象: タイトル / プロテスト / 最強戦 / 放送対局 / 帰り道 / English

## 対象ファイル

- `style.css`（HTMLの再生成は不要）

## 備考

`.mj-left` と同じ発想で汎用クラス `.mj-top` を作り、`scripts/lib/page.py` 側で概要セルに付ける案もあるが、その場合は6ページの再生成が必要になる。CSSだけで完結する上記を推奨。

---
この下書きはClaude Codeが作成しました（2026-09-12）。

### コメント (1件)

**retroeater** (2026-09-11):

対応済み(010f985)。概要列を画像の上端に揃えました。

---

## #143 issues-snapshot.md にopenのみの要約版を追加する（提案）

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 状況: 保留, 分野: 整理・保守

### 本文

### 状況

現在222KB・131件を毎回全量読む運用で、会話コストが大きい。

### 案

`build_issues_snapshot.py`に`--open-only`を足して
`docs/issues-open.md`を併せて出力し、handover「0. 新しい会話の
始め方」の案内を「まずopen版、必要なら全量」に変える。

採否は平野さんの判断。

起票のみ。

2026-09-11のレビューで判明。

---

## #142 title整備（#5）の効果をSearch Consoleで測る

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 状況: 待ち, 分野: SEO

### 本文

### 状況

#5で26ページの`<title>`を整備したが、効果測定は「これから」のまま
（handover SEO節: 表示48回・クリック2回・CTR約4%）。

### 対応

変更前後で同じ期間長（例: 28日）の表示回数/クリック数/CTR/平均掲載
順位を比較し、結果をhandoverのSEO節に追記する。GSCの計測期間が
短いので、結論を急がず「初回計測」として記録する。

**平野さんが実施**（Search Consoleの操作）。

2026-09-11のレビューで判明。

### コメント (2件)

**retroeater** (2026-09-11):

### 初回計測（2026-09-12）

#### 前提の訂正: 28日比較は成立しない

- Search Console のデータ開始日は **2026-09-06**（#41の登録は9/7だが1日分遡っている）
- title 整備（#5）の適用は **2026-09-09**

変更前として使える期間が3日しかなく、28日 vs 28日の比較は永久に成立しない。
本issueは「前後比較」ではなく「時系列の推移を追う」ものとして扱い直す。

#### 初回計測値

| 期間 | 表示回数 | クリック数 | CTR | 平均掲載順位 |
| --- | --- | --- | --- | --- |
| 09-06〜09-08（確定） | 128 | 3 | 2.3% | 9.1 |
| 09-09〜09-11（**未確定**） | 71 | 4 | 5.6% | 11.4 |

日別表示回数: 48 / 41 / 39 / 36 / 26 / 9

#### この数字から結論は出せない

1. **変更後の3日間は未確定。** GSCのグラフが点線表示で、特に9/11の9回は
   埋まりきっていない。128→71 の減少の大部分はこれが原因
2. handover の「表示48回・クリック2回」（9/9記録）に対し、現在は9/6の
   1日だけで48表示。GSCのデータが後から埋まることは実証済み
3. 母数が極小。クリック数は3件と4件で、CTRの2.3%→5.6%は
   1クリックの差でしかない
4. 9/9 には #89 の404が371件発生しており、同時期の他要因と分離できない

#### 観測メモ

- `houou_ranking.html?sheet=鳳凰` が唯一クリックを獲得しているページ。
  2クリック/26表示/順位8.08 → 4クリック/20表示/順位7.4 と改善。
  ただし差は2クリック
- 平均掲載順位の悪化（9.1→11.4）は見かけ上のもの。`houou_leagues.html`
  が 13.08→20.5 に落ちた影響で、主力ページは改善している。
  平均順位は表示URLの構成に左右されるため、単独では指標にならない
- クエリ構成の変化: 変更前にあったブランド系（`ryoei`, `ryoei hirano`,
  `ryoei mikage`）が消え、`麻雀 鳳凰位 歴代` が出現。titleへの
  「日本プロ麻雀連盟」展開と符合するが、各1〜7表示のため偶然の範囲
- `ちりめん亭 蒲田東店`（順位42）で `tanilog.html` が表示されている。
  リダイレクト済みページが検索結果に残っている件は別途確認が必要

#### 今後の扱い

- 次回計測日: **2026-10-07**（title適用から28日）。09-09〜10-06 の28日を
  取得し、本コメントの初回計測値と並べる
- 母数が3桁に届くまでは、数値の上下に意味づけをしない

#### エクスポート

→ 保存済み。保存先と命名ルールは後続のコメント（2026-09-12 追記）を参照。

**retroeater** (2026-09-11):

### 追記（2026-09-12）

エクスポートを保存した。

- `docs/gsc/2026-09-12/20260906-20260908/`（#5 適用前、確定）
- `docs/gsc/2026-09-12/20260909-20260911/`（#5 適用後、**未確定**）

#### 命名ルール

`docs/gsc/<取得日>/<開始日><終了日>/` の2階層とした。詳細は
`docs/gsc/README.md`。

取得日を階層に持つのは、GSCのデータが後から埋まるため。同じ期間でも
取得日が違えば数値が変わり、期間だけをキーにすると同一期間の再取得を
残せない。10-07 の再計測では `docs/gsc/2026-10-07/20260909-20261006/`
に置く。

期間はGSCの期間指定ではなく実データの範囲を書く。`20260906-20260908` は
エクスポート時の指定が `2026/09/01-2026/09/08` だが、データ開始日が
2026-09-06 のため実データ範囲に合わせている。

#### 保存したファイルについて

GSCのエクスポートを無加工で置いている（UTF-8 / LF / BOMなし、末尾改行のみ補完）。
ファイル名もGSCの出力のままで、再エクスポート分をそのまま置いて差分が
取れるようにしている。

`平均読み込み時間のチャート.csv` は名称と実態が合っておらず、中身は
日別のクリック数/表示回数/CTR/掲載順位。GSCの日本語UIの出力名のため
変更していない。

`ページ.csv` のURLはパーセントエンコードのまま。デコード版が必要に
なったら原本との差分が取れるよう別ファイルにする。

---

## #141 ランキング3ページ（houou_ranking / ouka_ranking / wrc_ranking）の移行方針を決める（#7 から分割）

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: パフォーマンス, 対象: 全ページ

### 本文

### 状況

型B/C/Dは#111/#127/#128に分割済みだが、型Aの残り3ページ（ランキング系）
だけ#7のコメント内にしか進め方がない。

### ランキング系3ページの性質（handoverより転記）

`league_ranking.js`（772行）は集計エンジンで、9部門・部門ごとの
クエリ・リーグごとの閾値をブラウザで計算している。

- 共用している`league_ranking.js`は表示ロジックではなく**集計エンジン**。
  スプレッドシートから生データを取り、「通算得点」「期最高得点」
  「期連続浮き回数」「節単位浮き率」など9部門の指標をブラウザ側で
  計算している
- 部門ごとにクエリが異なり、リーグごとに閾値も違う（期連続浮きの
  最小回数は鳳凰6、桜花・JWRC・特昇3 など）
- そのため移行は「行をHTMLにする」作業ではなく、**集計ロジックを
  Pythonへ移植する**作業になる。他の型Aとは性質が違い、分量も大きい
- 上位100件に絞る`DEFAULT_RANK_LIMIT`があるため、出力自体は小さい

### 進め方の案（handoverより）

- **進め方**: 8部門すべてを1つのHTMLに焼き込み、`?division=`を
  ページ内の表示切替パラメータとして扱えば、現在のURL形式を維持できる
- **検証の進め方**: 集計ロジックだけ先にPythonへ移植して結果を書き出し、
  現行ページの表示と突合して一致を確認してから、HTML生成とページ側の
  JSを作る。ロジックの誤りとマークアップの誤りを同時にデバッグしない
  ため

新サイトのレーダーチャート（docs/new-site-design.md §4）が同じ集計を
使うため、Python移植は新サイトでも再利用できる。**現行サイト用に
移植するか、新サイトまで据え置くか**が判断点。

起票のみ。#7に本issueへのリンクをコメントする。

2026-09-11のレビューで判明。

### コメント (1件)

**retroeater** (2026-09-11):

## 集計場所の選択肢（2026-09-12 の検討）

「Pythonへ移植する」以外に、**スプレッドシート側で集計してしまう案**が
出たので、`league_ranking.js` の中身を読んだうえで比較した。

### 9部門の難易度

| 部門 | シート側集計の難易度 |
|---|---|
| 通算得点 | 易（すでに `SUM(H) GROUP BY A`） |
| 通算得点/期 | 易 |
| 期最高得点 | 易 |
| 期単位浮き率 | 易（COUNTIFS） |
| 節最高得点 | 中（13節分がI〜U列に横持ち。縦に開く処理が要る） |
| 節単位浮き率 | 中（同上） |
| **期連続浮き回数** | **難** |
| **節連続浮き回数** | **難** |
| **連続昇級回数** | **難** |

難の3部門は「連続」の判定で、名前・期・節の順に並べた行を上から舐めて
カウンタを持ち越す逐次処理。リーグごとの閾値も違う（鳳凰6、桜花・
JWRC・特昇3）。数式でやるなら生データに補助列を足して1行ずつ前行を
参照する形になり、15,416行×3部門で再計算が重く、行の挿入や並べ替えで
壊れる。**平野さんが手で編集するシートに計算列が混ざる**運用面の難もある。

### 4つの選択肢

- **(a) Python へ移植** — 移植コストは最大だが、リポジトリ内で完結し
  テストしやすい
- **(b) シート数式で集計** — 連続系3部門が苦しい。シートが重くなる
- **(c) Apps Script で集計して別シートに書き出す** — 手続き型なので
  `league_ranking.js` のループをほぼそのまま移植できる（同じJavaScript）。
  DataTable API の呼び出しを配列操作に置き換えるだけで済み、元データの
  シートも汚れない。ただし GitHub Actions とは別系統の自動化が1つ増える
- **(d) 据え置き** — #7 の対象から外す

### 判断材料になる指摘

**「どうせDB移行時に計算式を作るのだから、いま作るのは二重投資」という
読みは、(a) には当てはまらない。** 集計ロジックをPythonで持っておけば、
DB移行時に差し替えるのはデータの取得口だけで、計算そのものは持っていける。
新サイトのレーダーチャート（`docs/new-site-design.md` §4）も同じ集計を
使うため、再利用先は2つある。

一方 (b) と (c) は、DB移行時に確実に捨てることになる。「捨てる前提で
安く済ませる」なら (c) が最安。

### 判断の順序

**#111（型B）と本issueの両方で Charts を使わないと決めない限り、
`gstatic.com` は消えず #9 のCSPは変わらない。** 片方だけ移行しても
CSPへの効果はゼロ。したがって #111 の結論が出てから本issueを判断すると
無駄がない。

---

## #140 issues-snapshot.md の自動更新が効かない経路を明記する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: 整理・保守

### 本文

issues-snapshot.mdの自動再生成フックはCodespace以外では動かず、gh issue以外の経路(GitHub MCP・gh api・ブラウザ)での操作も反映されない。詳細はコメントに記載する。2026-09-11のレビューで判明。

### コメント (2件)

**retroeater** (2026-09-11):

### 対応完了（2026-09-11）

1. handover「3. 作業の進め方 → タスク管理」に「GitHub MCP / gh api /
   ブラウザで操作した場合も反映されない。作業の最後に
   python3 scripts/build_issues_snapshot.py を手動実行する」と追記
2. .claude/settings.jsonのcd /workspaces/mj固定を
   cd "$CLAUDE_PROJECT_DIR"に置き換えた。Claude Code公式ドキュメント
   （hooks-guide.md / hooks.md）で、PostToolUseフックを含む全フックに
   $CLAUDE_PROJECT_DIRが自動的にセットされることを確認済み。
   JSON構文検証済み・変更後もフックは正常に動作している（このコメント
   自体がフック経由でissues-snapshot.mdを再生成している）

**retroeater** (2026-09-11):

### 追記（2026-09-12）— Claude下書き

本issueで「`gh issue` 以外の経路では自動再生成が効かない」ことを
handover に明記したが、**再生成した結果をコミット・pushする手順が
抜けていた**ため、実際に取りこぼしが発生した。

#76 をクローズした際、GitHub 側は CLOSED / COMPLETED になっていたが、
`docs/issues-snapshot.md` はリモート上で古いまま（03:31 JST 時点の
状態で #76 が OPEN）だった。生成物は `docs/` 配下のファイルであり、
ローカルで再生成してもコミット・pushしなければリモートには載らない。

handover の「3. 作業の進め方 → タスク管理」に、再生成後の
コミット・pushまでを手順として追記した。

**確認の観点として。** スナップショットは「指示が正しく実施されたか」の
確認に使うファイル（handover 0節・タスク管理節）だが、pushされて
いなければ確認の根拠にならない。リモートのスナップショットを見て
「未実施」と判断する前に、`gh issue view` で実態を確認すること。
今回は実際にこの取り違えが起きた。

---

## #139 check_image_links.py の対象を jpml_pros.html 以外の生成済みページへ広げるか決める

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: 自動化

### 本文

### 状況

`check_image_links.py`は`TARGET_HTML = jpml_pros.html`のみを対象にして
いる。焼き込み済みの他ページは監視外:

- `saikyo_results.html`（kinmaweb.jp 1,324 ＋ pbs.twimg.com 705）
- `resource_logs.html`（pbs.twimg.com 2,630）
- `video_live.html`（img.youtube.com 2,332）
- `jpml_titles` / `saikyo_mens` / `video_*` / `rh_paifu` など

旧Google Charts方式では実行時取得だったので同条件だったが、焼き込みで
古いURLが固定化されるため、リンク切れが放置されやすくなった。

### 論点（判断待ち）

- 対象を全生成ページに広げるか（HEADリクエスト数が約1万に増える）
- jpml_prosだけでよいと判断するか
- ページごとに頻度を変えるか

#103（定期再生成）と併せて設計する。

2026-09-11のレビューで判明。

---

## #138 sitemap.xml の lastmod を暫定的に正しくする

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: SEO

### 本文

### 状況

`<lastmod>`が25件すべて`2026-09-07`のまま。9/11に多数のページを
再生成しており実態と合わない。Googleは不正確なlastmodを無視する
ようになるため、#121（sitemap自動化）までの暫定対応が必要。

### 対応案（判断待ち）

- (a) 各ページの最終コミット日（`git log -1 --format=%ad --date=short -- <file>`）で全件を書き直す
- (b) `<lastmod>`を全件削除して#121で復活させる

どちらでも可、平野さんの判断。

### コメントの誤りについて（このissueとは別に修正済み）

冒頭コメントの「`tanilog.html`はresource_logs.htmlへの転送用ページ」は
誤り。ファイルは存在せず`_redirects`で301転送している
（`/tanilog.html  /resource_logs.html?name=谷岡育夫  301`）。
`resource_calendar.html` / `resource_books.html`と同じ「`_redirects`で
転送しており実体がない」側の記述に修正した。

#121に本issueへのリンクをコメントする。

2026-09-11のレビューで判明。

---

## #137 docs/new-site-design.md §1「現行サイトの扱い」の前提を修正する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: 整理・保守

### 本文

### 状況

`docs/new-site-design.md`「1. 位置づけ」の「現行サイトの扱い」は
「現行サイト（GitHub Pages）は23ページがGoogle Charts方式なので、
スプレッドシートを直すだけで反映され、触らず放置できる」と書いているが、
いま配信しているのは`cloudflare`ブランチで、14ページは
`workflow_dispatch`の手動実行なしにデータが更新されない。

冒頭（3行目）の「現行サイト（GitHub Pages / `gh-pages`ブランチ）」も
同様の前提。

### 修正内容

1. 「現行サイト」の定義を「Cloudflare Workersで配信中の`cloudflare`
   ブランチ」に改め、`gh-pages`は切り戻し用と明記する
2. 「放置してもデータは最新」は`gh-pages`にしか当てはまらないと書き直す
3. 生成済みページ(14ページ)のデータ更新は#103（定期再生成）に
   依存することを書く
4. 冒頭の「現行サイト（GitHub Pages / gh-pages ブランチ）」も同様に直す

§7「既存資産の扱い」の「引き継ぐもの」に`scripts/lib/page.py` /
`scripts/lib/chart.py` / `table.js`を加えるかどうかは平野さんの判断
なので、本issueでは「検討事項」として書くだけにする。

2026-09-11のレビューで判明。

### コメント (1件)

**retroeater** (2026-09-11):

### 対応完了（2026-09-11）

- 冒頭と「現行サイトの扱い」を、配信中は`cloudflare`ブランチ・
  `gh-pages`は切り戻し用という前提に修正
- 「放置してもデータは最新」は`gh-pages`にしか当てはまらないと明記し、
  生成済み14ページは#103に依存する旨を追記
- §7に、`scripts/lib/page.py` / `scripts/lib/chart.py` / `table.js`を
  引き継ぐかどうかを「検討事項」として追記（判断は平野さん）

---

## #136 CLAUDE.md を現状に合わせて更新し、更新ルールを決める

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: 整理・保守

### 本文

### 状況

CLAUDE.mdの記述が実態とずれている。

- 「9ページがビルド時生成に移行済み」→ 実際は`scripts/generate_*.py`が
  14本（`jpml_pros` ＋ 型A 10 ＋ 型A' 2 ＋ 型D 1）。
  `python3 scripts/regenerate.py --list`の出力が正
- 「残り12ページ」→ 残り8ページ
  （`houou_leagues` / `houou_ranking` / `houou_results` / `ouka_leagues` /
  `ouka_ranking` / `ouka_results` / `wrc_ranking` / `wrc_results`）
- 型Aの列挙も現状（10ページ＋型A'＋型D）に合わせる
- `diagnose_ron2.py`は既に削除済みなので記載も削除する
- `regenerate.py` / `apply_page_meta.py` / `build_issues_snapshot.py`を
  「メンテナンス用スクリプト」節に追加する
- 更新ルールをCLAUDE.md末尾に追記する: 「ページの移行・追加・削除を
  行ったときは、同じコミットでCLAUDE.mdとdocs/handover.mdの件数・
  ページ列挙を更新すること。件数の正は`scripts/regenerate.py --list`」

2026-09-11のレビューで判明。

### コメント (1件)

**retroeater** (2026-09-11):

### 対応完了（2026-09-11）

CLAUDE.mdを現状に合わせて更新した。

- ページ件数(9→14)・列挙(残12→残8)を修正
- diagnose_ron2.py(削除済み)の記載を削除
- regenerate.py / apply_page_meta.py / build_issues_snapshot.py を
  メンテナンス用スクリプト節に追加
- 更新ルールを末尾に追記: 「ページの移行・追加・削除を行ったときは、
  同じコミットでCLAUDE.mdとdocs/handover.mdの件数・ページ列挙を
  更新すること。件数の正はscripts/regenerate.py --list」

---

## #135 abs.twimg.com の既定アイコンURL（13件）を img/avatar.svg に正規化する

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: 整理・保守, 対象: jpml_pros

### 本文

### 状況

handoverは「saikyo_mensの移行でabs.twimg.comへの依存は解消済み」と
しているが、それはフォールバックの話。スプレッドシート側の画像URLと
して `https://abs.twimg.com/sticky/default_profile_images/default_profile_200x200.png`
が焼き込み済みHTMLに残っている。

```
grep -c "abs.twimg.com/sticky/default_profile_images" jpml_pros.html saikyo_results.html
jpml_pros.html:11
saikyo_results.html:2
```

計13件。

### 対応案（判断待ち）

- (a) スプレッドシート側で該当セルを空にする（生成時にフォールバックへ落ちる）
- (b) 生成スクリプト側で `abs.twimg.com/sticky/default_profile_images/` を
  `img/avatar.svg` に置換する。(b)ならデータを直さなくても再発しない

**目的は #9 の `img-src` からこのドメインを外せるようにすること。**

どちらにするかは平野さんの判断。本issueはまず起票のみ。

2026-09-11のレビューで判明。

---

## #134 purecounter / typed.js の sourceMappingURL を削除する（#99 の積み残し）

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: 整理・保守, 対象: index

### 本文

### 状況

`assets/vendor/purecounter/purecounter_vanilla.js` と
`assets/vendor/typed.js/typed.umd.js` の末尾に `sourceMappingURL`
コメントが残っており、`.map` は同梱していない。`index.html` で
開発者ツールを開くと404が出る（CLAUDE.mdの既存ルール違反）。

#99では「#98の判断待ち」として対象外にしていたが、#98は完了し、
handoverで「index専用ライブラリ232KBはすべて稼働中」と確定したため、
除外理由は解消している。

### 対応

2ファイルの末尾コメントを削除する。`grep -rn sourceMappingURL assets/`
で残りが0件になることを確認する。

2026-09-11のレビューで判明。

### コメント (1件)

**retroeater** (2026-09-11):

### 対応完了（2026-09-11）

2ファイルの末尾の \`sourceMappingURL\` コメントを削除（コミット済み）。
\`grep -rn sourceMappingURL assets/\` で残り0件を確認済み。

---

## #133 docs/ を .assetsignore に追加する（本番で直接取得できる状態の可能性）

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: セキュリティ, 対象: 全ページ

### 本文

### 状況

`.assetsignore` は `scripts` / `.claude` / `.git` / `.github` / `.gitignore` /
`.vscode` / `CLAUDE.md` / `wrangler.jsonc` を除外しているが、`docs` を
除外していない。`wrangler.jsonc` の `assets.directory` はリポジトリ全体
（`./`）を指すため、除外されていないファイルは本番URLから直接取得できる。

### 事実確認（2026-09-11、Codespaceから実施）

```
curl -sI https://ryoei.pro/docs/handover.md | head -1
→ HTTP/2 200

curl -sI https://ryoei.pro/docs/issues-snapshot.md | head -1
→ HTTP/2 200

curl -sI https://ryoei.pro/docs/new-site-design.md | head -1
→ HTTP/2 200

curl -sI https://ryoei.pro/dic/Google_pros_20260501.txt | head -1
→ HTTP/2 200
```

`docs/*.md` はいずれも200で、本番から直接取得できる状態だった。

`dic/` は `resource_dictionary.html` から意図的にリンクしているページ
なので200で正しい。除外対象ではない。

### 何が公開されているか（docs/issues-snapshot.md の内容）

- WAFカスタムルールの式（#76関連）
- DNS・SPF・DMARCの設定値
- レジストラの期限
- Search Consoleの実データ
- ron2.jpへのアクセス経路調査の詳細

いずれもリポジトリ内のドキュメントとしては問題ないが、本番URLから
第三者が直接閲覧できる状態は意図していない。

### 対応

1. `.assetsignore` に `docs` を追加してコミット・push
2. デプロイ後、上記curlを再実行し404になったことを確認してコメント
3. `docs/handover.md` と `CLAUDE.md` に「新しいディレクトリ・ファイルを
   追加したときは公開してよいか確認し、公開しないものは`.assetsignore`に
   追加すること」という趣旨の注意書きを追記

2026-09-11のレビューで判明。

### コメント (1件)

**retroeater** (2026-09-11):

### 対応完了（2026-09-11）

`.assetsignore` に `docs` を追加してコミット・push（5304604）。

デプロイ後の再確認（2026-09-11 15:08 UTC）:

```
curl -sI https://ryoei.pro/docs/handover.md | head -1        → HTTP/2 404
curl -sI https://ryoei.pro/docs/issues-snapshot.md | head -1 → HTTP/2 404
curl -sI https://ryoei.pro/docs/new-site-design.md | head -1 → HTTP/2 404
curl -sI https://ryoei.pro/dic/Google_pros_20260501.txt | head -1 → HTTP/2 200（変更なし、想定どおり）
```

`docs/*.md` はいずれも404になり、`dic/` は引き続き200で公開されている。

`docs/handover.md` と `CLAUDE.md` に「新しいディレクトリ・ファイルを
追加したときは `.assetsignore` を確認すること」という趣旨の注意書きも
追記する（別コミット）。

---

## #132 regenerate-page.yml で workflow_dispatch の入力を run: に直接展開している

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: 自動化, 分野: セキュリティ

### 本文

### 状況

`.github/workflows/regenerate-page.yml` の「対象ページを再生成」ステップで、
`workflow_dispatch` の入力を `run:` ブロックへ直接展開している。

```yaml
python3 scripts/regenerate.py ${{ github.event.inputs.target_page }} \
  | tee /tmp/targets.txt
```

GitHub Actions の script injection の典型パターン。`${{ }}` はシェルが起動する前に
テキストとして置換されるため、入力に `;` や `$( )` を含めると任意のコマンドが走る。

同ファイルの「変更をコミット・push」ステップにある
`git add ${{ steps.regen.outputs.files }}` も同じ形。こちらの値は
`scripts/regenerate.py` の出力（リポジトリ内のコードが決める）なので、外部入力ではない。

### 深刻度は低い

`workflow_dispatch` の実行にはリポジトリへの write 権限が必要で、
**外部から到達できる経路ではない。** すでに push できる人だけが悪用できるため、
実質的な権限昇格にならない。

ただし修正が数行で済むこと、このワークフローは `cloudflare` ブランチへ push する
権限で動いており成功すれば本番に反映されることから、直しておく。

### 対応

入力を `env:` 経由に移し、シェル側で変数として参照する。

```yaml
      - name: 対象ページを再生成
        id: regen
        env:
          TARGET_PAGE: ${{ github.event.inputs.target_page }}
        run: |
          set -o pipefail
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            python3 scripts/regenerate.py $TARGET_PAGE | tee /tmp/targets.txt
          else
            ...
```

`$TARGET_PAGE` をクォートしないのは、`target_page` が
「スペース区切りで複数ページ」を受ける仕様（`scripts/regenerate.py` の
`pages` 引数が `nargs="*"`）で、単語分割を意図的に使っているため。
クォートすると `all` 以外の複数指定が1つの引数として渡り壊れる。
**クォートなしでも `env:` 経由であれば `; rm -rf` のような注入は起きない**
（シェルは展開後の値を再解釈しないため）。ワイルドカードだけは展開されうるので、
気になる場合は `set -f` を併用する。

`git add` 側も同様に `env:` へ移すと揃う。

### 背景

Mantis（Google の AI セキュリティレビュー用ハーネス）の採用検討中に、
リポジトリを読んでいて見つかったもの。Mantis 自体は不採用
（`docs/handover.md` の「検討して見送った技術」参照）。

---

## #131 作業用ブランチ claude/canonical-policy-decision-dbk5dq を削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: 整理・保守

### 本文

### 状況

`claude/canonical-policy-decision-dbk5dq` がリモートに残っている。
中身は `cloudflare` に fast-forward 済みで、同じコミット `3edffa8`
（#113 / #79 の方針確定をdocsに反映）を指しているだけなので、
消しても失うものはない。ローカル側は削除済み。

### 削除できなかった理由

Claude Code のリモートセッションからは削除できなかった。
セッションのgitプロキシがブランチ削除（zero-oidのpush）を拒否する。
`git push origin --delete <branch>` と `git push origin :refs/heads/<branch>`
の両方が `RPC failed; HTTP 403` で切断される。通常のpushは通るため
（同セッションで `cloudflare` へのpushは成功）、削除操作だけが許可されて
いない。GitHub MCP のツール群にもブランチ削除に相当するものがない。

### 対応

どちらかで消す。

- ブラウザ: https://github.com/retroeater/mj/branches の該当行のゴミ箱アイコン
- 手元のclone: `git push origin --delete claude/canonical-policy-decision-dbk5dq`

### メモ

今後もリモートセッションで作業ブランチを切る運用を続けるなら、
同じ後始末が毎回発生する。`cloudflare` に直接コミットするか、
まとめて消す運用を決めておくとよい。

### コメント (5件)

**retroeater** (2026-09-11):

### 再トライの結果（2026-09-11）: 変わらず削除不可

```
git push origin --delete claude/canonical-policy-decision-dbk5dq
→ error: RPC failed; HTTP 403
  send-pack: unexpected disconnect while reading sideband packet
```

### 切り分け

- **エグレスプロキシ側のエラーではない。** `$HTTPS_PROXY/__agentproxy/status` の
  `recentRelayFailures` は空。`selective` / `toolScoped` とも false。
  同じホストへの通常のpushは成功している（本issue起票の前後に `cloudflare` へ2回push済み）
- つまり拒否しているのはgit側の認可で、**削除（zero-oidのpush）という操作だけが
  許可されていない**。セッションのGitHub資格情報の権限設定によるものと思われる
- `/root/.ccr/README.md` に「403/407のポリシー拒否はリトライせず報告すること」と
  あるため、これ以上の回避策は試していない

### 追加で見つかったもの

`ls-remote` したところ、別セッション由来と思われる作業ブランチがもう1本残っていた。

```
3edffa8  refs/heads/claude/canonical-policy-decision-dbk5dq
bd38d22  refs/heads/claude/mantis-security-followup-t9jqxj
```

まとめて消すとよい。

---
_Generated by [Claude Code](https://claude.ai/code)_

**retroeater** (2026-09-11):

## 再トライの結果（2026-09-11）: 別の理由で止まった

削除を再試行したが、やはりリモートセッションからは消せなかった。
ただし**前回とは別のレイヤーでブロックされている**ので記録しておく。

### 今回の失敗

```
git push origin --delete claude/canonical-policy-decision-dbk5dq
→ Permission denied by the Claude Code auto mode classifier. Reason: [Git Destructive]
```

前回は git プロキシが zero-oid の push を拒否して `RPC failed; HTTP 403` で
切断された（＝コマンドは実行されたが、通信が拒否された）。
今回は Claude Code の auto mode の権限分類器が、**コマンドが実行される前に**
「破壊的な git 操作」として止めている。

そのため**プロキシ側の 403 が今も残っているかどうかは、今回は判定に至っていない。**
分類器を通せたとしても、その先でまた 403 になる可能性はある。

### GitHub MCP 側も改めて確認

ブランチ削除に相当するツールは**やはり存在しない**。
`create_branch` / `list_branches` はあるが delete がなく、
`delete_file` はファイル削除用で ref の削除には使えない。本文の記載どおり。

### 削除の安全性は再確認済み

```
origin/claude/canonical-policy-decision-dbk5dq = 3edffa8
cloudflare 未取り込みコミット数: 0
git merge-base --is-ancestor ... origin/cloudflare → true
```

`cloudflare` に完全に含まれており、消しても失うものはない。本文の前提は今も正しい。

### 通す手段があるとすれば

`.claude/settings.json` に `Bash(git push origin --delete *)` の許可ルールを
追加すれば分類器は通る見込み。ただしリポジトリにコミットされる恒久的な
設定変更になるうえ、前述のとおりその先でプロキシの 403 に当たる可能性が残る。

**当面は手元での実行（または GitHub の Branches ページ）が確実。**

---
_Generated by [Claude Code](https://claude.ai/code)_

**retroeater** (2026-09-11):

## 上2件の突き合わせ（結論の確定）

上の2件は別々のセッションがほぼ同時（14:22:44 / 14:23:14）に投稿したもので、
**同じ再トライの、違う層を見ている。** まとめるとこうなる。

| 層 | 結果 |
|---|---|
| Claude Code の auto mode 権限分類器 | セッションによっては `[Git Destructive]` で実行前に停止 |
| git 側の認可（プロキシ通過後） | 分類器を通ったセッションで実行され、**`RPC failed; HTTP 403` が再現** |

### 私の1つ前のコメントの訂正

「プロキシ側の 403 が今も残っているかどうかは判定に至っていない」と書いたが、
**もう一方のセッションが実際に実行して 403 を再現しており、403 は残っている。**

したがって同コメントの「`.claude/settings.json` に
`Bash(git push origin --delete *)` を追加すれば通る見込み」も**否定される。**
分類器は通せても、その先の git 側認可で同じ 403 に当たる。
設定を足す意味がないので、**この案は取り下げる。**

### 確定した結論

リモートセッションからは、分類器を通しても通さなくても削除できない。
**手元での実行、または GitHub の Branches ページからの削除が唯一の手段。**

### もう1本のブランチについて

上のコメントで `claude/mantis-security-followup-t9jqxj` も「まとめて消すとよい」と
挙げられているが、**こちらはまだ `cloudflare` に取り込まれていない**（#132 の起票と
handover.md への Mantis 追記を載せたコミット `bd38d22` を持っている）。
先に `cloudflare` へ fast-forward してから消すこと。

```
git checkout cloudflare
git merge --ff-only origin/claude/mantis-security-followup-t9jqxj
git push origin cloudflare
git push origin --delete claude/mantis-security-followup-t9jqxj
git push origin --delete claude/canonical-policy-decision-dbk5dq
```

`claude/canonical-policy-decision-dbk5dq` のほうは `3edffa8` で
すでに `cloudflare` に含まれているため、単独で消して問題ない。

---
_Generated by [Claude Code](https://claude.ai/code)_

**retroeater** (2026-09-11):

## 完了(2026-09-11)

このセッションはローカルのCodespace/clone経由で実行しており、コメントで
報告されていたリモートセッション特有の制限(auto mode分類器 / git側403)を
受けなかった。以下を実施した。

1. `claude/mantis-security-followup-t9jqxj` を `cloudflare` へマージ
   - fast-forward不可(cloudflareが7d5528fまで進んでいたため)、`--no-ff`でマージ
   - `docs/issues-snapshot.md` に軽微なコンフリクト(生成ファイルの同一箇所を
     双方が更新)。GitHub Issuesの現状から再生成して解決(64a5b18)
   - `cloudflare` へpush済み
2. `claude/mantis-security-followup-t9jqxj` をリモートから削除
3. `claude/canonical-policy-decision-dbk5dq` をリモートから削除(3edffa8は
   既に`cloudflare`に含まれているため単独削除で問題なし)

`master`(2020年のInitial commit 1件のみ、現デフォルトブランチはcloudflare)
も見つかったが、本issueの対象外のためユーザー確認の上で残置とした。

残る作業ブランチはなし(`cloudflare` / `gh-pages` / `master` のみ)。

---
_Generated by [Claude Code](https://claude.ai/code)_

**retroeater** (2026-09-11):

### 再トライの結果（2026-09-11）: 変わらず削除不可

```
git push origin --delete claude/canonical-policy-decision-dbk5dq
→ error: RPC failed; HTTP 403
  send-pack: unexpected disconnect while reading sideband packet
```

### 切り分け

- **エグレスプロキシ側のエラーではない。** `$HTTPS_PROXY/__agentproxy/status` の
  `recentRelayFailures` は空。`selective` / `toolScoped` とも false。
  同じホストへの通常のpushは成功している（本issue起票の前後に `cloudflare` へ2回push済み）
- つまり拒否しているのはgit側の認可で、**削除（zero-oidのpush）という操作だけが
  許可されていない**。セッションのGitHub資格情報の権限設定によるものと思われる
- `/root/.ccr/README.md` に「403/407のポリシー拒否はリトライせず報告すること」と
  あるため、これ以上の回避策は試していない

### 追加で見つかったもの

`ls-remote` したところ、別セッション由来と思われる作業ブランチがもう1本残っていた。

```
3edffa8  refs/heads/claude/canonical-policy-decision-dbk5dq
bd38d22  refs/heads/claude/mantis-security-followup-t9jqxj
```

まとめて消すとよい。

---
_Generated by [Claude Code](https://claude.ai/code)_

---

## #130 Block AI botsトグル廃止に伴い、挙動ベースのAIボット制御に移行する

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 状況: 待ち, 分野: セキュリティ

### 本文

### 背景

Cloudflare の「Block AI bots」一括トグルは 2026-09-15 に廃止され、
挙動ベースの制御（Search / Agent / Training の3分類）へ移行する。

9月15日以降、複数の目的を持つクローラーは宣言されたすべての挙動で評価され、
**最も厳しいルールが適用される**。Googlebot / Applebot / Bingbot はいずれも
検索インデックスとAI機能を単一のユーザーエージェントでクロールするため、
「AI学習をブロック」という設定に巻き込まれる。

### 緊急対応（2026-09-11 実施済み）

Security → Settings → Bot traffic → 「Block AI bots」で
`Mixed purpose crawlers will continue to be allowed.` を選択した。

docs/handover.md の方針「検索エンジンとAIの検索・回答は許可」に合わせるため。

**学習用クローラーをブロックしてもAI検索・回答での露出は減らない**
（学習クロールは引用も参照トラフィックも生まないため）。
したがって混在クローラーを許可しても、学習利用を拒否するという
当初の目的は損なわれない。

逆に混在クローラーをブロックしたままだと、検索流入そのものを失うリスクを負う。
#5（titleの整備）や #122（`?name=` の内訳確認）など SEO の作業を
積み上げている最中に取るリスクではない。

### 本対応（このissue）

旧トグル廃止後、挙動ベースの制御で設定を組み直す。

| 分類 | 方針 |
|---|---|
| Search | 許可 |
| Agent（AIの検索・回答） | 許可 |
| Training（学習） | ブロック |

### 確認事項

- 混在クローラー（Googlebot / Applebot / Bingbot）が Search として扱われ、
  ブロックされないこと
- AI Crawl Control の管理 robots.txt の内容が方針と一致しているか
  （robots.txt は Cloudflare が自作分の前に前置している）
- 設定後、Search Console でクロールエラーが増えていないこと

### 期限

2026-09-15 に旧トグルが廃止される。その後すみやかに着手する。

### コメント (1件)

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

期限2026-09-15。旧トグル廃止後の設定変更は平野さんがダッシュボードで
実施する。結果を以下の観点でここに記録すること。

- Search / Agent の許可設定
- Training のブロック設定
- 検索とAI学習の両方を行う混在クローラーの扱い
- robots.txtの配信内容（AI Crawl Controlの管理robots.txtとの整合）

---

## #129 Early Hints用のLinkヘッダを_headersに設計する

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: パフォーマンス, 対象: 全ページ

### 本文

### 背景

2026-09-11 に Cloudflare の Early Hints を有効化した。ただし
**トグルを入れただけでは何も起きない。**

Cloudflare の Early Hints は、レスポンスに含まれる
`Link: ...; rel=preload` / `rel=preconnect` ヘッダをキャッシュし、
次回以降のリクエストに対して 103 で先出しする仕組み。HTML 内の
`<link>` タグは読まない。

（Cloudflare Pages には `<link>` 要素から `Link:` ヘッダを自動生成する機能があるが、
Workers 静的アセットで同じ挙動をするかは未確認。まず実測で確かめること。）

参照:
- https://developers.cloudflare.com/cache/advanced-configuration/early-hints/
- https://developers.cloudflare.com/pages/configuration/early-hints/

### まず確認

    curl -sI https://ryoei.pro/jpml_pros.html | grep -i "^link:"

`Link:` が自動で付いているなら設計は不要。付いていなければ `_headers` に書く。

### 設計上の論点

`/*` 一括では書けない。CSSの構成がページによって違う。

| 対象 | CSS |
|---|---|
| 全27ページ共通 | `assets/vendor/bootstrap/css/bootstrap.min.css` |
| `index.html` のみ | `index.css` + `aos.css` + `glightbox.min.css` |
| 他26ページ | `style.css` |

`_headers` のパスパターンで出し分けるか、共通の Bootstrap CSS だけに絞るかを決める。
preload したのに使わないリソースがあるとブラウザのコンソールに警告が出るため、
ページごとに正確に書くこと。

### 期待値は低めに見積もる

Early Hints が稼ぐのは「リクエスト→レスポンス到着までの空き時間」だが、
HTML は `cf-cache-status: HIT` でその空き時間自体が短い。

また、Lighthouse の改善提案1位は Bootstrap CSS の未使用分
（mobile 合計約1,090ms、docs/lighthouse-baseline.md）であり、
これは preload では解決しない。Bootstrap をやめるかどうかは #101（新サイト）の判断。

**効果が測れなければ Early Hints ごと Off に戻してよい。**
「現行サイトに作り込みすぎない」方針に照らして、`_headers` が複雑になる対価に
見合うかで判断する。

### 前提

Early Hints は HTTP/2 または HTTP/3 接続でのみ動作する。
どちらも 2026-09-11 に有効化済み。

### コメント (3件)

**retroeater** (2026-09-11):

### 注意（2026-09-11）

Speed Brain が Workers 静的アセットで拒否された件（#119）と同じく、
「設定が有効になっている」ことと「実際に動いている」ことは別。
判定は必ずレスポンスの実測で行うこと。

**retroeater** (2026-09-11):

### Smart Hints（クローズドベータ）が代替になりうる（2026-09-11）

Speed → Content Optimization に **Smart Hints** という項目がある。
クローズドベータで、Sign up ボタンから申し込む形式。

> By using Smart Hints, Cloudflare will automatically select
> Early Hints and Fetch Priority for resources on your website
> to improve the render time in browser

**Cloudflare が自動で Early Hints の対象を選ぶ**ため、
このissueの主題である「`_headers` に `Link:` を手書きする」作業が
不要になる可能性がある。

ページごとに CSS 構成が違う（index.html だけ別系統）という設計上の論点も、
自動選択なら解消する。

### 進め方

着手前に Smart Hints へ申し込む。ベータに通れば手書きは不要になり、
通らなければ当初の設計どおり `_headers` に書く。
登録自体は無料で、通らなくても何も起きない。

### 前提の確認（済）

Early Hints のトグルは Speed → Content Optimization で有効（2026-09-11）。
HTTP/2・HTTP/3 も有効。

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

Smart Hintsへの申込みが済んでいるか不明。申込み済みなら日付を、未なら
申込み後に日付をここに記録すること（平野さん）。

---

## #128 #7の型D resource_efficiency の移行方針を決める

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: パフォーマンス, 対象: 全ページ

### 本文

### 対象

`resource_efficiency`（`BarChart`、牌の種類34種が上限・30行）

### 性質

**グラフ系6ページの中で唯一、完全に静的SVG化できる。**

- URLパラメータに依存しない
- データ量が小さく固定（34種が上限）
- `legend: 'none'`。カスタムツールチップも `addListener` もない（実機確認済み）

### 方針案

(c) ビルド時に静的SVGを生成してHTMLに埋め込む。
このページだけで `www.gstatic.com` への依存を1ページ分確実に減らせる。
型B・型Cの判断を待たずに着手できる。

### コメント (2件)

**retroeater** (2026-09-11):

## 訂正: 静的SVGでもツールチップは失われない

本issueの本文で「ツールチップとホバー時の値表示は失われる」を静的化のデメリットとして挙げていたが、これは誤り。

各棒(または該当要素)を`<g>`で包み、内側に`<title>`要素を置くと、ブラウザが標準のホバーツールチップを表示する。JSもCSSも不要。

#128(型D、resource_efficiency)の実装でこの方式を使い、動作を確認済み。

**retroeater** (2026-09-11):

scripts/lib/chart.pyを新規作成し、外部描画ライブラリなし(matplotlib等は導入せず標準ライブラリのみ)でSVG文字列を直接組み立てる方式で静的化した。

- 横棒30本、値の降順(クエリ側でORDER BY DESC)、legend:none、annotationとして末尾に値を表示、chartAreaの余白、既定の系列色(#3366cc)を再現
- 各棒の<g>内に<title>を置くことで、JS/CSSなしでホバー時のツールチップを再現できた
- 「幅100%・高さ700px」の両立はviewBoxのアスペクト比固定だけでは実現できず、デスクトップ用・モバイル用で寸法設計を変えた2枚のSVGを@media (max-width: 480px)で切り替える形にした(scripts/lib/chart.pyのdocstring参照)
- 旧版がSVG内に描いていた日英併記の長いグラフタイトルはHTML側の可視h1に移した(折り返し・読み上げのため)
- gstatic.com/docs.google.comへの依存を解消。グラフ系6ページで唯一、外部JSを一切読まないページになった
- 既存11ページの出力は無変更

型D完了。#7残りは9ページ(型B3・型C2・型A4)。

---

## #127 #7の型C 2ページ（積み上げ棒＋選手の折れ線）の移行方針を決める

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 状況: 対応中, 分野: パフォーマンス, 対象: 全ページ

### 本文

### 対象

`houou_leagues` / `ouka_leagues`

### 構造（2026-09-11 のコード調査＋実機確認で判明）

`ColumnChart`。`isStacked: true` で13色のリーグ帯（A1〜E3）を積み上げ、
`series: {13: {type:'line'}}` で14系列目だけを折れ線にしている。

**土台の積み上げ棒は全員共通で、`?name=` に依存するのは折れ線1本だけ。**
（`getLeagueRanks()` 内の `if(search_name == name)` で該当選手の行だけを
拾い、上位リーグの人数を足してリーグ横断の順位に変換している）。実機確認で、
`?name=`の値によらず積み上げ部分のSVG要素（先頭5件のrect）が完全に
一致することを確認した。

集計後の描画は houou_leagues が52期分、ouka_leagues が21期分と小さい。

### 方針案

型Bと違い、**静的化とのハイブリッドが成立する**。
土台の積み上げ棒をビルド時に焼き込み、選手依存の折れ線だけを軽量に描く。
あるいは (a) Google Charts 据え置き。

### 再現が必要なオプション

`animation`(1000ms/easing:'out'/startup) / `interpolateNulls: true`
(A1・A2リーグで必須というコメントあり) / `vAxis: {direction: -1,
textPosition: 'none'}` / 13色の配色 / `legend: {position: 'bottom'}`

### 依存

型B（#111）で (b) ECharts を選ぶ場合は、型Cも揃えるのが自然。
型Bの判断の後に決める。

### コメント (5件)

**retroeater** (2026-09-11):

## 訂正: 静的SVGでもツールチップは失われない

本issueの本文で「ツールチップとホバー時の値表示は失われる」を静的化のデメリットとして挙げていたが、これは誤り。

各棒(または該当要素)を`<g>`で包み、内側に`<title>`要素を置くと、ブラウザが標準のホバーツールチップを表示する。JSもCSSも不要。

#128(型D、resource_efficiency)の実装でこの方式を使い、動作を確認済み。

**retroeater** (2026-09-11):

## 着手時の事前調査（2026-09-11）

方針は **(c) 静的SVG + 折れ線だけクライアント描画のハイブリッド** で確定。ECharts は導入しない。

作業セッションのegressポリシーで `docs.google.com` / `www.gstatic.com` / `ryoei.pro` がすべて拒否されたため、**実データの取得と現行の見え方の確認は未了**。到達できたのは `github.com` のみだった。gh-pages版をローカル配信してChromiumで開く検証も行ったが、`https://www.gstatic.com/charts/loader.js` が `ERR_TUNNEL_CONNECTION_FAILED` となり `#myChart` の innerHTML は 0 バイトのまま。現行の描画は一切再現できていない。

以下はコードの精読とHTMLから確定できた範囲の記録。

### E列の正体（コードから確定）

旧JSで読まれていないと思われていた E列は、**リーグの通し番号（`league_index`）** だった。積み上げ配列への1始まりの添字としてそのまま使われている。

```js
let league_index = data.getValue(i,4)   // E列
leagues_17_2[league_index]++            // 配列の添字そのもの
```

- houou: 1=A1, 2=A2, 3=B1, 4=B2, 5=C1, 6=C2, 7=C3, 8=D1, 9=D2, 10=D3, 11=E1, 12=E2, 13=E3
- ouka: 1=A, 2=B, 3=C1, 4=C2, 5=C3

したがって列の意味は A=名前 / B=年（期） / C=前後 / **D=リーグ名 / E=リーグ通し番号** / F=順位。

**D列とE列は冗長。** 生成スクリプトでは D だけを取り、Python側でリーグ一覧からindexに変換する方が安全（シート側でEがずれても壊れない）。

### 実装前に実データで確認すべき論点

1. **houou の「前期A1/A2リーグ人数補完」の一般化。** 18期〜42期は前期のA1・A2の行がシートに存在せず、後期の値をコピーして埋めている。43前は補完対象外で **A1・A2が0のまま**、17後は補完なし。手順5で期の配列をシートのユニーク値から自動生成するなら、この補完ルールもデータから自動判定する必要がある。「A1/A2が0件の期は直後の後期からコピー」に一般化できそうだが、各期のA1/A2の件数を実データで見るまで確定できない。

   なお現行の補完ブロックは行ループの**内側**にあり、全行ぶん冗長に実行されている。後期の配列がまだ積み上げ途中の状態で読むため途中の値は誤っているが、最終イテレーションで正しい値に上書きされるため結果的に動いている。移植時にループ外へ出すこと。

2. **y軸の最大値。** その期の総人数ではなく全期の最大。折れ線の値（上位リーグ人数＋順位）は必ずその期の積み上げ合計以下なので、**最も背の高い期の積み上げ合計**で決まる。ただしGoogle Chartsが実際にどうキリのよい値へ丸めるか、グリッド線が引かれるかは現行の描画を見ないと合わせられない。

3. **houou の「鳳凰位」行の扱い。** 棒からは除外されるが `getLeagueRanks()` は除外していない。`getNumberOfPeopleInUpperLeagues()` の switch に "鳳凰位" のcaseがないため上位人数0となり、**折れ線が順位そのもの（＝グラフ最上部）へ跳ぶ。** 鳳凰位＝最上位なので意図した挙動とも読めるが、E列が0か空で別の壊れ方をしている可能性もある。該当行の実データで判断すること。

4. **ouka の `WHERE F > 0`。** 順位が0または空の行を除外している。何が対象なのか未確認。

### 選手名の件数

HTMLの `<option>` から抽出したところ **houou 695名 / ouka 149名**（プレースホルダの「名前を選択」を除く）。既定選手（白鳥翔・清水香織）もリストに存在する。シートのユニーク名と一致するかは未確認。

### 折れ線JSONのサイズ見積もり

実データが取れないため、**695名/52期・149名/21期という確定した骨格に、1期あたりの平均出場人数を変数として置いた**合成データでバイト数を実測した。

**houou（695名 / 52期）**

| 1期平均出場 | 総行数 | (a)生 | **(a)gzip** | (b)生 | (b)gzip |
|---:|---:|---:|---:|---:|---:|
| 150 | 7,800 | 74.9KB | **26.7KB** | 157KB | 25.7KB |
| 200 | 10,400 | 97.8KB | **33.7KB** | 162KB | 31.2KB |
| 250 | 13,000 | 121KB | **40.9KB** | 164KB | 36.3KB |
| 300 | 15,600 | 144KB | **48.1KB** | 165KB | 40.9KB |
| 350 | 18,200 | 166KB | **55.6KB** | 165KB | 45.4KB |
| 400 | 20,800 | 189KB | **63.0KB** | 164KB | 49.5KB |

**ouka（149名 / 21期）** は1期120名でも (a)gzip 7.7KB。どの想定でも余裕でクリアする。

- (a) = `{名前: [[期index, 順位], ...]}`
- (b) = 比較用の圧縮形 `{名前: [開始index, [順位, 順位, null, ...]]}`（期indexを省く）

**houou は50KBのしきい値がちょうど境界線上にある。** 1期あたり300名を超えると (a) は50KBを割り込む。実データなしには「通る」のか「詰め直しが要る」のかを決められない。

合成データは選手を全期にランダム配置しているため、実データ（在籍期が連続し順位も期をまたいで相関する）より **gzipが効きにくい方向に偏っている**。実測値は上表より小さくなるはずで、これは安全側の見積もり。(b) は houou の最悪ケースでも50KB以内に収まるので、(a) が超えた場合の第一候補になる。

### 次にやること

`docs.google.com` への到達を確保した上で、手順1-1（実データの取得と上記4論点の確認）と手順1-2（実データでのサイズ実測）をやり直す。手順1-3（現行の見え方のスクリーンショット）には `www.gstatic.com` が、手順6のLighthouseを既存の `docs/lighthouse-baseline.md` と同条件（本番計測）で追記するには `ryoei.pro` が要る。

---
_Generated by [Claude Code](https://claude.ai/code)_

**retroeater** (2026-09-11):

## 実データでの再調査（2026-09-11、egress問題解消後）

前回コメントの4論点＋新規発見をまとめる。方針(c)静的SVG+折れ線ハイブリッドは変更なし。

### E列・D列
前回の推測通り、D↔E対応は全16,011行(houou)・1,561行(ouka)で完全に一貫（不整合0件）。houou 1=A1〜13=E3、ouka 1=A〜5=C3。生成スクリプトはD列のみ使いPython側でindex変換する方針を維持。

### 1. A1/A2前期補完の一般化
18前〜42前の全期で「A1=A2=0の前期は直後の後期からコピー」に例外なく一般化できることを実データで確認。43前のみ対象外（次の43後がまだ確定していないため。後述）。

### 2. y軸最大値
白鳥翔の折れ線24点の実測ピクセル座標と、実データから再現計算したvalue(上位人数+順位)を回帰したところ `y = 63.5 + 0.86*value` とほぼ完全に一致（27分割のグリッド線、間隔約20.7px）。逆算した軸の実効範囲はおよそ-50〜600で、**0や実データ最大値(552)にきれいに揃っておらずGoogle Chartsが独自にpaddingを乗せた自動計算**。忠実な再現は困難と判断し、新実装ではその期の最大合計(552)を基準に自前でキリの良い最大値(600)を設定する。

### 3. 鳳凰位の扱い
`getLeagueRanks()`は鳳凰位を除外せず`0(上位人数) + null(F,順位) = 0`という暗黙変換で、たまたま最上部に来る。前原雄大（鳳凰位を26後/34後/35後に持つ）の実機スクショで確認したところ、折れ線は破綻せず滑らかにトップ付近を推移していた。意図的設計ではないが結果的に妥当な見た目。新実装では「鳳凰位はvalue=0」と明示的に扱う。

### 4. oukaのWHERE F>0
除外158行は全て21期（今期、未確定）。他の期に欠損なし。

### 新規発見: 最新期は成績未確定でF列が全欠損
houou 43後（595行）・ouka 21期（158行）はF列（順位）が全行NULL。リーグ配属は決まっているが対局はこれから、という状態。**これがhouou「53期」/ouka「21期」という実データ件数と、見込み「52期」/「21期見込み(20期相当)」のズレの正体**。「F値が1件もない期は積み上げ棒からも除外する」という規則で現行の見た目（houou52期・ouka20期）に一致させる。→ この方針を採用。

### 新規発見: セレクトボックス選手名リストの出典特定
現行のoption一覧（houou695名・ouka149名）は鳳凰・桜花シートの参加経験者（1,296名・248名）の単純なサブセットではなく、出典不明だった（「プロ」シートとの突合でも一致率9割程度）。

検討の結果、**「プロ」シートのY列="Y"（公開対象）かつ鳳凰最高(Q列)/桜花最高(T列)に値がある選手**を新しい選定基準として採用する（houou 716名・ouka 178名）。このうち鳳凰/桜花シートの実データに1件もヒットしない選手（houou 25名・ouka 14名、表記ゆれ等）は生成時にスキップする。

### JSONサイズ（実測、上記の新選定基準で確定）
| 対象 | raw | gzip |
|---|---|---|
| houou 716名中691名ヒット | 125.7KB | 36.2KB |
| ouka 178名中164名ヒット | 14.4KB | 4.7KB |

50KB閾値を余裕でクリア。当初「シートの選手名から自動生成」だと全1,296名で53.4KBとなり超過することが判明していたが、この選定基準採用で解消。

---
_Generated by [Claude Code](https://claude.com/claude-code)_

**retroeater** (2026-09-11):

## 実装完了(2026-09-11)

方針(c)静的SVG+折れ線だけクライアント描画のハイブリッドで移行した。

### 新規/変更ファイル

- `scripts/lib/chart.py`: `stacked_column_chart()`（積み上げ棒+折れ線の
  SVG生成）・`render_legend()`を追加
- `scripts/lib/leagues.py`: 集計処理の共通化（`select_periods` /
  `count_leagues` / `upper_counts` / `build_player_series`）
- `scripts/generate_houou_leagues.py` / `scripts/generate_ouka_leagues.py`: 新規
- `leagues.js`: houou/ouka共通。`?name=`に応じて折れ線と凡例ラベルを差し替える
- `houou_leagues_data.json` / `ouka_leagues_data.json`: 選手ごとの折れ線データ
- `houou_leagues.js` / `ouka_leagues.js`: 削除

### 実データ検証で確定した論点(前回コメントの答え合わせ)

- E列は生成スクリプトのクエリから外し、D列のみで集計（当初方針どおり）
- A1/A2前期補完は全期で例外なく一般化できた（18前〜42前、次の後期からコピー）
- 鳳凰位はvalue=0として明示的に扱う（旧JSの`0+null=0`という偶然の挙動を
  意図的な仕様として採用）。桜花側の同型プレースホルダ行（「桜花」）は
  `WHERE F > 0`で最初から除外されるため特別扱い不要
- **最新の進行中の期（houou 43後・ouka 21期）はF列(順位)が全行空。**
  「F値が1件もない期は積み上げ棒からも除外する」規則で旧版と同じ見た目
  （houou52期・ouka20期）にした
- y軸最大値はGoogle Chartsの自動スケーリングを再現せず、その期の最大
  積み上げ合計を基準に自前でキリの良い値を設定した（実測でGoogleの
  自動スケーリングは0にも実データ最大値にも揃わない独自のpaddingが
  乗っており、忠実な再現が困難だったため）
- **選手選択リストの出典を特定できなかった問題**: 「プロ」シートのY列
  ="Y"かつ鳳凰最高/桜花最高列に値がある選手を新しい基準として採用
  （houou 716名・ouka 178名）。JSONサイズはgzip後houou 36.2KB・
  ouka 4.7KBで50KB閾値をクリアした
  - **既知の制限**: この基準は「プロ」シート側のデータ不備の影響を
    受ける。実際に鳳凰位を複数回獲得した前原雄大・土田浩翔・阿部孝則の
    3名が、プロシートの鳳凰最高列が未記入のため選択肢から漏れている。
    対応はシート側のデータ修正を待つこととし、生成スクリプト側では
    対処しないことにした（判断済み）

### 検証

- gh-pages版とのスクリーンショット比較（デスクトップ・モバイル375px・
  鳳凰位選手・?name=切り替え）で、積み上げ棒の色/配置・折れ線の概形・
  凡例が同等であることを確認
- JS無効時に既定選手（白鳥翔/清水香織）の折れ線が静的SVGのまま表示される
  ことを確認
- `python3 scripts/regenerate.py`で他14ページに差分が出ないことを確認
- ローカルLighthouse(mobile)で houou: performance 84 / accessibility 93 /
  best-practices 96 / seo 91、ouka: performance 90 / 93 / 96 / 91
  （accessibilityの2件の指摘はnavbar.js共通の既存問題で、
  resource_efficiency.htmlと同じ）。**本番計測は`docs/lighthouse-baseline.md`
  の既存エントリと同条件にするため、デプロイ後に別途実施が必要**

---
_Generated by [Claude Code](https://claude.com/claude-code)_

**retroeater** (2026-09-11):

## 事後確認による訂正（2026-09-12）

平野さんの確認を受けて、#127 の記録2点を訂正する。

### 訂正1: スキップされる39名は表記ゆれではない

houou 25名・ouka 14名を「表記ゆれ等」と記録していたが、誤り。
**進行中の期（houou 43後・ouka 21期）が初参加である選手**が正体。
成績未確定のためこれらの期を積み上げ棒から除外しており、その結果
実データが0件になっている。

- 表記ゆれではないため名寄せは不要
- 期が確定すれば自然に解消する
- **ただし毎期この状態が発生する。** 新しい期が始まるたびに、その期が
  初参加の選手が一時的に選択肢から外れる
- `jpml_pros` が716本/178本のリンクを生成し続けるのに対し、選択肢は
  691名/164名になるズレも毎期発生する。**これは意図的なズレとして
  許容する**（判断済み）

該当選手（`jpml_pros` のリンクと `<option>` の差分として算出）:

houou（25名）: 中村朝海 / 中村泰詩 / 中馬雄志 / 久野智子 / 内山藤次朗 /
和田聡一隆 / 大島琉雅 / 大崎菜緒 / 安井駿 / 安部みゆ / 寺下達規 /
小倉慶一郎 / 小川慈瑛 / 小松崎舞 / 小松心音 / 小笠原樹 / 山本駿 /
朝比奈優斗 / 木村圭吾 / 田中羚 / 田辺ゆい / 白石ひより / 神代陽向 /
船田大斗 / 鈴木駿平

ouka（14名）: 中村優花 / 元氏なづは / 四ノ宮彩夏 / 天野美星 / 安本きらり /
定行七海 / 岡田美紅 / 星井つばさ / 桜坂優花 / 秋山華乃 / 脊黒沙南 /
藤堂菫 / 越野沙耶佳 / 風見あやな

### 訂正2: 前原雄大・土田浩翔・阿部孝則の件は「データ不備」ではない

「プロ」シートの鳳凰最高列が未記入であることを**データ不備**と記録して
いたが、誤り。**3名はいずれも現時点で連盟の所属プロではない。**

鳳凰位経験者かどうかにかかわらず、**現時点で連盟の所属プロでない
（`jpml_pros` に存在しない）選手は選択肢に含めない**という方針を確定する。

つまり現在の生成条件（「プロ」シートの Y列="Y" かつ 鳳凰最高/桜花最高列に
値がある）は意図どおりに機能しており、修正は不要。シート側の対応も不要。

---

## #126 Bing Webmaster Toolsに登録しIndexNowを検討する

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: SEO

### 本文

Search Console からインポートできるので登録は数分。麻雀という領域で Bing の
比率は低いと思われるが、コストがほぼゼロで、GSC と独立した検証材料になる。

### IndexNow

Cloudflare の Crawler Hints を On にすると IndexNow に自動通知が飛ぶ。
ただしキャッシュ連動のため、Cache Rules の判断（別issue）の後に効果を確認する。

### 完了条件

登録後、Bing 側のインデックス数と GSC の22URLを突き合わせる。

---

## #125 Cloudflare ObservatoryでLighthouseを定期実行する

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: パフォーマンス

### 本文

現在 docs/lighthouse-baseline.md を手作業で作っている。Speed → Observatory で
指定ページの Lighthouse を定期実行し、回帰を通知させられる。

#7 で残り12ページを移行していく最中なので、悪化の検知手段があると安心。

### 決めること

対象ページの選定（全27ページは不要）。候補:

- index（唯一の別系統・ライブラリ232KB）
- jpml_pros（最重量。mobile perf 37）
- saikyo_results（未移行の最大懸念。2,560行）
- jpml_titles（型Aの代表）

### コメント (1件)

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

候補の saikyo_results は移行済み（mobile perfはdocs/lighthouse-baseline.md
の移行結果を参照）。未移行の最大規模はhouou_results（15,416行、#111）に
変わった。候補をindex / jpml_pros / houou_results / jpml_titlesに見直す。

---

## #124 Rate Limiting rulesを設定する

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: セキュリティ

### 本文

#91 で Super Bot Fight Mode は「Pro では Definitely automated しか遮断できず、
実測で最大の塊である Likely automated 41% に手が出ない」として却下した。
Rate Limiting rules は bot score を使わないため、同じ層に効かせられる。

Pro は rate limiting rules を数本・IP単位・1分窓で使える
（正確な本数はダッシュボードで確認）。

### 当サイトは閾値を低くしやすい

table.js はページ内で絞り込みを完結させるため、実ユーザーのHTMLリクエスト数が
非常に少ない。一方、選手1,100名のデータベースはスクレイピング対象になりやすい。

### 案

同一IPが1分に N 回以上 `.html` を要求したら Managed Challenge。
まず Log モードで運用して閾値を決める（#76 と同じ進め方）。

### 除外

`/cdn-cgi/` は Web Analytics のビーコン送信先なので必ず除外する（#110 と同じ注意点）。

### あわせて検討

`cf.client.bot`（Verified Bot 判定）を使ったカスタムルール。Pro でも利用できる。
検索エンジンを素通しし、それ以外の非ブラウザ的アクセスに Managed Challenge を出す分岐。

---

## #123 HTMLのエッジキャッシュ（Cache Rules）を検討する

- 状態: CLOSED (NOT_PLANNED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: パフォーマンス, 対象: 全ページ

### 本文

docs/handover.md に「Initial server response time の改善は対処不可。ページ側の
対処手段がない」と記録しているが、Cloudflare 側に手段が残っている可能性がある。

Cloudflare は既定で HTML をキャッシュ対象にしない。Cache Rule で HTML を
Eligible for cache にして Edge TTL を付けると、cf-cache-status が HIT になり
応答が短縮されうる。

### まず現状確認

```
curl -sI https://ryoei.pro/jpml_pros.html | grep -i cf-cache-status
```

- DYNAMIC → 伸びしろあり。先へ進む
- HIT → すでに効いている。400ms は別要因。このissueはクローズ

### 代償

デプロイのたびにキャッシュパージが必要になる。GitHub Actions から API 1本で
自動化できる。データ更新が `workflow_dispatch` の手動実行になっている現状（#103）と
設計をセットにする。

### 副次効果

Speed Brain の前提条件（キャッシュ適格）を満たす。

### 競合

#79 / canonical をエッジで解く案（Snippets での `<title>` 書き換え）とは、
キャッシュキーにクエリ文字列を含めるかどうかで設計が競合する。

### コメント (2件)

**retroeater** (2026-09-11):

### 確認結果（2026-09-11）

    curl -sI https://ryoei.pro/jpml_pros.html | grep -i cf-cache-status
    → cf-cache-status: HIT

HTML はすでにエッジキャッシュから配信されている。「HTML がキャッシュ対象外だから
400ms かかっている」という仮説は外れだった。Cache Rules を足しても伸びしろはない。

デプロイ時のパージ運用を持ち込む必要もなくなったため、#103（定期再生成）との
設計統合も不要。

docs/handover.md の「Initial server response time の改善は対処不可」という記述が
実測で裏付けられた形になる。結果は docs にも記録済み。

**retroeater** (2026-09-11):

### 確認結果（2026-09-11）

    curl -sI https://ryoei.pro/jpml_pros.html | grep -i cf-cache-status
    → cf-cache-status: HIT

HTML はすでにエッジキャッシュから配信されている。「HTML がキャッシュ対象外だから
400ms かかっている」という仮説は外れだった。Cache Rules を足しても伸びしろはない。

デプロイ時のパージ運用を持ち込む必要もなくなったため、#103（定期再生成）との
設計統合も不要。

docs/handover.md の「Initial server response time の改善は対処不可」という記述が
実測で裏付けられた形になる。結果は docs にも記録済み。

---

## #122 Search Consoleで「?name=」付きURLの内訳をエクスポートする

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: SEO

### 本文

docs/handover.md に「検索結果に出た22URLのうち14件が `?name=` 付きだったが、
どのページのものかは未確認」とある。この内訳は次の2つの判断の前提になっている。

- #7 のURLパラメータ削除判断（ページを移行するたびに発生する）
- canonical の方針判断（別issue）

### 手順

検索結果のパフォーマンス → ページ →「URLを含む: ?name=」でフィルタ → エクスポート。

結果は docs に表として残す。ページを移行するたびに毎回悩まずに済むよう、
先に1回取っておく。

### コメント (1件)

**retroeater** (2026-09-11):

### 目的の変更（2026-09-11）

#113 が (c) 現状維持に決まり、#7 のURLパラメータは一律そのまま引き継ぐ
方針になったため、本issueの「削除判断の前提」という役割はなくなった。

また GSC の計測開始が最近のため、取得できる期間が短い。母数が小さい状態では
「出てこなかった＝不要」とは言えず、削除判断の材料には元々向かない。

新しい目的: 新サイト（#101）で選手個別ページを設計するときの基礎データとして、
現時点のスナップショットを取っておく。どの選手名に検索需要があるかの初期値。
handover の SEO 節にある「上位が突出せず裾野が広い」分布の裏付けになる。

取得後 docs に表として残し、クローズする。優先度は下げてよい。

---
_Generated by [Claude Code](https://claude.ai/code)_

---

## #121 sitemap.xmlのlastmodを自動更新する

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: SEO

### 本文

現在 sitemap.xml は25件すべて `<lastmod>` が `2026-09-07` の固定値。
Google は changefreq と priority を見ないが、lastmod は（正確である限り）見る。
全件が同じ固定値では信号として無意味。

### 対応

`regenerate-page.yml` が対象ページを再生成したとき、そのページの `<lastmod>` だけを
当日の日付に書き換える処理を足す。#103（定期再生成）と同じ場所に入るため、
設計はセットで検討する。

### あわせて判断

changefreq / priority を残すか削るか。Google は無視するが、他の検索エンジン向けに
残す選択もある。

### コメント (1件)

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

lastmodの暫定対応（9/7のまま更新されていない問題）を#138で扱う。

---

## #120 #9の着手前にCloudflareのHTML書き換え系機能がOffか確認する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: セキュリティ, 対象: 全ページ

### 本文

Cloudflare にはエッジで inline script や属性を注入する機能があり、
有効なままCSPを書くと自分でサイトを壊すことになる。#9 着手前のチェックリスト。

| 機能 | 場所 | あるべき状態 |
| --- | --- | --- |
| Email Obfuscation | Scrape Shield | Off（inline script を注入する） |
| Rocket Loader | Speed → Optimization | Off（scriptを書き換える） |
| Mirage | Speed → Optimization | Off（`<img>` を書き換える。#71の節で不採用と判断済みだが実設定を確認） |

あわせて Speed Brain（別issue）も strict-dynamic / nonce と非互換。

確認結果は #9 のコメントに転記する。

### コメント (1件)

**retroeater** (2026-09-11):

### 確認結果（2026-09-11）

CSP（#9）着手前のチェックとして、Cloudflare がエッジで HTML を書き換える
機能の状態を確認した。**すべて Off で、対応は不要だった。**

| 機能 | 場所 | 状態 |
|---|---|---|
| Rocket Loader | Speed → Content Optimization | Off |
| Email Address Obfuscation | Security → Settings → Client side abuse | Off |
| Hotlink Protection | 同上 | Off |
| Mirage | Speed → Image Optimization | 項目なし（Business プラン以上のため Pro では対象外） |

inline script や属性の注入は発生していない。
#9 で CSP を書く際、Cloudflare 側の注入を考慮する必要はない。

### #9 着手時に再確認すること

- Speed Brain は 2026-09-11 に Off へ戻した（#119）。再度有効化する場合、
  strict-dynamic / nonce を使う CSP とは併用できない
- Security → Settings → Client side abuse の
  **Continuous script monitoring（Page Shield）は現在 Off**。
  On にするとサイト上で実行中のスクリプト一覧が取れるため、
  `script-src` の棚卸しに使える。#9 着手時に有効化を検討する

---

## #119 Speed Brainが当サイトで機能するか判定する（#105の判断材料）

- 状態: CLOSED (NOT_PLANNED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: パフォーマンス, 対象: 全ページ

### 本文

Speed Brain は Cloudflare 側の設定だけで Speculation Rules を配布する機能で、
#105（自前で Speculation Rules を書くか）の代替になりうる。

### 効かない可能性がある

動作条件に「prefetch 対象のページが Worker を呼び出さないこと」「キャッシュ適格で
あること」が含まれる。Workers 静的アセット配信の当サイトでは効かない可能性がある。
#71（Tiered Cache）や Polish / Mirage を却下したのと同じ構造の落とし穴。

参照: https://developers.cloudflare.com/speed/optimization/content/speed-brain/

### 判定方法

Speed Brain を有効にして:

```
curl -sI https://ryoei.pro/jpml_pros.html | grep -i speculation-rules
```

ヘッダが付かなければ効いていない。

### CSPとの関係

Speed Brain は strict-dynamic や nonce を使う CSP と併用できない。
#9 の内容次第では選択肢から外れる。

### 完了条件

結果を受けて #105 を「Speed Brainで代替」「自前で記述」「見送り」のいずれかで
クローズする。

### コメント (2件)

**retroeater** (2026-09-11):

### 経過（2026-09-11）

Speed Brain は Disabled だったため、最初の curl で `Speculation-Rules` ヘッダが
出なかったのは「無効だったから」であり、判定にはなっていなかった。

Speed → Recommendations で有効化済み。あらためて確認する:

    curl -sI https://ryoei.pro/jpml_pros.html | grep -i speculation-rules

- ヘッダが出る → Speed Brain が機能している。#105 は「Speed Brainで代替」で
  クローズできる
- ヘッダが出ない → 動作条件「prefetch 対象のページが Worker を呼び出さないこと」に
  引っかかっている。#71 / Polish / Mirage と同じ結論（Workers 静的アセット配信では
  効かない）。Speed Brain は Off に戻し、#105 は「自前で記述」か「見送り」で判断する

### 前提条件の確認状況

もうひとつの動作条件「キャッシュ適格であること」は、
`cf-cache-status: HIT` を確認済みのため満たしている。

### 注意

有効化直後は反映に時間がかかる場合がある。ヘッダが出ない場合は
時間を置いて再確認してから結論を出すこと。

**retroeater** (2026-09-11):

### 判定結果（2026-09-11）: 効かない

    curl -sI -H "sec-purpose: prefetch" https://ryoei.pro/jpml_titles.html | head -1

    HTTP/2 503
    cf-speculation-refused: prefetch refused: disabled for worker requests

Cloudflare が拒否理由を明示している。Workers 静的アセット配信のこのサイトでは、
Speed Brain の prefetch は最初から拒否される。#71（Tiered Cache）・Polish・Mirage と
同じ「Workers 静的アセットには効かない」パターンがここでも再現した。

Speed Brain は Off に戻した。

### 判定方法についての注意（同じ誤解を繰り返さないため）

`Speculation-Rules` ヘッダの有無で判定してはいけない。このヘッダは
「ルールが配布されたか」しか示さない。Speed Brain 有効化後は
`Speculation-Rules: "/cdn-cgi/speculation"` が正常に付いていたが、
実際の prefetch は全件 503 だった。

判定は必ず prefetch リクエストのステータスコードで行う:

    curl -sI -H "sec-purpose: prefetch" <URL> | head -1

    200 → 受理される
    503 → 拒否される（cf-speculation-refused ヘッダに理由が入る）

### 経過の記録

有効化前の最初の確認で `Speculation-Rules` ヘッダが出なかったとき、
「有効化直後で反映待ちの可能性」としたが、これは誤り。単に Speed Brain が
Disabled だっただけで、有効化後はヘッダが出た。そのうえで prefetch が
拒否される、という二段構えだった。

---

## #118 Cloudflareの通知（Notifications）を設定する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: インフラ

### 本文

現在、異常が起きても気づく経路がない。最低限、以下を設定する。

| 通知 | 理由 |
| --- | --- |
| ドメイン有効期限・自動更新 | Registrar。失効すると全停止する |
| SSL証明書 | 同上 |
| Security Events のスパイク | #76 で Managed Ruleset を Block に切り替えたため、誤検知の急増を検知したい |
| Workers のエラー率 | 配信そのものの異常検知 |

通知先は当面 平野さんのメール。#17 で独自ドメインメールを作る場合は宛先を見直す。

### コメント (1件)

**retroeater** (2026-09-11):

### 対応完了（2026-09-11）

通知タイプは全53種類。Product ドロップダウンで絞り込んで確認した。

### 設定したもの

| Product | Alert Type | 通知先 |
|---|---|---|
| SSL/TLS | Universal SSL Alert | hirano@ryoei.net |

通知先の `ryoei.net` は別事業者で運用しているドメインのため、
ryoei.pro 側に障害が起きても受け取れる。

### 設定しなかったもの（設定し忘れではない）

| 想定していた通知 | 結果 |
|---|---|
| Registrar 系（ドメイン失効・移管） | **Product の一覧に Registrar が存在しない。** 通知タイプ自体が提供されていない |
| Billing | 2種類（Billing Budget Alert / Usage Based Billing）のみで、どちらも「支出がしきい値を超えたら通知」。守りたかった「支払い失敗による失効」は検知できないため見送り |
| セキュリティイベントの急増 | Product 一覧に該当なし。Business プラン以上と思われる |
| Workers のエラー率 | Product 一覧に該当なし |

SSL/TLS の他の6種類（Access mTLS / Advanced Certificate /
Authenticated Origin Pulls / mTLS Certificate Store / SSL for SaaS）は
いずれも未使用の機能のため対象外。Universal SSL のみが該当する。

### ドメイン失効対策は通知ではなく直接確認で担保した

Domain Registration → ryoei.pro で以下を確認済み。

| 項目 | 値 |
|---|---|
| Status | Active |
| Expiration date | 2028年3月20日 |
| Auto renew | On |
| 自動更新予定 | 2028年2月19日 |

期限まで1年半あり自動更新も有効なため、当面の失効リスクはない。
カードの有効期限は自動更新のタイミングで確認すれば足りる。

---

## #117 DNSSECを有効にする

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: インフラ

### 本文

#18 で Cloudflare Registrar へ移管済み、DNS も Cloudflare のため、
DSレコードの登録まで自動で完結する。現状の有効/無効を確認し、無効なら有効化する。

### コメント (1件)

**retroeater** (2026-09-11):

### 対応完了（2026-09-11）

DNS → Settings で DNSSEC を有効化した。
「DNSSEC is pending while we automatically add the DS record on your domain.」
の表示に切り替わり、Cloudflare が DS レコードを自動登録している。

#18 で Cloudflare Registrar へ移管済みかつ DNS も Cloudflare のため、
DS レコードのレジストリ登録まで自動で完結する。手動作業は不要だった。

### 記録

- Multi-signer DNSSEC / Multi-provider DNS は Off のまま。どちらも
  他社DNSと併用する場合の機能で、当サイトには該当しない。
  DNSSEC 有効中はこの2つを使えない旨の警告が出るが、これは仕様
- CNAME flattening は Off のまま。apex に CNAME を置いていないため不要

---

## #116 送信しないドメインのなりすまし対策（SPF / DMARC）を入れる

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: セキュリティ

### 本文

#17（Email Routing）は保留だが、保留のままでも「このドメインはメールを送らない」
という宣言は今すぐ出せる。ryoei.pro は個人ブランドのドメインなので、
なりすまし送信のリスクは実在する。

### 対応

DNS → Records の Email Security wizard で入る。手動なら:

```
ryoei.pro               TXT  "v=spf1 -all"
_dmarc.ryoei.pro        TXT  "v=DMARC1; p=reject; rua=mailto:<宛先>"
*._domainkey.ryoei.pro  TXT  "v=DKIM1; p="
```

### 注意

#17 で Email Routing を導入する場合、SPF の内容を差し替える必要がある。
#17 に着手するときはこのissueを見直すこと。

### コメント (1件)

**retroeater** (2026-09-11):

### 前提の確認（2026-09-11）

DNS レコードは3件のみで、**MX レコードが存在しない**ことを確認した。
サイト側も `<form>` が27ページに0個、#98 で php-email-form も削除済みで、
ryoei.pro からメールを送る経路はない。

### 対応

DNS → Settings → Email Security → Configure（Email Record Creator）の
「Your domain is not used to send email」から一括作成した。

| Type | Name | Content |
|---|---|---|
| TXT | @ | `v=spf1 -all` |
| TXT | `_dmarc` | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;` |
| TXT | `*._domainkey` | `v=DKIM1; p=` |

DMARC は `sp=reject`（サブドメインも拒否）、`adkim=s` / `aspf=s`（厳密一致）
まで含む厳しい内容。送信しないドメインとしては最適。

Reporting email addresses（rua）は空のまま。`@ryoei.pro` のアドレスが
まだなく、レポートを受け取る予定もないため。拒否の動作には影響しない。

適用後、DNS レコードは6件になり、Cloudflare の Recommendations は
「All set / No recommendations」になった。

受信用の MX は追加していない。受信は #17 で別途判断する。

### #17 着手時の注意

`v=spf1 -all` は「このドメインはメールを送信しない」宣言。
#17 で `@ryoei.pro` から**送信**する場合は SPF の書き換えが必須で、
書き換えないと送信メールが拒否される。

---

## #115 wwwとapexの正規化を確認し、必要ならRedirect Ruleを設定する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: インフラ

### 本文

docs/handover.md には `ryoei.pro` / `www.ryoei.pro` の両方が記載されており、
`_redirects` に正規化の行はない。両方が200を返すなら同一内容が2ホストで配信され、
重複コンテンツになる。Search Console はドメインプロパティ（TXT認証）なので
両ホストが同じプロパティに混ざり、レポートも汚れる。

### 確認

```
curl -sI https://www.ryoei.pro/jpml_pros.html | head -3
```

200 が返るなら対応が必要。301/308 が返るならこのissueはクローズ。

### 対応案

Redirect Rule を1本:

| 項目 | 値 |
| --- | --- |
| 式 | `http.host eq "www.ryoei.pro"` |
| 遷移先 | `concat("https://ryoei.pro", http.request.uri.path)`（動的） |
| ステータス | 308 |

`_redirects` ではなく Redirect Rule を使う理由: `_redirects` はパスでしか
分岐できず、ホスト名で条件を書けないため。

### コメント (2件)

**retroeater** (2026-09-11):

### 確認結果（2026-09-11）

    curl -sI https://www.ryoei.pro/jpml_pros.html | head -3
    → 200

www と apex の両方が同じ内容を配信している。対応が必要で確定。

### 寄せる方向

apex（`https://ryoei.pro/`）に寄せる。理由:

- sitemap.xml の全25件の `<loc>` が apex
- 全27ページの `og:url` が apex
- Search Console もこの形でインデックスされている

`www` → apex の Redirect Rule（308）を設定する。

**retroeater** (2026-09-11):

### 対応完了（2026-09-11）

Redirect Rule「www to apex」を作成した。

| 項目 | 値 |
|---|---|
| 一致条件 | Wildcard pattern |
| Request URL | `https://www.ryoei.pro/*` |
| Target URL | `https://ryoei.pro/${1}` |
| Status code | 308 |
| Preserve query string | 有効 |
| Place at | First |

`_redirects` ではなく Redirect Rule を使ったのは、`_redirects` がパスでしか
分岐できずホスト名で条件を書けないため。

### 確認結果

    curl -sI "https://www.ryoei.pro/jpml_pros.html?name=%E5%B9%B3%E9%87%8E%E8%89%AF%E6%A0%84" | head -5
    → HTTP/2 308
    → location: https://ryoei.pro/jpml_pros.html?name=%E5%B9%B3%E9%87%8E%E8%89%AF%E6%A0%84

`?name=` 付きでもクエリ文字列が保持されたまま apex へリダイレクトされている。
apex 側は素通りで200。

`?name=` 付きURLが検索流入の主力（検索結果に出た22URLのうち14件）のため、
Preserve query string は必須。無効にすると www 経由の流入が全件表示ページに
着地するところだった。

---

## #114 workers.devのプレビューURLをnoindexにする

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: SEO, 対象: 全ページ

### 本文

#38 でプレビュービルドを有効にしているため `*.workers.dev` のURLが公開状態にある。
`_headers` に指定がないため、クロールされれば本番と同一内容の重複サイトになる。

Cloudflare 公式が `_headers` の用例として挙げている書き方:

```
https://:version.:subdomain.workers.dev/*
  X-Robots-Tag: noindex
```

参照: https://developers.cloudflare.com/workers/static-assets/headers/

あわせて Search Console の「ページ」レポートで workers.dev のURLが
登録されていないか確認する。

---

## #113 canonicalの方針を決める（#79と一体で判断する）

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: SEO, 対象: 全ページ

### 本文

### 事実確認

全27ページに `<link rel="canonical">` が存在しない。`og:url` は全ページにあるが
canonical はない（index / jpml_pros / jpml_titles / houou_results で確認）。

docs/handover.md の #89 の節に「canonical・og:url・sitemap がすべてリダイレクト先を
指す状態になる」と書かれているが、canonical は実在しない。docs の記述を修正すること
（別途対応）。

### 単純に付けてはいけない理由

Search Console の実測で、検索結果に出た22URLのうち14件が `?name=` 付きだった。
self-canonical を `?name=` なしのURLに向けると、この14件は正規化されて検索結果から消える。

### 選択肢

(a) `?name=` を独立したページとして生かす
    #79（URLパラメータの選手名をタイトルに反映）を先に実施し、
    title / description / canonical を `?name=` ごとに出し分ける

(b) 全件表示ページに寄せる
    全ページに `?name=` なしの self-canonical を付け、`?name=` 経由の流入は捨てる。
    #7 のURLパラメータ削除判断とも整合する

(c) 現状維持（canonical なし。Google の正規化任せ）

### 判断材料

- `?name=` 付きURLの内訳のエクスポート（別issue）
- 新サイトで選手個別ページを作る構想（#101 / docs/new-site-design.md）。
  そちらで解くなら現行サイトは (b) か (c) でよい

### 依存

#79 と実質同一の判断。片方だけ決めても着手できない。

### コメント (1件)

**retroeater** (2026-09-11):

### 判断（2026-09-11）: (c) 現状維持

現行サイトには `<link rel="canonical">` を付けない。正規化は Google に任せる。

理由:
- (a) を実現するにはクエリ文字列ごとに異なる HTML を返す仕組みが要る。
  現行は html_handling: none の Workers 静的アセット配信で、ビルド工程も
  持たない。Snippets/HTMLRewriter か選手1,099名分の静的ページ生成が必要になり、
  「現行サイトに作り込みすぎない」方針と衝突する
- (b) は Search Console 実測で検索流入の主力である `?name=` 付き14件を
  自ら捨てることになる
- 選手個別ページは新サイト（#101）で作る。title/description の出し分けも
  そちらで解くのが素直

#79 も同じ理由で新サイト送り。#7 のURLパラメータは一律そのまま引き継ぐ。

---
_Generated by [Claude Code](https://claude.ai/code)_

---

## #112 ナビバーの検索ボタンが、検索欄を持たないページでは何も起きない

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 状況: 待ち, 分野: UI/UX, 対象: 全ページ

### 本文

navbar.js は全ページに data-bs-toggle="collapse" href="#searchBoxes" の
虫眼鏡ボタンを出しているが、#searchBoxes を持たないページでは押しても
何も起きない。

### 該当ページ（7件）

- 404.html
- jpml_links.html
- resource_dictionary.html
- resource_efficiency.html
- rh_links.html
- rh_results.html
- rh_results_detail.html

### 経緯

静的ページ（404 / jpml_links / rh_links / resource_dictionary）では
従来から発生していた既存挙動。rh_results は #7 の静的化で他のテーブル
ページと同じ見た目になったため、「押せそうに見える」度合いが上がった。

~~resource_efficiency と rh_results_detail は #7 未移行。移行時に絞り込み欄を
持たせるかどうかで該当・非該当が変わるため、この issue の対応は #7 の
完了後に判断する。~~

**訂正（2026-09-12）**: resource_efficiency と rh_results_detail は #7 で
絞り込み欄なしとして移行済み（前者は表自体を持たずrender_content()、
後者はTableConfig.show_filter=False）。該当ページは上記7件で確定した。
「#7完了後に判断」の条件は解消したため、下記(a)/(b)/(c)を決められる。

### 対応案

- (a) navbar.js 側で #searchBoxes の有無を見て、無いページではボタンを
  出さない
- (b) 該当ページではボタンを disabled にする
- (c) 現状維持

### 優先度

低い。実害はなく、備忘として登録するもの。

### コメント (2件)

**retroeater** (2026-09-11):

## 動作確認結果

該当7ページすべてで虫眼鏡ボタンをクリックし、ブラウザのコンソールを確認した。

**Bootstrapの例外は出ない。** クリックしても何も起きないだけで、エラーも警告も発生しない。Bootstrapのcollapseプラグインは`data-bs-toggle="collapse"`のターゲット(`#searchBoxes`)が存在しない場合、静かに何もしない実装になっている。

したがって#4(Sentry導入)のノイズにはならない。優先度を上げる材料はなし。

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

resource_efficiency と rh_results_detail は #7 で絞り込み欄なしとして
移行済み。該当はindexを除き7ページで確定（404 / jpml_links /
resource_dictionary / resource_efficiency / rh_links / rh_results /
rh_results_detail）。「#7完了後に判断」の条件は解消したので、
(a)/(b)/(c) を決められる。

---

## #111 #7の型B 3ページ（Dashboard＋ローソク足）の移行方針を決める

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: パフォーマンス, 対象: 全ページ

### 本文

### 対象

`houou_results` / `ouka_results` / `wrc_results`

### 構造（2026-09-11 のコード調査＋実機確認で判明）

1ファイル内で `google.charts.load` を2回呼んでいる。

- `packages:['table','controls']` … `Dashboard` に `ControlWrapper` をバインドし、
  `Table`(`page:'enable'`) に接続する。**常時表示**（`?name`の有無に関わらず描画される）
- `packages:['corechart']` … `if(search_name)` の内側。**`?name` があるときだけ**
  別クエリでローソク足を描く。中身は選手個人の期別成績推移

つまりこのページは「表＋グラフ」ではなく、常時表示のダッシュボードに、
選手指定時だけグラフが足される構造になっている。

**3ページとも同一構造ではない。** 実機確認で以下の差分が判明した。

| ページ | コントロール | リーグ欄の型 | pageSize | 実描画行数(`?name`なし) |
| --- | --- | --- | --- | --- |
| `houou_results` | 名前・期・リーグ(3つ) | **CategoryFilter(ドロップダウン)** | 500 | 500(31ページ) |
| `ouka_results` | 名前・期・リーグ(3つ) | StringFilter(テキスト入力) | 100 | 100(16ページ) |
| `wrc_results` | **名前のみ(1つ)** | (欄自体が存在しない) | 100 | 100(16ページ) |

### 論点1: グラフ本体

**静的SVG化（旧選択肢c）は成立しない。** グラフが選手依存のため、
選手ごとに1枚ずつ事前生成することになり現実的でない。

残る選択肢は:
- (a) Google Charts 据え置き。`www.gstatic.com` は残り、#9 のCSPは
  `script-src` に gstatic を許可したまま確定できる。作業量は最小
- (b) Apache ECharts に載せ替え。セルフホスト可能で外部依存は増えないが、
  新サイトで作り直す予定のページに新しいライブラリを入れることになる

### 論点2: `?name` なしの既定表示が全件になる

| ページ | パラメータなしの行数(元データ) | 現在のDOM行数(Charts側のページング) |
| --- | --- | --- |
| `houou_results` | 15,416 | 500 |
| `ouka_results` | 1,580 | 100 |
| `wrc_results` | 1,507 | 100 |

現在DOM行数が小さく収まっているのは Google Charts の `page:'enable'` が
実際にDOMを分割しているため。**自前の `row.hidden` 方式（`.mj-pager`）に
置き換えると `houou_results` は15,416行がDOMに乗り、`saikyo_results`
(2,560行)を超えて #7 最大のDOM規模ページになる。**

対応案:
- `?name=` を必須にして、未指定時は表を出さない（挙動が変わる）
- ページ送りをDOMから行を出し入れする方式に作り直す（#24と同根の作業）
- 型Bだけ据え置く

### 論点3: ControlWrapper の置き換え

`table.js` には CategoryFilter（値をデータから自動生成するドロップダウン。
`houou_results`のリーグ欄のみが該当）に相当する部品がない。表を静的化
するなら新規に作る必要がある。`ouka_results`のリーグ欄はStringFilter
なので既存のtable.jsの絞り込みで代替できるが、`wrc_results`には
期・リーグの欄自体がなく、3ページを同じ設定で一括処理できない。

### 判断材料

- **カスタムツールチップも `addListener` も6ページとも存在しない。**
  使われているのは Google Charts 既定のホバーツールチップのみ
  （静的化で失われるインタラクションの実態はこれだけ。実機確認済み）
- アクセス実態は Cloudflare Pro の HTTP Traffic 分析でパス別に確認できる
- 型C（#127）・型D（#128）は本issueとは別に判断する

### コメント (3件)

**retroeater** (2026-09-11):

## 訂正: 静的SVGでもツールチップは失われない

本issueの本文で「ツールチップとホバー時の値表示は失われる」を静的化のデメリットとして挙げていたが、これは誤り。

各棒(または該当要素)を`<g>`で包み、内側に`<title>`要素を置くと、ブラウザが標準のホバーツールチップを表示する。JSもCSSも不要。

#128(型D、resource_efficiency)の実装でこの方式を使い、動作を確認済み。

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

据え置き（a）を早期に確定させる案: houou_resultsの15,416行は自前ページ
送りでは解けず、EChartsは新サイトで採用予定（docs/new-site-design.md
§5）。据え置きなら#9はscript-srcにwww.gstatic.com、connect-srcに
docs.google.comを含めて書け、#7のスコープが収束する。#127も同じ判断に
従う。採否は平野さんの判断。

**retroeater** (2026-09-11):

## 型C(#127)の完了を受けた選択肢の追加（2026-09-12）

本issueの本文では「ローソク足は `?name=` 依存のため、選手ごとに1枚ずつ
事前生成することになり静的SVG化は不成立」としているが、**#127 で
別の解き方が実証された。**

型Cでは、選手依存のデータ（折れ線）を**全選手分まとめてJSONに焼き込み、
`?name=` に応じてクライアント側で1本だけ描く**方式を採用した。
グラフの土台は静的SVG、外部ライブラリはゼロ。

- `houou_leagues_data.json` は 104KB（gzip 36KB）
- `?name=` 未指定時は fetch されない（既定選手の折れ線は静的SVGに焼き込み済み）
- 実測で mobile performance 98 / TBT 0ms

**ローソク足にも同じ方式が使える可能性がある。** 選手ごとのOHLCデータを
JSONにして、クライアントで1本だけ描く。Charts も ECharts も不要。

### ただし型Bには別の壁がある

型Cと違い、型Bには**表**がある。こちらは未解決のまま。

- `Dashboard` + `ControlWrapper` 3種（StringFilter×2 + CategoryFilter）。
  `table.js` に CategoryFilter 相当の部品がない
- `?name=` 未指定時の `houou_results` は15,416行。Google Charts の
  `page:'enable'` + `pageSize:500` が実際にDOMを分割しているため現状は
  成立しているが、自前の `row.hidden` 方式では #7 最大のDOM規模になる

**つまり本issueの論点は「グラフをどうするか」から「表をどうするか」へ
移った。** グラフ側は型Cの方式で解ける見込みが立っている。

### 検討すべきこと

- houou / ouka / wrc それぞれで、全選手分のOHLCデータをJSONにしたときの
  サイズ（型Cと同じく gzip後50KBを目安にする）
- 表の15,416行をどう扱うか。`?name=` 必須にする／ページ送りを
  DOM出し入れ方式に作り直す（#24と同根）／型Bだけ据え置く、の3択

---

## #110 GET/HEAD以外のHTTPメソッドをカスタムルールで遮断する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 状況: 待ち, 分野: セキュリティ, 対象: 全ページ

### 本文

- #76 の Events 確認（2026-09-11）で、24時間に `POST` 由来の検知が
  イベント数123件（`rayName` 重複を除くと63リクエスト）あった。
  React RCE（CVE-2025-55182）、Code Injection（CVE-2022-29078 /
  JavaScript）、SQLi - Equation の3系統で、いずれもスキャナ由来。
  React RCE の36リクエストは Referer を `www.ryoei.pro` に偽装し、
  SQLi - Equation の3リクエストは同一IPから UA を3種に
  入れ替えて送られていた
- このサイトは完全な静的配信で `<form>` が27ページ中0個。POST を
  受ける口が存在しないため、GET / HEAD 以外を遮断しても誤検知が
  起きる余地がない
- マネージドルールより前段で効くため、上記の検知はそもそも
  マネージドルールに到達しなくなる
- Pro でカスタムルールは20本まで使えて現在0本のため、枠の消費も問題ない
- #76 の Block 切り替えとは独立して効くので、#76 の完了を待たずに
  設定してよい
- 設定はダッシュボード操作（Security → WAF → Custom rules）

### コメント (4件)

**retroeater** (2026-09-11):

## 訂正: 「POSTを受ける口が存在しない」は誤り

起票時の本文で「このサイトは完全な静的配信で `<form>` が27ページ中0個。
POST を受ける口が存在しないため、GET / HEAD 以外を遮断しても誤検知が
起きる余地がない」と書いたが、これは誤り。

**Cloudflare Web Analytics のビーコンが POST を使う。**
`/cdn-cgi/rum` はデータ送信用に POST のみを受け付け、他のメソッドには
405 を返す（OPTIONS は CORS 用に許可）。ryoei.pro はゾーン配下で
自動注入しているため送信先は自ドメインの `/cdn-cgi/rum` で、
カスタムルールの対象範囲に入る。

これは #76 のコメント（2026-09-09）で既に警告していた内容だった。

## 設定する式

```
(not http.request.method in {"GET" "HEAD"}) and (not starts_with(http.request.uri.path, "/cdn-cgi/"))
```

アクション: Block

`/cdn-cgi/rum` だけでなく `/cdn-cgi/` 配下を丸ごと除外する。
Cloudflare が使う内部パスが他にもあるため。

## 設定後の確認

ブラウザで ryoei.pro を開き、開発者ツールの Network で
`/cdn-cgi/rum` への POST が 403 になっていないことを確認する。
あわせて翌日に Web Analytics のページビューが前日比で落ちて
いないかを見る。

**retroeater** (2026-09-11):

## 訂正: 「POSTを受ける口が存在しない」は誤り

起票時の本文で「このサイトは完全な静的配信で `<form>` が27ページ中0個。
POST を受ける口が存在しないため、GET / HEAD 以外を遮断しても誤検知が
起きる余地がない」と書いたが、これは誤り。

**Cloudflare Web Analytics のビーコンが POST を使う。**
`/cdn-cgi/rum` はデータ送信用に POST のみを受け付け、他のメソッドには
405 を返す（OPTIONS は CORS 用に許可）。ryoei.pro はゾーン配下で
自動注入しているため送信先は自ドメインの `/cdn-cgi/rum` で、
カスタムルールの対象範囲に入る。

これは #76 のコメント（2026-09-09）で既に警告していた内容だった。

## 設定内容（2026-09-11）

Security → WAF → Custom rules

| 項目 | 値 |
| --- | --- |
| Rule name | Block non-GET/HEAD methods |
| 式 | `(not http.request.method in {"GET" "HEAD"}) and (not starts_with(http.request.uri.path, "/cdn-cgi/"))` |
| アクション | Block（Default Cloudflare WAF block page / 403） |
| Status | Active |

`/cdn-cgi/rum` だけでなく `/cdn-cgi/` 配下を丸ごと除外している。
Cloudflare が使う内部パスが他にもあるため。

## 設定後の確認（2026-09-11）

ブラウザで ryoei.pro を開き、開発者ツールの Network で
`/cdn-cgi/rum` への POST が **204** で返ることを確認した
（Initiator は beacon.min.js）。403 にはなっておらず、
Web Analytics の計測は生きている。

## 残件

翌日（2026-09-12）に以下を確認してからクローズする。

- Web Analytics のページビューが前日比で落ちていないか
- Managed rules の Events から POST 由来の検知
  （React RCE / Code Injection / SQLi - Equation）が消えているか

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

本日9/12が確認日。平野さんが行う確認項目を再掲する。

- Web AnalyticsでPVの前日比を確認する
- Managed rules Events から、POST由来の検知が消えたか確認する

結果をここに記入してクローズすること。

**retroeater** (2026-09-11):

残件としていた2項目を確認した。いずれも問題なし。本issueをクローズする。

#### 1. Web Analytics のページビュー

Last 7 days で総ページビュー 500。カスタムルールを設定した9/11も
20〜22のピークが立っており、9/12は02:30時点で既に53。前日比での
落ち込みはない。

DevTools の Network でも `/cdn-cgi/rum` への POST が **204**
（Initiator: `beacon.min.js`）で返っており、除外式
`not starts_with(http.request.uri.path, "/cdn-cgi/")` は意図通り
効いている。Web Analytics の計測は完全に生きている。

#### 2. POST由来の検知

Security → Analytics → Events、Last 24 hours（9/11 02:31 〜
9/12 02:31 JST）、`HTTP Method equals POST` でフィルタ。

| Service | 件数 | 内訳 |
| --- | --- | --- |
| Custom rules | 19 | すべて `Block non-GET/HEAD methods` |
| Managed rules | 31 | すべて Log（Block 0件） |

Managed rules の31件は発生時刻が9/11の04:00〜12:00頃に集中しており、
**それ以降は0件**。内訳は Wordpress - Remote Code Execution 12、
React - RCE - CVE 6、React - Remote Code Execution 6、
Wordpress - SQL Injection 4、Vulnerability scanner 2 で、
起票時に挙げた系統と同じもの。

つまり31件はカスタムルール稼働前の残骸で、稼働後のPOSTは
マネージドルールに到達していない。カスタムルールがマネージドルールの
前段で評価されるという想定どおりの結果。

#### 補足

24時間フィルタなしの Events では、GETによる `.env` スキャンが
上位を占めていた。本ルールの対象外であり、#76 の判断材料になるため
そちらにコメントした。

---

## #109 docs間で#7の型分類が食い違っている

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-11 / クローズ: 2026-09-11
- ラベル: 分野: 整理・保守, 対象: 全ページ

### 本文

- docs/handover.md「#7 の進め方」の表は rh_results / rh_results_detail を
  型A（表とフィルターのみ）に入れているが、docs/lighthouse-baseline.md の
  行数調査表では「多列テーブル(型B)」になっている
- 実体は6列・8列で、型Aの共通部品（.mj-table-2col / .mj-table-3col）が
  そのままでは使えない。作業単位としては型Aと分けたほうが正確

### コメント (1件)

**retroeater** (2026-09-11):

docs/handover.mdに型A'(多列テーブル、表のみ)を新設し、rh_results/rh_results_detailを型Aから移した。あわせてdocs/lighthouse-baseline.mdの行数調査表の該当行、およびhouou_leagues/ouka_leaguesの型表記(型B→型C)も統一した。

4230b41 で対応済み。

---

## #108 .mj-table内のテキストリンクが縞模様背景に対してコントラスト不足

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 状況: 保留, 分野: UI/UX, 対象: 全ページ

### 本文

- docs/lighthouse-baseline.md「予想外だった点」で mobile accessibility 89
  の原因を「.mj-plainクラスのリンク」としているが、これは誤り。
  .mj-plain は text-decoration: none のみで色を指定していない（style.css:148）
- 実際の原因は、.mj-table 内のテキストリンクが Bootstrap 既定色 #0d6efd の
  ままであること。偶数行の背景 #fafafa（style.css:177）との組み合わせで
  コントラスト比 4.31 となり、WCAG AA の 4.5 を下回る
- 影響範囲は .mj-plain の有無と一致しない。セル内のテキストリンク数と
  .mj-plain の内訳:
  - jpml_pros 3,388件 / うち .mj-plain 0件
  - resource_logs 2,576件 / うち .mj-plain 2,576件
  - rh_paifu 57件 / うち .mj-plain 0件
  - video_wayhome 38件 / うち .mj-plain 38件
- 画像リンクのみのページ（jpml_titles / jpml_test / video_live / video_en /
  saikyo_mens / video_mtsuku）は該当しない。計測で a11y 94 だったのはこのため
- 修正案: style.css に `.mj-table td a { color: #0a58ca; }` を追加する。
  #0a58ca は Bootstrap の既定ホバー色で、#fafafa に対して約6.17:1。
  ただし採用前に実際の比率を計算して確認すること
- 注意: この変更は jpml_pros の 3,388件のリンクの見た目に及ぶ。
  適用後に jpml_pros / resource_logs / rh_paifu / video_wayhome の
  4ページを目視確認し、平野さんに見てもらってからコミットする

このissueはまだ修正せず、起票のみ。色の最終決定は別途相談する。

---

## #107 新サイトのUI方針を決める（カードUI・段階的開示・ダークモード）

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 状況: 保留, 分野: UI/UX, 対象: index

### 本文

- #101（新サイトの第一弾＝トップページ）の設計時に決める項目
- カードUIパターン: 現行の本質は表形式だが、選手個別ページの構想とは相性がよい
- モバイルファースト設計: 上記の実測結果を見てから決める
- 段階的開示: #24（五十音タブ）がまさにこれ。INP 458ms の根本解決策として既に方針決定済み。新サイトで実装する
- ダークモード: 現行CSSは色がベタ書きのため変数化から必要。新サイトで最初から入れるほうが安い
- CSS text-box（text-box-trim）: タイポグラフィの余白調整。デザインを詰める段階で検討する
- @starting-style / transition-behavior: allow-discrete / linear() / Web Animations API: アニメーションを入れるなら、その時点で併せて検討する

---

## #106 訪問者のデバイス比率を実測する

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 分野: UI/UX, 対象: 全ページ

### 本文

- モバイルファースト設計を採るかどうかの判断材料。現在は推測で話している
- Cloudflare の HTTP Traffic 分析（Analytics → Traffic）で Source device type の内訳が見られる（Pro機能）。Freeでは出ない
- あわせて Search Console 側のデバイス別データも確認する
- 結果は #101（新サイトのトップページ）の設計方針に反映する

---

## #105 ページの先読み（Speculation Rules API）の要否を判断する

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 状況: 待ち, 分野: パフォーマンス, 対象: 全ページ

### 本文

- <link rel="prefetch"> は、この構成では有害な可能性がある。移行済みページは resource_logs 1.77MB / video_live 1.55MB / jpml_titles 782KB で、押されるとは限らないリンク先を先読みすると転送量だけが膨らむ。実測のページビューは1日114、訪問75（2026年9月9日、約10時間分）
- <link rel="prerender"> はChrome独自かつ非推奨。Speculation Rules API に置き換わっている
- Speculation Rules API は Baseline ではなく、広く使われているブラウザの一部で動かない。CSP を入れる場合は script-src での許可も必要（#9と関連）
- やるなら eagerness を絞り、ホバー時のみ先読みする形になる
- #7 の完了後、ページ構成が固まって Lighthouse の実測が出てから判断する

### コメント (2件)

**retroeater** (2026-09-11):

### Speed Brain では代替できないことが確定した（2026-09-11）

#119 の判定により、Cloudflare の Speed Brain は Workers 静的アセット配信では
prefetch が拒否される（`disabled for worker requests`）ことが分かった。
「Cloudflare の設定だけで済ませる」選択肢は消えた。

### 残る選択肢

(a) 自前で Speculation Rules を HTML に書く
    - 27ページすべての `<head>` に `<script type="speculationrules">` を追加する
      作業になる（生成ページは scripts/lib/page.py 側で一括対応できる）
    - Cloudflare のエッジ prefetch を介さないため、`disabled for worker requests`
      の制約は受けない。ブラウザが直接取りに行く
    - CSP（#9）で `script-src` に inline script の許可が必要になる。
      「インラインハンドラの排除」を進めてきた方針と逆行する

(b) 見送る

### 判断材料

- 平均的な訪問者が何ページ遷移するか。1ページで離脱するなら prefetch の
  出番自体がない。#90（Bot Report）や Web Analytics の指標で確認できる
- #24（五十音タブ）や #101（新サイト）で情報設計が変わる予定があり、
  遷移パターンも変わる可能性がある

### 依存

#9 と併せて判断する。CSP のポリシーが固まる前に inline script を増やさないこと。

**retroeater** (2026-09-11):

### Cloudflare 側の prefetch 手段は完全に潰れた（2026-09-11）

Speed → Content Optimization に **Prefetch URLs** という項目があるが、
**Requires an Enterprise plan** と明記されている。

Speed Brain が Workers 静的アセットで拒否される（#119）ことと合わせて、
Cloudflare の設定だけで prefetch を実現する手段は残っていない。

このissueは「自前で Speculation Rules を HTML に書く」か「見送り」の
二択で確定。判断材料は既存コメントのとおり。

---

## #104 Bootstrap JSの依存を棚卸しし、Popover APIへの置換を検討する

- 状態: OPEN / 作成: 2026-09-11
- ラベル: 状況: 待ち, 分野: パフォーマンス, 対象: 全ページ

### 本文

- ナビのドロップダウンが bootstrap.bundle.min.js に依存している。Popover API（ネイティブ）に置き換えられれば、JSを1本減らせる可能性がある
- 前提として、bootstrap.bundle.min.js が他のどの機能で使われているかの棚卸しが必要。ドロップダウンだけなら外せる
- #9（CSP）とは相乗効果がある（インラインJSと外部JSが減る）
- ただし「現行サイトに作り込みすぎない」方針とは緊張関係にある。#7 が終わってから、投資に見合うかを判断する

---

## #103 生成済みページの定期再生成を検討する

- 状態: OPEN / 作成: 2026-09-10
- ラベル: 状況: 待ち

### 本文

## 背景

#7で生成時焼き込みに移行したページ(jpml_pros / jpml_titles / jpml_test / resource_logs / video_live)は、スプレッドシートの更新が自動では反映されない。`regenerate-page.yml` はスクリプト(`scripts/generate_*.py`)や対応する`.js`の変更をpushで検知する作りで、スプレッドシートの変更そのものは検知しないため。

現在はワークフローを`workflow_dispatch`で手動実行するしかない（`target_page`にページ名、または`all`）。

## 検討事項

- 定期実行の要否と頻度（週次など）
- 対象を`all`にするか、ページごとに個別のスケジュールを持つか
- 差分がないときに無駄なコミットを作らない仕組み（現状の「変更なし」判定で足りるか）
- 更新頻度の実態（どのシートがどれくらいの頻度で変わるか）を踏まえた頻度設計

## 進め方

#7の完了後、生成対象が出そろってから判断するのがよい。

### コメント (2件)

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

移行済みは14ページになった（起票時は5ページ）。14ページ分のデータが
手動実行に依存しており、運用リスクとして最大。#7の完了を待たず、
週次cron（workflow_dispatchと同じallを回し、差分がなければコミットしない
現行の判定をそのまま使う）で先に着手する案を提案する。採否は平野さんの
判断。

Projectsボードでの優先順位変更は平野さんが実施。

**retroeater** (2026-09-11):

### 判断: 採用（2026-09-12）

#7の完了を待たず、週次cronを先行導入した（c73279a）。

- 既定ブランチが`cloudflare`であることを確認済み（scheduleは既定ブランチ上のワークフローファイルのみ対象のため必須の前提）
- `schedule`を追加（毎週日曜20:37 UTC=月曜05:37 JST。毎時00分は実行が集中し遅延しやすいため37分にずらした）
- 実行ロジックの分岐を「pushかどうか」に反転。schedule/workflow_dispatchはどちらも`all`相当（inputsが空なら`all`にフォールバック）で回す
- 差分がなければコミットしない既存の判定（`git diff --cached --quiet`）はそのまま流用。新規実装は不要だった

導入後に確認すること:
- 初回のスケジュール実行がActionsタブで走ること（初回発火まで遅れることがある）
- 差分がない週に「変更なし」で終わり、無駄なコミットが増えないこと
- 14ページ全量の実行時間。長すぎる場合はページごとの分割を再検討する

Projectsボードでの優先順位変更は平野さんが実施。

---

## #102 「帰り道」ページを動画中心のデザインに作り変える

- 状態: OPEN / 作成: 2026-09-10
- ラベル: 状況: 待ち, 分野: 整理・保守, 対象: video_wayhome

### 本文

video_wayhome.html を、表形式ではなく動画を主役にした
デザインに作り変える。最新話を大きく見せることを想定。

## 段階を分けて進める（決定済み）

### 第1段: 最新話のサムネイルを大きく配置する

- 最新話のサムネイル画像をヒーロー的に大きく置き、
  クリックで再生する
- 外部依存は i.ytimg.com のみ。frame-src は不要
- サムネイルは1枚数十KBで、転送量への影響は小さい
- 自動再生の制約もアクセシビリティの問題も発生しない
- その下に既存の一覧（検索・絞り込み）を残す

### 第2段: 背景動画の自動再生（別途検討）

第1段で物足りない場合に検討する。
本issueでは第1段のみを対象とする。

## 最新話の判定方法（決定済み）

スプレッドシートで最も日付が新しい行（通常は一番上の行）を
最新話とする。

#3（YouTubeチャンネルアイコンの一致確認）で API キーが
発行された後は、API による取得に切り替えることを検討する。
ただし本issueは API を前提としない。

## 依存: #7 の後に着手する

video_wayhome.html は #7（他21ページのGoogle Charts依存を
解消する）の対象ページの1つ。

進め方の順序は以下とする。

1. #95 でテーブル描画方式を確定させる
2. #7 で21ページすべてに適用する（video_wayhome も含む）
3. そのうえで、video_wayhome だけをテーブル形式から
   抜いて動画中心にするかを検討する

先に本issueに着手すると #7 のスコープが不安定になるため、
順序を守ること。

## 着手時の留意点

### アクセシビリティ

prefers-reduced-motion に配慮する。第1段は静止画のため
問題は小さいが、ホバー時のアニメーション等を入れる場合は
この指定を尊重すること。

### CSP（#9）への影響

第1段で必要になるのは img-src への i.ytimg.com の追加のみ。
第2段（背景動画）に進む場合は frame-src に
www.youtube-nocookie.com が必要になる。

外部ドメインを減らす方針の例外となるが、
このページに限定されるため許容する（判断済み）。

### サムネイルのURL

YouTube のサムネイルは動画IDから規則的に生成できる。
maxresdefault が存在しない動画があるため、
フォールバックの考慮が必要。

---

## #101 トップページをテンプレートから脱却して作り直す

- 状態: OPEN / 作成: 2026-09-10
- ラベル: 状況: 保留, 分野: 整理・保守, 対象: index

### 本文

index.html を iPortfolio テンプレートから脱却させる。
診断は #15 を参照。

## 位置づけ: 新サイトの第一弾として実施する

docs/new-site-design.md の新サイト構想において、
最初に着手する対象とする。

理由:
- 他26ページと構造が独立しており（#15）、依存が最も少ない
- 現行スタックで作り込むと新サイトで再度作ることになる
- Astro の試作対象としても適している（#20 参照）

## 情報設計（決定済み）

トップページは**個人の実績を見せる場**である。
選手データベースは平野良栄個人のポートフォリオを構成する
要素の一つという位置づけ。

現行のセクション構成
（hero / about / facts / resume / portfolio）は
情報設計としては妥当。作り直しは中身の質の問題として扱う。

## 同時に解消されること

| 項目 | 内容 |
| --- | --- |
| ライセンス制約 | BootstrapMadeへのリンク義務がなくなる |
| index.css | 12KB・645行の別系統CSSが不要になる |
| index専用ライブラリ | 232KB（#98参照）。演出を作り直す前提 |

## 着手前に決めること

1. 現行の演出のうち何を引き継ぐか
   （タイピング風アニメーション、数字のカウントアップ、
   　スクロールフェードイン、ライトボックス、portfolio絞り込み）
   引き継ぐ場合、Astro でどう実装するか
2. portfolio に何を並べるか
   （選手データベース、note連載、マインドアスリート出演 など）
3. 新サイトのスタックを確定させる（#21）

## 依存

#21（Astroへの移行を検討する）の判断が前提。

---

## #100 フッターの「© Copyright iPortfolio」を修正する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-10 / クローズ: 2026-09-10
- ラベル: 分野: 整理・保守, 対象: index

### 本文

index.html の349行目が、テンプレートのプレースホルダのまま
になっている。

  &copy; Copyright <strong><span>iPortfolio</span></strong>

サイト名にも運営者名にもなっていない。

## 作業

適切な表記に変更する。表記内容は要確認。

## 注意

同じフッター内の以下は削除しないこと。

  Designed by <a href="https://bootstrapmade.com/">BootstrapMade</a>

BootstrapMade の無料テンプレートのライセンス条件により、
Pro版を購入しない限りこのリンクは残す必要がある
（HTMLコメントにも明記されている）。

トップページを作り直す際（別issue）にテンプレートから
完全に離れれば、この制約もなくなる。

## 他ページとの整合

他26ページのフッター表記を確認し、揃えるかどうかを判断すること。

### コメント (2件)

**retroeater** (2026-09-10):

## ライセンス上の確認: 変更して問題ない

BootstrapMade の無料ライセンスで残す義務があるのは
フッターのクレジット行「Designed by BootstrapMade」のみ。
テンプレートファイルのカスタマイズ自体は自由とされている。

「© Copyright iPortfolio」はクレジットではなく、
サイト運営者名を入れるためのプレースホルダである。

HTMLの構造上も、保護対象を示すコメント
（All the links in the footer should remain intact）は
credits の div 内にあり、copyright の div の外側にある。
copyright 側にリンクは含まれていない。

現状はサイトの著作権表示が「iPortfolio」名義になっており、
事実と異なる状態である。

なお無料ライセンスは個人利用の範囲であることが前提。

## 変更後の表記（決定）

(C) Ryoei Hirano

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

**retroeater** (2026-09-10):

## 完了(コミット d7b7bad)

### 他ページとの整合の判断

`grep -n "copyright\|Copyright\|&copy;\|©" *.html | grep -v index.html`
は0件。他26ページには著作権表示自体が存在しないため、
index.html単独で対応した。統一の判断は不要だった。

### 変更内容

index.html 349行目を変更。

- 変更前: `&copy; Copyright <strong><span>iPortfolio</span></strong>`
- 変更後: `&copy; Ryoei Hirano`

年号は入れていない(毎年の更新作業を避けるため)。
「Copyright」の語は`&copy;`と重複するため省いた。

「Designed by BootstrapMade」のクレジット行と、
根拠を示すHTMLコメント4行はそのまま残した。

### 確認結果

index.css の `#footer .copyright` は `text-align: center` のみで、
`strong`/`span` 固有の指定はなかったため、CSS調整は不要だった。

wrangler dev上でPlaywright(Chromium)により実描画・スクリーンショット
で確認。「© Ryoei Hirano」「Designed by BootstrapMade」の両方が
表示され、見た目の崩れもない。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

---

## #99 bootstrap.bundle.min.jsのソースマップ参照で404が発生している

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-10 / クローズ: 2026-09-10
- ラベル: 分野: 整理・保守, 対象: 全ページ

### 本文

/assets/vendor/bootstrap/js/bootstrap.bundle.min.js.map への
リクエストが24時間で28件発生し、すべて404になっている。

## 原因

assets/vendor/bootstrap/js/bootstrap.bundle.min.js の末尾に
以下のコメントが残っている。

//# sourceMappingURL=bootstrap.bundle.min.js.map

しかし .map ファイルはリポジトリに含まれていないため、
開発者ツールを開いた閲覧者のブラウザが取得を試みて404になる。

脆弱性スキャンによる404とは異なり、これは当方に起因するもの。
実害はないが、404の集計に恒常的にノイズが混ざる。

## 対応案

A. bootstrap.bundle.min.js から sourceMappingURL の行を削除する
   最小の変更。ただしライブラリのファイルに手を入れることになる
   ため、Bootstrap更新時に再発する。更新手順に注記が必要

B. .map ファイルを配置する
   404は消えるが、閲覧者に不要なファイルを配信することになる
   （サイズも大きい）

A を推奨。

## 作業

1. 対象ファイルを確認する

   grep -rn "sourceMappingURL" assets/

   bootstrap.bundle.min.js 以外にも残っている可能性があるため、
   assets 配下を一括で確認すること
   （style.min.css 等にも同種の記述があることがある）

2. 該当行を削除する

3. ブラウザの開発者ツールを開いた状態で全ページを表示し、
   .map への404が発生しないことを確認する

4. CLAUDE.md か README にライブラリ更新時の注記を追加する
   「vendor配下のライブラリを更新した際は
   　sourceMappingURL の行を削除すること」

## 確認（数日後）

Cloudflare の HTTP Traffic 分析で
Edge status code = 404 を絞り込み、
.map へのリクエストが消えていること。

### コメント (3件)

**retroeater** (2026-09-10):

## 対象ファイルの調査結果

sourceMappingURL が残っているのは Bootstrap の2ファイルだけ
ではなかった。assets 配下を一括で確認した結果は以下のとおり。

| ファイル | 今回の対象 |
| --- | --- |
| assets/vendor/bootstrap/js/bootstrap.bundle.min.js | ○ |
| assets/vendor/bootstrap/css/bootstrap.min.css | ○ |
| assets/vendor/purecounter/purecounter_vanilla.js | 対象外 |
| assets/vendor/typed.js/typed.umd.js | 対象外 |

## CSSも対象に含める理由

404の実測に現れていたのは .js.map への28件のみだが、
これはCSSのソースマップが「開発者ツールでCSSを操作したとき」
にしか取得されないため。潜在的には同じ問題を抱えている。

## purecounter と typed.js を対象外とする理由

いずれも index.html からのみ参照されているライブラリであり、
#98（index.htmlだけが参照している未使用ライブラリを整理する）
で削除される可能性がある。

先に手を入れると無駄になるため、#98 の判断を待つ。
#98 でこれらを残すと決まった場合は、本issueと同じ対応を
その時点で行うこと。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

**retroeater** (2026-09-10):

## 完了

対象2ファイルの sourceMappingURL コメントを削除した(コミット 37df205)。

| ファイル | 削除前 | 削除後 | 差分 |
| --- | --- | --- | --- |
| bootstrap.bundle.min.js | 80,496 B | 80,447 B | -49 B |
| bootstrap.min.css | 232,111 B | 232,065 B | -46 B |

削除後、`grep -rn "sourceMappingURL" assets/vendor/bootstrap/` は0件。

## 動作確認

minifyされたファイルを直接編集したため、Playwright(Chromium)で
wrangler dev上を実操作して確認した。

- 全27ページ: 読み込み・CSS適用(font-family解決)を確認。
  Networkに `.map` へのリクエストは0件
- houou_leagues.html: ハンバーガー(navbar-toggler)クリックで
  ナビが実際に開くことを確認(Bootstrap JS動作)
- jpml_pros.html: 検索ボックスの開閉を実クリックで確認、
  1,100行のテーブル描画も正常

なお jpml_pros.html / jpml_test.html / jpml_titles.html は
外部の選手画像・Google Chartsの読み込み待ちで`networkidle`が
成立しにくく(今回の変更とは無関係、以前から)、`load`イベント基準に
切り替えて確認した。

ローカルのwrangler dev環境でCloudflare Web AnalyticsビーコンのCORS
エラーが全ページで出たが、これは`/cdn-cgi/rum`が本番ゾーンでしか
機能しないための既知のローカル限定事象で、本件とは無関係。

## CLAUDE.mdへの追記

vendor配下のライブラリを更新・追加した際は sourceMappingURL
コメントを削除する旨を追記した。

## 数日後の確認

Cloudflare の HTTP Traffic 分析で Edge status code = 404 を
絞り込み、bootstrap.bundle.min.js.map へのリクエストが
消えていることを確認する。2026-09-13 以降。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

積み残しの追跡用: #134

---

## #98 index.html専用ライブラリのうちphp-email-formを削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-10
- ラベル: 分野: 整理・保守, 対象: index

### 本文

#94 の調査中に判明した。assets/vendor 配下に以下が残っており、
いずれも index.html 1枚からしか参照されていない。

- aos
- glightbox
- isotope-layout
- php-email-form
- purecounter
- typed.js
- waypoints

#59(assets/vendorの未使用ファイルを整理する)で他ページの
整理は完了したが、index.html は別系統の構造(#15)であるため
手つかずになっていたとみられる。

これらが index.html で実際に機能しているのか、
テンプレート由来の残骸なのかを確認する必要がある。

#15(index.htmlが別系統の構造になっている件)と併せて
判断するのが妥当なため、保留とする。

### コメント (3件)

**retroeater** (2026-09-10):

## 訂正: 7つのうち6つは稼働中だった

「未使用ライブラリ」としていたが誤り。index.js から
実際に初期化されており、削除すると挙動が失われる。

| ライブラリ | 用途 | サイズ | 判定 |
| --- | --- | --- | --- |
| glightbox | portfolioの画像ライトボックス | 84K | 稼働中 |
| aos | スクロール時のフェードイン | 52K | 稼働中 |
| isotope-layout | portfolioの絞り込み | 40K | 稼働中 |
| waypoints | スクロール位置の検知 | 28K | 稼働中 |
| typed.js | heroのタイピング風アニメーション | 16K | 稼働中 |
| purecounter | factsの数字カウントアップ | 12K | 稼働中 |
| php-email-form | PHPフォームの検証 | 8K | **未使用** |

## スコープを php-email-form のみに変更する

php-email-form は PHP 用のフォーム検証ライブラリであり、
静的配信の当環境では機能しない。確実に削除できる。

残り232KBの削除には「その演出をやめる」という設計判断が必要で、
トップページの作り直し（別issue、新サイトで実施）の際に
自然に解消される。作り直しまでの間トップページの演出が
失われる状態を作るべきではないため、本issueでは扱わない。

## 作業

1. index.html から以下を削除
   <script src="assets/vendor/php-email-form/validate.js"></script>

2. index.html 内の php-email-form 関連の記述
   （フォーム要素、class="php-email-form" 等）を確認する。
   フォーム自体が機能していない場合の扱いは #30
   「メール送信の手段を検討する」の範囲とし、本issueでは
   スクリプトの削除に留めてよい

3. git rm -r assets/vendor/php-email-form

4. 確認
   - grep -rn "php-email-form" . --exclude-dir=.git が0件
   - トップページで Console にエラーが出ないこと
   - スクロールフェードイン・カウントアップ・ライトボックス・
     portfolio絞り込みが従来どおり動くこと

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

**retroeater** (2026-09-10):

## 調査結果: 参照は script タグ1行のみ

php-email-form の参照箇所を確認したところ、
index.html の371行目にある script タグ1行だけだった。

- <form> 要素は index.html に存在しない
- class="php-email-form" を持つ要素も存在しない
- お問い合わせフォームのセクションは既に削除済み

つまり validate.js は読み込まれた後、対象要素を
0件検出して何もせずに終わっている状態だった。

#30（メール送信の手段を検討する）に踏み込む必要はない。
スクリプトの削除とファイルの削除のみで完結する。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

**retroeater** (2026-09-10):

## 完了(コミット 90eaff2, 5c29413)

- assets/vendor/php-email-form/validate.js を削除
- index.html のscriptタグを削除
  （最初のコミットで削除漏れがあり、追加コミットで対応）

| | サイズ |
| --- | --- |
| 削除前 assets/vendor/ | 564K |
| 削除後 assets/vendor/ | 556K |
| 削減 | 8K |

削除後 `grep -rn "php-email-form" . --exclude-dir=.git --exclude=docs/issues-snapshot.md`
は0件。

## 動作確認

wrangler dev上でPlaywright(Chromium)により実際に操作して確認した。
残る6ライブラリすべて問題なし。

- typed.js: heroのタイピング風アニメーションが動作
- purecounter: factsの数字が0→4までカウントアップ
- aos: スクロールでaos-animateクラスが付与されフェードイン
- isotope-layout: portfolio7件が正しくレイアウトされる
- glightbox: 画像クリックでライトボックスが開く（スクリーンショットで確認）
- validate.js / php-email-form へのリクエストは0件
- Console上の想定外エラーなし
  （Cloudflare Web Analyticsビーコンのローカル限定CORSエラーのみ。既知の無関係事象）

## 残り232KBについて

glightbox / aos / isotope-layout / waypoints / typed.js /
purecounter の6つは index.html で稼働中のため本issueでは
削除しない。

これらは「トップページをテンプレートから脱却して作り直す」
（#101・新サイトで実施）の中で、演出を作り直す際に
解消される。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

---

## #97 書籍ページをAmazon APIで作り変える

- 状態: OPEN / 作成: 2026-09-09
- ラベル: 状況: 保留, 分野: 自動化

### 本文

リソース配下の書籍ページについて、Amazon Product
Advertising API の利用を検討する。

## 前提

現行の27ページに書籍に該当するページは存在しない。
新規に作るか、既存ページの一部を切り出す想定。

## 保留の理由

Amazon PA-API はアソシエイト・プログラムへの参加が前提であり、
一定期間内に売上実績がないとAPIアクセスが停止される。
書籍紹介が主目的で収益化の導線を作らない場合、
運用の前提を満たせない可能性がある。

## 判断に必要なこと

1. アフィリエイトリンクを設置するか
   サイトの位置づけ(麻雀の普及・企業案件の入口)と
   収益化の導線が噛み合うかの判断が要る
2. APIを使わない場合の代替
   書影・書誌情報を手作業で登録する。
   冊数が少なければこちらで十分
3. 掲載する書籍の範囲と冊数

## 次のアクション

上記1〜3を決める。決まるまでは着手しない。

### コメント (1件)

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

「決まるまで着手しない」状態で、決める場が設定されていない。判断する日を決めるか、状況: 保留を付けて新サイト着手時に再検討する扱いにするかを平野さんが決める。

---

## #96 Google Workspace APIでカレンダーの参照・更新を自動化する

- 状態: OPEN / 作成: 2026-09-09
- ラベル: 状況: 保留, 分野: 自動化

### 本文

リソース配下にカレンダー機能を設けることを検討する。

## 前提

現行の27ページにカレンダーに該当するページは存在しない。
新規に作る想定。

## 決めるべきこと

1. 何のカレンダーか
   (対局日程 / 連盟の公式行事 / 自身の予定 など)
2. 誰が見るのか。公開か限定公開か
   限定公開なら #29(認証)に依存する
3. 参照だけか、サイトから更新もするのか
   更新を行う場合は書き込み権限とシークレット管理が必要になる
4. 情報源はどこか
   Googleカレンダー / スプレッドシート / 手入力

## 技術的な論点

- 現在スプレッドシートの取得には gviz エンドポイントを
  使っている(scripts/lib/sheets.py)。これは公式に
  ドキュメント化されていない事実上の内部APIであり、
  Google側の都合で変わる可能性がある。
  Workspace API に寄せるなら、この置き換えも併せて
  検討する価値がある
- 認証はサービスアカウントを使う。
  GitHub Actions のSecretsに鍵を置く運用になる
- 参照のみでよければ、カレンダーの公開URLから
  ICS形式を取得してビルド時に静的化する方法もある。
  APIを使わずに済むため、まずこちらで足りないか確認する

## 次のアクション

上記1〜4を決める。決まるまでは着手しない。

### コメント (1件)

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

「決まるまで着手しない」状態で、決める場が設定されていない。判断する日を決めるか、状況: 保留を付けて新サイト着手時に再検討する扱いにするかを平野さんが決める。

---

## #95 #7のテーブル描画方式を比較検討する

- 状態: OPEN / 作成: 2026-09-09
- ラベル: 状況: 保留, 分野: パフォーマンス

### 本文

#7 で21ページのGoogle Charts依存を解消するにあたり、
テーブルの描画方式を先に決める必要がある。

## 背景

jpml_pros.html は自前実装で描画している。その結果として
以下のissueが派生した。

- #24 五十音タブで表示件数を絞る(1,100人の一覧が重い)
- #83〜#87 INPの測定と改善

21ページを同じ自前方式に移すと、同種の問題を21回抱えることになる。

## 候補

### A. 自前実装(jpml_pros.html と同じ方式)
- 依存が増えない
- #24 のような問題を個別に解き続ける必要がある

### B. AG Grid (Community版・MITライセンス)
- ソート・フィルタ・仮想スクロールを標準で持つ
- #24 が不要になる可能性がある
- 依存が1つ増える

### C. その他の軽量テーブルライブラリ

## 比較の観点

1. バンドルサイズ
   Google Charts を消したいのに、より重い依存を足しては本末転倒。
   現状 gstatic.com/charts/loader.js が何KB相当か測ってから比べる
2. 配信方法
   CDN読み込みだと外部ドメインが増え、#9(CSP)の前提が崩れる。
   セルフホストできるか
3. ライセンス
   AG Grid は Community版がMIT、Enterprise版は有償。
   使いたい機能が Community 版に含まれるか
4. 1,100行を描画したときのINP
   #83 で測定した手法をそのまま使える
5. 21ページの列構成の差異を吸収できるか

## 進め方

jpml_titles.html 1枚で候補AとBを実装して比較する。
#7 の「まず1ページで型を作る」方針と両立する。

## 依存

#7 の着手前に決着させること。

### コメント (1件)

**retroeater** (2026-09-10):

## 位置づけを変更する

本issueは #7 の前提ではなく、**#7 の完了後に新規構築の
文脈で検討する**ものとする。

### 理由

#7 は現行方式（jpml_pros.html と同じ自前実装）で
21ページを揃える。

当初「#24 のような問題を21回抱えることになる」と
懸念したが、#24 が生じたのは jpml_pros.html が1,100行を
扱うためであり、21ページの成績表はより小規模である。
同種の問題が同じ規模で発生するとは限らない。

ライブラリ（AG Grid 等）の選定は、新サイトの
スタック決定（#21）と併せて判断するほうが筋が通る。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

---

## #94 アイコンフォント2種を廃止してSVGに置き換える

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-10
- ラベル: 分野: パフォーマンス, 対象: 全ページ

### 本文

実際に使っているアイコンは12種類だけなのに、
アイコンフォントを2セット読み込んでいる。

## 現状

| ファイル | サイズ |
| --- | --- |
| assets/vendor/bootstrap-icons/fonts/bootstrap-icons.woff2 | 121KB |
| assets/vendor/boxicons/fonts/boxicons.woff2 | 同程度 |

全27ページで使用されているアイコンのクラスは12種類。
(bi-* と bx-* を合わせた実測値)

## 作業

1. 使用中のアイコン12種類を正確に列挙する

   grep -oh 'class="[^"]*\(bi-\|bx-\)[^"]*"' *.html \
     | grep -o '\(bi\|bx\)-[a-z0-9-]*' | sort -u

2. 各アイコンのSVGを取得する
   Bootstrap Icons・Boxicons ともMITライセンス。
   assets/vendor 配下に元ファイルがあればそこから、
   なければ公式リポジトリから取得する

3. HTMLの <i class="bi-xxx"></i> をインラインSVGに置き換える
   サイズと色はCSSで制御できるよう、SVGには
   fill="currentColor" と width/height の指定を入れる

4. 以下を削除する
   - assets/vendor/bootstrap-icons/ 一式
   - assets/vendor/boxicons/ 一式
   - 各HTMLからのCSS読み込み行
   - style.css / index.css に残る関連指定

5. scripts/generate_jpml_pros.py のテンプレートも同様に更新

## 注意

同じアイコンが多数のページで繰り返し使われる場合、
インラインSVGはHTMLサイズを増やす。
navbar.js が動的に生成しているアイコンがあれば、
そちらはJS側で一度定義して使い回す形にすること。

## 依存

#92(キャッシュヘッダ)より先にやること。
vendor配下のファイル構成が変わるため、
先にキャッシュ設定を入れると手戻りになる。

### コメント (2件)

**retroeater** (2026-09-09):

## 訂正: 12種類ではなく19種類

当初の調査が class="..." の形に限定されており、
拾い漏れがあった。正しい内訳は以下のとおり。

### HTML(17種類)

| アイコン | 出現数 |
| --- | --- |
| bi-chevron-right | 8 |
| bx-plus | 7 |
| bx-link | 7 |
| bi-table | 2 |
| bxl-twitter / bxl-facebook / bxl-linkedin / bxl-github / bxl-imdb | 各1 |
| bx-user / bx-home / bx-file-blank | 各1 |
| bi-list / bi-lightbulb / bi-emoji-smile / bi-briefcase / bi-arrow-up-short | 各1 |

### JS(3種類)

| アイコン | 出現数 |
| --- | --- |
| bi-x | 2 |
| bi-list | 2 |
| bi-search | 1 |

bi-list はHTMLとJSの両方に存在する。
**JS側を見落とすと置き換えが漏れる**ので注意すること。

## bxl-* について(確認済み)

index.html のソーシャルリンク群にある bxl-* の5種類
(twitter / facebook / linkedin / github / imdb)は、
いずれも本人が現在使用しているアカウントへのリンクであり、
テンプレート由来の残骸ではない。削除せず、そのままSVGに
置き換えること。

したがって変換対象は19種類。

なお boxicons のブランドアイコン(bxl-*)は、
bootstrap-icons 側にも同名のアイコンが存在するものがある
(twitter / facebook / linkedin / github)。
どちらから取るかは見た目の統一を優先して決めてよいが、
IMDbのアイコンは bootstrap-icons に存在しないため、
boxicons 側から取得する必要がある。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

**retroeater** (2026-09-10):

削除前の確認と、実際の操作による動作確認を行った。

## 【1】置き換え漏れの確認 — 全て0件

```
grep -rn '\(bi\|bx\|bxl\|bxs\)-[a-z0-9-]*' *.html *.js --include=* | grep -v '\.svg'  → 0件
grep -rn '\(bi\|bx\|bxl\|bxs\)-[a-z0-9-]*' scripts/                                    → 0件
grep -rn 'class="[^"]*\b\(bi\|bx\)\b' *.html *.js scripts/                             → 0件
```

navbar.js・jpml_pros.js（検索ボックス開閉）を個別に全文検索したが、
文字列連結等での組み立ても含めて残存なし。

## 【3】動作確認 — Playwright(Chromium)でwrangler dev上を実操作

目視ではなく、実際のクリック・スクロール・ホバーで確認した。

| 対象 | 結果 |
| --- | --- |
| index.html 上部へ戻る | スクロールで出現→クリックで最上部へ戻ることを確認(scrollY: 2000→38) |
| index.html ソーシャルリンク | 5アイコンとも18px角で統一。Xアイコンは新ロゴ(`M12.6.75h2.454...`)で旧の小鳥ロゴは残っていない |
| index.html ハンバーガー | モバイル幅(390px)で可視・クリック可能、data-icon が list⇄x で正しくトグルし、bodyにmobile-nav-activeが付与されることを確認 |
| index.html chevron(8箇所) | 全て検出。サイズは16px、隣接テキスト(24px)に対して比率も妥当 |
| index.html Facts(絵文字/電球/表アイコン) | 44px・色#149ddd で正しく表示（スクリーンショットで目視確認済み） |
| index.html Portfolio(+ / リンクアイコン) | ホバーで28pxのオーバーレイアイコンが正しく表示（スクリーンショットで目視確認済み） |
| jpml_pros.html 検索ボックス | 開閉とも正常。開→閉まで実クリックで確認 |
| jpml_pros.html 表 | 1,100行描画・スクロール後も行数維持・ソートクリックでエラーなし |

**jpml_pros.html の「表内のリンクアイコン(bx-link)」について:** 該当ファイル・
jpml_pros.js を全文検索したが bi-/bx-/bxl- は元から0件だった。
このページの列アイコン(龍龍/X/note/YouTube)は最初からimg(プロフィール画像)
+フォールバックSVGで実装されており、bootstrap-icons/boxiconsには
依存していなかった。したがってこの項目は「壊れていない」のではなく
「そもそも対象外だった」が正しい。

ローカルのwrangler dev環境で1件、Cloudflare Web Analyticsビーコンの
CORSエラーがconsoleに出たが、これは`/cdn-cgi/rum`が本番ゾーン配下でしか
機能しないための既知のローカル限定事象で、今回のアイコン変更とは無関係
(本番では発生しない)。

## 【4】削除について

すでに前回のコミット(0b6c8cf)で実施済み。今回の【1】〜【3】は
その削除が正しかったことの事後確認にあたる（結果的に【5】も兼ねる）。

## 【6】削減量の記録

| 項目 | サイズ |
| --- | --- |
| 削除: bootstrap-icons.min.css | 81,936 B |
| 削除: bootstrap-icons.woff2 | 121,340 B |
| 削除: boxicons.min.css | 68,028 B |
| 削除: boxicons.woff2 | 115,680 B |
| **削除合計** | **386,984 B (約378KB)** |
| 増加: index.html (17,950→32,441B) | +14,491 B |
| 増加: index.js (6,089→7,143B) | +1,054 B |
| 減少: navbar.js (5,178→5,157B、不要クラス除去) | -21 B |
| **HTML/JS増加合計** | **+15,524 B (約15.2KB)** |
| **正味削減** | **約371,460 B (約363KB)** |

ただし実際にこれらのフォントを読み込んでいたのは index.html のみ
(他26ページは元から未使用)だったため、削減効果は index.html の
初回読み込み時に限られる。Brotli圧縮後の実転送量は上記より小さくなるが
(#92)、バイト数以上に効くのは「CSS取得→フォント取得」という
2段階のレンダリングブロックがindex.htmlから消えたこと。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

---

## #93 Google Fontsの読み込みをやめてシステムフォントに統一する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-10
- ラベル: 分野: パフォーマンス, 対象: 全ページ

### 本文

日本語のサイトでありながら、欧文3書体を外部から読み込んでいる。

## 現状

全ページのheadで以下を読み込んでいる。

- preconnect: fonts.googleapis.com
- preconnect: fonts.gstatic.com
- stylesheet: Open Sans (400/700), Poppins (400/600),
  Raleway (400/600/700)

一方で本文の指定はシステムフォントである。

font-family: "Hiragino Sans", "Yu Gothic Medium", "Meiryo", sans-serif

欧文3書体は見出しや装飾に使われているとみられる。

## 外す理由

1. 外部ドメインが2つ消える
   #9(CSP)で font-src / style-src に外部ホストを書かずに済む。
   「外部ドメインへの依存を増やさない」という方針に沿う
2. レンダリングブロックが2段階なくなる
   CSSを取得してからフォント本体を取りに行くため、
   表示開始が遅れている
3. 日本語の本文には元々効いていない

## 作業

1. どの要素で Poppins / Raleway / Open Sans が使われているか
   style.css と index.css を grep して洗い出す
2. 置き換え後のfont-familyを決める。本文と同じシステムフォント
   スタックに寄せるのが素直
3. 27ファイルのhead(preconnect 2行 + stylesheet 1行)を削除
4. scripts/apply_page_meta.py と scripts/lib/ に同じ記述が
   ないか確認して削除
5. scripts/generate_jpml_pros.py のテンプレートも確認する
   (ビーコントークンと同じ場所に埋まっている可能性がある)

## 注意

見出しの見た目が変わる。トップページと jpml_pros.html を
実際に開いて確認してから確定すること。
違和感が大きい場合は、font-weight や letter-spacing の調整で
埋められないか試す。

## 確認

- curl -s https://ryoei.pro/ | grep -c "fonts.googleapis" が 0
- ブラウザの開発者ツールで fonts.gstatic.com への
  リクエストが発生しないこと

### コメント (2件)

**retroeater** (2026-09-10):

## 訂正: 影響範囲は全27ページではなく index.html のみ

本文に「全ページのheadで読み込んでいる」と書いたが誤り。
実際の調査結果は以下のとおり。

### Google Fonts の読み込み

index.html の21〜23行目のみ。他26ページには存在しない。

- 21行目: preconnect fonts.googleapis.com
- 22行目: preconnect fonts.gstatic.com
- 23行目: stylesheet（Open Sans / Poppins / Raleway）

### font-family の指定

すべて index.css 内。全7箇所（本文の「全8箇所」は誤り）。
style.css には存在しない。

| 行 | セレクタ | 書体 |
| --- | --- | --- |
| 13 | body | Open Sans |
| 33 | h1〜h6 | Raleway |
| 100 | ナビゲーション | Poppins |
| 277 | #hero p | Poppins |
| 413 | .facts .count-box p | Raleway |
| 424 | （リンク） | Poppins |
| 455 | （見出し） | Poppins |

したがって本issueは #15（index.htmlが別系統の構造になっている件）
の領域に完全に含まれる。変更対象は index.html と index.css の
2ファイルのみ。

なお影響が小さいわけではない。トップページ（/）は
パス別リクエストで最多（24時間で197件）である。

## 副次的な発見

index.css の13行目で body に "Open Sans" が指定されており、
style.css の日本語向け指定
（"Hiragino Sans", "Yu Gothic Medium", "Meiryo", sans-serif）と
食い違っている。

トップページだけ本文の書体が他26ページと異なる状態になっている。
本対応でこれを揃える。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

**retroeater** (2026-09-10):

## 完了(コミット b5d027c)

- index.html の21〜23行目(preconnect 2行 + stylesheet 1行)を削除
- index.css の7箇所の font-family を `--font-base` というCSS変数に
  統一し、値をstyle.cssと同じ
  `"Hiragino Sans", "Yu Gothic Medium", "Meiryo", sans-serif` に変更
  (変数はindex.css側のみ。style.cssとは別ファイルで実害なし)

## 削除した外部ドメイン(#9のCSP設計に効く)

- fonts.googleapis.com
- fonts.gstatic.com

## 表示確認

wrangler dev上でPlaywright(Chromium)により実際に描画・スクリーンショットで確認した。

- #hero p・h1〜h6・ナビゲーション・.facts .count-box とも
  違和感なく表示。ナビの折り返しも発生していない
  (各リンクの高さは均一の60px)
- リロード後、fonts.g* へのリクエストは0件
- jpml_pros.html の body フォントスタックと完全一致することを確認
  (「"Hiragino Sans", "Yu Gothic Medium", Meiryo, sans-serif」)

**見た目の調整は不要だった。** font-weight/letter-spacing等の
追加調整は行っていない。

## body の書体統一

トップページ(index.html)だけ "Open Sans" になっていた問題も
解消し、全27ページで本文の書体が統一された。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

---

## #92 静的アセットのブラウザキャッシュを効かせる

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-10
- ラベル: 分野: パフォーマンス, 対象: 全ページ

### 本文

Workers静的アセットの既定のCache-Controlは「キャッシュしてよいが
毎回鮮度を確認せよ」という指定になっており、変更のない
ライブラリやフォントに対しても毎回リクエストが発生している。

ETagが付くため中身の再ダウンロードは起きない(304が返る)が、
往復のラウンドトリップは毎回かかる。

## 実測(2026-09-09、24時間)

| パス | リクエスト |
| --- | --- |
| /assets/vendor/bootstrap/css/bootstrap.min.css | 124 |
| /style.css | 110 |
| /assets/vendor/bootstrap/js/bootstrap.bundle.min.js | 105 |
| /navbar.js | 87 |

## 方針: 3段階に分ける

ファイル名にバージョンやハッシュが入っていないため、
一律に長いTTLを付けるとライブラリ更新時に古い版が残る。

### 第1段(長期・1年)
内容が変わったらファイル名を変える運用ができるもの。

- assets/vendor/boxicons/fonts/boxicons.woff2
- assets/vendor/bootstrap-icons/fonts/bootstrap-icons.woff2
- /img/* (11ファイル)
- /favicon.ico
- /apple-touch-icon.png

Cache-Control: public, max-age=31536000, immutable

### 第2段(中期・30日)
assets/vendor/ 配下のライブラリ。パスにバージョンが
入っていないため1年は危険だが、更新頻度は低い。

Cache-Control: public, max-age=2592000

※ ライブラリを更新した際は Cloudflare のキャッシュパージだけでは
　 ブラウザキャッシュは消えない。更新時はパスを変えるか、
　 TTLの経過を待つ必要がある。この点をREADMEかCLAUDE.mdに
　 書き残すこと。

### 第3段(現状維持)
- HTMLページ全27枚(データ再生成があるため)
- ルート直下の .js / .css (サイト編集で変わるため)

将来これらにもTTLを付けたい場合は、ファイル名にハッシュを
入れる仕組みが先に必要。現行サイトでそこまでやる価値は薄く、
新サイト(docs/new-site-design.md)側の設計事項とする。

## 実装

_headers に追記する。既存のセキュリティヘッダのブロックは
そのまま残すこと。_headers のルールは上から順に評価され、
より具体的なパスのルールを先に書く必要がある点に注意。

## 事前確認

現在の既定値を実測してから着手すること。

curl -sI https://ryoei.pro/assets/vendor/bootstrap/css/bootstrap.min.css \
  | grep -i "cache-control\|etag"

## 事後確認

1. 上記と同じcurlで Cache-Control が意図した値になっていること
2. HTMLページのCache-Controlが変わっていないこと
3. Cloudflare の HTTP Traffic 分析で Cache status の内訳を
   数日後に確認し、リクエスト数が減っているか見る

## 依存

#89 (html_handling) の対応完了後に着手すること。
どちらも配信まわりの変更のため、同時に動かすと
問題の切り分けが難しくなる。

なお本件は Pro プランとは無関係で、Free プランでも実施できる
内容である(Proで解禁されたキャッシュルールの増枠を使うのではなく、
_headers で対応する)。

### コメント (3件)

**retroeater** (2026-09-09):

配信ヘッダに関する検討項目を2件追加する。

## 1. Brotli圧縮の確認(設定ではなく確認)

Cloudflareは経由するテキストコンテンツを自動でBrotli圧縮する。
効いているかを確認するだけでよい。

curl -sI -H "Accept-Encoding: br" https://ryoei.pro/style.css \
  | grep -i content-encoding

br が返れば対応不要。返らない場合は Speed → Optimization で
設定を確認する。

## 2. stale-while-revalidate をHTMLに適用する

本issueの第3段(HTMLは現状維持)について、
以下を検討する余地がある。

Cache-Control: public, max-age=0, stale-while-revalidate=60

古い版を即座に表示しつつ、裏で更新を取得する。
再訪問時の体感が改善する。

判断材料: データ更新からサイト表示に反映されるまで
最大60秒の遅れを許容できるか。
許容できない場合は秒数を短くするか、適用を見送る。

なお stale-if-error は採用しない。
Workers静的アセットにはオリジンサーバーが存在せず、
オリジン障害時のフォールバックという用途自体が発生しないため。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LiwfpYJccthi3DV9jAuFLd

**retroeater** (2026-09-10):

## 訂正: 第1段・第2段の対象ファイルが変わった

本issue作成後に #94 と #98 が完了し、対象が変化した。

### 第1段（長期・1年）から削除

以下2件は #94（アイコンフォント廃止）で削除済みのため
対象から外す。

- assets/vendor/boxicons/fonts/boxicons.woff2
- assets/vendor/bootstrap-icons/fonts/bootstrap-icons.woff2

第1段の対象は以下となる。

- /img/* （11ファイル）
- /favicon.ico
- /apple-touch-icon.png

### 第2段（中期・30日）の対象

assets/vendor/ 配下の6ライブラリ。
php-email-form は #98 で削除済み。

- aos
- bootstrap
- glightbox
- isotope-layout
- purecounter
- typed.js
- waypoints

（bootstrap は全27ページ、他6つは index.html のみが参照）

### 第3段（現状維持）は変更なし

- HTMLページ全27枚
- ルート直下の .css / .js（style.css, index.css,
  navbar.js, index.js, 各ページ用JS 計20本以上）

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

**retroeater** (2026-09-10):

## 完了(コミット 016a303)

### 事前実測(2026-09-10、本番)

| パス | Cache-Control(変更前) |
| --- | --- |
| /assets/vendor/bootstrap/css/bootstrap.min.css | public, max-age=0, must-revalidate |
| /img/hero-bg.webp | public, max-age=0, must-revalidate |
| /style.css | public, max-age=0, must-revalidate |
| / | public, max-age=0, must-revalidate |

ETagは既に付与されていたため304は返っていたが、往復自体は
毎回発生していた。

### Brotli確認

`curl -sI -H "Accept-Encoding: br" https://ryoei.pro/style.css` で
`content-encoding: br` を確認。対応済みのため追加設定は不要だった。

### 事後実測(デプロイ後、本番)

| パス | Cache-Control |
| --- | --- |
| /img/hero-bg.webp | public, max-age=31536000, immutable |
| /favicon.ico | public, max-age=31536000, immutable |
| /assets/vendor/bootstrap/css/bootstrap.min.css | public, max-age=2592000 |
| /style.css | public, max-age=0, must-revalidate(変更なし) |
| / | public, max-age=0, must-revalidate(変更なし) |
| /jpml_pros.html | public, max-age=0, must-revalidate(変更なし) |

### セキュリティヘッダの維持を確認

`/img/hero-bg.webp` で5件すべて確認できた
(X-Frame-Options / X-Content-Type-Options / Referrer-Policy /
Permissions-Policy / Strict-Transport-Security)。

`_headers` の各ブロックは、マッチする全ブロックのヘッダが
マージされる（同名ヘッダのみ後勝ち）ため、`/*` を後ろに
置いたままでも他ブロックのCache-Control指定は上書きされず、
かつセキュリティヘッダは維持された。ローカル(wrangler dev)・
本番の両方で同じ結果を確認済み。

## stale-while-revalidate は見送り

判断材料（データ更新から表示反映まで最大60秒の遅れを
許容できるか）が未確定のため、第3段(HTML)は現状維持とした。
必要になった時点で別issueとして起票する。

## 数日後の確認（申し送り）

Cloudflare の HTTP Traffic 分析で Cache status の内訳を確認し、
リクエスト数が減っているかを見る。2026-09-13 以降。

比較対象(2026-09-09実測、24時間):
- /assets/vendor/bootstrap/css/bootstrap.min.css: 124
- /assets/vendor/bootstrap/js/bootstrap.bundle.min.js: 105

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

---

## #91 Super Bot Fight Modeの有効化を検討する

- 状態: CLOSED (NOT_PLANNED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: セキュリティ

### 本文

Proで Super Bot Fight Mode が使えるようになった。
Bot Report（別issue）の結果を見てから判断するため保留とする。

## 有効化する場合の必須事項

1. 確認済みボットを除外する
   Googlebot をブロックすると Search Console のデータが
   途絶える。#5 のtitle整備の効果測定にも影響する

2. /cdn-cgi/rum をブロックしない
   Cloudflare Web Analytics のビーコンがデータを送信する先。
   塞ぐと訪問者側で404や503が発生する

3. JavaScript Detections は #9 との競合を検討してから
   ヘッドレスブラウザ検出のため、Cloudflareがスクリプトを
   ページに注入する。CSPで許可が必要になるうえ、
   リポジトリに存在しないコードがページに入ることになる。
   Web Analytics の自動注入を見送ったのと同じ判断が要る

## 補足

AI学習用クローラー（GPTBot/ClaudeBot等）は
AI Crawl Control で既にブロック済み。重複しないよう
設定範囲を確認すること。

### コメント (1件)

**retroeater** (2026-09-09):

#90 の実測を受けて、対応不要と判断する。

## 理由1: 最大の塊に手が出ない

Pro の Super Bot Fight Mode で遮断・チャレンジできるのは
「Definitely automated」のみ。「Likely automated」への対処は
Pro では使えない（Business以上、または Bot Management が必要）。

実測では Likely Automated が1,330件（41%）で最大。
Pro で対処できる Automated は849件（26%）にとどまる。

## 理由2: 遮断する実益が薄い

- Security Analytics 上で既にカテゴリ別に分離できているため、
  人間のトラフィックだけを見たければフィルタすれば足りる
- 404の内訳は .env / phpinfo.php を狙う脆弱性スキャンだが、
  当サイトはPHPも .env も持たない完全な静的サイトであり、
  すべて404で終わる（#89 のコメント参照）
- Workers の負荷も1日3千リクエスト規模で、Free枠の
  30分の1程度

## 理由3: 誤検知のリスクを負う側に立つ

得られるのは26%分のノイズ削減のみで、その対価として
実在の訪問者を弾く可能性を負うことになる。
JavaScript Detections を使う場合は #9（CSP）との競合も生じる。

## 再検討する条件

- Business プランへ移行した場合
- スクレイピングによる実害（帯域・Workers課金・データ転載）が
  観測された場合

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #90 Bot Reportでボットトラフィックの比率を把握する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: インフラ

### 本文

Proで Bot Report が使えるようになった。設定変更は不要で、
Security → Bots から参照できる。

## 背景

同じ24時間で、計測方法により数字が大きく食い違っている。

| 出所 | 数値 |
| --- | --- |
| エッジ集計（ユニーク訪問者） | 197 |
| Web Analytics（訪問） | 75 |

差の120あまりはクローラーとJS非実行分と推測しているが、
実際の内訳は未確認。Bot Report は「明らかに自動化」
「おそらく人間」「確認済みボット」の3分類を出す。

## 確認すること

- 3分類それぞれの比率
- 確認済みボットの内訳（Googlebot がどれだけ来ているか）
- 「明らかに自動化」がどのパスに集中しているか
- 数日分の推移

## この結果で決まること

- Super Bot Fight Mode を有効にするか（別issue）
- 今後アクセス数を語るときに、どちらの数字を基準にするか

### コメント (1件)

**retroeater** (2026-09-09):

Security → Analytics → Bot analysis で確認した。

## 結果（2026-09-09、直近24時間）

| 分類 | リクエスト | 割合 |
| --- | --- | --- |
| Likely Automated | 1,330 | 41% |
| Likely Human | 964 | 29% |
| Automated | 849 | 26% |
| Verified Bot | 110 | 3% |
| Unknown | 21 | - |
| 合計 | 3,270 | |

## 分かったこと

**ボットが約7割。** エッジのユニーク訪問者197に対し
Web Analytics の訪問が75だった差は、これで説明がつく。

当初「Googlebot などの検証済みクローラーが主因」と推測していたが
外れていた。Verified Bot はわずか110件で、実体は素性の分からない
自動化トラフィックだった。

Source ASN が裏付けになっている。

| ASN | リクエスト | 性質 |
| --- | --- | --- |
| 2516 KDDI | 661 | 一般回線 |
| 16276 OVH SAS | 555 | データセンター |
| 396982 Google LLC | 515 | データセンター |

Source IP も 158.69.55.148（OVH）369件、34.51.149.165
（Google Cloud）226件と特定IPに集中している。
ryoei.pro:8080 への36件も含め、スキャンの類とみられる。

## 注意: 自分のアクセスが混入している

Source IP の最多は 240b:10:9f05:5810:... の517件だが、
これは作業者本人の回線（同一 /56 プレフィックスであることを
確認済み）。本日は終日検証作業をしていたため、
この日の数字には自分の分が含まれる。

## 今後の使い分け

| 見たいもの | 使う画面 |
| --- | --- |
| 訪問者の動向・ページ人気 | Web Analytics（ビーコンのため人間のみ） |
| ステータスコード・キャッシュ・攻撃・ボット | Security Analytics / HTTP Traffic |

## 前提の訂正

Bot Report の場所は Security → Analytics → Bot analysis タブ。
（当初 Security → Bots と記載していたが誤り）

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #89 html_handlingの既定により全ページで余計なリダイレクトが発生している

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: SEO, 対象: 全ページ

### 本文

Pro移行後のHTTP Traffic分析で、同一ページが拡張子ありとなしの
2系統で記録されていることが判明した。

24時間の実測(?name=付きで絞り込んだ数字):
| パス | リクエスト |
| --- | --- |
| /houou_results | 81 |
| /houou_results.html | 73 |
| /houou_leagues.html | 67 |
| /houou_leagues | 63 |

原因は wrangler.jsonc で html_handling を明示していないこと。
既定の "auto-trailing-slash" では /file.html が /file へ
リダイレクトされる。

影響:
- navbar.js の全リンクが .html を指しており、毎回307を経由している
- sitemap.xml の28件すべてが .html
- og:url が27ページすべて .html
- _redirects の転送先も /resource_logs.html?name=谷岡育夫 で、
  301の直後に307が入る
- リダイレクトされるcanonical/og:urlは検索エンジンにソフトエラーと
  みなされる。#5 のtitle整備の効果測定にも影響する

対応案:
A. wrangler.jsonc に "html_handling": "none" を追加する
   1行で済み、リポジトリ側は無変更。ただし拡張子なしURLが404になる
B. 拡張子なしに統一する
   navbar.js / sitemap.xml / og:url / _redirects /
   scripts/apply_page_meta.py / scripts/generate_jpml_pros.py を書き換え

判断の前に Google Search Console を確認すること:
- インデックスされているのが .html と拡張子なしのどちらか
- 両方の形が重複して登録されていないか

### コメント (3件)

**retroeater** (2026-09-09):

A案(wrangler.jsonc に html_handling: "none")で対応した。

## 判断根拠

Google Search Console の実データで、インデックスされているのは
.html形式のみだった。拡張子なしURLは1件もインデックスされておらず、
重複登録も発生していなかった。そのため .html を正としてそのまま
200で返す設定に変更した(拡張子なしに統一するB案は不採用)。

## 「/」の扱い

html_handling: "none" はディレクトリインデックスの解決も無効化するため、
対策前は「/」が404になった(ローカル検証で確認)。
_redirects の先頭に以下の1行を追加して解決した。

```
/  /index.html  200
```

ステータス200は内部的な書き換えとして扱われるため、ブラウザのURLは
/ のまま index.html の内容が返る。canonical・og:url・sitemap.xmlは
いずれも変更不要。

## 確認結果

ローカル(wrangler dev, html_handling適用前後)・本番(https://ryoei.pro)
のいずれも、想定した結果と一致した。

| URL | 結果 |
| --- | --- |
| / | 200 |
| /index.html | 200 |
| /jpml_pros.html | 200、Locationヘッダなし |
| /houou_ranking.html?sheet=鳳凰 | 200、Locationヘッダなし |
| /jpml_pros(拡張子なし) | 404 |
| /style.css, /assets/vendor/.../bootstrap.min.css | 200 |
| /tanilog.html | 301 → /resource_logs.html?name=谷岡育夫(301のみ、307の連鎖なし) |
| /sonzai_shinai_page.html | 404 |

コミット: 385fa0a

## 残作業（未対応・別途判断）

拡張子なしURL（/houou_results 等）は本変更により404になる。
これらは2026年9月9日の移行以降に発生した一時的なURLで、
Googleのインデックスには含まれていない。

対応の要否は、Cloudflare の HTTP Traffic 分析で
Edge status code = 404 を数日観測してから判断する。
実数が無視できない場合のみ、_redirects に個別の301を追加する。

なお _redirects でワイルドカード（例: /:page /:page.html 301）を
使うのは避けること。CSSやJSなど拡張子付きの静的ファイルまで
巻き込む恐れがある。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

**retroeater** (2026-09-09):

残作業（拡張子なしURLの404対応）は不要と判断した。

## 404の内訳（2026-09-09、直近24時間）

Edge status codes = 404 で絞り込んだ結果、
上位はすべて脆弱性スキャンだった。

| パス | リクエスト |
| --- | --- |
| /beta/phpinfo.php | 24 |
| /postmark/.env | 24 |
| /cron/.env | 21 |
| /project/.env | 21 |
| /api/v1/.env | 21 |

拡張子なしURL（/houou_results 等）は上位に1件も現れていない。
よって _redirects への個別301の追加は行わない。

なお当サイトはPHPも .env も持たない完全な静的サイトのため、
これらのスキャンはすべて404で終わり実害はない。
404が746件（全体の23%）出ていること自体は、
Cloudflareのエッジで完結している証拠でもある。

## 効果測定のベースライン

同時点で 307 Temporary Redirect が366件記録されている。
これは本対応（html_handling: "none"）の適用前、
本日12時頃のドメイン切替から適用時点までに発生した分と
みられる。

翌日以降にこの数値がゼロ近くまで下がれば、
本対応の効果が数字で確認できる。2026-09-10 以降に再確認すること。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

**retroeater** (2026-09-10):

## 効果測定の結果（2026-09-10）

対応が効いていることを確認した。

Edge status code = 307 で絞り込んで時系列を見たところ、
371件のほぼ全量が2026-09-09の13時前後に発生した
単一のスパイク（250件超）であり、それ以降はほぼゼロ。
9月10日に入ってからは発生していない。

24時間の合計値が前日の366件から減らなかったのは、
集計の窓が修正前の時間帯を含んでいたため。
グラフ上ではデプロイを境に明確に途切れている。

## 404の内訳も再確認（残作業の判断は正しかった）

Edge status code = 404 の Path 別上位:

| パス | リクエスト |
| --- | --- |
| /preview/.env | 45 |
| /cron/.env | 29 |
| /assets/vendor/bootstrap/js/bootstrap.bundle.min.js.map | 28 |
| /project/.env | 28 |
| /docs/phpinfo.php | 24 |

拡張子なしURL（/houou_results 等）は1件も現れていない。
_redirects への個別301の追加は不要という判断を維持する。

404が746件から1.49kへ倍増したのはスキャナーの増加によるもの。

なお .js.map への404は当方に起因するもののため、
別issueとして起票した。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

---

## #88 index.cssのServices・Breadcrumbsセクションを削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: 整理・保守, 対象: index

### 本文

#80 でindex.cssの未使用セクション(Skills/Portfolio Details/
Testimonials/Contact)を削除した際、範囲外だったが同様に未使用の
セクションが2つ見つかった。

| セクション | 行数 | 状況 |
| --- | --- | --- |
| Services | 約54行 | `.services` `.icon-box` などがindex.htmlに存在しない |
| Breadcrumbs | 約47行 | `.breadcrumbs` がindex.htmlに存在しない |

いずれもHTML側のセクション自体が既に削除済み(Services: #80、
他ページ用のbreadcrumbはこのサイトで使っていない)で、対応するCSSだけが
取り残されている。#80と同様、全セレクタの未使用を確認した上で削除する。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

### コメント (1件)

**retroeater** (2026-09-09):

Services・Breadcrumbsセクションを削除した(コミット de9d3eb)。

`.services`/`.icon-box`、`.breadcrumbs` のセレクタがindex.htmlに
存在しないことを確認済み。747行→645行(102行減)。波括弧・コメントの
対応、index.htmlの表示崩れがないことも確認済み。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #87 ソート中だけ描画を止めて中間状態の再計算を省く

- 状態: CLOSED (NOT_PLANNED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 状況: 保留, 分野: パフォーマンス, 対象: jpml_pros

### 本文

INPの測定（#83）で、ソート時の描画に467msかかっていることが分かった。

差し替えの前に tbody へ display: none を当て、完了後に戻すことで、
中間状態の描画を完全に省ける。

ただし表が一瞬消えるため、体感が悪くなる可能性がある。
#85・#86 で十分な改善が得られなければ検討する。

### コメント (1件)

**retroeater** (2026-09-09):

#85・#86 がいずれも効果がなかったことから、
描画を一時的に止める方法も効かない見込みが高い。
display:none にしても、戻した瞬間に全行の再計算が発生するため。

根本的な対策は表示件数を絞ること（#24 の五十音タブなど）か
仮想スクロールだが、いずれも新サイトで最初から設計する方が適切。

現状 INP 458ms は「改善が必要」の水準だが「不良」（500ms超）ではなく、
ソート操作でのみ発生する。閲覧とフィルターは快適。
docs/new-site-design.md の方針（現行サイトに作り込みすぎない）に従い、
現行サイトでの対応はここまでとする。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #86 ソート時に tbody ごと差し替えて再計算を1回にする

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

INPの測定（#83）で、ソート時の描画に467msかかっていることが分かった。

現在 jpml_pros.js は DocumentFragment に行を集めてから tbody に
appendChild している。これでも行ごとの追加よりは速いが、
既存の tbody に対して1102行を移動させることに変わりはない。

新しい tbody 要素を組み立て、replaceChild で丸ごと入れ替える方式にすれば、
レイアウト再計算が1回で済む可能性がある。

### コメント (1件)

**retroeater** (2026-09-09):

実装したが、INPの改善効果はなかった。

| | 最大 | ソート中央値 | 200ms超 |
| --- | --- | --- | --- |
| 対策前 | 488ms | 90.7ms | 3件 |
| #85適用時 | 529ms | 135.9ms | 2件 |
| #86適用後 | 458ms | 132.0ms | 3件 |

3回とも450〜530msの範囲で、差はばらつきの範囲内。
内訳も変わらず、描画443ms・JSの処理0.0ms。

DocumentFragment でも replaceChild でも結果が同じだったことから、
ボトルネックはDOM操作の方法ではなく「1102行を並べ替えた結果、
ブラウザが全行のレイアウトと描画をやり直すこと」そのものだと分かった。

変更自体は replaceChild の方がコードとして素直なので残す。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #85 contain-intrinsic-size を固定値にしてソート時の描画を軽くする

- 状態: CLOSED (NOT_PLANNED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

INPの測定（#83）で、ソート時の描画に467msかかっていることが分かった。

style.css の #pros_table tbody tr は contain-intrinsic-size: auto 56px を
指定している。auto は「一度描画した実測値を記憶する」動作で、
1102行が一斉に移動するソート時には記憶の照合が負荷になっている可能性がある。

これを固定値 56px に変えて効果を測る。1行の変更で試せる。
行の高さは56px固定なので、実測値を記憶する必要はない。

### コメント (1件)

**retroeater** (2026-09-09):

効果がなかったため元に戻した。

| 指標 | 変更前 | 変更後 |
| --- | --- | --- |
| 最大（INP相当） | 488ms | 529ms |
| ソートの中央値 | 90.7ms | 135.9ms |

数値は悪化しているが、1回の測定なので誤差の範囲と見るべき。
はっきり言えるのは contain-intrinsic-size の auto が原因ではなかったということ。

内訳は変わらず、描画が503ms・JSの処理は0.1ms。
auto には実測値を記憶してスクロールバーを安定させる役割があるため、
理由なく外したままにする意味がないと判断して元に戻した(コミット 8c62b44)。

次は #86（tbodyごと差し替える）を試す。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #84 GitHub Pagesを無効化する

- 状態: OPEN / 作成: 2026-09-09
- ラベル: 状況: 待ち, 分野: インフラ

### 本文

Cloudflareへの移行後、切り戻し用にGitHub Pagesを残している。
問題がなければ無効化する。

判断の目安: 2026年9月23日ごろ（移行から2週間）

## 現状
- 本番配信は Cloudflare Workers（cloudflareブランチ）
- GitHub Pages は gh-pages ブランチを配信し続けている
  → https://retroeater.github.io/mj/ で閲覧可能
- gh-pages の23ページは Google Charts 方式で、スプレッドシートを
  実行時に読むため、放置してもデータは最新のまま

## 無効化の手順
Settings → Pages → Build and deployment → Source を None にする

## 判断のポイント
- gh-pages ブランチ自体は残す（コードの履歴として価値がある）
- 無効化すると切り戻しの手段が減る。ただしDNSをGitHub Pages向けの
  Aレコード(185.199.108〜111.153)に戻せば復旧できるため、
  完全に手段を失うわけではない
- 新サイト構築時は、現行サイトの参照元として gh-pages が役立つ可能性がある

## 確認してから無効化すること
- Search Console でクロールエラーが増えていないか
- Cloudflare Web Analytics で404が急増していないか

---

## #83 INP(Interaction to Next Paint)を測定して改善余地を確認する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

PageSpeed Insights か Chrome DevTools で jpml_pros.html のINPを測る。
1102行の表があるため、フィルター入力やソート時の応答が
基準(200ms)を超えていないか確認したい。

対策は既にいくつか入っている:
- content-visibility: auto で画面外の行を描画しない
- フィルターに120msのデバウンス
- 状態が変わる行だけ書き換え
- ソートは DocumentFragment で一括差し替え

推測で手を入れても効果が分からないため、まず測定する。
問題がなければクローズする。あれば内容に応じて対策を検討する。

### コメント (2件)

**retroeater** (2026-09-09):

Chrome DevTools の Performance トレースで jpml_pros.html を測定した。

| 指標 | 値 |
| --- | --- |
| 最大（INP相当） | 488ms |
| 75パーセンタイル | 90.7ms |
| 中央値 | 35.4ms |

INP 488ms は「改善が必要」の水準（良好は200ms以下）。
200msを超えたのは17回の操作のうち3回で、いずれも click（＝ソート）だった。
文字入力（input）は最大54msで良好。

内訳を見ると原因がはっきりしている。

| 段階 | 488msの内訳 |
| --- | --- |
| 入力待ち | 0.8ms |
| JSの処理 | 0.1ms |
| 描画 | 467ms |

**JavaScriptの処理は0.1msで問題ない。** #48（フィルターとソートの軽量化）が
効いている。遅いのは描画で、1102行すべてがDOM上を移動するため
content-visibility の判定とレイアウト計算が全行でやり直しになっていると考えられる。

対策は個別にissueとして起票した。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

**retroeater** (2026-09-09):

対策のissue番号: #85（contain-intrinsic-sizeの固定値化）、
#86（tbody丸ごと差し替え）、#87（ソート中の描画停止・保留）

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #82 SNSシェア・URLコピーボタンを設置する

- 状態: OPEN / 作成: 2026-09-09
- ラベル: 状況: 保留, 分野: UI/UX

### 本文

Search Consoleのデータでは、検索結果に表示された22URLのうち14件が
?name= 付きのURLだった。訪問者は特定の選手を見に来ている。
この場面で「このURLをコピー」ボタンがあれば、選手本人やファンが
SNSで共有しやすくなる。

実装は navigator.clipboard.writeText() で数行。外部ライブラリも
SNSの公式ボタン(=外部スクリプト)も不要なので、CSP導入(#9)とも干渉しない。

ただし新サイトでは選手個別ページを作る予定で、置き場所としては
そちらが自然。現行サイトに入れると作り直しになるため保留とし、
新サイトの要件として docs/new-site-design.md に記録する。

---

## #81 index.htmlのコメントアウト済みセクションを整理する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: 整理・保守, 対象: index

### 本文

index.html の577〜658行目「Testimonials Section」がHTMLコメントで
まるごと無効化されたまま残っている。テンプレート付属のサンプル内容
(架空の人物の推薦文)で、使う予定がない。

#77 でSwiperの読み込みと初期化は削除済み。このセクションを消しても
動作には影響しない。

同様にコメントアウトされている箇所が他にもある。
- Contact Section(住所「A108 Adam Street」・info@example.com・
  ニューヨークの地図など、テンプレートのプレースホルダのまま)

いずれも「復活させて使うか、消すか」の判断が必要。
使わないなら消してファイルを読みやすくしたい。

### コメント (1件)

**retroeater** (2026-09-09):

#80 と内容が同一のため、重複としてクローズします。
対応は #80 で完了済みです。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #80 index.htmlのコメントアウト済みセクションを整理する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: 整理・保守, 対象: index

### 本文

index.html の577〜658行目「Testimonials Section」がHTMLコメントで
まるごと無効化されたまま残っている。テンプレート付属のサンプル内容
(架空の人物の推薦文)で、使う予定がない。

#77 でSwiperの読み込みと初期化は削除済み。このセクションを消しても
動作には影響しない。

同様にコメントアウトされている箇所が他にもある。
- Contact Section(住所「A108 Adam Street」・info@example.com・
  ニューヨークの地図など、テンプレートのプレースホルダのまま)

いずれも「復活させて使うか、消すか」の判断が必要。
使わないなら消してファイルを読みやすくしたい。

### コメント (3件)

**retroeater** (2026-09-09):

コメントアウトされたセクション・ダミーコンテンツを削除した。

- Services Section・Testimonials Section・Contact Sectionを丸ごと削除
- Skills Section(進捗バーのダミー数値)を丸ごと削除
- About・Facts・Portfolio・Resumeの各セクション内のプレースホルダ段落・
  ダミー項目(Lorem ipsum等)を削除
- ナビの#services・#contactへのリンクも、対応するセクションがなくなった
  ため削除

#77 でSwiperの読み込み/初期化は削除済みだったため、動作への影響なく
削除できた。

なお、削除したResumeのダミー経歴の中にhirano@ryoei.net宛の連絡先が
紛れ込んでいたが、無効化済みダミーコンテンツの一部として一緒に削除した。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

**retroeater** (2026-09-09):

調査の結果、index.css にも使われていないセクションが見つかった。
HTMLのコメントアウト整理と合わせて対処したい。

| セクション | 行数 | 状況 |
| --- | --- | --- |
| Portfolio Details | 65 | portfolio-details.html が存在しない |
| Testimonials | 92 | 該当セクションがコメントアウト済み |
| Skills（見出しが「Akills」と誤記） | 37 | 該当クラスが実HTMLにない |
| Contact | 184 | 12クラス中1つしか使われていない |

合計370行以上。ただしクラス名の突き合わせによる機械的な判定なので、
実際に削除する際は1セクションずつ表示を確認しながら進めること。

Swiper関連の6ブロックは別途削除済み。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01G4xEKGRnEDdr48pfKvQqqG

**retroeater** (2026-09-09):

CSSの未使用セクションを削除した(コミット 294b296)。

- Skills(見出しが「Akills」と誤記) 37行
- Portfolio Details 48行
- Testimonials 75行
- Contact 184行

計344行削除(1091行→747行、32%減)。全セレクタが実HTMLで未使用である
ことを確認済み。波括弧・コメントの対応、残存セクション(Header/Nav/
Hero/About/Facts/Resume/Portfolio/Footer)のセレクタが実HTMLで使われて
いることも検証済み。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #79 URLパラメータの選手名をタブのタイトルに反映する

- 状態: CLOSED (NOT_PLANNED) / 作成: 2026-09-09 / クローズ: 2026-09-11
- ラベル: 状況: 保留, 分野: SEO, 対象: 全ページ

### 本文

Search Consoleのデータでは、検索結果に表示された22URLのうち14件が
?name= 付きのURLだった。訪問者は特定の選手を探して来ている。

しかし現状はどのURLでも <title> が同じため、
検索結果でもタブでも「成績詳細」としか表示されない。

JavaScriptで document.title を書き換えれば、
ブラウザのタブとブックマークには反映される。ただし
検索結果への反映は不確実で、OGPには反映されない
（クローラーがJSを実行しないため）。

根本的な解決は選手個別ページを作ることで、これは新サイトの仕事
（docs/new-site-design.md 参照）。
効果が限定的なため保留とする。

### コメント (2件)

**retroeater** (2026-09-11):

### エッジで解く案（Cloudflare Snippets / HTMLRewriter）

Snippets または Worker の HTMLRewriter で `?name=` を読み、`<title>` /
`<meta name="description">` / canonical をエッジで書き換える方法がある。

- ビルド工程を持たない方針と両立する
- クライアント側JSに頼らないので、確実にクローラーへ届く

### 代償

キャッシュキーにクエリ文字列を含める必要があり、選手1,100名分のバリエーションが
キャッシュを持つことになる。HTMLのエッジキャッシュ（別issue）とは設計を
統合する必要がある。

### 位置づけ

新サイトで選手個別ページを作る構想（#101）があるなら、そちらで解くほうが素直。
「現行サイトに作り込みすぎない」方針との兼ね合いで判断する。

canonical の方針（別issue）と同一の判断なので、どちらか一方では決められない。

**retroeater** (2026-09-11):

### 判断（2026-09-11）: 現行サイトでは対応しない

canonical の方針（#113）と同一の判断として、(c) 現状維持を選んだ。
エッジで解く案（Snippets / HTMLRewriter）は、キャッシュキーにクエリ文字列を
含める必要があり選手1,100名分のバリエーションを持つことになる点も含め、
現行サイトへの投資として見合わない。

選手個別ページとして新サイト（#101 / docs/new-site-design.md）で解く。

---
_Generated by [Claude Code](https://claude.ai/code)_

---

## #78 OGP画像を作成して og:image を設定する

- 状態: OPEN / 作成: 2026-09-09
- ラベル: 状況: 保留, 分野: SEO, 対象: 全ページ

### 本文

#12 でOGPタグを入れたが、画像がない状態。SNSでシェアされたときに
地味なカードになる。1200×630px の画像を1枚作り、全ページ共通で使う。

以前OGP用に使っていた jpml_pros.jpg は未参照だったため削除済み
（#31 の不要ファイル整理で対応）。作り直しが必要。

タグ自体は #12 で入っているので、各ページに og:image を1行足すだけで済む。
新サイトを作る際もそのまま流用できる。

### コメント (1件)

**retroeater** (2026-09-09):

素材の入手先の候補として、デジタル庁のイラスト・アイコン素材が
使えるかもしれない。連盟という公的性格の団体のデータベースという
サイトの性格とも合う。

着手前に利用条件を必ず確認すること。
商用利用の可否、クレジット表記の要否、改変の可否、
OGP画像としての利用が想定範囲に含まれるかを個別に見る。

条件が合わない場合は自作するか、別の素材を探す。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LiwfpYJccthi3DV9jAuFLd

---

## #77 index.htmlのtestimonialsセクション(コメントアウト)を整理する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-08 / クローズ: 2026-09-09
- ラベル: 分野: 整理・保守, 対象: index

### 本文

index.html の「Testimonials Section」(577〜658行目)は丸ごとHTMLコメントで無効化されている。一方 index.js 側の `new Swiper('.testimonials-slider', ...)` 呼び出しと、swiper-bundle.min.css/jsの読み込みはそのまま残っており、存在しない要素に対する初期化コードが毎回無駄に実行されている。

検証経緯: #73 (vendorスクリプトへのdefer付与)の動作確認中、JSを無効にしても `.testimonials-slider` 要素がDOMに現れないことに気づき調査したところ、コメントアウトが原因と判明した。defer化とは無関係の既存の状態。

検討: セクションを復活させて使うか、使わないなら index.js の該当コードとvendor読み込み(swiper-bundle.min.css/js自体はportfolio-details-sliderにも使われているため、そちらは残す)を削除するか。

### コメント (1件)

**retroeater** (2026-09-09):

portfolio-details-sliderがこのサイトに存在しないことを確認した上で、
index.jsのSwiper初期化コード(testimonials-slider / portfolio-details-slider
両方)とswiper-bundle.min.css/jsの読み込みを削除した。テスト用ダミー
コンテンツのため、testimonialsセクション自体は復活させない方針とした。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #76 Cloudflare WAFを有効にする

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-08 / クローズ: 2026-09-11
- ラベル: 分野: セキュリティ

### 本文

無料プランでもマネージドルールの一部が使え、既知の攻撃パターンを遮断できる。ただし現時点では優先度が低い。静的配信でフォームもデータベースもなく、守るべき攻撃面がほとんどないため。
着手すべきタイミングは、ドメイン切替の後(ゾーン設定はドメインをCloudflareに移してからでないと行えない)か、SDPデータベースで選手が自分の情報を編集する仕組みを作るとき(フォームと認証が入るため必須)。

### コメント (7件)

**retroeater** (2026-09-09):

Pro へアップグレードしたため、保留の理由が解消した。着手可能。

## 着手時の注意

Super Bot Fight Mode を有効にする際、/cdn-cgi/rum を
ブロックしないこと。Cloudflare Web Analytics のビーコンが
データを送信する先であり、塞ぐと訪問者側で404や503が発生する。

## あわせて確認すること

Pro では以下も使えるようになっているため、着手前に整理しておく。

- カスタムルールが5→20に増えている
- Polish(画像最適化)がエッジで効くため、#14(優先度の低い画像を
  最適化する)の前提が変わる可能性がある。#14 に着手する前に
  Polish で足りるか確認したほうがよい

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

**retroeater** (2026-09-09):

Pro で解禁された機能を一通り評価した結果、本issueの進め方に
関する補足。

## 前提: このサイトでのWAFの実効性は限定的

完全な静的サイトであり、サーバーサイドの処理・データベース・
認証がいずれも存在しない。SQLインジェクションやコマンド
インジェクションは攻撃対象そのものがない。

有効化の意味は、ノイズの遮断と、将来 #29（認証）などの
動的機能が入ったときの土台づくりにある。

## 進め方の提案

1. Cloudflare Managed Ruleset のみを有効にする
   OWASP Core Ruleset は当面見送る（誤検知の管理コストが
   実効性に見合わない）

2. まずログモードで運用する
   ?name=元氏なづは のような日本語のクエリ文字列が
   誤検知されないか実データで確認してから遮断に切り替える

3. 誤検知が出た場合はカスタムルールで除外する
   Proでカスタムルールが5→20に増えているため枠は十分ある

## 他のPro機能の評価結果（記録用）

- Mirage: 不採用。Polishと同じ制約に加え、<img>タグを
  エッジで書き換えるため #9 と競合する
- Argo Smart Routing: 不採用。Proに含まれず別課金
  （月$5＋$0.10/GB）。かつ Workers静的アセットには
  オリジンへの往復がないため効果がない（#71 と同じ理由）
- Load Balancing: 不採用。別課金かつ分散対象のオリジンがない
- カスタムルール/キャッシュルールの増枠: 現在0本のため
  枠自体に価値はない

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

**retroeater** (2026-09-10):

## 設定内容（2026-09-10）

Security → WAF → Managed rules

| ルールセット | 状態 |
| --- | --- |
| Cloudflare Managed Ruleset | 有効・**Log モード** |
| OWASP Core Ruleset | 無効 |

Super Bot Fight Mode は #91 で NOT_PLANNED としたため
有効化していない。

## Log モードで開始した理由

?name=元氏なづは のような日本語のクエリ文字列が
誤検知されないかを実データで確認するため。
遮断への切り替えは Events の確認後に判断する。

## 期待値についての注記

WAF は既知の攻撃パターンに反応する仕組みであり、
「存在しないパスを叩く」行為自体は攻撃パターンではない。

したがって /preview/.env や /docs/phpinfo.php を狙う
スキャン（2026-09-10時点で24時間あたり1.49kの404）は、
Block に切り替えても減らない。

完全な静的サイトであり攻撃面が存在しないため、
実際に遮断されるものはほとんどないと予想される。
それを実データで確認することが本issueの成果となる。

## 次のアクション（2026-09-13以降）

Security → Events を確認する。

チェック項目:
1. 日本語クエリ（?name=）が誤検知されていないか
2. 検知されているのがスキャン系のみか
3. 検知の総数

判断:
- 誤検知ゼロ → Ruleset action を Block に切り替える
- 誤検知あり → カスタムルールで除外してから Block に切り替える
  （Pro でカスタムルールは20本まで使える。現在0本）

結果を本issueにコメントし、Block 切り替え後に
COMPLETED でクローズする。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

**retroeater** (2026-09-11):

## Events 確認結果（2026-09-11）

対象期間: 2026-09-10T04:47Z 〜 2026-09-11T04:47Z（24時間）
Analytics → Events タブ、Managed rules で絞り込み。
ルール別の Sampled logs を JSON エクスポートして中身を確認した。

### 結論: 誤検知ゼロ。Block に切り替えてよい

`?name=` / `?tag=` を持つリクエストの検知は1件もなかった。
クエリ文字列を伴う検知は `?rest_route=/batch/v1`（WordPress の
batch エンドポイント探索）のみ。検知されたものはすべてスキャン・
探索系で、実訪問者由来のものは含まれていない。

### ルール別内訳（イベント数、合計1,398）

| ルール | 件数 | 中身 |
| --- | --- | --- |
| Version Control - Information Disclosure | 589 | `.env` 系のパス探索 |
| Version Control - Information Disclosure - Beta | 421 | 同上 |
| Version Control - Information Disclosure - Beta | 168 | 同上 |
| Information Disclosure - Common Files | 48 | `/site/phpinfo.php`、`/webmail/phpinfo.php` 等 |
| React - Remote Code Execution - CVE:CVE-2025-55182 - 2 | 36 | `POST /`。Referer を `www.ryoei.pro` に偽装 |
| React - RCE - CVE:CVE-2025-55182 | 36 | 同一リクエストが上のルールにも同時マッチ |
| Code Injection - CVE:CVE-2022-29078 | 24 | `POST /`。クエリ文字列は空 |
| Code Injection - JavaScript | 24 | 同一リクエストが上のルールにも同時マッチ |
| Wordpress - RCE - CVE:CVE-2026-63030 | 23 | `?rest_route=/batch/v1` |
| Information Disclosure - File Extension | 10 | `/.env.old`、`/info.php.bak` |
| Vulnerability scanner activity | 9 | 未確認 |
| Wordpress - SQL Injection - CVE:CVE-2026-60137 | 6 | 未確認 |
| SQLi - Equation | 3 | `POST /?rest_route=/batch/v1` と `POST /wp-json/batch/v1`。全件同一IP（FR・Bucklog SARL）で、UA を Linux / Windows / Mac の3種に入れ替えている |
| Malware, Web Shell | 1 | 未確認 |

送信元は Google LLC（AS396982）が大半で、残りは DigitalOcean、
TECHOFF SRV LIMITED、Bucklog SARL。

### 記録しておくべき注意点

1. **イベント数はリクエスト数より多い。** 1リクエストが複数ルールに
   マッチするため（`rayName` が同一で `matchIndex` だけ異なる）。
   Code Injection の 24 + 24 は48リクエストではなく24リクエスト。
   React の 36 + 36 も同様に36リクエスト
2. **Beta ルール2本（421 / 168）は Block にしても当面 Log のまま。**
   Cloudflare は新規・更新ルールを1週間ログ専用で配信し、翌週の
   リリースで本来のアクションへ切り替える運用のため。切り替え直後に
   遮断数が想定より少なく見えても設定ミスではない
3. **`POST` 由来の検知がイベント数で123件**（React 72、
   Code Injection 48、SQLi - Equation 3）。`rayName` の重複を
   除くと63リクエスト。このサイトは `<form>` が27ページ中0個で
   POST を受ける口がないため、GET/HEAD 以外を遮断する
   カスタムルールを入れれば、これらはマネージドルールに届く前に
   落ちる（別issueとして起票）
4. Sampled logs のエクスポートは全期間から均等に取られるわけでは
   ない。最初のエクスポートは24時間を指定したのに3時間分しか
   含まれておらず、ルール単位で絞り込み直して初めて全ルールの
   中身が取れた。次回同じ確認をするときはルールごとに絞ること

### 本issueの「期待値についての注記」の訂正

前コメントで「存在しないパスを叩く行為自体は攻撃パターンではないため、
Block に切り替えても減らない」と書いたが、実データはそうなっていない。
`.env` スキャンは Version Control - Information Disclosure に
マッチしており、上位3ルールだけで1,178件（全体の85%）を占める。

ただし Block にしてもリクエスト自体はエッジに届くため総数は減らない。
変わるのは応答が404から403になることと、Workers のアセット参照が
省かれることの2点で、実利は小さい。「実際に遮断されるものは
ほとんどない」という当初の予想は外れたが、結論（このサイトでの
WAF の実効性は限定的）は変わらない。

### 次のアクション

Security → WAF → Managed rules で Cloudflare Managed Ruleset の
action を Log から Block に切り替える（ダッシュボード操作）。

切り替え後24時間ほど Events を見て、`?name=` 付きのリクエストが
遮断されていないことを確認する。問題がなければ本issueを
COMPLETED でクローズする。

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

handoverには「2026-09-11にBlockへ切替済み」とあるが、issue側に切替の
記録がない。ダッシュボードでManaged RulesetのactionがBlockになって
いることを確認し、切替日時をここに追記すること（平野さん）。

切替済みが確認できたら、切替日時と「24時間後のEvents確認
（`?name=`/`?tag=`が遮断されていないこと）を9/12以降に行いクローズする」
とあわせて記録し、確認後にクローズすること。

**retroeater** (2026-09-11):

### Events観測メモ（2026-09-12）— Claude下書き

#110 の翌日確認の作業中に観測した内容を、Block切り替えの判断材料として
記録する。本issueの「切替日時の追記」そのものではない。

#### 観測条件

Security → Analytics → Events、Last 24 hours（9/11 02:31 〜
9/12 02:31 JST）、フィルタなし。

#### 全体

| 項目 | 件数 |
| --- | --- |
| Total | 702 |
| Log | 545 |
| Block | 157 |
| Managed rules | 683 |
| Custom rules | 19 |

マネージドルールの検知の大半が Log のまま通過している。

#### 内容

上位パスは `/dev/.env` `/sendgrid/.env` `/campaign/.env`
`/cakephp/.env` `/test/.env` がいずれも54件で横並び。上位送信元IPは
34.55.26.133 が493件、ASNでは 396982 - Google LLC が514件。
単一の送信元が `.env` のパスを総当たりしている典型的なスキャナ。

#### 判断材料として

- これらは **GET** のため、#110 のカスタムルール（GET/HEAD以外を遮断）
  の対象外。#110 を入れても素通りする
- ryoei.pro は静的配信で `.env` も `xmlrpc.php` も存在しないため、
  現状は404が返るだけで実害はない
- ただし 3.31k の 404（#110確認時の Traffic タブ、Last 7 days）の
  相当部分がこの種のスキャナ由来と見られ、Analytics のノイズになっている
- Log を Block に切り替えた場合、このサイトには `<form>` が0個で
  動的エンドポイントも無いため、正当なリクエストを巻き込む余地は小さい。
  切替判断の材料としては前向きな数字

切替を実施したら、その日時を別途このissueに追記すること。

**retroeater** (2026-09-11):

### Block切替の確認とクローズ（2026-09-12）— Claude下書き

#### 切替状態の確認

Security → Security rules → Cloudflare Managed Ruleset →
Deploy managed ruleset を開いて確認した。

| 項目 | 値 |
| --- | --- |
| Ruleset action | **Block** |
| Ruleset status | Default |
| Execution scope | All incoming requests to ryoei.pro |
| OWASP Core Ruleset | 未デプロイ |

切替日時: 2026-09-11（正確な時刻は不明）

**確認画面についての注意。** Security rules の一覧画面では Managed rules
の Action が `Execute` と表示されるが、これはルールセットを実行するという
デプロイ段階のアクションで、ルールセット内部の Block / Log とは別物。
切替状態を確認するときは Deploy managed ruleset の画面まで入ること。

Ruleset status は `Default` のまま。`Enabled` にすると既定で無効な
ルールまで有効化され、誤検知の管理コストが上がる。OWASP Core Ruleset
を見送ったのと同じ理由で変更しない。

#### 誤検知の確認

Security → Analytics → Events、期間 Last 24 hours、Query String フィルタ。

| フィルタ | 検知数 |
| --- | --- |
| `name=` を含む | **0** |
| `tag=` を含む | **0** |

いずれも "No firewall events found matching your filters"。
2026-09-11 の事前調査（誤検知ゼロ）と一致し、日本語クエリ文字列の
誤検知は発生していない。

#### Managed rules に Log が残る件

2026-09-12 の観測（9/11 02:31 〜 9/12 02:31）では、Managed rules の
内訳が Log 545 / Block 157 で Log が大半を占めていた。これは切替漏れ
ではなく仕様どおり。

本issueの 2026-09-11 コメント「記録しておくべき注意点」2項のとおり、
Cloudflare は新規・更新ルールを1週間ログ専用で配信する。9/10〜9/11 の
調査で `Version Control - Information Disclosure - Beta` が
421 + 168 = 589件だったので、規模も符合する。

また Block 157件のうち 19件は #110 のカスタムルール
（`Block non-GET/HEAD methods`）由来で、残り 138件が Managed rules 由来。
Log モードのままならマネージドルールから Block は1件も出ないため、
この点からも切替済みが裏付けられる。

#### 判定

切替済み・誤検知ゼロを確認した。本issueを COMPLETED でクローズする。

WAF の実効性が限定的という結論（2026-09-11 コメント）は変わらない。
`.env` スキャンへの応答が 404 から 403 に変わり、Workers のアセット
参照が省かれるだけで、リクエスト自体はエッジに届く。

GET によるスキャンの継続的な流入については、2026-09-12 の
「Events観測メモ」に記録済み。

---

## #75 選手データベースの表にaria属性を追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-08 / クローズ: 2026-09-09
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

1102行の表をスクリーンリーダーで扱う際の情報が不足している。サイト全体でaria-*は18箇所しかなく、ほとんどがBootstrap由来。
検討項目: ソート可能な列のthにaria-sort(none/ascending/descending)を付けJSで更新する / thの中身をbuttonにする(キーボードでもソート可能になる副次効果あり) / フィルターの結果件数をaria-liveで通知する / 検索ボックスの開閉をaria-expandedで伝える。
h1・caption・label・scopeは対応済みで、この issue はその続き。

### コメント (1件)

**retroeater** (2026-09-09):

選手データベースの表(jpml_pros.html)に以下を追加した。
- ソート可能な列見出しをbuttonにし、キーボードでも操作可能に
- aria-sort(none/ascending/descending)をソート実行時に更新
- 絞り込み結果件数をaria-live(polite)で通知
- 検索ボックス開閉のaria-expandedはnavbar.js側で既に対応済みだった

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #74 prefers-reduced-motionに対応する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-08 / クローズ: 2026-09-09
- ラベル: 分野: UI/UX, 対象: index

### 本文

index.htmlはAOS(スクロールアニメーション)とtyped.js(タイプライター効果)を使っている。OSで「視差効果を減らす」を設定している利用者のためにアニメーションを止めたい。CSSのメディアクエリでanimation-durationとtransition-durationを極小にする方法が一般的。
ただしAOSは要素を透明な状態から表示させる作りのため、単純に止めると要素が見えなくなる恐れがある。AOS側のdisableオプションとの併用を検討する。

### コメント (1件)

**retroeater** (2026-09-09):

OSで「視差効果を減らす」設定時、AOSはdisableオプションで無効化した
(CSSだけでtransitionを止めると、透明な状態から表示させるAOSの仕組み上
要素が見えなくなってしまうため)。Typed.jsは打ち込み演出をせず最初の
文字列を静的に表示するようにした。index.cssにもフォールバックとして
animation/transition/scroll-behaviorをほぼ0にする指定を追加している。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #73 index.htmlのスクリプトにdeferを付ける

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-08 / クローズ: 2026-09-08
- ラベル: 分野: パフォーマンス, 対象: index

### 本文

index.html だけ11個のvendorスクリプト(aos・swiper・glightbox・isotope・typed.js・purecounter・waypoints・bootstrap等)にdeferが付いておらず、HTMLの解析を止めて実行されている。他26ページは全てdefer済み。
注意点: テンプレート由来で初期化順序に依存している可能性があり、deferを付けるとスライダーやアニメーションが動かなくなる恐れがある。
1つずつ付けて表示を確認しながら進める。

---

## #72 龍龍画像URLを150x150に統一する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

サイト側が原寸(320x240など)を48x48で表示している選手が多く、転送量の無駄になっていた。845人分の150x150 URLを収集するスクリプトを作り、スプレッドシートを一括更新した。副作用として、画像の同期確認における誤検知(サイズ違いによるもの)が大幅に減る。

---
<sub>移行前のタスク番号: 72</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #71 Tiered Cacheを有効にする

- 状態: CLOSED (NOT_PLANNED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: インフラ

### 本文

対応不要。ゾーン(Cloudflareに追加したドメイン)ごとの設定のためドメイン切替が前提であり、かつWorkersの静的アセットにはオリジンサーバーが存在しないため効果がない。無料プランでもCDN配信は既に効いている。

---
<sub>移行前のタスク番号: 70</sub>

### コメント (2件)

**retroeater** (2026-09-07):

移行前に対応済み

**retroeater** (2026-09-09):

reasonをnot plannedに修正(対応不要と判断したもので、completedとは意図が異なるため)

---

## #70 画像再配信の利用規約を確認する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: インフラ, 対象: jpml_pros

### 本文

X・note・YouTubeの規約を調査した。Xは明示的な許可も禁止も見当たらずグレー、noteは第三者による複製を認める条項がない、YouTubeはAPI経由なら保存期間の制限がある。加えて著作権は各選手にあり、プラットフォームの規約とは別の問題。全体の43%(845枚)は連盟のron2.jpの資産であり、そこだけなら許諾のハードルが低い。

---
<sub>移行前のタスク番号: 60</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #69 Google Fontsのウェイトを削減する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: index

### 本文

3ファミリー×8ウェイト＝24種類を読み込んでいた。CSSの全font-weight宣言と、コメントアウトされていないセクションを突き合わせて必要なウェイトを特定し、7種類に削減(71%減)。斜体は使用箇所がコメントアウト済みのため全廃した。css2 APIへの更新、display=swap、preconnectも追加した。

---
<sub>移行前のタスク番号: 59</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #68 index.htmlのプレースホルダを確認する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守, 対象: index

### 本文

住所「A108 Adam Street」・info@example.com・ニューヨークの地図がテンプレートのまま残っていたが、Contactセクション全体がコメントアウトされており表示されていなかった。対応不要。当初「公開状態」と報告したのは誤りだった。

---
<sub>移行前のタスク番号: 58</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #67 sitemap.xmlに除外理由を明記する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO

### 本文

404.html・tanilog.html・saikyo_mens.html・リダイレクト2件をなぜ載せていないかをコメントで残した。次に見たときに迷わないため。

---
<sub>移行前のタスク番号: 54</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #66 フォント指定を全ページの表に広げる

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: UI/UX, 対象: 全ページ

### 本文

jpml_pros限定だった指定をstyle.cssの先頭に移し、body・table・Google Chartsのテーブルクラスに適用した。index.htmlはstyle.cssを読み込まないため影響を受けない。

---
<sub>移行前のタスク番号: 53</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #65 robots.txtを追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO

### 本文

sitemap.xmlを作ったものの、その場所を検索エンジンに知らせる手段がなかった。

---
<sub>移行前のタスク番号: 52</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #64 sitemap.xmlからリダイレクトURLを削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO

### 本文

resource_calendar.htmlとresource_books.htmlは_redirectsで301転送しており実ファイルが存在しない。301するURLをsitemapに載せるとSearch Consoleで警告の原因になる。リダイレクト整備の際の消し漏れだった。

---
<sub>移行前のタスク番号: 50</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #63 CNAMEを削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守

### 本文

ryoei.proと書かれたGitHub Pages専用のファイル。cloudflareブランチでは無意味なうえ公開されていた。gh-pagesブランチには残る。

---
<sub>移行前のタスク番号: 49</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #62 開発用ファイルの公開を止める

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: セキュリティ

### 本文

wrangler.jsoncのassets.directoryが"./"のため、scripts/・.github/・wrangler.jsonc等がURLで直接ダウンロードできる状態だった。.assetsignoreに追加して除外した。認証情報は含まれていなかったが内部構成が見えていた。

---
<sub>移行前のタスク番号: 48</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #61 アイコンフォントをwoff2のみに絞る

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス

### 本文

@font-faceのsrcはブラウザが対応する最初の形式だけを取得するため、eot・ttf・svg・woffは要求すらされない。5ファイル(約2.3MB)を削除。CSSの編集は不要なのでライブラリを更新しても影響を受けない。

---
<sub>移行前のタスク番号: 47</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #60 index.htmlをbootstrap-icons.min.cssに差し替える

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: index

### 本文

非圧縮版を読み込んでいたためmin版に変更(91KB→80KB)。フォントの参照パスは「./fonts/」と「fonts/」の違いだけで、どちらも同じ場所を指すため問題なかった。

---
<sub>移行前のタスク番号: 46</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #59 assets/vendorの未使用ファイルを整理する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守

### 本文

.mapファイル28個・RTL版8個・非圧縮版など63ファイル(約9.3MB)を削除した。index.htmlが読み込む15ファイルと、CSS内のurl()から参照されるフォント類だけを残した。

---
<sub>移行前のタスク番号: 45</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #58 Bootstrapの読み込み元を統一する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守, 対象: 全ページ

### 本文

26ページがCDNの5.3.0、index.htmlだけローカルの5.3.1という分裂状態だった。npmから5.3.8を取得してローカルに置き、全27ページをそちらへ統一。外部CDNへの依存が消え、CSP設定の許可リストが短くなる。同一オリジンになるためintegrity属性も不要になった。

---
<sub>移行前のタスク番号: 44</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #57 空のラッパーdivを削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守, 対象: jpml_pros

### 本文

#dashboard_divと#myTableはGoogle Chartsが要求していたコンテナで、CSSにもJSにも参照がなかった。

---
<sub>移行前のタスク番号: 43</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #56 未使用のCSSクラスを削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守

### 本文

.cal_wrapper・.googlecal・.judan-chart・.mj-border-zeroの4件と、中身が空になるメディアクエリ1件を削除した。削除済みページの名残だった。

---
<sub>移行前のタスク番号: 42</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #55 tableにcaptionとscopeを追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

表の説明をcaptionで追加し、thにscope="col"を付けて列見出しであることを明示した。

---
<sub>移行前のタスク番号: 36</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #54 検索欄にlabelを追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

4つの入力欄それぞれに、placeholderより具体的な説明を付けた。視覚的には隠している。

---
<sub>移行前のタスク番号: 35</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #53 h1を追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

見た目を変えないようvisually-hiddenで配置。検索エンジンと読み上げには伝わる。

---
<sub>移行前のタスク番号: 34</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #52 meta descriptionを追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

所属・出身地、鳳凰戦・女流桜花の所属リーグ等で検索できる旨を約120字で記載した。

---
<sub>移行前のタスク番号: 33</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #51 titleを見直す

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

当初「日本プロ麻雀連盟 プロ雀士データベース | ryoei.pro」に変更したが、他ページとまとめて検討したいため「プロ」のまま維持することにした。

---
<sub>移行前のタスク番号: 32</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #50 altに選手名を含める

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

「龍龍」「X」だけでは1行に並ぶ4枚の画像を区別できなかった。「藍ありさ X」の形式にして、読み上げでも読み込み失敗時も誰の何かが分かるようにした。

---
<sub>移行前のタスク番号: 30</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #49 フォントスタックを指定する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: UI/UX, 対象: 全ページ

### 本文

Windowsの游ゴシックUIは小さい文字だと線が細く読みにくいため、Hiragino Sans→Yu Gothic Medium→Meiryoの順に指定。字詰め(palt)と等幅数字(tabular-nums)も追加した。Webフォントは読み込まない。Google Chartsが生成するテーブルにも効くようクラス名を明示している。

---
<sub>移行前のタスク番号: 29</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #48 フィルターとソートを軽量化する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

検索用文字列を初回に1度だけ組み立てて使い回し、120msのデバウンスを追加。状態が変わる行だけ書き換え、ソートはDocumentFragmentで一括差し替えるようにした。

---
<sub>移行前のタスク番号: 27</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #47 imgにwidth/height属性を付ける

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

読み込み前に高さ0で計算されてレイアウトがずれる問題(CLS)を防ぐため、全imgにwidth="48" height="48"を明示した。

---
<sub>移行前のタスク番号: 26</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #46 インラインのonerror属性を廃止する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

imgごとに同じonerror属性が約1900回繰り返され、HTMLの9%(110KB)を占めていた。data-fallback属性とJSのイベント委譲に置き換えた。errorイベントはバブリングしないためキャプチャフェーズで受けている。将来のCSP導入の前提にもなる。

---
<sub>移行前のタスク番号: 25</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #45 画像のリンク切れを毎週検知する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 自動化, 対象: jpml_pros

### 本文

1985枚の画像URLにHEADリクエストを送り、取得できなかったものをissueに書き出す。毎週月曜3時JSTに自動実行。同じissueを使い回すので乱立せず、復旧すれば自動的に閉じる。同時接続8本・同一ホストへ0.2秒間隔で相手サーバーに配慮している。

---
<sub>移行前のタスク番号: 24</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #44 content-visibilityで画面外の行の描画を省く

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

tbody trにcontent-visibility:autoとcontain-intrinsic-size:auto 56pxを指定。1102行あっても実際に描画するのは表示中の十数行だけになる。DOMには残るためCtrl+Fや読み上げは従来どおり機能する。stickyとの両立も確認済み。

---
<sub>移行前のタスク番号: 21</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #43 テーブルヘッダーの色を決める

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: UI/UX, 対象: jpml_pros

### 本文

グラデーションをやめてFAFAFAの単色に確定した。

---
<sub>移行前のタスク番号: 19</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #42 404ページを整備する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: インフラ

### 本文

wrangler.jsoncのnot_found_handlingは設定済みだったため404.htmlを追加。Cloudflare Web Analyticsのビーコンを入れてあるので、消えた旧URLへのアクセスが実データとして記録される。旧URLのリダイレクト要否を推測ではなく実績で判断できる。

---
<sub>移行前のタスク番号: 16</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #41 Google Search Consoleに登録する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO

### 本文

TXTレコードで所有権を確認し登録した。

---
<sub>移行前のタスク番号: 13</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #40 モバイル表示を確認する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: UI/UX, 対象: 全ページ

### 本文

全ページにviewportメタタグがあり、横はみ出しを起こす固定幅もないことを確認。ハンバーガーメニュー開閉時にナビバーの高さが変わってもcontent-offsetが追従するよう、ResizeObserverによる監視を追加した。

---
<sub>移行前のタスク番号: 10</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #39 リダイレクトを整備する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: インフラ

### 本文

meta refreshで転送していたtanilog.html・resource_calendar.html・resource_books.htmlを、Cloudflareの_redirectsによるサーバーサイド301へ移行。転送が速くなる代わりにWeb Analyticsでの計測はできなくなるが、許容した。

---
<sub>移行前のタスク番号: 9</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #38 非本番ブランチのプレビュービルドを有効にする

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: インフラ

### 本文

cloudflareブランチ以外にpushした際もプレビューURLが発行されるようにした。普段はcloudflareブランチに直接作業する運用は変えず、必要になったときに使える状態にしておく位置づけ。

---
<sub>移行前のタスク番号: 8</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #37 画像を最適化する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: index

### 本文

hero-bg.jpg(978KB→37KB)とMind_Games_KEY_VIS(1.35MB→101KB)をWebP化。あわせて未参照だったvideo_live.jpg・jpml_pros.jpg(計1MB超)を削除した。

---
<sub>移行前のタスク番号: 7</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #36 セキュリティヘッダーを設定する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: セキュリティ, 対象: 全ページ

### 本文

_headersファイルでX-Frame-Options・X-Content-Type-Options・Referrer-Policy・Permissions-Policy・HSTSを設定した。CSPは外部スクリプトの洗い出しが必要なため別課題とした。設定の確認はfetch APIでは一部ヘッダーが隠されるため、HARファイルで検証した。

---
<sub>移行前のタスク番号: 6</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #35 jpml_pros.htmlのGoogle Charts依存を解消する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

ブラウザから毎回スプレッドシートへクエリを投げていた処理を、ビルド時にPythonで実行して静的HTMLに焼き込む方式へ変更。共通ライブラリ(scripts/lib/sheets.py)とGitHub Actionsのワークフローを整備し、他ページにも展開できる形にした。フィルターとソートは軽量な自作JSに置き換えた。

---
<sub>移行前のタスク番号: 5</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #34 sitemap.xmlを再生成する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO

### 本文

内容が2020〜2024年のまま実際のページ構成と乖離していた。現存する全ページを反映して作り直した。存在しないページ(jekyll_league_by_class.html等)を除外し、載っていなかったresource_calendar.html等を追加した。

---
<sub>移行前のタスク番号: 4</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #33 Jekyllを廃止して静的ファイルを直接配信する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス

### 本文

フロントマターもLiquidタグも_layoutsも存在せず、Jekyllは実質HTMLをコピーしているだけだった。ビルドを廃止しwrangler.jsoncの配信元をリポジトリルートに変更。あわせて.gitフォルダが公開されないよう.assetsignoreを追加した。

---
<sub>移行前のタスク番号: 3</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #32 GA4からCloudflare Web Analyticsへ移行する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: インフラ, 対象: 全ページ

### 本文

31ファイルからGA4のタグ2行を削除し、Cloudflare Web Analyticsのビーコンに置き換えた。Cookieレスでプライバシー面でも有利。反映にタイムラグがあるため初回は数分待つ必要がある。

---
<sub>移行前のタスク番号: 2</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #31 不要なファイルを削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守

### 本文

Netflixフォルダ(37.7MBの動画を含む学習用の名残)、IME辞書の旧版24ファイル、未参照だったページ(houou_ampai_43h1.html・jpml_pro.html・jpml_logs.html)、未使用のOGP画像2枚を削除した。saikyo_mens.htmlは年1回の単発企画用として、tanilog.htmlはリダイレクト用として残した。

---
<sub>移行前のタスク番号: 1</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #30 メール送信の手段を検討する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ

### 本文

認証のマジックリンクや選手への通知が必要になった場合。Resendは無料枠が月3000通で扱いやすい。Cloudflare Email Routingは受信専用なので送信には使えない。

---
<sub>移行前のタスク番号: 67</sub>

---

## #29 認証方式を検討する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ

### 本文

選手1000人にログインしてもらう仕組みは、技術より運用負担(パスワード忘れ・メール変更の問い合わせ)が大きい。固有トークン付きURLを配る方式ならログイン不要で運用負担がほぼゼロ。本格的な認証が必要ならClerk(無料枠1万MAU)かSupabase Auth。

---
<sub>移行前のタスク番号: 66</sub>

---

## #28 Cloudflare D1の採用を検討する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ

### 本文

SDPデータベース(選手が自分の情報を編集する仕組み)向け。Supabaseは無料枠が1週間で自動停止するため却下した。D1は5GB・1日500万行読み取りが無料で自動停止もない。2026年9月から無料プランは1日の行数上限に達するとエラーを返す。

---
<sub>移行前のタスク番号: 65</sub>

---

## #27 Noto Sans JPの採用を検討する

- 状態: CLOSED (NOT_PLANNED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: UI/UX, 対象: 全ページ

### 本文

全OSで字面が統一される利点はあるが、1102行の表は再レイアウトのコストが大きく、外部依存も増える。まずフォントスタック指定＋等幅数字(実施済み)で様子を見る。

---
<sub>移行前のタスク番号: 31</sub>

### コメント (1件)

**retroeater** (2026-09-09):

廃案とする。#93(Google Fontsの読み込みをやめてシステムフォントに
統一する)と方向が正反対のため。

Noto Sans JP は Google Fonts から配信される書体であり、
採用すると以下が #93 の判断と矛盾する。

- fonts.googleapis.com / fonts.gstatic.com への依存が残る
  (#9 のCSPで font-src / style-src に外部ホストが必要になる)
- 日本語書体はサブセット化しても容量が大きく、
  レンダリングブロックの解消という #93 の目的と相反する

本文はシステムフォント(Hiragino Sans / Yu Gothic Medium / Meiryo)で
統一する方針とする。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LiwfpYJccthi3DV9jAuFLd

---

## #26 リンクの見た目をモダンにする

- 状態: OPEN (REOPENED) / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: UI/UX, 対象: jpml_pros

### 本文

現在はBootstrapの青(#0d6efd)＋文字直下の下線。紺系に寄せ、下線を薄く3px離す案。既訪問リンクが紫になる問題はBootstrapが解決済みだったため、当初想定より効果は小さい。

---
<sub>移行前のタスク番号: 28</sub>

### コメント (3件)

**retroeater** (2026-09-09):

ドメイン切替が完了。お名前.comのネームサーバーをCloudflareに変更し、
WorkerにカスタムドメインとしてryoeI.proとwww.ryoei.proを設定した。
43件の改善がこれで公開された。
GitHub Pagesは切り戻し用に当面残す。

**retroeater** (2026-09-09):

訂正: 上記コメント中の「ryoeI.pro」は誤字です。正しくは「ryoei.pro」です。

**retroeater** (2026-09-09):

訂正: このissueはドメイン切替(#16)とは無関係のため再オープンします。
上記のコメントは誤って投稿したものです。

---

## #25 プロフィール画像をR2へ移行する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ, 対象: jpml_pros

### 本文

1985枚が7つの外部ドメインに依存している。ただしX・noteの画像を自サイトで再配信することは各社の規約上グレーで、著作権も選手個人にある。ron2.jp分(845枚・連盟の資産)だけなら許諾のハードルは低い。将来SDPデータベースで選手自身に画像をアップロードしてもらうのが最も筋が良い。

---
<sub>移行前のタスク番号: 23</sub>

---

## #24 五十音の行タブで絞り込めるようにする

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: UI/UX, 対象: jpml_pros

### 本文

1102行を延々スクロールさせるUIの改善案。「あ か さ た な は ま や ら わ」の行タブ型。全行に data-name(かな読み込み)を持たせてあるので、既存のフィルター処理にそのまま乗せられる。

---
<sub>移行前のタスク番号: 22</sub>

### コメント (2件)

**retroeater** (2026-09-09):

INPの調査（#83・#85・#86）で、1102行を一度に描画していることが
ソート時の遅さ（458ms）の原因だと判明した。

五十音タブで表示件数を絞れば、この問題も同時に解決する。
新サイトを設計する際は、パフォーマンス面でも意味のある機能として
検討したい。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

**retroeater** (2026-09-09):

補足: 仮想スクロールは採用しない方針とした。

DOMに存在しない行はCtrl+Fのページ内検索で見つけられなくなるため。
印刷やコピーにも影響し、UIとしても好ましくないという判断。
五十音タブでの絞り込み（本issue）で表示件数を絞る方針で対応する。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #23 スクロール中に検索ボックスを開くと背後にデータ行が見える

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: UI/UX, 対象: jpml_pros

### 本文

検索ボックスが左側180pxしか覆っていないため、右側の帯にデータ行が透けて見える。width:100% と box-sizing:border-box の2行で解決できるが、いったん許容している。

---
<sub>移行前のタスク番号: 20</sub>

---

## #22 龍龍・X・note・YouTube列をかな順でソートできるようにする

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: UI/UX, 対象: jpml_pros

### 本文

一度実装したが動作しなかったため削除した。空欄の選手は昇順・降順どちらでも最下部に固定したい。

---
<sub>移行前のタスク番号: 18</sub>

---

## #21 Astroへの移行を検討する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: 整理・保守, 対象: 全ページ

### 本文

27ページすべてにheadの中身とnavbar読み込みがコピーされており、SEO展開やOGP追加のたびに全ページを触る必要がある。Astroなら1つのレイアウトで済む。代償としてビルド工程が復活し、Pythonの生成スクリプトの扱いを決める必要がある。試作(旧74番)の結果を見て判断。

---
<sub>移行前のタスク番号: 73</sub>

---

## #20 jpml_titles.html をAstroで試作する

- 状態: CLOSED (NOT_PLANNED) / 作成: 2026-09-07 / クローズ: 2026-09-10
- ラベル: 分野: 整理・保守, 対象: jpml_titles

### 本文

Astro移行の手応えを確かめるための試作。1ページだけ組み直して、レイアウトの共通化やビルド工程の負担を実際に評価する。この結果を見てAstro移行(旧73番)の可否を判断する。

題材は houou_results.html ではなく jpml_titles.html にする。houou_results はグラフを描いており論点が増えるため、表とフィルターだけの jpml_titles.html の方が試作に適している。

---
<sub>移行前のタスク番号: 74</sub>

### コメント (2件)

**retroeater** (2026-09-09):

「状況: 保留」ラベルを追加。

現行サイトの残作業はPythonで進める判断をしたため、Astro試作は
新サイト構築を再開するときの作業になる（#21と同じ扱い）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01G4xEKGRnEDdr48pfKvQqqG

**retroeater** (2026-09-10):

Astro の試作対象を index.html に変更するため、本issueは
クローズする。

## 理由

index.html は他26ページと構造が独立しており（#15）、
ページ間の依存が最も少ない。また現行のテンプレート由来の
構造から脱却する必要もあるため、試作と作り直しを
同時に進められる。

一方 jpml_titles.html は他20ページと同じ構造であり、
先に #95（テーブル描画方式の比較検討）と #7 で
方式を確定させる必要がある。この段階で Astro を持ち込むと
変数が増えすぎる。

試作は「トップページをテンプレートから脱却して作り直す」
（#101）の中で行う。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

---

## #19 アクセス解析をサーバーサイド方式に変える

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: インフラ, 対象: 全ページ

### 本文

現在はJSビーコン(static.cloudflareinsights.com)。Cloudflare Analytics Engine を使えば外部ドメインへの依存が消え、リダイレクトページのアクセスも計測できる。Workers Paid(月$5)が必要。ドメイン切替(旧11番)の後。

---
<sub>移行前のタスク番号: 40</sub>

### コメント (1件)

**retroeater** (2026-09-09):

Cloudflare Pro へアップグレードしたことで、Analytics Engine を
自前で実装せずに目的を達成できたためクローズする。

## 前提が2つ崩れた

1. Workers Paid(月$5)が必要 → 不要だった
   Analytics Engine の料金表には Workers Free の行があり
   (1日10万データポイント書き込み/1万読み取りクエリ)、
   現時点では Analytics Engine 自体が課金開始前だった。
   実測トラフィックは24時間で3,030リクエストなので、
   仮に自前実装しても Free 枠で収まっていた。

2. クエリ文字列は自前実装でしか取れない → 取れた
   Pro の HTTP Traffic 分析は Query string をフィルタ条件に
   使える。?name= 付きのリクエストは24時間で314件あり、
   鳳凰戦・女流桜花の成績ページに集中していることが分かった。

## Pro で取れるようになったもの

- パス別の内訳(Free では出なかった)
- クエリ文字列によるフィルタ
- Cache status / Source browser / Source device type /
  Data center / Source ASN などの軸
- リダイレクトページ(tanilog等)を含む全リクエスト
  ※ JSビーコンでは301のため計測できなかった

## Pro でも取れないもの

- 選手名ごとの集計。Query string はフィルタには使えるが
  値ごとの内訳は出ない。Download data も表示中の上位5系列を
  15分刻みで出すだけ。
  → ここは Google Search Console で代替する(実際に
    元氏なづは・白銀紗希・野村駿など個別の選手名が確認できている)
- Bot score。ディメンション一覧に存在しない(Business以上)

## 自前実装を見送った理由

Analytics Engine を使うには Worker スクリプトの追加と
run_worker_first の設定が必要で、その副作用として
_headers の5行と _redirects の3行が worker-first の経路で
効かなくなるため Worker 側への移設が必要だった。
現行サイトはいずれ新サイトに置き換わる方針(docs/new-site-design.md)
であり、本番経路に Worker を挟む恒久的な複雑さに見合わないと判断した。

## 副次的な発見

この調査の過程で html_handling の既定による余計なリダイレクトが
判明し、#89 として起票した。

## 残る論点

JSビーコン(static.cloudflareinsights.com)自体は動いたままである。
これを外すかどうかは #9 (CSP) の設計に属する判断のため、
本issueには含めない。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #18 Cloudflare Registrarへドメインを移管する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: インフラ

### 本文

卸値＋ICANN手数料のみで、更新時の値上げがない。WHOIS情報の代理公開も無料。DNSと合わせて管理を1箇所にまとめられる。ドメイン切替(旧11番)の後。

---
<sub>移行前のタスク番号: 69</sub>

### コメント (2件)

**retroeater** (2026-09-09):

Cloudflare Registrarへのドメイン移管が完了。
お名前.comからCloudflareへ、$23.32（1年分の更新料）で移管した。
移管により有効期限が1年延長される。

Cloudflareは卸値のみで販売するため、更新時の値上がりがない。
WHOIS情報の代理公開も無料。
DNSは移管前からCloudflareで稼働していたため、サイトへの影響はなかった。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

**retroeater** (2026-09-09):

Cloudflare Registrarへのドメイン移管が完了。
お名前.comからCloudflareへ、$23.32（1年分の更新料）で移管した。
有効期限は2028年3月20日まで延長され、Auto-renewも有効。

Cloudflareは卸値のみで販売するため、更新時の値上がりがない。
WHOIS情報も既定で秘匿される。
DNSは移管前からCloudflareで稼働していたため、サイトへの影響はなかった。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #17 Email Routingで独自ドメインのメールアドレスを作る

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ

### 本文

contact@ryoei.pro のようなアドレスを作り、既存のメールに転送する。無料で、メールボックスもサーバー設定も不要。送信はできない(受信・転送のみ)。企業からの問い合わせ窓口として。ドメイン切替(旧11番)の直後に実施。

### 依存: #116 で SPF を「送信しない」に設定済み

2026-09-11 に #116 でなりすまし対策として、以下を設定した。

| Type | Name | Content |
|---|---|---|
| TXT | @ | `v=spf1 -all` |
| TXT | `_dmarc` | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;` |
| TXT | `*._domainkey` | `v=DKIM1; p=` |

**受信だけなら影響しないが、`@ryoei.pro` からの送信を行う場合は
SPF の書き換えが必須。** 書き換えないと送信メールが拒否される。
DMARC も `adkim=s` / `aspf=s` と厳密なため、あわせて見直しが要る。

MX レコードは未設定のため、受信するには MX の追加が必要。

---
<sub>移行前のタスク番号: 68</sub>

---

## #16 ドメインをCloudflareへ切り替える

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: インフラ

### 本文

ryoei.pro のDNSをCloudflareに移す。動作確認は済んでおり、あとは実行するだけ。他の改善を終えてから最後に実施する方針。

---
<sub>移行前のタスク番号: 11</sub>

### コメント (2件)

**retroeater** (2026-09-09):

ドメイン切替が完了。お名前.comのネームサーバーをCloudflareに変更し、
WorkerにカスタムドメインとしてryoeI.proとwww.ryoei.proを設定した。
43件の改善がこれで公開された。
GitHub Pagesは切り戻し用に当面残す。

**retroeater** (2026-09-09):

訂正: 上記コメント中の「ryoeI.pro」は誤字です。正しくは「ryoei.pro」です。

---

## #15 index.htmlが別系統の構造になっている件

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: 整理・保守, 対象: index

### 本文

index.html はWebサイトテンプレート由来で index.css と11個のvendorライブラリを使い、他26ページは style.css のみという二重構造。統一の必要はないが、assets/vendor の1.2MBはトップページ1枚のためだけに存在する。将来トップページを作り直す機会があれば最大の削減余地。

---
<sub>移行前のタスク番号: 56</sub>

### コメント (1件)

**retroeater** (2026-09-10):

## 方針決定（2026-09-10）

トップページの位置づけを確定した。

**個人の実績を見せる場**である。選手データベースは
平野良栄個人のポートフォリオを構成する要素の一つという整理。

したがって現行のセクション構成
（hero / about / facts / resume / portfolio）は
情報設計としては妥当であり、作り直しは中身の質の問題として扱う。

作り直しは新サイトの第一弾として行う（別issue）。

## 調査結果の追記

### ライセンス上の制約

BootstrapMade の無料テンプレート iPortfolio 由来。
フッターの「Designed by BootstrapMade」リンクは、
Pro版を購入しない限り削除できない（HTMLコメントに明記あり）。

### フッターの表記が未修正

349行目が以下のままになっている。

  &copy; Copyright <strong><span>iPortfolio</span></strong>

テンプレートのプレースホルダが残っている。別issueで対応する。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

---

## #14 優先度の低い画像を最適化する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: パフォーマンス, 対象: index

### 本文

img/x.png(102KB)、img/profile-img.jpg(48KB)など。主要2枚(hero-bg・Mind_Games)のWebP化は完了済み。

---
<sub>移行前のタスク番号: 17</sub>

### コメント (2件)

**retroeater** (2026-09-09):

以下を対応した(コミット 18802c1)。

- img/x.png: 2400x2453(102KB)から96x96相当(8KB)へ縮小
  選手データベースで48x48表示する代替アイコンのため、
  50倍の解像度は不要だった(高解像度ディスプレイ用に2倍を確保)
- img/profile-img.jpg(48KB) → img/profile-img.webp(12KB)
  index.htmlの参照2箇所(ヘッダーのプロフィール画像、About欄)を更新

合計 約130KB削減。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01G4xEKGRnEDdr48pfKvQqqG

**retroeater** (2026-09-09):

img/x.png を差し替え(コミット 8f38065)。

前回差し替えたものが8bit gray+alpha・94x96だったため、
指定どおりRGBA・96x96(約8.3KB)のものに直した。
profile-img.webpへの置き換えは前回のコミットで完了済みのため変更なし。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01G4xEKGRnEDdr48pfKvQqqG

---

## #13 構造化データ(JSON-LD)を追加する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: SEO, 対象: jpml_pros

### 本文

ItemList と Person で選手情報を機械可読にする。静的HTML化で検索エンジンが中身を読めるようになったため、効果が見込める。検索結果やAIアシスタントでの認識に効く。

---
<sub>移行前のタスク番号: 38</sub>

### コメント (1件)

**retroeater** (2026-09-09):

「状況: 保留」ラベルを追加。構造化データは新サイトで対応する判断をしたため。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #12 OGPタグを追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: SEO, 対象: 全ページ

### 本文

SNS共有時のカード表示用。以前OGP画像として使っていた jpml_pros.jpg は未参照だったため削除済みなので、画像の作り直しが必要。

---
<sub>移行前のタスク番号: 37</sub>

### コメント (2件)

**retroeater** (2026-09-09):

Search Consoleのデータで、表示48回に対しクリック2回(CTR約4%)と判明。
掲載順位は1〜12位と悪くないため、原因はtitleの可能性が高い。
「プロ」「成績詳細」「リンク」といった素っ気ない文字列が並び、
「成績詳細」は4ページで重複している。
titleとmeta descriptionを整えるだけで、表示回数はそのままに
クリックが増える見込み。優先度を上げる。

**retroeater** (2026-09-09):

26ページに og:type / og:site_name / og:title / og:description / og:url と
twitter:card を追加した。
og:image は画像の作成が必要なため別issueとして分離済み。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #11 旧URLのインデックス状況を確認しリダイレクトを判断する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: SEO

### 本文

jpml_articles.html・tokusho_ranking.html・houou_league_by_class.html 等、削除済みで検索エンジンに残っている可能性のあるURLを確認する。404ページに入れたWeb Analyticsの実測データも判断材料になる。旧14番が前提。

---
<sub>移行前のタスク番号: 15</sub>

### コメント (1件)

**retroeater** (2026-09-09):

削除済みURL(jpml_articles・tokusho・league_by_class等)への
アクセスが1件も検出されなかったため、追加のリダイレクトは不要と判断。
404ページのWeb Analyticsで今後も監視は続く。

---

## #10 Search Consoleのインデックス状況を確認する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: SEO

### 本文

登録済み。「インデックス作成 > ページ」でデータが処理されるのを待っている。確認できたら旧15番(旧URLのインデックス確認)へ進む。

---
<sub>移行前のタスク番号: 14</sub>

### コメント (1件)

**retroeater** (2026-09-09):

Search Consoleでデータを確認済み。所有権も維持されている。
22URL・表示48回・クリック2回。削除済みURLへのアクセスは0件だった。

---

## #9 CSP(Content-Security-Policy)を設定する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 待ち, 分野: セキュリティ, 対象: 全ページ

### 本文

Bootstrapのローカル化(旧44番)で外部依存が減り、インラインonerrorも廃止済みなので設定しやすい状態。Sentry導入(旧64番)で外部ドメインが増えるため、その後に着手する。

---
<sub>移行前のタスク番号: 12</sub>

### コメント (3件)

**retroeater** (2026-09-11):

### Speed Brain との非互換（2026-09-11）

Speed Brain を有効化した（#119）。Speed Brain は strict-dynamic や nonce を使う
CSP とは併用できないと公式に明記されている。

参照: https://developers.cloudflare.com/speed/optimization/content/speed-brain/

#119 の判定で Speed Brain が機能すると分かった場合、CSP のポリシー設計で
strict-dynamic / nonce を採用するかどうかは、Speed Brain を残すかどうかと
セットの判断になる。

### あわせて（#120のチェックリスト）

Early Hints も 2026-09-11 に有効化した。こちらは `Link:` ヘッダを読むだけで
HTML を書き換えないため、CSP との競合はない。

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

Speed Brainとの併用制約は#119で「機能しない・Off」に確定したため無効。

生成済みHTMLの`<img src>`から機械的に洗い出した外部ドメイン一覧（gstatic
を除き12件）:

| ドメイン | 用途/発生ページ |
|---|---|
| `img.youtube.com` | jpml_test / rh_paifu / video_en / video_live / video_mtsuku / video_wayhome / index |
| `pbs.twimg.com` | jpml_pros / jpml_titles / resource_logs / saikyo_mens / saikyo_results |
| `ron2.jp` | jpml_pros / jpml_test / jpml_titles |
| `abs.twimg.com` | jpml_pros（11件）/ saikyo_results（2件）データ側13件、正規化は#135 |
| `yt3.googleusercontent.com` | jpml_pros |
| `yt3.ggpht.com` | jpml_pros |
| `assets.st-note.com` | jpml_pros |
| `d2l930y2yx77uc.cloudfront.net` | jpml_pros |
| `stat.profile.ameba.jp` | jpml_pros |
| `kinmaweb.jp` | saikyo_results（1,324件） |
| `i.ytimg.com` | index |
| `www.icualumni.com` | index |

次のコマンドで再現できる:

```
for f in *.html; do grep -o 'src="https\?://[^/"]*' "$f" | sed 's/src="//'; done | sort | uniq -c | sort -rn
```

handover「画像ドメインの実測結果（#9の材料）」の表にも同じ12件を反映した。

**retroeater** (2026-09-11):

### インラインイベントハンドラの残存ページが5→3に(2026-09-11)

`houou_leagues.html` / `ouka_leagues.html`の型C静的化(#127)で、旧
`onchange="javascript:location.href = this.value"`を廃止し、新設した
`leagues.js`側で`addEventListener('change', ...)`に置き換えた。

機械的に確認したところ、`onchange="javascript:`/`onclick="javascript:`/
`onerror="`を含むページは以下のコマンドで検出できる。

```
grep -rl 'onchange="javascript:\|onclick="javascript:\|onerror="' *.html
```

現状の残存は次の3ページ(ランキング系、いずれも#7の型B判断待ち)のみ:

- `houou_ranking.html`
- `ouka_ranking.html`
- `wrc_ranking.html`

ランキング系3ページを#7の対象から外す場合でも、インラインハンドラの
排除自体はCSP(#9)の前提のため、別途対応が必要な点に注意。

---
_Generated by [Claude Code](https://claude.com/claude-code)_

---

## #8 龍龍の所属・出身地等との照合

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 分野: 自動化, 対象: jpml_pros

### 本文

ron2.jp の選手ページから取得できる所属・出身地・段位・かな読みと、スプレッドシートの内容を突き合わせる。表記ゆれ(「九州本部」対「九州」など)の吸収が必要。画像の同期確認(旧61番)の後に着手する。

---
<sub>移行前のタスク番号: 63</sub>

---

## #7 他21ページのGoogle Charts依存を解消する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 対応中, 分野: パフォーマンス, 対象: 全ページ

### 本文

27ページ中11ページが、いまもブラウザから直接Googleスプレッドシートにクエリを投げている。www.gstatic.com と docs.google.com への依存が消え、初期表示も速くなる。旧55番が前提。Astro移行(旧73番)の判断もこのタイミング。

---
<sub>移行前のタスク番号: 39</sub>

### コメント (9件)

**retroeater** (2026-09-11):

## rh_results.html を移行(2026-09-11)

型A'(多列テキストテーブル、画像列なし)の1ページ目。共通部品として以下を追加した。

- `TableConfig.show_filter`(#searchBoxes自体を持たないページ用)
- `.mj-table-auto`(style.css。画像列固定を前提としない多列テーブル用)
- `table.js`のテーブル検出セレクタを`.mj-table[data-filter-param]`→`.mj-table`に変更(絞り込み欄なしでもナビバー固定分のオフセット計算は必要なため)

これらは`rh_results_detail`と型Bの表部分でも使う想定。

また、スプレッドシートの表示形式(`#,##0.0`等)が`fetch_sheet()`では取得できないことが分かった。gvizは生の数値とは別に表示用文字列を持つが`fetch_sheet()`は生の値しか返さないため、`rh_results`側で書式を再現する整形関数を追加して対処した(`scripts/lib/sheets.py`は変更していない)。数値列を持つページを今後移行する際は同じ確認が必要。

進捗: 21ページ中10ページ完了・残11ページ。詳細はdocs/handover.mdの「#7 の進め方」を参照。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_011Asd1Gp8BAvU9bB9fJS2SZ

**retroeater** (2026-09-11):

## 訂正: gvizは表示形式付き文字列(f)を返す

前回のコメントで「スプレッドシートの表示形式(#,##0.0等)はfetch_sheet()では取得できない」と書いたが、これは誤り。gvizのレスポンスはセルごとに生の値(v)とは別に表示用文字列(f)を持っており、シートの表示形式が反映されている。rh_results側で書いていたCOLUMN_DECIMALS + format_number()による自前整形は不要だった。

## 対応

- `fetch_sheet()`(scripts/lib/sheets.py)に`formatted: bool = False`を追加。`True`でセルの`f`を優先して使う
- 既定は`False`のまま。選手IDやYouTube動画IDなどURL・HTML属性に埋め込む値では`f`の桁区切り("6,010")がリンクを壊すため
- `generate()`(scripts/lib/page.py)にも`formatted`引数を追加し、そのまま渡す
- `generate_rh_results.py`をformatted=Trueを使う形に書き換え、自前整形コードを削除

`rh_results.html`はバイト単位で無変更、既存9ページも出力に差分がないことを確認済み。数値列を含む他のページ(`rh_results_detail`等)を移行する際は、URL・属性に使う列が含まれていないことを確認したうえで`formatted=True`を使う。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_011Asd1Gp8BAvU9bB9fJS2SZ

**retroeater** (2026-09-11):

## rh_results_detail.html を移行し型A'を完了(2026-09-11)

- QUERY側で表示列のみ(A,C,E,G,I,R,S,T,V)を取得(22列取得して後から間引く旧方式はやめた)
- `formatted=True`が必須だった。A列(日付)はgvizのtype=dateで、生の値(v)が"Date(2026,0,24)"というJS Date形式の文字列になるため
- 対局列にXアイコンを後置。`build_image_cell()`は画像セル単体を作る関数のため使わず、`build_row_html`内で直接組み立てた
- **旧Google Charts版(gh-pages)を実レンダリングして比較したところ、全列が折り返されていた。** `.mj-table`既定のnowrapのままだと375px幅で横スクロールが発生したため、`#rh_results_detail_table td`全体に`white-space: normal`を適用して解消(団体列12文字の団体名、着順列9桁の値など、短そうに見えた列にも幅を圧迫する例外値があった)
- Lighthouse(mobile): performance 89 / TBT 236ms / DOM 3,573要素(321行のわりに軽い)

型A'(rh_results / rh_results_detail)完了。進捗: 21ページ中11ページ完了・残10ページ。詳細はdocs/handover.mdとdocs/lighthouse-baseline.mdを参照。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_011Asd1Gp8BAvU9bB9fJS2SZ

**retroeater** (2026-09-11):

## グラフ系6ページの構造調査、#111を型別に分割(2026-09-11)

型A'(rh_results / rh_results_detail)の完了に続けて、残り12ページのうちグラフを描画する6ページ(型B/C/D)の構造をコードと実機の両方で確認した。

### 訂正: houou_resultsが#7最大のDOM規模ページになりうる

これまで「`houou_results`等は`?name`必須で未指定時は何も描画しない」と記録していたが誤り。実機確認の結果、`?name`が必須なのはローソク足(`#myChart`)だけで、**表(`myTable`)は`?name`の有無に関わらず無条件で描画される**。現在DOM行数が500に収まっているのはGoogle Chartsの`page:'enable'`+`pageSize:500`が実際にDOMを分割しているためで、自前の`.mj-pager`(`row.hidden`)方式に置き換えると15,416行が丸ごとDOMに乗り、`saikyo_results`(2,560行)を超えて**#7最大のDOM規模ページ**になる。詳細はdocs/lighthouse-baseline.md・docs/handover.mdを更新済み。

### #111を型別に3分割

グラフ系6ページは型B/C/Dで性質が大きく異なり、1つのissueでは判断できないため分割した。

- **#111**(型B、houou_results/ouka_results/wrc_results): 常時表示のDashboard+Tableに`?name`時のみローソク足が乗る構造。3ページとも同一ではなく、houou_resultsのみリーグ欄がCategoryFilter(ドロップダウン)、ouka_resultsはStringFilter、wrc_resultsは名前欄のみ(実機確認で判明)
- **#127**(型C、houou_leagues/ouka_leagues): 積み上げ棒は全員共通、`?name`依存は折れ線1本のみ。静的化とのハイブリッドが成立しうる
- **#128**(型D、resource_efficiency): URLパラメータ非依存・データ固定(34行)。グラフ系で唯一、完全に静的SVG化できる

6ページとも、カスタムツールチップ・`addListener`は存在しない(既定のGoogle Chartsツールチップのみ)ことも実機確認済み。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_011Asd1Gp8BAvU9bB9fJS2SZ

**retroeater** (2026-09-11):

## resource_efficiency.html を移行し型Dを完了(2026-09-11)

グラフ系6ページで唯一、完全に静的SVG化できるページ(#128)。

- scripts/lib/chart.pyを新規作成(横棒グラフのSVG生成、標準ライブラリのみ)
- scripts/lib/page.pyにrender_content()を追加。表を持たないページ用にHEAD_TEMPLATEを切り出した(既存11ページの出力は無変更を確認済み)
- 各棒の<g>内の<title>要素でJS/CSSなしのツールチップを実現。#111/#127/#128に「ツールチップは失われる」という誤記の訂正コメントを追加した
- gstatic.com依存を解消。グラフ系で唯一、外部JSを一切読まないページになった
- シート名の特定に手間取った件を記録: 旧JSはgid=1188043937としか書いておらず、gid=0が「詳細」、1188043937が「シート1」という一見逆に見える対応だった

型D完了。進捗: 21ページ中12ページ完了・残9ページ(型B3・型C2・型A4)。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_011Asd1Gp8BAvU9bB9fJS2SZ

**retroeater** (2026-09-11):

## saikyo_results.html をビルド時生成に移行（2026-09-11）

型Aの2列テーブル(2,560行)を `scripts/lib/page.py` の共通処理で静的HTML化した。型Aはランキング3ページを除いて完了（残8ページ）。

### `?name=` の列取り違えバグを発見・修正（#122 関連）

移行前の実機確認で、旧 `saikyo_results.js` の `?name=` に列の取り違えバグがあることが分かった。

- コード上のコメントは「A列=対局日 / H列=名前」と書いているが、実際のクエリは `queryStatement += ' AND A = "' + search_name + '"'` で、**A列（対局日）に対して名前文字列を完全一致させていた**。H列（名前）は一度も参照されていない
- gh-pages版（旧方式のまま）で実機確認: `?name=`に実在の選手名を指定すると0件、実在の対局日の文字列を指定するとヒットする。バグを再現できた
- `?name=`は#122で調査中のSearch Console実測（`?name=`付きURLの内訳）に関わる可能性があるため、削除はせず、コメントが示す「本来意図されていたはずの挙動」（H列＝名前の完全一致）に修正して移行した。バグ自体（A列に対する完全一致）は再現していない
- 挙動としては「ほぼ常に0件」から「名前で絞り込める」への意図的な変更になる。#122の`?name=`アクセス実績を見るときは、この変更が入る前後で挙動が違う点に注意

### その他の実装メモ

- 写真が空の行（528件、全体の約20%）は、旧`getFormattedImage()`がTwitter IDも画像URLもない場合に戻り値が未初期化(`undefined`)になるバグを持っていたが、実機確認の結果Google Chartsはこれを空セルとして描画しており「undefined」という文字列が出るわけではなかった。`build_image_cell()`に空文字を渡すだけで同じ見た目を再現できたため、個別分岐は不要だった
- フォールバック画像は`img/avatar.svg`に統一（旧版はTwitter IDの有無で`img/twitter.svg`と`src=''`に分かれており、後者は自ページへの画像リクエストになるバグだった。`saikyo_mens`での対応を踏襲）
- 行高(`contain-intrinsic-size`)は160×90画像基準の98pxを、mobile幅での実測（中央値・90パーセンタイル・最大値がいずれも98px一致）で確認して採用
- 詳細は `scripts/generate_saikyo_results.py` のモジュールdocstringと `docs/handover.md` / `docs/lighthouse-baseline.md` を参照

**retroeater** (2026-09-11):

## 未移行ページの gviz クエリに、URLパラメータをエスケープなしで連結している

Mantis の検討中にリポジトリを読んでいて見つけたもの。
**#7 の移行で該当ページごと消えるため、単独の対応は不要。**
移行時に再発させないための記録。

### 該当箇所は3ファイル

`houou_results.js` / `ouka_results.js` / `wrc_results.js` が、
URLパラメータ `?name=` をクエリ文字列にそのまま連結している。

```js
let search_name = params.get('name')
let queryStatement = 'SELECT A,B,...,U WHERE V = "Y"'
queryStatement += ' AND A = "' + search_name + '" ORDER BY B,C'
```

`"` を含む値を渡すと文字列を抜け出して WHERE 句を書き換えられる。

### 他の未移行ページは該当しない（確認済み）

- `houou_leagues.js` / `ouka_leagues.js` — `queryStatement` は `const` の固定文字列。
  `?name=` は取得後のクライアント側の絞り込みにしか使っていない
- `league_ranking.js` — クエリは `getQueryString(division)` の if/else で選ぶ固定文字列9種で、
  連結はしていない。ただし `?sheet=` はデータソースURLに連結している
  （`WORKBOOK_URL + '?sheet=' + SHEET_NAME + '&headers=1'`）。
  同じワークブックのシート名を指すだけで、クエリ構文には触れない

### 実害は小さい

- 対象は読み取り専用の公開スプレッドシート1冊で、シート内の同じデータしか取れない
- 認証もセッションもないため、盗める資格情報がない
- 結果は Google Charts の Table / Chart に描画されるので、DOM XSS の経路にもならない

### 移行時の留意点

Python 側（`scripts/lib/page.py` の `generate()`）は QUERY をビルド時に組み立て、
URLパラメータはブラウザ側の絞り込み（`table.js` の `data-name-mode` /
`data-filter-param`）で扱う構造になっているため、
**型A/A'と同じ手順で移行すればこの形は自動的に消える。**

型B（#111）・型C（#127）でグラフ本体に Google Charts を残す方針を取る場合、
`?name=` をクエリに渡す箇所が残る可能性がある。その場合は値の `"` を
エスケープするか、取得は全件にしてフィルタをクライアント側で行うこと。

### 関連

同じ検討中に見つけた GitHub Actions の script injection は #132 に切り出した。

---
_Generated by [Claude Code](https://claude.ai/code)_

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

ランキング3ページは #141 で扱う。残り8ページの内訳: 型B 3（#111）・型C 2（#127）・ランキング 3（#141）。

**retroeater** (2026-09-11):

### 型C(houou_leagues / ouka_leagues)完了(2026-09-11、#127)

方針(c)静的SVG+折れ線だけクライアント描画のハイブリッドで移行完了。
残るは型B(houou_results / ouka_results / wrc_results、#111で方針検討中)
とランキング系3ページ（houou_ranking / ouka_ranking / wrc_ranking）の
計6ページ。

詳細は#127のクローズコメント参照。

---
_Generated by [Claude Code](https://claude.com/claude-code)_

---

## #6 ワークフローのpushトリガーを汎用化する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: 自動化

### 本文

.github/workflows/regenerate-page.yml は push トリガー時の対象ページを jpml_pros で決め打ちしている。2ページ目を自動化した瞬間に破綻するため、変更されたファイルから対象を判定する形に直す。Google Charts依存の解消(旧39番)の前提。

---
<sub>移行前のタスク番号: 55</sub>

### コメント (1件)

**retroeater** (2026-09-09):

生成スクリプトの有無から対象ページを自動判別する方式に変更した。
新しいページを自動化する際、YAMLの書き換えが不要になる。
共通ライブラリ(scripts/lib/)が変わったときは全ページを作り直す。
生成物(*.html)の変更では発火しないため、無限ループも防げる。

手動実行(target_page=all)で動作確認済み。
(実装時、regenerate.pyでサブプロセスの標準出力がGITHUB_OUTPUTに
混入して失敗する不具合が見つかったため、合わせて修正した)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01G4xEKGRnEDdr48pfKvQqqG

---

## #5 他ページへのSEO展開

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: SEO, 対象: 全ページ

### 本文

jpml_pros.html にのみ入れた h1・meta description を他24〜25ページにも展開する。あわせて重複しているtitleを解消する(「成績詳細」が4ページ、「リンク」が2ページ)。

---
<sub>移行前のタスク番号: 51</sub>

### コメント (1件)

**retroeater** (2026-09-09):

26ページのtitleとmeta descriptionを整備した。
- titleの書式を「ページ名 | カテゴリ | ryoei.pro」に統一。
  カテゴリはメニュー名に合わせつつ、「連盟」だけは検索で拾われるよう
  「日本プロ麻雀連盟」に展開した
- 重複を解消。従来は「成績詳細」が4ページ、「ランキング」が3ページ、
  「リンク」が2ページで重複していた
- index.htmlは「R」の1文字だったものを「ryoei.pro」に
- descriptionは各ページの実際の内容と、検索できる項目
  （選手名・店名・最寄駅名など）を具体的に記載

適用は scripts/apply_page_meta.py で行った。再実行しても
タグが重複しない作りなので、今後の変更もこのスクリプトを直せばよい。

なお h1・caption・label などは、新サイトで作り直す前提のため
今回は見送った（docs/new-site-design.md の9章の方針）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #4 Sentryを導入してJSエラーを検知する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 分野: 自動化, 対象: jpml_pros

### 本文

jpml_pros.js の自作フィルター・ソート・固定列の処理が特定の環境で壊れても気づく手段がない。無料枠(月5000エラー)で十分。外部ドメインが1つ増えるため、CSP設定(旧12番)より先に入れる。

---
<sub>移行前のタスク番号: 64</sub>

### コメント (1件)

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

「現行サイトに作り込みすぎない」方針との整合を再確認したい。現行サイトに
外部ドメインを1つ足してからCSP（#9）を書く順序になっているが、新サイト
（#101）側で導入するほうが自然な可能性がある。状況: 保留にするか、現行で
入れるかを平野さんが判断する。

---

## #3 YouTubeチャンネルアイコンの一致確認

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 分野: 自動化, 対象: jpml_pros

### 本文

YouTube Data API v3 の channels.list で82チャンネルのアイコンURLを取得し、サイトの表示と突き合わせる。API呼び出しは2回・消費クォータ2ユニットで済む。Google CloudでのAPIキー発行と、GitHub Secretsへの登録が前提。

---
<sub>移行前のタスク番号: 62</sub>

---

## #2 龍龍画像の同期確認を運用に乗せる

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-08
- ラベル: 分野: 自動化, 対象: jpml_pros

### 本文

龍龍(ron2.jp)の選手ページに表示されている画像と、サイトで表示中の画像が一致しているかを毎週確認する。スクリプトとワークフローは実装済み。150x150への統一(旧72番)を反映したうえで再実行し、誤検知が減ったことを確認する。

---
<sub>移行前のタスク番号: 61</sub>

### コメント (1件)

**retroeater** (2026-09-08):

843件すべて龍龍の最新画像と一致。150x150への統一により誤検知が解消され、週次の自動監視が正常に動作する状態になった。

---

## #1 画像リンク切れの検知結果

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: (なし)

### 本文

1985件を確認し、**20件**が取得できませんでした。

### ホスト別
| ホスト | 件数 |
| --- | --- |
| pbs.twimg.com | 17 |
| abs.twimg.com | 3 |

### ステータス別
| ステータス | 件数 |
| --- | --- |
| 404 | 20 |

### 詳細
- `404` 栄田勇作 X — https://pbs.twimg.com/profile_images/1890415764919947264/zFcUCRw5_80x80.jpg
- `404` 江崎しんのすけ X — https://pbs.twimg.com/profile_images/1836292020199153664/yycE2_Oh_80x80.jpg
- `404` 岡リョウタ X — https://pbs.twimg.com/profile_images/2068116908961132544/cA7bdrT__80x80.jpg
- `404` 神代陽向 X — https://abs.twimg.com/sticky/default_profile_images/default_profile_80x80.png
- `404` 川奥修二 X — https://pbs.twimg.com/profile_images/2075596142210166784/yS9Ez0ZU_80x80.jpg
- `404` 久保隆徳 X — https://pbs.twimg.com/profile_images/1215831088603385857/agorPvf8_80x80.jpg
- `404` 新城勇哉 X — https://pbs.twimg.com/profile_images/2085244223264305152/EG-HM3ek_80x80.jpg
- `404` 田中羚 X — https://pbs.twimg.com/profile_images/2011328594921091073/SaZyUy_P_80x80.jpg
- `404` 田辺ゆい X — https://pbs.twimg.com/profile_images/2070752681304768512/bPADaCry_80x80.jpg
- `404` 東城りお X — https://pbs.twimg.com/profile_images/1754483138179547136/gEx-KG4a_80x80.jpg
- `404` 永田泰志 X — https://pbs.twimg.com/profile_images/2090800744211591168/PUs-KJGr_80x80.jpg
- `404` 比嘉秀樹 X — https://abs.twimg.com/sticky/default_profile_images/default_profile_80x80.png
- `404` 比屋定秀太 X — https://abs.twimg.com/sticky/default_profile_images/default_profile_80x80.png
- `404` 平野よしつね X — https://pbs.twimg.com/profile_images/2038425646851084288/ttydf_GA_80x80.jpg
- `404` HIRO柴田 X — https://pbs.twimg.com/profile_images/1963845940693127168/L0w_2l_Q_80x80.jpg
- `404` 星野佑太 X — https://pbs.twimg.com/profile_images/2094000710975385600/xAw1XcJ3_80x80.jpg
- `404` 森東賢一 X — https://pbs.twimg.com/profile_images/1137877240488706048/3cZ3jct3_80x80.jpg
- `404` 山田祐輝 X — https://pbs.twimg.com/profile_images/2037373485761368064/uSXWnsFR_80x80.jpg
- `404` 吉野敦志 X — https://pbs.twimg.com/profile_images/1535376354103160832/x8DDWuj4_80x80.jpg
- `404` 渡邊亮 X — https://pbs.twimg.com/profile_images/1882814781239009280/ImPQPXQ1_80x80.jpg

---
_スプレッドシートの画像URLを更新すると解消します。次回の検知で解決していれば、このissueは自動的に閉じられます。_

### コメント (1件)

**github-actions** (2026-09-07):

1985件を確認し、リンク切れは検出されませんでした。

---
