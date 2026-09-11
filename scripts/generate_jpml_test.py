#!/usr/bin/env python3
"""jpml_test.html を Googleスプレッドシート「テスト」シートのデータから
静的HTMLとして再生成するスクリプト。lib/page.py の共通処理を使う(#7の
共通化で generate_jpml_pros.py 以外の型A・2列ページから括り出したもの)。

これまでブラウザ側(jpml_test.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。フィルター・ページ送りはページ側の共有JS(table.js)に委譲する。

使い方:
    python3 scripts/generate_jpml_test.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, TableConfig, build_image_cell, esc, generate  # noqa: E402

SPREADSHEET_ID = "1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ"
SHEET_NAME = "テスト"
QUERY = 'SELECT A,F,G,H,I WHERE J = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "jpml_test.html"

META = PageMeta(
    title="プロテスト | 日本プロ麻雀連盟 | ryoei.pro",
    description="日本プロ麻雀連盟のプロテストについて、関連記事・動画をまとめています。",
    og_url="https://ryoei.pro/jpml_test.html",
    h1="日本プロ麻雀連盟 プロテスト関連記事",
    caption="日本プロ麻雀連盟のプロテストに関する記事・動画一覧。",
)

# ?name= は概要の絞り込み欄の初期値(部分一致)として使う。jpml_titlesと違い
# data-nameの完全一致フィルターは持たない。
TABLE = TableConfig(
    table_id="test_table",
    headers=["動画・記事", "概要"],
    page_size=50,
    filter_param="name",
)


def get_info_cell(published_date, title, name) -> str:
    """概要列のセルを生成する。元のJS getFormattedTitle() と同じく、
    公開日 / タイトル / 名前 を <br> で連結する。空の項目は行ごと省く。"""
    return "<br>".join(esc(p) for p in [published_date, title, name] if p)


def build_row_html(row) -> str:
    name, title, url, image_url, published_date = row

    article_cell = build_image_cell(
        alt=title, url=url, image_url=image_url,
        css_class="rectangle", width=160, height=90, fallback="img/125_arr_hoso.png",
    )
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


if __name__ == "__main__":
    generate(SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html)
