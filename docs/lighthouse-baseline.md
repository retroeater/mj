# Lighthouse ベースライン計測（2026-09-11）

#7完了後の再計測と比較するためのベースライン。今回はA（計測）とB（タップ領域44px化）の結果を記録する。

## 計測方法

- **PageSpeed Insights API はキーなしで429（クォータ超過）だった。** この環境の共有IPが1日の
  クエリ上限に達しているため、指示どおり lighthouse CLI のローカル実行に切り替えた
  （`npm install -g lighthouse` + `chrome-headless-shell@stable`）
- 対象6ページはいずれも **本番の `https://ryoei.pro/` に対して**計測（mobile / desktop 各1回、
  `--only-categories=performance,accessibility,best-practices,seo`）
- mobile は lighthouse既定のモバイルエミュレーション（CPU/回線スロットリングあり）、
  desktop は `--preset=desktop`（スロットリングなし〜軽め）
- この環境は `/dev/shm` が64MBしかなくデフォルト設定ではChromeタブがクラッシュしたため、
  `--disable-dev-shm-usage` を必須で付けている
- **B（タップ領域44px化）の前後比較のみ、ローカル静的サーバー（`python3 -m http.server`）に対して
  計測した。** `git stash` で `style.css` の変更を一時的に戻し、変更前→変更後の順でアクセシビリティ
  カテゴリのみ再計測している（本番にはまだデプロイしていないため）

## A. 4カテゴリのスコア

| ページ | 状態 | mobile perf | mobile a11y | mobile bp | mobile seo | desktop perf | desktop a11y | desktop bp | desktop seo |
|---|---|---|---|---|---|---|---|---|---|
| index.html | template | 85 | 93 | 77 | 100 | 99 | 93 | 77 | 100 |
| jpml_pros.html | 移行済み | **37** | 89 | 100 | 92 | 99 | 90 | 100 | 92 |
| resource_logs.html | 移行済み | 75 | 89 | 100 | 92 | 99 | 90 | 96 | 92 |
| jpml_test.html | 移行済み | 92 | 94 | 100 | 92 | 100 | 94 | 96 | 92 |
| video_wayhome.html | **未移行** | 78 | 86 | 100 | 92 | 96 | 86 | 96 | 92 |
| saikyo_results.html | **未移行** | 75 | 86 | 100 | 83 | 88 | 86 | 100 | 83 |

## LCP / CLS / TBT 実測値

| ページ | mobile LCP | mobile CLS | mobile TBT | desktop LCP | desktop CLS | desktop TBT |
|---|---|---|---|---|---|---|
| index.html | 4,167ms | 0.001 | 0ms | 953ms | 0.000 | 0ms |
| jpml_pros.html | **5,642ms** | 0.000 | **1,902ms** | 668ms | 0.005 | 67ms |
| resource_logs.html | 3,062ms | 0.005 | 555ms | 688ms | 0.007 | 22ms |
| jpml_test.html | 3,230ms | 0.005 | 0ms | 531ms | 0.000 | 0ms |
| video_wayhome.html | 5,226ms | 0.000 | 32ms | 1,341ms | 0.000 | 0ms |
| saikyo_results.html | 5,950ms | 0.000 | 116ms | 2,038ms | 0.000 | 0ms |

CLSは全ページで実質ゼロ（最大0.007）。レイアウトシフトは現状問題ない。

## 移行済み vs 未移行、どちらが良かったか

**一概にどちらが良いとは言えない。データ件数に依存する。**

- **TBT（メインスレッド専有時間）は、データ件数の多い移行済みページが圧倒的に悪い。**
  `jpml_pros`（1,099行）が1,902ms、`resource_logs`（2,630行超）が555msなのに対し、
  未移行の`video_wayhome`は32ms、`saikyo_results`は116ms。件数の少ない移行済みページ
  （`jpml_test`、20KB）はTBT 0msで最も良い
- **原因はDOM要素数。** `dom-size-insight`で実測したところ、
  `jpml_pros`は**26,886**、`resource_logs`は**23,724**要素なのに対し、
  未移行の`video_wayhome`は437、`saikyo_results`は937要素と**25倍以上の差**があった。
  移行済みページのページ送り（`.mj-pager`）は非表示行を`row.hidden = true`で
  隠すだけで、DOMからは削除していない（`resource_logs.js`で確認）。全行を
  一度に描画・保持する現行方式のコストが、件数が増えるほど直接効いてくる
- **一方、未移行ページは「Reduce unused JavaScript」の指摘を受けている**
  （`video_wayhome`で410ms、`saikyo_results`で570msの改善余地）。Google Charts
  ライブラリのうち実際に使っている部分はごく一部で、これは#7で移行が完了すれば
  自動的に解消する
- **LCPは全体的に未移行ページのほうが悪い傾向。** `saikyo_results`はdesktopでも
  2,038ms（他ページは500〜950ms台）。原因は`docs.google.com`への往復を待ってから
  描画する現行方式で、静的HTMLに焼き込み済みの移行済みページにはこの待ちがない
  （`jpml_test`はdesktop 531ms）。ただし`jpml_pros`はmobile LCPが5,642msと最悪で、
  これは通信待ちではなく1,099行を一度に描画するコスト側の問題

