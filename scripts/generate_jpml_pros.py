#!/usr/bin/env python3
"""jpml_pros.html を Googleスプレッドシート「プロ」シートのデータから
静的HTMLとして再生成するスクリプト。

これまでブラウザ側(jpml_pros.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。フィルター・ソートはページ側の軽量なJSに委譲する。

使い方:
    python3 scripts/generate_jpml_pros.py
"""
import html
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.sheets import fetch_sheet  # noqa: E402

SPREADSHEET_ID = "1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0"
SHEET_NAME = "プロ"
QUERY = (
    'SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,AA,AB '
    'WHERE Y = "Y" ORDER BY B ASC'
)

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "jpml_pros.html"

HEADERS = [
    "所属<br>出身地", "名前", "龍龍", "X", "note", "You<br>Tube",
    "鳳凰<br>出場", "鳳凰<br>43後", "鳳凰<br>最高",
    "桜花<br>出場", "桜花<br>21期", "桜花<br>最高",
    "最強<br>出場", "決勝<br>進出", "放送<br>対局",
]

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>プロ | 日本プロ麻雀連盟 | ryoei.pro</title>
<meta name="description" content="日本プロ麻雀連盟の麻雀プロ（1000人超）について、所属・出身地・龍龍・X・note・YouTube・公式戦成績（鳳凰戦・女流桜花等）をまとめています。">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ryoei.pro">
<meta property="og:title" content="プロ | 日本プロ麻雀連盟 | ryoei.pro">
<meta property="og:description" content="日本プロ麻雀連盟の麻雀プロ（1000人超）について、所属・出身地・龍龍・X・note・YouTube・公式戦成績（鳳凰戦・女流桜花等）をまとめています。">
<meta property="og:url" content="https://ryoei.pro/jpml_pros.html">
<meta name="twitter:card" content="summary">
<link rel="icon" href="favicon.ico">
<!-- Stylesheets -->
<link href="assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" media="screen" href="style.css">
<!-- JavaScripts -->
<script defer src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
<script defer src="jpml_pros.js"></script>
<!-- Cloudflare Web Analytics -->
<script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{{"token": "94ce55f4f1b7441e9b6e6c8201207512"}}'></script>
</head>
<body>
<!-- Bootstrap Navigation Bar -->
<script src="navbar.js"></script>

<h1 class="visually-hidden">日本プロ麻雀連盟 プロ雀士データベース</h1>

<div id="searchBoxes" class="collapse">
\t<div class="mj-filter"><label class="visually-hidden" for="place_filter">所属・出身地で検索</label><input type="text" id="place_filter" class="mj-filter-input" placeholder="所属/出身地"></div>
\t<div class="mj-filter"><label class="visually-hidden" for="name_filter">名前で検索</label><input type="text" id="name_filter" class="mj-filter-input" placeholder="名前/Name"></div>
\t<div class="mj-filter"><label class="visually-hidden" for="league_filter">鳳凰戦43期後期の所属リーグで検索</label><input type="text" id="league_filter" class="mj-filter-input" placeholder="鳳凰43後"></div>
\t<div class="mj-filter"><label class="visually-hidden" for="ouka_filter">女流桜花21期の所属リーグで検索</label><input type="text" id="ouka_filter" class="mj-filter-input" placeholder="桜花21期"></div>
</div>

