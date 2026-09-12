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

使い方:
    python3 scripts/generate_video_wayhome.py
"""
import datetime
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, esc, render_content  # noqa: E402
from lib.sheets import fetch_sheet  # noqa: E402

IMG_YOUTUBE_PATTERN = re.compile(r"^https?://img\.youtube\.com/vi/([^/]+)/")
WATCH_ID_PATTERN = re.compile(r"[?&]v=([^&]+)")
DATE_ONLY_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
JST = datetime.timezone(datetime.timedelta(hours=9))
MAXRES_TIMEOUT = 15  # scripts/check_image_links.py のHEADリクエストと同じ方針

SPREADSHEET_ID = "1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ"
SHEET_NAME = "帰り道"
QUERY = 'SELECT A,B,C,D,E,F WHERE G = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "video_wayhome.html"

SERIES_NAME = "帰り道ついていってイイっすか"

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


def _maxres_available(video_id: str) -> bool:
    """maxresdefault.jpg が存在するかHEADで確認する。失敗時はhqdefaultへ
    フォールバックする(#102)。タイムアウト・例外は握りつぶさずログに出す。"""
    url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=MAXRES_TIMEOUT) as res:
            return res.status == 200
    except Exception as e:
        print(f"  maxresdefault確認に失敗、hqdefaultにフォールバックします: {video_id}: {e}", file=sys.stderr)
        return False


def _resolve_hero_thumb(image_url):
    """最新話のヒーロー用サムネイルURL・width・heightを決める(#102第1段から移植)。
    F列がimg.youtube.comでなければ差し替えを行わずそのまま使う。"""
    match = IMG_YOUTUBE_PATTERN.match(image_url or "")
    if not match:
        # 現データ(38件)はすべてimg.youtube.comのため通常は通らない分岐。
        return image_url, 480, 360
    video_id = match.group(1)
    if _maxres_available(video_id):
        return f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg", 1280, 720
    return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg", 480, 360


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
    # コピー対象はvideo_wayhome.js側でlocation.href(表示中のURL)を読む。
    # ?name=付きで開かれた場合もその絞り込み状態ごと共有できるようにするため、
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


def build_card_html(row) -> str:
    interviewee, x_id, published_date, title, url, image_url = row
    alt = f"{title} {interviewee}" if interviewee else (title or "")
    info_value = esc(" ".join(filter(None, [published_date, title, interviewee, x_id])))

    return (
        f'<li class="mj-video-card" data-info="{info_value}">\n'
        f'\t<a class="mj-video-card-link" href="{esc(url)}" target="_blank">\n'
        f'\t\t<img class="mj-video-card-img" alt="{esc(alt)}" loading="lazy" width="160" height="90" '
        f'src="{esc(image_url)}" data-fallback="img/125_arr_hoso.png" />\n'
        f'\t\t<span class="mj-video-card-date">{esc(published_date)}</span>\n'
        f'\t\t<span class="mj-video-card-title">{esc(title)}</span>\n'
        f'\t\t<span class="mj-video-card-name">{esc(interviewee)}</span>\n'
        "\t</a>\n"
        "</li>"
    )


def _to_upload_date(date_str):
    """C列の日付文字列(YYYY-MM-DD)をuploadDate用の完全なISO 8601に変換する
    (#13。本番のリッチリザルトテストで「日時値が無効」「タイムゾーンが無い」
    の2件が任意の指摘として出たため)。

    スプレッドシートには日付しかないため、時刻は 00:00:00 JST で近似する。
    実際の公開時刻ではない。正確な時刻が必要になれば YouTube Data API の
    videos.list(snippet.publishedAt)で取得できる(#62でAPIキー発行が前提)。

    パースできない値は None を返す。uploadDateは呼び出し側でキーごと省略する。

    uploadDateはGoogleのVideoObjectでname/thumbnailUrlと並ぶ必須プロパティ
    であり、任意ではない(1回目の本番検証で指摘が「任意」扱いだったのは、
    値自体は存在した上で形式が不完全だったためで、プロパティが任意だからでは
    ない)。つまりこの分岐に入った回は、uploadDateキーの省略によって
    VideoObjectが必須プロパティ欠落のエラーになることを承知の上で選んでいる。
    現在38行すべてが正常にパースできており、シートの日付形式が崩れない限り
    発動しないため実装はこのままにするが、崩れた形式が実際に入るように
    なった場合はVideoObject自体を出さない方に倒す判断もありうる。
    """
    if not date_str or not DATE_ONLY_PATTERN.match(date_str):
        return None
    try:
        dt = datetime.datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=JST)
    except ValueError:
        return None
    return dt.isoformat()


