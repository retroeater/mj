# 2026-09-11 レビュー指摘への対応

**完了済み（2026-09-12対応、cloudflareブランチへ直接コミット）。**
以下は作業時に受け取った指示文そのもの。セクション7のチェックリストは
対応完了後の結果で埋めてある。

---

作成日: 2026-09-12
目的: 2026-09-11 の包括レビューで挙がった指摘を、**issue の起票・更新とドキュメント更新で漏れなく実施する**。
前提: `docs/handover.md` と `docs/issues-snapshot.md` を読んでから着手すること。
作業ブランチは `cloudflare`。新しい作業ブランチは切らず、`cloudflare` に直接コミットする（#131 の再発防止）。

進め方の約束:
- issue 操作は `gh` で行う。ラベルは既存のもの（`状況: 対応中` / `状況: 保留` / `状況: 待ち`、`分野: SEO` / `分野: パフォーマンス` / `分野: 自動化` / `分野: セキュリティ` / `分野: 整理・保守` / `分野: インフラ` / `分野: UI/UX`、`対象: jpml_pros` / `対象: index` / `対象: 全ページ` など）だけを使い、新しいラベルは作らない。
- 起票した issue 番号は、本ファイル末尾のチェックリスト（セクション7）に書き戻す。
- ダッシュボード操作・ブラウザ操作が必要なもの（セクション6）は実施できないので、issue 本文に「平野さんが実施」と明記して残す。
- **コード・設定の変更を伴うものは、必ず変更前に該当 issue を起票し、変更後にコメントで結果を記録する。** 起票せずに直さない。
- 最後にセクション7のチェックリストを全部埋めてから終了する。

---

## 1. 最優先: `docs/` が本番で公開されていないか確認し、除外する

### 1-1. 事実確認（Codespace から実行）

```
curl -sI https://ryoei.pro/docs/handover.md | head -1
curl -sI https://ryoei.pro/docs/issues-snapshot.md | head -1
curl -sI https://ryoei.pro/docs/new-site-design.md | head -1
curl -sI https://ryoei.pro/dic/Google_pros_20260501.txt | head -1
```

- `docs/*.md` が **200** なら公開されている。404 なら公開されていない（どちらでも結果を記録する）。
- `dic/` は `resource_dictionary.html` から意図的にリンクしているので 200 で正しい。除外しないこと。

### 1-2. issue を起票する（結果がどちらでも起票する）

- タイトル: `docs/ を .assetsignore に追加する（本番で直接取得できる状態の可能性）`
- ラベル: `分野: セキュリティ`, `対象: 全ページ`
- 本文に書くこと:
  - `.assetsignore` は `scripts` / `CLAUDE.md` / `wrangler.jsonc` を除外しているが `docs` を除外していない
  - `docs/issues-snapshot.md` には WAF カスタムルールの式、DNS・SPF・DMARC の設定値、Registrar の期限、Search Console の実データ、ron2.jp へのアクセス経路調査が含まれる
  - 1-1 の curl 結果（ステータスコードと確認日時）
  - `dic/` は公開が正しいので対象外

### 1-3. 対応

- `.assetsignore` に `docs` を1行追加してコミット・push する。コミットメッセージに issue 番号を含める。
- デプロイ後、1-1 の curl を再実行し、`docs/*.md` が 404 になったことを issue にコメントする。
- `docs/handover.md` の「2. いまの構成」の `.assetsignore` の説明の直後に、次の趣旨を追記する:
  「**リポジトリ直下に新しいディレクトリやファイルを追加したときは、公開してよいものか確認し、公開しないものは `.assetsignore` に追加すること。** `docs/` は 2026-09-12 まで除外されていなかった（#issue番号）」
- 併せて `CLAUDE.md` の「方針」節の `.assetsignore` の行に、同じ趣旨を1行足す。
- 確認できたら issue を COMPLETED でクローズする。

---

## 2. 新規に起票する issue

以下をすべて起票する。各 issue の本文には、下記の要点に加えて「2026-09-11 のレビューで判明」と経緯を1行入れる。

### 2-1. purecounter / typed.js の sourceMappingURL を削除する（#99 の積み残し）

