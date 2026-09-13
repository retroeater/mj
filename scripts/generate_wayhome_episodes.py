#!/usr/bin/env python3
"""「帰り道」エピソード個別ページ(wayhome/<動画ID>.html)を静的生成する(#162)。

video_wayhome.html(一覧)の新サイトパイロット(#102第2段)の延長として、
選手個別ページ(#101、新サイト)のURL設計・sitemap・canonical等を
38ページの規模で先に検証する。詳細な設計判断はissue #162本文・
docs/new-site-design.md「12. パイロット: video_wayhome」参照。

最新話判定・サムネイル解決・uploadDate変換・VideoObject組み立ては
generate_video_wayhome.py(一覧)と共有するため scripts/lib/wayhome.py に
ある。lib/page.py の render_content() を使う(表を持たないページ向け)。

出力先の wayhome/ はこのスクリプトが所有する。シートに無くなった
動画IDのファイルは削除する。sitemap-wayhome.xml も同様にこのスクリプトが
書き出す(既存の<lastmod>は、URLが既に存在していた場合はそのまま残し、
新規URLだけ当日日付にする。実際に差分が出たページを当日日付にする役目は
これまでどおり scripts/update_sitemap_lastmod.py が担う)。

使い方:
    python3 scripts/generate_wayhome_episodes.py
"""
import json
import pathlib
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, esc, render_content  # noqa: E402
from lib.sheets import fetch_sheet  # noqa: E402
from lib import wayhome  # noqa: E402

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_DIR = REPO_ROOT / "wayhome"
SITEMAP_PATH = REPO_ROOT / "sitemap-wayhome.xml"

# エピソード個別ページはサブディレクトリ(wayhome/)にあるため、
# 共通アセット・一覧ページへのリンクは1階層上を指す(#162、lib/page.pyの
# asset_prefix)。同じディレクトリ内の他エピソードへのリンクはファイル名
# だけでよい(接頭辞不要)。
ASSET_PREFIX = "../"


def build_prevnext_link(row, direction_label: str) -> str:
    interviewee, x_id, published_date, title, url, image_url = row
    video_id = wayhome.video_id_from_watch_url(url)
    name = f"{title} {interviewee}".strip()
    return (
        f'\t<a class="mj-video-prevnext-link" href="{esc(video_id)}.html">'
        f'<span class="mj-video-prevnext-dir">{esc(direction_label)}</span>'
        f'<span class="mj-video-prevnext-title">{esc(name)}</span></a>'
    )


def build_related_card_html(row) -> str:
    interviewee, x_id, published_date, title, url, image_url = row
    video_id = wayhome.video_id_from_watch_url(url)
    alt = f"{title} {interviewee}" if interviewee else (title or "")
    return (
        '<li class="mj-video-card">\n'
        f'\t<a class="mj-video-card-link" href="{esc(video_id)}.html">\n'
        f'\t\t<img class="mj-video-card-img" alt="{esc(alt)}" loading="lazy" width="160" height="90" '
        f'src="{esc(image_url)}" data-fallback="{ASSET_PREFIX}img/125_arr_hoso.png" />\n'
        f'\t\t<span class="mj-video-card-date">{esc(published_date)}</span>\n'
        f'\t\t<span class="mj-video-card-title">{esc(title)}</span>\n'
        f'\t\t<span class="mj-video-card-name">{esc(interviewee)}</span>\n'
        "\t</a>\n"
        "</li>"
    )


