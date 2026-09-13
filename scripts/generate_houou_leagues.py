#!/usr/bin/env python3
"""houou_leagues.html を Googleスプレッドシート「鳳凰」シート(積み上げ棒)と
「プロ」シート(選手選択リスト)から静的HTMLとして再生成するスクリプト。
型C(#7/#127)。

これまでブラウザ側(houou_leagues.js + Google Charts)が毎回スプレッドシート
へ問い合わせ、選手ごとに全件走査して描画していた処理を、ビルド時に
Python側で一度だけ実行する。積み上げ棒(全選手共通)と既定選手の折れ線は
静的SVGに焼き込み、?name= に応じた折れ線の差し替えだけをleagues.js
(houou_leagues.html / ouka_leagues.html 共通)に委ねる。

E列(リーグ通し番号)はクエリから外している。D列(リーグ名)と冗長な列で、
シート側でE列がずれても壊れなくなるようにするため(#127着手前の事前調査)。

選手選択リストの選定基準: 「プロ」シートのY列="Y"(公開対象)かつ
鳳凰最高(Q列)に値がある選手。現行の695名の出典は「プロ」シートとの
突合でも一致率9割程度で特定できなかったため、実データを再検証した上で
この基準に切り替えた(#127のissueコメント参照)。このうち鳳凰シートの
実データに1件もヒットしない選手(表記ゆれ等、25名)は生成時にスキップ
する(選んでも折れ線が出ない項目を作らないため)。

最新の進行中の期(43後、順位が全行未確定)は積み上げ棒からも除外する
(lib/leagues.pyのselect_periods()参照)。

使い方:
    python3 scripts/generate_houou_leagues.py
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
SHEET_NAME = "鳳凰"
QUERY = "SELECT A,B,C,D,F"

PRO_SHEET_NAME = "プロ"
PRO_QUERY = 'SELECT A WHERE Y = "Y" AND Q IS NOT NULL ORDER BY B ASC'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "houou_leagues.html"
DATA_OUTPUT_PATH = REPO_ROOT / "houou_leagues_data.json"

DEFAULT_NAME = "白鳥翔"

LEAGUES = ["A1", "A2", "B1", "B2", "C1", "C2", "C3", "D1", "D2", "D3", "E1", "E2", "E3"]
COLORS = [
    "#FFCCCC",  # A1
    "#FFDDCC",  # A2
    "#FFEECC",  # B1
    "#FFFFCC",  # B2
    "#EEFFDD",  # C1
    "#DDFFEE",  # C2
    "#CCFFFF",  # C3
    "#CCEEFF",  # D1
    "#CCDDFF",  # D2
    "#CCCCFF",  # D3
    "#CCCCCC",  # E1
    "#999999",  # E2
    "#666666",  # E3
]
LINE_COLOR = "#0000CC"
ZERO_LEAGUES = {"鳳凰位"}  # 上位人数を0扱いにする(#127着手前の事前調査で判明)

META = PageMeta(
    title="リーグ推移 | 鳳凰戦 | ryoei.pro",
    description="日本プロ麻雀連盟の鳳凰戦について、選手{count}名の所属リーグ推移（期ごとの各リーグの人数、全出場選手の中での順位等）を閲覧できます。",
    og_url="https://ryoei.pro/houou_leagues.html",
    h1="鳳凰戦 リーグ推移",
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
<script defer src="leagues.js" data-json-url="houou_leagues_data.json"></script>"""


def period_of(row):
    return (row[1], row[2])


def period_label(period):
    year, half = period
    year_str = str(int(year)) if isinstance(year, float) and year.is_integer() else str(year)
    return f"{year_str}{half}"


def fill_front_half(counts, periods):
    """18前〜42前の各期でA1・A2が0件なら、直後の後期(同じ年の「後」)から
    コピーする。旧JSは行ループの内側でこの補完を行っており全行ぶん冗長に
    実行されていたが(途中の値は誤りで最終イテレーションで上書きされて
    結果的に動いていた)、ここではperiodのループの外で1回だけ行う
    (#127着手前の事前調査で判明した問題への対応)。

    43前は補完対象外(次の43後がまだ進行中で除外されているため対象に
    含まれない)。全期で例外なく一般化できることを実データで確認済み。
    """
    for year, half in periods:
        if half != "前":
            continue
        c = counts[(year, half)]
        if c["A1"] != 0 or c["A2"] != 0:
            continue
        back = (year, "後")
        if back in counts:
            c["A1"] = counts[back]["A1"]
            c["A2"] = counts[back]["A2"]