- ラベル: `分野: 整理・保守`, `対象: index`
- 要点:
  - `assets/vendor/purecounter/purecounter_vanilla.js` と `assets/vendor/typed.js/typed.umd.js` の末尾に `sourceMappingURL` が残っており、`.map` は同梱していない。`index.html` で開発者ツールを開くと 404 が出る
  - #99 では「#98 の判断待ち」で対象外にしたが、#98 は完了し、handover で「index 専用ライブラリ232KBはすべて稼働中」と確定したため、除外理由は消えている
  - 対応: 2ファイルの末尾コメントを削除する（CLAUDE.md の既存ルールどおり）。`grep -rn sourceMappingURL assets/` で残りが 0 件になることを確認
- 起票後そのまま対応してよい（変更は2行の削除のみ）。対応したらクローズ。

### 2-2. abs.twimg.com の既定アイコンURL（13件）を img/avatar.svg に正規化する

- ラベル: `分野: 整理・保守`, `対象: jpml_pros`
- 要点:
  - handover は「saikyo_mens の移行で abs.twimg.com への依存は解消済み」としているが、それはフォールバックの話。スプレッドシートの画像URLとして `https://abs.twimg.com/sticky/default_profile_images/default_profile_200x200.png` が `jpml_pros.html` に11件、`saikyo_results.html` に2件焼き込まれている
  - 対応案: (a) スプレッドシート側で該当セルを空にする（生成時にフォールバックへ落ちる）、(b) 生成スクリプト側で `abs.twimg.com/sticky/default_profile_images/` を `img/avatar.svg` に置換する。(b)ならデータを直さなくても再発しない。**#9 の img-src からこのドメインを外せる**ことが目的
  - どちらにするかは平野さんの判断。本 issue はまず起票のみ
- **この issue はコード変更せず起票のみ。** handover の該当箇所（「4. 押さえておくべき方針 → 外部ドメインへの依存を増やさない」の abs.twimg.com の記述）に「フォールバックの依存は解消したが、データ側に13件残っている（#issue番号）」と訂正を入れる。

### 2-3. CLAUDE.md を現状に合わせて更新し、更新ルールを決める

- ラベル: `分野: 整理・保守`
- 要点（本文に列挙し、そのまま対応する）:
  - 「9ページがビルド時生成に移行済み」→ 実際は `scripts/generate_*.py` が14本（`jpml_pros` ＋ 型A 10 ＋ 型A' 2 ＋ 型D 1）。`python3 scripts/regenerate.py --list` の出力を正として書き直す
  - 「残り12ページ（houou_*, ouka_*, saikyo_results, wrc_*, rh_results*, resource_efficiency）」→ 残り8ページ（`houou_leagues` / `houou_ranking` / `houou_results` / `ouka_leagues` / `ouka_ranking` / `ouka_results` / `wrc_ranking` / `wrc_results`）
  - 「型A・2列(一部3列)の8ページ」の列挙も現状（10ページ＋型A'＋型D）に合わせる
  - `diagnose_ron2.py` は存在しないので行ごと削除する
  - `regenerate.py`（対象ページ判定）、`apply_page_meta.py`（title/description/OGP の一括適用）、`build_issues_snapshot.py`（issue スナップショット生成）を「メンテナンス用スクリプト」節に追加する
  - **更新ルールを CLAUDE.md の末尾に追記する**: 「ページの移行・追加・削除を行ったときは、同じコミットで CLAUDE.md と docs/handover.md の件数・ページ列挙を更新すること。件数の正は `scripts/regenerate.py --list`」
- 対応したらクローズ。

### 2-4. docs/new-site-design.md §1「現行サイトの扱い」の前提を修正する

- ラベル: `分野: 整理・保守`
- 要点:
  - §1 は「現行サイト（GitHub Pages）は23ページが Google Charts 方式なので、スプレッドシートを直すだけで反映され、触らず放置できる」と書いているが、いま配信しているのは `cloudflare` ブランチで、14ページは `workflow_dispatch` の手動実行なしにデータが更新されない
  - 修正内容: (1) 「現行サイト」の定義を「Cloudflare Workers で配信中の `cloudflare` ブランチ」に改め、`gh-pages` は切り戻し用と明記、(2) 「放置してもデータは最新」は `gh-pages` にしか当てはまらないと書き直す、(3) 生成済みページのデータ更新は #103 に依存することを書く、(4) 冒頭の「現行サイト（GitHub Pages / gh-pages ブランチ）」も同様に直す
  - §7「引き継ぐもの」に `scripts/lib/page.py` / `scripts/lib/chart.py` / `table.js` を加えるかどうかは平野さんの判断なので、本 issue では「検討事項」として書くだけにする
