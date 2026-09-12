# 引継ぎメモ

新しい会話でこのプロジェクトを再開するときに、最初に読む文書。
**このファイルを読めば、それまでの経緯を知らなくても作業を再開できる**ことを目的にしている。

最終更新: 2026年9月12日（#102第2段: video_wayhomeを新サイトの先取りパイロットとして全面リデザイン。判断材料はdocs/new-site-design.md「12. パイロット: video_wayhome」に集約。#110/#76クローズ、#142初回計測とGSCエクスポート保存、#103週次cron導入、スナップショットのpush手順とチャット側の確認方法を明記。#157: 型CのCSSが#152のコミットに混入した件を整理し、issueの着手宣言とコミット範囲の確認をルール化）

---

## 0. 新しい会話の始め方

次のように伝えれば、必要な文脈が渡る。

```
ryoei.pro の改善を進めています。
リポジトリは https://github.com/retroeater/mj の cloudflare ブランチです。
docs/handover.md を読んでから、docs/issues-open.md で
現在のタスク状況を確認してください。
今日は #◯◯ に取り組みます。
```

`docs/issues-open.md` はOpenのみの要約版。指示が正しく実施されたか
（Closeされたか）を確認するときは、全件版の `docs/issues-snapshot.md`
を参照する（Open版はCloseされると当該issueが消えるため追跡できない）。

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
| ビルド時生成（型A・2列/3列） | 9 | `jpml_titles.html` / `jpml_test.html` / `resource_logs.html` / `video_live.html` / `video_en.html` / `rh_paifu.html` / `saikyo_mens.html` / `video_mtsuku.html`(3列) / `saikyo_results.html`。`scripts/lib/page.py` + 共有JS `table.js` を使う（#7） |
| ビルド時生成（型A'・多列テキスト） | 2 | `rh_results.html` / `rh_results_detail.html`。画像列を持たないため`.mj-table-auto`を使う（#7、完了） |
| ビルド時生成（型D・静的SVG） | 1 | `resource_efficiency.html`。表を持たないため`render_content()`を使う。外部JS・外部ドメインへの依存が一切ない（#7/#128、完了） |
| ビルド時生成（型C・積み上げ棒+折れ線） | 2 | `houou_leagues.html` / `ouka_leagues.html`。積み上げ棒と既定選手の折れ線は静的SVG、`?name=`時の折れ線差し替えのみ`leagues.js`が担う（#7/#127、完了） |
| ビルド時生成（独自: 全画面ヒーロー+横スクロールカード列） | 1 | `video_wayhome.html`。#102第2段で型Aから離脱し、新サイトの先取りパイロットとして全面リデザイン（表を廃止）。`render_content()`+専用JS`video_wayhome.js`（`table.js`は使わない）。詳細は下記「video_wayhome の全面リデザイン」節とdocs/new-site-design.md「12. パイロット: video_wayhome」 |
| Google Charts依存 | **6** | ブラウザから直接スプレッドシートを読む。#7の対象。型B3・ランキング系A3 |
| 静的なページ | 4 | `404.html` / `jpml_links.html` / `resource_dictionary.html` / `rh_links.html` |

### データの流れ

選手データや成績はすべて**Googleスプレッドシート**にある（5冊）。

- `jpml_pros.html`と型A/A'/C/Dの15ページ(`jpml_titles` / `jpml_test` /
  `resource_logs` / `video_live` / `video_wayhome` / `video_en` / `rh_paifu` /
  `saikyo_mens` / `video_mtsuku` / `saikyo_results` / `rh_results` /
  `rh_results_detail` / `resource_efficiency` / `houou_leagues` /
  `ouka_leagues`) … それぞれ
  `scripts/generate_<ページ名>.py`が
  ビルド時に取得してHTMLに焼き込む。`jpml_pros`以外は`scripts/lib/page.py`
  の共通処理を使う（#7）
- 残り6ページ … 訪問者がページを開くたびにブラウザが `docs.google.com` へクエリを投げる

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

**GitHub Projects の操作（2026-09-11に解消済み）。**
Codespace既定の`GITHUB_TOKEN`（`ghu_...`）にはProjects (V2) APIの`project`
スコープがなく、`gh project`系コマンドは`Resource not accessible by
integration`で弾かれていた。fine-grained PATもProjectsには対応していない
（GitHub側の制限）。`project`・`read:org`・`repo`スコープ付きのclassic PAT
を発行し`gh auth login --with-token`で設定済み。ただし`GITHUB_TOKEN`環境変数の
方が優先されるため、`gh project`コマンドを打つときは毎回
`env -u GITHUB_TOKEN -u GH_TOKEN gh project ...`のように環境変数を外して
実行すること。
この制約で権限不足だった期間にcloseされ、ボードに未登録のまま残っていた
issue71件（#1〜#100台の大半）は、2026-09-11に一括追加しDoneステータスを
設定して解消した。

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
- **`docs/issues-snapshot.md`（全件）と `docs/issues-open.md`（Openのみ）は
  本文込みのエクスポート。** 用途を分けている:
  セッション開始時は `issues-open.md`、指示が正しく実施されたか
  （Closeされたか）の確認には `issues-snapshot.md`（全件）を使う
  （Open版はCloseされると当該issueが消えるため追跡できない）。
  両ファイルは Claude Code の PostToolUse フックで `gh issue` 操作の
  たびに同じタイミングで自動再生成される (`scripts/build_issues_snapshot.py`)。
  ワークフローではないため、`gh issue` 以外の経路（GitHub MCP、
  `gh api`、ブラウザ）で操作した場合も反映されない。作業の最後に
  `python3 scripts/build_issues_snapshot.py` を手動実行すること。
  **再生成しただけではリモートに反映されない。**
  生成物は `docs/` 配下のファイルなので、`git add docs/issues-snapshot.md
  docs/issues-open.md` → コミット → `git push origin cloudflare` まで
  行って初めて反映される。フックによる自動再生成の場合も同じ。
  念のため正確な状態は `gh issue list` で確認すること（#140、#143）

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
| 画像7ドメイン | 選手のプロフィール画像 |

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
| Build watch paths: Exclude | `node_modules/**, .git/` |
| API token | `mj build token` |
| Cache | Disabled |

- Production branchが`cloudflare`のため、**このブランチへのpushは
  （`regenerate-page.yml`が押す`chore: regenerate ...`コミットも含めて）
  即座に本番へ反映される。** ワンクッションを置く仕組みは無い
  （ゲートを設けるかどうかは#170で検討中、保留）