**結論**: 「移行済みだから速い」は成り立たない。#7の残り11ページのうち
件数が少ないページ（型Aの多く）は移行でTBT・LCPともに改善が見込めるが、
`jpml_pros`のように件数が多いページは、移行しただけでは解決しない
（handover.mdに記録済みのINP問題と同根）。件数の多いページの根本解決は
表示件数を絞ること（#24の五十音タブ、新サイトで対応）。

## Lighthouseの改善提案 上位3件

mobile計測6件の`overallSavingsMs`を合算して機械的に順位付け。

1. **Reduce unused CSS**（合計約1,090ms）— `index` / `jpml_test` / `video_wayhome` / `saikyo_results`
   で指摘。Bootstrap CSSを全ページ共通で読み込んでいるため、ページごとに使わない
   ルールが残る
2. **Reduce unused JavaScript**（合計約980ms）— `video_wayhome`（410ms）・`saikyo_results`
   （570ms）の**未移行2ページのみ**。Google Chartsライブラリの未使用分。#7の移行で解消見込み
3. **Initial server response time**（合計約762ms）— 全6ページで指摘、`resource_logs`が
   最大（400ms）。Cloudflare Workers配信そのものの応答時間で、静的アセット配信である
   以上ページ側の対処は難しい

## スコアが予想外だったページとその考察

- **index.html の best-practices が77と、他ページ（96〜100）より明確に低い。**
  原因は`is-on-https`監査の失敗（4件）。ポートフォリオ内のYouTubeサムネイルが
  `http://img.youtube.com/...`とハードコードされており、ブラウザが自動でHTTPSに
  昇格させているとはいえ、Chrome DevToolsのIssuesパネルには「Mixed content」として
  記録される。#9（CSP）や外部ドメイン棚卸しの際に`https://`へ修正する価値がある
  （今回は計測のみでコード修正はしていない）
- **`jpml_test` / `resource_logs` / `video_wayhome` の desktop best-practices が96止まり。**
  原因は`errors-in-console`（ron2.jpの画像で`net::ERR_INSUFFICIENT_RESOURCES`が
  複数発生）。**サンドボックス環境固有の計測ノイズだったと確定した
  （2026-09-11、平野さんの実機ブラウザのDevToolsで確認し、エラーは出ていない）。**
  同時接続数やファイルディスクリプタに制約があるこの環境特有の問題で、
  ron2.jp側にもサイト側にも実際の不具合はない
- **saikyo_results（未移行）が desktop でも perf 88と、他ページのdesktop（96〜100）より低い。**
  LCP 2,038msが原因で、上述のとおりGoogle Chartsのdocs.google.com待ちが
  desktopのスロットリングが軽い条件でもボトルネックとして残ることを示している
- **jpml_pros の mobile perf 37 は想定内。** handover.mdに記録済みのINP 458ms
  （ソート操作時の再描画コスト）とは別に、**初回描画そのものにもTBT 1,902ms・
  メインスレッド専有10.4秒のコストがある**ことが今回新たに分かった。1,099行を
  一度にDOMへ流し込む現行方式は、ソート時だけでなく初回表示にも効いている

## B（タップ領域44px化）によるアクセシビリティスコアへの影響

ローカルサーバーで`style.css`変更前後を比較（mobile、accessibilityカテゴリのみ）。

| ページ | 変更前 | 変更後 | 差分 |
|---|---|---|---|
| jpml_pros.html | 89 | 89 | ±0 |
| jpml_titles.html | 94 | 94 | ±0 |
| jpml_test.html | 94 | 94 | ±0 |
| resource_logs.html | 89 | 89 | ±0 |
| video_live.html | 94 | 94 | ±0 |

**スコアに変化はなかった。** Lighthouseの`target-size`監査はWCAG 2.2 AAの
最小基準（24×24 CSS px）を判定しており、今回の変更前から既にこの基準は
満たしていた（全ページ`target-size`スコア1、失敗要素0件）。44×44pxは
AAA相当の拡張基準でLighthouseのスコアには反映されない。実際に44px化できたことは
Puppeteer経由でDOM実測して個別に確認済み（`.mj-pager-button` 58×44、
`.mj-sort` 48×44、`.mj-filter-input` 100×44、`.nav-link` 351×64、
`.dropdown-item` 349×44。`.mj-table-2col`の画像列168px・横スクロールなしも
5ページで確認し、レイアウト崩れはなかった）。

**今後、タップ領域の改善をLighthouseスコアで測ろうとしないこと。**
target-size監査はAA基準（24px）で頭打ちになっており、44px化のような
AAA相当の改善はスコアに反映されない。効果を確認する場合はDOM実測
（今回のようなPuppeteerでのgetBoundingClientRect等）を使うこと。

## #7 残り17ページの行数調査（2026-09-11）

