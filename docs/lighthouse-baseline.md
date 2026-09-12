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

**結論**: 「移行済みだから速い」は成り立たない。#7の残り11ページ
（2026-09-12時点では残り8ページ。最新は`docs/handover.md`参照）のうち
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
  記録される。**2026-09-11に修正・本番反映し、再計測でbest-practices
  77→100（mobile/desktopとも）に改善したことを確認した**（下記「index.htmlの
  Mixed content修正」参照）
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

## index.html の Mixed content 修正（2026-09-11）

上記の指摘を受け、index.htmlのYouTubeサムネイル8箇所（`<img src>` 4件・
`<a href>`のlightbox用リンク4件）を`http://`から`https://`に修正した。
27ページ全体を`grep`で確認し、他に埋め込みリソースとしての`http://`参照は
なかった（`jpml_links.html`の2件は`<a href target="_blank">`の outbound
リンクで、埋め込みリソースの取得ではないため mixed content の対象外。
xmlns属性の`http://www.w3.org/2000/svg`もXML名前空間の識別子であり、
ブラウザが実際に取得する資源ではないため対象外）。

本番反映後に再計測した結果:

| | mobile before | mobile after | desktop before | desktop after |
|---|---|---|---|---|
| best-practices | 77 | **100** | 77 | **100** |
| is-on-https | 0(4件の insecure request) | 1(0件) | 0 | 1 |