- Build watch pathsのIncludeが`*`のため、ドキュメントのみのコミットでも
  ビルドが走る（`docs/**`をExcludeに追加する案は#171、保留）

### セッション環境からは Cloudflare に到達できない

**Claude Code のセッション環境は `api.cloudflare.com` も `ryoei.pro` も
ネットワークポリシーで遮断されている**（`connect_rejected`）。そのため:

- セッション内から `wrangler deploy` は実行できない。**APIトークンを渡しても
  解決しない**（認証以前に到達できない）
- **本番の状態を確認することもできない。** 反映後の目視確認は平野さんの作業になる
- **デプロイはCloudflare側が`cloudflare`へのpushで自動実行するため、
  セッションから能動的に起動する手段は無い（不要）。**
  `assets-check.yml`は検査専用でデプロイは行わない
- 反映済みかどうかだけは `gh api repos/retroeater/mj/commits/<sha>/check-runs`
  で「Workers Builds: mj」のcheck-runの`conclusion`を見れば確認できる
  （ダッシュボードに入らずセッションから確認可能。#153で実例あり）

同じ制約で `docs.google.com`（スプレッドシート）・`www.gstatic.com`・`ron2.jp`
も遮断されている。**`scripts/regenerate.py` はセッション内では実行できず**、
再生成の確認は GitHub Actions 側で行うこと。

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
| #130 | AIボット制御の再設定 | 9/15 廃止後すみやかに |
| #84 | GitHub Pages無効化の判断 | 9/23 |

`docs/issues-snapshot.md` に全件あるが、着手可能な主なものは以下。

| # | 内容 | 備考 |
|---|---|---|
| **#7** | 残り6ページ（型B 3 / ランキング 3）のGoogle Charts依存を解消 | **最大の残件。** #9 の前提でもある |
| #78 | OGP画像を作成 | 画像制作がボトルネック。デジタル庁素材が候補 |
| #8 | 龍龍の所属・出身地等との照合 | #61の仕組みを流用できる |
| #9 | CSP設定 | #7の後にやると強いポリシーが書ける |
| #4 | SentryでJSエラー検知 | 外部サービスの登録が必要 |
| #96 | カレンダーの参照・更新を自動化 | スコープ未定。決めるべき項目が4つある |

### #7 の進め方（検討済み）

**2026-09-12時点の区切り**: 21ページ中15完了・残6。残るのは型B 3ページ
（#111）とランキング3ページ（#141）の2つの判断のみ。型A・型A'・型C・型D
はすべて完了。共通部品（`lib/page.py` / `lib/chart.py` / `lib/leagues.py` /
`table.js` / `leagues.js`）は出そろっており、残り6ページは「作り方が
分からない」のではなく「方針を決めていない」状態。

対象の21ページ(15ページ完了・残6)は5つの型に分かれる。

| 型 | ページ数 | 内容 | 該当ページ |
|---|---|---|---|
| A. 表とフィルターのみ | 13(**完了10・残3**) | `jpml_pros` と同じ構造。移行しやすい | `jpml_titles`(完了)、`jpml_test`(完了)、`resource_logs`(完了)、`video_live`(完了)、`video_wayhome`(完了)、`video_en`(完了)、`rh_paifu`(完了)、`saikyo_mens`(完了)、`video_mtsuku`(完了)、`saikyo_results`(完了)、ランキング3(残り) |
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
- **残り17ページの行数調査で `saikyo_results`（2,560行、`?name`指定なしで
  全件描画）が `jpml_pros`（1,099行）を上回る最大の懸念ページと判明した。**
  ただしこれは訂正が必要（2026-09-11、実機確認）: `houou_results`
  （15,416行）も`?name`は任意で、未指定時に表(`myTable`)は無条件で
  描画される。現在DOM行数が500に収まっているのはGoogle Chartsの
  `page:'enable'`+`pageSize:500`が実際にDOMをページ単位で分割している
  ためで、自前の`row.hidden`方式に置き換えると`houou_results`が
  `saikyo_results`を超えて**#7最大のDOM規模ページになる**。
  `ouka_results`/`wrc_results`も同様に`?name`任意だが行数が少なく
  （1,500〜1,600台）実害は小さい。`houou_leagues`/`ouka_leagues`は
  `ColumnChart`への集計後は数十行、ランキング系3ページは
  `DEFAULT_RANK_LIMIT`により実際のDOM規模リスクは低い。詳細は
  `docs/lighthouse-baseline.md` の行数調査表を参照
  （**`saikyo_results`は2026-09-11に移行済み。`page_size=100`の
  `.mj-pager`を使うため、危惧していた「2,560行を無条件で全件描画」には
  なっていない。実測値は`docs/lighthouse-baseline.md`の移行結果を参照**）

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
移行済みの9ページ（`jpml_titles` / `jpml_test` / `video_live` /
`resource_logs` / `video_wayhome` / `video_en` / `rh_paifu` /
`saikyo_mens` / `saikyo_results`）に適用済み。`video_mtsuku`のみ3列のため、
新設した`.mj-table-3col`（画像列168px固定＋残り2列を折り返し）を使う。

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

#### 配信の実測（2026-09-11 に確認）

| 確認項目 | 結果 | 意味 |
|---|---|---|
| `curl -sI https://www.ryoei.pro/jpml_pros.html` | **200** | www と apex の両方が同じ内容を配信していた。**Redirect Ruleで解消済み（下記）** |
| `curl -sI https://ryoei.pro/jpml_pros.html` の `cf-cache-status` | **HIT** | HTML はすでにエッジキャッシュから配信されている |

**HTML はすでにキャッシュされているため、Cache Rules で HTML のエッジキャッシュを
足す余地はない。** 「Initial server response time 400ms」の原因はキャッシュ不足では
なく、Workers 静的アセット配信そのものの応答時間である、という当初の記録が
実測で裏付けられた。同じ検討を繰り返さないこと。

副次的に、Speed Brain の動作条件のひとつ「キャッシュ適格であること」は
満たされていることも確認できた。

#### www→apexのRedirect Rule（#115、2026-09-11対応完了）

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

**Preserve query string は必須。** `?name=` 付きURLが検索流入の主力（検索結果に
出た22URLのうち14件、SEO節）で、無効にすると www 経由の流入が全件表示ページに
着地してしまう。エンコード済みURLで308とクエリ文字列保持済みの`location`を確認済み。

#### Cloudflareの機能が「効くかどうか」の判定について

