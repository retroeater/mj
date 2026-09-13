"""「帰り道ついていってイイっすか」で共有するデータ取得・変換処理。

generate_video_wayhome.py(一覧、video_wayhome.html)と
generate_wayhome_episodes.py(エピソード個別ページ38枚、wayhome/、#162)の
両方から使う。最新話判定・サムネイル解決・uploadDate変換・VideoObjectの
組み立てを二重実装しないためにここへ集約した。

#192第2段: 公開日とサムネイルはシートではなく data/youtube_meta.json
(scripts/fetch_youtube_meta.py が YouTube Data API から取得)を正とする。
"""
import datetime
import json
import pathlib
import re
import sys
import urllib.parse
from collections import namedtuple

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from lib.page import NEW_TAB_HINT, esc  # noqa: E402

SPREADSHEET_ID = "1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ"
SHEET_NAME = "帰り道"

SERIES_NAME = "帰り道ついていってイイっすか"

YOUTUBE_META_PATH = pathlib.Path(__file__).parent.parent.parent / "data" / "youtube_meta.json"

# シート「帰り道」の列とコード上の呼び名の対応をここに1か所だけ定義する
# (#196/#193)。(列記号, コード上の呼び名, シート上の見出し(参考表示用))の
# 順。QUERYはここから組み立てる(SELECT句に書くのは列記号であり、シート上の
# 見出し文字列ではない。取り違えないこと)。列を増減・並び替えるときは
# このCOLUMNSだけを直せばよい。scripts/lib/sheets.py の fetch_sheet() は
# ヘッダーではなく位置のみのlistを返すため、これまでは
# generate_video_wayhome.py / generate_wayhome_episodes.py の各所で
# `interviewee, x_id, published_date, title, url, image_url = row` という
# 位置参照の分解代入が散らばっていた。COLUMNSと実際にずれると、位置が
# ずれた値をエラーにならず読み込んでしまう(#196)。ROW_FIELDSとWayhomeRowを
# 介すことで、参照側は名前でアクセスするようになる(存在しない名前への
# アクセスはAttributeErrorになる)。
COLUMNS = (
    ("A", "interviewee", "名前"),
    ("B", "x_id", "X ID"),
    # C・F列はシートに残すが生成には使わない(#192第2段、API由来に切り替え)。
    ("C", "published_date", "公開日"),
    ("D", "title", "タイトル"),
    ("E", "url", "URL"),
    ("F", "image_url", "画像URL"),
    # #193: 決勝戦動画へのリンク用。38行中1行のみ値が入っており、残りは
    # 空欄(未入力)が正常。
    ("H", "final_video_url", "決勝動画URL"),
)
ROW_FIELDS = tuple(name for _, name, _ in COLUMNS)
WayhomeRow = namedtuple("WayhomeRow", ROW_FIELDS)
QUERY = 'SELECT {} WHERE G = "Y"'.format(",".join(letter for letter, _, _ in COLUMNS))

# 生成側が使う1エピソード分。シート由来の項目にAPI由来の公開日時(JST)と
# サムネイル一覧を合わせたもの。C・F列の値は持たせない(#192第2段)。
Episode = namedtuple(
    "Episode",
    ("interviewee", "x_id", "title", "url", "final_video_url", "video_id", "published_at", "thumbnails"),
)


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

WATCH_ID_PATTERN = re.compile(r"[?&]v=([^&]+)")
JST = datetime.timezone(datetime.timedelta(hours=9))

THUMB_BASE = "https://img.youtube.com/vi"
# (APIのthumbnailsのキー, img.youtube.com上のファイル名)。URLはAPIが返す
# i.ytimg.comではなくimg.youtube.comで組み立てる(CSP導入#9に向けて依存
# ドメインを増やさない)。有無の判定はAPIのキーで行い、404には頼らない。
# fhd(1920×1080)はAPIに載っていても実体が404のため使わない(#192)。
HERO_THUMB_PRIORITY = (("maxres", "maxresdefault"), ("standard", "sddefault"), ("high", "hqdefault"))
CARD_THUMB = ("medium", "mqdefault")  # 表示160×90のカード用。maxresだと38枚で約7MBになる
HERO_FALLBACK_FILE = "hqdefault"  # 読み込み失敗時のdata-fallback先


