# GitHub Issues スナップショット

このファイルは会話でissue番号を共有するためのスナップショットです。
最新化が必要になったら、以下のコマンドで再生成してください。

```
gh issue list --repo retroeater/mj --state all --limit 200 \
  --json number,title,state,labels \
  --template '{{range .}}| #{{.number}} | {{.title}} | {{.state}} | {{range .labels}}{{.name}} {{end}} |
{{end}}'
```

生成日時: 2026-09-09

| # | タイトル | 状態 | ラベル |
| --- | --- | --- | --- |
| #87 | ソート中だけ描画を止めて中間状態の再計算を省く | OPEN | 状況: 保留 分野: パフォーマンス 対象: jpml_pros |
| #86 | ソート時に tbody ごと差し替えて再計算を1回にする | OPEN | 分野: パフォーマンス 対象: jpml_pros |
| #85 | contain-intrinsic-size を固定値にしてソート時の描画を軽くする | OPEN | 分野: パフォーマンス 対象: jpml_pros |
| #84 | GitHub Pagesを無効化する | OPEN | 状況: 保留 分野: インフラ |
| #83 | INP(Interaction to Next Paint)を測定して改善余地を確認する | CLOSED | 分野: パフォーマンス 対象: jpml_pros |
| #82 | SNSシェア・URLコピーボタンを設置する | OPEN | 状況: 保留 分野: UI/UX |
| #81 | index.htmlのコメントアウト済みセクションを整理する | CLOSED | 分野: 整理・保守 対象: index |
| #80 | index.htmlのコメントアウト済みセクションを整理する | CLOSED | 分野: 整理・保守 対象: index |
| #79 | URLパラメータの選手名をタブのタイトルに反映する | OPEN | 状況: 保留 分野: SEO 対象: 全ページ |
| #78 | OGP画像を作成して og:image を設定する | OPEN | 分野: SEO 対象: 全ページ |
| #77 | index.htmlのtestimonialsセクション(コメントアウト)を整理する | CLOSED | 分野: 整理・保守 対象: index |
| #76 | Cloudflare WAFを有効にする | OPEN | 状況: 保留 分野: セキュリティ |
| #75 | 選手データベースの表にaria属性を追加する | CLOSED | 分野: SEO 対象: jpml_pros |
| #74 | prefers-reduced-motionに対応する | CLOSED | 分野: UI/UX 対象: index |
| #73 | index.htmlのスクリプトにdeferを付ける | CLOSED | 分野: パフォーマンス 対象: index |
| #72 | 龍龍画像URLを150x150に統一する | CLOSED | 分野: パフォーマンス 対象: jpml_pros |
| #71 | Tiered Cacheを有効にする | CLOSED | 分野: インフラ |
| #70 | 画像再配信の利用規約を確認する | CLOSED | 分野: インフラ 対象: jpml_pros |
| #69 | Google Fontsのウェイトを削減する | CLOSED | 分野: パフォーマンス 対象: index |
| #68 | index.htmlのプレースホルダを確認する | CLOSED | 分野: 整理・保守 対象: index |
| #67 | sitemap.xmlに除外理由を明記する | CLOSED | 分野: SEO |
| #66 | フォント指定を全ページの表に広げる | CLOSED | 分野: UI/UX 対象: 全ページ |
| #65 | robots.txtを追加する | CLOSED | 分野: SEO |
| #64 | sitemap.xmlからリダイレクトURLを削除する | CLOSED | 分野: SEO |
| #63 | CNAMEを削除する | CLOSED | 分野: 整理・保守 |
| #62 | 開発用ファイルの公開を止める | CLOSED | 分野: セキュリティ |
| #61 | アイコンフォントをwoff2のみに絞る | CLOSED | 分野: パフォーマンス |
| #60 | index.htmlをbootstrap-icons.min.cssに差し替える | CLOSED | 分野: パフォーマンス 対象: index |
| #59 | assets/vendorの未使用ファイルを整理する | CLOSED | 分野: 整理・保守 |
| #58 | Bootstrapの読み込み元を統一する | CLOSED | 分野: 整理・保守 対象: 全ページ |
| #57 | 空のラッパーdivを削除する | CLOSED | 分野: 整理・保守 対象: jpml_pros |
| #56 | 未使用のCSSクラスを削除する | CLOSED | 分野: 整理・保守 |
| #55 | tableにcaptionとscopeを追加する | CLOSED | 分野: SEO 対象: jpml_pros |
| #54 | 検索欄にlabelを追加する | CLOSED | 分野: SEO 対象: jpml_pros |
| #53 | h1を追加する | CLOSED | 分野: SEO 対象: jpml_pros |
| #52 | meta descriptionを追加する | CLOSED | 分野: SEO 対象: jpml_pros |
| #51 | titleを見直す | CLOSED | 分野: SEO 対象: jpml_pros |
| #50 | altに選手名を含める | CLOSED | 分野: SEO 対象: jpml_pros |
| #49 | フォントスタックを指定する | CLOSED | 分野: UI/UX 対象: 全ページ |
| #48 | フィルターとソートを軽量化する | CLOSED | 分野: パフォーマンス 対象: jpml_pros |
| #47 | imgにwidth/height属性を付ける | CLOSED | 分野: パフォーマンス 対象: jpml_pros |
| #46 | インラインのonerror属性を廃止する | CLOSED | 分野: パフォーマンス 対象: jpml_pros |
| #45 | 画像のリンク切れを毎週検知する | CLOSED | 分野: 自動化 対象: jpml_pros |
| #44 | content-visibilityで画面外の行の描画を省く | CLOSED | 分野: パフォーマンス 対象: jpml_pros |
| #43 | テーブルヘッダーの色を決める | CLOSED | 分野: UI/UX 対象: jpml_pros |
| #42 | 404ページを整備する | CLOSED | 分野: インフラ |
| #41 | Google Search Consoleに登録する | CLOSED | 分野: SEO |
| #40 | モバイル表示を確認する | CLOSED | 分野: UI/UX 対象: 全ページ |
| #39 | リダイレクトを整備する | CLOSED | 分野: インフラ |
| #38 | 非本番ブランチのプレビュービルドを有効にする | CLOSED | 分野: インフラ |
| #37 | 画像を最適化する | CLOSED | 分野: パフォーマンス 対象: index |
| #36 | セキュリティヘッダーを設定する | CLOSED | 分野: セキュリティ 対象: 全ページ |
| #35 | jpml_pros.htmlのGoogle Charts依存を解消する | CLOSED | 分野: パフォーマンス 対象: jpml_pros |
| #34 | sitemap.xmlを再生成する | CLOSED | 分野: SEO |
| #33 | Jekyllを廃止して静的ファイルを直接配信する | CLOSED | 分野: パフォーマンス |
| #32 | GA4からCloudflare Web Analyticsへ移行する | CLOSED | 分野: インフラ 対象: 全ページ |
| #31 | 不要なファイルを削除する | CLOSED | 分野: 整理・保守 |
| #30 | メール送信の手段を検討する | OPEN | 状況: 保留 分野: インフラ |
| #29 | 認証方式を検討する | OPEN | 状況: 保留 分野: インフラ |
| #28 | Cloudflare D1の採用を検討する | OPEN | 状況: 保留 分野: インフラ |
| #27 | Noto Sans JPの採用を検討する | OPEN | 状況: 保留 分野: UI/UX 対象: 全ページ |
| #26 | リンクの見た目をモダンにする | OPEN | 状況: 保留 分野: UI/UX 対象: jpml_pros |
| #25 | プロフィール画像をR2へ移行する | OPEN | 状況: 保留 分野: インフラ 対象: jpml_pros |
| #24 | 五十音の行タブで絞り込めるようにする | OPEN | 状況: 保留 分野: UI/UX 対象: jpml_pros |
| #23 | スクロール中に検索ボックスを開くと背後にデータ行が見える | OPEN | 状況: 保留 分野: UI/UX 対象: jpml_pros |
| #22 | 龍龍・X・note・YouTube列をかな順でソートできるようにする | OPEN | 状況: 保留 分野: UI/UX 対象: jpml_pros |
| #21 | Astroへの移行を検討する | OPEN | 状況: 保留 分野: 整理・保守 対象: 全ページ |
| #20 | jpml_titles.html をAstroで試作する | OPEN | 状況: 保留 分野: 整理・保守 対象: jpml_titles |
| #19 | アクセス解析をサーバーサイド方式に変える | OPEN | 分野: インフラ 対象: 全ページ |
| #18 | Cloudflare Registrarへドメインを移管する | CLOSED | 分野: インフラ |
| #17 | Email Routingで独自ドメインのメールアドレスを作る | OPEN | 状況: 保留 分野: インフラ |
| #16 | ドメインをCloudflareへ切り替える | CLOSED | 分野: インフラ |
| #15 | index.htmlが別系統の構造になっている件 | OPEN | 状況: 保留 分野: 整理・保守 対象: index |
| #14 | 優先度の低い画像を最適化する | CLOSED | 分野: パフォーマンス 対象: index |
| #13 | 構造化データ(JSON-LD)を追加する | OPEN | 分野: SEO 対象: jpml_pros |
| #12 | OGPタグを追加する | CLOSED | 分野: SEO 対象: 全ページ |
| #11 | 旧URLのインデックス状況を確認しリダイレクトを判断する | CLOSED | 分野: SEO |
| #10 | Search Consoleのインデックス状況を確認する | CLOSED | 分野: SEO |
| #9 | CSP(Content-Security-Policy)を設定する | OPEN | 分野: セキュリティ 対象: 全ページ |
| #8 | 龍龍の所属・出身地等との照合 | OPEN | 分野: 自動化 対象: jpml_pros |
| #7 | 他20ページのGoogle Charts依存を解消する | OPEN | 分野: パフォーマンス 対象: 全ページ |
| #6 | ワークフローのpushトリガーを汎用化する | CLOSED | 分野: 自動化 |
| #5 | 他ページへのSEO展開 | CLOSED | 分野: SEO 対象: 全ページ |
| #4 | Sentryを導入してJSエラーを検知する | OPEN | 分野: 自動化 対象: jpml_pros |
| #3 | YouTubeチャンネルアイコンの一致確認 | OPEN | 状況: 待ち 分野: 自動化 対象: jpml_pros |
| #2 | 龍龍画像の同期確認を運用に乗せる | CLOSED | 分野: 自動化 対象: jpml_pros |
| #1 | 画像リンク切れの検知結果 | CLOSED | |
