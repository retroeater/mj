# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 引き継ぎ

作業の経緯や決定事項は docs/handover.md にまとめてある。
新しいセッションで文脈が必要なときは、まずそちらを読むこと。

## ブランチ運用（A案、#198、2026-09-13決定）

複数セッションが同一リポジトリを並行編集すると、共有された作業ツリー・
ブランチ上でコミットの取り違えや衝突が起きる（#198）。これを避けるため、
セッションごとに作業ブランチを分ける。

- **`cloudflare`: 統合・デプロイ専用。セッションはここへ直接pushしない。**
  push検知でCloudflare Workers Buildsが自動デプロイするため、
  「`cloudflare`へのマージ＝本番反映」になる
- **`work/<セッション識別子>`: 各セッションの作業ブランチ。**
  識別子はチャット側のChat-Refに合わせる（例: CHAT-0913-WH-xxのセッション
  なら`work/0913-wh`）。複数issueを1セッションで扱う場合も1ブランチでよい
- 作業開始時に`cloudflare`から作業ブランチを切り、そこへは自由にpushして
  よい。**`cloudflare`へのマージはセッション自身が行わない。**
  作業完了を報告し、マージするかどうかは平野さんが判断する
- **マージ判断の基準（2026-09-13決定）:**
  - ドキュメントのみの変更（CLAUDE.md、docs/配下、README等）は、
    セッションが作業完了を報告したうえで`cloudflare`へマージしてよい。
    平野さんの事前確認は不要
  - サイトの表示・生成物に影響する変更（HTML/CSS/JS、`generate_*.py`、
    データ取得まわり等）は、平野さんが本番または生成結果を確認した
    のちにマージする。セッションは報告して判断を待つ
  - 判断に迷う変更は「表示に影響する」側として扱い、確認を待つこと
  - ドキュメントのみの変更でも、`cloudflare`へのpushにより#169の
    ワークフローが走りデプロイが1回発生する。サイトの表示は変わらないが、
    デプロイ自体は動く
- マージ後、作業ブランチは削除してよい。長期間マージされないブランチは、
  定期的に`cloudflare`を取り込んで乖離を小さく保つこと
- **`git stash`は使用しないこと。** 共有パス（複数セッションが同時に
  触りうるファイル）に対する`git stash`は、他セッションの未コミット編集を
  無言で消しうる（#198で実例あり）。コミットを分割する必要がある場合は
  `git add -p`、または`git diff`で対象のハンクだけを切り出して
  `git apply --cached`で部分ステージする

# ryoei.pro

日本プロ麻雀連盟の選手データベースを含む個人サイト。

## 構成
- 静的HTML 27ページ + 「帰り道」エピソード個別ページ38枚（`wayhome/<動画ID>.html`、#162）。ビルド工程なし（Jekyllは廃止済み）
- `llms.txt`（AIクローラー向けのサイト概要・ページ索引）を手書きの静的ファイル1枚として設置している（#161）。生成スクリプトは持たない。新サイトのビルド（#21）側で自動生成する余地を残すための判断
- Cloudflare Workersの静的アセットとして配信（`wrangler.jsonc`、assets.directory は `./`）
- 統合・デプロイ用ブランチは cloudflare（直接pushしない。上の「ブランチ運用」参照）。
  gh-pages は旧GitHub Pages用で触らない
