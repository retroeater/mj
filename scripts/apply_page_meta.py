#!/usr/bin/env python3
"""全ページの <title> を書き換え、meta description と OGPタグを追加する。

背景:
  Search Console のデータで、表示48回に対しクリックは2回(CTR約4%)だった。
  掲載順位は1〜12位と悪くないのに、ほとんどクリックされていない。
  原因は <title> と考えられる。検索結果に「プロ」「成績詳細」「リンク」といった
  素っ気ない文字列が並び、しかも「成績詳細」は4ページで重複していた。

方針:
  - 書式は「ページ内容 | ryoei.pro」に統一(トップページのみサイト名なし)
  - 日本語のtitleは検索結果で約30文字前後で省略されるため、簡潔にする
  - og:image は全ページ共通の1枚(#78)。scripts/generate_ogp.py で作る

使い方:
    python3 scripts/apply_page_meta.py          # 書き換え
    python3 scripts/apply_page_meta.py --dry    # 変更内容の確認のみ
"""
import argparse
import html
import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).parent.parent
SITE_URL = "https://ryoei.pro"

# ページ名: (title, description)
PAGES = {
    "index.html": (
        "ryoei.pro",
        "日本プロ麻雀連盟の麻雀プロ、平野良栄の公式サイト。自身のプロフィール・出演情報・経歴のほか、日本プロ麻雀連盟所属の麻雀プロのデータベースを公開しています。",
    ),
    # ---- 連盟 ----
    "jpml_pros.html": (
        "プロ | 日本プロ麻雀連盟 | ryoei.pro",
        "日本プロ麻雀連盟の麻雀プロ（1000人超）について、所属・出身地・龍龍・X・note・YouTube・公式戦成績（鳳凰戦・女流桜花等）をまとめています。",
    ),
    "jpml_titles.html": (
        "タイトル | 日本プロ麻雀連盟 | ryoei.pro",
        "日本プロ麻雀連盟の麻雀プロが出場するタイトル戦について、歴代優勝者と決勝進出者をまとめています。選手名・タイトル戦名称などで検索できます。",
    ),
    "jpml_test.html": (
        "プロテスト | 日本プロ麻雀連盟 | ryoei.pro",
        "日本プロ麻雀連盟のプロテストについて、関連記事・動画をまとめています。",
    ),
    "jpml_links.html": (
        "リンク | 日本プロ麻雀連盟 | ryoei.pro",
        "日本プロ麻雀連盟の公式サイトや、各支部・関連団体へのリンクをまとめています。",
    ),
    # ---- 鳳凰戦 ----
    "houou_ranking.html": (
        "ランキング | 鳳凰戦 | ryoei.pro",
        "日本プロ麻雀連盟の鳳凰戦について、通算得点・期最高得点・節最高得点などの成績ランキングを公開しています。",
    ),
    "houou_leagues.html": (
        "リーグ推移 | 鳳凰戦 | ryoei.pro",
        "日本プロ麻雀連盟の鳳凰戦について、選手の所属リーグ推移（期ごとの各リーグの人数、全出場選手の中での順位等）を閲覧できます。",
    ),
    "houou_results.html": (
        "成績詳細 | 鳳凰戦 | ryoei.pro",
        "日本プロ麻雀連盟の鳳凰戦について、成績詳細（第17期後期以降）をまとめています。全選手の節単位の成績を、選手名・期・リーグなどで検索できます。",
    ),
    # ---- 女流桜花 ----
    "ouka_ranking.html": (
        "ランキング | 女流桜花 | ryoei.pro",
        "日本プロ麻雀連盟の女流桜花について、通算得点・期最高得点・節最高得点などの成績ランキングを公開しています。",
    ),
    "ouka_leagues.html": (
        "リーグ推移 | 女流桜花 | ryoei.pro",
        "日本プロ麻雀連盟の女流桜花について、選手の所属リーグ推移（期ごとの各リーグの人数、全出場選手の中での順位等）を閲覧できます。",
    ),
    "ouka_results.html": (
        "成績詳細 | 女流桜花 | ryoei.pro",
        "日本プロ麻雀連盟の女流桜花について、成績詳細をまとめています。全選手の節単位の成績を、選手名・期・リーグなどで検索できます。",
    ),
    # ---- JPML WRC ----
    "wrc_ranking.html": (
        "ランキング | JPML WRC | ryoei.pro",
        "日本プロ麻雀連盟のJPML WRCリーグについて、通算得点・期最高得点・節最高得点などの成績ランキングを公開しています。",
    ),
    "wrc_results.html": (
        "成績詳細 | JPML WRC | ryoei.pro",
        "日本プロ麻雀連盟のJPML WRCリーグについて、成績詳細をまとめています。全選手の節単位の成績を、選手名・期・リーグなどで検索できます。",
    ),
    # ---- 最強戦 ----
    "saikyo_results.html": (
        "麻雀最強戦 | ryoei.pro",
        "麻雀最強戦の成績（2011年以降のグループリーグおよびファイナル）をまとめています。",
    ),
    "saikyo_mens.html": (
        "読者アンケート | 麻雀最強戦 | ryoei.pro",
        "麻雀最強戦の読者アンケートのエントリー選手をまとめています。",
    ),
    # ---- 動画 ----
    "video_live.html": (
        "放送対局 | 動画 | ryoei.pro",
        "YouTubeチャンネル「日本プロ麻雀連盟」の放送対局動画をまとめています。選手・実況・解説の名前、タイトル戦名称などで検索できます。",
    ),
    "video_wayhome.html": (
        "帰り道ついていってイイっすか | 選手インタビュー動画 | ryoei.pro",
        "YouTubeチャンネル「日本プロ麻雀連盟」の企画「帰り道ついていってイイっすか」。タイトル戦を終えた選手への密着インタビュー動画を、最新話から選手名・タイトル戦名で検索できます。",
    ),
    "video_mtsuku.html": (
        "Mつく | 動画 | ryoei.pro",
        "YouTubeチャンネル「麻雀遊戯王」の企画「Mリーグチームを作ろう！」の動画をまとめています。選手名・所属団体名などで検索できます。",
    ),
    "video_en.html": (
        "English | 動画 | ryoei.pro",
        "日本プロ麻雀連盟の麻雀プロが出演する英語動画についてまとめています。",
    ),
    # ---- リソース ----
    "resource_logs.html": (
        "ログ | リソース | ryoei.pro",
        "日本プロ麻雀連盟の麻雀プロが訪れた飲食店を、Xポストに基づいてまとめています。選手名・店名・メニュー名・最寄駅名などで検索できます。",
    ),
    "resource_dictionary.html": (
        "辞書 | リソース | ryoei.pro",
        "日本プロ麻雀連盟の麻雀プロの名前、および麻雀用語の辞書ファイル（Microsoft IME・Google日本語入力）を公開しています。",
    ),
    "resource_efficiency.html": (
        "牌効率 | リソース | ryoei.pro",
        "牌効率の比較のため、牌姿ごとにメンツが完成する組合せ数を計算した一覧表です。",
    ),
    # ---- 良栄 ----
    "rh_results.html": (
        "成績 | 平野良栄 | ryoei.pro",
        "日本プロ麻雀連盟の麻雀プロ、平野良栄の公式戦成績をまとめています。",
    ),
    "rh_results_detail.html": (
        "成績詳細 | 平野良栄 | ryoei.pro",
        "日本プロ麻雀連盟の麻雀プロ、平野良栄の公式戦成績の詳細をまとめています。",
    ),
    "rh_paifu.html": (
        "牌譜 | 平野良栄 | ryoei.pro",
        "日本プロ麻雀連盟の麻雀プロ、平野良栄の公式戦の牌譜を公開しています。",
    ),
    "rh_links.html": (
        "リンク | 平野良栄 | ryoei.pro",
        "日本プロ麻雀連盟の麻雀プロ、平野良栄の利用しているツール・サービス等のリンク集です。",
    ),
}