Workers 静的アセット配信にはオリジンサーバーが存在しないため、
オリジンを前提とする機能は効かない（#71 / Polish / Mirage / Argo）。
2026-09-11 に Speed Brain も同じ理由で効かないことが確認された。

**判定は「設定が有効か」ではなく「実際の動作」で見ること。**
Speed Brain の場合、有効化すると `Speculation-Rules` ヘッダは正常に付与される。
しかし実際の prefetch リクエストは全件拒否される。

    curl -sI -H "sec-purpose: prefetch" https://ryoei.pro/jpml_titles.html | head -1

    HTTP/2 503
    cf-speculation-refused: prefetch refused: disabled for worker requests

ヘッダの有無だけを見ると「機能している」と誤判定する。
今後 Cloudflare の新機能を検討するときは、同じ落とし穴に注意すること。

#### 日本語を含むURLをcurlで検証すると400が返る（curl固有の挙動、実害なし）

curl は URL の非ASCIIバイトをそのまま送るため、HTTP リクエストラインの
パース段階でエッジが 400 を返す。ブラウザは href を解釈してリクエストを送る
時点で自動的にパーセントエンコードするため、実際のクリック遷移では起きない。
apex へ直接投げても同じ 400 になることを確認済みで、www リダイレクト（#115）とは
無関係。

生成ページの内部リンクは `?name=夏目一花` のように日本語をそのまま HTML 属性値に
埋め込んでいるが、これは仕様上問題ない。