def main():
    print(f"「{SHEET_NAME}」シートを取得中...")
    rows = fetch_sheet(SPREADSHEET_ID, SHEET_NAME, QUERY)
    print(f"{len(rows)}件取得しました。")

    print(f"「{PRO_SHEET_NAME}」シートを取得中...")
    pro_rows = fetch_sheet(SPREADSHEET_ID, PRO_SHEET_NAME, PRO_QUERY)
    candidate_names = [r[0] for r in pro_rows]
    print(f"{len(candidate_names)}名(選択候補)取得しました。")

    # select_periods()はシート内の出現順を返すため、年+前後の昇順に
    # 並べ替える(シートの行順は年代順とは限らない)。
    periods = sorted(
        select_periods(rows, period_of, rank_idx=4),
        key=lambda p: (p[0], 0 if p[1] == "前" else 1),
    )
    print(f"採用する期: {len(periods)}件({period_label(periods[0])}〜{period_label(periods[-1])})")

    counts = count_leagues(rows, periods, LEAGUES, period_of, league_idx=3)
    fill_front_half(counts, periods)
    upper = upper_counts(counts, periods, LEAGUES)
    series = build_player_series(
        rows, periods, LEAGUES, upper, period_of,
        name_idx=0, league_idx=3, rank_idx=4, zero_leagues=ZERO_LEAGUES,
    )

    # 選択候補のうち、鳳凰シートの実データに1件もヒットしない選手は
    # 選んでも折れ線が出ないため、optionから除外する。
    option_names = [n for n in candidate_names if n in series]
    skipped = len(candidate_names) - len(option_names)
    print(f"鳳凰シートにヒットしない選手を{skipped}名スキップしました。")

    max_total = max(sum(counts[p].values()) for p in periods)
    y_max = ((max_total // 50) + 1) * 50  # キリの良い値に丸める(#127着手前の事前調査参照)

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
        css_class="mj-league-chart-desktop", id_prefix="houou-chart-desktop",
        chart_role="line", title="鳳凰戦 リーグ推移",
        desc="期ごとの各リーグの所属人数と、選手1名の全出場選手中での順位の推移",
    )
    # モバイル用: 52期分を375px幅にそのまま収めると1本あたり7px程度に
    # なり潰れるため、x軸ラベルは間引く(label_step)。旧Google Charts版も
    # 自動間引きをしていた(#127着手前の実機確認)。
    chart_mobile = stacked_column_chart(
        period_labels, stacked_series, default_points,
        line_color=LINE_COLOR, y_max=y_max,
        design_width=380, design_height=560,
        chart_left=8, chart_top=8, chart_right=8, chart_bottom=24,
        label_step=5, stagger_labels=False,
        font_size=9,
        css_class="mj-league-chart-mobile", id_prefix="houou-chart-mobile",
        chart_role="line", title="鳳凰戦 リーグ推移(モバイル)",
        desc="期ごとの各リーグの所属人数と、選手1名の全出場選手中での順位の推移",
    )

    legend_items = [(color, league, None) for league, color in zip(LEAGUES, COLORS)]
    legend_items.append((LINE_COLOR, DEFAULT_NAME, "legend-line-label"))
    legend_html = render_legend(legend_items)

    options_html = "\n".join(
        f'\t\t\t<option value="houou_leagues.html?name={esc(n)}">{esc(n)}</option>'
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

    # 選手ごとの折れ線データ。{名前: [[期のindex, value], ...]}。
    # 実測(#127着手前の事前調査)でgzip後36.2KB程度と50KB閾値に余裕が
    # あったため、単純な形のまま別ファイルに保存する(HTML本体を
    # 肥大化させないため。<script type="application/json">での埋め込みは
    # 見送った)。
    data_json = {name: series[name] for name in option_names}
    DATA_OUTPUT_PATH.write_text(
        json.dumps(data_json, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"{DATA_OUTPUT_PATH} を更新しました。")


if __name__ == "__main__":
    main()
