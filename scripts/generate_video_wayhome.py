#!/usr/bin/env python3
"""video_wayhome.html を Googleスプレッドシート「帰り道」シートのデータから
静的HTMLとして再生成するスクリプト。lib/page.py の共通処理を使う(#7)。

これまでブラウザ側(video_wayhome.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。フィルター・ページ送りはページ側の共有JS(table.js)に委譲する。

使い方:
    python3 scripts/generate_video_wayhome.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, TableConfig, build_image_cell, esc, generate  # noqa: E402

SPREADSHEET_ID = "1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ"
SHEET_NAME = "帰り道"
QUERY = 'SELECT A,B,C,D,E,F WHERE G = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "video_wayhome.html"

META = PageMeta(
    title="帰り道 | 動画 | ryoei.pro",
    description="YouTubeチャンネル「日本プロ麻雀連盟」の企画「帰り道ついていってイイっすか」の動画をまとめています。選手名・タイトル戦名称などで検索できます。",
    og_url="https://ryoei.pro/video_wayhome.html",
    h1="日本プロ麻雀連盟 帰り道動画",
    caption="日本プロ麻雀連盟の企画「帰り道ついていってイイっすか」の動画一覧。",
)

# ?name= は概要の絞り込み欄の初期値(部分一致)として使う。旧Google Charts版の
# pageSize:50 を踏襲する。
TABLE = TableConfig(
    table_id="wayhome_table",
    headers=["動画", "概要"],
    page_size=50,
    filter_param="name",
)


def get_info_cell(interviewee, x_id, published_date, title) -> str:
    """概要列のセルを生成する。元のJS getFormattedInfo() と同じ組み立て。

    公開日<br>タイトル<br>出演者<br>[@Xアカウント]

    Xアカウントへのリンクのインラインstyle(text-decoration:none)は#9のCSPで
    弾かれるため、style.cssの.mj-plainクラスに置き換える。"""
    info = "<br>".join([esc(published_date), esc(title), esc(interviewee)]) + "<br>"
    if x_id:
        info += f'<a href="https://x.com/{esc(x_id)}" target="_blank" class="mj-plain">@{esc(x_id)}</a>'
    return info


def build_row_html(row) -> str:
    interviewee, x_id, published_date, title, url, image_url = row

    video_cell = build_image_cell(
        alt=title, url=url, image_url=image_url,
        css_class="rectangle", width=160, height=90, fallback="img/125_arr_hoso.png",
    )
    info_cell = get_info_cell(interviewee, x_id, published_date, title)

    # 検索用文字列は <br> ではなく半角スペースで連結する。
    # 表示用HTMLをそのままエスケープすると "&lt;br&gt;" が入り「br」で
    # 全行がヒットしてしまう問題を避けるため。
    info_value = esc(" ".join(filter(None, [published_date, title, interviewee, x_id])))

    return (
        f'<tr data-info="{info_value}">'
        f"<td>{video_cell}</td>"
        f'<td class="mj-left">{info_cell}</td>'
        f"</tr>"
    )


if __name__ == "__main__":
    generate(SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html)
