#!/usr/bin/env python3
"""resource_logs.html を Googleスプレッドシート「ログ」シートのデータから
静的HTMLとして再生成するスクリプト。generate_jpml_titles.py と同じ方式。

これまでブラウザ側(resource_logs.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。フィルター・ページ送りはページ側の軽量なJSに委譲する。

使い方:
    python3 scripts/generate_resource_logs.py
"""
import html
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.sheets import fetch_sheet  # noqa: E402

SPREADSHEET_ID = "1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ"
SHEET_NAME = "ログ"
QUERY = 'SELECT A,B,C,D,E,F,G,H,I,J WHERE K = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "resource_logs.html"

HEADERS = ["写真", "概要"]

# 名前のセレクトボックスとタグリンクは、スプレッドシートではなく
# 現行の resource_logs.html に直書きされていた値。データ由来ではないため
# ここに定数として持たせる。
NAME_OPTIONS = ["石立岳大", "谷岡育夫", "平野良栄"]
TAGS = [
    "うどん", "鰻", "牡蠣", "かき氷", "カレー", "スイーツ", "寿司", "蕎麦",
    "天ぷら", "とんかつ", "バーガー", "パスタ", "ハンバーグ", "モーニング",
    "焼肉", "ラーメン",
]

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>ログ | リソース | ryoei.pro</title>
<meta name="description" content="日本プロ麻雀連盟の麻雀プロが訪れた飲食店を、Xポストに基づいてまとめています。選手名・店名・メニュー名・最寄駅名などで検索できます。">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ryoei.pro">
<meta property="og:title" content="ログ | リソース | ryoei.pro">
<meta property="og:description" content="日本プロ麻雀連盟の麻雀プロが訪れた飲食店を、Xポストに基づいてまとめています。選手名・店名・メニュー名・最寄駅名などで検索できます。">
<meta property="og:url" content="https://ryoei.pro/resource_logs.html">
<meta name="twitter:card" content="summary">
<link rel="icon" href="favicon.ico">
<!-- Stylesheets -->
<link href="assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" media="screen" href="style.css">
<!-- JavaScripts -->
<script defer src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
<script defer src="resource_logs.js"></script>
<!-- Cloudflare Web Analytics -->
<script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{{"token": "573520ec707f4a59b7b5cb06ef67cad8"}}'></script>
</head>
<body>
<!-- Bootstrap Navigation Bar -->
<script src="navbar.js"></script>

<h1 class="visually-hidden">日本プロ麻雀連盟 麻雀プロが訪れた飲食店ログ</h1>

<div id="searchBoxes" class="collapse">
\t<label class="visually-hidden" for="name_select">名前で絞り込む</label>
\t<select id="name_select">
{name_options}
\t</select>
\t<div class="mj-filter"><label class="visually-hidden" for="info_filter">概要で検索</label><input type="text" id="info_filter" class="mj-filter-input" placeholder="概要"></div>
{tag_links}
</div>

<p id="result_count" class="visually-hidden" role="status" aria-live="polite"></p>

<table id="logs_table" class="mj-table">
\t<caption class="visually-hidden">日本プロ麻雀連盟の麻雀プロが訪れた飲食店の一覧。Xポストに基づく。</caption>
\t<thead>
\t\t<tr>{header_cells}</tr>
\t</thead>
\t<tbody>
{rows}
\t</tbody>
</table>

