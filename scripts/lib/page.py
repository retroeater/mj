"""型A(2列テーブル。画像+概要)ページの共通処理。

jpml_titles / jpml_test / resource_logs / video_live の4本の
generate_*.py から重複していたHTMLテンプレート・行組み立て・画像セル
組み立て・HTMLエスケープをここに集約する。各ページの生成スクリプトは
「設定(PageMeta / TableConfig) + 行の組み立て関数(build_row_html)」だけを
持てばよい。

jpml_pros.html(15列・列ヘッダによるソート機能あり)はここでは対象外。
性質が異なるため generate_jpml_pros.py は今後も独自のテンプレートを持つ。
"""
import dataclasses
import html
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from lib.sheets import fetch_sheet  # noqa: E402


def esc(value) -> str:
    """HTMLエスケープ。Noneは空文字扱い"""
    if value is None:
        return ""
    return html.escape(str(value))


def apply_count(description: str, count: int | None) -> str:
    """description 内の {count} を実データの件数で置換する(#158)。
    count が None なら {count} を含まない前提でそのまま返す。"""
    if count is None:
        return description
    return description.replace("{count}", f"{count:,}")


@dataclasses.dataclass
class PageMeta:
    """head の内容と、本文冒頭の見出し・キャプション。"""

    title: str  # <title>と og:title 共通
    description: str  # meta descriptionと og:description 共通
    og_url: str  # 例: "https://ryoei.pro/jpml_titles.html"
    h1: str  # visually-hidden の h1
    caption: str  # tableの visually-hidden caption
    # og:image。既定は全ページ共通の1枚(#78)。ページ固有の画像を持つ
    # ページ(#162のwayhome個別ページ等)は差し替える。
    og_image: str = "https://ryoei.pro/img/ogp.png"
    og_image_width: int = 1200
    og_image_height: int = 630
    og_image_alt: str = "ryoei.pro"
    # <link rel="canonical">。既定はNoneで出力しない(#113。現行サイトは
    # canonicalなし=Googleの正規化任せの方針)。#162のwayhome個別ページは
    # ?name=等の変種を持たないため#113の理由が当てはまらず、例外として付ける。
    canonical: str | None = None


@dataclasses.dataclass
class TableConfig:
    """テーブル・検索欄・ページ送りの構成。

    5ページ目以降(video_wayhome等)を見越して、現行4ページでは
    使わない値にも対応できるようにしている:
      - headers は2要素とは限らない(video_mtsukuは3要素)
      - page_size は None にできる(video_mtsukuはページ送りなし)
      - extra_table_class は空文字にできる(3列ページは mj-table-2col を
        付けない方針のため)
    """

    table_id: str
    headers: list  # 見出しラベルのリスト。2要素とは限らない(video_mtsukuは3列)
    extra_table_class: str = "mj-table-2col"  # 3列ページなどは "" にする
    page_size: int | None = 100  # Noneならページ送りなし(video_mtsuku)
    name_mode: str = "none"  # "exact"なら ?name= をdata-nameの完全一致に使う
    filter_param: str = "name"  # 絞り込み欄の初期値に使うURLパラメータ("name" か "tag")
    filter_label: str = "概要で検索"
    filter_placeholder: str = "概要"
    # 絞り込み欄を持たないページ(rh_results)はFalseにする。#searchBoxes
    # ごと出力せず、data-filter-param も付けない。
    show_filter: bool = True
    # ページ固有の検索欄UI(resource_logsの名前セレクトボックス・タグリンク等)。
    # 既定の絞り込みinputの前後に挿入する。ページ専用の小さなJSと組みで使う。
    search_boxes_before: str = ""
    search_boxes_after: str = ""
    # ページ固有の小さなJS(resource_logsの名前セレクトボックス用など)。
    # table.jsでは共通化せず、このscriptタグをheadにもう1本追加する。
    extra_script: str = ""
    # h1直後、#searchBoxesの手前に差し込むページ固有のHTMLブロック
    # (video_wayhomeのヒーロー画像など、#102)。空文字なら何も差し込まない。
    content_before: str = ""


def build_image_cell(alt, url, image_url, css_class, width, height, fallback) -> str:
    """画像セルを生成する。4ページで重複していた get_image_cell() 等を統合したもの。

    読み込み失敗時の差し替え先を data-fallback 属性で渡す(インライン
    onerrorを持たないことがCSP導入(#9)の前提)。画像URLが空の場合も
    srcを空文字にせずフォールバック画像を直接指定する。src="" は
    現在のページ自身への画像リクエストとして解釈されてしまうため。

    width/height を属性で明示するのは、読み込み前に高さ0で計算されて
    レイアウトがずれる(CLS)のを防ぐため。urlが空ならリンクで包まず
    <img>のみを返す(saikyo_mensのXアカウントなし行などで使う)。
    """
    img = (
        f'<img alt="{esc(alt)}" class="{esc(css_class)}" loading="lazy" '
        f'width="{width}" height="{height}" '
        f'src="{esc(image_url or fallback)}" data-fallback="{esc(fallback)}" />'
    )
    if url:
        return f'<a href="{esc(url)}" target="_blank">{img}</a>'
    return img