- **本番反映は Cloudflare Workers Builds（ダッシュボードのGit連携）が行う。**
  `cloudflare` への push を検知し、Cloudflare側で自動的に `wrangler deploy`
  が実行される。再生成ワークフローの `chore: regenerate ...` コミットも
  同様に反映対象になる。**GitHub Actionsにデプロイを行うジョブは無い**
  （一度 #169 で `.github/workflows/deploy.yml` として追加したが、Workers
  Builds が既に稼働しており不要かつ二重デプロイになるものだったため削除した。
  詳細はdocs/handover.md「4-x」と#169のクローズコメント）。
  **この設定はCloudflareダッシュボード側にあり、構成がコードから追えない。**
  確認済みの設定値はdocs/handover.md「4-x」に記録してある
  （平野さんがダッシュボードを目視確認した時点の値。セッションからは検証不能）。
  **`CLOUDFLARE_API_TOKEN` のGitHub Secretは登録しないこと**
  （登録するとWorkers BuildsとGitHub Actionsの両方がデプロイを実行し二重デプロイになる）。
  `.github/workflows/assets-check.yml` は `.assetsignore` の漏れ（#133）を
  検知するだけで、Cloudflareへのアクセスは一切必要としない（デプロイを
  止める仕組みではない。ゲートの検討は#170）。
  **Claude Code のセッション環境からは `api.cloudflare.com` も `ryoei.pro` も
  ネットワークポリシーで遮断されているため、セッション内から直接デプロイすることも
  本番がどう見えるかを確認することもできない。** ただし
  `gh api repos/retroeater/mj/commits/<sha>/check-runs` で「Workers Builds: mj」の
  check-runを見れば、そのコミットのビルドが成功したかどうかはダッシュボードに
  入らずセッションからも確認できる（Cloudflareが結果をGitHubに書き戻すため、
  `api.cloudflare.com`は遮断されていても`api.github.com`経由で届く。#153で実例あり）。
  **これは「ビルドが成功した」ことの確認であって「本番がその通りに見える」ことの
  確認ではない。** 混同しないこと（詳細はdocs/handover.mdの同節）
- ローカル確認は `wrangler dev` を素のオプションで起動しないこと（無限リロードで作業不能になる）。
  必ず `--persist-to` でリポジトリ外に状態を保存すること:
  `npx wrangler dev --port 8789 --ip 127.0.0.1 --persist-to /tmp/wrangler-state`
  （`.wrangler/` への書き込みをアセット変更と誤検知しリロードが無限に続くため。詳細は docs/issues-snapshot.md #153）
  `--persist-to` で退避されるのはstate（KV/D1/R2/observability）のみで、`.wrangler/tmp`・`.wrangler/cache`は起動時にリポジトリ直下へ作られるが、これは正常で無限リロードの原因ではない（#155）
- Bootstrap 5.3.8 をローカル配信（assets/vendor）。CDNは使わない
- assets/vendor 配下のライブラリを更新・追加した際は、末尾の
  `sourceMappingURL` コメントを削除すること。`.map` ファイルを
  同梱しない方針のため、残すと閲覧者のブラウザが404を起こす（#99）
- assets/vendor 配下のライブラリを更新した際、ブラウザには
  最大30日間キャッシュが残る（#92）。Cloudflareのキャッシュパージ
  ではブラウザキャッシュは消えない。更新を即座に反映させたい
  場合はファイルのパスを変えること
- ページ本体（例: `jpml_titles.html`）とロジック（同名の `.js`）はファイルを分けている。ページ末尾で navbar.js を読み込んで共通ナビを描画する
- **navbar.jsの27本のページhrefはルート相対パス（先頭`/`）にしてある（#162）。** 実ページ25本＋`_redirects`で転送する`resource_calendar`・`resource_books`の2本。 `wayhome/`配下などサブディレクトリのページからも同じnavbar.jsがそのまま使えるようにするため。`#`・`#searchBoxes`（検索欄開閉用）は対象外
- **検索欄（`#searchBoxes`）を持たないページは `<body>` に `data-search="off"`
  を出すこと（#163）。** navbar.js はこの属性を見て、虫眼鏡アイコン（検索欄を
  開閉するリンク）をそもそも描画しない。属性が無いページは「検索欄あり」として
  扱われ、従来どおりアイコンが出る（＝既定。付け忘れは現状維持に倒れる）。
  生成物は `lib/page.py` が `_render_search_boxes()` の結果から自動で出す
  （`render_content()` を使うページだけ `has_search_boxes=False` を明示）。
  現在の対象は8ページ（`404` / `jpml_links` / `resource_dictionary` /
  `resource_efficiency` / `rh_links` / `rh_results` / `rh_results_detail` /
  `video_wayhome`）。うち生成物4ページ（`resource_efficiency` / `rh_results` /
  `rh_results_detail` / `video_wayhome`）は`has_search_boxes=False`の明示で
  自動的に出る。`video_wayhome`は虫眼鏡アイコンで開閉する`#searchBoxes`を
  navbar直下の常時表示フィルタバー（`.mj-filterbar`）に置き換えたため対象に
  加わった（#189）。
  **残り4ページ（手書きHTML: `404` / `jpml_links` / `resource_dictionary` /
  `rh_links`）を新規に追加するときは手で付けること。**

