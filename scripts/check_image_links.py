#!/usr/bin/env python3
"""jpml_pros.html に埋め込まれたプロフィール画像のリンク切れを検知する。

選手のプロフィール画像は7つの外部ドメインに依存しており、
先方の都合(アカウント削除、画像差し替え、URL仕様変更など)で
いつ切れてもおかしくない。ページ側では代替アイコンに差し替わるため
見た目は壊れないが、そのぶん気づきにくい。

このスクリプトは全画像URLにHEADリクエストを送り、
取得できなかったものを一覧にする。GitHub Actions から定期実行し、
結果を issue に書き出す想定。

使い方:
    python3 scripts/check_image_links.py            # 結果を標準出力へ
    python3 scripts/check_image_links.py --json out.json
"""
import argparse
import collections
import json
import pathlib
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

REPO_ROOT = pathlib.Path(__file__).parent.parent
TARGET_HTML = REPO_ROOT / "jpml_pros.html"

# 相手サーバーへの負荷を抑えるための設定
MAX_WORKERS = 8          # 全体の同時接続数
PER_HOST_INTERVAL = 0.2  # 同一ホストへの最小間隔(秒)
TIMEOUT = 15
USER_AGENT = (
    "Mozilla/5.0 (compatible; ryoei.pro link checker; "
    "+https://ryoei.pro/jpml_pros.html)"
)

_host_locks = collections.defaultdict(threading.Lock)
_host_last_access = {}


def extract_images(html_path: pathlib.Path):
    """(画像URL, alt文字列) の一覧を返す。altには「選手名 サービス名」が入っている"""
    html = html_path.read_text(encoding="utf-8")
    pattern = re.compile(r'<img[^>]*alt="([^"]*)"[^>]*src="(https?://[^"]+)"')
    return [(url, alt) for alt, url in pattern.findall(html)]


def host_of(url: str) -> str:
    return re.sub(r"https?://([^/]+).*", r"\1", url)


def throttle(host: str):
    """同じホストへの連続アクセスに最小間隔を空ける"""
    with _host_locks[host]:
        last = _host_last_access.get(host)
        if last is not None:
            wait = PER_HOST_INTERVAL - (time.monotonic() - last)
            if wait > 0:
                time.sleep(wait)
        _host_last_access[host] = time.monotonic()


def check(url: str, alt: str):
    """1件確認する。(url, alt, status) を返す。statusはHTTPコードかエラー内容"""
    host = host_of(url)
    throttle(host)

    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
            return url, alt, res.status
    except urllib.error.HTTPError as e:
        # HEADを受け付けないサーバーがあるため、405/501はGETで再確認する
        if e.code in (405, 501):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
                with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
                    return url, alt, res.status
            except Exception as e2:
                return url, alt, f"GET: {e2}"
        return url, alt, e.code
    except Exception as e:
        return url, alt, f"{type(e).__name__}: {e}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", help="結果をJSONで書き出すパス")
    args = parser.parse_args()

    images = extract_images(TARGET_HTML)
    print(f"{len(images)}件の画像URLを確認します...", file=sys.stderr)

    results = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        for i, r in enumerate(pool.map(lambda a: check(*a), images), 1):
            results.append(r)
            if i % 200 == 0:
                print(f"  {i}/{len(images)}", file=sys.stderr)

    broken = [r for r in results if r[2] != 200]
    by_host = collections.Counter(host_of(u) for u, _, _ in broken)
    by_status = collections.Counter(str(s) for _, _, s in broken)

    print(f"\n確認: {len(results)}件 / 失敗: {len(broken)}件")
    if broken:
        print("\nホスト別:")
        for h, n in by_host.most_common():
            print(f"  {h}: {n}件")
        print("\nステータス別:")
        for s, n in by_status.most_common():
            print(f"  {s}: {n}件")
        print("\n詳細:")
        for url, alt, status in sorted(broken, key=lambda r: (host_of(r[0]), r[1])):
            print(f"  [{status}] {alt} — {url}")

    if args.json:
        pathlib.Path(args.json).write_text(
            json.dumps(
                {
                    "checked": len(results),
                    "broken": [
                        {"url": u, "alt": a, "status": str(s)} for u, a, s in broken
                    ],
                    "by_host": dict(by_host),
                    "by_status": dict(by_status),
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

    # リンク切れがあっても異常終了はしない。通知はissueで行う。
    return 0


if __name__ == "__main__":
    sys.exit(main())