- 対応したらクローズ。

### 2-5. sitemap.xml の lastmod を暫定的に正しくし、コメントを直す

- ラベル: `分野: SEO`
- 要点:
  - `<lastmod>` が25件すべて `2026-09-07` のまま。9/11 に多数のページを再生成しており実態と合わない。Google は不正確な lastmod を無視するようになるため、#121 の自動化までの暫定対応が必要
  - 対応案: (a) 各ページの最終コミット日（`git log -1 --format=%ad --date=short -- <file>`）で全件を書き直す、(b) `<lastmod>` を全件削除して #121 で復活させる。どちらでも可、平野さんの判断
  - コメントの「tanilog.html は resource_logs.html への転送用ページ」は誤り。ファイルは存在せず `_redirects` で 301 している。「`_redirects` で転送しており実体がない」側に移す
  - #121 に本 issue へのリンクをコメントする
- 起票のみ（判断待ち）。コメント修正だけは判断不要なので、起票後に直してよい。

### 2-6. check_image_links.py の対象を jpml_pros.html 以外の生成済みページへ広げるか決める

- ラベル: `分野: 自動化`
- 要点:
  - `check_image_links.py` は `TARGET_HTML = jpml_pros.html` のみ。焼き込み済みの他ページは監視外: `saikyo_results.html`（kinmaweb.jp 1,324 ＋ pbs.twimg.com 705）、`resource_logs.html`（pbs.twimg.com 2,630）、`video_live.html`（img.youtube.com 2,332）、`jpml_titles` / `saikyo_mens` / `video_*` / `rh_paifu` など
  - 旧 Google Charts 方式では実行時取得だったので同条件だが、焼き込みで古いURLが固定化されるため、リンク切れが放置されやすくなった
  - 論点: 対象を全生成ページに広げるか（HEAD リクエスト数が約1万に増える）、jpml_pros だけでよいと判断するか、ページごとに頻度を変えるか。#103（定期再生成）と併せて設計する
- 起票のみ。

### 2-7. issues-snapshot.md の自動更新が効かない経路を明記する

- ラベル: `分野: 整理・保守`
- 要点:
  - `.claude/settings.json` の PostToolUse フックは `cd /workspaces/mj` 固定で Codespace 以外では動かない。また `gh issue` 以外の経路（GitHub MCP、`gh api`、ブラウザ）での操作は反映されない
  - 対応: (1) handover「3. 作業の進め方 → タスク管理」に「GitHub MCP / gh api / ブラウザで操作した場合も反映されない。作業の最後に `python3 scripts/build_issues_snapshot.py` を手動実行する」と追記、(2) `.claude/settings.json` の `cd /workspaces/mj` を `cd "$CLAUDE_PROJECT_DIR"` 相当に直せるか確認する（環境変数の有無を確認してから。無ければ現状維持）
- (1) は起票後そのまま対応。(2) は確認結果をコメントに書く。

### 2-8. ランキング3ページ（houou_ranking / ouka_ranking / wrc_ranking）の移行方針を決める（#7 から分割）

- ラベル: `分野: パフォーマンス`, `対象: 全ページ`
- 要点:
  - 型B/C/D は #111 / #127 / #128 に分割済みだが、型Aの残り3ページ（ランキング系）だけ #7 のコメント内にしか進め方がない
  - handover「ランキング系3ページの性質」の内容を本文に転記する: `league_ranking.js`（772行）は集計エンジンで、9部門・部門ごとの クエリ・リーグごとの閾値をブラウザで計算している。移行は集計ロジックの Python 移植になる
  - 進め方の案（handover より）: 8部門を1つのHTMLに焼き込み `?division=` を表示切替に使う。検証は「集計だけ先に Python へ移植して現行ページと突合 → 一致後にHTML生成」の順
  - 新サイトのレーダーチャート（docs/new-site-design.md §4）が同じ集計を使うため、Python 移植は新サイトでも再利用できる。**現行サイト用に移植するか、新サイトまで据え置くか**が判断点
- 起票のみ。#7 に「ランキング3ページは #番号 で扱う」とコメントする。

### 2-9. title 整備（#5）の効果を Search Console で測る

- ラベル: `分野: SEO`
- 要点:
  - #5 で26ページの `<title>` を整備したが、効果測定は「これから」のまま（handover SEO 節: 表示48回・クリック2回・CTR約4%）
  - 対応: 変更前後で同じ期間長（例: 28日）の 表示回数 / クリック数 / CTR / 平均掲載順位 を比較し、結果を handover の SEO 節に追記する。GSC の計測期間が短いので、結論を急がず「初回計測」として記録する
  - 平野さんが実施（Search Console の操作）