## データの流れ
- 選手データ・成績データはすべてGoogleスプレッドシートが正本
- 16ページ+「帰り道」エピソード個別ページ38枚がビルド時生成に移行済み（生成スクリプトの正は`python3 scripts/regenerate.py --list`。17件のスクリプトのうち`wayhome_episodes`だけが単一ページではなく38枚を出力する、#162）:
  `jpml_pros.html`（選手データベース、1000名超・15列・列ヘッダソートあり）、
  型A・2列(一部3列)の9ページ（`jpml_titles.html` / `jpml_test.html` /
  `resource_logs.html` / `video_live.html` /
  `video_en.html` / `rh_paifu.html` / `saikyo_mens.html` /
  `video_mtsuku.html`〈3列〉 / `saikyo_results.html`）、型A'・多列テキスト
  （画像列なし）の2ページ（`rh_results.html` / `rh_results_detail.html`）、
  型D・静的SVG（表を持たない）の1ページ（`resource_efficiency.html`）、
  型C・積み上げ棒+選手1名の折れ線の2ページ（`houou_leagues.html` /
  `ouka_leagues.html`）、独自の全画面ヒーロー+横スクロールカード列の
  1ページ（`video_wayhome.html`。#102第2段で型Aから離脱、新サイトの
  先取りパイロット。詳細はdocs/new-site-design.md「12. パイロット:
  video_wayhome」）、同じくヒーロー構成のエピソード個別ページ38枚
  （`wayhome/<動画ID>.html`、`scripts/generate_wayhome_episodes.py`。
  #162で選手個別ページ〈#101〉のURL設計・canonical・サイトマップ分割の
  パイロットとして追加。一覧のカードはこの個別ページへリンクする）
  - `jpml_pros.html`は独自の`scripts/generate_jpml_pros.py`のまま。型A/A'の11ページは`scripts/lib/page.py`（HTMLテンプレート・行組み立て・画像セル・エスケープの共通処理）を使い、各`scripts/generate_<ページ名>.py`は「設定(`PageMeta`/`TableConfig`) + 行組み立て関数」だけを持つ（#7の共通化）。型C・型D・`video_wayhome.html`・`wayhome/`のエピソード個別ページは表を持たないため`lib/page.py`の`render_content()`を使う。いずれも`scripts/lib/sheets.py`経由でスプレッドシートのgvizエンドポイント（`google.visualization.Query`と同じSELECT構文）を叩く
  - `lib/page.py`はサブディレクトリのページ（`wayhome/`配下）向けに`asset_prefix`引数を持つ（既定は空文字、#162）。head内のアセット参照（`style.css`・`assets/vendor/*`・`favicon.ico`・`navbar.js`・`table.js`）にこの接頭辞を付ける。`wayhome/`配下のページは`"../"`を渡す。あわせて`PageMeta`に`og_image`/`og_image_width`/`og_image_height`/`og_image_alt`/`canonical`を持たせ、ページごとに差し替えられるようにした（既定はそれぞれ`img/ogp.png`・1200×630・`"ryoei.pro"`・`None`=canonicalなし。#113の判断どおり）。サブディレクトリを増やす場合はこの仕組みを再利用できる
  - `wayhome/`のエピソード個別ページは`?name=`等のURL変種を持たないため、#113（canonicalなしの判断）の理由が当てはまらない例外として`<link rel="canonical">`を持つ（38ページのみ）。他27ページはcanonical無しのまま
  - サイトマップは`sitemap.xml`（インデックス）が`sitemap-pages.xml`（25ページ、旧sitemap.xml。27ページのうち`404.html`〈noindex〉と`saikyo_mens.html`〈年1回の単発企画〉を意図的に除外）と`sitemap-wayhome.xml`（wayhome/38ページ、`generate_wayhome_episodes.py`が生成）を束ねる方式（#162）。`robots.txt`のSitemap行は`sitemap.xml`のまま変更していない。`scripts/update_sitemap_lastmod.py`はページパスから対象サイトマップを判定する（`wayhome/`配下なら`sitemap-wayhome.xml`、それ以外は`sitemap-pages.xml`）
  - `lib/page.py`はh1直後・`#searchBoxes`手前にページ固有のHTMLを差し込む`content_before`スロット（#102第1段で追加）を持つが、現在どのページも使っていない（`video_wayhome.html`は#102第2段で`TableConfig`/`render()`自体から離脱したため対象外になった）。ページ固有HTMLをh1直後に差し込む汎用スロットとして残している
  - 生成後の絞り込み・並び替え・ページ送りはページ側の軽量JSに委譲する。`jpml_pros.js`は絞り込みと並び替え（ページ送りなし・全行表示）専用。型A・型A'の11ページは共通の`table.js`（絞り込み・ページ送り、並び替えなし）を使う。設定は`<table>`要素のdata属性（`data-page-size` / `data-name-mode` / `data-filter-param`）で渡し、属性省略時はページ送りなし・完全一致フィルターなしになる。ページ固有のUI（`resource_logs.html`の名前セレクトボックス等）はtable.jsとは別の小さなJSで補う。`video_wayhome.html`は`.mj-table`を持たないため`table.js`は読み込まず、専用の`video_wayhome.js`が絞り込み・画像フォールバック・共有ボタン等を担う（#102第2段）
  - 型Cの2ページは`leagues.js`（共通JS）を使う。積み上げ棒と既定選手の折れ線は静的SVGに焼き込み済みで、`leagues.js`は`?name=`に応じて選手1名分の`<polyline>`と凡例ラベルだけを差し替える（選手ごとの折れ線データは`houou_leagues_data.json`/`ouka_leagues_data.json`をfetchして取得）。選手選択リストは「プロ」シートのY列="Y"かつ鳳凰最高/桜花最高列に値がある選手が対象（#127/#133）。**退会済みの選手は鳳凰/桜花シートにリーグの実データが残っていても選択リストに出ない。これは正しい挙動**（Y列="Y"が在籍・公開対象を表す。#168で退会者689名・うち#127以前は選べた78名を洗い出し、全員退会済みと確認して対応不要と判断した）
  - GitHub Actions (`.github/workflows/regenerate-page.yml`) が、`scripts/generate_*.py` / 対応する `.js` / `scripts/lib/**` の変更をcloudflareブランチへのpushで検知し、自動で再生成・コミットする（`chore: regenerate <ページ名>.html via GitHub Actions`）。検知はpushに含まれる全コミットの範囲（`github.event.before`〜`github.sha`）の差分で行う（#167。以前は最終コミット1つ分しか見ておらず、複数コミットをまとめてpushすると途中のコミットの変更を取りこぼした状態でsuccessになっていた）。手動実行（workflow_dispatch）も可能。毎週月曜05:37 JSTにも`all`を自動実行し、差分がなければコミットしない（#103）。`table.js`・`leagues.js`はルート直下の`*.js`に該当するためpushでワークフロー自体は起動するが、どのページ名にも一致せず対象0件で終わる（HTMLに焼き込まれないため実害なし）。`regenerate.py`は出力がディレクトリになるページ向けに`OUTPUT_OVERRIDES`（例: `wayhome_episodes` → `"wayhome/"`）を持ち、コミット・lastmod更新対象のパスとして返せる（#162）。ワークフローの`git add`は`-A --`で削除も拾い、`sitemap*.xml`をまとめて対象に含める
  - 型A（表とフィルターのみ）の他ページへ展開するための共通クラスを `style.css` に用意している: `.mj-table`（表の見た目）、`.mj-table-2col`/`.mj-table-3col`（画像列固定幅＋残り列の折り返し）、`.mj-table-auto`（画像列を持たない型A'向け、列幅は自動計算）、`.mj-pager`（ページ送りUI）、`.mj-left`（列ごとの左寄せ）、`.mj-plain`（リンクの下線を消す）。列幅・列固定・行高（`contain-intrinsic-size`）などページ固有の構造はIDセレクタ側に残す
