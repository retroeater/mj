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
- Bootstrap 5.3.8 をローカル配信（assets/vendor）。CDNは使わない
- assets/vendor 配下のライブラリを更新・追加した際は、末尾の
  `sourceMappingURL` コメントを削除すること。`.map` ファイルを
  同梱しない方針のため、残すと閲覧者のブラウザが404を起こす（#99）
- assets/vendor 配下のライブラリを更新した際、ブラウザには
  最大30日間キャッシュが残る（#92）。Cloudflareのキャッシュパージ
  ではブラウザキャッシュは消えない。更新を即座に反映させたい
  場合はファイルのパスを変えること
- ページ本体（例: `houou_leagues.html`）とロジック（同名の `.js`）はファイルを分けている。ページ末尾で navbar.js を読み込んで共通ナビを描画する

## データの流れ
- 選手データ・成績データはすべてGoogleスプレッドシートが正本
- `jpml_pros.html`（選手データベース、1000名超）・`jpml_titles.html`（タイトル戦一覧）・`jpml_test.html`（プロテスト関連記事）・`resource_logs.html`（飲食店ログ）はビルド時生成に移行済み:
  - それぞれ `scripts/generate_jpml_pros.py` / `scripts/generate_jpml_titles.py` / `scripts/generate_jpml_test.py` / `scripts/generate_resource_logs.py` が `scripts/lib/sheets.py` 経由でスプレッドシートのgvizエンドポイント（`google.visualization.Query` と同じSELECT構文）を叩き、静的HTMLに焼き込む
  - 生成後の絞り込み・並び替え・ページ送りはページ側の軽量JSに委譲するが、機能はページごとに異なる: `jpml_pros.js`は絞り込みと並び替え（ページ送りなし・全行表示）、`jpml_titles.js`/`jpml_test.js`/`resource_logs.js`は絞り込みとページ送り（並び替えなし）。列ヘッダによる並び替えは`jpml_pros.html`専用の機能とする方針で、型Aの他ページには既定で載せない
  - GitHub Actions (`.github/workflows/regenerate-page.yml`) が、`scripts/generate_*.py` / 対応する `.js` / `scripts/lib/sheets.py` の変更をcloudflareブランチへのpushで検知し、自動で再生成・コミットする（`chore: regenerate <ページ名>.html via GitHub Actions`）。手動実行（workflow_dispatch）も可能
  - 型A（表とフィルターのみ）の他ページへ展開するための共通クラスを `style.css` に用意している: `.mj-table`（表の見た目）、`.mj-pager`（ページ送りUI）、`.mj-left`（列ごとの左寄せ）、`.mj-plain`（リンクの下線を消す）。列幅・列固定・行高（`contain-intrinsic-size`）などページ固有の構造はIDセレクタ側に残す
  - `jpml_titles` / `jpml_test` / `resource_logs` は `?name=`の意味（完全一致フィルター vs 絞り込み欄の初期値）・`PAGE_SIZE`（100 vs 50）・画像の縦横比とフォールバック先が異なる。`resource_logs.html`だけページ内にハードコードされた内部リンク（名前セレクトボックス3件・タグリンク16本）を持つ。共通化（Python側のライブラリ化・JSの共有ファイル化）は未着手で、4ページ目以降への展開前に判断する
- 他18ページ（houou_*, ouka_*, saikyo_*, wrc_*, rh_*, resource_* など）はまだブラウザ側から `google.charts` (`google.visualization.Query`) で直接スプレッドシートを叩く旧方式（ページ生成の静的化はページごとに未着手）
- 選手のプロフィール画像は龍龍(ron2.jp)など外部ドメインを含む複数サービスに依存しており、リンク切れやすい

## メンテナンス用スクリプト（scripts/）
公開対象外（`.assetsignore` でCloudflareへの配信から除外）。GitHub Actionsから定期実行され、結果をissueに書き出す運用:
- `check_image_links.py` — `jpml_pros.html` 内の画像URL全件にHEADリクエストを送りリンク切れを検知（毎週月曜03:00 JST）
- `check_ron2_images.py` — 龍龍(ron2.jp)側の現在の画像と `jpml_pros.html` に埋め込み済みの画像が一致しているか確認（毎週月曜04:00 JST）
- `collect_ron2_images.py` — 龍龍から全選手の150x150画像URLを収集しCSV出力（スプレッドシート更新用、手動実行）
- `diagnose_ron2.py` — ron2.jpへのアクセス経路の切り分け用、一時的なスクリプト（原因判明後は本ファイルごと削除予定）
- 実行例: `python3 scripts/check_image_links.py --json result.json`（依存は標準ライブラリのみ、追加インストール不要）

## 方針
- 外部ドメインへの依存を増やさない（CSP導入を予定しているため）
- `.assetsignore` に開発用ファイルを列挙。公開対象を増やさないこと
- タスクはGitHub Issuesで管理
- ビルド・lint・テストの自動化コマンドはなし。HTML/JSの変更はブラウザで直接確認する

## 応答について
- 日本語で応答すること
