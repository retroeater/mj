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


@dataclasses.dataclass
class PageMeta:
    """head の内容と、本文冒頭の見出し・キャプション。"""

    title: str  # <title>と og:title 共通
    description: str  # meta descriptionと og:description 共通
    og_url: str  # 例: "https://ryoei.pro/jpml_titles.html"
    h1: str  # visually-hidden の h1
    caption: str  # tableの visually-hidden caption


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
    # #158(冒頭に説明文の段落を置く)のlead文は、このスロットの手前に
    # PageMeta側で足す想定(h1 → lead文 → content_before → #searchBoxes の順)。
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
<meta property="og:type" content="website">
<meta property="og:site_name" content="ryoei.pro">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{og_url}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="favicon.ico">
<!-- Stylesheets -->
<link href="assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" media="screen" href="style.css">
<!-- JavaScripts -->
<script defer src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
{extra_head}<!-- Cloudflare Web Analytics -->
<script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{{"token": "573520ec707f4a59b7b5cb06ef67cad8"}}'></script>
</head>
"""

# 表を持つページ(型A/A')用。HEAD_TEMPLATEに<body>以降を続ける。
PAGE_TEMPLATE = HEAD_TEMPLATE + """<body>
<!-- Bootstrap Navigation Bar -->
<script src="navbar.js"></script>

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
{pager}</body>
</html>
"""

# 表を持たないページ(型D等)用。本文は呼び出し側が丸ごと組み立てて渡す。
CONTENT_TEMPLATE = HEAD_TEMPLATE + """<body>
<!-- Bootstrap Navigation Bar -->
<script src="navbar.js"></script>

{body_html}
</body>
</html>
"""

PAGER_TEMPLATE = """
<nav class="mj-pager" aria-label="ページ送り">
\t<button type="button" id="pager_prev" class="mj-pager-button">前へ</button>
\t<span id="pager_status" class="mj-pager-status"></span>
\t<button type="button" id="pager_next" class="mj-pager-button">次へ</button>
</nav>
"""


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


def render(meta: PageMeta, table_config: TableConfig, rows_html: str, content_before: str | None = None) -> str:
    """組み立て済みの行HTMLから、ページ全体のHTMLを生成する。

    table.js を共有JSとして使う。設定は table 要素の data 属性で渡す方式
    (#7)。table.js は `.mj-table` 要素を探して自分の設定を読み取るため、
    ページごとに違うのは table_id とこの属性だけでよい。ページ固有のUIを
    持つページ(resource_logsなど)は、table.js に加えて専用の小さなJSを
    extra_script で追加する。

    content_before は省略(None)なら table_config.content_before を使う。
    取得済みのスプレッドシート行に依存する内容(video_wayhomeのヒーロー等)は
    generate() の build_content_before 経由でここに渡される(#102)。
    """
    if content_before is None:
        content_before = table_config.content_before
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

    # table.js は`.mj-table`を探して動くページ専用の共有JS。表を持たない
    # ページ(render_content()側)は読み込まない。
    extra_head = f'<script defer src="table.js"></script>\n{table_config.extra_script}'

    return PAGE_TEMPLATE.format(
        title=esc(meta.title),
        description=esc(meta.description),
        og_url=esc(meta.og_url),
        extra_head=extra_head,
        h1=esc(meta.h1),
        content_before=content_before,
        caption=esc(meta.caption),
        table_id=esc(table_config.table_id),
        table_class=table_class,
        table_data_attrs=table_data_attrs,
        header_cells=header_cells,
        search_boxes=_render_search_boxes(table_config),
        rows=rows_html,
        pager=pager,
    )


def render_content(meta: PageMeta, body_html: str, extra_head: str = "") -> str:
    """表を持たないページ(型D等)のHTML全体を組み立てる。

    render()と違いtable.jsは読み込まない(.mj-tableを探すページ専用の
    共有JSのため)。本文(body_html)は呼び出し側が丸ごと組み立てて渡す。
    見出し(h1)の扱いもページごとに異なりうるため(resource_efficiencyは
    可視のh1、型A/A'はvisually-hiddenのh1)、ここでは固定しない。
    """
    return CONTENT_TEMPLATE.format(
        title=esc(meta.title),
        description=esc(meta.description),
        og_url=esc(meta.og_url),
        extra_head=extra_head,
        body_html=body_html,
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
    """
    print(f"「{sheet_name}」シートを取得中...")
    raw_rows = fetch_sheet(spreadsheet_id, sheet_name, query, formatted=formatted)
    print(f"{len(raw_rows)}件取得しました。HTML生成中...")

    rows_html = "\n".join(build_row_html(row) for row in raw_rows)
    content_before = build_content_before(raw_rows) if build_content_before else None
    output = render(meta, table_config, rows_html, content_before=content_before)

    output_path = pathlib.Path(output_path)
    output_path.write_text(output, encoding="utf-8")
    print(f"{output_path} を更新しました。")
