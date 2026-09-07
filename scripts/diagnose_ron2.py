#!/usr/bin/env python3
"""GitHub Actions から ron2.jp のどのURLに到達できるかを確認する診断用スクリプト。

REST API (/wp-json/) が403で弾かれる一方、画像 (/wp/wp-content/) は
リンク切れ検知で正常に取得できている。この違いが
「/wp-json だけの制限」なのか「PHPを通るページ全体の制限」なのかを切り分ける。

  - 静的ファイルのみ通る → PHP経由のページは全滅。HTML解析への切り替えも不可
  - HTMLページは通る     → 選手ページのHTMLを解析する方式に変更できる

原因が分かったら、このスクリプトとワークフローは削除してよい。

使い方:
    python3 scripts/diagnose_ron2.py
"""
import sys
import time
import urllib.error
import urllib.request

BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
)

TARGETS = [
    ("静的: robots.txt", "https://ron2.jp/robots.txt"),
    ("静的: 選手画像(150x150)",
     "https://ron2.jp/wp/wp-content/uploads/2022/07/773Aizawa320x240-150x150.jpg"),
    ("PHP: トップページ", "https://ron2.jp/"),
    ("PHP: 選手ページHTML", "https://ron2.jp/pro/6010/"),
    ("PHP: 選手一覧HTML", "https://ron2.jp/pro/"),
    ("API: ルート", "https://ron2.jp/wp-json/"),
    ("API: 選手1件のみ", "https://ron2.jp/wp-json/wp/v2/pro?per_page=1"),
    ("API: 選手1件+embed", "https://ron2.jp/wp-json/wp/v2/pro?include=6010&_embed=1"),
    ("API: 選手100件", "https://ron2.jp/wp-json/wp/v2/pro?per_page=100&page=1&_embed=1"),
]

HEADERS = {
    "User-Agent": BROWSER_UA,
    "Accept": "text/html,application/xhtml+xml,application/json,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
}


def probe(url):
    req = urllib.request.Request(url, method="GET", headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            body = res.read(200)
            return res.status, len(body), res.headers.get("Server", ""), ""
    except urllib.error.HTTPError as e:
        note = ""
        try:
            text = e.read().decode("utf-8", "replace")
            if "wordfence" in text.lower():
                note = "Wordfenceによる遮断"
            elif text.strip():
                note = text.strip()[:80].replace("\n", " ")
            else:
                note = "応答本文なし"
        except Exception:
            pass
        return e.code, 0, (e.headers.get("Server", "") if e.headers else ""), note
    except Exception as e:
        return None, 0, "", f"{type(e).__name__}: {e}"


def main():
    print(f"{'対象':<24}{'状態':<8}{'Server':<14}備考")
    print("-" * 78)
    for label, url in TARGETS:
        status, size, server, note = probe(url)
        mark = "OK" if status == 200 else str(status or "接続不可")
        print(f"{label:<24}{mark:<8}{server[:12]:<14}{note}")
        time.sleep(1)

    print()
    print("判定の目安:")
    print("  静的だけOK  → PHPを通るページは全て遮断。連盟側での許可設定が必要")
    print("  HTMLもOK    → /wp-json のみの制限。HTML解析方式に切り替え可能")
    print("  全てOK      → 一時的な遮断だった可能性。再実行で解消するかも")
    return 0


if __name__ == "__main__":
    sys.exit(main())
