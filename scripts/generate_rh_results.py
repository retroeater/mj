#!/usr/bin/env python3
"""rh_results.html を Googleスプレッドシート「成績」シートのデータから
静的HTMLとして再生成するスクリプト。lib/page.py の共通処理を使う(#7)。
型A'(多列テーブル、画像列なし)の1ページ目。

これまでブラウザ側(rh_results.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。絞り込み・ページ送りを持たないページのため、共有JS(table.js)が
提供する機能はナビバー固定分の高さ調整のみ。

年別の集計値(得点・平均順位・トップ率・4位回避率)はスプレッドシート側で
表示形式(#,##0.0 等)が設定されているが、gvizのgetJSONは生の数値しか
返さない(fetch_sheetはこれをそのまま使う)。旧Google Charts版は
DataTableのformatted value(f)をそのまま描画していたため、これと
見た目を一致させるには生の数値をPython側で同じ書式に整形し直す必要がある
(scripts/lib/sheets.pyは変更しない方針。列ごとの書式は
docs.google.com/.../gviz/tq のレスポンスのtable.cols[].patternで確認した)。

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

# 列ごとの表示形式(スプレッドシート側のnumber format)。
# B: #,##0.0 / C: #,##0.00 / D,E: #,##0.000 / F: #,##0
COLUMN_DECIMALS = [1, 2, 3, 3, 0]


def format_number(value, decimals) -> str:
    """スプレッドシートの表示形式(桁区切り+固定小数点)を再現する。
    例: 1861.4000000000012 → "1,861.4"、1216 → "1,216" """
    return f"{value:,.{decimals}f}"


def build_row_html(row) -> str:
    year, score, avg_rank, top_rate, avoid_4th_rate, hanchan_count = row

    cells = [esc(year)]
    for value, decimals in zip(
        [score, avg_rank, top_rate, avoid_4th_rate, hanchan_count], COLUMN_DECIMALS
    ):
        cells.append(esc(format_number(value, decimals)))

    tds = "".join(f"<td>{c}</td>" for c in cells)
    return f"<tr>{tds}</tr>"


if __name__ == "__main__":
    generate(SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html)
