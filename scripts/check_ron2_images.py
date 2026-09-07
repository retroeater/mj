#!/usr/bin/env python3
"""龍龍(ron2.jp)の現在のプロフィール画像と、
jpml_pros.html で表示している画像が一致しているかを確認する。

画像URLが生きていても、龍龍側で写真が差し替えられていると
サイトには古い写真が表示され続ける。この食い違いは
リンク切れ検知(check_image_links.py)では拾えないため別に確認する。

ron2.jp は WordPress で動いており、選手データは `pro` という
カスタム投稿タイプで公開されている。REST API を使えば
per_page=100 で1リクエストあたり100人分を取得できるので、
845人でも9リクエストで済む。個別ページを845回取得するより
相手サーバーへの負荷が桁違いに小さい。

使い方:
    python3 scripts/check_ron2_images.py
    python3 scripts/check_ron2_images.py --json out.json
"""
import argparse
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

REPO_ROOT = pathlib.Path(__file__).parent.parent
TARGET_HTML = REPO_ROOT / "jpml_pros.html"

API_BASE = "https://ron2.jp/wp-json/wp/v2/pro"
PER_PAGE = 100
REQUEST_INTERVAL = 1.0   # 相手サーバーへの配慮。1秒あけて順に取得する
TIMEOUT = 30
USER_AGENT = (
    "Mozilla/5.0 (compatible; ryoei.pro image sync checker; "
    "+https://ryoei.pro/jpml_pros.html)"
)

# サイト側: <a href="https://ron2.jp/pro/6010"><img alt="合澤雄貴 龍龍" src="...">
SITE_PATTERN = re.compile(
    r'<a href="https://ron2\.jp/pro/([^"/]+)/?"[^>]*>\s*'
    r'<img[^>]*alt="([^"]*)"[^>]*src="([^"]+)"'
)


def load_site_images():
    """サイトで表示中の画像を {龍龍ID: (選手名, 画像URL)} で返す"""
    html = TARGET_HTML.read_text(encoding="utf-8")
    result = {}
    for pro_id, alt, url in SITE_PATTERN.findall(html):
        name = alt.replace(" 龍龍", "").strip()
        result[str(pro_id)] = (name, url)
    return result


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        return json.loads(res.read().decode("utf-8")), res.headers


def fetch_ron2_images():
    """龍龍APIから {龍龍ID: (選手名, 150x150画像URL)} を取得する"""
    result = {}
    page = 1
    total_pages = None

    while True:
        params = urllib.parse.urlencode({"per_page": PER_PAGE, "page": page, "_embed": "1"})
        url = f"{API_BASE}?{params}"
        print(f"  取得中: page {page}" + (f"/{total_pages}" if total_pages else ""), file=sys.stderr)

        try:
            data, headers = fetch_json(url)
        except urllib.error.HTTPError as e:
            if e.code == 400 and total_pages is not None:
                break  # ページ範囲を超えた
            raise

        if total_pages is None:
            total_pages = int(headers.get("X-WP-TotalPages", 0)) or None

        if not data:
            break

        for item in data:
            pro_id = str(item.get("id"))
            name = (item.get("acf") or {}).get("name", "")
            thumb = None
            media = (item.get("_embedded") or {}).get("wp:featuredmedia") or []
            if media and isinstance(media[0], dict):
                sizes = ((media[0].get("media_details") or {}).get("sizes") or {})
                thumb = (sizes.get("thumbnail") or {}).get("source_url")
            result[pro_id] = (name, thumb)

        if total_pages and page >= total_pages:
            break
        page += 1
        time.sleep(REQUEST_INTERVAL)

    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", help="結果をJSONで書き出すパス")
    args = parser.parse_args()

    site = load_site_images()
    print(f"サイト側: {len(site)}件の龍龍画像", file=sys.stderr)

    print("龍龍APIから現在の画像を取得します...", file=sys.stderr)
    ron2 = fetch_ron2_images()
    print(f"龍龍API: {len(ron2)}件", file=sys.stderr)

    mismatched = []   # 画像が差し替わっている
    missing_api = []  # 龍龍側に選手が見つからない
    no_thumb = []     # 龍龍側に画像が設定されていない

    for pro_id, (name, site_url) in sorted(site.items()):
        if pro_id not in ron2:
            missing_api.append({"id": pro_id, "name": name, "site_url": site_url})
            continue
        api_name, api_url = ron2[pro_id]
        if not api_url:
            no_thumb.append({"id": pro_id, "name": name, "site_url": site_url})
        elif api_url != site_url:
            mismatched.append({
                "id": pro_id, "name": name or api_name,
                "site_url": site_url, "current_url": api_url,
            })

    print(f"\n確認: {len(site)}件")
    print(f"  画像が差し替わっている: {len(mismatched)}件")
    print(f"  龍龍側に選手が見つからない: {len(missing_api)}件")
    print(f"  龍龍側に画像が未設定: {len(no_thumb)}件")

    if mismatched:
        print("\n[画像の差し替え]")
        for m in mismatched:
            print(f"  {m['name']} (ID:{m['id']})")
            print(f"    現在サイト: {m['site_url']}")
            print(f"    龍龍の最新: {m['current_url']}")
    if missing_api:
        print("\n[龍龍側に見つからない]")
        for m in missing_api:
            print(f"  {m['name']} (ID:{m['id']})")
    if no_thumb:
        print("\n[龍龍側に画像が未設定]")
        for m in no_thumb:
            print(f"  {m['name']} (ID:{m['id']})")

    if args.json:
        pathlib.Path(args.json).write_text(
            json.dumps({
                "checked": len(site),
                "mismatched": mismatched,
                "missing_api": missing_api,
                "no_thumb": no_thumb,
            }, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