- 残り6ページ（`houou_ranking` / `houou_results` / `ouka_ranking` /
  `ouka_results` / `wrc_ranking` / `wrc_results`）はまだブラウザ側から
  `google.charts` (`google.visualization.Query`) で直接スプレッドシートを
  叩く旧方式（ページ生成の静的化はページごとに未着手、#7）
- 選手のプロフィール画像は龍龍(ron2.jp)など外部ドメインを含む複数サービスに依存しており、リンク切れやすい

## メンテナンス用スクリプト（scripts/）
公開対象外（`.assetsignore` でCloudflareへの配信から除外）。GitHub Actionsから定期実行され、結果をissueに書き出す運用:
- `check_image_links.py` — `jpml_pros.html` 内の画像URL全件にHEADリクエストを送りリンク切れを検知（毎週月曜03:00 JST）
- `check_ron2_images.py` — 龍龍(ron2.jp)側の現在の画像と `jpml_pros.html` に埋め込み済みの画像が一致しているか確認（毎週月曜04:00 JST）
- `collect_ron2_images.py` — 龍龍から全選手の150x150画像URLを収集しCSV出力（スプレッドシート更新用、手動実行）
- `check_leagues_dropped.py` — 型C（`houou_leagues` / `ouka_leagues`）で、リーグの実データがあるのに選手選択リストから漏れている選手を検知（#168、手動実行）。**出力は警告ではなく参考情報。退会者が並ぶのは正常で、在籍中の選手が現れたときだけ「プロ」シートの入力漏れを疑う。**`generate_*_leagues.py` から定数と `period_of()` / `fill_front_half()` をimportし、集計は `lib/leagues.py` を生成時と同じ引数で呼ぶ。生成側で `build_player_series()` の引数を変えたときはこちらも直すこと。`.github/workflows/check-leagues-dropped.yml` からworkflow_dispatchで実行でき、結果を実行サマリと指定issueへのコメントに出す
- `regenerate.py` — ページ再生成の共通入口。`scripts/generate_<ページ名>.py`が存在するページを「生成対象」とみなす。`--list`で対象ページ一覧、`all`で全ページ再生成、ページ名指定で単体再生成、`--changed`で変更ファイルから対象判定（`regenerate-page.yml`が使用）
- `apply_page_meta.py` — 全ページの`<title>`・meta description・OGPタグを一括書き換え（#5）。`--dry`でプレビューのみ
- `build_ogp_image.py` — OGP画像 `img/ogp.png`（1200×630、背景#ffffff、「ryoei.pro」の文字のみ）を生成（#78、手動実行）。Pillowが必要。全ページ共通の1枚で、`lib/page.py` / `generate_jpml_pros.py` のテンプレートと静的ページに `og:image` として入っている。生成したPNGもコミットする（生成環境のフォント差で再生成のたびに差分が出るのを避けるため）。`--check`でコミット済みのPNGと一致するか確認できる
- `build_issues_snapshot.py` — `docs/issues-snapshot.md`（全件）と`docs/issues-open.md`（Openのみ）を`gh issue`の現状から同時に再生成する。`.claude/settings.json`のPostToolUseフックから`gh issue`操作のたびに自動実行される
- 実行例: `python3 scripts/check_image_links.py --json result.json`（依存は標準ライブラリのみ、追加インストール不要）