def build_json_ld(sorted_rows, hero_thumb_url) -> str:
    """VideoObject(最新話) + ItemList(エピソード一覧)のJSON-LDを組み立てる(#13先行実装)。
    </script>で埋め込みscriptタグが閉じてしまう事故を避けるため、シリアライズ後に
    "</" を "<\\/" へ置換する(標準的な対策)。

    ItemListは本番のリッチリザルトテストの結果には現れなかった(Googleが
    リッチリザルトの対象として扱っていないため)。itemListElement.url が
    youtube.com(外部サイト)を指しているのが理由と見ている。#162で
    エピソード個別ページ(自サイト内URL)ができれば、そこで初めてカルーセルの
    候補になりうる。schema.org側の構文自体はvalidator.schema.orgでエラー・
    警告なしを確認済みのため、削除はしない。"""
    items = []
    for i, row in enumerate(sorted_rows, start=1):
        interviewee, x_id, published_date, title, url, image_url = row
        items.append({
            "@type": "ListItem",
            "position": i,
            "url": url,
            "name": f"{title} {interviewee}".strip(),
        })
    item_list = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": f"{SERIES_NAME} エピソード一覧",
        "itemListElement": items,
    }

    interviewee, x_id, published_date, title, url, image_url = sorted_rows[0]
    watch_match = WATCH_ID_PATTERN.search(url or "")
    video_object = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": f"{title} {interviewee}".strip(),
        "description": f"日本プロ麻雀連盟「{SERIES_NAME}」。{title}を終えた{interviewee}への密着インタビュー動画です。",
        "thumbnailUrl": [hero_thumb_url],
        "contentUrl": url,
    }
    upload_date = _to_upload_date(published_date)
    if upload_date:
        video_object["uploadDate"] = upload_date
    if watch_match:
        video_object["embedUrl"] = f"https://www.youtube.com/embed/{watch_match.group(1)}"

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
    # Pythonのsortedは安定ソートで、reverse=Trueでも同値の相対順は保たれるため、
    # 同日が複数ある場合はシート順で先に出てくる行が結果でも先に来る
    # (第1段のmax()ループと同じ規則を、ここではsortedの安定性で満たす)。
    sorted_rows = sorted(raw_rows, key=lambda row: row[2] or "", reverse=True)

    latest = sorted_rows[0]
    hero_thumb_url, hero_width, hero_height = _resolve_hero_thumb(latest[5])

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
        '<main class="mj-video-page">\n'
        f"{hero_html}\n"
        '<div id="searchBoxes" class="collapse">\n'
        '\t<div class="mj-filter"><label class="visually-hidden" for="info_filter">概要で検索</label>'
        '<input type="text" id="info_filter" class="mj-filter-input" placeholder="概要"></div>\n'
        "</div>\n\n"
        '<p id="result_count" class="visually-hidden" role="status" aria-live="polite"></p>\n\n'
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
    output = render_content(META, body_html, extra_head=extra_head)

    OUTPUT_PATH.write_text(output, encoding="utf-8")
    print(f"{OUTPUT_PATH} を更新しました。")


if __name__ == "__main__":
    main()
