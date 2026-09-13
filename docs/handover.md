# 引継ぎメモ

新しい会話でこのプロジェクトを再開するときに、最初に読む文書。
**このファイルを読めば、それまでの経緯を知らなくても作業を再開できる**ことを目的にしている。

**この文書は現状・ルール・次にやることだけを書く。** 完了した作業の実装記録は
`docs/notes/`、issue単位の経緯は GitHub Issues に置く。

最終更新: 2026-09-13

- #210: issue状況の把握を `docs/issues-open.md` / `docs/issues-snapshot.md` のエクスポートからGitHub Issues直接参照へ移行。両ファイルと生成スクリプト・PostToolUseフックを削除
- #198: A案（作業ブランチ分離）に加え、`/workspaces/mj`共有によるチェックアウト競合を防ぐため`git worktree`の使用を必須化
- #130: AIボット制御を新コントロール（Configure AI bot policies）へ設定済み（Search/Agent=Allow、Training=Block）。9/15の旧トグル廃止後に維持を確認してクローズする

---

## 0. 新しい会話の始め方

会話開始時に読むのは `docs/handover.md` のみ。
平野さんが毎回定型文を貼る前提にしない。

issueの状況（Open/Closedの別、本文・コメント）はGitHubのIssues一覧ページで
確認する。Claude Codeのセッションは `gh issue list` / `gh issue view` を使う。
チャット側（claude.ai）はClaude for Chrome経由でGitHubのIssues一覧・個別
issueページを直接読める（2026-09-13確認、#210）。

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

**リポジトリ直下に新しいディレクトリやファイルを追加したときは、
公開してよいものか確認し、公開しないものは `.assetsignore` に
追加すること。** `docs/` は2026-09-12まで除外されておらず、
`docs/*.md`（WAFカスタムルールの式やDNS設定値等を含む）が本番URLから
直接200で取得できる状態だった（#133）。

`html_handling` は `"none"` を明示している（#89）。
既定の `auto-trailing-slash` だと `/file.html` が `/file` へ
307リダイレクトされ、og:url・sitemap がすべてリダイレクト先を
指す状態になるため。

**canonicalは全27ページに未設定。** `<link rel="canonical">`が
存在しないため、上記の影響は受けない。**#113で「現行サイトには
canonicalを付けない（Googleの正規化に任せる）」と決定した（2026-09-11）。**
単純に付けるとSearch Console実測の`?name=`付き14URL（SEO節）が
正規化で検索結果から消えるため。選手個別ページと
title/descriptionの出し分けは新サイト（#101）で解く（#79も同時にクローズ）。

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
| `/img/*` | 1年・immutable |
| `/favicon.ico` `/apple-touch-icon.png` | 1日（#174でimmutableから緩和） |
| `/assets/vendor/*` | 30日 |
| HTML・ルート直下の `.css` / `.js` | 既定のまま（毎回再検証） |

ファイル名にハッシュを持たないため、HTMLとルート直下の
スクリプトには意図的にTTLを付けていない。

**`assets/vendor` 配下を更新した場合、ブラウザには最大30日
キャッシュが残る。** Cloudflareのキャッシュパージでは消えない。
即座に反映させたい場合はファイルのパスを変えること。

### ページ構成

HTMLは27ページ + 「帰り道」エピソード個別ページ38枚（`wayhome/`、#162）。大きく3系統に分かれる。

| 系統 | ページ数 | 状態 |
|---|---|---|
| `index.html` | 1 | Webサイトテンプレート（iPortfolio）由来。`index.css` と11個のvendorライブラリを使う |
| ビルド時生成（型A・15列） | 1 | `jpml_pros.html`。独自の`generate_jpml_pros.py`のまま |
| ビルド時生成（型A・2列/3列） | 9 | `jpml_titles.html` / `jpml_test.html` / `resource_logs.html` / `video_live.html` / `video_en.html` / `rh_paifu.html` / `saikyo_mens.html` / `video_mtsuku.html`(3列) / `saikyo_results.html`。`scripts/lib/page.py` + 共有JS `table.js` を使う（#7） |
| ビルド時生成（型A'・多列テキスト） | 2 | `rh_results.html` / `rh_results_detail.html`。画像列を持たないため`.mj-table-auto`を使う（#7、完了） |
| ビルド時生成（型D・静的SVG） | 1 | `resource_efficiency.html`。表を持たないため`render_content()`を使う。外部JS・外部ドメインへの依存が一切ない（#7/#128、完了） |
| ビルド時生成（型C・積み上げ棒+折れ線） | 2 | `houou_leagues.html` / `ouka_leagues.html`。積み上げ棒と既定選手の折れ線は静的SVG、`?name=`時の折れ線差し替えのみ`leagues.js`が担う（#7/#127、完了） |
| ビルド時生成（独自: 全画面ヒーロー+横スクロールカード列） | 1 | `video_wayhome.html`。#102第2段で型Aから離脱し、新サイトの先取りパイロットとして全面リデザイン（表を廃止）。`render_content()`+専用JS`video_wayhome.js`（`table.js`は使わない）。詳細は下記「video_wayhome の全面リデザイン」節とdocs/new-site-design.md「12. パイロット: video_wayhome」 |
| ビルド時生成（サブディレクトリ、ヒーロー構成のエピソード個別ページ） | 38 | `wayhome/<動画ID>.html`。#162で選手個別ページ（#101）のパイロットとして追加。`scripts/generate_wayhome_episodes.py`（`render_content()`+専用JS`wayhome_episodes.js`）。詳細は下記「#162 エピソード個別ページ38枚」節 |
| Google Charts依存 | **6** | ブラウザから直接スプレッドシートを読む。#7の対象。型B3・ランキング系A3 |
| 静的なページ | 4 | `404.html` / `jpml_links.html` / `resource_dictionary.html` / `rh_links.html` |