# 404ページは noindex 指定済みのため対象外


def build_meta(page, title, description):
    """description と OGPタグをまとめて生成する。
    og:image は全ページ共通の1枚(scripts/generate_ogp.py が作る)。"""
    url = f"{SITE_URL}/" if page == "index.html" else f"{SITE_URL}/{page}"
    e = html.escape
    return (
        f'<meta name="description" content="{e(description)}">\n'
        f'<meta property="og:type" content="website">\n'
        f'<meta property="og:site_name" content="ryoei.pro">\n'
        f'<meta property="og:title" content="{e(title)}">\n'
        f'<meta property="og:description" content="{e(description)}">\n'
        f'<meta property="og:url" content="{e(url)}">\n'
        f'<meta property="og:image" content="{SITE_URL}/img/ogp.png">\n'
        f'<meta property="og:image:width" content="1200">\n'
        f'<meta property="og:image:height" content="630">\n'
        f'<meta property="og:image:alt" content="ryoei.pro">\n'
        f'<meta name="twitter:card" content="summary_large_image">'
    )


def apply(path, title, description, dry):
    s = path.read_text(encoding="utf-8")
    orig = s

    m = re.search(r"<title>([^<]*)</title>", s)
    if not m:
        return None, "titleタグが見つかりません"
    before = m.group(1)

    # 既存のdescription・OGPタグをいったん取り除く(再実行できるように)
    # 属性の順序（name="description" content="..." / content="..." name="description"）は問わない
    s = re.sub(r'\n?[ \t]*<meta(?=[^>]*\bname="description")(?=[^>]*content=)[^>]*>', "", s)
    s = re.sub(r'\n?[ \t]*<meta property="og:[^"]*"[^>]*>', "", s)
    s = re.sub(r'\n?[ \t]*<meta name="twitter:[^"]*"[^>]*>', "", s)

    block = build_meta(path.name, title, description)
    s = re.sub(
        r"<title>[^<]*</title>",
        f"<title>{html.escape(title)}</title>\n{block}",
        s,
        count=1,
    )

    if not dry:
        path.write_text(s, encoding="utf-8")
    return (before, title), None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true", help="書き換えず内容だけ表示する")
    args = ap.parse_args()

    changed = skipped = 0
    for page, (title, desc) in PAGES.items():
        path = REPO_ROOT / page
        if not path.exists():
            print(f"  スキップ: {page} (ファイルなし)", file=sys.stderr)
            skipped += 1
            continue
        result, error = apply(path, title, desc, args.dry)
        if error:
            print(f"  失敗: {page} — {error}", file=sys.stderr)
            skipped += 1
            continue
        before, after = result
        print(f"  {page}")
        print(f"      {before}  →  {after}")
        changed += 1

    print(f"\n{'確認' if args.dry else '書き換え'}: {changed}件"
          + (f" / スキップ {skipped}件" if skipped else ""))

    # 生成スクリプトのテンプレートは手で直す必要があるため注意を促す。
    # 対象は scripts/generate_*.py の存在から自動判別する(#6)。
    if not args.dry:
        generated_pages = sorted(
            page_name
            for p in (REPO_ROOT / "scripts").glob("generate_*.py")
            if (page_name := f"{p.stem.removeprefix('generate_')}.html") in PAGES
        )
        if generated_pages:
            print(f"\n注意: 次のページは scripts/generate_*.py から生成されます: "
                  f"{', '.join(generated_pages)}")
            print("      同じ内容を各スクリプトの PAGE_TEMPLATE にも反映しないと、次の再生成で戻ります。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