検証するときは URL エンコード済みの形を使うこと:

    curl -sI "https://www.ryoei.pro/jpml_pros.html?name=%E5%B9%B3%E9%87%8E%E8%89%AF%E6%A0%84" | head -5

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
  - `content_before`(h1直後・`#searchBoxes`手前に差し込むページ固有の
    HTMLブロック。既定は空文字で、空文字のときはテンプレート出力が
    バイト単位で無変化。`video_wayhome`のヒーロー画像で使用。#158の
    lead文もこのスロットの手前にPageMeta側で足す想定、#102)
- `build_image_cell(alt, url, image_url, css_class, width, height, fallback)`:
  画像セル共通処理。`url`が空なら`<a>`で包まず`<img>`のみを返す
  (`saikyo_mens`のXアカウントなし行で使う分岐)
- `generate(spreadsheet_id, sheet_name, query, output_path, meta, table_config,
  build_row_html, formatted=False, build_content_before=None)`:
  取得〜書き出しまでの`main()`相当。`build_content_before(raw_rows) -> str`を
  渡すと、取得済みの全行から`content_before`用HTMLを組み立てて`render()`に渡す
  (`video_wayhome`の最新話ヒーローが該当。取得済み行に依存しない静的な
  `content_before`は`TableConfig`側にそのまま渡せばよく、この引数は不要)
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

**2026-09-11、型A'(多列テキストテーブル、画像列なし)を`rh_results`→
`rh_results_detail`の順に移行し完了した。** 型Bの表部分もこの共通部品を
使う想定。

- `TableConfig.show_filter`(既定`True`)を追加した。`False`にすると
  `#searchBoxes`ごと出力せず(`search_boxes_before`/`after`があればそれだけは
  出す)、`<table>`の`data-filter-param`属性も付けない。`rh_results`が
  最初の適用例
- `.mj-table-auto`(style.css)を新設した。`.mj-table-2col`/`.mj-table-3col`は
  1列目を画像168px固定にする前提のため、画像列を持たないページでは使えない。
  こちらは`width: 100%`のみを指定し、列幅は`table-layout: auto`の自動計算に
  任せる(旧Google Charts版の`options.width: '100%'`と同じ見た目になる)
- `table.js`のテーブル検出セレクタを`.mj-table[data-filter-param]`から
  `.mj-table`に変更した。絞り込み欄を持たないページでも
  `updateOffsets()`(`--navbar-height`/`--content-offset`の設定)は必要で、
  これが走らないとstickyヘッダーとbodyの`padding-top`が既定値90pxのまま
  固定されるため。`jpml_pros.html`は`table.js`を読み込まず`jpml_pros.js`を
  使うため、この変更の影響を受けない
- **`fetch_sheet()`に`formatted: bool = False`を追加した。** gvizの
  レスポンスは生の数値(`v`)とは別に表示用文字列(`f`)を持ち、シートの
  表示形式(`#,##0.0`等)が反映されている。旧Google Charts版の`Table`は
  `f`をそのまま描画していたため、`rh_results`のような小数・桁区切りを
  持つ数値列は`v`だけでは見た目が変わってしまう(`1861.4000000000012`の
  ような生の浮動小数になる)。`formatted=True`にすると、セルに`f`が
  あればそれを優先して使う。**既定は`False`のまま。** 選手IDやYouTube
  動画IDなどURL・HTML属性に埋め込む値では`f`の桁区切り("6,010")が
  リンクを壊すため(`_normalize()`がfloatの"6010.0"を防いでいるのと
  同じ問題)。`generate()`(page.py)も`formatted`引数をそのまま
  `fetch_sheet()`へ渡す(表示の設定ではなくデータ取得の設定のため
  `TableConfig`ではなく`generate()`の引数にした)。`rh_results`が最初の
  適用例。数値列を含む他のページを移行する際は、URL・属性に使う列が
  含まれていないことを確認したうえで`formatted=True`を使う
- **必要な列はQUERY側で最初から絞り込む。** 旧Google Charts版は
  `SELECT A,B,...V`のように全列を取得してから`view.setColumns([...])`で
  表示列を間引くことが多いが、Python移行では22列取得して後から捨てるより
  `SELECT A,C,E,G,I,R,S,T,V WHERE W = "Y"`のように必要な列だけを最初から
  クエリする。gvizのWHERE句はSELECTに含めない列も参照できるため、絞り込み
  専用の列(旧`W`列)をSELECTに含める必要はない(`rh_results_detail`で適用)
- **テキストの後ろにアイコンを添えるセルは`build_image_cell()`を使わない。**
  `build_image_cell()`は画像セル1つを丸ごと作る関数で、`rh_results_detail`の
  対局名+Xアイコンのように「テキスト + 条件付きでアイコン付きリンクを後置」
  という形には合わない。この場合はセルの組み立てをそのまま`build_row_html`
  内に書く。アイコンのalt属性は`f"{name} X"`のように「名前 サービス名」の
  形式にそろえる(`jpml_pros`の`get_x()`等と同じ慣習。旧版は`alt="Twitter"`
  固定だった)
- **セルの折り返しは列を選ばず全体に適用したほうが安全な場合がある。**
  `rh_results_detail`は当初、明らかに長い3列だけ`white-space: normal`に
  していたが、旧Google Charts版のTable chartを実レンダリングして比較した
  ところ、**全列を折り返しており**、短そうに見える列(団体・着順)にも
  実測すると幅を圧迫する例外的に長い値があった。列を選ばず
  `#<table_id> td { white-space: normal; overflow-wrap: anywhere; }`と
  指定するほうが、旧版との差分調査の手間も含めて安全

**2026-09-11、型D(静的SVG、表を持たない)として`resource_efficiency`を
移行した。** グラフ系6ページの中で唯一、URLパラメータに依存せずデータ量も
固定(34行)のため、完全に静的SVG化できた。

- `scripts/lib/page.py`に`render_content(meta, body_html, extra_head="")`を
  追加した。`render()`(表を持つページ用)と違い`table.js`は読み込まない。
  これに伴い`PAGE_TEMPLATE`から`<head>`部分を`HEAD_TEMPLATE`として切り出し、
  `PAGE_TEMPLATE`/`CONTENT_TEMPLATE`の両方がそれを取り込む形にした。
  既存11ページの出力が1バイトも変わらないことを確認済み
- `scripts/lib/chart.py`を新規作成し、横棒グラフのSVG生成
  (`horizontal_bar_chart()`)をまとめた。外部の描画ライブラリ
  (matplotlib等)は使わず、SVG文字列をPython側で直接組み立てる方式
  (scripts/配下は現在すべて標準ライブラリのみで完結している)。
  `#127`(型C)は積み上げ棒+選手の折れ線という別物のため、汎用化を
  狙いすぎず横棒グラフに限定した
- **ツールチップはJS/CSSなしで再現できる。** 各棒を`<g>`で包み内側に
  `<title>`を置くと、ブラウザが標準のホバーツールチップを表示する。
  この事実は#111/#127/#128の3issueすべてにコメントで追記した
  (3issueとも「ツールチップは失われる」を静的化のデメリットとして
  挙げていたが、これは誤りだったため)
- **「幅100%・高さ700pxの両立」はviewBoxのアスペクト比固定だけでは
  実現できなかった。** 幅に応じて高さも比例して変わるため、デスクトップ
  幅(1280px)でほぼ700pxになるよう設計したSVGは、375px幅では高さも
  文字サイズも同じ比率で縮み読めなくなった。CSSで文字サイズだけを
  引き上げる案は、バーの太さ・行間が連動せず文字が行をまたいで重なり
  失敗した。最終的にデスクトップ用・モバイル用で寸法設計を変えた2枚の
  SVGを両方埋め込み、`@media (max-width: 480px)`で表示を切り替える形に
  した。詳細な経緯は`scripts/lib/chart.py`のモジュールdocstring参照

**2026-09-11、型C(積み上げ棒+選手1名の折れ線)として`houou_leagues` /
`ouka_leagues`を移行した。** 方針は(c)静的SVG+折れ線だけクライアント描画の
ハイブリッド（ECharts等の導入は見送り）。着手前の事前調査で
egressポリシーに阻まれ実データを見られない状態が一度あり、そのときの
コード精読の結果（E列の正体・A1/A2補完・鳳凰位の扱い等）をissue #127の
コメントに残してから再開した。実データで検証し直したところ、いくつか
コードの精読だけでは分からなかった論点が見つかった。

- **選手選択リストの出典が不明だった。** 旧HTMLの`<option>`一覧
  （houou 695名・ouka 149名）は、鳳凰・桜花シートの参加経験者
  （1,296名・248名）の単純なサブセットではなく、出典を特定できな
  かった。検証の結果、**「プロ」シートのY列="Y"（公開対象）かつ
  鳳凰最高/桜花最高列に値がある選手**を採用した（houou 716名・
  ouka 178名）。この基準は`jpml_pros.html`が同じ列を使って
  `houou_leagues.html?name=`のリンクを生成しているのと同じ条件で、
  「URLパラメータの棚卸し」の内部リンク件数表（716/178件）と一致する。
  前原雄大・土田浩翔・阿部孝則の3名は「プロ」シートの鳳凰最高列が
  未記入のため候補から漏れるが、**2026-09-12に平野さんへ確認した結果、
  3名はいずれも現時点で連盟の所属プロではないと判明した。** 鳳凰位
  経験の有無にかかわらず非所属プロ（`jpml_pros`に存在しない選手）は
  選択肢に含めない方針を確定し、現在の生成条件は意図どおりに機能して
  いる（データ不備ではなく修正不要、詳細は#127のコメント）
  - 選定した候補選手のうち、鳳凰/桜花シートの実データに1件もヒットしない
    選手（houou 25名・ouka 14名）は生成時にスキップする（選んでも
    折れ線が出ない項目を作らないため）。**この25名/14名は表記ゆれでは
    なく、進行中の期（houou 43後・ouka 21期）が初参加である選手。**
    成績未確定のためこの期を積み上げ棒から除外している結果、実データが
    0件になっている。期が確定すれば自然に解消するが、**新しい期が
    始まるたびに、その期が初参加の選手が一時的にスキップされる現象は
    毎期発生する。** これに伴い、`jpml_pros`が生成するリンク数
    （716本/178本）と`<option>`の実数（691名/164名）が毎期ズレるが、
    **これは意図的なズレとして許容する**（2026-09-12判断、詳細は
    #127のコメント）
- **最新の進行中の期は積み上げ棒からも除外する。** houou 43後・ouka 21期は
  リーグ配属は決まっているが対局はこれからで、順位(F列)が全行空になる。
  「F値が1件もない期は除外する」規則（`lib/leagues.py`の
  `select_periods()`）で旧版と同じ見た目（houou52期・ouka20期）になる
- **y軸の最大値は独自にキリの良い値を設定する。** 旧版の実際の描画を
  実測（選手の折れ線の座標とその値を回帰）したところ、Google Chartsの
  自動スケーリングは単純な「最大値を丸める」ではなく、0にも実データ最大値
  にも揃わない独自のpaddingが乗っていた。忠実な再現は狙わず、その期の
  最大積み上げ合計を基準に自前で丸めた値を使う
- **鳳凰位はvalue=0として明示的に扱う。** 旧JSは鳳凰位を除外しておらず、
  `0(上位人数) + null(順位) = 0`というJSの暗黙変換でたまたま最上部に
  来ていた。桜花側の同様のプレースホルダ行（「桜花」、前期優勝者）は
  `WHERE F > 0`で最初から除外されるため特別扱い不要
- **凡例はページ送りJSをやめてflex-wrapにした。** 旧版はモバイル幅で
  13色/5色の凡例が`◀ 1/4 ▶`のようなページ送りUIになっていたが、
  `lib/chart.py`の`render_legend()`で単純なflex-wrapの凡例に変更し、
  ページ送りJS自体をなくした。色見本は`style`属性ではなく`<svg><rect
  fill="...">`にしている（#9のCSP前提。style属性はインラインスタイルとして
  弾かれうるが、SVGのfill属性はプレゼンテーション属性で対象外）
- `scripts/lib/chart.py`に`stacked_column_chart()`（積み上げ棒+折れ線の
  SVG生成）と`render_legend()`を追加。型D同様、デスクトップ用・モバイル用の
  2枚のSVGを生成し`@media (max-width: 480px)`で切り替える
- `scripts/lib/leagues.py`を新規作成。houou/ouka で異なるのは期の形
  （年+前後 / 期のみ）とzero_leagues（鳳凰位相当）の有無だけなので、
  集計処理（`select_periods` / `count_leagues` / `upper_counts` /
  `build_player_series`）を共通化した
- `leagues.js`（houou_leagues.html / ouka_leagues.html共通）を新規作成。
  `?name=`が無ければ何もしない（焼き込み済みの既定選手のまま）。あれば
  `houou_leagues_data.json` / `ouka_leagues_data.json`（選手ごとの
  折れ線データ、{名前: [[期のindex, value], ...]}）をfetchし、
  `<polyline>`のpoints属性と凡例ラベルを差し替える。SVG側は
  `data-plot-left`等のdata属性でプロット領域の座標・y軸最大値・期数を
  持っており、JSはそこから再計算する
  - JSONは別ファイルに分離した（hououの実データがgzip後36KB程度あり、
    `<script type="application/json">`でHTML本体に埋め込むには大きい
    ため）
  - 旧版の`onchange="javascript:location.href = this.value"`を廃止し、
    `leagues.js`側で`addEventListener('change', ...)`にした（#9の
    インラインハンドラ排除が2ページ分進んだ）
- 旧版の`curveType: 'function'`（スプライン）は再現せず、`<polyline>`の
  直線でつないでいる。実機比較で見た目の差は気にならない範囲だった

### video_wayhome.html のヒーロー画像追加（#102 第1段、2026-09-12）

表形式一辺倒だった`video_wayhome.html`に、最新話のサムネイルを大きく
見せるヒーローを追加した（第2段の背景動画自動再生は別途判断、本issueは
第1段のみ対象）。実装は`lib/page.py`に新設した`content_before`スロット
（上記参照）を使う。

- **最新話の判定はC列（公開日）が最大の行。** シートの並び順（通常は
  新しい順）に依存しない実装にした。同日が複数ある場合はシート順で
  先に出てくる行を採用する（`max()`のタイブレーク仕様に依存せず、
  明示的にループで比較している）
- **サムネイルはビルド時に`maxresdefault.jpg`へHEADリクエストを送り、
  存在すれば1280×720、なければ`hqdefault.jpg`(480×360)にフォールバックする**
  （`scripts/check_image_links.py`のHEAD処理と同じ方針。標準ライブラリのみ、
  タイムアウト・例外は握りつぶさずログに出す）。現データ(38件)はF列の
  URLがすべて`img.youtube.com`のため、動画IDの抽出も含めこの経路のみで
  完結する。issue本文にあった「外部依存はi.ytimg.com」は誤りで、
  実際は既存表と同じ`img.youtube.com`のみ（#9のCSPは変更不要）
- **`aspect-ratio`だけでは16:9に収まらない落とし穴があった。**
  `.mj-hero-image`に`aspect-ratio: 16/9`のみ指定し`height`を明示しなかった
  ところ、CLS対策で付けている`<img>`の`height`属性（maxres=720、hq=360）が
  aspect-ratioより優先され、幅100%のまま縦長に伸びる不具合が起きた。
  `height: auto`を明示して解消（style.cssにコメントを残してある）。
  スクリーンショットだけでは気づきにくく、Chrome DevTools Protocol経由で
  `getBoundingClientRect()`/`getComputedStyle()`を直接確認して原因を
  特定した。同じ落とし穴を踏まないよう記録しておく
- ヒーローのクラス名は`.mj-hero`系（`.mj-hero` / `.mj-hero-heading` /
  `.mj-hero-link` / `.mj-hero-image` / `.mj-hero-info`）。左端は
  `.mj-table`と同じくマージンなしで揃え、中央寄せ（`margin: 0 auto`）には
  していない。アニメーションは入れず、ホバーは`opacity`の即時変化のみ
  （`prefers-reduced-motion`の分岐が不要になる）
- Lighthouseのローカル計測（`wrangler dev`、本番反映前）では、LCPが表の
  1行目サムネイル(160×90)からヒーローのmaxresdefault(1280×720)に変わり
  0.5〜0.7秒程度悪化したが、accessibility/best-practices/seoは変更前後で
  同点、CLSも変化なし（想定どおりで許容範囲）。詳細は
  `docs/lighthouse-baseline.md`の「video_wayhome.html ヒーロー画像追加」節

**この節の`.mj-hero`系クラス・表ベースの構成は、下記「video_wayhome の
全面リデザイン」（#102第2段、同日）で置き換えられ現存しない。** 最新話
判定・サムネイルHEAD確認の仕組み自体は第2段にそのまま引き継いでいる。

### video_wayhome の全面リデザイン（#102 第2段、新サイトのパイロット、2026-09-12）

video_wayhome.html を「新サイト（docs/new-site-design.md）の先取り
パイロット」として、表形式をやめ全画面ヒーロー+横スクロールの
エピソード列に作り変えた。全27ページの中で最も影響が小さいページという
判断。現行サイトの「作り込みすぎない」方針は、このページとこのページ
専用のCSS/JSに限り今回だけ踏み越えている。詳細な判断材料（カラー
トークン、Bootstrap 5.3ダークモードの検証結果、トーンについて実装して
分かったこと、共有ボタンの方針、構造化データの検証結果、新サイトへ
持ち越せる部分/捨てる部分）は**docs/new-site-design.md「12. パイロット:
video_wayhome」に集約した**（このファイルには実装の要点のみ記録する）。

- **`scripts/generate_video_wayhome.py`は`TableConfig`/`render()`を
  やめ、`render_content()`（型D等と同じ）に切り替えた。** `content_before`
  スロット（第1段で追加）はこのページではもう使わない。`#158`が
  引き続き使う想定でlib側はそのまま残している
- **行の並びはPython側で公開日(C列)の降順に明示ソートする**
  （`sorted(raw_rows, key=lambda row: row[2] or "", reverse=True)`）。
  シートの並び順に依存しない。Pythonの`sorted`は安定ソートで
  `reverse=True`でも同値の相対順は保たれるため、同日が複数ある場合は
  シート順で先に出てくる行が結果でも先に来る（第1段の`max()`ループと
  同じ規則を、ここでは安定ソートの性質で満たしている）
- **`table.js`を読まないページでは`data-fallback`の画像フォールバック
  処理も止まる。** `table.js`は`error`イベントのキャプチャフェーズ
  ハンドラで全画像のフォールバックをまとめて処理しているが、この
  ハンドラは`.mj-table`が無いページには効かない（`table.js`自体が
  何もしないため）。`video_wayhome.js`に同じ処理を移植して対応した。
  **表を持たない新しいページを作る際は、`table.js`前提の仕組み
  （画像フォールバック・`?name=`初期値・`--navbar-height`実測）を
  個別に確認し、必要なら移植すること。忘れると気づきにくい形で
  壊れる**（今回はCDP経由で意図的に壊れた画像URLを読み込ませて
  フォールバックが効くことを実地で確認した）
- **【規約】検索欄を持たないページは `<body data-search="off">` を出す（#163）。**
  navbar.js の虫眼鏡アイコンは `#searchBoxes` を開閉するリンクなので、検索欄が
  無いページでは押しても何も起きない。navbar.js は `document.write` で描画され
  その時点でページ本体は未パースのため、DOMから `#searchBoxes` の有無を
  調べられない。そこでページ側が `<body>` の data属性で先に伝える
  （`<body>` は navbar.js の `<script>` より前にパース済みなので描画の瞬間に読める）。
  **属性が無ければ「検索欄あり」＝従来どおり出す、が既定。** 目印を「無い」側に
  だけ付けているのは、手書きHTMLで付け忘れたときに現状維持へ倒すため。
  **表を持たない新しいページを作る際は、`render_content()` に
  `has_search_boxes=False` を渡すかどうかを必ず判断すること**（既定は「あり」）。
  手書きHTMLを追加するときは `<body>` に手で付ける。対象は現在7ページ
  （`404` / `jpml_links` / `resource_dictionary` / `resource_efficiency` /
  `rh_links` / `rh_results` / `rh_results_detail`）
- **`<main class="mj-video-page">`でページ全体を包み、Lighthouse
  accessibilityの`landmark-one-main`指摘を解消した。** `navbar.js`を
  触らずに済む範囲でこのページ限りの改善として反映。残る指摘は
  `navbar.js`の検索アイコンリンクの`link-name`（全ページ共通の既知の
  問題、navbar.jsは触らない方針のため未解決のまま）
- JSON-LD（`VideoObject`+`ItemList`）を`extra_head`経由で出力（#13先行
  実装）。値に`</`を含みうるため`json.dumps()`後に`"</"` → `"<\\/"`へ
  置換している
- Lighthouseのローカル計測は第1段からほぼ横ばい（performance
  0.91〜0.94、LCP 3.0〜3.2s）だが、**accessibilityが0.89→0.94〜0.96に
  改善、CLSが0.005→0.000に改善**（上記landmark修正とページ送り撤廃が
  効いている）。詳細は`docs/lighthouse-baseline.md`
- **【2026-09-12 決定】このページは濃色固定にした。** OSのカラーモード
  設定に関係なく常にダークで表示する（`@media (prefers-color-scheme: dark)`
  を廃し、ダーク側の値を既定に。`color-scheme: dark`を
  `html:has(.mj-video-page)`に指定）。新サイト全体のトーン（静か・白基調）は
  維持し、**動画セクションだけを濃色の例外とする**という整理。トークンの
  構造（機能名の7つ）は両モード前提のまま残してある。決定と理由・確認結果は
  `docs/new-site-design.md`の §2「デザイン方針 > トーン」と
  §12「パイロット: video_wayhome」の両方に記載（片方だけ読んで矛盾しないため）

### ランキング系3ページ（houou_ranking / ouka_ranking / wrc_ranking）の性質

型Aの残り3ページ（すべてランキング系）は他と性質が違うため#7での
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

**2026-09-12、全27ページの`<img src>`を機械的に洗い出して確定した
（gstatic除き12ドメイン）。**

```
for f in *.html; do grep -o 'src="https\?://[^/"]*' "$f" | sed 's/src="//'; done | sort | uniq -c | sort -rn
```

| ドメイン | 発生ページ |
|---|---|
| `img.youtube.com` | jpml_test / rh_paifu / video_en / video_live / video_mtsuku / video_wayhome / index |
| `pbs.twimg.com` | jpml_pros / jpml_titles / resource_logs / saikyo_mens / saikyo_results |
| `ron2.jp` | jpml_pros / jpml_test / jpml_titles |
| `abs.twimg.com` | jpml_pros（11件）/ saikyo_results（2件）。データ側13件が残っている（#135） |
| `yt3.googleusercontent.com` | jpml_pros |
| `yt3.ggpht.com` | jpml_pros |
| `assets.st-note.com` | jpml_pros |
| `d2l930y2yx77uc.cloudfront.net` | jpml_pros |
| `stat.profile.ameba.jp` | jpml_pros |
| `kinmaweb.jp` | saikyo_results（1,324件） |
| `i.ytimg.com` | index |
| `www.icualumni.com` | index |

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
- **CTRは約4%**（表示48回・クリック2回）。掲載順位は1〜12位と悪くない。
  ただし**これは2026-09-09時点の未確定値**。GSCのデータは後から埋まるため、
  2026-09-12に取り直すと2026-09-06の1日だけで48表示ある。エクスポートは
  `docs/gsc/`、詳細は#142参照
- 原因は `<title>` と考えられ、#5で26ページ分を整備した。効果測定は#142で行う
- 削除済みURL（`jpml_articles.html` 等）へのアクセスは**0件**だった
- Search Console にインデックスされているのは **`.html` 形式のみ**。
  拡張子なしURLは1件も登録されていない（#89の判断根拠）
- `?name=` 付きURLの中身は「上位が突出せず裾野が広い」分布。
  元氏なづは・白銀紗希・野村駿・猿川真寿・如月明日香などが
  1〜3回ずつ。選手個別ページを作る構想（新サイト）の後押しになる
- **#142 初回計測（2026-09-12、handoverへの追記）**: GSCのデータ開始が
  2026-09-06、title整備（#5）の適用が2026-09-09のため、変更前として
  使える期間は3日しかなく、28日 vs 28日の比較は成立しない。09-06〜09-08
  （表示128・クリック3・CTR 2.3%・順位9.1、確定）と09-09〜09-11（表示71・
  クリック4・CTR 5.6%・順位11.4、**未確定＝GSCデータがまだ埋まっていない**）
  を並べたが、母数が極小（クリック3件と4件）かつ直近3日は点線データのため、
  この数字からは結論を出さない。次回計測は2026-10-07（title適用から28日）。
  詳細は#142のコメント参照

### URLパラメータの棚卸し（#7）

各ページの `?name=` `?tag=` 等が、他ページからのリンクで実際に使われて
いるか調べた結果。**2026-09-11に方針が決まり、この表は内部リンクの有無の
記録として残す（下記参照）。削除はしていないし、今後もしない。**

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
| `saikyo_results.html` | `tag` | 156 | `jpml_pros`（**移行済み**） |
| `resource_logs.html` | `name` / `tag` | 1 + 16 | ページ内にハードコード |

**内部リンクが見つからないもの**

| ページ | パラメータ |
|---|---|
| `jpml_pros` | `place` / `league` / `ouka` |
| `jpml_titles` | `tag` |
| `jpml_test` | `name` |
| `houou_results` / `ouka_results` | `class` |
| `league_ranking`（ランキング3ページ） | `division` / `name` |
| `saikyo_results` | `name`（**移行済み**。バグ修正あり、下記参照） |
| `saikyo_mens` | `name` / `tag`（**移行済み**） |
| `rh_paifu` | `name`（**移行済み**） |
| `video_en` / `video_mtsuku` / `video_wayhome` | `name`（**移行済み**） |
| `wrc_results` | `name` |

内部リンクがないことは「不要」を意味しない。Search Consoleのデータで
「検索結果に出た22URLのうち14件が`?name=`付き」と分かっているが（SEO節）、
どのページのものかは未確認。消すと検索流入が全件表示に落ちる恐れがある。

**`saikyo_results.html`の`?name=`にはバグがあった（2026-09-11、実機確認・移行時に修正）。**
旧JS（`saikyo_results.js`）はコメントで「A 対局日 / H 名前」と列の意味を
書きながら、実際のクエリは `AND A = "..."` で対局日（A列）に対する完全一致に
なっており、名前（H列）は一度も参照されていなかった。gh-pages版で実機確認
（実在の選手名を指定すると0件、実在の対局日を指定するとヒット）して再現も
取った。**削除すると検索流入がどうなるか判断できない**ため、パラメータ自体は
残しつつ、コメントが示す「本来意図されていたはずの挙動」（H列＝名前の完全
一致）に修正して移行した（`scripts/generate_saikyo_results.py`）。バグの
再現はしていない。#122（Search Consoleの`?name=`付きURL調査）に関連する
可能性があるため、#7にコメントで記録した。

**2026-09-11、#113の判断（canonicalなし）に合わせて、URLパラメータは
残り8ページも一律そのまま引き継ぐことに決めた。** ページごとに個別判断する
運用は終了。#122（Search Consoleでの内訳エクスポート）は削除判断の前提では
なくなり、新サイト設計用の基礎データ取得に目的が変わった。
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
  （詳細・経緯は下記「AIクローラーの扱い」参照。本対応は#130で管理）
- Tiered Cache は**効果がない**（Workersの静的アセットにはオリジンサーバーがないため）
- **Web Analytics のビーコンは `/cdn-cgi/rum` への POST。**
  HTTPメソッドやパスで遮断するルールを書くときは `/cdn-cgi/` を
  除外すること（#110）
- **Managed Ruleset の Block / Log は Security rules の一覧画面では
  判別できない。** 一覧の Action 列に出る `Execute` はルールセットを
  実行するというデプロイ段階のアクションで、ルールセット内部の
  Block / Log とは別物。確認するにはルールセット名をクリックして
  Deploy managed ruleset の画面まで入り、Ruleset action を見る（#76）

#### Speed 設定の現状（2026-09-11 時点）

Speed → Recommendations（Site Recommendations）の一覧と、それぞれの判断。

| 項目 | 状態 | 判断理由 |
|---|---|---|
| Web Analytics (RUM) | 有効 | #32 で GA4 から移行済み |
| Speed Brain | **無効** | 有効化して実測した結果、prefetch が拒否された（#119）。Off に戻した |
| Polish / WebP | 無効 | #71 のとおり。Workers 静的アセットにオリジンがなく効果がない。加えて `<img>` をエッジで書き換えるため #9 と競合する |
| Image Transformations | 未購入 | Cloudflare Images の別課金。自前画像は11枚178KB、選手画像1,985枚は外部7ドメインにあり対象外 |
| Rocket Loader | 無効 | 全ページで `defer` を付けているため効果がない。CSP（#9）とも競合する |
| HTTP/2 | 有効 | 既定 |
| HTTP/3 | **有効化(2026-09-11)** | モバイル回線で効く。リスクなし |
| HTTP/2 to Origin | 有効 | オリジンが存在しないため実質無効。害もないので触らない |
| Enhanced HTTP/2 Prioritization | 有効 | 同上 |
| 0-RTT Connection Resumption | **有効化(2026-09-11)** | GET/HEAD にしか適用されない。状態を変えるエンドポイントが1つもない静的サイトのため、リプレイの実害がない |
| Always use HTTPS | **有効化(2026-09-11)** | 下記参照 |
| TLS 1.3 | 有効 | 既定 |
| Early Hints | **有効化(2026-09-11)** | ただしトグルだけでは何も起きない。下記参照 |

**「Enable all settings」ボタンは押さないこと。** Polish が一括で有効になり、
#71 と #9 の判断が覆る。個別に切り替える。

**Always use HTTPS が無効だったのは穴だった。** `_headers` に HSTS
（`max-age=31536000; includeSubDomains`）は入っていたが、HSTS が効くのは
一度 HTTPS で訪問済みのブラウザだけ。初回訪問者が `http://` で叩いた場合、
リダイレクトされずに HTTP のまま配信される状態だった。2026-09-11 に解消。

**Early Hints はトグルを入れただけでは動かない。** Cloudflare の実装は
レスポンスの `Link: ...; rel=preload` / `rel=preconnect` ヘッダをキャッシュして
103 で先出しする仕組みで、HTML 内の `<link>` タグは見ない（Pages には
`<link>` からの自動生成があるが、Workers 静的アセットで同じ挙動をするかは未確認）。
`_headers` に `Link:` 行を足す必要がある。設計は別issueで扱う（#129）。
Speed → Content Optimization の **Smart Hints**（クローズドベータ）が
Early Hints の対象を自動選択する機能で、#129 の代替になりうる。
#129 着手前に申し込む方針。

#### DNS・メール・通知の設定（2026-09-11）

DNS レコードは元々3件だった（Search Console の所有権確認 TXT、
apex と www の Worker レコード）。**MX は未設定。**

| 項目 | 状態 |
|---|---|
| DNSSEC | 有効化済み（#117）。Registrar も DNS も Cloudflare のため DS 登録まで自動 |
| SPF | `v=spf1 -all`（#116） |
| DMARC | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;`（#116） |
| DKIM | `*._domainkey` に空ポリシー（#116） |
| 通知 | Universal SSL Alert のみ（#118）。宛先は別事業者のドメイン |

**Cloudflare の通知には Registrar 用の Alert Type が存在しない。**
Billing の2種類も「支出がしきい値を超えたら通知」で、
支払い失敗による失効は検知できない。ドメイン失効対策は
Domain Registration 画面で Auto renew と期限を直接確認する方法に切り替えた
（2026-09-11 時点: Active / 期限 2028-03-20 / Auto renew On）。

**#17（Email Routing）に着手するときは SPF の書き換えが必須。**
`v=spf1 -all` のままだと `@ryoei.pro` からの送信が拒否される。

**www.ryoei.pro の Worker レコードは削除しないこと。**
削除すると www が名前解決できなくなり、#115 で設定した
www → apex の Redirect Rule に到達する前に失敗する。
Redirect Rules は Workers より前に評価されるため、
レコードを残したままで正しく308が返る。

#### AIクローラーの扱い（2026-09-11 時点）

Cloudflare の「Block AI bots」一括トグルは **2026-09-15 に廃止**され、
挙動ベースの制御（Search / Agent / Training）へ移行する。

9月15日以降、複数の目的を持つクローラーは宣言されたすべての挙動で評価され、
最も厳しいルールが適用される。Googlebot / Applebot / Bingbot は検索と
AI機能を単一のユーザーエージェントでクロールするため、
「AI学習をブロック」という設定に巻き込まれる。

2026-09-11、期限前の対応として
`Mixed purpose crawlers will continue to be allowed.` を選択した。

**学習用クローラーをブロックしてもAI検索・回答での露出は減らない。**
学習クロールは引用も参照トラフィックも生まないため。
混在クローラーを許可しても、学習利用を拒否する目的は損なわれない。

旧トグル廃止後の本対応は#130で管理する。

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
| Zaraz | 却下 | 第三者スクリプトが1本もない。タグマネージャの対象がない |
| Turnstile | 却下 | `<form>` が27ページに0個。保護する送信経路がない |
| Waiting Room | 却下 | 同時接続を制限する必要がある場面がない。別課金 |
| Cache Reserve | 却下 | R2の課金が発生する。アセット総量が小さく見合わない |
| Logpush | 対象外 | Enterprise限定 |
| Hotlink Protection | 却下 | 自前画像は11枚178KB。守る対象が小さい。選手画像1,985枚は外部7ドメインにあり対象外 |
| HSTS preload | 見送り | `_headers` の `max-age=31536000; includeSubDomains` で実用上は十分。preloadリストへの登録は実質不可逆で、将来サブドメインをHTTPで使う自由を失う |
| Speed Brain | 却下 | 有効化して実測したところ、prefetch が `HTTP 503` / `cf-speculation-refused: prefetch refused: disabled for worker requests` で拒否された。Workers 静的アセット配信では機能しない。#71・Polish・Mirage と同じ理由 |
| Cache Rules による HTML のエッジキャッシュ | 却下 | `cf-cache-status: HIT` を実測。HTML はすでにキャッシュから配信されており伸びしろがない（#123） |
| Image Transformations / Cloudflare Images | 却下 | 別課金。自前画像は11枚178KBで主要3枚はすでにWebP。選手画像1,985枚は外部7ドメインにあり対象外 |
| Prefetch URLs（Cloudflare） | 対象外 | Enterprise プラン限定。Speed Brain が拒否される件と合わせて、Cloudflare 側で prefetch を実現する手段は残っていない |
| Cloudflare Fonts | 不採用 | #93 で Google Fonts を廃止しシステムフォントに統一済み。最適化する外部フォントが存在しない |
| Automatic Platform Optimization for WordPress | 対象外 | WordPress サイトではない。ダッシュボードにも「The WordPress plugin was not detected on ryoei.pro」と表示される |
| Shared Dictionary Compression | 見送り | Passthrough はオリジンが辞書圧縮を処理する前提。Workers 静的アセットは対応しないため Off のまま |
| Smart Hints | 保留 | クローズドベータ。Early Hints の対象を Cloudflare が自動選択する機能で、#129 の代替になりうる。#129 着手前に申し込む |
| Mantis（Google のAIセキュリティ用ハーネス） | 却下 | パイプラインの中核が「サンドボックスでクラッシュを再現 → パッチが再現を止めることで検証」のため、実行体を持たない静的サイトでは空回りする。Worker スクリプトなし・フォーム0・認証なし・DBなしで、自前コードは約6,200行（JS 3,237行 + Python 2,966行）。加えて Docker + gVisor と専用の隔離VMが前提で、`gh` 認証済みの Codespace で回すのは「本番に触れる環境で実行するな」という README の要件に反する。Google 自身も「公式サポート製品ではない」「本番利用を意図しない」と明記。再評価は新サイト（#101/#21）でサーバーサイド（#28/#29/#30）が入ってから |

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
| `docs/issues-snapshot.md` | issue一覧のエクスポート・全件（本文込み） |
| `docs/issues-open.md` | issue一覧のエクスポート・Openのみ（本文込み） |
| `docs/review-followup-instructions.md` | 2026-09-11の包括レビュー指摘への対応記録（完了済み） |