def build_body_html(row, is_latest, prev_row, next_row, same_player_rows, thumb_url, width, height) -> str:
    """#162: ヒーロー(サムネイル+基本情報) + 前後のエピソード + 同じ選手の
    他エピソード、の3ブロックで組み立てる。ヒーローの構成は
    generate_video_wayhome.py の build_hero_html() と同じ考え方
    (ページのカラートークンとは独立して常に明色固定)。"""
    interviewee, x_id, published_date, title, url, image_url = row
    name = f"{title} {interviewee}".strip()

    badge = '<span class="mj-video-hero-badge">最新話</span>' if is_latest else ""

    actions = [
        f'<a class="mj-video-btn mj-video-btn-primary" href="{esc(url)}" target="_blank">'
        f'<span aria-hidden="true">▶</span> YouTubeで再生</a>'
    ]
    if x_id:
        actions.append(f'<a class="mj-video-btn" href="https://x.com/{esc(x_id)}" target="_blank">X @{esc(x_id)}</a>')
    actions.append('<button type="button" class="mj-video-btn" id="copyUrlBtn">URLをコピー</button>')
    actions.append(f'<a class="mj-video-btn" href="{ASSET_PREFIX}video_wayhome.html">一覧へ戻る</a>')

    hero_html = (
        '<section class="mj-video-hero">\n'
        f'\t<img class="mj-video-hero-bg" src="{esc(thumb_url)}" alt="" width="{width}" height="{height}" '
        f'fetchpriority="high" />\n'
        '\t<div class="mj-video-hero-scrim"></div>\n'
        '\t<div class="mj-video-hero-content">\n'
        f'\t\t<p class="mj-video-series-name"><a href="{ASSET_PREFIX}video_wayhome.html">{esc(wayhome.SERIES_NAME)}</a></p>\n'
        f'\t\t<h1 class="mj-video-hero-player">{esc(name)}</h1>\n'
        f'\t\t<p class="mj-video-hero-meta">{badge}<span>{esc(published_date)}</span></p>\n'
        f'\t\t<p class="mj-video-hero-desc">{esc(wayhome.episode_description(row))}</p>\n'
        f'\t\t<div class="mj-video-hero-actions">{"".join(actions)}</div>\n'
        '\t\t<p id="copyStatus" class="visually-hidden" role="status" aria-live="polite"></p>\n'
        "\t</div>\n"
        "</section>\n"
    )

    sections = [hero_html]

    prevnext_links = []
    if prev_row is not None:
        prevnext_links.append(build_prevnext_link(prev_row, "前のエピソード"))
    if next_row is not None:
        prevnext_links.append(build_prevnext_link(next_row, "次のエピソード"))
    if prevnext_links:
        sections.append(
            '<nav class="mj-video-episodes mj-video-prevnext" aria-label="前後のエピソード">\n'
            + "\n".join(prevnext_links)
            + "\n</nav>\n"
        )

    if same_player_rows:
        cards_html = "\n".join(build_related_card_html(r) for r in same_player_rows)
        sections.append(
            '<section class="mj-video-episodes">\n'
            '\t<div class="mj-video-episodes-head">\n'
            f'\t\t<h2 class="mj-video-episodes-heading">{esc(interviewee)}の他のエピソード（{len(same_player_rows)}件）</h2>\n'
            "\t</div>\n"
            f'\t<ul class="mj-video-track">\n{cards_html}\n\t</ul>\n'
            "</section>\n"
        )

    # id="main"・tabindex="-1"はrender_content()のスキップリンク(#182)の
    # 飛び先。この<main>はbody_html側で組み立てるためwrap_main=Falseのまま
    # (二重<main>を避ける)、ここで直接付ける。
    return '<main class="mj-video-page" id="main" tabindex="-1">\n' + "\n".join(sections) + "</main>\n"


def build_json_ld(row, video_id, thumb_url) -> str:
    """VideoObject(そのエピソード) + BreadcrumbList(一覧 > このエピソード)。
    VideoObjectの組み立てはgenerate_video_wayhome.pyと共有(lib/wayhome.py)。"""
    video_object = wayhome.build_video_object(row, thumb_url)
    breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem", "position": 1,
                "name": wayhome.SERIES_NAME, "item": "https://ryoei.pro/video_wayhome.html",
            },
            {
                "@type": "ListItem", "position": 2,
                "name": video_object["name"], "item": wayhome.episode_url(video_id),
            },
        ],
    }
    blocks = []
    for obj in (video_object, breadcrumb):
        raw = json.dumps(obj, ensure_ascii=False).replace("</", "<\\/")
        blocks.append(f'<script type="application/ld+json">{raw}</script>')
    return "\n".join(blocks)


def build_meta(row, video_id, thumb_url, width, height) -> PageMeta:
    interviewee, x_id, published_date, title, url, image_url = row
    name = f"{title} {interviewee}".strip()
    page_url = wayhome.episode_url(video_id)
    return PageMeta(
        title=f"{title} {interviewee} | {wayhome.SERIES_NAME} | ryoei.pro",
        description=wayhome.episode_description(row),
        og_url=page_url,
        h1=name,  # render_content()では使わない(body_html側で組み立てる)。整合のため残す
        caption="",  # render_content()では使わない(表を持たないため)
        og_image=thumb_url,
        og_image_width=width,
        og_image_height=height,
        og_image_alt=name,
        # #113の判断(canonicalなし)の例外(#162)。個別ページは?name=等の
        # 変種を持たず、#113が懸念した「正規化で検索流入が消える」ケースが
        # 当てはまらないため、この38ページにだけ付ける。
        canonical=page_url,
    )


