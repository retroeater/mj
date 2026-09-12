# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 引き継ぎ

作業の経緯や決定事項は docs/handover.md にまとめてある。
新しいセッションで文脈が必要なときは、まずそちらを読むこと。

# ryoei.pro

日本プロ麻雀連盟の選手データベースを含む個人サイト。

## 構成
- 静的HTML 27ページ。ビルド工程なし（Jekyllは廃止済み）
- Cloudflare Workersの静的アセットとして配信（`wrangler.jsonc`、assets.directory は `./`）
- 作業ブランチは cloudflare。gh-pages は旧GitHub Pages用で触らない
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
- **検索欄（`#searchBoxes`）を持たないページは `<body>` に `data-search="off"`
  を出すこと（#163）。** navbar.js はこの属性を見て、虫眼鏡アイコン（検索欄を
  開閉するリンク）をそもそも描画しない。属性が無いページは「検索欄あり」として
  扱われ、従来どおりアイコンが出る（＝既定。付け忘れは現状維持に倒れる）。
  生成物は `lib/page.py` が `_render_search_boxes()` の結果から自動で出す
  （`render_content()` を使うページだけ `has_search_boxes=False` を明示）。
  **手書きHTML（`404` / `jpml_links` / `resource_dictionary` / `rh_links`）を
  新規に追加するときは手で付けること。** 現在の対象は7ページ

## データの流れ
- 選手データ・成績データはすべてGoogleスプレッドシートが正本
- 16ページがビルド時生成に移行済み（正は`python3 scripts/regenerate.py --list`）:
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
  video_wayhome」）
  - `jpml_pros.html`は独自の`scripts/generate_jpml_pros.py`のまま。型A/A'の11ページは`scripts/lib/page.py`（HTMLテンプレート・行組み立て・画像セル・エスケープの共通処理）を使い、各`scripts/generate_<ページ名>.py`は「設定(`PageMeta`/`TableConfig`) + 行組み立て関数」だけを持つ（#7の共通化）。型C・型D・`video_wayhome.html`は表を持たないため`lib/page.py`の`render_content()`を使う。いずれも`scripts/lib/sheets.py`経由でスプレッドシートのgvizエンドポイント（`google.visualization.Query`と同じSELECT構文）を叩く
  - `lib/page.py`はh1直後・`#searchBoxes`手前にページ固有のHTMLを差し込む`content_before`スロット（#102第1段で追加）を持つが、現在使っているページは無い（`video_wayhome.html`は#102第2段で`TableConfig`/`render()`自体から離脱したため対象外になった）。`#158`のlead文がこのスロットを使う想定でlibにはそのまま残している
  - 生成後の絞り込み・並び替え・ページ送りはページ側の軽量JSに委譲する。`jpml_pros.js`は絞り込みと並び替え（ページ送りなし・全行表示）専用。型A・型A'の11ページは共通の`table.js`（絞り込み・ページ送り、並び替えなし）を使う。設定は`<table>`要素のdata属性（`data-page-size` / `data-name-mode` / `data-filter-param`）で渡し、属性省略時はページ送りなし・完全一致フィルターなしになる。ページ固有のUI（`resource_logs.html`の名前セレクトボックス等）はtable.jsとは別の小さなJSで補う。`video_wayhome.html`は`.mj-table`を持たないため`table.js`は読み込まず、専用の`video_wayhome.js`が絞り込み・画像フォールバック・共有ボタン等を担う（#102第2段）
  - 型Cの2ページは`leagues.js`（共通JS）を使う。積み上げ棒と既定選手の折れ線は静的SVGに焼き込み済みで、`leagues.js`は`?name=`に応じて選手1名分の`<polyline>`と凡例ラベルだけを差し替える（選手ごとの折れ線データは`houou_leagues_data.json`/`ouka_leagues_data.json`をfetchして取得）。選手選択リストは「プロ」シートのY列="Y"かつ鳳凰最高/桜花最高列に値がある選手が対象（#127/#133）
  - GitHub Actions (`.github/workflows/regenerate-page.yml`) が、`scripts/generate_*.py` / 対応する `.js` / `scripts/lib/**` の変更をcloudflareブランチへのpushで検知し、自動で再生成・コミットする（`chore: regenerate <ページ名>.html via GitHub Actions`）。手動実行（workflow_dispatch）も可能。`table.js`・`leagues.js`はルート直下の`*.js`に該当するためpushでワークフロー自体は起動するが、どのページ名にも一致せず対象0件で終わる（HTMLに焼き込まれないため実害なし）
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
- `regenerate.py` — ページ再生成の共通入口。`scripts/generate_<ページ名>.py`が存在するページを「生成対象」とみなす。`--list`で対象ページ一覧、`all`で全ページ再生成、ページ名指定で単体再生成、`--changed`で変更ファイルから対象判定（`regenerate-page.yml`が使用）
- `apply_page_meta.py` — 全ページの`<title>`・meta description・OGPタグを一括書き換え（#5）。`--dry`でプレビューのみ
- `build_ogp_image.py` — OGP画像 `img/ogp.png`（1200×630、背景#ffffff、「ryoei.pro」の文字のみ）を生成（#78、手動実行）。Pillowが必要。全ページ共通の1枚で、`lib/page.py` / `generate_jpml_pros.py` のテンプレートと静的ページに `og:image` として入っている。生成したPNGもコミットする（生成環境のフォント差で再生成のたびに差分が出るのを避けるため）。`--check`でコミット済みのPNGと一致するか確認できる
- `build_issues_snapshot.py` — `docs/issues-snapshot.md`（全件）と`docs/issues-open.md`（Openのみ）を`gh issue`の現状から同時に再生成する。`.claude/settings.json`のPostToolUseフックから`gh issue`操作のたびに自動実行される
- 実行例: `python3 scripts/check_image_links.py --json result.json`（依存は標準ライブラリのみ、追加インストール不要）

## 方針
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
