#!/usr/bin/env python3
"""video_mtsuku.html を Googleスプレッドシート「Mつく」シートのデータから
静的HTMLとして再生成するスクリプト。lib/page.py の共通処理を使う(#7)。

これまでブラウザ側(video_mtsuku.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。フィルター・ページ送りはページ側の共有JS(table.js)に委譲する。

型Aの他ページと違う2点:
  - 3列(動画/概要/選手)。.mj-table-2colではなく.mj-table-3colを使う
  - ページ送りを持たない(旧Google Charts版もpage:'enable'を指定していない)
  - 絞り込み対象は3列目(選手)のみ。data-infoには選手名・所属だけを入れ、
    概要列の文言(公開日・名前・団体・チーム名)は含めない
    (旧Google Charts版の filterColumnIndex:2 と同じ挙動)

使い方:
    python3 scripts/generate_video_mtsuku.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, TableConfig, build_image_cell, esc, generate  # noqa: E402

SPREADSHEET_ID = "1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ"
SHEET_NAME = "Mつく"
QUERY = 'SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N WHERE O = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "video_mtsuku.html"

META = PageMeta(
    title="Mつく | 動画 | ryoei.pro",
    description="YouTubeチャンネル「麻雀遊戯王」の企画「Mリーグチームを作ろう！」の動画をまとめています。選手名・所属団体名などで検索できます。",
    og_url="https://ryoei.pro/video_mtsuku.html",
    h1="日本プロ麻雀連盟 Mつく動画",
    caption="YouTubeチャンネル「麻雀遊戯王」の企画「Mリーグチームを作ろう！」の動画一覧。",
)

# ?name= は3列目(選手)の絞り込み欄の初期値(部分一致)として使う。
# ページ送りは持たない(page_size=None)。3列のため.mj-table-2colは付けない。
TABLE = TableConfig(
    table_id="mtsuku_table",
    headers=["動画", "概要", "選手"],
    extra_table_class="mj-table-3col",
    page_size=None,
    filter_param="name",
    filter_placeholder="選手",
    filter_label="選手で検索",
)


def get_info_cell(name, org, published_date, team_name) -> str:
    """概要列のセルを生成する。元のJS getFormattedInfo()と同じ組み立て。"""
    info = f"{esc(published_date)}<br>{esc(name)}"
    if org:
        info += f"（{esc(org)}）"
    if team_name:
        info += f"<br>{esc(team_name)}"
    return info


def get_members_cell(name1, org1, name2, org2, name3, org3, name4, org4) -> str:
    """選手列のセルを生成する。元のJS getFormattedMembers()と同じ組み立て。
    name4の有無で4人目を出し分ける(元のロジックをそのまま踏襲)。"""
    members = f"{esc(name1)}（{esc(org1)}）<br>{esc(name2)}（{esc(org2)}）<br>{esc(name3)}（{esc(org3)}）"
    if name4:
        members += f"<br>{esc(name4)}（{esc(org4)}）"
    return members


def build_row_html(row) -> str:
    (
        name, org, published_date, url, image_url, team_name,
        name1, org1, name2, org2, name3, org3, name4, org4,
    ) = row

    video_cell = build_image_cell(
        alt=name, url=url, image_url=image_url,
        css_class="rectangle", width=160, height=90, fallback="img/125_arr_hoso.png",
    )
    info_cell = get_info_cell(name, org, published_date, team_name)
    members_cell = get_members_cell(name1, org1, name2, org2, name3, org3, name4, org4)

    # 絞り込み対象は3列目(選手)のみ。概要列の文言(公開日・名前・団体・
    # チーム名)は検索対象に含めない(旧Google Charts版のfilterColumnIndex:2
    # と同じ挙動。含めると「選手」欄以外の一致でもヒットしてしまう)。
    info_value = esc(
        " ".join(filter(None, [name1, org1, name2, org2, name3, org3, name4, org4]))
    )

    return (
        f'<tr data-info="{info_value}">'
        f"<td>{video_cell}</td>"
        f'<td class="mj-left">{info_cell}</td>'
        f'<td class="mj-left">{members_cell}</td>'
        f"</tr>"
    )


if __name__ == "__main__":
    generate(SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html)
