"""横棒グラフ(BarChart)を静的SVGとして生成する共通処理。

型D(resource_efficiency)で使う(#7/#128)。#127(型C)は積み上げ棒+選手の
折れ線という別物のため、汎用化を狙いすぎず横棒グラフに限定する。

外部の描画ライブラリ(matplotlib等)は使わない。scripts/配下は現在すべて
標準ライブラリのみで完結しており(requirements.txtやpyproject.tomlが無く、
ワークフローにもpip installの行がない)、横棒30本程度の座標計算は単純な
ため、SVG文字列をPython側で直接組み立てる。

ツールチップはJS/CSSなしで再現する: 各棒を<g>で包み、内側に<title>を
置くとブラウザが標準のホバーツールチップを表示する。

色・座標はすべてSVGの属性(x/y/width/height/fill/font-size等の
プレゼンテーション属性)で指定し、`style="..."`は使わない。プレゼン
テーション属性はCSPのstyle-srcの対象外だが、`style`属性はインライン
スタイルとして弾かれうるため(#9)。

## widthのみ%指定、heightは省略(<img>と同じ挙動)

viewBoxがあるSVGはwidthのみ指定するとheightがviewBoxのアスペクト比から
自動計算される。旧版はwindowのresizeイベントのたびにchart.draw()を
呼び直してGoogle Chartsに再描画させていたが、viewBoxによる自動追従なら
その仕組み自体が不要になる(JS削減)。

## デスクトップとモバイルでSVGを2枚用意する理由

この方式は「幅は100%で伸縮・高さは常に700px」という旧版の挙動そのものは
再現できない(アスペクト比が固定されるため、幅が変われば高さも比例して
変わる)。1枚のSVGで済まそうとして最初にdesign_width=1200(実測した
デスクトップ幅1280pxでほぼ700pxになるよう逆算した値)で作ったところ、
375px幅では高さが約219pxまで縮み、font-sizeも同じ比率(0.3125倍)で
縮んで約4pxになり読めなくなった。

CSSのメディアクエリでfont-sizeだけを引き上げる案も試したが、
バー本体の太さ・行間はSVGのアスペクト比に連動して縮んだままなので、
文字だけが行の高さを超えて隣の行と重なってしまい失敗した(font-sizeは
CSSで上書きできるが、rectのheight/y座標はSVG属性に焼き込み済みで
連動しないため)。

そのため、デスクトップ用とモバイル用で行間・余白比率から設計し直した
2枚のSVGを両方HTMLに埋め込み、style.cssの@media (max-width: 480px)で
表示を切り替える(#128実装時に実測して決定)。
"""
from html import escape


def horizontal_bar_chart(
    data,
    *,
    design_width=1200,
    design_height=700,
    chart_left=100,
    chart_top=50,
    chart_bottom=0,
    chart_right=40,
    bar_color="#3366cc",  # Google Chartsの1系列目の既定色
    font_family="Hiragino Sans, Yu Gothic Medium, Meiryo, sans-serif",
    font_size=13,
    css_class="",
    id_prefix="chart",
    title="",
    desc="",
) -> str:
    """横棒グラフのSVG文字列を返す。

    data: [(label, value), ...]。呼び出し側で降順に並べ替え済みのものを
    渡すこと(このページはSELECT ... ORDER BY B DESCで取得している)。

    座標計算:
      - plot_width  = design_width  - chart_left - chart_right
      - plot_height = design_height - chart_top  - chart_bottom
      - 1本あたりの縦幅(slot) = plot_height / 行数
      - 棒の太さ = slot × 0.7(残り0.3を隙間にする。旧Google Charts
        BarChartの既定の見た目に近い比率)
      - 棒の長さ = plot_width × (value / 最大値)
      - カテゴリラベルはchart_leftの左側に右寄せ、値のラベルは棒の
        右端に配置する(旧版のannotation: 末尾に値を文字列表示、に相当)

    id_prefix: <title>/<desc>のidと、それを参照するaria-labelledbyの
    接頭辞。同じページに複数のSVG(デスクトップ用・モバイル用)を
    埋め込む場合、idが重複しないよう呼び出しごとに変える。
    """
    if not data:
        return ""

    max_value = max(value for _, value in data)
    plot_width = design_width - chart_left - chart_right
    plot_height = design_height - chart_top - chart_bottom
    slot_height = plot_height / len(data)
    bar_height = slot_height * 0.7

    bars = []
    for i, (label, value) in enumerate(data):
        y_center = chart_top + slot_height * (i + 0.5)
        y_top = y_center - bar_height / 2
        bar_width = plot_width * (value / max_value) if max_value else 0

        label_text = escape(str(label))
        value_text = escape(str(value))

        bars.append(
            f'<g><title>{label_text}: {value_text}</title>'
            f'<rect x="{chart_left}" y="{y_top:.2f}" width="{bar_width:.2f}" '
            f'height="{bar_height:.2f}" fill="{bar_color}" />'
            f'<text x="{chart_left - 8}" y="{y_center:.2f}" text-anchor="end" '
            f'dominant-baseline="middle">{label_text}</text>'
            f'<text x="{chart_left + bar_width + 4:.2f}" y="{y_center:.2f}" '
            f'dominant-baseline="middle">{value_text}</text>'
            f"</g>"
        )

    bars_svg = "\n\t".join(bars)

    class_attr = f' class="{escape(css_class)}"' if css_class else ""
    title_id = f"{id_prefix}-title"
    desc_id = f"{id_prefix}-desc"

    return (
        f'<svg viewBox="0 0 {design_width} {design_height}" width="100%"{class_attr} '
        f'role="img" aria-labelledby="{title_id} {desc_id}" '
        f'font-family="{escape(font_family)}" font-size="{font_size}">\n'
        f'\t<title id="{title_id}">{escape(title)}</title>\n'
        f'\t<desc id="{desc_id}">{escape(desc)}</desc>\n'
        f"\t{bars_svg}\n"
        f"</svg>"
    )
