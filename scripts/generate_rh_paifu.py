#!/usr/bin/env python3
"""rh_paifu.html を Googleスプレッドシート「牌譜」シートのデータから
静的HTMLとして再生成するスクリプト。lib/page.py の共通処理を使う(#7)。

これまでブラウザ側(rh_paifu.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。フィルター・ページ送りはページ側の共有JS(table.js)に委譲する。

使い方:
    python3 scripts/generate_rh_paifu.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import NEW_TAB_HINT, PageMeta, TableConfig, build_image_cell, esc, generate  # noqa: E402

SPREADSHEET_ID = "1WxXJJ2vQPfjNsMYT9zBE2UU1Xo7T-PkhWYE6dtWtk50"
SHEET_NAME = "牌譜"
QUERY = 'SELECT A,B,C,D,E,F,G,H,I,J WHERE K = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "rh_paifu.html"

META = PageMeta(
    title="牌譜 | 平野良栄 | ryoei.pro",
    description="日本プロ麻雀連盟の麻雀プロ、平野良栄の公式戦の牌譜{count}件を公開しています。",
    og_url="https://ryoei.pro/rh_paifu.html",
    h1="平野良栄 牌譜一覧",
    caption="平野良栄の公式戦の牌譜一覧。",
)

# ?name= は概要(牌譜)の絞り込み欄の初期値(部分一致)として使う。
# 旧Google Charts版の pageSize:100 を踏襲する。画像クラスは videos
# (style.cssに定義を追加。#7で移行するまで定義漏れだった)。
TABLE = TableConfig(
    table_id="paifu_table",
    headers=["動画", "牌譜"],
    page_size=100,
    filter_param="name",
    filter_placeholder="牌譜",
    filter_label="牌譜で検索",
)


def get_full_hand_name(round_, hand, honba) -> str:
    return f"{round_}{hand}局{honba}本場"


def build_row_html(row) -> str:
    (
        name, video_url, image_url, video_start_time,
        game, round_, hand, honba, paifu_url, game_date,
    ) = row

    full_hand_name = get_full_hand_name(round_, hand, honba)

    # 動画リンクは開始位置(秒)をtパラメータで付加する。維持する仕様。
    video_url_with_time = f"{video_url}&t={video_start_time}s" if video_url else ""
    image_alt = " ".join(filter(None, [game, full_hand_name]))
    video_cell = build_image_cell(
        alt=image_alt, url=video_url_with_time, image_url=image_url,
        css_class="videos", width=160, height=90, fallback="img/125_arr_hoso.png",
    )

    paifu_link = f'<a href="{esc(paifu_url)}" target="_blank">{esc(full_hand_name)}{NEW_TAB_HINT}</a>' if paifu_url else esc(full_hand_name)
    info_cell = "<br>".join(filter(None, [esc(game_date), esc(game), paifu_link, esc(name)]))

    # 検索用文字列は <br> ではなく半角スペースで連結する。
    # 表示用HTMLをそのままエスケープすると "&lt;br&gt;" が入り「br」で
    # 全行がヒットしてしまう問題を避けるため。
    info_value = esc(" ".join(filter(None, [game_date, game, full_hand_name, name])))

    return (
        f'<tr data-info="{info_value}">'
        f"<td>{video_cell}</td>"
        f'<td class="mj-left">{info_cell}</td>'
        f"</tr>"
    )


if __name__ == "__main__":
    generate(SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html)