HEAD_TEMPLATE = """<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>{title}</title>
<meta name="description" content="{description}">
{canonical}<meta property="og:type" content="website">
<meta property="og:site_name" content="ryoei.pro">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{og_url}">
<meta property="og:image" content="{og_image}">
<meta property="og:image:width" content="{og_image_width}">
<meta property="og:image:height" content="{og_image_height}">
<meta property="og:image:alt" content="{og_image_alt}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{asset_prefix}favicon.ico">
<!-- Stylesheets -->
<link href="{asset_prefix}assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" media="screen" href="{asset_prefix}style.css">
<!-- JavaScripts -->
<script defer src="{asset_prefix}assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
{extra_head}<!-- Cloudflare Web Analytics -->
<script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{{"token": "573520ec707f4a59b7b5cb06ef67cad8"}}'></script>
</head>
"""

# キーボード利用者が固定ナビの手前で本文へ飛べるスキップリンク(#182)。
# Bootstrap 5.3組み込みのvisually-hidden-focusableを使うため追加CSSは
# 不要(index.html以外はbootstrap.min.cssを読む)。navbar.jsの<script>より
# 前に置くことで、Tab最初の1回で先に到達できるようにする。
SKIP_LINK = '<a class="visually-hidden-focusable" href="#main">本文へスキップ</a>\n'

# 表を持つページ(型A/A')用。HEAD_TEMPLATEに<body>以降を続ける。
# {body_attrs} は #searchBoxes を持たないページにだけ ' data-search="off"' が
# 入る(#163)。持つページでは空文字なので <body> のまま変わらない。
PAGE_TEMPLATE = HEAD_TEMPLATE + """<body{body_attrs}>
{skip_link}<!-- Bootstrap Navigation Bar -->
<script src="{asset_prefix}navbar.js"></script>

<main id="main" tabindex="-1">
<h1 class="visually-hidden">{h1}</h1>{content_before}
{search_boxes}
<p id="result_count" class="visually-hidden" role="status" aria-live="polite"></p>

<table id="{table_id}" class="{table_class}"{table_data_attrs}>
\t<caption class="visually-hidden">{caption}</caption>
\t<thead>
\t\t<tr>{header_cells}</tr>
\t</thead>
\t<tbody>
{rows}
\t</tbody>
</table>
{pager}{lead}</main>
</body>
</html>
"""

# 表を持たないページ(型D等)用。本文は呼び出し側が丸ごと組み立てて渡す。
# {body_attrs} はPAGE_TEMPLATEと同じ(#163)。
# {main_open}/{main_close} は wrap_main(render_content()参照)で切り替える。
# body_html側が既に独自の<main>を持つページ(video_wayhome/wayhome、#102/#162)は
# 二重<main>を避けるためwrap_main=Falseで空文字になる。
CONTENT_TEMPLATE = HEAD_TEMPLATE + """<body{body_attrs}>
{skip_link}<!-- Bootstrap Navigation Bar -->
<script src="{asset_prefix}navbar.js"></script>

{main_open}{body_html}{lead}
{main_close}</body>
</html>
"""

PAGER_TEMPLATE = """
<nav class="mj-pager" aria-label="ページ送り">
\t<button type="button" id="pager_prev" class="mj-pager-button">前へ</button>
\t<span id="pager_status" class="mj-pager-status"></span>
\t<button type="button" id="pager_next" class="mj-pager-button">次へ</button>
</nav>
"""

# ページ末尾(表・ページ送りの下)に置く説明文の段落(#158)。meta description
# と同じ文を本文にも出す。繰り返し訪れる人の視界に入れないため、冒頭では
# なく末尾に置く(#searchBoxesの手前には置かない)。
LEAD_TEMPLATE = '\n<p class="mj-lead">{description}</p>\n'


def _render_lead(description: str) -> str:
    return LEAD_TEMPLATE.format(description=esc(description))


def _render_canonical(canonical: str | None) -> str:
    """<link rel="canonical"> の行。Noneなら出力しない(#113、既定)。"""
    if not canonical:
        return ""
    return f'<link rel="canonical" href="{esc(canonical)}">\n'


