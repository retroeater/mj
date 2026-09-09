# 引継ぎメモ

新しい会話でこのプロジェクトを再開するときに、最初に読む文書。
**このファイルを読めば、それまでの経緯を知らなくても作業を再開できる**ことを目的にしている。

最終更新: 2026年9月9日

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

### ページ構成

HTMLは27ページ。大きく3系統に分かれる。

| 系統 | ページ数 | 状態 |
|---|---|---|
| `index.html` | 1 | Webサイトテンプレート（iPortfolio）由来。`index.css` と11個のvendorライブラリを使う |
| `jpml_pros.html` | 1 | **ビルド時にPythonで静的生成**。Google Charts依存を解消済み |
| Google Charts依存 | **21** | ブラウザから直接スプレッドシートを読む。#7の対象 |
| 静的なページ | 4 | `404.html` / `jpml_links.html` / `resource_dictionary.html` / `rh_links.html` |

### データの流れ

選手データや成績はすべて**Googleスプレッドシート**にある（5冊）。

- `jpml_pros.html` … `scripts/generate_jpml_pros.py` がビルド時に取得してHTMLに焼き込む
- 残り21ページ … 訪問者がページを開くたびにブラウザが `docs.google.com` へクエリを投げる

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
- **`docs/issues-snapshot.md` は本文込みのエクスポート。** 古くなるので、
  正確な状態は `gh issue list` で確認すること

---

## 4. 押さえておくべき方針

### 現行サイトに作り込みすぎない

**新サイトを別途新規構築する方針**が決まっている（`docs/new-site-design.md`）。
現行サイトはいずれ役目を終えるため、大きな投資は避ける。

具体的には、次のような判断をしてきた。

- 構造化データ（#13）は現行サイトでは見送り、新サイトで対応
- SNSシェアボタン（#82）も新サイトの選手個別ページに置く
- Astroへの移行（#20/#21）は新サイト構築時に判断。現行サイトの残作業はPythonで進める

### 外部ドメインへの依存を増やさない

CSP（#9）の導入を予定しているため。Bootstrapのローカル化やインライン
`onerror` の廃止も、この方針に沿ったもの。

現在の外部依存は次のとおり。

| ドメイン | 用途 |
|---|---|
| `www.gstatic.com` / `docs.google.com` | Google Charts（21ページ） |
| `static.cloudflareinsights.com` | Web Analytics のビーコン本体。**送信先は自ドメインの `/cdn-cgi/rum`**（ゾーン配下で登録し直したため）。CSPでは `script-src` にのみ必要 |
| `fonts.googleapis.com` / `fonts.gstatic.com` | index.html のフォント |
| 画像7ドメイン | 選手のプロフィール画像 |

**#7（Charts依存の解消）が終わると2つ減る。**

### gh-pages ブランチは触らない

GitHub Pages 用に凍結している。23ページがGoogle Charts方式なので、
**スプレッドシートを更新するだけでデータが反映される**（コミット不要）。

---

## 5. 次にやること

`docs/issues-snapshot.md` に全件あるが、着手可能な主なものは以下。

| # | 内容 | 備考 |
|---|---|---|
| **#7** | 他21ページのGoogle Charts依存を解消 | **最大の残件。** #9 の前提でもある |
| #92 | 静的アセットのブラウザキャッシュを効かせる | #89完了後に着手。Freeプランで実施可 |
| #90 | Bot Reportでボット比率を把握 | 設定変更なし。見るだけ。#91の判断材料 |
| #8 | 龍龍の所属・出身地等との照合 | #61の仕組みを流用できる |
| #76 | WAF（Cloudflare Managed Rulesetのみ、まずログモード） | Proで解禁 |
| #9 | CSP設定 | #7の後にやると強いポリシーが書ける |
| #78 | OGP画像を作成 | 画像制作が必要 |
| #4 | SentryでJSエラー検知 | |

### #7 の進め方（検討済み）

21ページは4つの型に分かれる。

| 型 | ページ数 | 内容 | 該当ページ |
|---|---|---|---|
| A. 表とフィルターのみ | **15** | `jpml_pros` と同じ構造。移行しやすい | ランキング3、動画4、タイトル、プロテスト、ログ、牌譜、最強戦2、良栄の成績2 |
| B. 表＋ローソク足 | 3 | `CandlestickChart` が加わる | `houou_results` / `ouka_results` / `wrc_results` |
| C. 縦棒グラフ | 2 | `ColumnChart` | `houou_leagues` / `ouka_leagues` |
| D. 横棒グラフ | 1 | `BarChart` | `resource_efficiency` |

※ ランキング3ページは `league_ranking.js`（772行）を共用している。
　 レーダーチャートの指標もこのファイルの集計ロジックを使う（新サイト）

**まず `jpml_titles.html`（型Aの代表）を1ページ移行して型を作り、
共通部分を括り出してから残りに展開する。**
#6（ワークフローの汎用化）は完了済みなので、2ページ目を追加する準備は整っている。

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

---

## 7. 関連文書

| ファイル | 内容 |
|---|---|
| `CLAUDE.md` | Claude Code がセッション開始時に読む。プロジェクトの前提 |
| `docs/new-site-design.md` | **新サイトの設計方針。**中断中で、再開手順まで書いてある |
| `docs/astro-migration-study.md` | Astro移行の技術調査（Claude Codeによる） |
| `docs/issues-snapshot.md` | issue一覧のエクスポート（本文込み） |
