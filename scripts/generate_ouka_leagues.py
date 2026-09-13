#!/usr/bin/env python3
"""ouka_leagues.html を Googleスプレッドシート「桜花」シート(積み上げ棒)と
「プロ」シート(選手選択リスト)から静的HTMLとして再生成するスクリプト。
型C(#7/#127)。generate_houou_leagues.pyと対になるスクリプト。hououとの
違いは期の形(年+前後 ではなく期のみ)・リーグ一覧・配色・既定選手名だけで、
集計処理自体はscripts/lib/leagues.pyを共有する。

E列(リーグ通し番号)はクエリから外している(hououと同じ理由。#127着手前
の事前調査)。WHERE F > 0 は旧JSから維持している。除外される行は
「桜花」(前期優勝者のプレースホルダ行。F列は常に空)と、まだ順位が
確定していない進行中の期(21期)のみ(実データで確認済み)。「桜花」は
LEAGUESに含めないため、hououの鳳凰位のようなzero_leagues指定なしで
自然に無視される。

選手選択リストの選定基準・除外規則はgenerate_houou_leagues.pyと同じ
(「プロ」シートのY列="Y"かつ桜花最高(T列)に値がある選手。実データに
ヒットしない選手はスキップ)。

使い方:
    python3 scripts/generate_ouka_leagues.py
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.chart import render_legend, stacked_column_chart  # noqa: E402
from lib.leagues import build_player_series, count_leagues, select_periods, upper_counts  # noqa: E402
from lib.page import PageMeta, esc, render_content  # noqa: E402
from lib.sheets import fetch_sheet  # noqa: E402

SPREADSHEET_ID = "1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0"
SHEET_NAME = "桜花"
QUERY = 'SELECT A,B,C,D,F WHERE F > 0'

PRO_SHEET_NAME = "プロ"
PRO_QUERY = 'SELECT A WHERE Y = "Y" AND T IS NOT NULL ORDER BY B ASC'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "ouka_leagues.html"
DATA_OUTPUT_PATH = REPO_ROOT / "ouka_leagues_data.json"

DEFAULT_NAME = "清水香織"

LEAGUES = ["A", "B", "C1", "C2", "C3"]
COLORS = ["#FFCCCC", "#FFEECC", "#EEFFDD", "#CCEEFF", "#CCCCCC"]
LINE_COLOR = "#0000CC"

META = PageMeta(
    title="リーグ推移 | 女流桜花 | ryoei.pro",
    description="日本プロ麻雀連盟の女流桜花について、選手{count}名の所属リーグ推移（期ごとの各リーグの人数、全出場選手の中での順位等）を閲覧できます。",
    og_url="https://ryoei.pro/ouka_leagues.html",
    h1="女流桜花 リーグ推移",
    caption="",
)

BODY_TEMPLATE = """<div id="searchBoxes" class="collapse">
\t<div class="mj-filter">
\t\t<label class="visually-hidden" for="selectbox">選手を選択</label>
\t\t<select id="selectbox" name="">
\t\t\t<option value="">名前を選択</option>
{options}
\t\t</select>
\t\t<button type="button" id="selectboxGo" class="mj-pager-button">表示</button>
\t</div>
</div>
{legend}
<div>
{chart_desktop}
{chart_mobile}
</div>
<script defer src="leagues.js" data-json-url="ouka_leagues_data.json"></script>"""


def period_of(row):
    return row[1]


def period_label(period):
    return str(int(period)) if isinstance(period, float) and period.is_integer() else str(period)


def main():
    print(f"「{SHEET_NAME}」シートを取得中...")
    rows = fetch_sheet(SPREADSHEET_ID, SHEET_NAME, QUERY)
    print(f"{len(rows)}件取得しました。")

    print(f"「{PRO_SHEET_NAME}」シートを取得中...")
    pro_rows = fetch_sheet(SPREADSHEET_ID, PRO_SHEET_NAME, PRO_QUERY)
    candidate_names = [r[0] for r in pro_rows]
    print(f"{len(candidate_names)}名(選択候補)取得しました。")

    # select_periods()はシート内の出現順を返すため、期の昇順に並べ替える。
    periods = sorted(select_periods(rows, period_of, rank_idx=4))
    print(f"採用する期: {len(periods)}件({period_label(periods[0])}〜{period_label(periods[-1])})")

    counts = count_leagues(rows, periods, LEAGUES, period_of, league_idx=3)
    upper = upper_counts(counts, periods, LEAGUES)
    series = build_player_series(
        rows, periods, LEAGUES, upper, period_of,
        name_idx=0, league_idx=3, rank_idx=4,
    )

    option_names = [n for n in candidate_names if n in series]
    skipped = len(candidate_names) - len(option_names)
    print(f"桜花シートにヒットしない選手を{skipped}名スキップしました。")

    max_total = max(sum(counts[p].values()) for p in periods)
    y_max = ((max_total // 20) + 1) * 20

    period_labels = [period_label(p) for p in periods]
    stacked_series = [
        (league, color, [counts[p][league] for p in periods])
        for league, color in zip(LEAGUES, COLORS)
    ]
    default_points = series.get(DEFAULT_NAME, [])

    chart_desktop = stacked_column_chart(
        period_labels, stacked_series, default_points,
        line_color=LINE_COLOR, y_max=y_max,
        design_width=1400, design_height=700,
        chart_left=20, chart_top=20, chart_right=20, chart_bottom=50,
        css_class="mj-league-chart-desktop", id_prefix="ouka-chart-desktop",
        chart_role="line", title="女流桜花 リーグ推移",
        desc="期ごとの各リーグの所属人数と、選手1名の全出場選手中での順位の推移",
    )
    chart_mobile = stacked_column_chart(
        period_labels, stacked_series, default_points,
        line_color=LINE_COLOR, y_max=y_max,
        design_width=380, design_height=520,
        chart_left=16, chart_top=8, chart_right=8, chart_bottom=24,
        font_size=9,
        css_class="mj-league-chart-mobile", id_prefix="ouka-chart-mobile",
        chart_role="line", title="女流桜花 リーグ推移(モバイル)",
        desc="期ごとの各リーグの所属人数と、選手1名の全出場選手中での順位の推移",
    )

    legend_items = [(color, league, None) for league, color in zip(LEAGUES, COLORS)]
    legend_items.append((LINE_COLOR, DEFAULT_NAME, "legend-line-label"))
    legend_html = render_legend(legend_items)

    options_html = "\n".join(
        f'\t\t\t<option value="ouka_leagues.html?name={esc(n)}">{esc(n)}</option>'
        for n in option_names
    )

    body_html = BODY_TEMPLATE.format(
        options=options_html,
        legend=legend_html,
        chart_desktop=chart_desktop,
        chart_mobile=chart_mobile,
    )
    output = render_content(META, body_html, count=len(option_names), wrap_main=True)
    OUTPUT_PATH.write_text(output, encoding="utf-8")
    print(f"{OUTPUT_PATH} を更新しました。")

    data_json = {name: series[name] for name in option_names}
    DATA_OUTPUT_PATH.write_text(
        json.dumps(data_json, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"{DATA_OUTPUT_PATH} を更新しました。")


if __name__ == "__main__":
    main()