def _head_kwargs(meta: PageMeta, asset_prefix: str) -> dict:
    """HEAD_TEMPLATEの.format()に渡す、meta由来のkwargsをrender()/render_content()で共有する。"""
    return {
        "og_image": esc(meta.og_image),
        "og_image_width": meta.og_image_width,
        "og_image_height": meta.og_image_height,
        "og_image_alt": esc(meta.og_image_alt),
        "canonical": _render_canonical(meta.canonical),
        "asset_prefix": asset_prefix,
    }


def _render_search_boxes(table_config: TableConfig) -> str:
    """#searchBoxes 全体(divごと)を組み立てる。

    show_filter が False でも、ページ固有UI(search_boxes_before/after)が
    あれば div は出す。何もなければ空文字を返し、テンプレート側は
    プレースホルダの前後の改行だけが残る(h1の直後に1行の空行を挟んで
    <p id="result_count">に続く。#searchBoxesを持たないページ(rh_results)
    で使う)。"""
    default_input = ""
    if table_config.show_filter:
        default_input = (
            f'\t<div class="mj-filter"><label class="visually-hidden" for="info_filter">'
            f'{esc(table_config.filter_label)}</label><input type="text" id="info_filter" '
            f'class="mj-filter-input" placeholder="{esc(table_config.filter_placeholder)}"></div>'
        )
    parts = [p for p in [table_config.search_boxes_before, default_input, table_config.search_boxes_after] if p]
    if not parts:
        return ""
    inner = "\n".join(parts)
    return f'\n<div id="searchBoxes" class="collapse">\n{inner}\n</div>\n'


def _render_body_attrs(has_search_boxes: bool) -> str:
    """<body> に差し込む属性文字列(#163)。

    navbar.js は虫眼鏡アイコン(#searchBoxes を開閉するリンク)を
    document.write で描画する。その時点ではページ本体がまだパースされて
    おらず #searchBoxes の有無を見られないため、ページ側が <body> の
    data属性で先に伝える。<body>タグはnavbar.jsの<script>より前に
    パースされているので、描画のその瞬間に読める。

    目印は「検索欄が無い」側にだけ付ける。属性が無ければ従来どおり
    アイコンを出す、が既定。逆向き(あるページに"on"を付ける)にすると、
    手書きHTMLで付け忘れたときにアイコンが消えてしまうため、
    付け忘れが現状維持に倒れる向きを選んでいる。
    """
    return "" if has_search_boxes else ' data-search="off"'


def render(
    meta: PageMeta, table_config: TableConfig, rows_html: str,
    content_before: str | None = None, count: int | None = None,
    asset_prefix: str = "",
) -> str:
    """組み立て済みの行HTMLから、ページ全体のHTMLを生成する。

    table.js を共有JSとして使う。設定は table 要素の data 属性で渡す方式
    (#7)。table.js は `.mj-table` 要素を探して自分の設定を読み取るため、
    ページごとに違うのは table_id とこの属性だけでよい。ページ固有のUIを
    持つページ(resource_logsなど)は、table.js に加えて専用の小さなJSを
    extra_script で追加する。

    content_before は省略(None)なら table_config.content_before を使う。
    取得済みのスプレッドシート行に依存する内容(video_wayhomeのヒーロー等)は
    generate() の build_content_before 経由でここに渡される(#102)。

    count は meta.description 内の {count} を置換する実データの件数
    (#158)。meta description・og:description・ページ末尾のlead文の
    3か所すべてに同じ値が入る。
    """
    if content_before is None:
        content_before = table_config.content_before
    description = apply_count(meta.description, count)
    table_class = "mj-table"
    if table_config.extra_table_class:
        table_class += f" {table_config.extra_table_class}"

    header_cells = "".join(f'<th scope="col">{esc(h)}</th>' for h in table_config.headers)

    data_attrs = []
    if table_config.page_size is not None:
        data_attrs.append(f'data-page-size="{table_config.page_size}"')
    if table_config.name_mode == "exact":
        data_attrs.append('data-name-mode="exact"')
    if table_config.show_filter:
        data_attrs.append(f'data-filter-param="{esc(table_config.filter_param)}"')
    table_data_attrs = "".join(f" {a}" for a in data_attrs)

    pager = PAGER_TEMPLATE if table_config.page_size is not None else "\n"

    # show_filter ではなく _render_search_boxes() の戻り値で判定する(#163)。
    # show_filter が False でも search_boxes_before/after があれば
    # #searchBoxes は出力されるため、show_filter を見ると判定を誤る。
    search_boxes = _render_search_boxes(table_config)

    # table.js は`.mj-table`を探して動くページ専用の共有JS。表を持たない
    # ページ(render_content()側)は読み込まない。
    extra_head = f'<script defer src="{asset_prefix}table.js"></script>\n{table_config.extra_script}'

    return PAGE_TEMPLATE.format(
        title=esc(meta.title),
        description=esc(description),
        og_url=esc(meta.og_url),
        **_head_kwargs(meta, asset_prefix),
        extra_head=extra_head,
        h1=esc(meta.h1),
        content_before=content_before,
        caption=esc(meta.caption),
        table_id=esc(table_config.table_id),
        table_class=table_class,
        table_data_attrs=table_data_attrs,
        header_cells=header_cells,
        search_boxes=search_boxes,
        body_attrs=_render_body_attrs(bool(search_boxes)),
        rows=rows_html,
        pager=pager,
        lead=_render_lead(description),
        skip_link=SKIP_LINK,
    )


