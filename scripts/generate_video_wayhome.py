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
import re
import sys
import urllib.error
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, TableConfig, build_image_cell, esc, generate  # noqa: E402

IMG_YOUTUBE_PATTERN = re.compile(r"^https?://img\.youtube\.com/vi/([^/]+)/")
MAXRES_TIMEOUT = 15  # scripts/check_image_links.py のHEADリクエストと同じ方針

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


def _maxres_available(video_id: str) -> bool:
    """maxresdefault.jpg が存在するかHEADで確認する。失敗時はhqdefaultへ
    フォールバックする(#102)。タイムアウト・例外は握りつぶさずログに出す。"""
    url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=MAXRES_TIMEOUT) as res:
            return res.status == 200
    except Exception as e:
        print(f"  maxresdefault確認に失敗、hqdefaultにフォールバックします: {video_id}: {e}", file=sys.stderr)
        return False


def build_hero_html(raw_rows) -> str:
    """最新話(公開日=C列が最大の行)をヒーローとして大きく表示するHTMLを
    組み立てる(#102 第1段)。同日が複数ある場合はシート順で先に出てくる
    行を採用する(max()のタイブレーク仕様に依存せず明示的にループする)。
    """
    latest = None
    for row in raw_rows:
        published_date = row[2]
        if latest is None or (published_date or "") > (latest[2] or ""):
            latest = row
    if latest is None:
        return ""

    interviewee, x_id, published_date, title, url, image_url = latest

    match = IMG_YOUTUBE_PATTERN.match(image_url or "")
    if match:
        video_id = match.group(1)
        if _maxres_available(video_id):
            thumb_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
            width, height = 1280, 720
        else:
            thumb_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
            width, height = 480, 360
    else:
        # 現データ(38件)はすべてimg.youtube.comのため通常は通らない分岐。
        # F列の値をそのまま使い、解像度の差し替えは行わない。
        thumb_url = image_url
        width, height = 480, 360

    alt = f"{title} {interviewee}" if interviewee else (title or "")

    return (
        '<section class="mj-hero">\n'
        '\t<h2 class="mj-hero-heading">最新話</h2>\n'
        f'\t<a href="{esc(url)}" target="_blank" class="mj-hero-link">'
        f'<img alt="{esc(alt)}" class="mj-hero-image" width="{width}" height="{height}" '
        f'fetchpriority="high" src="{esc(thumb_url)}" /></a>\n'
        f'\t<p class="mj-hero-info">{esc(published_date)}<br>{esc(title)}<br>{esc(interviewee)}</p>\n'
        "</section>\n"
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
    generate(
        SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html,
        build_content_before=build_hero_html,
    )
