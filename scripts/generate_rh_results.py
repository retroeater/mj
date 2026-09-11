#!/usr/bin/env python3
"""rh_results.html を Googleスプレッドシート「成績」シートのデータから
静的HTMLとして再生成するスクリプト。lib/page.py の共通処理を使う(#7)。
型A'(多列テーブル、画像列なし)の1ページ目。

これまでブラウザ側(rh_results.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。絞り込み・ページ送りを持たないページのため、共有JS(table.js)が
提供する機能はナビバー固定分の高さ調整のみ。

年別の集計値(得点・平均順位・トップ率・4位回避率)はスプレッドシート側で
表示形式(#,##0.0 等)が設定されている。gvizのレスポンスは生の数値(v)とは
別に表示用文字列(f)を持ち、旧Google Charts版のTable chartはこのfを
そのまま描画していた。fetch_sheet(formatted=True)でfを取得できるため、
Python側で書式を再現するコードは不要(#7で当初はCOLUMN_DECIMALS +
format_number()で自前整形していたが、fの存在が判明したため置き換えた)。
副次的に、空セルがNoneのままformat_number()に渡ってTypeErrorになる
問題も解消している(formatted=Trueでは空セルはNoneのままesc()に渡り
空文字になるだけで、数値整形自体が発生しない)。

このページの列(年・得点・平均順位・トップ率・4位回避率・半荘数)は
URLやHTML属性の組み立てには使わないため、formatted=Trueの桁区切りが
リンクを壊す心配はない。

使い方:
    python3 scripts/generate_rh_results.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, TableConfig, esc, generate  # noqa: E402

SPREADSHEET_ID = "1WxXJJ2vQPfjNsMYT9zBE2UU1Xo7T-PkhWYE6dtWtk50"
SHEET_NAME = "成績"
QUERY = "SELECT A,B,C,D,E,F"

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "rh_results.html"

META = PageMeta(
    title="成績 | 平野良栄 | ryoei.pro",
    description="日本プロ麻雀連盟の麻雀プロ、平野良栄の公式戦成績をまとめています。",
    og_url="https://ryoei.pro/rh_results.html",
    h1="平野良栄 公式戦成績",
    caption="平野良栄の公式戦成績の一覧。",
)

# スプレッドシートの列見出しをそのまま使う(tqx=out:jsonのtable.cols[].labelで確認)。
# 絞り込み・ページ送りを持たないページのため show_filter=False, page_size=None。
TABLE = TableConfig(
    table_id="rh_results_table",
    headers=["年", "得点", "平均順位", "トップ率", "4位回避率", "半荘数"],
    extra_table_class="mj-table-auto",
    page_size=None,
    show_filter=False,
)


def build_row_html(row) -> str:
    tds = "".join(f"<td>{esc(cell)}</td>" for cell in row)
    return f"<tr>{tds}</tr>"


if __name__ == "__main__":
    generate(SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html, formatted=True)
