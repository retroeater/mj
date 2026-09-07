#!/usr/bin/env python3
"""龍龍(ron2.jp)の現在のプロフィール画像と、
jpml_pros.html で表示している画像が一致しているかを確認する。

画像URLが生きていても、龍龍側で写真が差し替えられていると
サイトには古い写真が表示され続ける。この食い違いは
リンク切れ検知(check_image_links.py)では拾えないため別に確認する。

当初は WordPress REST API (/wp-json/wp/v2/pro) を使う実装だったが、
ron2.jp では nginx の段階で /wp-json/ が403になるため使えない。
HTMLページ (/pro/<ID>/) は200で取得できるので、そちらを解析する。
1人1リクエストになるので、間隔を空けて順に取得する。

使い方:
    python3 scripts/check_ron2_images.py
    python3 scripts/check_ron2_images.py --json out.json
    python3 scripts/check_ron2_images.py --limit 5   # 動作確認用に件数を絞る
"""
import argparse
import html as html_mod
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request

REPO_ROOT = pathlib.Path(__file__).parent.parent
TARGET_HTML = REPO_ROOT / "jpml_pros.html"

PROFILE_URL = "https://ron2.jp/pro/{id}/"
REQUEST_INTERVAL = 1.0   # 相手サーバーへの配慮。1人あたり1秒あける
TIMEOUT = 30

# ボットらしいUser-Agentは弾かれることがあるため、通常のブラウザとして振る舞う
USER_AGENT = os.environ.get(
    "RON2_USER_AGENT",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
)
REQUEST_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
}

# サイト側: <a href="https://ron2.jp/pro/6010"><img alt="合澤雄貴 龍龍" src="...">
SITE_PATTERN = re.compile(
    r'<a href="https://ron2\.jp/pro/([^"/]+)/?"[^>]*>\s*'
    r'<img[^>]*alt="([^"]*)"[^>]*src="([^"]+)"'
)

# 龍龍側: <h2 class='pro-name'>合澤 雄貴（あいざわ ゆうき）</h2><img src="..." width="150" />
RON2_NAME = re.compile(r"<h2[^>]*class=['\"]pro-name['\"][^>]*>(.*?)</h2>", re.S)
RON2_IMAGE = re.compile(
    r"<h2[^>]*class=['\"]pro-name['\"].*?<img[^>]*src=[\"']([^\"']+)[\"']", re.S
)


def load_site_images():
    """サイトで表示中の画像を {龍龍ID: (選手名, 画像URL)} で返す"""
    page = TARGET_HTML.read_text(encoding="utf-8")
    result = {}
    for pro_id, alt, url in SITE_PATTERN.findall(page):
        name = alt.replace(" 龍龍", "").strip()
        result[str(pro_id)] = (name, url)
    return result


def parse_profile(page):
    """選手ページのHTMLから (選手名, 画像URL) を取り出す"""
    name_m = RON2_NAME.search(page)
    img_m = RON2_IMAGE.search(page)
    name = html_mod.unescape(re.sub(r"<[^>]+>", "", name_m.group(1))).strip() if name_m else None
    url = html_mod.unescape(img_m.group(1)).strip() if img_m else None
    return name, url


def fetch_profile(pro_id):
    """1人分の選手ページを取得して解析する。
    戻り値: (選手名, 画像URL, エラー内容)"""
    url = PROFILE_URL.format(id=pro_id)
    req = urllib.request.Request(url, headers=REQUEST_HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
            page = res.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return None, None, f"HTTP {e.code}"
    except Exception as e:
        return None, None, f"{type(e).__name__}"

    name, img = parse_profile(page)
    if name is None and img is None:
        # ページは取れたが構造が想定と違う。龍龍側のデザイン変更が疑われる
        return None, None, "解析できず(HTML構造の変更?)"
    return name, img, None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", help="結果をJSONで書き出すパス")
    parser.add_argument("--limit", type=int, help="確認する人数の上限(動作確認用)")
    args = parser.parse_args()

    site = load_site_images()
    targets = sorted(site.items())
    if args.limit:
        targets = targets[: args.limit]

    total = len(targets)
    est = int(total * REQUEST_INTERVAL / 60)
    print(f"{total}人分の選手ページを確認します(所要およそ{est}分)", file=sys.stderr)

    mismatched, not_found, unparsable, no_image = [], [], [], []
    consecutive_errors = 0

    for i, (pro_id, (name, site_url)) in enumerate(targets, 1):
        if i > 1:
            time.sleep(REQUEST_INTERVAL)
        if i % 100 == 0:
            print(f"  {i}/{total}", file=sys.stderr)

        ron2_name, ron2_url, error = fetch_profile(pro_id)
        entry = {"id": pro_id, "name": name, "site_url": site_url}

        if error:
            consecutive_errors += 1
            # 一時的な失敗ではなく遮断されている場合、残りを続けても無意味なので止める
            if consecutive_errors >= 20:
                print(f"\n連続20件で失敗したため中断します(最後のエラー: {error})", file=sys.stderr)
                print("  遮断されている可能性があります。", file=sys.stderr)
                raise SystemExit(1)
            if error.startswith("HTTP 404"):
                not_found.append(entry)
            else:
                entry["error"] = error
                unparsable.append(entry)
            continue

        consecutive_errors = 0
        if not ron2_url:
            no_image.append(entry)
        elif ron2_url != site_url:
            entry["current_url"] = ron2_url
            entry["ron2_name"] = ron2_name
            mismatched.append(entry)

    print(f"\n確認: {total}件")
    print(f"  画像が差し替わっている: {len(mismatched)}件")
    print(f"  ページが見つからない(404): {len(not_found)}件")
    print(f"  龍龍側に画像がない: {len(no_image)}件")
    print(f"  取得・解析に失敗: {len(unparsable)}件")

    if mismatched:
        print("\n[画像の差し替え]")
        for m in mismatched:
            print(f"  {m['name']} (ID:{m['id']})")
            print(f"    現在サイト: {m['site_url']}")
            print(f"    龍龍の最新: {m['current_url']}")
    for label, items in (("[ページが見つからない]", not_found),
                         ("[龍龍側に画像がない]", no_image),
                         ("[取得・解析に失敗]", unparsable)):
        if items:
            print(f"\n{label}")
            for m in items:
                suffix = f" — {m['error']}" if m.get("error") else ""
                print(f"  {m['name']} (ID:{m['id']}){suffix}")

    if args.json:
        pathlib.Path(args.json).write_text(
            json.dumps({
                "checked": total,
                "mismatched": mismatched,
                "not_found": not_found,
                "no_image": no_image,
                "unparsable": unparsable,
            }, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
