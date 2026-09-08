# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ryoei.pro

日本プロ麻雀連盟の選手データベースを含む個人サイト。

## 構成
- 静的HTML 27ページ。ビルド工程なし（Jekyllは廃止済み）
- Cloudflare Workersの静的アセットとして配信（`wrangler.jsonc`、assets.directory は `./`）
- 作業ブランチは cloudflare。gh-pages は旧GitHub Pages用で触らない
- Bootstrap 5.3.8 をローカル配信（assets/vendor）。CDNは使わない
- ページ本体（例: `houou_leagues.html`）とロジック（同名の `.js`）はファイルを分けている。ページ末尾で navbar.js を読み込んで共通ナビを描画する

## データの流れ
- 選手データ・成績データはすべてGoogleスプレッドシートが正本
- `jpml_pros.html`（選手データベース、1000名超）だけはビルド時生成に移行済み:
  - `scripts/generate_jpml_pros.py` が `scripts/lib/sheets.py` 経由でスプレッドシートのgvizエンドポイント（`google.visualization.Query` と同じSELECT構文）を叩き、静的HTMLに焼き込む
  - 生成後の絞り込み・並び替えは `jpml_pros.js` の軽量JSに委譲
  - GitHub Actions (`.github/workflows/regenerate-page.yml`) が、対象ソース（`jpml_pros.js` / `scripts/generate_jpml_pros.py` / `scripts/lib/sheets.py`）の変更をcloudflareブランチへのpushで検知し、自動で再生成・コミットする（`chore: regenerate jpml_pros.html via GitHub Actions`）。手動実行（workflow_dispatch）も可能
- 他20ページ（houou_*, ouka_*, saikyo_*, wrc_*, rh_*, resource_* など）はまだブラウザ側から `google.charts` (`google.visualization.Query`) で直接スプレッドシートを叩く旧方式（ページ生成の静的化はページごとに未着手）
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
