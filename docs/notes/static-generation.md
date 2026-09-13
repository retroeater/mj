# 静的生成（#7）の実装記録

このファイルは完了済み作業の記録。現状とルールは docs/handover.md。

---

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