def render_content(
    meta: PageMeta, body_html: str, extra_head: str = "", count: int | None = None,
    has_search_boxes: bool = True, asset_prefix: str = "", wrap_main: bool = False,
) -> str:
    """表を持たないページ(型D等)のHTML全体を組み立てる。

    render()と違いtable.jsは読み込まない(.mj-tableを探すページ専用の
    共有JSのため)。本文(body_html)は呼び出し側が丸ごと組み立てて渡す。
    見出し(h1)の扱いもページごとに異なりうるため(resource_efficiencyは
    可視のh1、型A/A'はvisually-hiddenのh1)、ここでは固定しない。

    count は meta.description 内の {count} を置換する実データの件数
    (#158)。render()と同じ仕組み。

    has_search_boxes は本文(body_html)に #searchBoxes を含むかどうか(#163)。
    render()と違い表の設定(TableConfig)が渡らないため、呼び出し側が明示する。
    既定は「検索欄あり」= <body>に属性を出さない側にしてある(付け忘れが
    現状維持に倒れる向き)。現在の利用ページでは houou_leagues /
    ouka_leagues / video_wayhome が既定のまま、resource_efficiency だけが
    False を渡す。

    wrap_main は本文全体を <main id="main" tabindex="-1"> で包むかどうか(#182)。
    既定はFalse。body_html側が既に独自の<main>を持つページ(video_wayhome/
    wayhome、#102/#162)はFalseのまま(呼び出し側でid="main"・tabindex="-1"を
    その<main>に直接付ける)。持たないページ(houou_leagues/ouka_leagues/
    resource_efficiency)はTrueを渡す。

    asset_prefix はサブディレクトリのページ(#162のwayhome個別ページ等)向けの
    接頭辞。既定は空文字でルート直下のページの出力は変わらない。og:image・
    canonicalはmetaから読む(PageMetaのフィールド)。
    """
    description = apply_count(meta.description, count)
    main_open = '<main id="main" tabindex="-1">\n' if wrap_main else ""
    main_close = "</main>\n" if wrap_main else ""
    return CONTENT_TEMPLATE.format(
        title=esc(meta.title),
        description=esc(description),
        og_url=esc(meta.og_url),
        **_head_kwargs(meta, asset_prefix),
        extra_head=extra_head,
        main_open=main_open,
        body_html=body_html,
        main_close=main_close,
        body_attrs=_render_body_attrs(has_search_boxes),
        lead=_render_lead(description),
        skip_link=SKIP_LINK,
    )


def generate(
    spreadsheet_id, sheet_name, query, output_path, meta, table_config, build_row_html,
    formatted=False, build_content_before=None,
):
    """スプレッドシートの取得からHTML書き出しまでを行う共通の main() 相当。

    generate_*.py 側は設定(PageMeta/TableConfig)と build_row_html(row) だけを
    持てばよい。

    formatted は fetch_sheet() にそのまま渡す。表示の設定(TableConfig)では
    なくデータ取得の設定のため、generate() の引数にしている。数値列に
    シートの表示形式(桁区切り・固定小数点)をそのまま反映したいページ
    (rh_results 等)で True にする。既定は False(生の値を使う)。

    build_content_before(raw_rows) -> str を渡すと、取得済みの全行から
    ページ固有のHTMLブロック(video_wayhomeのヒーロー等、#102)を組み立てて
    render() の content_before に渡す。省略時は table_config.content_before
    (既定は空文字)がそのまま使われる。

    取得した行数(len(raw_rows))を render() の count に渡す(#158)。
    """
    print(f"「{sheet_name}」シートを取得中...")
    raw_rows = fetch_sheet(spreadsheet_id, sheet_name, query, formatted=formatted)
    print(f"{len(raw_rows)}件取得しました。HTML生成中...")

    rows_html = "\n".join(build_row_html(row) for row in raw_rows)
    content_before = build_content_before(raw_rows) if build_content_before else None
    output = render(meta, table_config, rows_html, content_before=content_before, count=len(raw_rows))

    output_path = pathlib.Path(output_path)
    output_path.write_text(output, encoding="utf-8")
    print(f"{output_path} を更新しました。")