def load_episodes(rows, meta_path=YOUTUBE_META_PATH):
    """WayhomeRowのリストに data/youtube_meta.json の公開日時・サムネイルを
    合わせてEpisodeのリストにする。シートにあってJSONに無い動画は、
    再取得漏れ(scripts/fetch_youtube_meta.py未実行)なので生成を止める。"""
    videos = json.loads(meta_path.read_text(encoding="utf-8"))["videos"]
    episodes = []
    missing = []
    for row in rows:
        video_id = video_id_from_watch_url(row.url)
        if not video_id:
            raise ValueError(f"視聴URLから動画IDを取り出せません: {row.url!r}")
        video = videos.get(video_id)
        if video is None:
            missing.append(f"{video_id}({row.title} {row.interviewee})")
            continue
        published_at = datetime.datetime.fromisoformat(video["publishedAt"].replace("Z", "+00:00")).astimezone(JST)
        episodes.append(Episode(
            row.interviewee, row.x_id, row.title, row.url, row.final_video_url,
            video_id, published_at, video["thumbnails"],
        ))
    if missing:
        raise ValueError(
            f"{meta_path.name} に無い動画があります。scripts/fetch_youtube_meta.py で"
            f"再取得すること: {', '.join(missing)}"
        )
    return episodes


def sorted_by_date_desc(episodes):
    """公開日時(API由来、#192第2段)の降順に並べる。同時刻は無い前提だが、
    Pythonのsortedは安定ソートなのでその場合もシート順が保たれる。"""
    return sorted(episodes, key=lambda ep: ep.published_at, reverse=True)


def published_date_text(episode) -> str:
    """表示用の公開日(JST、YYYY-MM-DD)。"""
    return episode.published_at.strftime("%Y-%m-%d")


def video_id_from_watch_url(url):
    """視聴URL(https://www.youtube.com/watch?v=...)から動画IDを取り出す。
    見つからなければNone。"""
    match = WATCH_ID_PATTERN.search(url or "")
    return match.group(1) if match else None


def thumb_url(video_id: str, file_name: str) -> str:
    return f"{THUMB_BASE}/{video_id}/{file_name}.jpg"


def resolve_hero_thumb(episode):
    """ヒーロー・og:image用のURL・width・height。HERO_THUMB_PRIORITYの
    順にAPIのキーがあるものを使う。width/heightはAPIが返す実寸。"""
    for key, file_name in HERO_THUMB_PRIORITY:
        thumb = episode.thumbnails.get(key)
        if thumb:
            return thumb_url(episode.video_id, file_name), thumb["width"], thumb["height"]
    raise ValueError(f"ヒーロー用のサムネイルがAPIレスポンスにありません: {episode.video_id}")


def resolve_card_thumb(episode):
    """カード用のURL・width・height(APIのmedium、320×180)。"""
    key, file_name = CARD_THUMB
    thumb = episode.thumbnails.get(key)
    if not thumb:
        raise ValueError(f"カード用のサムネイル({key})がAPIレスポンスにありません: {episode.video_id}")
    return thumb_url(episode.video_id, file_name), thumb["width"], thumb["height"]


def hero_fallback_url(episode) -> str:
    return thumb_url(episode.video_id, HERO_FALLBACK_FILE)


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


def build_final_video_link_html(row, css_class: str = "") -> str:
    """決勝戦動画へのリンク(H列「決勝動画URL」、#193)。空セルの行では
    何も返さない(プレースホルダも出さない)。値が入っているのに
    http(s)://で始まる絶対URLとして解釈できない場合は、握りつぶさず
    例外にする(どの行かを含める)。YouTube以外のホスト・パス形式
    (例: youtube.com/watch?v=... 以外の /live/<id> 等)は許容し、
    ホスト名やパス形式による制限はしない。"""
    url = (row.final_video_url or "").strip()
    if not url:
        return ""
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError(
            f"決勝動画URLの形式が想定外です(http(s)://で始まる絶対URLではありません): "
            f"{url!r}(行: {row.interviewee} / {row.title})"
        )
    class_attr = f' class="{esc(css_class)}"' if css_class else ""
    return f'<a{class_attr} href="{esc(url)}" target="_blank" rel="noopener">決勝戦を見る{NEW_TAB_HINT}</a>'


def build_video_object(episode, thumb_url) -> dict:
    """VideoObject(単体)を組み立てる。一覧ページ(最新話1件)・個別ページ
    (そのページの動画)の両方で使う。uploadDateはAPIの実際の公開時刻
    (JST、#13で求められたタイムゾーン付きISO 8601)。"""
    return {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": f"{episode.title} {episode.interviewee}".strip(),
        "description": episode_description(episode),
        "thumbnailUrl": [thumb_url],
        "contentUrl": episode.url,
        "uploadDate": episode.published_at.isoformat(),
        "embedUrl": f"https://www.youtube.com/embed/{episode.video_id}",
    }
