#!/usr/bin/env python3
"""saikyo_mens.html を Googleスプレッドシート「選手」シートのデータから
静的HTMLとして再生成するスクリプト。lib/page.py の共通処理を使う(#7)。

これまでブラウザ側(saikyo_mens.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。フィルター・ページ送りはページ側の共有JS(table.js)に委譲する。

?name= による完全一致(旧Google Charts版は 'AND B = "名前"' をクエリに
追加していたが、静的HTMLでは全行を焼き込んだうえでdata-nameの完全一致に
置き換える。jpml_titles/resource_logsと同じ方式)。

使い方:
    python3 scripts/generate_saikyo_mens.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, TableConfig, build_image_cell, esc, generate  # noqa: E402

SPREADSHEET_ID = "1_xupRciIfdLYielUvIoAcmwUdyd0a_3a-opkj6IYe6M"
SHEET_NAME = "選手"
# 元のGoogle Charts版はC(ふりがな)も取得していたが、セル組み立てでは
# 使われていない。jpml_test.pyの前例に倣い、使わない列は外して取得する。
QUERY = 'SELECT A,B,D,E,F,G WHERE H = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "saikyo_mens.html"

META = PageMeta(
    title="読者アンケート | 麻雀最強戦 | ryoei.pro",
    description="麻雀最強戦の読者アンケートのエントリー選手{count}名をまとめています。",
    og_url="https://ryoei.pro/saikyo_mens.html",
    h1="麻雀最強戦 読者アンケート エントリー選手一覧",
    caption="麻雀最強戦の読者アンケートのエントリー選手一覧。",
)

# ?name= は data-name との完全一致(旧クエリの WHERE B = "名前" 相当)。
# ?tag= は絞り込み欄の初期値(部分一致)に使う。旧Google Charts版の
# pageSize:200 を踏襲する。
TABLE = TableConfig(
    table_id="mens_table",
    headers=["X", "Profile"],
    page_size=200,
    name_mode="exact",
    filter_param="tag",
)

ORG_ABBREVIATIONS = {
    "日本プロ麻雀連盟": "JPML",
    "日本プロ麻雀協会": "NPM",
    "麻将連合": "Mu",
    "最高位戦日本プロ麻雀協会": "Saikouisen",
}

TWITTER_FALLBACK = "img/avatar.svg"  # 旧: abs.twimg.com の既定アイコン(外部ドメイン)


def get_image_cell(player_name_ja, twitter_id, twitter_image_url) -> str:
    """X(Twitter)アイコンのセルを生成する。

    スプレッドシート側は未設定を空文字ではなく "-" で表す。Xアカウントが
    ない行は <a> で包まず <img> のみにする(元のJS get FormattedImage()の
    分岐を維持)。フォールバックは旧来の abs.twimg.com の既定アイコンから
    img/avatar.svg に差し替える(外部ドメイン依存を1つ減らす)。"""
    twitter_url = f"https://x.com/{twitter_id}" if twitter_id and twitter_id != "-" else ""
    image_url = twitter_image_url if twitter_image_url and twitter_image_url != "-" else ""
    return build_image_cell(
        alt=player_name_ja, url=twitter_url, image_url=image_url,
        css_class="x", width=80, height=80, fallback=TWITTER_FALLBACK,
    )


def get_profile_cell(player_id, player_name_ja, player_name_en, player_org_ja) -> str:
    """プロフィール列のセルを生成する。元のJS getFormattedProfile()と同じ組み立て。

    【選手番号】<br>名前(日本語 / 英語)<br>所属(/ 略称)"""
    if player_name_en and player_name_en != "-":
        player_name = f"{player_name_ja} / {player_name_en}"
    else:
        player_name = player_name_ja

    abbrev = ORG_ABBREVIATIONS.get(player_org_ja)
    player_org = f"{player_org_ja} / {abbrev}" if abbrev else player_org_ja

    return f"【{esc(player_id)}】<br>{esc(player_name)}<br>{esc(player_org)}"


def build_row_html(row) -> str:
    player_id, player_name_ja, player_name_en, player_org_ja, twitter_id, twitter_image_url = row

    image_cell = get_image_cell(player_name_ja, twitter_id, twitter_image_url)
    profile_cell = get_profile_cell(player_id, player_name_ja, player_name_en, player_org_ja)

    # 検索用文字列は <br> ではなく半角スペースで連結する。
    # 表示用HTMLをそのままエスケープすると "&lt;br&gt;" が入り「br」で
    # 全行がヒットしてしまう問題を避けるため。
    info_value = esc(
        " ".join(filter(None, [str(player_id), player_name_ja,
                                player_name_en if player_name_en != "-" else None,
                                player_org_ja]))
    )
    name_value = esc(player_name_ja or "")

    return (
        f'<tr data-name="{name_value}" data-info="{info_value}">'
        f"<td>{image_cell}</td>"
        f'<td class="mj-left">{profile_cell}</td>'
        f"</tr>"
    )


if __name__ == "__main__":
    generate(SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html)