- 起票のみ。

### 2-10. issues-snapshot.md に open のみの要約版を追加する（提案）

- ラベル: `分野: 整理・保守`, `状況: 保留`
- 要点:
  - 現在 222KB・131件を毎回全量読む運用で、会話コストが大きい
  - 案: `build_issues_snapshot.py` に `--open-only` を足して `docs/issues-open.md` を併せて出力し、handover「0. 新しい会話の始め方」の案内を「まず open 版、必要なら全量」に変える
  - 採否は平野さんの判断
- 起票のみ。

---

## 3. 既存 issue へのコメント追記・更新

各コメントの冒頭に「### 追記（2026-09-12、レビュー反映）」と入れる。

### #76（WAF）

- **まず事実確認**: Block へ切り替えたかどうかは issue に記録がない。handover には「2026-09-11 に Block へ切替済み」とある。平野さんに確認するか、確認できなければ「handover には切替済みとあるが issue に記録なし。ダッシュボードで Managed Ruleset の action を確認して追記すること（平野さん）」とコメントする
- 切替済みなら、切替日時と「24時間後の Events 確認（`?name=` / `?tag=` が遮断されていないこと）を 9/12 以降に行いクローズする」を書く

### #110（メソッド遮断）

- 本日 9/12 が確認日。平野さんが行う確認項目（Web Analytics の PV 前日比、Managed rules Events から POST 由来の検知が消えたか）を再掲し、「結果を記入してクローズ」と書く

### #130（AIボット制御）

- 「期限 2026-09-15。旧トグル廃止後の設定変更は平野さんがダッシュボードで実施。結果（Search / Agent 許可・Training ブロック、混在クローラーの扱い、robots.txt の配信内容）をここに記録する」とコメントする

### #112（検索ボタン）

- 「resource_efficiency と rh_results_detail は #7 で絞り込み欄なしとして移行済み。該当は index を除き7ページで確定（404 / jpml_links / resource_dictionary / resource_efficiency / rh_links / rh_results / rh_results_detail）。『#7 完了後に判断』の条件は解消したので、(a)/(b)/(c) を決められる」とコメントし、本文の「#7 未移行」の記述に取り消し線か訂正を入れる（`gh issue edit`）

### #125（Observatory）

- 「候補の `saikyo_results` は移行済み（mobile perf は docs/lighthouse-baseline.md の移行結果を参照）。未移行の最大規模は `houou_results`（15,416行、#111）に変わった。候補を index / jpml_pros / houou_results / jpml_titles に見直す」とコメントする

### #103（定期再生成）

- 「移行済みは14ページになった（起票時は5ページ）。14ページ分のデータが手動実行に依存しており、運用リスクとして最大。#7 の完了を待たず、週次 cron（`workflow_dispatch` と同じ `all` を回し、差分がなければコミットしない現行の判定をそのまま使う）で先に着手する案を提案する。採否は平野さんの判断」とコメントする
- Projects ボードでの優先順位変更は平野さんが実施（セクション6）

### #9（CSP）

- 「Speed Brain との併用制約は #119 で『機能しない・Off』に確定したため無効」と1行書く
- 生成済みHTMLの `<img src>` から機械的に洗い出した外部ドメイン一覧を表で書く（gstatic を除き12件）: `img.youtube.com` / `pbs.twimg.com` / `ron2.jp` / `abs.twimg.com`（データ側13件、2-2 参照） / `yt3.googleusercontent.com` / `yt3.ggpht.com` / `assets.st-note.com` / `d2l930y2yx77uc.cloudfront.net` / `stat.profile.ameba.jp` / `kinmaweb.jp`（saikyo_results 1,324件） / `i.ytimg.com`（index） / `www.icualumni.com`（index）。次のコマンドで再現できることも書く:
  ```
  for f in *.html; do grep -o 'src="https\?://[^/"]*' "$f" | sed 's/src="//'; done | sort | uniq -c | sort -rn
  ```
- handover「画像ドメインの実測結果（#9 の材料）」の表にも同じ12件を反映する（ページ別に件数を出す）

### #111（型B）

