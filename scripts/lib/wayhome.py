"""「帰り道ついていってイイっすか」で共有するデータ取得・変換処理。

generate_video_wayhome.py(一覧、video_wayhome.html)と
generate_wayhome_episodes.py(エピソード個別ページ38枚、wayhome/、#162)の
両方から使う。最新話判定・サムネイル解決・uploadDate変換・VideoObjectの
組み立てを二重実装しないためにここへ集約した。
"""
import datetime
import re
import sys
import urllib.error
import urllib.request
from collections import namedtuple

SPREADSHEET_ID = "1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ"
SHEET_NAME = "帰り道"
QUERY = 'SELECT A,B,C,D,E,F WHERE G = "Y"'

SERIES_NAME = "帰り道ついていってイイっすか"

# 列名とコード上の呼び名の対応をここに1か所だけ定義する(#196)。QUERYの
# SELECT句(A,B,C,D,E,F)と順序が1対1で対応する。scripts/lib/sheets.py の
# fetch_sheet() はヘッダーではなく位置のみのlistを返すため、これまでは
# generate_video_wayhome.py / generate_wayhome_episodes.py の各所で
# `interviewee, x_id, published_date, title, url, image_url = row` という
# 位置参照の分解代入が散らばっていた。QUERYのSELECT句を変える(#192で
# published_date/image_urlを参照しなくなる、#193で列を1つ増やす)際に
# ここを一緒に直し忘れると、位置がずれた値をエラーにならず読み込んでしまう。
# ROW_FIELDSとWayhomeRowを介すことで、参照側は名前でアクセスするようになり
# (存在しない名前へのアクセスはAttributeErrorになる)、QUERYとの対応も
# この1か所を見れば分かるようにする。
ROW_FIELDS = ("interviewee", "x_id", "published_date", "title", "url", "image_url")
WayhomeRow = namedtuple("WayhomeRow", ROW_FIELDS)


def to_rows(raw_rows):
    """fetch_sheet()が返す位置参照のみの行(各行はセル値のlist)を、
    列名でアクセスできるWayhomeRowのリストに変換する(#196)。

    行の要素数がROW_FIELDSと一致しない場合、位置がずれた値を無言で
    読み込んでしまうことを防ぐため、無言でスキップせず例外にする
    (QUERYのSELECT句とROW_FIELDSの対応がずれている可能性が高い)。"""
    result = []
    for i, values in enumerate(raw_rows):
        if len(values) != len(ROW_FIELDS):
            raise ValueError(
                f"「{SHEET_NAME}」シートの{i + 1}行目の列数が想定と一致しません"
                f"(想定: {len(ROW_FIELDS)}列{ROW_FIELDS}、実際: {len(values)}列 {values!r})。"
                "QUERYのSELECT句とROW_FIELDSの対応がずれていないか確認すること。"
            )
        result.append(WayhomeRow(*values))
    return result

IMG_YOUTUBE_PATTERN = re.compile(r"^https?://img\.youtube\.com/vi/([^/]+)/")
WATCH_ID_PATTERN = re.compile(r"[?&]v=([^&]+)")
DATE_ONLY_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
JST = datetime.timezone(datetime.timedelta(hours=9))
MAXRES_TIMEOUT = 15  # scripts/check_image_links.py のHEADリクエストと同じ方針


def sorted_by_date_desc(rows):
    """公開日(C列)の降順に並べる。Pythonのsortedは安定ソートなので、
    同日が複数ある場合はシート順で先に出てくる行が結果でも先に来る
    (#102第2段のmax()ループと同じ規則をsortedの安定性で満たす)。"""
    return sorted(rows, key=lambda row: row.published_date or "", reverse=True)


def video_id_from_watch_url(url):
    """視聴URL(https://www.youtube.com/watch?v=...)から動画IDを取り出す。
    見つからなければNone。"""
    match = WATCH_ID_PATTERN.search(url or "")
    return match.group(1) if match else None


def maxres_available(video_id: str) -> bool:
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


def resolve_thumb(image_url):
    """大きいサムネイル用のURL・width・heightを決める(#102第1段から移植)。
    F列がimg.youtube.comでなければ差し替えを行わずそのまま使う。"""
    match = IMG_YOUTUBE_PATTERN.match(image_url or "")
    if not match:
        # 現データ(38件)はすべてimg.youtube.comのため通常は通らない分岐。
        return image_url, 480, 360
    video_id = match.group(1)
    if maxres_available(video_id):
        return f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg", 1280, 720
    return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg", 480, 360


def to_upload_date(date_str):
    """C列の日付文字列(YYYY-MM-DD)をuploadDate用の完全なISO 8601に変換する
    (#13。本番のリッチリザルトテストで「日時値が無効」「タイムゾーンが無い」
    の2件が任意の指摘として出たため)。

    スプレッドシートには日付しかないため、時刻は 00:00:00 JST で近似する。
    実際の公開時刻ではない。パースできない値はNoneを返す。uploadDateは
    呼び出し側でキーごと省略する。"""
    if not date_str or not DATE_ONLY_PATTERN.match(date_str):
        return None
    try:
        dt = datetime.datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=JST)
    except ValueError:
        return None
    return dt.isoformat()


def episode_url(video_id: str) -> str:
    """エピソード個別ページの絶対URL(#162)。"""
    return f"https://ryoei.pro/wayhome/{video_id}.html"


def episode_path(video_id: str) -> str:
    """リポジトリ内での相対パス(ルート直下から見た、#162)。"""
    return f"wayhome/{video_id}.html"


def episode_description(row) -> str:
    """VideoObject.description・ページ本文・meta descriptionで共通して使う文言。
    3箇所の文言を揃えるため一本化する(#162)。"""
    return f"日本プロ麻雀連盟「{SERIES_NAME}」。{row.title}を終えた{row.interviewee}への密着インタビュー動画です。"


def build_video_object(row, thumb_url) -> dict:
    """VideoObject(単体)を組み立てる。一覧ページ(最新話1件)・個別ページ
    (そのページの動画)の両方で使う。"""
    obj = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": f"{row.title} {row.interviewee}".strip(),
        "description": episode_description(row),
        "thumbnailUrl": [thumb_url],
        "contentUrl": row.url,
    }
    upload_date = to_upload_date(row.published_date)
    if upload_date:
        obj["uploadDate"] = upload_date
    video_id = video_id_from_watch_url(row.url)
    if video_id:
        obj["embedUrl"] = f"https://www.youtube.com/embed/{video_id}"
    return obj
