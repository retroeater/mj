#!/usr/bin/env python3
"""jpml_titles.html を Googleスプレッドシート「タイトル」シートのデータから
静的HTMLとして再生成するスクリプト。generate_jpml_pros.py と同じ方式。

これまでブラウザ側(jpml_titles.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。フィルター・ソート・ページ送りはページ側の軽量なJSに委譲する。

使い方:
    python3 scripts/generate_jpml_titles.py
"""
import html
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.sheets import fetch_sheet  # noqa: E402

SPREADSHEET_ID = "1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0"
SHEET_NAME = "タイトル"
QUERY = 'SELECT A,B,C,D,E,F WHERE G = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "jpml_titles.html"

HEADERS = ["写真", "概要"]

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>タイトル | 日本プロ麻雀連盟 | ryoei.pro</title>
<meta name="description" content="日本プロ麻雀連盟の麻雀プロが出場するタイトル戦について、歴代優勝者と決勝進出者をまとめています。選手名・タイトル戦名称などで検索できます。">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ryoei.pro">
<meta property="og:title" content="タイトル | 日本プロ麻雀連盟 | ryoei.pro">
<meta property="og:description" content="日本プロ麻雀連盟の麻雀プロが出場するタイトル戦について、歴代優勝者と決勝進出者をまとめています。選手名・タイトル戦名称などで検索できます。">
<meta property="og:url" content="https://ryoei.pro/jpml_titles.html">
<meta name="twitter:card" content="summary">
<link rel="icon" href="favicon.ico">
<!-- Stylesheets -->
<link href="assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" media="screen" href="style.css">
<!-- JavaScripts -->
<script defer src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
<script defer src="jpml_titles.js"></script>
<!-- Cloudflare Web Analytics -->
<script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{{"token": "573520ec707f4a59b7b5cb06ef67cad8"}}'></script>
</head>
<body>
<!-- Bootstrap Navigation Bar -->
<script src="navbar.js"></script>

<h1 class="visually-hidden">日本プロ麻雀連盟 タイトル戦一覧</h1>

<div id="searchBoxes" class="collapse">
\t<div class="mj-filter"><label class="visually-hidden" for="info_filter">概要で検索</label><input type="text" id="info_filter" class="mj-filter-input" placeholder="概要"></div>
</div>

<p id="result_count" class="visually-hidden" role="status" aria-live="polite"></p>

<table id="titles_table" class="mj-table mj-table-2col">
\t<caption class="visually-hidden">日本プロ麻雀連盟のタイトル戦、歴代優勝者と決勝進出者一覧。</caption>
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


def get_image_cell(name, profile_url, image_url) -> str:
    """写真列のセルを生成する。generate_jpml_pros.py の get_external_link() と
    同じ形で、読み込み失敗時の差し替え先を data-fallback 属性で渡す
    (インラインonerrorを持たないことがCSP導入(#9)の前提)。

    画像URLが空の行が多いため(タイトル戦データの性質上)、その場合は
    src を空文字にせずフォールバック画像を直接指定する。src="" は
    現在のページ自身への画像リクエストとして解釈されてしまうため。
    フォールバックは box-arrow-up-right.svg(jpml_prosのSNS列用の外部
    リンクアイコン)ではなく、汎用のプロフィールアイコン(img/avatar.svg)
    を使う。

    width/height を属性で明示するのは、読み込み前に高さ0で計算されて
    レイアウトがずれる(CLS)のを防ぐため。"""
    fallback = "img/avatar.svg"
    img = (
        f'<img alt="{esc(name)}" class="avatar" loading="lazy" '
        f'width="80" height="80" '
        f'src="{esc(image_url or fallback)}" data-fallback="{esc(fallback)}" />'
    )
    if profile_url:
        return f'<a href="{esc(profile_url)}" target="_blank">{img}</a>'
    return img


def get_info_cell(published_date, title, rank, name) -> str:
    """概要列のセルを生成する。元のJS getFormattedTitle() と同じく、
    日付 / タイトル / 名前 / 順位+"位" を <br> で連結する。
    空の項目は行ごと省く。"""
    parts = [published_date, title, name]
    if rank:
        parts.append(f"{rank}位")
    return "<br>".join(esc(p) for p in parts if p)


def build_row_html(row) -> str:
    name, profile_url, image_url, rank, title, published_date = row

    image_cell = get_image_cell(name, profile_url, image_url)
    info_cell = get_info_cell(published_date, title, rank, name)

    # 検索用文字列は <br> ではなく半角スペースで連結する。
    # jpml_pros の data-place で、表示用HTMLをそのままエスケープすると
    # "&lt;br&gt;" が入り「br」で全行がヒットしてしまった問題の再発を避ける。
    info_value = esc(
        " ".join(filter(None, [published_date, title, name, f"{rank}位" if rank else None]))
    )
    name_value = esc(name or "")

    # 概要セルへの data-sort は付けない。値が data-info(行のtr属性)と
    # 完全に同一で、そのまま出力すると全行分重複してHTMLが膨らむため。
    # ソート時は jpml_titles.js 側で data-info を代わりに使う。
    # data-sort の仕組み自体は残す(jpml_prosは表示文字列と異なる
    # ソートキー(ゼロ埋め数値等)を持つ列があり、型Aの他ページでも必要になる)。
    return (
        f'<tr data-name="{name_value}" data-info="{info_value}">'
        f"<td>{image_cell}</td>"
        f'<td class="mj-left">{info_cell}</td>'
        f"</tr>"
    )


def main():
    print(f"「{SHEET_NAME}」シートを取得中...")
    raw_rows = fetch_sheet(SPREADSHEET_ID, SHEET_NAME, QUERY)
    print(f"{len(raw_rows)}件取得しました。HTML生成中...")

    row_html = "\n".join(build_row_html(row) for row in raw_rows)

    # 列ヘッダによるソートはjpml_pros.html専用の機能とする方針のため、
    # 見出しはどちらも素の<th>にする(button化・aria-sortは付けない)。
    header_cells = "".join(f'<th scope="col">{h}</th>' for h in HEADERS)

    output = PAGE_TEMPLATE.format(header_cells=header_cells, rows=row_html)
    OUTPUT_PATH.write_text(output, encoding="utf-8")
    print(f"{OUTPUT_PATH} を更新しました。")


if __name__ == "__main__":
    main()
