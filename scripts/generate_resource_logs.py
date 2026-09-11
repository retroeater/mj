#!/usr/bin/env python3
"""resource_logs.html を Googleスプレッドシート「ログ」シートのデータから
静的HTMLとして再生成するスクリプト。lib/page.py の共通処理を使う(#7の
共通化で generate_jpml_pros.py 以外の型A・2列ページから括り出したもの)。

これまでブラウザ側(resource_logs.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。フィルター・ページ送りはページ側の共有JS(table.js)に委譲する。
名前セレクトボックスとタグリンクは、このページだけが持つUIのため
table.jsでは共通化せず、専用の小さな resource_logs.js に残す。

使い方:
    python3 scripts/generate_resource_logs.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, TableConfig, build_image_cell, esc, generate  # noqa: E402

SPREADSHEET_ID = "1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ"
SHEET_NAME = "ログ"
QUERY = 'SELECT A,B,C,D,E,F,G,H,I,J WHERE K = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "resource_logs.html"

# 名前のセレクトボックスとタグリンクは、スプレッドシートではなく
# 現行の resource_logs.html に直書きされていた値。データ由来ではないため
# ここに定数として持たせる。
NAME_OPTIONS = ["石立岳大", "谷岡育夫", "平野良栄"]
TAGS = [
    "うどん", "鰻", "牡蠣", "かき氷", "カレー", "スイーツ", "寿司", "蕎麦",
    "天ぷら", "とんかつ", "バーガー", "パスタ", "ハンバーグ", "モーニング",
    "焼肉", "ラーメン",
]

META = PageMeta(
    title="ログ | リソース | ryoei.pro",
    description="日本プロ麻雀連盟の麻雀プロが訪れた飲食店を、Xポストに基づいてまとめています。選手名・店名・メニュー名・最寄駅名などで検索できます。",
    og_url="https://ryoei.pro/resource_logs.html",
    h1="日本プロ麻雀連盟 麻雀プロが訪れた飲食店ログ",
    caption="日本プロ麻雀連盟の麻雀プロが訪れた飲食店の一覧。Xポストに基づく。",
)


def _build_search_boxes():
    name_options = "\n".join(
        f'\t\t<option value="resource_logs.html?name={esc(name)}">{esc(name)}</option>'
        for name in NAME_OPTIONS
    )
    name_options = '\t\t<option value="">名前を選択</option>\n' + name_options

    before = (
        "\t<label class=\"visually-hidden\" for=\"name_select\">名前で絞り込む</label>\n"
        "\t<select id=\"name_select\">\n"
        f"{name_options}\n"
        "\t</select>"
    )

    tag_links = "\n".join(
        f'\t<a href="resource_logs.html?tag={esc(tag)}">#{esc(tag)}</a>&nbsp;'
        for tag in TAGS
    )
    return before, tag_links


_SEARCH_BOXES_BEFORE, _SEARCH_BOXES_AFTER = _build_search_boxes()

# ?name= は data-name との完全一致(旧 Google Charts 版の WHERE句相当)。
# ?tag= は概要の絞り込み欄の初期値(部分一致)に使う。名前セレクトボックスと
# タグリンクはこのページ専用のUIのため、table.jsとは別の小さなJSを添える。
TABLE = TableConfig(
    table_id="logs_table",
    headers=["写真", "概要"],
    page_size=100,
    name_mode="exact",
    filter_param="tag",
    search_boxes_before=_SEARCH_BOXES_BEFORE,
    search_boxes_after=_SEARCH_BOXES_AFTER,
    extra_script='<script defer src="resource_logs.js"></script>\n',
)


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

    photo_cell = build_image_cell(
        alt=restaurant_name, url=x_url, image_url=x_image_url,
        css_class="rectangle", width=160, height=90, fallback="img/125_arr_hoso.png",
    )
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


if __name__ == "__main__":
    generate(SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html)
