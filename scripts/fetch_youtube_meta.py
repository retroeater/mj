#!/usr/bin/env python3
"""「帰り道」の動画メタデータをYouTube Data API v3から取得し、
data/youtube_meta.json に保存する(#192)。

生成スクリプト(generate_video_wayhome.py / generate_wayhome_episodes.py)は
この中間JSONを読む構成にする(API を直接叩かせない)。理由:
  - API障害時にHTML生成そのものが落ちない
  - 差分(閲覧数の変動等)がgit historyから追える
  - ローカルで生成を試すときにAPIキーが無くても動く

動画IDはシート「帰り道」のE列(YouTube視聴URL)から抽出する
(scripts/lib/wayhome.pyのQUERY/ROW_FIELDS、#196で名前ベース化済み)。

videos.list は id を最大50件までカンマ区切りでまとめて渡せるため、
1本ずつ叩かず、50件ずつのチャンクでリクエストする。

APIキーは次の優先順で読む(#192、WH-29):
  1. 環境変数 YOUTUBE_API_KEY (GitHub Actions用)
  2. リポジトリルートの .youtube_api_key ファイル(ローカル実行用。
     平野さんが手元で作成する。.gitignoreで除外済み)
`export YOUTUBE_API_KEY=...` でシェルに残す方式は採らない。以降の
env/printenvやエラー出力にキーが載って残り続ける可能性があるため。

リポジトリにもログにもキーそのものを出力しない。APIのリクエストURL
(キーを含む)もログに出さない。失敗時はHTTPステータス等キーを含まない
情報のみ報告する。

使い方(環境変数で渡す場合):
    YOUTUBE_API_KEY=... python3 scripts/fetch_youtube_meta.py
使い方(ファイルで渡す場合):
    echo -n "APIキー" > .youtube_api_key
    python3 scripts/fetch_youtube_meta.py
"""
import argparse
import datetime
import json
import os
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib import wayhome  # noqa: E402
from lib.sheets import fetch_sheet  # noqa: E402

REPO_ROOT = pathlib.Path(__file__).parent.parent
DEFAULT_OUT_PATH = REPO_ROOT / "data" / "youtube_meta.json"
API_KEY_FILE = REPO_ROOT / ".youtube_api_key"

API_BASE = "https://www.googleapis.com/youtube/v3/videos"
API_PART = "snippet,contentDetails,statistics"
CHUNK_SIZE = 50  # videos.list の id は1リクエストにつき最大50件

# 取得して中間JSONに残すフィールド。表示用の整形はここでは行わない
# (整形は生成スクリプト側の責務にする。#192第2段/第3段)。
FIELDS = (
    "publishedAt",   # snippet.publishedAt (UTC)
    "thumbnails",    # snippet.thumbnails (maxres/standard/high/medium/default)
    "duration",      # contentDetails.duration (ISO8601)
    "viewCount",     # statistics.viewCount (文字列)
)


def load_api_key() -> str:
    """APIキーを読む。優先順: 環境変数 YOUTUBE_API_KEY(GitHub Actions用) →
    リポジトリルートの .youtube_api_key ファイル(ローカル実行用、
    .gitignoreで除外済み)。`export`でシェル環境に残す方式は、以降の
    env/printenvやエラー出力にキーが載り続けうるため採らない(#192、WH-29)。
    どちらにも無い場合、キーの値は出さずその旨だけ伝えて終了する。"""
    env_key = os.environ.get("YOUTUBE_API_KEY")
    if env_key:
        return env_key.strip()
    if API_KEY_FILE.exists():
        file_key = API_KEY_FILE.read_text(encoding="utf-8").strip()
        if file_key:
            return file_key
    raise SystemExit(
        "APIキーが見つかりません。環境変数 YOUTUBE_API_KEY を設定するか、"
        f"リポジトリルートに {API_KEY_FILE.name} ファイルを作成してください。"
    )


def fetch_chunk(video_ids: list, api_key: str) -> dict:
    """videos.list を1回呼び、{video_id: フィールドdict} を返す。
    レスポンスに含まれないIDは戻り値に含めない(削除済み・非公開等)。"""
    params = {
        "part": API_PART,
        "id": ",".join(video_ids),
        "key": api_key,
        "maxResults": len(video_ids),
    }
    url = f"{API_BASE}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw = res.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        # リクエストURLにはAPIキーが含まれるため、エラーメッセージには
        # 一切含めない(HTTPステータスとレスポンス本文のみ)。
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"YouTube Data APIの呼び出しに失敗しました(HTTP {e.code})。レスポンス: {body[:500]}"
        ) from None
    except urllib.error.URLError as e:
        raise RuntimeError(f"YouTube Data APIへの接続に失敗しました: {e.reason}") from None

    data = json.loads(raw)
    if "error" in data:
        raise RuntimeError(f"YouTube Data APIがエラーを返しました: {data['error']}")

    result = {}
    for item in data.get("items", []):
        video_id = item["id"]
        snippet = item.get("snippet", {})
        content_details = item.get("contentDetails", {})
        statistics = item.get("statistics", {})
        thumbnails = snippet.get("thumbnails", {})
        result[video_id] = {
            "publishedAt": snippet.get("publishedAt"),
            "thumbnails": {
                name: {"url": t["url"], "width": t.get("width"), "height": t.get("height")}
                for name, t in thumbnails.items()
            },
            "duration": content_details.get("duration"),
            "viewCount": statistics.get("viewCount"),
        }
    return result


def collect_video_ids() -> list:
    """シート「帰り道」から動画IDのリストを取得する(表示順は問わない)。"""
    raw_rows = wayhome.to_rows(fetch_sheet(wayhome.SPREADSHEET_ID, wayhome.SHEET_NAME, wayhome.QUERY))
    video_ids = []
    for row in raw_rows:
        video_id = wayhome.video_id_from_watch_url(row.url)
        if not video_id:
            raise ValueError(f"視聴URLから動画IDを取り出せない行があります: {row!r}")
        video_ids.append(video_id)
    return video_ids


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default=str(DEFAULT_OUT_PATH), help="出力先JSONのパス")
    args = parser.parse_args()

    api_key = load_api_key()

    video_ids = collect_video_ids()
    print(f"シートから{len(video_ids)}件の動画IDを取得しました。YouTube Data APIに問い合わせます...")

    videos = {}
    for i in range(0, len(video_ids), CHUNK_SIZE):
        chunk = video_ids[i:i + CHUNK_SIZE]
        videos.update(fetch_chunk(chunk, api_key))

    missing = [vid for vid in video_ids if vid not in videos]
    if missing:
        print(
            f"警告: {len(missing)}件の動画がAPIレスポンスに含まれませんでした"
            f"(削除・非公開等の可能性があります): {missing}",
            file=sys.stderr,
        )

    with_maxres = [vid for vid, v in videos.items() if "maxres" in v["thumbnails"]]
    without_maxres = [vid for vid, v in videos.items() if "maxres" not in v["thumbnails"]]
    print(f"maxresサムネイルあり: {len(with_maxres)}件 / なし: {len(without_maxres)}件")

    output = {
        # 取得日時(UTC)。閲覧数の「◯月◯日時点」表示(JST変換は表示側で行う、
        # #192第3段)・週次再生成の差分追跡に使う。
        "fetched_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "video_count_requested": len(video_ids),
        "video_count_fetched": len(videos),
        "missing_video_ids": missing,
        "videos": videos,
    }

    out_path = pathlib.Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{out_path} に{len(videos)}件を書き出しました。")


if __name__ == "__main__":
    main()
