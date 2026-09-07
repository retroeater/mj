#!/usr/bin/env python3
"""龍龍(ron2.jp)から、全選手の150x150サイズの画像URLを収集する。

サイト側は原寸(320x240など)を48x48で表示している選手が多く、
転送量の無駄になっている。スプレッドシートのURLを150x150版に
統一するため、龍龍IDのある全員分の現在のURLを一度に集める。

ron2.jp は /wp-json/ が403で使えないため、選手ページ
(/pro/<ID>/) のHTMLを解析する。1人1リクエストになるので
間隔を空けて順に取得する(845人でおよそ15分)。

出力はスプレッドシートに貼り付けやすいCSV。

使い方:
    python3 scripts/collect_ron2_images.py                 # 標準出力へCSV
    python3 scripts/collect_ron2_images.py -o urls.csv     # ファイルへ
    python3 scripts/collect_ron2_images.py --limit 5       # 動作確認用
"""
import argparse
import csv
import html as html_mod
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

REPO_ROOT = pathlib.Path(__file__).parent.parent
TARGET_HTML = REPO_ROOT / "jpml_pros.html"

PROFILE_URL = "https://ron2.jp/pro/{id}/"
REQUEST_INTERVAL = 1.0
TIMEOUT = 30

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

SITE_PATTERN = re.compile(
    r'<a href="https://ron2\.jp/pro/([^"/]+)/?"[^>]*>\s*'
    r'<img[^>]*alt="([^"]*)"[^>]*src="([^"]+)"'
)
RON2_NAME = re.compile(r"<h2[^>]*class=['\"]pro-name['\"][^>]*>(.*?)</h2>", re.S)
RON2_IMAGE = re.compile(
    r"<h2[^>]*class=['\"]pro-name['\"].*?<img[^>]*src=[\"']([^\"']+)[\"']", re.S
)


def load_site_players():
    """サイトに載っている {龍龍ID: (選手名, 現在のURL)} を返す"""
    page = TARGET_HTML.read_text(encoding="utf-8")
    result = {}
    for pro_id, alt, url in SITE_PATTERN.findall(page):
        result[str(pro_id)] = (alt.replace(" 龍龍", "").strip(), url)
    return result


def fetch_image_url(pro_id):
    """選手ページから画像URLを取り出す。戻り値: (画像URL, エラー内容)"""
    url = PROFILE_URL.format(id=pro_id)
    req = urllib.request.Request(url, headers=REQUEST_HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
            page = res.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:
        return None, type(e).__name__

    m = RON2_IMAGE.search(page)
    if not m:
        if RON2_NAME.search(page):
            return None, "画像なし"
        return None, "解析できず"
    return html_mod.unescape(m.group(1)).strip(), None


def is_150(url):
    """150x150版かどうか"""
    return bool(re.search(r"-150x150\.[a-zA-Z0-9]+$", url or ""))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-o", "--output", help="CSVの出力先(省略時は標準出力)")
    parser.add_argument("--limit", type=int, help="取得する人数の上限(動作確認用)")
    args = parser.parse_args()

    players = sorted(load_site_players().items(), key=lambda kv: int(kv[0]))
    if args.limit:
        players = players[: args.limit]

    total = len(players)
    print(f"{total}人分を取得します(およそ{int(total * REQUEST_INTERVAL / 60)}分)",
          file=sys.stderr)

    rows = []
    stats = {"changed": 0, "same": 0, "not_150": 0, "error": 0}
    consecutive_errors = 0

    for i, (pro_id, (name, current)) in enumerate(players, 1):
        if i > 1:
            time.sleep(REQUEST_INTERVAL)
        if i % 100 == 0:
            print(f"  {i}/{total}", file=sys.stderr)

        new_url, error = fetch_image_url(pro_id)

        if error:
            consecutive_errors += 1
            if consecutive_errors >= 20:
                print("\n連続20件で失敗したため中断します。遮断された可能性があります。",
                      file=sys.stderr)
                raise SystemExit(1)
            stats["error"] += 1
            rows.append([pro_id, name, current, "", error])
            continue

        consecutive_errors = 0
        if not is_150(new_url):
            # 龍龍側が150x150を持っていない(元画像が150px未満など)
            stats["not_150"] += 1
            note = "150x150版なし"
        elif urllib.parse.unquote(new_url) == urllib.parse.unquote(current):
            stats["same"] += 1
            note = "変更なし"
        else:
            stats["changed"] += 1
            note = "要更新"
        rows.append([pro_id, name, current, new_url, note])

    out = open(args.output, "w", encoding="utf-8-sig", newline="") if args.output else sys.stdout
    try:
        writer = csv.writer(out)
        writer.writerow(["龍龍ID", "選手名", "現在のURL", "150x150のURL", "備考"])
        writer.writerows(rows)
    finally:
        if args.output:
            out.close()

    print(f"\n取得: {total}件", file=sys.stderr)
    print(f"  要更新(URLが変わる): {stats['changed']}件", file=sys.stderr)
    print(f"  変更なし: {stats['same']}件", file=sys.stderr)
    print(f"  150x150版なし: {stats['not_150']}件", file=sys.stderr)
    print(f"  取得失敗: {stats['error']}件", file=sys.stderr)
    if args.output:
        print(f"\n{args.output} に書き出しました。", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
