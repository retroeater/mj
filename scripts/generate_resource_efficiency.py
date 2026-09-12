#!/usr/bin/env python3
"""resource_efficiency.html を Googleスプレッドシート「シート1」の
データから静的HTMLとして再生成するスクリプト。型D(#7/#128)。

これまでブラウザ側(resource_efficiency.js + Google Charts)が毎回
スプレッドシートへ問い合わせ、BarChartを描画していた処理を、ビルド時に
Python側で一度だけ実行し、横棒グラフを静的SVGとして焼き込む。
グラフ系6ページの中で唯一、URLパラメータに依存せずデータ量も固定
(牌の種類34種が上限・実データ30行)のため、完全に静的SVG化できる。

シート名の確認: 旧JSはURLに #gid=1188043937 とだけ書いており、シート名を
指定していなかった。fetch_sheet()はシート名を必須にしているため、
スプレッドシートの編集画面のHTMLからタブ名を突き合わせて確認した
(2026-09-11)。gid=0が「詳細」、gid=1188043937が「シート1」で、
一見デフォルト名に見える「シート1」が実際に使われているシートだった
(タブの並び順とgidの大小は対応しないことがある一例)。

B列(組合せ数)の表示形式はGeneral(桁区切りなし)で、f値はint化したvと
一致することを確認済み。formatted=Falseで問題ない。

使い方:
    python3 scripts/generate_resource_efficiency.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.chart import horizontal_bar_chart  # noqa: E402
from lib.page import PageMeta, esc, render_content  # noqa: E402
from lib.sheets import fetch_sheet  # noqa: E402

SPREADSHEET_ID = "1O8IzJYEB_tfgvh1RI41mkR2JZjeHTFCZ4gtMY_l8fkQ"
SHEET_NAME = "シート1"
QUERY = 'SELECT A,B WHERE E = "Y" ORDER BY B DESC'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "resource_efficiency.html"

META = PageMeta(
    title="牌効率 | リソース | ryoei.pro",
    description="牌効率の比較のため、牌姿{count}通りごとにメンツが完成する組合せ数を計算した一覧表です。",
    og_url="https://ryoei.pro/resource_efficiency.html",
    h1="どの牌を残すとメンツができやすいか | Efficiency to create a new group from an existing group and/or an isolated tile",
    caption="",  # render_content()では使わない(表を持たないため)
)

# 旧版はグラフのtitleオプション(chartArea内、SVG内のテキスト)として
# 日英併記の長い説明を描いていたが、SVG内のテキストは折り返せず画面幅
# によって切れる。HTML側の見出し(可視のh1)として出せば折り返しも
# 読み上げも効くため、意図的にこちらへ移した。
# クラスmj-page-headingで本文(計算方法の段落)と同じフォントサイズに
# 揃える(#152)。Bootstrap既定のh1サイズは本文比で大きすぎるため。
BODY_TEMPLATE = """<h1 class="mj-page-heading">{h1}</h1>
<div>
{chart_svg_desktop}
{chart_svg_mobile}
</div>
<p class="mj-margin-text">
計算方法：<br>
「東」からメンツを作るには、「東」（残り3枚）⇒「東」（残り2枚）とツモる必要があるので、組合せ数は3*2=6通り。<br>
「3456」からメンツを作るには、「1⇒2」「2⇒1」「2⇒4」「2⇒7」（略）「7⇒2」「7⇒5」「7⇒8」「8⇒7」で、174通り。<br>
「1」と「9」、「2」と「8」、「3456」と「4567」等、同形・類形の牌姿については初出のみ代表として掲載しています。<br>
</p>
<p class="mj-margin-text">
How to calculate the number of combinations to create a new group:<br>
東: Draw "東" (3 left) and "東" (2 left) to create a new group "東東東" - 6 combinations.<br>
3456: Draw "1->2", "2->1"..."7->8", "8->7" to create a new group - 174 combinations.<br>
*Only shows the first one for the same shape e.g. 1 for 9, 2 for 8, 3 for 4/5/6/7, 3456 for 4567.<br>
</p>"""


def main():
    print(f"「{SHEET_NAME}」シートを取得中...")
    raw_rows = fetch_sheet(SPREADSHEET_ID, SHEET_NAME, QUERY)
    print(f"{len(raw_rows)}件取得しました。HTML生成中...")

    data = [(label, value) for label, value in raw_rows]

    chart_title = "どの牌を残すとメンツができやすいか"
    chart_desc = "Efficiency to create a new group from an existing group and/or an isolated tile"

    # デスクトップ用: design_width=1200は実測したデスクトップ幅(1280px)で
    # ほぼ700px(746px)になるよう逆算した値(#128実装時に決定)。
    # font_size=16は本文(計算方法の段落、Bootstrap既定16px)に合わせた値
    # (#149)。style.css側で.mj-bar-chart-desktopにmax-width: 1200pxを
    # 指定し、SVGが等倍以上に拡大されないようにして文字サイズを固定する。
    chart_svg_desktop = horizontal_bar_chart(
        data,
        design_width=1200,
        design_height=700,
        chart_left=100,
        chart_top=50,
        chart_right=40,
        font_size=16,
        css_class="mj-bar-chart-desktop",
        id_prefix="efficiency-chart-desktop",
        title=chart_title,
        desc=chart_desc,
    )
    # モバイル用: デスクトップと同じ寸法比率だと375px幅でfont-sizeが
    # 約4pxまで縮み読めなくなるため、実際のモバイル幅に近い設計値で
    # 別に組み立てる(#128実装時に実測して決定)。
    # design_width=360はデスクトップと同じ考え方(#149)で、想定する
    # 最小のモバイル幅を上限にして等倍固定する値(#151)。font_size=16は
    # 本文と揃えた値で、slot(design_height 728 - chart_top 8 = 720を
    # 30行で割った24px)に収まるようdesign_heightを組み直した。
    # chart_rightは値ラベル最大3桁(約24px)+隙間4pxが収まるよう30→36に。
    chart_svg_mobile = horizontal_bar_chart(
        data,
        design_width=360,
        design_height=728,
        chart_left=60,
        chart_top=8,
        chart_right=36,
        font_size=16,
        css_class="mj-bar-chart-mobile",
        id_prefix="efficiency-chart-mobile",
        title=chart_title,
        desc=chart_desc,
    )

    body_html = BODY_TEMPLATE.format(
        h1=esc(META.h1),
        chart_svg_desktop=chart_svg_desktop,
        chart_svg_mobile=chart_svg_mobile,
    )
    # このページは #searchBoxes を持たないので、navbar.js の虫眼鏡アイコンを
    # 出さないよう <body> に data-search="off" を出す(#163)。
    output = render_content(META, body_html, count=len(data), has_search_boxes=False)

    OUTPUT_PATH.write_text(output, encoding="utf-8")
    print(f"{OUTPUT_PATH} を更新しました。")


if __name__ == "__main__":
    main()