def write_sitemap(active_urls: dict) -> None:
    """sitemap-wayhome.xmlを書き出す。既存の<lastmod>はURLがすでに存在して
    いた場合はそのまま残し、新規URLだけ当日日付(JST)にする。実際に差分が
    出たページのlastmod更新は引き続きscripts/update_sitemap_lastmod.pyが
    担当する(regenerate-page.yml参照)。"""
    existing_lastmod = {}
    if SITEMAP_PATH.exists():
        import re
        text = SITEMAP_PATH.read_text(encoding="utf-8")
        for m in re.finditer(r"<loc>(.*?)</loc>\s*<lastmod>(.*?)</lastmod>", text):
            existing_lastmod[m.group(1)] = m.group(2)

    today = datetime.now(ZoneInfo("Asia/Tokyo")).strftime("%Y-%m-%d")

    entries = []
    for url in active_urls:
        lastmod = existing_lastmod.get(url, today)
        entries.append(f"\t<url>\n\t\t<loc>{url}</loc>\n\t\t<lastmod>{lastmod}</lastmod>\n\t</url>")

    content = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<!--\n"
        "  「帰り道」エピソード個別ページ(#162)のサイトマップ。\n"
        "  scripts/generate_wayhome_episodes.py が書き出す(手動編集しないこと)。\n"
        "  lastmodは新規追加時のみ当日日付を入れ、既存分は\n"
        "  scripts/update_sitemap_lastmod.py が実際に差分の出たページだけ更新する。\n"
        "  sitemap.xml(サイトマップインデックス)から参照される。\n"
        "-->\n"
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n'
        + "\n\n".join(entries)
        + "\n\n</urlset>\n"
    )
    # sitemap-pages.xmlのコメントに"--"(XMLコメントでは禁止)が混入し、
    # GSCで「型: 不明」エラーになったことがある(#162本番検証)。書き出す前に
    # well-formednessを確認し、壊れたXMLをコミットしないようにする。
    import xml.etree.ElementTree as ET
    ET.fromstring(content)
    SITEMAP_PATH.write_text(content, encoding="utf-8")
    print(f"{SITEMAP_PATH} を更新しました。")


def main():
    print(f"「{wayhome.SHEET_NAME}」シートを取得中...")
    raw_rows = fetch_sheet(wayhome.SPREADSHEET_ID, wayhome.SHEET_NAME, wayhome.QUERY)
    print(f"{len(raw_rows)}件取得しました。HTML生成中...")

    sorted_rows = wayhome.sorted_by_date_desc(raw_rows)

    video_ids = [wayhome.video_id_from_watch_url(row[4]) for row in sorted_rows]
    if any(vid is None for vid in video_ids):
        missing = [row[4] for row, vid in zip(sorted_rows, video_ids) if vid is None]
        raise ValueError(f"視聴URLから動画IDを取り出せない行があります: {missing!r}")
    if len(set(video_ids)) != len(video_ids):
        dupes = {vid for vid in video_ids if video_ids.count(vid) > 1}
        raise ValueError(f"動画IDが重複しています(個別ページのURLが衝突します): {dupes!r}")

    OUTPUT_DIR.mkdir(exist_ok=True)

    active_urls = {}
    for i, row in enumerate(sorted_rows):
        video_id = video_ids[i]
        interviewee = row[0]
        prev_row = sorted_rows[i - 1] if i > 0 else None
        next_row = sorted_rows[i + 1] if i < len(sorted_rows) - 1 else None
        same_player_rows = [r for j, r in enumerate(sorted_rows) if j != i and r[0] == interviewee]

        thumb_url, width, height = wayhome.resolve_thumb(row[5])

        meta = build_meta(row, video_id, thumb_url, width, height)
        body_html = build_body_html(row, i == 0, prev_row, next_row, same_player_rows, thumb_url, width, height)
        json_ld = build_json_ld(row, video_id, thumb_url)
        extra_head = f'<script defer src="{ASSET_PREFIX}wayhome_episodes.js"></script>\n{json_ld}\n'

        output = render_content(
            meta, body_html, extra_head=extra_head, has_search_boxes=False, asset_prefix=ASSET_PREFIX,
        )
        (OUTPUT_DIR / f"{video_id}.html").write_text(output, encoding="utf-8")
        active_urls[wayhome.episode_url(video_id)] = True

    # シートに無くなった動画IDのファイルを削除する(wayhome/はこのスクリプトが所有)。
    active_filenames = {f"{vid}.html" for vid in video_ids}
    for existing in OUTPUT_DIR.glob("*.html"):
        if existing.name not in active_filenames:
            existing.unlink()
            print(f"{existing} を削除しました(シートに存在しない動画ID)。")

    print(f"{len(sorted_rows)}件のエピソードページを {OUTPUT_DIR} に書き出しました。")

    write_sitemap(active_urls)


if __name__ == "__main__":
    main()
