#!/usr/bin/env python3
"""jpml_test.html を Googleスプレッドシート「テスト」シートのデータから
静的HTMLとして再生成するスクリプト。generate_jpml_titles.py と同じ方式。

これまでブラウザ側(jpml_test.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。フィルター・ページ送りはページ側の軽量なJSに委譲する。

使い方:
    python3 scripts/generate_jpml_test.py
"""
import html
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.sheets import fetch_sheet  # noqa: E402

SPREADSHEET_ID = "1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ"
SHEET_NAME = "テスト"
QUERY = 'SELECT A,F,G,H,I WHERE J = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "jpml_test.html"

HEADERS = ["記事", "概要"]

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>プロテスト | 日本プロ麻雀連盟 | ryoei.pro</title>
<meta name="description" content="日本プロ麻雀連盟のプロテストについて、関連記事・動画をまとめています。">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ryoei.pro">
<meta property="og:title" content="プロテスト | 日本プロ麻雀連盟 | ryoei.pro">
<meta property="og:description" content="日本プロ麻雀連盟のプロテストについて、関連記事・動画をまとめています。">
<meta property="og:url" content="https://ryoei.pro/jpml_test.html">
<meta name="twitter:card" content="summary">
<link rel="icon" href="favicon.ico">
<!-- Stylesheets -->
<link href="assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" media="screen" href="style.css">
<!-- JavaScripts -->
<script defer src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
<script defer src="jpml_test.js"></script>
<!-- Cloudflare Web Analytics -->
<script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{{"token": "573520ec707f4a59b7b5cb06ef67cad8"}}'></script>
</head>
<body>
<!-- Bootstrap Navigation Bar -->
<script src="navbar.js"></script>

<h1 class="visually-hidden">日本プロ麻雀連盟 プロテスト関連記事</h1>

<div id="searchBoxes" class="collapse">
\t<div class="mj-filter"><label class="visually-hidden" for="info_filter">概要で検索</label><input type="text" id="info_filter" class="mj-filter-input" placeholder="概要"></div>
</div>

<p id="result_count" class="visually-hidden" role="status" aria-live="polite"></p>

<table id="test_table" class="mj-table mj-table-2col">
\t<caption class="visually-hidden">日本プロ麻雀連盟のプロテストに関する記事・動画一覧。</caption>
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


def get_article_cell(title, url, image_url) -> str:
    """記事列のセルを生成する。generate_jpml_titles.py の get_image_cell() と
    同じ形で、読み込み失敗時の差し替え先を data-fallback 属性で渡す
    (インラインonerrorを持たないことがCSP導入(#9)の前提)。

    記事のサムネイル(16:9)のため、jpml_titlesのavatar(80×80正方形)とは
    異なり rectangle(160×90)を使う。画像URLが空の行も、srcを空文字に
    せずフォールバックを直接指定する。src="" は現在のページ自身への
    画像リクエストとして解釈されてしまうため。

    width/height を属性で明示するのは、読み込み前に高さ0で計算されて
    レイアウトがずれる(CLS)のを防ぐため。"""
    fallback = "img/125_arr_hoso.png"
    img = (
        f'<img alt="{esc(title)}" class="rectangle" loading="lazy" '
        f'width="160" height="90" '
        f'src="{esc(image_url or fallback)}" data-fallback="{esc(fallback)}" />'
    )
    if url:
        return f'<a href="{esc(url)}" target="_blank">{img}</a>'
    return img


def get_info_cell(published_date, title, name) -> str:
    """概要列のセルを生成する。元のJS getFormattedTitle() と同じく、
    公開日 / タイトル / 名前 を <br> で連結する。空の項目は行ごと省く。"""
    return "<br>".join(esc(p) for p in [published_date, title, name] if p)


def build_row_html(row) -> str:
    name, title, url, image_url, published_date = row

    article_cell = get_article_cell(title, url, image_url)
    info_cell = get_info_cell(published_date, title, name)

    # 検索用文字列は <br> ではなく半角スペースで連結する。
    # jpml_titlesのdata-infoと同じく、表示用HTMLをそのままエスケープすると
    # "&lt;br&gt;" が入り「br」で全行がヒットしてしまう問題を避けるため。
    info_value = esc(" ".join(filter(None, [published_date, title, name])))

    # jpml_titlesと違い ?name= を完全一致に使わないため、data-name は不要。
    return (
        f'<tr data-info="{info_value}">'
        f"<td>{article_cell}</td>"
        f'<td class="mj-left">{info_cell}</td>'
        f"</tr>"
    )


def main():
    print(f"「{SHEET_NAME}」シートを取得中...")
    raw_rows = fetch_sheet(SPREADSHEET_ID, SHEET_NAME, QUERY)
    print(f"{len(raw_rows)}件取得しました。HTML生成中...")

    row_html = "\n".join(build_row_html(row) for row in raw_rows)

    # 列ヘッダによるソートはjpml_pros.html専用の機能とする方針のため、
    # 見出しはどちらも素の<th>にする。
    header_cells = "".join(f'<th scope="col">{h}</th>' for h in HEADERS)

    output = PAGE_TEMPLATE.format(header_cells=header_cells, rows=row_html)
    OUTPUT_PATH.write_text(output, encoding="utf-8")
    print(f"{OUTPUT_PATH} を更新しました。")


if __name__ == "__main__":
    main()
