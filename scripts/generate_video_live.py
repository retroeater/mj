#!/usr/bin/env python3
"""video_live.html を Googleスプレッドシート「対局」シートのデータから
静的HTMLとして再生成するスクリプト。lib/page.py の共通処理を使う(#7の
共通化で generate_jpml_pros.py 以外の型A・2列ページから括り出したもの)。

これまでブラウザ側(video_live.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。フィルター・ページ送りはページ側の共有JS(table.js)に委譲する。

使い方:
    python3 scripts/generate_video_live.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, TableConfig, build_image_cell, esc, generate  # noqa: E402

SPREADSHEET_ID = "1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0"
SHEET_NAME = "対局"
QUERY = 'SELECT A,B,C,E,F,G,H WHERE I = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "video_live.html"

META = PageMeta(
    title="放送対局 | 動画 | ryoei.pro",
    description="YouTubeチャンネル「日本プロ麻雀連盟」の放送対局動画をまとめています。選手・実況・解説の名前、タイトル戦名称などで検索できます。",
    og_url="https://ryoei.pro/video_live.html",
    h1="日本プロ麻雀連盟 放送対局動画",
    caption="日本プロ麻雀連盟の放送対局動画の一覧。",
)

# jpml_testと同じく ?name= を概要の絞り込み欄の初期値(部分一致)として使う。
TABLE = TableConfig(
    table_id="live_table",
    headers=["動画", "概要"],
    page_size=50,
    filter_param="name",
)


def get_info_cell(player, commentator, analyst, title, published_date) -> str:
    """概要列のセルを生成する。元のJS getFormattedInfo() と同じ組み立て。

    公開日<br>タイトル<br>対局者<br>実況：◯◯、解説：◯◯

    実況・解説の有無で出し分ける(実況だけ／解説だけ／両方／どちらもなし)。
    元のロジックをそのまま踏襲しており、どちらもない場合は末尾に
    <br>だけが残る(元のGoogle Charts版と同じ挙動)。"""
    info = "<br>".join([esc(published_date), esc(title), esc(player)]) + "<br>"
    if commentator:
        info += f"実況：{esc(commentator)}"
        if analyst:
            info += f"、解説：{esc(analyst)}"
    elif analyst:
        info += f"解説：{esc(analyst)}"
    return info


def build_row_html(row) -> str:
    player, commentator, analyst, title, url, image_url, published_date = row

    video_cell = build_image_cell(
        alt=title, url=url, image_url=image_url,
        css_class="rectangle", width=160, height=90, fallback="img/125_arr_hoso.png",
    )
    info_cell = get_info_cell(player, commentator, analyst, title, published_date)

    # 検索用文字列は <br> ではなく半角スペースで連結する。
    # jpml_titlesのdata-infoと同じく、表示用HTMLをそのままエスケープすると
    # "&lt;br&gt;" が入り「br」で全行がヒットしてしまう問題を避けるため。
    info_value = esc(
        " ".join(filter(None, [published_date, title, player, commentator, analyst]))
    )

    # jpml_testと同じく ?name= を完全一致に使わないため、data-name は不要。
    return (
        f'<tr data-info="{info_value}">'
        f"<td>{video_cell}</td>"
        f'<td class="mj-left">{info_cell}</td>'
        f"</tr>"
    )


if __name__ == "__main__":
    generate(SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html)
