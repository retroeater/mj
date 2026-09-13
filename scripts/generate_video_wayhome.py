#!/usr/bin/env python3
"""video_wayhome.html を Googleスプレッドシート「帰り道」シートのデータから
静的HTMLとして再生成するスクリプト。

#102 第2段: このページは「新サイト（docs/new-site-design.md）の先取り
パイロット」として、表形式をやめ「全画面ヒーロー + 横スクロールの
エピソード列」に作り変えた。表を持たないため lib/page.py の
render_content()（型D等と同じ)を使う。table.js は .mj-table が無いと
何もしないため読み込まず、フィルター・画像フォールバック・検索欄の
初期値付けは video_wayhome.js（このページ専用）に持たせている。

lib/page.py の content_before スロット(#102第1段で追加)は本ページでは
使わない(render()自体を使わなくなったため)。#158がh1直後にlead文を
差し込む用途として引き続き使う想定なのでlib側はそのまま残している。

#162: カードのリンク先をYouTube直リンクからエピソード個別ページ
(wayhome/<動画ID>.html、scripts/generate_wayhome_episodes.py)に変更した。
YouTube直リンクはヒーローの「再生」ボタンにのみ残す。最新話判定・
サムネイル解決・VideoObject組み立てはgenerate_wayhome_episodes.pyと
共有するため scripts/lib/wayhome.py に切り出した。

#188: navbarのsticky化の土台として、<main>にこの一覧ページ専用のスコープ
クラス mj-video-list を追加した。既存の .mj-video-page はエピソード個別
ページ(#162)と共有しており一意でないため、style.css側の:has()スコープを
一覧ページだけに閉じるには使えない。mj-video-listはこの一覧ページの
<main>にしか付かないため、新しいスコープフックとして使う。

使い方:
    python3 scripts/generate_video_wayhome.py
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, esc, render_content  # noqa: E402
from lib.sheets import fetch_sheet  # noqa: E402
from lib import wayhome  # noqa: E402

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "video_wayhome.html"

SPREADSHEET_ID = wayhome.SPREADSHEET_ID
SHEET_NAME = wayhome.SHEET_NAME
QUERY = wayhome.QUERY
SERIES_NAME = wayhome.SERIES_NAME

# タイトル・descriptionは新サイト設計の「タイトルの重要性」節を踏まえ、
# 検索した人が探しているものだと分かる形に書き換えた(#102第2段)。
# scripts/apply_page_meta.py の PAGES["video_wayhome.html"] と同じ文言に
# すること(整合を崩すと次回apply_page_meta.py実行時に差し戻る)。
META = PageMeta(
    title="帰り道ついていってイイっすか | 選手インタビュー動画 | ryoei.pro",
    description="YouTubeチャンネル「日本プロ麻雀連盟」の企画「帰り道ついていってイイっすか」。タイトル戦を終えた選手への密着インタビュー動画を、最新話から選手名・タイトル戦名で検索できます。",
    og_url="https://ryoei.pro/video_wayhome.html",
    h1=SERIES_NAME,  # render_content()では使わない(body_html側で組み立てる)。整合のため残す
    caption="",  # render_content()では使わない(表を持たないため)
)


def build_hero_html(latest, thumb_url, width, height) -> str:
    """全画面ヒーロー(背景=最新話のサムネイル)を組み立てる。
    テキストはヒーロー内に焼き込んだグラデーションスクリム(常に暗)の上に
    乗るため、ページのカラートークン(ライト/ダーク)とは独立して常に明色
    固定にしている。任意の写真の上に文字を置く都合上の可読性確保であり、
    トークンの二重管理ではない、という整理。詳細はdocs/new-site-design.md
    「パイロット: video_wayhome」参照。"""
    interviewee, x_id, published_date, title, url, image_url = latest

    badge = '<span class="mj-video-hero-badge">最新話</span>'
    meta_parts = [esc(published_date)]
    if title:
        meta_parts.append(esc(title))
    meta_line = "・".join(meta_parts)

    actions = [
        f'<a class="mj-video-btn mj-video-btn-primary" href="{esc(url)}" target="_blank">'
        f'<span aria-hidden="true">▶</span> 再生</a>'
    ]
    if x_id:
        actions.append(f'<a class="mj-video-btn" href="https://x.com/{esc(x_id)}" target="_blank">X @{esc(x_id)}</a>')
    # コピー対象はvideo_wayhome.js側でlocation.href(表示中のURL)を読むため、
    # ここでは固定URLを属性に持たせない。
    actions.append('<button type="button" class="mj-video-btn" id="copyUrlBtn">URLをコピー</button>')

    hero_desc = (
        f"タイトル戦を終えたばかりの選手に、日本プロ麻雀連盟公式YouTubeが密着インタビュー。"
        f"最新話から選手名・タイトル戦名で振り返れます。"
    )

    return (
        '<section class="mj-video-hero">\n'
        f'\t<img class="mj-video-hero-bg" src="{esc(thumb_url)}" alt="" width="{width}" height="{height}" '
        f'fetchpriority="high" />\n'
        '\t<div class="mj-video-hero-scrim"></div>\n'
        '\t<div class="mj-video-hero-content">\n'
        f'\t\t<h1 class="mj-video-series-name">{esc(SERIES_NAME)}</h1>\n'
        f'\t\t<h2 class="mj-video-hero-player">{esc(interviewee)}</h2>\n'
        f'\t\t<p class="mj-video-hero-meta">{badge}<span>{meta_line}</span></p>\n'
        f'\t\t<p class="mj-video-hero-desc">{esc(hero_desc)}</p>\n'
        f'\t\t<div class="mj-video-hero-actions">{"".join(actions)}</div>\n'
        '\t\t<p id="copyStatus" class="visually-hidden" role="status" aria-live="polite"></p>\n'
        "\t</div>\n"
        "</section>\n"
    )


def build_filterbar_html(count: int) -> str:
    """#189: navbar直下に常時表示するsticky検索バー。旧方式(虫眼鏡アイコンで
    開閉する#searchBoxes)を廃止して置き換えた。アイコンはnavbar.js内の
    虫眼鏡SVGと同じパスを流用する(装飾目的でaria-hidden、視覚的な一貫性のため)。
    件数表示の初期値はJS実行前のちらつきを避けるため、生成時点の実データ件数
    (count)でサーバー側から出しておく(video_wayhome.jsが以降の絞り込みに
    追随させる)。"""
    icon_svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" '
        'viewBox="0 0 16 16" aria-hidden="true"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 '
        '1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 '
        '1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>'
    )
    return (
        '<div class="mj-filterbar">\n'
        f'\t<span class="mj-filterbar-icon">{icon_svg}</span>\n'
        '\t<input type="search" id="info_filter" class="mj-filter-input" '
        'placeholder="選手名・タイトル戦で検索" enterkeyhint="search" autocomplete="off" '
        'aria-label="選手名・タイトル戦で絞り込み">\n'
        f'\t<p id="result_count" class="mj-filterbar-count" role="status" aria-live="polite">'
        f'{count}件中 {count}件を表示</p>\n'
        '</div>\n'
    )


def episode_href(row) -> str:
    """一覧ページ(ルート直下)から見た個別ページへの相対href。動画IDが
    取れない行はデータ異常のため、握りつぶさず例外にする。"""
    interviewee, x_id, published_date, title, url, image_url = row
    video_id = wayhome.video_id_from_watch_url(url)
    if not video_id:
        raise ValueError(f"視聴URLから動画IDを取り出せません: {url!r}")
    return wayhome.episode_path(video_id)


def build_card_html(row) -> str:
    """#162: カードは個別ページへリンクする(YouTube直リンクはヒーローの
    「再生」ボタンにのみ残す)。"""
    interviewee, x_id, published_date, title, url, image_url = row
    alt = f"{title} {interviewee}" if interviewee else (title or "")
    info_value = esc(" ".join(filter(None, [published_date, title, interviewee, x_id])))

    return (
        f'<li class="mj-video-card" data-info="{info_value}">\n'
        f'\t<a class="mj-video-card-link" href="{esc(episode_href(row))}">\n'
        f'\t\t<img class="mj-video-card-img" alt="{esc(alt)}" loading="lazy" width="160" height="90" '
        f'src="{esc(image_url)}" data-fallback="img/125_arr_hoso.png" />\n'
        f'\t\t<span class="mj-video-card-date">{esc(published_date)}</span>\n'
        f'\t\t<span class="mj-video-card-title">{esc(title)}</span>\n'
        f'\t\t<span class="mj-video-card-name">{esc(interviewee)}</span>\n'
        "\t</a>\n"
        "</li>"
    )


def build_json_ld(sorted_rows, hero_thumb_url) -> str:
    """VideoObject(最新話) + ItemList(エピソード一覧)のJSON-LDを組み立てる(#13先行実装)。
    </script>で埋め込みscriptタグが閉じてしまう事故を避けるため、シリアライズ後に
    "</" を "<\\/" へ置換する(標準的な対策)。

    #162で、ItemList.itemListElement.url をYouTube直リンクから個別ページの
    自サイトURLに変更した。ItemListが本番のリッチリザルトテストの結果に
    現れなかったのは、urlがyoutube.com(外部サイト)を指していたためと見て
    おり(#13)、個別ページができたことで初めてカルーセルの候補になりうる。"""
    items = []
    for i, row in enumerate(sorted_rows, start=1):
        interviewee, x_id, published_date, title, url, image_url = row
        video_id = wayhome.video_id_from_watch_url(url)
        items.append({
            "@type": "ListItem",
            "position": i,
            "url": wayhome.episode_url(video_id) if video_id else url,
            "name": f"{title} {interviewee}".strip(),
        })
    item_list = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": f"{SERIES_NAME} エピソード一覧",
        "itemListElement": items,
    }

    video_object = wayhome.build_video_object(sorted_rows[0], hero_thumb_url)

    blocks = []
    for obj in (video_object, item_list):
        raw = json.dumps(obj, ensure_ascii=False).replace("</", "<\\/")
        blocks.append(f'<script type="application/ld+json">{raw}</script>')
    return "\n".join(blocks)


def main():
    print(f"「{SHEET_NAME}」シートを取得中...")
    raw_rows = fetch_sheet(SPREADSHEET_ID, SHEET_NAME, QUERY)
    print(f"{len(raw_rows)}件取得しました。HTML生成中...")

    # シートの並び順に依存せず、公開日(C列)の降順に明示ソートする(#102第2段)。
    # wayhome.sorted_by_date_desc はgenerate_wayhome_episodes.py(#162)と共有。
    sorted_rows = wayhome.sorted_by_date_desc(raw_rows)

    latest = sorted_rows[0]
    hero_thumb_url, hero_width, hero_height = wayhome.resolve_thumb(latest[5])

    hero_html = build_hero_html(latest, hero_thumb_url, hero_width, hero_height)
    cards_html = "\n".join(build_card_html(row) for row in sorted_rows)
    json_ld = build_json_ld(sorted_rows, hero_thumb_url)

    # .mj-video-pageはstyle.css側のbody:has(.mj-video-page)スコープ用マーカー
    # (body要素自体にクラスを持たせる手段がlib/page.pyのテンプレートにないため、
    # body:has(.mj-table)と同じ流儀でこの子孫セレクタを使う)。
    # <main>にしているのはlandmark-one-main対策(Lighthouse accessibility)。
    # 他ページはnavbar.js側の未解決分(#searchBoxesのアイコンリンク、
    # link-name)が残るためscoreは上げられないが、こちらはnavbar.jsを
    # 触らずに済む範囲でこのページ限りの改善として反映した。
    body_html = (
        '<main class="mj-video-page mj-video-list">\n'
        f"{hero_html}\n"
        f"{build_filterbar_html(len(sorted_rows))}\n"
        '<section class="mj-video-episodes">\n'
        '\t<div class="mj-video-episodes-head">\n'
        f'\t\t<h2 class="mj-video-episodes-heading">エピソード（全{len(sorted_rows)}回）</h2>\n'
        '\t\t<div class="mj-video-episodes-controls">\n'
        '\t\t\t<button type="button" class="mj-video-scroll-btn" data-dir="prev" aria-label="前のエピソードへ">‹</button>\n'
        '\t\t\t<button type="button" class="mj-video-scroll-btn" data-dir="next" aria-label="次のエピソードへ">›</button>\n'
        "\t\t</div>\n"
        "\t</div>\n"
        f'\t<ul class="mj-video-track" id="episodeTrack">\n{cards_html}\n\t</ul>\n'
        "</section>\n"
        "</main>\n"
    )

    extra_head = f'<script defer src="video_wayhome.js"></script>\n{json_ld}\n'
    # has_search_boxes=False: navbar.js側の虫眼鏡アイコン(#searchBoxesの
    # 開閉用)を出さない。検索欄は#189でnavbar直下に常時表示するfilterbarに
    # 置き換えたため、アイコン経由の開閉手段自体が不要になった(#163と同じ
    # <body data-search="off">の仕組みを流用)。
    output = render_content(META, body_html, extra_head=extra_head, has_search_boxes=False)

    OUTPUT_PATH.write_text(output, encoding="utf-8")
    print(f"{OUTPUT_PATH} を更新しました。")


if __name__ == "__main__":
    main()