performance / accessibility / seo に変化はなし（意図どおり、この修正は
best-practicesのみに影響する）。#9（CSP）で`upgrade-insecure-requests`を
書くか、mixed contentが弾かれる設計にするかの判断が不要になった。

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
| saikyo_results | ⚠️**2,560** | 2 | 2列テーブル(型A) | `?name`なしで全件描画。**移行済み(2026-09-11)**。当初「`jpml_pros`の2倍超で最大の移行注意ページ」と記録したが、後日`houou_results`(15,416行)の方がDOM規模リスクが大きいと判明し訂正済み(下記「わかったこと」参照)。移行後は`resource_logs`(2,630行、2列テーブル)と同規模の`page_size=100`構成で、実測値は下記「saikyo_results.htmlの移行結果」を参照 |
| houou_leagues | ⚠️16,011(全体)/52(集計後) | 15 | 縦棒グラフ(型C) | 常に全件をブラウザへ転送し、クライアント側で52期分の`ColumnChart`に集計。DOM自体は小さい見込み |
| houou_results | ⚠️15,416(全体)/**500(実描画、`?name`なし)**/24(1名分,白鳥翔で実測) | 19(結果表)+5(ローソク足) | 多列テーブル(型B) | `?name`任意。ローソク足だけが`?name`必須で未指定時は空。**表(`myTable`)は無条件で描画され`page:'enable'`+`pageSize:500`により実際のDOM行数は500(31ページ)**。実機確認で判明(2026-09-11) |
| ouka_leagues | ⚠️1,561(全体)/21(集計後) | 7 | 縦棒グラフ(型C) | houou_leaguesと同構造。1,000超だが実描画は21行 |
| ouka_results | ⚠️1,580(全体)/**100(実描画、`?name`なし)**/18(1名分,清水香織で実測) | 13(結果表)+5(ローソク足) | 多列テーブル(型B) | `?name`任意(houou_resultsと同型)。`page:'enable'`+`pageSize:100`で実際のDOM行数は100(16ページ)。ただしリーグ欄はhouou_resultsと違いCategoryFilterではなくStringFilter(実機確認で判明) |
| wrc_results | ⚠️1,507(全体)/**100(実描画、`?name`なし)**/5(1名分,香野蘭で実測) | 9(結果表)+5(ローソク足) | 多列テーブル(型B) | `?name`任意。コントロールは名前のみ(期・リーグの欄が存在しない)。`pageSize:100`で実際のDOM行数は100(16ページ)。houou_results/ouka_resultsとは構成が異なる(実機確認で判明) |
| houou_ranking | ⚠️15,416(元データ、houou_resultsと同一シート) | 29 | ランキング系 | 集計エンジン(`league_ranking.js`)。行数の意味が違う |
| ouka_ranking | ⚠️1,580(元データ) | 29 | ランキング系 | 同上 |
| wrc_ranking | ⚠️1,507(元データ) | 29 | ランキング系 | 同上 |
| rh_results_detail | 321 | 8 | 多列テーブル(型A') | **移行済み(2026-09-11)**。`setColumns`で22列中8列のみ表示。絞り込みパラメータなし、常に全件描画 |
| saikyo_mens | 90 | 2 | 2列テーブル(型A) | 「X」(画像)+「Profile」の2列 |
| video_en | 76 | 2 | 2列テーブル(型A) | |
| rh_paifu | 57 | 2 | 2列テーブル(型A) | 移行済み4ページと同型 |
| video_mtsuku | 61 | 3 | 2列テーブル(型A、実質3列) | 動画+概要+選手 |
| resource_efficiency | 30 | 2 | 横棒グラフ(型D) | **移行済み(2026-09-11、静的SVG化)**。牌の種類数(34種)が上限。行数の心配なし |
| video_wayhome | 38 | 2 | 2列テーブル(型A) | 今回のLighthouse計測対象そのもの |
| rh_results | 12 | 6 | 多列テーブル(型A') | **移行済み(2026-09-11)**。絞り込みパラメータなし、常に全件描画。件数は少なく問題なし |

**わかったこと**

- **`saikyo_results`（2,560行）が単独で最大のDOM規模リスク。** `?name`を
  指定せずに開くと全件が描画対象になり、`jpml_pros`より大きい。#7で
  このページに着手する際は、`.mj-pager`方式（`row.hidden=true`）を
  そのまま踏襲すると`jpml_pros`と同じTBT/LCP悪化が再発する見込み
- **`houou_results`は`?name`なしでも表(`myTable`)が無条件で描画される
  ことが実機確認で判明した。** 当初「`?name`必須で未指定時は何も描画
  されない」と記録していたが誤りで、`if(search_name)`はローソク足
  (`#myChart`)の読み込みにしか掛かっていない。現在DOM行数が500に
  収まっているのは、Google Chartsの`page:'enable'`+`pageSize:500`が
  実際にDOMをページ単位で分割しているため。**これを自前の`row.hidden`
  方式(`.mj-pager`)に置き換えると、`houou_results`は15,416行が丸ごと
  DOMに乗り、`saikyo_results`(2,560行)を超えて#7最大のDOM規模ページに
  なる。** `ouka_results`(1,580行/pageSize:100)・`wrc_results`
  (1,507行/pageSize:100)も同様に`?name`任意で無条件描画されるが、
  行数が少なく実害は`houou_results`ほど大きくない
- `houou_leagues` / `ouka_leagues`は`?name`なしでも全行をブラウザへ
  転送するが、`ColumnChart`用に52行・21行へ集計するだけなのでDOM自体は
  小さい。**土台の積み上げ棒は選手に関わらず全員共通で、`?name`に依存
  するのは重ねた折れ線1本だけ**(実機確認で、積み上げ部分のSVG要素が
  `?name`の値によらず一致することを確認)。**ただし全行転送は帯域の
  無駄であり、ビルド時にPython側で対象選手だけに絞り込めば転送量も
  削減できる**（#7でこのページに着手する際の検討事項）
- ランキング系3ページ（`houou_ranking` / `ouka_ranking` / `wrc_ranking`）は
  `houou_results`等と同じ元シートを`division`ごとに集計するため、
  「行数」は元データの規模を示すのみで、実際の表示行数はDEFAULT_RANK_LIMIT
  （上位100件）に絞られる。`docs/handover.md`の既存の記録どおり
- 1,000行を超えるページは9件あるが、そのうち実際に「全行をDOMへ
  render-then-hideする」リスクがあるのは`saikyo_results`
  (2,560行、`.mj-pager`方式への置き換えを想定)と、`houou_results`
  (15,416行、現状はGoogle Chartsの`pageSize:500`がDOM分割を担っている
  ため顕在化していない)の2件。**`houou_results`は移行方法次第で
  `jpml_pros`(1,099行)や`saikyo_results`を上回る最大のDOM規模ページに
  なりうる。** `ouka_results`/`wrc_results`は同様の構造だが行数が
  1,500〜1,600台でリスクは小さい。`houou_leagues`/`ouka_leagues`は
  集計により、ランキング系3ページは`DEFAULT_RANK_LIMIT`により、
  それぞれ実描画は小さい

## 型Aの小さい5ページの移行結果（2026-09-11）

`scripts/lib/page.py` + `table.js`で`video_wayhome` / `video_en` /
`rh_paifu` / `saikyo_mens` / `video_mtsuku`（いずれも38〜90行）を
ビルド時生成に移行した。本番反映後に計測。

| ページ | mobile perf | mobile a11y | mobile bp | mobile seo | desktop perf | LCP(mobile) | TBT(mobile) | CLS(mobile) | DOM要素数 |
|---|---|---|---|---|---|---|---|---|---|
| video_wayhome | **96** | 89 | 100 | 92 | 100 | 2,230ms | 22ms | 0.000 | 428 |
| video_en | 99 | 94 | 96 | 92 | 100 | 1,599ms | 0ms | 0.005 | 694 |
| rh_paifu | 99 | 89 | 100 | 92 | 100 | 1,878ms | 0ms | 0.005 | 599 |
| saikyo_mens | 99 | 94 | 96 | 92 | 100 | 1,666ms | 32ms | 0.000 | 716 |
| video_mtsuku | 98 | 94 | 100 | 92 | 100 | 2,297ms | 40ms | 0.000 | 745 |

### video_wayhome の移行前後比較

移行前（未移行、2026-09-11計測分）と移行後（本番反映後）の同一ページの比較。

| | 移行前 | 移行後 | 差分 |
|---|---|---|---|
| mobile performance | 78 | **96** | +18 |
| mobile LCP | 5,226ms | **2,230ms** | -3,000ms弱 |
| mobile TBT | 32ms | 22ms | ほぼ変わらず |
| mobile CLS | 0.000 | 0.000 | 変わらず |
| DOM要素数 | 437 | 428 | ほぼ変わらず |

**件数の少ないページでは「移行済みだから速い」がそのまま成り立った。**
DOM要素数はほぼ変わらない（Google ChartsのTable chartも小規模データでは
DOMを大きく膨らませないため）が、LCPが半分以下に改善している。原因は
`docs.google.com`への往復待ちがなくなったこと。`jpml_pros`
（1,099行、mobile perf 37）のような大規模ページとは対照的に、
小規模ページの移行はTBTを悪化させることなくLCPだけを改善する、
という当初の想定どおりの結果になった。

### 予想外だった点

- 5ページとも`best-practices`が96〜100で、`errors-in-console`の
  指摘（ron2.jp関連、サンドボックス固有のノイズと確認済み）は出なかった。
  ron2.jpの画像を使わないページ群だったための差
- **`mobile accessibility`が`video_wayhome`/`rh_paifu`のみ89、他3ページは94。**
  原因は`color-contrast`監査の失敗。`.mj-table`内のテキストリンク
  （`video_wayhome`のXの`@ハンドル`名、`rh_paifu`の牌譜リンク）が
  Bootstrapの既定リンク色`#0d6efd`のままで、偶数行の縞模様背景
  `#fafafa`との組み合わせでコントラスト比4.31（基準4.5未満）になる。
  `.mj-plain`クラスの有無とは無関係（`.mj-plain`は`text-decoration:
  none`しか指定していない）。`video_en`/`saikyo_mens`/`video_mtsuku`は
  画像リンクのみでセル内にテキストリンクを持たないため該当しない。
  `resource_logs.html`（2026-09-10移行）の店名リンクも同じ既定色を
  使っており、同一の原因でaccessibility 89だったと考えられる。
  今回は計測・原因特定のみで修正はしていない。詳細と修正方針は#108を参照

## rh_results_detail.html の移行結果（2026-09-11）

型A'(多列テキストテーブル)の2ページ目。321行を全件描画する(絞り込み・
ページ送りなし)。本番反映後にmobileを計測。

| performance | accessibility | best-practices | seo | LCP | CLS | TBT | DOM要素数 |
|---|---|---|---|---|---|---|---|
| 89 | 94 | 100 | 92 | 2,595ms | 0.000 | 236ms | 3,573 |

`jpml_pros`(1,099行、DOM 26,886要素、TBT 1,902ms)や`resource_logs`
(2,630行、DOM 23,724要素、TBT 555ms)と比べると、321行というデータ量なりに
DOM要素数(3,573)・TBT(236ms)とも小さく収まっている。全件描画・
`row.hidden`方式の弱点(#7の期待値の修正を参照)は行数が数百件程度までは
軽微であることを裏付ける結果になった。

## saikyo_results.html の移行結果（2026-09-11）

型Aの2列テーブル。2,560行、`page_size=100`の`.mj-pager`方式。
本番反映後にmobileを計測。TBT/LCPのばらつきが大きかったため3回計測した
（このサンドボックス環境から実際の外部ドメイン（`kinmaweb.jp`等）へ画像
リクエストが飛ぶため、ネットワーク遅延の影響を受けやすい）。

| 実行回 | performance | LCP | TBT | DOM要素数 |
|---|---|---|---|---|
| 1回目 | 90 | 2.9s | 60ms | 20,830 |
| 2回目 | 86 | 2.4s | 420ms | 20,830 |
| 3回目 | 81 | 4.8s | 30ms | 20,830 |

DOM要素数は3回とも**20,830**で安定（行数の実測値と一致し、ばらつきは
ネットワーク由来と判断できる）。CLS/a11y/bp/seoは他の移行済みページと
同水準（未記載分は変化なし）。

**当初の指示どおり`resource_logs`（2,630行、DOM 23,724要素）と並べて
比較したところ、TBTが指示時点の記録値（555ms）から大きく外れた
（今回のsaikyo_resultsは30〜420ms）。原因を調べたところ、比較対象の
555msという数値自体が古い記録だと判明した。**

- `resource_logs`のTBT 555msは、`docs/lighthouse-baseline.md`の
  「A. 4カテゴリのスコア」節（本ファイル冒頭、2026-09-11の最初の計測）
  で記録した値だが、これは**`.mj-table tbody tr`に`content-visibility:
  auto`を追加する前**の測定である（この最適化は後続のページ共通化
  作業で`style.css`に追加された）。非表示行を`row.hidden`で隠すだけで
  DOMからは削除しない、という当時の説明（44行目付近）はもう現状と
  一致していない
- 現在の本番`resource_logs.html`を同条件で3回再計測すると、
  TBTは**190ms・80ms・120ms**（DOM要素数は23,724で変わらず）。
  `content-visibility: auto`により画面外の行の描画・レイアウトが
  スキップされるようになった効果と考えられる
- 訂正後の値（`resource_logs`のTBT中央値120ms前後）と`saikyo_results`
  （TBT中央値60ms前後）を比べると、DOM要素数の差（20,830 vs 23,724、
  約12%少ない）とおおむね整合する範囲に収まっており、**大きな乖離では
  ない**。当初懸念していた「2,560行を無条件で全件描画」というリスクは、
  `page_size=100`の`.mj-pager`＋`content-visibility: auto`の組み合わせで
  実際に抑えられていることが確認できた
- **本ファイル中の「resource_logsのTBT 555ms」という記述（44行目・
  284行目）は、`content-visibility: auto`追加前の古い値である旨、
  今後この値を参照するときは注意すること。** 再計測はしていないため
  数値自体は訂正せず、この節に経緯として記録するに留める

## resource_efficiency.html の移行結果（2026-09-11）

型D(静的SVG、表を持たない)。グラフ系6ページの中で唯一、外部JSを
一切読まないページになった。本番反映後にmobileを計測。

| performance | accessibility | best-practices | seo | LCP | CLS | TBT | DOM要素数 | 総転送量 |
|---|---|---|---|---|---|---|---|---|
| **98** | 93 | 100 | 91 | 2,112ms | 0.000 | **2ms** | 387 | 80KB |

**#7でこれまで移行した中で最も軽量なページになった。** 型A'
(`rh_results_detail`、TBT 236ms・DOM 3,573)よりさらに小さく、
`www.gstatic.com`への外部JS依存が完全になくなったことがTBT・DOM要素数
双方に効いている。型B/C(#111/#127)がGoogle Charts据え置きか静的化かを
判断する際、この数字が「静的化した場合の下限」の目安になる。

## houou_leagues.html / ouka_leagues.html の移行結果（2026-09-11）

型C(積み上げ棒+選手1名の折れ線、静的SVG+折れ線だけクライアント描画の
ハイブリッド)。本番反映後にmobileを計測。

| ページ | performance | accessibility | best-practices | seo | LCP | CLS | TBT | DOM要素数 | 総転送量 |
|---|---|---|---|---|---|---|---|---|---|
| `houou_leagues` | **98** | 93 | 100 | 91 | 2.0s | 0.000 | **0ms** | 4,059 | 104KB |
| `ouka_leagues` | 97 | 93 | 100 | 91 | 2.2s | 0.000 | 40ms | 693 | 88KB |

`resource_efficiency`(型D、DOM 387・TBT 2ms)と比べるとDOM要素数が
hououで一桁増えている。691名分の`<option>`(セレクトボックス)が主因で、
グラフ本体(積み上げ棒+折れ線のSVG、デスクトップ/モバイル2枚)自体は
軽量。折れ線データ(`houou_leagues_data.json`、gzip後36KB程度)は
`?name=`未指定時はfetchされない(JSが`return`して終わる)ため、既定選手
表示時の総転送量には含まれていない。

accessibilityの93点は`link-name`/`landmark-one-main`の2件の指摘によるもので、
`resource_efficiency.html`など他ページと共通の`navbar.js`側の既存問題
（このページ固有ではない）。

## video_wayhome.html ヒーロー画像追加（#102 第1段、2026-09-12）

最新話のサムネイル(`maxresdefault.jpg`、1280×720、なければ`hqdefault.jpg`に
フォールバック)をヒーローとして表に大きく配置した。**この計測のみ
本番反映前で、ローカルの`wrangler dev`（`--persist-to`使用、CLAUDE.md参照）
に対して行った。** 本番同様の静的アセット配信だが、Cloudflareのエッジや
実ネットワーク経路を経由しないため絶対値はそのまま信用せず、
変更前後の相対比較として読むこと。またこのサンドボックス環境は
CPU負荷のノイズが大きく、同一ページで複数回計測しても
performanceスコアが0.48〜0.96まで振れることを確認した（1回だけの
計測は外れ値の可能性があるため、before/eachとも複数回計測し
中央値付近の値を採用している）。

**実装時の落とし穴**: `.mj-hero-image`に`aspect-ratio: 16/9`だけを指定し
`height`を明示しなかったところ、`<img>`のCLS対策用`height`属性
（maxres=720、hq=360）がaspect-ratioより優先され、幅100%のまま
縦長に伸びる不具合が起きた（object-fit: coverで元画像の左側だけが
縦に引き伸ばされて表示される状態）。`height: auto`を明示して解消した
（style.cssの.mj-hero-imageにコメントを残してある）。CDP経由で
`getBoundingClientRect()`と`getComputedStyle()`を直接確認して原因を
特定した(ブラウザのスクリーンショットだけでは気づきにくい)。

| 状態 | performance | accessibility | best-practices | seo | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| 変更前(表のみ、旧video_wayhome.html) | 0.97 | 0.89 | 0.96 | 0.92 | 2.5s | 0.005 | 30ms |
| 変更後(ヒーロー追加、3回計測) | 0.92〜0.95 | 0.89 | 0.96 | 0.92 | 2.8〜3.2s | 0.005 | 30〜90ms |

- **LCPが表の1行目サムネイル(160×90のmqdefault)から、ヒーローの
  maxresdefault(1280×720、数十〜百数十KB)に変わったことで、
  ローカル計測でも0.5〜0.7秒程度悪化している。** `fetchpriority="high"`
  と`loading="lazy"`を付けない対応はしているが、ファイルサイズ自体が
  大きいぶんの遅れは残る。事前の想定どおりで、許容範囲
- **accessibility/best-practices/seoは変更前後で完全に同点。** ヒーロー追加による
  新規の指摘はない(alt属性・見出し階層とも問題なし)
- **CLSは変更前後とも0.005で変化なし。** width/height属性を明示しているため
  レイアウトシフトは発生していない
- 本番反映後、production環境での再計測を推奨する(このセクションの数値は
  ローカル限定であることに注意)

## video_wayhome.html 全面リデザイン（#102 第2段、新サイトのパイロット、2026-09-12）

表形式をやめ、全画面ヒーロー(最新話) + 横スクロールのエピソード列に
作り変えた。カラートークン(ライト/ダーク)・共有ボタン・構造化データ等、
新サイトへ持ち越すための判断材料を作るパイロット実装(詳細は
docs/new-site-design.md「パイロット: video_wayhome」参照)。この計測も
第1段と同じくローカルの`wrangler dev`に対して行った(本番反映前)。

| 状態 | performance | accessibility | best-practices | seo | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| 第1段(ヒーロー追加のみ、表は維持) | 0.92〜0.95 | 0.89 | 0.96 | 0.92 | 2.8〜3.2s | 0.005 | 30〜90ms |
| 第2段(全面リデザイン、3回計測) | 0.91〜0.94 | 0.94〜0.96 | 0.96 | 0.92 | 3.0〜3.2s | 0.000 | 20〜150ms |

- **accessibilityが0.89→0.94〜0.96に改善した。** 表を捨てたことで
  `.mj-table`系ページ共通の指摘(このページにはなかった)とは別に、
  ページ全体を`<main class="mj-video-page">`で包んだことで
  `landmark-one-main`の指摘が解消した。他ページはnavbar.js側の
  `link-name`(検索アイコンのアクセシブルネーム欠如)が残るためこの点は
  上げられないが、video_wayhomeはnavbar.jsを触らずに済む範囲で
  この1件だけ先に潰した。**残る指摘は`link-name`(navbar.jsの検索
  アイコンリンク、全ページ共通の既知の問題)のみ**
- **CLSが0.005→0.000に改善。** 表のページ送り・sticky見出しが無くなり、
  横スクロールのカード列も高さが変動しない構造のため
- **LCPは第1段とほぼ同水準(3.0〜3.2s)。** ヒーロー背景画像
  (maxresdefault、`fetchpriority="high"`)がLCP要素である点は
  第1段と変わらないため、体感の大きな変化はない
- **performanceは第1段から誤差の範囲内。** JSON-LD(2ブロック、
  エピソード38件分のItemListを含む)を追加した分わずかにHTMLが
  増えているが、計測ノイズ(このサンドボックス環境は複数回計測で
  スコアが振れることを確認済み、上記第1段の節参照)の範囲に収まる
- 本番反映後、production環境での再計測を推奨する(このセクションの数値も
  ローカル限定)

## video_wayhome.html 濃色固定（#102第2段の後始末、2026-09-12）

`@media (prefers-color-scheme: dark)` をやめ、ダーク側の値を既定に固定した
（決定の経緯は `docs/new-site-design.md` §2「トーン」/ §12「パイロット:
video_wayhome」）。計測はローカル静的サーバー（`python3 -m http.server`）に
対する lighthouse CLI（mobile 既定エミュレーション、`--only-categories=
accessibility,performance`）。

| 状態 | accessibility | performance | 失敗している a11y 監査 |
|---|---|---|---|
| 固定化直後（未修正） | 0.92 | 0.95 | `color-contrast`, `link-name` |
| コントラスト2件を修正後 | **0.96** | 0.91 | `link-name` のみ |

- **`color-contrast` はこの計測で初めて出た指摘。** Lighthouse（headless
  Chrome）は `prefers-color-scheme` を指定せず常にライト側で走るため、
  濃色固定にするまでこのページのダーク配色は一度も計測されていなかった。
  検出された2件は (1) `.mj-video-page a` の詳細度が `.mj-video-btn-primary` に
  勝ち、白背景のボタン文字が accent `#7fb3d5` になっていた（2.26:1）、
  (2) `.mj-lead`（#158）が明色前提の `#555555` のままだった（2.51:1）。
  いずれも修正済み（17.4:1 / 8.29:1）。詳細は new-site-design.md §12
- performance の 0.95 → 0.91 はこのサンドボックスの計測ノイズの範囲
  （既知。第1段の節を参照）。色の固定のみで構造は変えていない
- **残る指摘は `link-name`（navbar.js の検索アイコン、全ページ共通）のみ。**
  → #163 で対応（次節）

## navbar.js 検索アイコンへの aria-label 追加（#163、2026-09-12）

`navbar.js` が描画する虫眼鏡リンクにアクセシブルネームが無く、Lighthouse
accessibility の `link-name` 指摘が navbar.js を読み込む全26ページで出ていた
（#102第2段の計測で判明）。`aria-label="検索"` を1か所足して解消した。
`navbar.js` は生成物ではない静的ファイルなのでHTMLの再生成は不要
（全27ページのHTMLに navbar のマークアップは焼き込まれていないことを
`grep -l 'data-bs-toggle="collapse" href="#searchBoxes"' *.html` = 0件で確認）。

計測はローカル静的サーバーに対する lighthouse CLI（mobile、
`--only-categories=accessibility,performance`）。

| ページ | a11y（前） | a11y（後） | perf（前→後） | 残る a11y 指摘 |
|---|---|---|---|---|
| video_wayhome.html（表なし） | 0.96 | **1.00** | 0.91 → 0.91 | **なし** |
| jpml_test.html（表あり・検索欄あり） | 0.94 | **0.98** | 0.91 → 0.91 | `landmark-one-main` |
| rh_results.html（表あり・検索欄なし） | 0.93 | **0.98** | 0.93 → 0.93 | `landmark-one-main` |

- **3ページとも `link-name` が消えた。** video_wayhome は #102第2段で
  `landmark-one-main` を既に潰してあるため、**失敗する a11y 監査が0件**に
  なった（accessibility 1.00）
- 残る `landmark-one-main` は `navbar.js` を読む他ページ共通の指摘で、
  ページ本体を `<main>` で包めば解消する（video_wayhome で実証済み。
  型A/A' 全体へ広げるかは別途判断）
- perf は前後で変化なし（`aria-label` 1属性の追加のみ）

### `aria-controls` が存在しない要素を指している件（#163 の調査）

`show_filter=False` のページには `#searchBoxes` が無く、このリンクの
`aria-controls="searchBoxes"` が存在しない要素を指している。該当は
`404` / `index` / `jpml_links` / `resource_dictionary` / `resource_efficiency` /
`rh_links` / `rh_results` / `rh_results_detail` の8ページ
（`index.html` は navbar.js を読まないので実質7ページ）。

**結論: 現状では a11y の指摘は出ない。** axe-core 4.13 / Lighthouse で確認:

- `aria-valid-attr-value` は **pass**（violation でも incomplete でもない）。
  axe は `aria-expanded="false"` のとき、参照先が存在しない `aria-controls` を
  許容する（動的に生成される可能性があるため）
- `aria-expanded="true"` に変えると **violation になる**ことは確認した。ただし
  `navbar.js` は常に `"false"` で出力し、Bootstrap の collapse は対象要素が
  無いと何もしないため `"true"` にならない（実際にクリックしても
  `aria-expanded` は `"false"` のまま、JSエラーも無し、URLも変化なし）

つまり機械的な指摘は出ないが、**該当7ページでは「押しても何も起きない
リンク」が表示・フォーカス可能なまま残る**。`aria-label` を足したことで
スクリーンリーダーからは「検索」という名前で読み上げられるようになるため、
名前の付いた無反応なコントロールになる点はむしろ以前より目立つ。
対応方針（該当ページでアイコン自体を出さない等）は #163 のコメント参照。
