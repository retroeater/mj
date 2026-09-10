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
| `jpml_pros.html` / `jpml_titles.html` / `jpml_test.html` / `resource_logs.html` / `video_live.html` | 5 | **ビルド時にPythonで静的生成**。Google Charts依存を解消済み |
| Google Charts依存 | **17** | ブラウザから直接スプレッドシートを読む。#7の対象 |
| 静的なページ | 4 | `404.html` / `jpml_links.html` / `resource_dictionary.html` / `rh_links.html` |

### データの流れ

選手データや成績はすべて**Googleスプレッドシート**にある（5冊）。

- `jpml_pros.html` / `jpml_titles.html` / `jpml_test.html` / `resource_logs.html` /
  `video_live.html` … それぞれ `scripts/generate_jpml_pros.py` /
  `scripts/generate_jpml_titles.py` / `scripts/generate_jpml_test.py` /
  `scripts/generate_resource_logs.py` / `scripts/generate_video_live.py` が
  ビルド時に取得してHTMLに焼き込む
- 残り17ページ … 訪問者がページを開くたびにブラウザが `docs.google.com` へクエリを投げる

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
| `www.gstatic.com` / `docs.google.com` | Google Charts（17ページ） |
| `static.cloudflareinsights.com` | Web Analytics のビーコン本体。**送信先は自ドメインの `/cdn-cgi/rum`**（ゾーン配下で登録し直したため）。CSPでは `script-src` にのみ必要 |
| 画像7ドメイン | 選手のプロフィール画像 |

**#7（Charts依存の解消）が終わると2つ減る。**

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
| #76 | WAF（Cloudflare Managed Rulesetのみ、まずログモード） | 設定操作が中心。Pro移行後未着手 |
| #78 | OGP画像を作成 | 画像制作がボトルネック。デジタル庁素材が候補 |
| #8 | 龍龍の所属・出身地等との照合 | #61の仕組みを流用できる |
| #9 | CSP設定 | #7の後にやると強いポリシーが書ける |
| #4 | SentryでJSエラー検知 | 外部サービスの登録が必要 |
| #96 | カレンダーの参照・更新を自動化 | スコープ未定。決めるべき項目が4つある |

### #7 の進め方（検討済み）

対象の21ページ(4ページ完了・残17)は4つの型に分かれる。

| 型 | ページ数 | 内容 | 該当ページ |
|---|---|---|---|
| A. 表とフィルターのみ | 15(**完了4・残11**) | `jpml_pros` と同じ構造。移行しやすい | `jpml_titles`(完了)、`jpml_test`(完了)、`resource_logs`(完了)、`video_live`(完了)、ランキング3、動画3、牌譜、最強戦2、良栄の成績2 |
| B. 表＋ローソク足 | 3 | `CandlestickChart` が加わる | `houou_results` / `ouka_results` / `wrc_results` |
| C. 縦棒グラフ | 2 | `ColumnChart` | `houou_leagues` / `ouka_leagues` |
| D. 横棒グラフ | 1 | `BarChart` | `resource_efficiency` |

※ ランキング3ページは `league_ranking.js`（772行）を共用している。
　 レーダーチャートの指標もこのファイルの集計ロジックを使う（新サイト）

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

**テーブル描画ライブラリの選定（#95）は #7 の前提から外した。**
#7 は現行方式（`jpml_pros.html` と同じ自前実装）で残り17ページを
揃える。AG Grid 等の検討は新サイトのスタック決定（#21）と
併せて行う。

**列ヘッダによるソートは `jpml_pros.html` 専用の機能とする。**
型Aの他11ページには既定で載せず、必要と判断したページにだけ個別に
追加する方針にした（基本なし、明示的に指定があったときだけ追加）。
Google Charts版のTable chartは既定でソート可能だったため、これは
意図的な機能削減にあたる。既定の並びがシート順（日付の新しい順）で、
絞り込みと `?name=`（またはページ内の絞り込み欄）で目的の行に到達できる
ため、影響は小さいと判断した。`jpml_titles.html` はこの方針の最初の
適用例で、`jpml_test.html` / `resource_logs.html` / `video_live.html` も
同様にソート機能を持たない。

**`jpml_titles` / `jpml_test` / `resource_logs` / `video_live` の比較で
見えた、共通化前に揃えるべき差分。** 5ページ目に着手する前に、この点を
どう扱うか判断する必要がある。

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
| `saikyo_mens` | `name` / `tag` |
| `rh_paifu` | `name` |
| `video_en` / `video_mtsuku` / `video_wayhome` | `name` |
| `wrc_results` | `name` |

内部リンクがないことは「不要」を意味しない。Search Consoleのデータで
「検索結果に出た22URLのうち14件が`?name=`付き」と分かっているが（SEO節）、
どのページのものかは未確認。消すと検索流入が全件表示に落ちる恐れがある。

削除の判断は、Search Consoleで`?name=`付きURLの内訳を確認してから行う。
それまでは、各ページを#7で移行するタイミングで個別に決める。
`resource_logs`は移行済み・内部リンク（名前セレクトボックス3件・
タグリンク16本）は静的HTMLへそのまま引き継いだ。

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

---

## 7. 関連文書

| ファイル | 内容 |
|---|---|
| `CLAUDE.md` | Claude Code がセッション開始時に読む。プロジェクトの前提 |
| `docs/new-site-design.md` | **新サイトの設計方針。**中断中で、再開手順まで書いてある |
| `docs/astro-migration-study.md` | Astro移行の技術調査（Claude Codeによる） |
| `docs/issues-snapshot.md` | issue一覧のエクスポート（本文込み） |
