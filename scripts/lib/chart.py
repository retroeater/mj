"""横棒グラフ(BarChart)・積み上げ棒+折れ線(ColumnChart)を静的SVGとして
生成する共通処理。

型D(resource_efficiency)で使う横棒グラフと、型C(houou_leagues/
ouka_leagues)で使う積み上げ棒+折れ線は別関数にしている(#127/#128)。
無理に汎用化せず、それぞれの見た目に素直な実装にする。

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

## モバイル用も等倍固定方式に変更(#151)

上記の理由でモバイル用はfont-size=9の小さいまま据え置いていたが、
本文(16px)と揃えるため、デスクトップ用(#149)と同じ「design_widthを
想定する最小幅の上限にし、1ユーザー単位 = 1CSSピクセルに固定する」
方式に変更した。文字を本文サイズに合わせる以上、行あたりの高さ
(slot)を文字サイズから逆算し直す必要があり、design_heightが増えて
グラフの縦の長さが伸びる(モバイル用は428→728、約1.7倍)。スマホでの
スクロール量が増えることは許容する方針とした。
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


def stacked_column_chart(
    period_labels,
    stacked_series,
    line_points,
    *,
    line_color="#0000cc",
    y_max,
    design_width,
    design_height,
    chart_left=20,
    chart_top=20,
    chart_right=20,
    chart_bottom=40,
    label_step=1,
    stagger_labels=None,
    font_family="Hiragino Sans, Yu Gothic Medium, Meiryo, sans-serif",
    font_size=12,
    css_class="",
    id_prefix="chart",
    chart_role="",
    title="",
    desc="",
) -> str:
    """積み上げ棒(期ごとのリーグ別人数)+選手1名分の折れ線をSVG文字列で返す。

    旧Google Charts版(houou_leagues.js/ouka_leagues.js)の
    `isStacked: true` + `series: {N: {type: 'line'}}` + `vAxis: {direction:
    -1}` に相当する見た目を、素直な座標系(value=0はプロット領域の上端、
    値が大きいほど下)で再現する。「direction: -1」で軸を反転させて描く
    旧実装よりわかりやすく、結果として同じ見た目(A1が上・E3が下、
    折れ線は良い順位ほど上)になる。

    period_labels: x軸ラベル(表示用文字列)のリスト。
    stacked_series: [(league_label, color, [count, ...]), ...]。
        積み上げ順(下から先頭が最初ではなく、A1のような上位リーグを
        先頭にする。value=0がプロット領域の上端なので、先頭のseriesほど
        上に積まれる)。counts配列はperiod_labelsと同じ長さ。
    line_points: [(period_index, value), ...]。出場していない期は要素を
        作らないこと(interpolateNulls相当。前後の点を直線で結ぶ)。
    y_max: y軸の最大値。呼び出し側で「その期の最大積み上げ合計」を基準に
        キリの良い数へ丸めたものを渡すこと(#127着手前の事前調査で、
        Google Chartsの自動スケーリングは単純な丸めではないことが
        判明したため、独自にキリの良い値を決める方針とした)。
    label_step: 何本おきにx軸ラベルを描くか(モバイル用の間引き)。
    stagger_labels: Trueなら偶数/奇数indexのラベルを2段に分けて描く
        (houou デスクトップの52本のように1本あたりの幅が狭く重なる
        場合用)。Noneなら「1本あたりの幅が40px未満なら自動でTrue」。
    chart_role: JS(leagues.js)が折れ線要素を見つけるための
        data-chart-role属性値。デスクトップ用・モバイル用で別の値を
        渡し、ページ内で複数のSVGがあっても区別できるようにする。

    折れ線をJS側から再計算できるよう、<polyline>要素にプロット領域の
    左上座標・幅・高さ・y軸最大値・期数をdata属性で持たせる(#127手順2)。
    JS側は x = plot_left + (index+0.5) * (plot_width/period_count)、
    y = plot_top + (value/y_max) * plot_height、で計算し直せる。
    """
    n = len(period_labels)
    plot_width = design_width - chart_left - chart_right
    plot_height = design_height - chart_top - chart_bottom
    band_width = plot_width / n
    bar_width = band_width * 0.62  # 旧版の実測比率(棒16px:ピッチ26px)に近い値

    if stagger_labels is None:
        stagger_labels = band_width < 40

    def x_center(i):
        return chart_left + band_width * (i + 0.5)

    def y_of(value):
        return chart_top + (value / y_max) * plot_height if y_max else chart_top

    # 積み上げ棒。各期ごとに累積値を上から積んでいく(value=0が上端)。
    bars = []
    cumulative = [0.0] * n
    for label, color, counts in stacked_series:
        for i, count in enumerate(counts):
            if count <= 0:
                continue
            y_top = y_of(cumulative[i])
            y_bottom = y_of(cumulative[i] + count)
            title_text = escape(f"{period_labels[i]} {label}: {count}")
            bars.append(
                f'<g><title>{title_text}</title>'
                f'<rect x="{x_center(i) - bar_width / 2:.2f}" y="{y_top:.2f}" '
                f'width="{bar_width:.2f}" height="{y_bottom - y_top:.2f}" '
                f'fill="{color}" /></g>'
            )
            cumulative[i] += count
    bars_svg = "\n\t".join(bars)

    # x軸ラベル。1段(stagger_labels=False)か2段(True)か。
    labels = []
    shown_indices = range(0, n, label_step)
    for i in shown_indices:
        row = 1 if (stagger_labels and i % 2 == 1) else 0
        y = design_height - chart_bottom + 14 + row * 14
        labels.append(
            f'<text x="{x_center(i):.2f}" y="{y}" text-anchor="middle">'
            f"{escape(str(period_labels[i]))}</text>"
        )
    labels_svg = "\n\t".join(labels)

    points_str = " ".join(f"{x_center(i):.2f},{y_of(v):.2f}" for i, v in line_points)

    class_attr = f' class="{escape(css_class)}"' if css_class else ""
    title_id = f"{id_prefix}-title"
    desc_id = f"{id_prefix}-desc"
    role_attr = f' data-chart-role="{escape(chart_role)}"' if chart_role else ""

    line_svg = (
        f'<polyline{role_attr} points="{points_str}" fill="none" '
        f'stroke="{line_color}" stroke-width="2" '
        f'data-plot-left="{chart_left}" data-plot-top="{chart_top}" '
        f'data-plot-width="{plot_width:.2f}" data-plot-height="{plot_height:.2f}" '
        f'data-y-max="{y_max}" data-period-count="{n}" />'
    )

    return (
        f'<svg viewBox="0 0 {design_width} {design_height}" width="100%"{class_attr} '
        f'role="img" aria-labelledby="{title_id} {desc_id}" '
        f'font-family="{escape(font_family)}" font-size="{font_size}">\n'
        f'\t<title id="{title_id}">{escape(title)}</title>\n'
        f'\t<desc id="{desc_id}">{escape(desc)}</desc>\n'
        f"\t{bars_svg}\n"
        f"\t{labels_svg}\n"
        f"\t{line_svg}\n"
        f"</svg>"
    )


def render_legend(items) -> str:
    """積み上げ棒+折れ線チャート用の凡例をHTMLで組み立てる。

    旧Google Charts版はSVG内蔵の凡例で、モバイル幅では13色/5色を
    ページ送りUI(◀ 1/4 ▶等)で切り替えていた(#127着手前の実機確認で判明)。
    静的化にあたっては、flex-wrapで折り返すだけの通常のHTMLに変更し、
    ページ送りJS自体をなくす。

    色見本は<span style="background:...">ではなく<svg><rect fill="..."/>
    にしている。style属性はCSP導入(#9)でインラインスタイルとして
    弾かれうるが、SVGのfill属性はプレゼンテーション属性でありその対象外
    のため(lib/chart.pyの他の関数と同じ方針)。

    items: [(color, label, role)]。role は leagues.js が選手の折れ線に
    対応する凡例ラベルを書き換えるための data-chart-role 属性値
    (不要な項目はNoneでよい)。
    """
    cells = []
    for color, label, role in items:
        role_attr = f' data-chart-role="{escape(role)}"' if role else ""
        cells.append(
            '<span class="mj-chart-legend-item">'
            f'<svg class="mj-chart-legend-swatch" viewBox="0 0 12 12" aria-hidden="true">'
            f'<rect width="12" height="12" fill="{color}" /></svg>'
            f"<span{role_attr}>{escape(label)}</span></span>"
        )
    return '<div class="mj-chart-legend">' + "".join(cells) + "</div>"