- 「据え置き（a）を早期に確定させる案: `houou_results` の15,416行は自前ページ送りでは解けず、ECharts は新サイトで採用予定（docs/new-site-design.md §5）。据え置きなら #9 は `script-src` に `www.gstatic.com`、`connect-src` に `docs.google.com` を含めて書け、#7 のスコープが収束する。#127 も同じ判断に従う。採否は平野さんの判断」とコメントする

### #7

- 「ランキング3ページは #（2-8 の番号）で扱う。残り8ページの内訳: 型B 3（#111）・型C 2（#127）・ランキング 3（#新番号）」とコメントする

### #129（Early Hints）

- 「Smart Hints への申込みが済んでいるか不明。申込み済みなら日付を、未なら申込み後に日付をここに記録する（平野さん）」とコメントする

### #4（Sentry）

- 「『現行サイトに作り込みすぎない』方針との整合を再確認したい。現行サイトに外部ドメインを1つ足してから CSP（#9）を書く順序になっているが、新サイト（#101）側で導入するほうが自然な可能性がある。`状況: 保留` にするか、現行で入れるかを平野さんが判断する」とコメントする

### #96 / #97

- それぞれに「『決まるまで着手しない』状態で、決める場が設定されていない。判断する日を決めるか、`状況: 保留` を付けて新サイト着手時に再検討する扱いにするかを平野さんが決める」とコメントする

### #121（sitemap lastmod）

- 2-5 の issue 番号をコメントでリンクする

### #99（closed）

- 2-1 の issue 番号をコメントでリンクする（積み残しの追跡用。reopen はしない）

---

## 4. ドキュメント更新（issue に紐づかないもの）

### 4-1. docs/handover.md

- 「最終更新」を 2026-09-12 にする
- 「5. 次にやること」の表を修正: `#7 | 他17ページ` → `#7 | 残り8ページ（型B 3 / 型C 2 / ランキング 3）`。表の上に**期限付き・確認待ちタスク**の小表を追加する:

  | # | 内容 | 期限・目安 |
  |---|---|---|
  | #110 | メソッド遮断の翌日確認 | 9/12 |
  | #76 | Block 切替後24時間の Events 確認 | 9/12〜 |
  | #130 | AIボット制御の再設定 | 9/15 廃止後すみやかに |
  | #84 | GitHub Pages 無効化の判断 | 9/23 |
  | #131 | 作業ブランチの削除 | 随時（平野さん） |

- 「2. いまの構成 → ページ構成」の表と「#7 の進め方」の表を、CLAUDE.md（2-3）と同じ数字に揃える
- 「6. これまでに分かったこと → 画像ドメインの実測結果」を 12 ドメインの表に差し替える（#9 コメントと同内容）
- 「4. 押さえておくべき方針 → 外部ドメイン」の abs.twimg.com の記述を訂正（2-2）
- 「2. いまの構成」の `.assetsignore` 説明に 1-3 の注意を追記
- 「3. 作業の進め方 → タスク管理」に 2-7 の (1) を追記
- SEO 節の末尾に「title 整備の効果測定は #（2-9）で行う」と1行
- 「7. 関連文書」に、本ファイルを `docs/` に置く場合はその行を足す（置くかどうかは 4-4 参照）

### 4-2. docs/lighthouse-baseline.md

- 「#7の残り11ページ」の箇所に「（2026-09-12 時点では残り8ページ。最新は handover 参照）」と注記する。数値の書き換えはしない（計測時点の記録のため）

### 4-3. sitemap.xml

- 2-5 のコメント修正のみ先に行う（lastmod は判断待ち）

### 4-4. 本ファイルの扱い

- 本ファイル（`review-followup-instructions.md`）を `docs/` に置くなら、作業完了後は「完了済み」と冒頭に書いて残す。置かない場合は、セクション7のチェックリストの結果を handover の「6. これまでに分かったこと」に「2026-09-11 レビューの反映結果」として要約を残す。どちらにするかは平野さんの判断。指定がなければ `docs/` に置く（1-3 の対応後は公開されない）

---

## 5. 会話上の判断とメモリのずれ（記録のみ）

以下はリポジトリ外（Claude 側の記憶）の話なので作業は不要。ただし新しい会話で食い違いが出たら、**docs/handover.md と issue が正**であることを前提に進める。

- ホスティングは Cloudflare Workers（GitHub Pages ではない）、ワークフローは3本ある
- Astro 試作の対象は `index.html`（#20 で変更済み。`houou_results` ではない）
- プロフィール画像の R2 移行（#25）と Sentry（#4）は未着手・保留扱い
- SDP データベースは WordPress プラグイン（Directorist 等）ではなく Astro＋D1 の設計（docs/new-site-design.md）に置き換わっている

