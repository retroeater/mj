#!/usr/bin/env python3
"""sitemap.xml内の指定ページのlastmodを当日日付(JST)に更新する。

再生成したページ全部ではなく、実際に差分が出たページだけを当日日付に
したいため、対象ファイル名は呼び出し側(regenerate-page.ymlや手動実行)
が判断して渡す。

使い方:
    python3 scripts/update_sitemap_lastmod.py jpml_titles.html jpml_pros.html
"""
import argparse
import pathlib
import re
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

REPO_ROOT = pathlib.Path(__file__).parent.parent
SITEMAP = REPO_ROOT / "sitemap.xml"


def url_for(filename):
    if filename == "index.html":
        return "https://ryoei.pro/"
    return f"https://ryoei.pro/{filename}"


def update_lastmod(text, filename, today):
    url = url_for(filename)
    pattern = re.compile(
        r"(<loc>" + re.escape(url) + r"</loc>\s*<lastmod>)(\d{4}-\d{2}-\d{2})(</lastmod>)"
    )
    match = pattern.search(text)
    if not match:
        print(f"{filename}: sitemap.xmlに対象URLが見つかりません。スキップします。", file=sys.stderr)
        return text, False

    old_date = match.group(2)
    if old_date == today:
        return text, False

    new_text = text[:match.start()] + match.group(1) + today + match.group(3) + text[match.end():]
    print(f"{filename}: {old_date} → {today}", file=sys.stderr)
    return new_text, True


def main():
    ap = argparse.ArgumentParser(description="sitemap.xmlのlastmodを当日日付(JST)に更新する")
    ap.add_argument("pages", nargs="+", metavar="PAGE", help="更新対象のHTMLファイル名(複数可)")
    args = ap.parse_args()

    today = datetime.now(ZoneInfo("Asia/Tokyo")).strftime("%Y-%m-%d")
    text = SITEMAP.read_text(encoding="utf-8")

    changed = False
    for filename in args.pages:
        text, did_change = update_lastmod(text, filename, today)
        changed = changed or did_change

    if changed:
        SITEMAP.write_text(text, encoding="utf-8")

    return 0


if __name__ == "__main__":
    sys.exit(main())