<table id="pros_table">
\t<caption class="visually-hidden">日本プロ麻雀連盟所属のプロ雀士一覧。所属・出身地、SNS、タイトル戦の成績等。</caption>
\t<thead>
\t\t<tr>{header_cells}</tr>
\t</thead>
\t<tbody>
{rows}
\t</tbody>
</table>
</body>
</html>
"""


def get_sort_key(key) -> str:
    """元のJS getSortKey() の移植: 値を5桁ゼロ埋め文字列に変換し、
    文字列比較でも数値順になるようにする"""
    if key is None or key == "":
        return "00000"
    return str(key).rjust(5, "0")[-5:]


def esc(value) -> str:
    """HTMLエスケープ。Noneは空文字扱い"""
    if value is None:
        return ""
    return html.escape(str(value))



def get_external_link(url, img_url, alt_text, alt_img_url) -> str:
    """外部プロフィールへの画像リンクを生成する。

    読み込み失敗時の差し替え先は data-fallback 属性で渡し、
    jpml_pros.js 側でまとめて処理する。以前は img ごとに onerror 属性を
    書いていたが、同じ文字列が約1,900回繰り返されてHTMLの9%を占めていた。
    インラインハンドラを持たないことは、将来のCSP導入の前提にもなる。

    width/height を属性で明示するのは、読み込み前に高さ0で計算されて
    レイアウトがずれる(CLS)のを防ぐため。
    """
    return (
        f'<a href="{esc(url)}" target="_blank">'
        f'<img alt="{esc(alt_text)}" class="pros" loading="lazy" '
        f'width="48" height="48" '
        f'src="{esc(img_url)}" data-fallback="{esc(alt_img_url)}" />'
        f"</a>"
    )


def get_internal_link(base_url, param_name, param, value, unit) -> str:
    if param_name and param:
        return f'<a href="{esc(base_url)}?{param_name}={esc(param)}" target="_blank">{esc(value)}{esc(unit)}</a>'
    return f'<a href="{esc(base_url)}" target="_blank">{esc(value)}{esc(unit)}</a>'


def get_name(name, last_name_en, first_name_en) -> str:
    last_name_en = last_name_en or ""
    first_name_en = first_name_en or ""
    return f"{esc(name)}<br />{esc(last_name_en)} {esc(first_name_en)}"


def get_places(office, hometown) -> str:
    hometown = hometown or ""
    # 出身地が空のときは改行ごと省く(空行が出て行高が伸びるのを防ぐ)
    if not hometown:
        return esc(office)
    return f"{esc(office)}<br />{esc(hometown)}"


def get_ron2(name, ron2_id, ron2_image_url) -> str:
    return get_external_link(f"https://ron2.jp/pro/{ron2_id}", ron2_image_url, f"{name} 龍龍", "img/box-arrow-up-right.svg")


def get_x(name, x_id, x_image_url) -> str:
    return get_external_link(f"https://x.com/{x_id}", x_image_url, f"{name} X", "img/x.png")


def get_note(name, note_id, note_image_url) -> str:
    return get_external_link(f"https://note.com/{note_id}", note_image_url, f"{name} note", "img/note.svg")


def get_youtube(name, youtube_id, youtube_image_url) -> str:
    return get_external_link(f"https://youtube.com/channel/{youtube_id}", youtube_image_url, f"{name} YouTube", "img/youtube.svg")


def get_houou_seasons(name, houou_seasons):
    return get_internal_link("./houou_results.html", "name", name, houou_seasons, "回")


def get_houou_latest_league(houou_latest_league, houou_ampai_url):
    return get_internal_link(houou_ampai_url, None, None, houou_latest_league, "")


def get_houou_highest_league(name, houou_highest_league):
    return get_internal_link("./houou_leagues.html", "name", name, houou_highest_league, "")


def get_ouka_seasons(name, ouka_seasons):
    return get_internal_link("./ouka_results.html", "name", name, ouka_seasons, "回")


def get_ouka_latest_league(ouka_latest_league, ouka_ampai_url):
    return get_internal_link(ouka_ampai_url, None, None, ouka_latest_league, "")


def get_ouka_highest_league(name, ouka_highest_league):
    return get_internal_link("./ouka_leagues.html", "name", name, ouka_highest_league, "")


def get_saikyo_games(name, saikyo_games):
    return get_internal_link("./saikyo_results.html", "tag", name, saikyo_games, "回")


def get_finals(name, number_of_finals):
    return get_internal_link("./jpml_titles.html", "name", name, number_of_finals, "回")


def get_lives(name, number_of_lives):
    return get_internal_link("./video_live.html", "name", name, number_of_lives, "件")


def build_row_html(row) -> str:
    (
        name, sort_key, last_name_en, first_name_en, office, hometown,
        ron2_id, ron2_image_url, x_id, x_image_url, note_id, note_image_url,
        youtube_id, youtube_image_url,
        houou_seasons, houou_latest_league, houou_highest_league,
        ouka_seasons, ouka_latest_league, ouka_highest_league,
        saikyo_games, number_of_finals, number_of_lives,
        _unused_x_col,
        houou_ampai_url, ouka_ampai_url,
    ) = row

    houou_highest_sort = "00" if houou_highest_league == "鳳凰位" else houou_highest_league
    ouka_highest_sort = "00" if ouka_highest_league == "桜花" else ouka_highest_league

    cells = [
        (get_places(office, hometown), None),
        (get_name(name, last_name_en, first_name_en), sort_key),
        (get_ron2(name, ron2_id, ron2_image_url) if ron2_id else "", None),
        (get_x(name, x_id, x_image_url) if x_id else "", None),
        (get_note(name, note_id, note_image_url) if note_id else "", None),
        (get_youtube(name, youtube_id, youtube_image_url) if youtube_id else "", None),
        (get_houou_seasons(name, houou_seasons) if houou_seasons else "",
         get_sort_key(houou_seasons) if houou_seasons else None),
        (get_houou_latest_league(houou_latest_league, houou_ampai_url) if houou_latest_league else "",
         get_sort_key(houou_latest_league) if houou_latest_league else None),
        (get_houou_highest_league(name, houou_highest_league) if houou_highest_league else "",
         get_sort_key(houou_highest_sort) if houou_highest_league else None),
        (get_ouka_seasons(name, ouka_seasons) if ouka_seasons else "",
         get_sort_key(ouka_seasons) if ouka_seasons else None),
        (get_ouka_latest_league(ouka_latest_league, ouka_ampai_url) if ouka_latest_league else "",
         get_sort_key(ouka_latest_league) if ouka_latest_league else None),
        (get_ouka_highest_league(name, ouka_highest_league) if ouka_highest_league else "",
         get_sort_key(ouka_highest_sort) if ouka_highest_league else None),
        (get_saikyo_games(name, saikyo_games) if saikyo_games else "",
         get_sort_key(saikyo_games) if saikyo_games else None),
        (get_finals(name, number_of_finals) if number_of_finals else "",
         get_sort_key(number_of_finals) if number_of_finals else None),
        (get_lives(name, number_of_lives) if number_of_lives else "",
         get_sort_key(number_of_lives) if number_of_lives else None),
    ]

    tds = []
    for content, sort_value in cells:
        sort_attr = f' data-sort="{esc(sort_value)}"' if sort_value is not None else ""
        tds.append(f"<td{sort_attr}>{content}</td>")

    # 表示用の get_places() は <br /> を含むため、そのままエスケープすると
    # data-place に "&lt;br /&gt;" が入り、「br」で検索すると全行がヒットする。
    # 検索用の文字列は生の値から別に組み立てる。
    place_value = esc(" ".join(filter(None, [office, hometown])))
    # 元のGoogle Charts版では、name列のセルHTMLに<span class="かな読み">を
    # 埋め込むことで、非表示のかな読みも検索対象になっていた。
    # data-name にも同様に読み(sort_key)を含めて、その挙動を復元する。
    name_value = esc(f"{name or ''} {sort_key or ''} {last_name_en or ''} {first_name_en or ''}")
    league_value = esc(houou_latest_league or "")
    ouka_value = esc(ouka_latest_league or "")

    return (
        f'<tr data-place="{place_value}" data-name="{name_value}" '
        f'data-league="{league_value}" data-ouka="{ouka_value}">'
        + "".join(tds)
        + "</tr>"
    )


def main():
    print(f"「{SHEET_NAME}」シートを取得中...")
    raw_rows = fetch_sheet(SPREADSHEET_ID, SHEET_NAME, QUERY)
    print(f"{len(raw_rows)}件取得しました。HTML生成中...")

    row_html = "\n".join(build_row_html(row) for row in raw_rows)
    header_cells = "".join(f'<th scope="col">{h}</th>' for h in HEADERS)

    output = PAGE_TEMPLATE.format(header_cells=header_cells, rows=row_html)
    OUTPUT_PATH.write_text(output, encoding="utf-8")
    print(f"{OUTPUT_PATH} を更新しました。")


if __name__ == "__main__":
    main()