### データの流れ

選手データや成績はすべて**Googleスプレッドシート**にある（5冊）。

- `jpml_pros.html`と型A/A'/C/Dの15ページ(`jpml_titles` / `jpml_test` /
  `resource_logs` / `video_live` / `video_wayhome` / `video_en` / `rh_paifu` /
  `saikyo_mens` / `video_mtsuku` / `saikyo_results` / `rh_results` /
  `rh_results_detail` / `resource_efficiency` / `houou_leagues` /
  `ouka_leagues`) と、「帰り道」エピソード個別ページ38枚(`wayhome_episodes`、
  #162) … それぞれ
  `scripts/generate_<ページ名>.py`が
  ビルド時に取得してHTMLに焼き込む。`jpml_pros`以外は`scripts/lib/page.py`
  の共通処理を使う（#7）。`wayhome_episodes`だけ出力が単一ページではなく
  `wayhome/`配下38枚になる(`scripts/regenerate.py`の`OUTPUT_OVERRIDES`)
- 残り6ページ … 訪問者がページを開くたびにブラウザが `docs.google.com` へクエリを投げる

**移行済みページは、スプレッドシートを直しただけでは反映されない。**
`regenerate-page.yml` はスクリプトと対応する`.js`の変更をpushで検知する
作りで、スプレッドシートの変更そのものは検知しない。データだけを
更新したときは、ワークフローを`workflow_dispatch`で手動実行する
（`target_page`にページ名、または`all`）。旧方式（Google Charts）は
「スプレッドシートを直せば即反映」だったので、移行が進むほど手動実行の
機会が増える。**週次cron（毎週月曜05:37 JST、#103で導入済み）が`all`を
自動実行するため、手動実行は即時反映したいときのみでよい。**
**`gh-pages`ブランチは旧方式のままなので、この制約は受けない。**

### 自動化

`.github/workflows/` に5本ある。

| ワークフロー | 内容 |
|---|---|
| `regenerate-page.yml` | ページの再生成。対象は `scripts/generate_<名前>.py` の有無から自動判別する。push検知に加え毎週月曜05:37 JSTに`all`を自動実行する（#103、差分がなければコミットしない） |
| `check-image-links.yml` | 毎週月曜3時、画像1,985枚のリンク切れを確認しissueに書き出す |
| `check-ron2-images.yml` | 毎週月曜4時、龍龍の画像とサイトの表示が一致するか確認する |
| `assets-check.yml` | pushのたびに`.assetsignore`の漏れ（#133の再発）を検知する。Cloudflareへのアクセスは不要 |
| `check-leagues-dropped.yml` | 手動実行のみ。型C（`houou_leagues`/`ouka_leagues`）で選択リストから漏れている選手を検知する（#168） |

---

## 3. 作業の進め方

### 役割分担

| 場所 | 担当する作業 |
|---|---|
| **Claudeとのチャット** | 設計の相談、調査、原因の切り分け、実装案の作成 |
| **Claude Code**（Codespace内） | ファイルの編集、`gh` コマンドでのissue操作、コミット・push |

Claude Codeは Codespace のターミナルで動いている（`/workspaces/mj` で `claude`）。
`gh` が認証済みのため、issueの開閉やラベル操作がそのまま通る。

**チャット側でGitHubのブランチ名形式URLを確認するときの注意（2026-09-12）。**
ブランチ名形式はpush後もしばらく古い内容を返すことがあり、クエリ文字列や
`Cache-Control: no-cache` ヘッダを付けても回避できない。2026-09-12 に
この形式で確認した結果、**push済みの変更を「未反映」と2回誤報した**
（#76のクローズ、handoverの最終更新行）。

`refs/heads/<ブランチ名>/` 形式、またはコミットSHA指定なら正しく最新が返る。
コミットSHAが分かっている場合はそちらが確実。

```
NG: https://raw.githubusercontent.com/retroeater/mj/cloudflare/docs/handover.md
OK: https://raw.githubusercontent.com/retroeater/mj/refs/heads/cloudflare/docs/handover.md
OK: https://raw.githubusercontent.com/retroeater/mj/<コミットSHA>/docs/handover.md
```

判断に迷ったら、チャット側で断定せず Claude Code 側に
`gh issue view` / `git log` で実態を確認してもらうこと。

**GitHub Projects の操作。** `GITHUB_TOKEN`環境変数が優先されるため、
`gh project`コマンドを打つときは毎回
`env -u GITHUB_TOKEN -u GH_TOKEN gh project ...`のように環境変数を外して
実行すること（Codespace既定の`GITHUB_TOKEN`にはProjects (V2) APIの`project`
スコープがないため）。

### チャット側から渡された指示と Chat-Ref（2026-09-13）

**チャット側から渡された指示には `Chat-Ref` が付く。**
平野さんがチャット（claude.ai）で設計・判断を行い、そこで作られた
指示文をClaude Codeに貼る、という流れで作業することがある。

チャット側はGitHubリポジトリを読み取ることしかできず、指示が実際に
伝わったかどうかを知る手段がない。そのため「指示を貼り忘れたまま
完了確認をする」→「未反映と報告される」という往復が起きていた。

**`Chat-Ref:` を含む指示を受け取ったら、その作業のコミットメッセージの
末尾に同じ行をトレーラとして入れること。**

形式は `CHAT-MMDD-XX-nn`。

- `MMDD` … 発行日
- `XX` … チャットセッション識別子
- `nn` … 連番

チャットセッションは複数が並行することがあるため、連番だけでは
衝突する。セッション識別子で分離している。

例:

```
llms.txt を設置する(#161)

（本文）

Chat-Ref: CHAT-MMDD-XX-nn
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

これにより、チャット側は
`git log --all --grep="CHAT-MMDD-XX-nn" --oneline`
で到達を確認でき、未達の指示だけを再掲できる。

指示を受け取ったが実行しない判断をした場合も、その旨を平野さんに
伝えること。黙って落とすと、チャット側には「貼り忘れ」と区別がつかない。

**指示文中のラベル指定は、前提と食い違うことがある。**
2026-09-12 のレビュー起票（CHAT-0913-AR-01）で、ある issue の指示文が
「対象: 全ページ」を指定しながら、同じ指示文の前提に「『対象:』に該当する
ラベルがないページは対象ラベルを付けない」と書かれており矛盾していた。
Claude Code 側は前提を優先し、分野ラベルのみで起票した（#180。対象は
houou_leagues など5ページで、いずれも対応する「対象:」ラベルが存在しない）。
**この判断でよい。** 指示文の記述同士が食い違ったときは、個別の指定より
前提・ルールの側を優先し、その旨を報告すること。

### 複数セッションが共有するのはissueだけでなくワーキングツリーも（2026-09-12）

Codespaceを共有したまま複数のClaude Codeセッションを動かすと、片方の
作業中ファイルが、もう片方の `git status` に「出所不明の未コミット変更」
として現れる。実例: あるセッションが `docs/handover.md` の未コミット差分を
検出したが、これは別セッションが#26/#108の記述修正を作業中だったもので、
その後 `c4083c4` として正しくコミットされた。

このとき危ないのは次の2つ。

- 出所不明の差分を「不要」と判断して `git checkout` で捨てる
  → 他セッションの作業が消える
- `git add -A` でコミットする → 他セッションの作業中ファイルを巻き込む

**身に覚えのない未コミット変更を見つけたら、捨てる前に必ず `git diff` で
中身を確認し、他セッションの作業でないかを疑うこと。**
#157の着手宣言（issueコメント）はissue単位の二重着手を防ぐ仕組みで、
別々のissueを扱っていてもファイルは1つのツリーを共有するため、この
問題は防げない。

**恒久対策として、セッションごとに作業ブランチを分ける運用（A案）を
2026-09-13に決定した（#198）。** `cloudflare`は統合・デプロイ専用とし、
セッションは`work/<セッション識別子>`で作業してそこへpushする。
`cloudflare`へのマージは平野さんが判断する（マージ＝本番反映）。
`git stash`は共有パス上で他セッションの未コミット編集を無言で消しうる
ため使用しない（`git add -p`または`git apply --cached`で部分ステージ
する）。

**ただしA案には欠陥があった。** 全セッションが`/workspaces/mj`という
単一ディレクトリを共有しているため、**ブランチを分けても作業ツリーは
分かれない。** あるセッションが`git checkout`すると、他セッションの
足元のブランチも同時に切り替わる。実際にWH-22のマージ作業中、
チェックアウト先が別セッションの作業ブランチへ無断で切り替わる事象が
起きた。対策として、作業は`git worktree add`で作った専用ディレクトリで
行い、`/workspaces/mj`ではブランチ切り替えを行わないことにした
（2026-09-13、#198）。ルールの詳細はCLAUDE.mdの「ブランチ運用」に記載
（二重管理を避けるためここには複製しない）。

**チャット側の指示文が古い前提を含んでいたことが原因で、`cloudflare`への
直接pushが実際に発生した（`1b8eec6`、2026-09-13）。** チャット側の指示文が
ブランチ運用ルール制定前の書き方のままだったことが一因。CLAUDE.mdのルールを
指示文より優先する旨を明記して対応した（#205）。経緯・対応の詳細は#205参照。

**ブランチ削除は削除直前のSHAを記録しないと後から検証できない。**
#207（`claude/*`3本の削除）はSHAを記録せず、#206は指示文作成時点の
SHA（`953c19e`）が実行時には`c54277c`まで進んでいたことが後から判明した
（実行時に完全な履歴で再確認したため実害は無かった）。削除直前のSHAを
必ず記録する運用に改めた（#209）。詳細は#209参照。

**祖先関係だけでは「積み直してマージ済み」を検出できない。**
`work/0913-hv`（元`feae0e3`、#209直後にリモートから削除確認）は、
`cloudflare`の祖先ではなかったが、積み直し後`2deb7d4`として同一内容が
既に入っていた。祖先関係で未マージと即断せず、件名・差分を突き合わせて
から判定する運用に改めた（#209）。

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
- **issueに着手したら、コードを触る前に当該issueへ「着手中」のコメントを
  残す（#157）。** セッションを複数並行させると同じissueの二重着手が起きる。
  他セッションの状況を知る手段はissue上のコメントしかないため、これを
  着手宣言として使う。コメントにはセッションのURLを含める（誰の宣言か
  分からないと引き継ぎも取り下げも判断できない）。中断・放棄したときも
  その旨を残す。着手前には他セッションの宣言が無いか確認する。
  ルールの本文は `CLAUDE.md` の「issueの着手ルール」節にある。
  実例として#127（型C）が2セッションで二重着手された（片方が
  ネットワーク制約で停止していたため衝突は免れたが、偶然だった）
- **issueの状況確認はGitHub Issuesを直接見る（#210）。** エクスポート
  ファイル（`docs/issues-open.md` / `docs/issues-snapshot.md`）は廃止した。
  Claude Codeのセッションは `gh issue list` / `gh issue view`、チャット側は
  Claude for Chrome経由でGitHubのIssues一覧ページを直接読める
  （2026-09-13確認）

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
| `www.gstatic.com` / `docs.google.com` | Google Charts（残り6ページ） |
| `static.cloudflareinsights.com` | Web Analytics のビーコン本体。**送信先は自ドメインの `/cdn-cgi/rum`**（ゾーン配下で登録し直したため）。CSPでは `script-src` にのみ必要 |
| 画像12ドメイン | 選手のプロフィール画像等（→「画像ドメインの実測結果」参照） |

**#7（Charts依存の解消）が終わると2つ減る。** `saikyo_mens.html`の移行(2026-09-11)で
`abs.twimg.com`（Xアカウントなし選手の既定アイコン）への**フォールバックの**
依存は解消済み（フォールバックを`img/avatar.svg`に差し替えた）。**ただし
データ側には残っている。** スプレッドシートの画像URLとして
`abs.twimg.com/sticky/default_profile_images/...`が`jpml_pros.html`に11件、
`saikyo_results.html`に2件、計13件焼き込み済み（#135）。`resource_efficiency.html`
の静的SVG化(2026-09-11)では、外部JS(`gstatic.com`)自体が丸ごと不要になった
（グラフ系6ページで唯一、外部JSを一切読まないページになった）。
`houou_leagues.html` / `ouka_leagues.html`の型C静的化(2026-09-11)で
`gstatic.com` / `docs.google.com` への依存はさらに2ページ分解消した。

**`gstatic.com` を消すには、#111（型B 3ページ）と#141（ランキング3ページ）
の両方で Google Charts を使わない判断が要る。** ランキング3ページ
（houou_ranking / ouka_ranking / wrc_ranking）も `gstatic.com/charts/loader.js`
を読んでいるため、型Bだけ静的化してもランキング3ページで Charts を
使い続ける限り `script-src` から `gstatic.com` は外せない。

- どちらか一方でも据え置けば `gstatic.com` は残り、#9 のCSPは
  `script-src` に `gstatic.com` を許可したまま確定することになる
- 逆に言えば、**片方だけ移行しても CSP は1行も変わらない。** #111 と
  #141 は個別に判断できるが、CSPへの効果は両方そろって初めて出る
- したがって、どちらかを据え置くと決めた時点で、もう片方を#7の
  対象から外す判断も成り立つ（ただしランキング3ページのインライン
  イベントハンドラだけは別途消す必要がある。#9に記録済み）

方針は#111・#141で判断する。

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

## 4-x. 本番反映（デプロイ）の仕組み（#169の後始末、2026-09-12）

**本番反映は Cloudflare Workers Builds（ダッシュボードのGit連携）が行う。**
`cloudflare` への push をCloudflare側が検知し、`wrangler deploy`相当の
処理を自動実行する。**GitHub Actionsにデプロイを行うジョブは無い。**

### #169で何を誤ったか

#169では「セッション環境から `api.cloudflare.com` に到達できず、Cloudflare
の設定を確認できない」ことを「本番反映の経路が存在しない」と誤って結論づけ、
`.github/workflows/deploy.yml` を追加して`npx wrangler deploy`を直接叩く
ようにしていた。実際にはWorkers Buildsが既に稼働しており、この追加は
不要かつ有害（二重デプロイになりうる）だった。

- 到達できないことと存在しないことは別。確認できない領域については
  「仕組みが存在しない」という結論を出すべきではなかった
- `gh api repos/retroeater/mj/commits/<sha>/check-runs` でGitHub上の
  check-runsを見れば、Cloudflareダッシュボードに入らずに「Workers Builds: mj」
  というアプリのcheck-runが記録されていることが確認できた。実際、#153の
  検証（2026-09-11）ではこの方法でWorkers Buildsの稼働を確認済みだったが、
  #169（2026-09-12）はこれを確認せずに着手した
- 対応: `deploy.yml`は削除し、デプロイ要素を除いた検査専用の
  `.github/workflows/assets-check.yml`として残した（内容は後述）。
  `CLOUDFLARE_API_TOKEN`のSecretは登録していない（二重デプロイになるため）

### 平野さんがCloudflareダッシュボードで確認した設定値（2026-09-12時点）

**以下はセッションからは検証できない。平野さんが目視で確認した時点の値
としてそのまま記録する。** 今後この値が変わってもセッションからは気づけない。

Workers & Pages → `mj` → Settings → Builds:

| 項目 | 値 |
|---|---|
| Git repository | `retroeater/mj`（接続済み） |
| Build command | なし |
| Deploy command | `npx wrangler deploy` |
| Version command | `npx wrangler versions upload` |
| Root directory | `/` |
| Production branch | `cloudflare` |
| Builds for non-production branches | OFF（2026-09-12にOFFへ変更） |
| Build watch paths: Include | `*` |
| Build watch paths: Exclude | `node_modules/**, .git/, docs/**`（`docs/**`は2026-09-12に平野さんが追加、#171） |
| API token | `mj build token` |
| Cache | Disabled |

- Production branchが`cloudflare`のため、**このブランチへのpushは
  （`regenerate-page.yml`が押す`chore: regenerate ...`コミットも含めて）
  即座に本番へ反映される。** ワンクッションを置く仕組みは無い
  （ゲートを設けるかどうかは#170で検討中、保留）
- Build watch pathsのIncludeが`*`のため、ドキュメントのみのコミットでも
  ビルドが走っていた（`docs/**`をExcludeに追加する案は#171、平野さんが
  2026-09-12にExclude pathsへ`docs/**`を追加し完了。設定値自体はセッション
  からは検証できないため申告の記録として残す）

### APIトークンの棚卸し（2026-09-12）

**以下もセッションからは検証できない。平野さんがダッシュボードで確認・
操作した結果をそのまま記録する。**

- Workers Builds はリポジトリを接続するたびに User API Token を自動発行する。
  同名（`mj build token`）で増えるため、接続をやり直したら古いものを削除すること。
  2026-09-12 に4本→1本へ整理した
- 現役のトークンは `hirano@ryoei.net` に紐づく **User API Token**。
  Cloudflare は Account API Token を推奨しているが、Workers Builds が
  自動発行するのは User Token なので選べない。
  **このユーザーのアカウントが使えなくなると本番反映が止まる**、という依存がある
- 権限は Cloudflare が決めた範囲（25権限・All zones・無期限）で、
  `wrangler deploy` に必要な範囲を大きく超えている。
  **手で絞ると次のビルドが壊れる可能性があるため触らないこと**
- 2026-09-12、4本→1本へ整理した後の初回ビルド（Build `#5c2974bf`、対象
  コミット`1f7f76d`、ブランチ`cloudflare`）が成功（所要40秒）し、残した
  1本で本番反映が通ることを確認済み（GitHubのcheck-runsで確認。上記
  「セッション環境からは Cloudflare に到達できない」節の区別のとおり、
  確認できたのは「ビルド成功」であって本番の見え方ではない）
- 整理後、残したトークンは `mj build token (Workers Builds)` にリネーム
  済み。**ただしDeploymentsのビルド詳細（Build settings）に表示される
  Build token名は`mj build token`のままだった。** リネームの反映に時間差が
  あるのか、ビルド実行時点の名前を保持しているのかは不明。別のトークンに
  差し替わったわけではなく、同じトークンの表示上のラグと見られる（事実として記録）

### セッション環境からは Cloudflare に到達できない

**Claude Code のセッション環境は `api.cloudflare.com` も `ryoei.pro` も
ネットワークポリシーで遮断されている**（`connect_rejected`）。そのため:

- セッション内から `wrangler deploy` は実行できない。**APIトークンを渡しても
  解決しない**（認証以前に到達できない）
- **デプロイはCloudflare側が`cloudflare`へのpushで自動実行するため、
  セッションから能動的に起動する手段は無い（不要）。**
  `assets-check.yml`は検査専用でデプロイは行わない

**「ビルドが成功したか」と「本番がどう見えるか」は別物であり、確認できる
範囲が違う。この2つを混同しないこと。**

- **ビルドが成功したかどうかは確認できる。** Workers BuildsはCloudflare側で
  走るが、結果をGitHubにチェックとして書き戻す。`api.cloudflare.com`は
  遮断されていても`api.github.com`は通るため、この経路なら届く。
  `gh api repos/retroeater/mj/commits/<sha>/check-runs` で
  「Workers Builds: mj」のcheck-runを見れば、`conclusion`（success/failure）と
  実行ログへのリンクが取得できる（ダッシュボードに入らずセッションから確認可能。
  #153で実例、2026-09-12の#169後始末（`1f7f76d`）でも
  `success`を確認済み）
- **check-run は push の先頭コミットにしか付かない（2026-09-13）。**
  複数コミットをまとめて push した場合、Workers Builds の check-run が
  記録されるのは先頭の1つだけで、それ以外のコミットには何も付かない。
  実例: #26 の実装コミット `c002bd1` には check-run が無く、同じ push に
  含まれる `9780f83` に `Workers Builds: mj = success` が付いていた。
  **check-run が無いことを「反映されていない」と読まないこと。**
  確認するときは、そのコミットではなく push の先頭（＝そのとき branch の
  HEAD になったコミット）の SHA で引くこと。到達できないことと存在しない
  ことは別、という #169 の教訓と同じ型の誤りになる。
- **`docs/**` のみのコミットには Workers Builds の check-run が付かない
  （2026-09-13、#171の裏付け）。** #171 で平野さんが Build watch paths の
  Exclude paths に `docs/**` を追加したが、ダッシュボードの設定値は
  セッションから検証できないため申告の記録として残していた。実際に
  check-runs を引くと、ドキュメントのみの `c4083c4` / `8466d08` には
  GitHub Actions の `check` だけが付き `Workers Builds: mj` が無い。
  **設定値そのものは見られなくても、結果は check-runs から観測できる。**
  逆に言えば、`docs/**` のみの push で `Workers Builds` が現れたら
  設定が外れた合図になる。
- **本番が実際にどう見えるかは確認できない。** `ryoei.pro`自体が遮断されて
  いるため、check-runsの`success`は「Cloudflare側がビルドを成功として
  報告した」ことの確認であって、本番の見え方の確認ではない。反映後の
  目視確認は平野さんの作業のまま変わらない
- **この区別を曖昧にしないこと。** check-runsの`success`だけを根拠に
  「本番反映を確認しました」と報告しないこと。報告するなら
  「ビルドは成功した。本番の見え方は未確認」の粒度で書く

同じ制約で `docs.google.com`（スプレッドシート）・`www.gstatic.com`・`ron2.jp`
も遮断されている。**`scripts/regenerate.py` はセッション内では実行できず**、
再生成の確認は GitHub Actions 側で行うこと。

### check-run が queued のまま・見当たらない場合（2026-09-13）

短時間に連続して push すると、Cloudflare Workers Builds は複数コミットを
1回のビルドにまとめる。**まとめられた側のコミットには check-run が
付かないため、`gh api repos/retroeater/mj/commits/<sha>/check-runs` では
`queued` のまま、または結果が無いように見える。** これはビルドの失敗でも
遅延でもない。

判定の手順:

1. 自分のコミットに check-run が無い／queued のままでも、**その後に
   push された後続コミットの check-run を見る。** success なら自分の
   変更もそのビルドに含まれてデプロイ済み
2. それでも不明なら、Cloudflare ダッシュボードの Build history を見る
   （平野さんの作業。セッションからは `api.cloudflare.com` も `ryoei.pro` も
   遮断されている）
3. サイトのファイルを変更した場合は、本番の該当ページで反映を直接確認する
   のが最も確実

**「check-run が queued のまま」を「デプロイが詰まっている」と報告しない
こと。** 2026-09-13 に AR-18（`docs/notes/a11y-manual-check.md` 追加の
コミット `effe638`）でこの誤報が発生し、ダッシュボードを確認したところ
実際には直近11件すべて成功しており滞留はなかった。`570928b`（AR-17）と
`effe638`（AR-18）は Build history に個別の行を持たず、後続コミットの
ビルドに内容ごと取り込まれていた（AR-11・AR-14 でも同じ現象を観測済み）。

### `.github/workflows/assets-check.yml`（旧 deploy.yml）

デプロイ前に「除外後に配信される最上位の項目」をログに出し、
`.assetsignore` の漏れ（#133 の再発）を検知する。`docs` や `scripts` が
出ていたらジョブを失敗させる。Cloudflareへのアクセスは一切必要としない。

- これは**「防止」ではなく「検知」。** Workers BuildsはGitHub Actionsと
  独立に動くため、このワークフローが失敗しても本番反映は止まらない。
  止めたい場合はゲート（#170）が必要
- この検査は `git -c core.quotePath=false ls-files` を使う必要がある。
  既定では非ASCIIを含むパスが `"docs/..."` と引用符ごと出力され、先頭が
  `"docs` になって `.assetsignore` の `docs` と一致せず誤検出する
  （`docs/gsc` 配下にSearch Consoleの日本語名CSVがある）

## 5. 次にやること

**期限付き・確認待ちタスク**（2026-09-12時点）

| # | 内容 | 期限・目安 |
|---|---|---|
| #130 | AIボット制御の再設定 | 設定済み（9/13）。9/15以降に旧トグル廃止後の維持を確認してクローズ |
| #84 | GitHub Pages無効化の判断 | 9/23 |

GitHub Issues（Open）に全件あるが、着手可能な主なものは以下。

| # | 内容 | 備考 |
|---|---|---|
| **#7** | 残り6ページ（型B 3 / ランキング 3）のGoogle Charts依存を解消 | **最大の残件。** #9 の前提でもある |
| #111 | 型B 3ページ（Dashboard＋ローソク足）の移行方針を決める | #7の残り判断1/2 |
| #141 | ランキング3ページの移行方針を決める | #7の残り判断2/2 |
| #8 | 龍龍の所属・出身地等との照合 | #61の仕組みを流用できる |
| #9 | CSP設定 | #7の後にやると強いポリシーが書ける |
| #4 | SentryでJSエラー検知 | 外部サービスの登録が必要 |
| #96 | カレンダーの参照・更新を自動化 | スコープ未定。決めるべき項目が4つある |
| #178〜#186 | アクセシビリティの指摘8件＋実機確認 | 2026-09-12のレビュー。詳細は「6. これまでに分かったこと」の該当節 |

### #7 の進め方（検討済み）

**現状（2026-09-13時点）**: 21ページ中15完了・残6は#111/#141の判断待ち。
型A・型A'・型C・型D はすべて完了しており、共通部品（`lib/page.py` /
`lib/chart.py` / `lib/leagues.py` / `table.js` / `leagues.js`）は出そろって
いる。残り6ページは「作り方が分からない」のではなく「方針を決めていない」
状態。実装の詳細は `docs/notes/static-generation.md` を参照。

対象の21ページ(15ページ完了・残6)は5つの型に分かれる。

| 型 | ページ数 | 内容 | 該当ページ |
|---|---|---|---|
| A. 表とフィルターのみ | 12(**完了9・残3**) | `jpml_pros` と同じ構造。移行しやすい | `jpml_titles`(完了)、`jpml_test`(完了)、`resource_logs`(完了)、`video_live`(完了)、`video_en`(完了)、`rh_paifu`(完了)、`saikyo_mens`(完了)、`video_mtsuku`(完了)、`saikyo_results`(完了)、ランキング3(残り) |
| A'. 多列テーブル（表のみ） | 2(**完了2・残0**) | `jpml_pros`と同じ表構成だが6〜8列あり、`.mj-table-2col`/`.mj-table-3col`がそのままでは使えない（#109）。**完了** | `rh_results`(完了、12行・6列) / `rh_results_detail`(完了、321行・8列) |
| B. 表＋ローソク足 | 3 | `Dashboard`(名前/期/リーグの`ControlWrapper`。ページごとに構成が違う) + `Table`(`page:'enable'`) + `?name`時のみ`CandlestickChart`。型A/A'と同じ手順では表を静的化できない（#111） | `houou_results` / `ouka_results` / `wrc_results` |
| C. 縦棒グラフ | 2(**完了2・残0**) | `ColumnChart`(積み上げ棒は全員共通、`?name`時に選手の折れ線1本を追加。静的SVG+折れ線だけクライアント描画のハイブリッドで移行（#127、**完了**）) | `houou_leagues`(完了) / `ouka_leagues`(完了) |
| D. 横棒グラフ | 1(**完了1・残0**) | `BarChart`。URLパラメータに依存せずデータも34行で固定。グラフ系で唯一、静的SVG化が成立する（#128、**完了**） | `resource_efficiency`(完了) |

※ ランキング3ページは `league_ranking.js`（772行）を共用している。
　 レーダーチャートの指標もこのファイルの集計ロジックを使う（新サイト）

**型Bが残る唯一の移行方針未決定。** 表の静的化だけなら型A/A'と同じ手順で
進められるが、Google Charts据え置き・ライブラリ変更・静的SVG化のどれを
取るかで外部ドメイン依存の扱いが変わる。判断は#111。型C(#127)・型D(#128)
は静的SVGハイブリッドで完了済み。

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
- **DOM規模の最大の懸念ページは`houou_results`（15,416行）。** `?name`は
  任意で、未指定時は表(`myTable`)が無条件で描画されるが、現在は
  Google Chartsの`page:'enable'`+`pageSize:500`がDOMをページ単位で
  分割しているため500行に収まっている。自前の`row.hidden`方式に置き換えると
  この行数がそのままDOMに乗るため、**#7最大のDOM規模ページになる見込み**。
  `ouka_results`/`wrc_results`も同様に`?name`任意だが行数は少ない
  （1,500〜1,600台）で実害は小さい。`saikyo_results`は2026-09-11に
  移行済みで、`page_size=100`の`.mj-pager`を使うため「2,560行を無条件で
  全件描画」の懸念は解消済み。詳細は`docs/lighthouse-baseline.md`の
  行数調査表を参照

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

**型Aの2列ページ（画像 + 概要）には `.mj-table-2col` を付ける。**
画像列を168px固定、概要列を残り幅に伸縮させ、概要は折り返す
（style.cssの`.mj-table-2col`）。`.mj-table`本体は変えず修飾クラスとして
追加したため、15列の`jpml_pros`（`table-layout: fixed` / `width: 934px`
のまま）には影響しない。
移行済みの8ページ（`jpml_titles` / `jpml_test` / `video_live` /
`resource_logs` / `video_en` / `rh_paifu` /
`saikyo_mens` / `saikyo_results`）に適用済み。`video_mtsuku`のみ3列のため、
新設した`.mj-table-3col`（画像列168px固定＋残り2列を折り返し）を使う。
`video_wayhome`は#102第2段で表自体を廃止したため対象外。

---

## 6. これまでに分かったこと

完了済み作業の実装記録は `docs/notes/` に移した。ここには結論と参照先だけを残す。

### パフォーマンス

INPは458ms（良好とされる200msの2倍以上）。原因は1,102行すべての再描画。
仮想スクロールは不採用（Ctrl+Fで見つからなくなるため）。根本解決は表示件数を
絞ること（#24の五十音タブ、新サイトで対応）。→ `docs/notes/site-findings.md`

### 配信まわり・Cloudflareの設定

2026-09-09〜10にアイコンフォント廃止・Google Fonts廃止・Bootstrapソース
マップ削除など6件を実施し配信まわりが一区切りついた。www→apexのRedirect
Rule、Speed設定、DNS・メール・通知、AIクローラー制御（#130）、Cloudflare
Proでできること・できないこと、検討して見送った技術の一覧も含む。
→ `docs/notes/cloudflare.md`

### #7（静的化）で用意した共通部品

`scripts/lib/page.py` / `table.js` / `lib/chart.py` / `lib/leagues.py` /
`leagues.js`で型A・A'・C・Dの共通部品が完成。個別ページ移行時の注意点も
記録している。→ `docs/notes/static-generation.md`

### video_wayhome / wayhome エピソードページ

#102第1段（ヒーロー画像追加）→第2段（表形式をやめ全画面ヒーロー+横スクロール
へ全面リデザイン、新サイトの先取りパイロット）→#162（「帰り道」38本を
個別ページ化し、選手個別ページ〈#101〉のURL設計・canonical・サイトマップ
分割を先行検証）の経緯。→ `docs/notes/video-wayhome.md`

### サイトの調査・実測結果

ランキング系3ページの性質（`league_ranking.js`が9部門を集計するエンジン）、
画像ドメインの実測（gstatic除き12ドメイン）、favicon・apple-touch-icon、
index.htmlの特殊性、SEO実測（llms.txt・GSC）、URLパラメータの棚卸し、
外部サービスの利用可否判断、リンクの配色（#26/#108でAAA基準の`#14459b`へ）。
→ `docs/notes/site-findings.md`

### アクセシビリティの静的レビュー（2026-09-12、#178〜#185）

※ #178〜#186 が全件クローズしたら、この節は docs/notes/site-findings.md
　 へ移し、ここには結論1行と参照だけを残す

チャット側で全ページのアクセシビリティ静的レビューを行い、8件を起票した。
**実機のスクリーンリーダー・axe-core・Lighthouse による検証はしていない。**
コードの読解のみで判定しているため、実装前に各 issue で実機確認すること
（通し確認そのものは #186 として起票済み）。

| # | 内容 | 再生成 |
|---|---|---|
| #178 | navbar.js の `id="navbarDropdown"` 7重複・英語 aria-label | 不要 |
| #179 | 固定ナビ下にフォーカスが隠れる（`scroll-padding-top` 1行） | 不要 |
| #180 | `select#selectbox` のラベル欠落・選択即遷移（5ページ） | leagues 2ページのみ要 |
| #181 | jpml_pros の名前セルを `th scope="row"` | 要 |
| #182 | `<main>` とスキップリンクをテンプレートに追加（25ページ） | 要（全ページ） |
| #183 | `target="_blank"` 16,699件に別タブの予告がない | 要（全ページ） |
| #184 | ページ送りが disabled になるとフォーカスが消える | 不要 |
| #185 | index.html のモバイルナビ開閉が `<i>` でキーボード操作不可 | 不要 |

**まとめ方の目安**

- #178 / #179 / #184 は単一ファイルの修正で再生成不要。1セッションで片付く
- #181 / #182 / #183 は `lib/page.py`・`generate_jpml_pros.py` を触るため
  全ページ再生成を伴う
- #180 のランキング3ページ分は #141 の移行要件に含めた（#111 にも同じ
  要件をコメント済み）。leagues 2ページだけ先に対応できる

**Lighthouse で拾えていない指摘がある。** #163 の対応後、生成済みページの
accessibility は 0.98〜1.00 で残指摘は landmark-one-main のみという状態
だったが、#178 はその状態でも存在していた。**スコアを到達点として
扱わないこと。**

**#183 は実装前に方針判断が要る。** (a) visually-hidden の予告テキストを
足す / (b) そもそも別タブをやめる、のどちらか。16,699件すべてに影響する。

実機での通し確認（#186）用のチェックリストは `docs/notes/a11y-manual-check.md` にある。

---

## 7. 関連文書

| ファイル | 内容 |
|---|---|
| `CLAUDE.md` | Claude Code がセッション開始時に読む。プロジェクトの前提 |
| `docs/new-site-design.md` | **新サイトの設計方針。**中断中で、再開手順まで書いてある |
| `docs/astro-migration-study.md` | Astro移行の技術調査（Claude Codeによる） |
| `docs/lighthouse-baseline.md` | Lighthouse実測の記録（ページ別スコア・行数調査等） |
| `docs/gsc/` | Search Consoleのエクスポート（#142） |
| `docs/review-followup-instructions.md` | 2026-09-11の包括レビュー指摘への対応記録（完了済み・参照のみ） |