## 方針
- **セッション環境から到達できない領域（Cloudflareダッシュボード、本番サイト、
  スプレッドシートなど）の状態は、到達できないことをもって存在しない・
  無いと結論づけないこと。** 推測で結論を出さず、平野さんに確認する。
  特に「仕組みが存在しない」という結論は、確認できない場所については出さない
  （#169の教訓）。結論を出す前に、`gh api`でのcheck-runs確認や既存issue検索
  など確認できる手段を試すこと。詳細はdocs/handover.md「4-x」参照
- **「ビルドが成功したか」と「本番がどう見えるか」は確認できる範囲が違う。
  混同しないこと。** 詳細はdocs/handover.md「4-x」（「セッション環境からは
  Cloudflare に到達できない」節）参照
- 外部ドメインへの依存を増やさない（CSP導入を予定しているため）
- `.assetsignore` に開発用ファイルを列挙。公開対象を増やさないこと。
  新しいディレクトリ・ファイルを追加したときは、公開してよいか確認し
  公開しないものは追加すること（`docs/` が2026-09-12まで漏れていた例が
  ある、#133）
- タスクはGitHub Issuesで管理
- ビルド・lint・テストの自動化コマンドはなし。HTML/JSの変更はブラウザで直接確認する

## 応答について
- 日本語で応答すること

