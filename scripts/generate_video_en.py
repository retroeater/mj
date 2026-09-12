#!/usr/bin/env python3
"""video_en.html を Googleスプレッドシート「英語」シートのデータから
静的HTMLとして再生成するスクリプト。lib/page.py の共通処理を使う(#7)。

これまでブラウザ側(video_en.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。フィルター・ページ送りはページ側の共有JS(table.js)に委譲する。

使い方:
    python3 scripts/generate_video_en.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, TableConfig, build_image_cell, esc, generate  # noqa: E402

SPREADSHEET_ID = "1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ"
SHEET_NAME = "英語"
# 元のGoogle Charts版はB(出典URL)・D(出典画像URL)・E(原題)も取得していたが
# セル組み立てで実際に使うのはA・B(出典名)・F・G・H・Iのみ(原題・出典URL・
# 出典画像URLは表示に使われていなかった)。jpml_test.pyの前例に倣い、
# 使わない列は外して取得する。
QUERY = 'SELECT A,B,F,G,H,I WHERE J = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "video_en.html"

META = PageMeta(
    title="English | 動画 | ryoei.pro",
    description="日本プロ麻雀連盟の麻雀プロが出演する英語動画{count}本についてまとめています。",
    og_url="https://ryoei.pro/video_en.html",
    h1="日本プロ麻雀連盟 English動画",
    caption="日本プロ麻雀連盟の麻雀プロが出演する英語動画の一覧。",
)

# ?name= は概要(Info)の絞り込み欄の初期値(部分一致)として使う。
# 旧Google Charts版の pageSize:100 を踏襲する。
TABLE = TableConfig(
    table_id="en_table",
    headers=["Video", "Info"],
    page_size=100,
    filter_param="name",
    filter_label="Infoで検索",
    filter_placeholder="Info",
)


def get_info_cell(name, channel_name, title, published_date) -> str:
    """概要列のセルを生成する。元のJS getFormattedTitle() と同じく、
    公開日 / タイトル / 出典 / 出演者名 を <br> で連結する。"""
    return "<br>".join([esc(published_date), esc(title), esc(channel_name), esc(name)])


def build_row_html(row) -> str:
    name, channel_name, title, url, image_url, published_date = row

    video_cell = build_image_cell(
        alt=title, url=url, image_url=image_url,
        css_class="rectangle", width=160, height=90, fallback="img/125_arr_hoso.png",
    )
    info_cell = get_info_cell(name, channel_name, title, published_date)

    # 検索用文字列は <br> ではなく半角スペースで連結する。
    # 表示用HTMLをそのままエスケープすると "&lt;br&gt;" が入り「br」で
    # 全行がヒットしてしまう問題を避けるため。
    info_value = esc(" ".join(filter(None, [published_date, title, channel_name, name])))

    return (
        f'<tr data-info="{info_value}">'
        f"<td>{video_cell}</td>"
        f'<td class="mj-left">{info_cell}</td>'
        f"</tr>"
    )


if __name__ == "__main__":
    generate(SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html)