<nav class="mj-pager" aria-label="ページ送り">
\t<button type="button" id="pager_prev" class="mj-pager-button">前へ</button>
\t<span id="pager_status" class="mj-pager-status"></span>
\t<button type="button" id="pager_next" class="mj-pager-button">次へ</button>
</nav>
</body>
</html>
"""


def esc(value) -> str:
    """HTMLエスケープ。Noneは空文字扱い"""
    if value is None:
        return ""
    return html.escape(str(value))


def get_photo_cell(name, x_url, x_image_url) -> str:
    """写真列のセルを生成する。generate_jpml_test.py の get_article_cell() と
    同じ形で、読み込み失敗時の差し替え先を data-fallback 属性で渡す
    (インラインonerrorを持たないことがCSP導入(#9)の前提)。

    画像URLが空の行も、srcを空文字にせずフォールバックを直接指定する。
    src="" は現在のページ自身への画像リクエストとして解釈されてしまうため。

    width/height を属性で明示するのは、読み込み前に高さ0で計算されて
    レイアウトがずれる(CLS)のを防ぐため。"""
    fallback = "img/125_arr_hoso.png"
    img = (
        f'<img alt="{esc(name)}" class="rectangle" loading="lazy" '
        f'width="160" height="90" '
        f'src="{esc(x_image_url or fallback)}" data-fallback="{esc(fallback)}" />'
    )
    if x_url:
        return f'<a href="{esc(x_url)}" target="_blank">{img}</a>'
    return img


def get_info_cell(date, menu, restaurant_name, restaurant_url, tags) -> str:
    """概要列のセルを生成する。元のJS getFormattedTitle() と同じく、
    日付 / メニュー / 店名 / タグ を <br> で連結する。店URLがあるときは
    店名をリンクにする。空の項目は行ごと省く。

    店名リンクのインラインstyle(text-decoration: none)は#9のCSPで
    弾かれるため、style.cssの.mj-plainクラスに置き換える。"""
    if restaurant_name and restaurant_url:
        restaurant_html = f'<a href="{esc(restaurant_url)}" target="_blank" class="mj-plain">{esc(restaurant_name)}</a>'
    else:
        restaurant_html = esc(restaurant_name)

    parts = [esc(date) if date else "", esc(menu) if menu else "", restaurant_html, esc(tags) if tags else ""]
    return "<br>".join(p for p in parts if p)


def build_row_html(row) -> str:
    (
        name, x_url, x_image_url, date, restaurant_name, menu,
        station, category, tags, restaurant_url,
    ) = row

    photo_cell = get_photo_cell(restaurant_name, x_url, x_image_url)
    info_cell = get_info_cell(date, menu, restaurant_name, restaurant_url, tags)

    # 検索用文字列は <br> ではなく半角スペースで連結する。
    # jpml_titlesのdata-infoと同じく、表示用HTMLをそのままエスケープすると
    # "&lt;br&gt;" が入り「br」で全行がヒットしてしまう問題を避けるため。
    # 駅(station)とカテゴリ(category)は表示には出さないが、meta descriptionの
    # 「最寄駅名などで検索できます」との整合のため検索対象には含める。
    info_value = esc(
        " ".join(filter(None, [date, menu, restaurant_name, tags, station, category]))
    )
    name_value = esc(name or "")

    return (
        f'<tr data-name="{name_value}" data-info="{info_value}">'
        f"<td>{photo_cell}</td>"
        f'<td class="mj-left">{info_cell}</td>'
        f"</tr>"
    )


def build_search_boxes():
    name_options = "\n".join(
        f'\t\t<option value="resource_logs.html?name={esc(name)}">{esc(name)}</option>'
        for name in NAME_OPTIONS
    )
    name_options = '\t\t<option value="">名前を選択</option>\n' + name_options

    tag_links = "\n".join(
        f'\t<a href="resource_logs.html?tag={esc(tag)}">#{esc(tag)}</a>&nbsp;'
        for tag in TAGS
    )
    return name_options, tag_links


def main():
    print(f"「{SHEET_NAME}」シートを取得中...")
    raw_rows = fetch_sheet(SPREADSHEET_ID, SHEET_NAME, QUERY)
    print(f"{len(raw_rows)}件取得しました。HTML生成中...")

    row_html = "\n".join(build_row_html(row) for row in raw_rows)

    # 列ヘッダによるソートはjpml_pros.html専用の機能とする方針のため、
    # 見出しはどちらも素の<th>にする。
    header_cells = "".join(f'<th scope="col">{h}</th>' for h in HEADERS)

    name_options, tag_links = build_search_boxes()

    output = PAGE_TEMPLATE.format(
        header_cells=header_cells,
        rows=row_html,
        name_options=name_options,
        tag_links=tag_links,
    )
    OUTPUT_PATH.write_text(output, encoding="utf-8")
    print(f"{OUTPUT_PATH} を更新しました。")


if __name__ == "__main__":
    main()