---

## 6. 平野さんがブラウザ・ダッシュボードで行うもの（Claude Code では実施不可）

該当 issue に「平野さんが実施」と明記したうえで、ここにも一覧を残す。

| 項目 | 場所 | 関連 issue |
|---|---|---|
| Block 切替の有無の確認と、24時間後の Events 確認 | Cloudflare Security → WAF / Events | #76 |
| 9/12 の PV 前日比・POST 検知の確認 | Cloudflare Web Analytics / Events | #110 |
| 9/15 以降の AI ボット設定の組み直し | Cloudflare Security → Settings → Bot traffic | #130 |
| Smart Hints への申込み | Cloudflare Speed → Content Optimization | #129 |
| `claude/canonical-policy-decision-dbk5dq` の削除 | GitHub Branches 画面 | #131 |
| #103 の優先順位を上げる | Projects ボード `ryoei.pro enhancements` | #103 |
| title 整備の効果測定 | Search Console | 2-9 |
| デバイス比率の確認 | Cloudflare Analytics → Traffic（Source device type） | #106 |
| 判断: abs.twimg 正規化の方式 / sitemap lastmod の暫定対応 / 型B据え置き / Sentry の位置づけ / #96・#97 の扱い / open 版 snapshot | 各 issue にコメントで回答 | 2-2, 2-5, #111, #4, #96, #97, 2-10 |

---

## 7. 完了チェックリスト（結果、2026-09-12）

```
[x] 1-1 curl 実施（結果: docs/handover.md → 200→404 / issues-snapshot.md → 200→404 / new-site-design.md → 200→404 / dic → 200のまま）
[x] 1-2 issue 起票 → #133
[x] 1-3 .assetsignore 追加・push・再確認（404 確認日時: 2026-09-11 15:08 UTC）・クローズ
[x] 1-3 handover / CLAUDE.md に注意書き追記
[x] 2-1 起票 #134 / 対応・クローズ
[x] 2-2 起票 #135（起票のみ）/ handover 訂正
[x] 2-3 起票 #136 / CLAUDE.md 更新・更新ルール追記・クローズ
[x] 2-4 起票 #137 / new-site-design.md §1 修正・クローズ
[x] 2-5 起票 #138（lastmod は判断待ち）/ sitemap コメント修正 / #121 にリンク
[x] 2-6 起票 #139
[x] 2-7 起票 #140 / handover 追記・settings.jsonをCLAUDE_PROJECT_DIR対応に修正・クローズ
[x] 2-8 起票 #141 / #7 にコメント
[x] 2-9 起票 #142
[x] 2-10 起票 #143（状況: 保留）
[x] 3 コメント: #76 / #110 / #130 / #112（本文訂正含む）/ #125 / #103 / #9 / #111 / #7 / #129 / #4 / #96 / #97 / #121 / #99
[x] 4-1 handover.md 更新（最終更新日・期限表・件数・画像ドメイン表・abs.twimg・assetsignore・snapshot 注記・SEO 節・関連文書）
[x] 4-2 lighthouse-baseline.md 注記
[x] 4-4 本ファイルの置き場所を決めて反映 → docs/ に配置（本ファイル）
[x] python3 scripts/build_issues_snapshot.py を手動実行し、docs/issues-snapshot.md を最新化
[x] gh issue list --state open で件数・ラベルを目視確認（open 51件、ラベルは既存の3系統のみ使用）
[x] すべて cloudflare へコミット・push（作業ブランチは作らない）
```

### 起票した issue 番号の対応表

| セクション | issue番号 |
|---|---|
| 1-2 | #133（対応完了・クローズ） |
| 2-1 | #134（対応完了・クローズ） |
| 2-2 | #135（起票のみ、判断待ち） |
| 2-3 | #136（対応完了・クローズ） |
| 2-4 | #137（対応完了・クローズ） |
| 2-5 | #138（コメント修正のみ対応済み、lastmod は判断待ち） |
| 2-6 | #139（起票のみ、判断待ち） |
| 2-7 | #140（対応完了・クローズ） |
| 2-8 | #141（起票のみ、判断待ち） |
| 2-9 | #142（起票のみ、平野さん実施） |
| 2-10 | #143（起票のみ、判断待ち。状況: 保留） |
