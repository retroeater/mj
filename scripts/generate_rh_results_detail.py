#!/usr/bin/env python3
"""rh_results_detail.html を Googleスプレッドシート「成績詳細」シートの
データから静的HTMLとして再生成するスクリプト。lib/page.py の共通処理を
使う(#7)。型A'(多列テーブル、画像列なし)の2ページ目。

これまでブラウザ側(rh_results_detail.js + Google Charts)が毎回スプレッド
シートへ問い合わせていた処理を、ビルド時にPython側で一度だけ実行して
静的HTMLに焼き込む。絞り込み・ページ送りを持たないページのため、
共有JS(table.js)が提供する機能はナビバー固定分の高さ調整のみ。

旧版はA〜V(22列)を丸ごと取得し、view.setColumns([0,2,4,6,8,17,18,19])で
A,C,E,G,I,R,S,T の8列だけを表示、インデックス21(V列)を対局名(G列)に
添えるXアイコンのリンク先に使っていた。22列取得して後から間引くのではなく、
クエリ側で最初から必要な9列(表示8列+V)だけを取る。Wは絞り込み専用のため
SELECTには含めない。

formatted=Trueが必須。A列(日付)はgvizのtype=dateで、生の値(v)は
"Date(2026,0,24)"というJavaScriptのDateコンストラクタ呼び出し文字列に
なる。表示用文字列(f)は"2026-01-24"で、旧Google Charts版もこちらを
描画していた(手順1の確認で実データを取得して確認済み)。

使い方:
    python3 scripts/generate_rh_results_detail.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import NEW_TAB_HINT, PageMeta, TableConfig, esc, generate  # noqa: E402

SPREADSHEET_ID = "1WxXJJ2vQPfjNsMYT9zBE2UU1Xo7T-PkhWYE6dtWtk50"
SHEET_NAME = "成績詳細"
QUERY = 'SELECT A,C,E,G,I,R,S,T,V WHERE W = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "rh_results_detail.html"

META = PageMeta(
    title="成績詳細 | 平野良栄 | ryoei.pro",
    description="日本プロ麻雀連盟の麻雀プロ、平野良栄の公式戦成績の詳細{count}半荘分をまとめています。",
    og_url="https://ryoei.pro/rh_results_detail.html",
    h1="平野良栄 公式戦成績詳細",
    caption="平野良栄の公式戦成績の詳細一覧。",
)

# スプレッドシートの列見出しをそのまま使う(tqx=out:jsonのtable.cols[].labelで確認)。
# 絞り込み・ページ送りを持たないページのため show_filter=False, page_size=None
# (旧Google Charts版もoptions.pageを持たず全件表示、絞り込み欄もなかった。
# 現行仕様をそのまま引き継ぐ)。
TABLE = TableConfig(
    table_id="rh_results_detail_table",
    headers=["日付", "団体", "タイトル", "対局", "対局者", "着順", "得点", "結果"],
    extra_table_class="mj-table-auto",
    page_size=None,
    show_filter=False,
)


def build_row_html(row) -> str:
    date, org, title, game, players, rank, score, result, twitter_url = row

    # 対局列にXアイコンを後置する。V列(twitter_url)が空の行は付けない
    # (旧JSの if(twitter_url) と同じ分岐)。altは "対局名 X" の形式にする。
    # 旧版はalt="Twitter"固定だったが、#7の他ページ(get_x()等)で採用している
    # 「名前 サービス名」の形式に揃える意図的な変更。
    game_cell = esc(game)
    if twitter_url:
        game_cell += (
            f' <a href="{esc(twitter_url)}" target="_blank">'
            f'<img alt="{esc(game)} X" src="img/twitter.svg" width="16" height="16">{NEW_TAB_HINT}</a>'
        )

    cells = [esc(date), esc(org), esc(title), game_cell, esc(players), esc(rank), esc(score), esc(result)]
    tds = "".join(f"<td>{c}</td>" for c in cells)
    return f"<tr>{tds}</tr>"


if __name__ == "__main__":
    generate(SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html, formatted=True)