## issueの着手ルール
- **issueに着手したら、コードを触る前にそのissueへ「着手中」のコメントを
  残すこと。** 複数のセッションが同じリポジトリで並行して動くため、これが
  他セッションから着手状況を知る唯一の手段になる。コメントには
  セッションのURL（コミットの `Claude-Session` に使うもの）を含めること。
  誰の宣言か分からないと、引き継ぎも取り下げも判断できない
- **着手する前に、そのissueに他セッションの着手中コメントが無いか確認すること。**
  あれば着手せず、ユーザーに確認する
- **作業を中断・放棄したときも、その旨をコメントに残すこと。** 着手中のまま
  放置されると、他セッションが着手を見送り続けることになる
- #127（型C）が2セッションで二重に着手された例がある（#157）。片方が
  ネットワーク制約で停止していたため実装の衝突は免れたが、偶然だった
- **issueをクローズするときは「状況:」ラベル（待ち/対応中/保留）を外すこと。**
  状況が解消済みでもラベルだけ残ると、クローズ済みなのに未対応・保留中に
  見えて実態と食い違う。経緯は#112のコメント参照
- Projects ボードのステータスは平野さんの作業管理用。issue のクローズ時に Done へ
  更新はするが、完了報告・完了確認の対象にはしない（issue の状態〈open/closed・
  ラベル〉が正しければよい）。ボードの値を報告に含める必要はない

## コミットのルール
- コミット前に `git status` / `git diff --stat` を確認し、**着手中のissueと
  無関係なファイル・ハンクを含めないこと。** 複数の変更が混ざっていたら
  issueごとに分けてコミットする。型C（#127）のCSS 43行が無関係な#152
  （牌効率ページの見出しフォントサイズ）のコミット `4738d8d` に混入し、
  `git blame` / `git log -- style.css` が#152を指す状態になった例がある
  （#157）。表示は壊れなかったが、履歴が後から読む人を誤誘導する

## CLAUDE.md / handover.md の更新ルール
- ページの移行・追加・削除を行ったときは、同じコミットで CLAUDE.md と
  docs/handover.md の件数・ページ列挙を更新すること。件数の正は
  `python3 scripts/regenerate.py --list`（#136）
- `llms.txt` も同じタイミングで更新すること。sitemap-pages.xml と同様、
  生成スクリプトを持たない手書きファイルのため自動では追随しない（#161）
- **docs/handover.md は「現状・ルール・次にやること」のみを書く。** issue を
  1件閉じるたびに実装の詳細を handover に書き足さないこと。書く先は
  (a) issue のコメント、(b) 再発防止や他ページへ流用する知見なら
  `docs/notes/<topic>.md`。handover 側には結論1〜2行と参照だけを置く
- 記述を更新するときは古い記述を消して置き換えること（「→その後こうした」
  という追記型にしない）。同じ内容を2箇所に書かず、片方は参照にする
- 「最終更新」は日付＋直近の変更3行以内にする
- handover.md の上限は60KB/900行。超えたら新しい記述を足す前に
  `docs/notes/` へ移すこと（超過は `.github/workflows/assets-check.yml` が
  検知する。検知であって防止ではなく、本番反映には影響しない）