上記の実測で「件数が多いと移行しても速くならない」ことが分かったため、
#7の残り17ページ（`docs/handover.md`の型A11＋型B3＋型C2＋型D1）について、
移行後のDOM規模を先に把握する。各ページのJSからスプレッドシートID・
シート名・クエリを読み取り、`scripts/lib/sheets.py`で同じクエリの行数を
取得した（ページを開かず、gvizエンドポイントに直接クエリした結果）。

| ページ | 行数 | 列数 | 型 | 備考 |
|---|---|---|---|---|
| saikyo_results | ⚠️**2,560** | 2 | 2列テーブル(型A) | `?name`なしで全件描画。`jpml_pros`(1,099行)の2倍超で**最大の移行注意ページ** |
| houou_leagues | ⚠️16,011(全体)/52(集計後) | 15 | 多列テーブル(型B)※縦棒グラフ | 常に全件をブラウザへ転送し、クライアント側で52期分の`ColumnChart`に集計。DOM自体は小さい見込み |
| houou_results | ⚠️15,416(全体)/24(1名分,白鳥翔で実測) | 19(結果表)+5(ローソク足) | 多列テーブル(型B) | `?name`必須(未指定時は何も描画されない)。1名分は数十行程度で小さい |
| ouka_leagues | ⚠️1,561(全体)/21(集計後) | 7 | 多列テーブル(型B)※縦棒グラフ | houou_leaguesと同構造。1,000超だが実描画は21行 |
| ouka_results | ⚠️1,580(全体)/18(1名分,清水香織で実測) | 13(結果表)+5(ローソク足) | 多列テーブル(型B) | `?name`必須。1,000超だが1名分は小さい |
| wrc_results | ⚠️1,507(全体)/5(1名分,香野蘭で実測) | 9(結果表)+5(ローソク足) | 多列テーブル(型B) | 同上 |
| houou_ranking | ⚠️15,416(元データ、houou_resultsと同一シート) | 29 | ランキング系 | 集計エンジン(`league_ranking.js`)。行数の意味が違う |
| ouka_ranking | ⚠️1,580(元データ) | 29 | ランキング系 | 同上 |
| wrc_ranking | ⚠️1,507(元データ) | 29 | ランキング系 | 同上 |
| rh_results_detail | 321 | 8 | 多列テーブル(型B) | `setColumns`で22列中8列のみ表示。絞り込みパラメータなし、常に全件描画 |
| saikyo_mens | 90 | 2 | 2列テーブル(型A) | 「X」(画像)+「Profile」の2列 |
| video_en | 76 | 2 | 2列テーブル(型A) | |
| rh_paifu | 57 | 2 | 2列テーブル(型A) | 移行済み4ページと同型 |
| video_mtsuku | 61 | 3 | 2列テーブル(型A、実質3列) | 動画+概要+選手 |
| resource_efficiency | 30 | 2 | 横棒グラフ(型D) | 牌の種類数(34種)が上限。行数の心配なし |
| video_wayhome | 38 | 2 | 2列テーブル(型A) | 今回のLighthouse計測対象そのもの |
| rh_results | 12 | 6 | 多列テーブル(型B) | 絞り込みパラメータなし、常に全件描画。件数は少なく問題なし |

**わかったこと**

- **`saikyo_results`（2,560行）が単独で最大のDOM規模リスク。** `?name`を
  指定せずに開くと全件が描画対象になり、`jpml_pros`より大きい。#7で
  このページに着手する際は、`.mj-pager`方式（`row.hidden=true`）を
  そのまま踏襲すると`jpml_pros`と同じTBT/LCP悪化が再発する見込み
- **一方、`houou_leagues` / `houou_results` / `ouka_leagues` / `ouka_results` /
  `wrc_results` はスプレッドシート自体は1,000〜16,000行超と大きいが、
  実際にDOMへ描画される件数は小さい。** `houou_results` / `ouka_results` /
  `wrc_results` は`?name`が必須で(未指定時は何も描画しない)、1名分は
  数行〜24行程度。`houou_leagues` / `ouka_leagues` は`?name`なしでも
  全行をブラウザへ転送するが、`ColumnChart`用に52行・21行へ集計する
  だけなのでDOM自体は小さい。**ただし全行転送は帯域の無駄であり、
  ビルド時にPython側で対象選手だけに絞り込めば転送量も削減できる**
  （#7でこの5ページに着手する際の検討事項）
- ランキング系3ページ（`houou_ranking` / `ouka_ranking` / `wrc_ranking`）は
  `houou_results`等と同じ元シートを`division`ごとに集計するため、
  「行数」は元データの規模を示すのみで、実際の表示行数はDEFAULT_RANK_LIMIT
  （上位100件）に絞られる。`docs/handover.md`の既存の記録どおり
- 1,000行を超えるページは9件あるが、そのうち実際に「全行をDOMへ
  render-then-hideする」リスクがあるのは`saikyo_results`のみ。他は
  集計または`?name`必須の絞り込みにより実描画は小さい
