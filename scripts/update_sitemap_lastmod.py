#!/usr/bin/env python3
"""サイトマップ内の指定ページのlastmodを当日日付(JST)に更新する。

再生成したページ全部ではなく、実際に差分が出たページだけを当日日付に
したいため、対象ファイルのパスは呼び出し側(regenerate-page.ymlや手動実行)
が判断して渡す。

#162でサイトマップインデックス方式に変えたため、ページのパスから
どちらのサイトマップ(sitemap-pages.xml / sitemap-wayhome.xml)を
更新すべきかを判定する。ルート直下のファイル名(例: jpml_titles.html)は
sitemap-pages.xml、"wayhome/"配下のパス(例: wayhome/AbC123.html)は
sitemap-wayhome.xmlが対象。sitemap-wayhome.xml自体はscripts/
generate_wayhome_episodes.pyが書き出す(このスクリプトは既存エントリの
lastmodを書き換えるだけで、エントリの追加・削除は行わない)。

使い方:
    python3 scripts/update_sitemap_lastmod.py jpml_titles.html wayhome/AbC123.html
"""
import argparse
import pathlib
import re
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

REPO_ROOT = pathlib.Path(__file__).parent.parent
SITEMAP_PAGES = REPO_ROOT / "sitemap-pages.xml"
SITEMAP_WAYHOME = REPO_ROOT / "sitemap-wayhome.xml"


def url_for(page_path):
    if page_path == "index.html":
        return "https://ryoei.pro/"
    return f"https://ryoei.pro/{page_path}"


def sitemap_for(page_path) -> pathlib.Path:
    if page_path.startswith("wayhome/"):
        return SITEMAP_WAYHOME
    return SITEMAP_PAGES


def update_lastmod(text, page_path, today):
    url = url_for(page_path)
    pattern = re.compile(
        r"(<loc>" + re.escape(url) + r"</loc>\s*<lastmod>)(\d{4}-\d{2}-\d{2})(</lastmod>)"
    )
    match = pattern.search(text)
    if not match:
        print(f"{page_path}: 対象のサイトマップにURLが見つかりません。スキップします。", file=sys.stderr)
        return text, False

    old_date = match.group(2)
    if old_date == today:
        return text, False

    new_text = text[:match.start()] + match.group(1) + today + match.group(3) + text[match.end():]
    print(f"{page_path}: {old_date} → {today}", file=sys.stderr)
    return new_text, True


def main():
    ap = argparse.ArgumentParser(description="サイトマップのlastmodを当日日付(JST)に更新する")
    ap.add_argument("pages", nargs="+", metavar="PAGE", help="更新対象のページパス(複数可。例: jpml_titles.html wayhome/AbC123.html)")
    args = ap.parse_args()

    today = datetime.now(ZoneInfo("Asia/Tokyo")).strftime("%Y-%m-%d")

    by_sitemap = {}
    for page_path in args.pages:
        by_sitemap.setdefault(sitemap_for(page_path), []).append(page_path)

    for sitemap_path, page_paths in by_sitemap.items():
        if not sitemap_path.exists():
            print(f"{sitemap_path}: ファイルが存在しません。スキップします。", file=sys.stderr)
            continue
        text = sitemap_path.read_text(encoding="utf-8")
        changed = False
        for page_path in page_paths:
            text, did_change = update_lastmod(text, page_path, today)
            changed = changed or did_change
        if changed:
            sitemap_path.write_text(text, encoding="utf-8")

    return 0


if __name__ == "__main__":
    sys.exit(main())
