#!/usr/bin/env python3
"""型C(houou_leagues / ouka_leagues)で、リーグの実データがあるのに
選手選択リスト(option)から漏れている選手を検出する。#168の項目2。

## 何を確かめたいか

型Cの生成スクリプトは、選手選択リストを「プロ」シートの基準
(Y列="Y" かつ 鳳凰最高/桜花最高が非NULL)で選び、そこから鳳凰/桜花シート
にヒットしない選手を落としている。

    option_names = [n for n in candidate_names if n in series]

この向きの漏れ(候補にいるがデータが無い)は生成時にログへ出る。だが
**逆向きの漏れ(鳳凰/桜花シートにデータがあるのに候補に入っていない)は
どこにも出ない。** 書き出されるJSONもoption_namesで絞った後のものなので、
生成物からは判定できない(#168)。

## #168での結論: いま報告される選手は全員「退会済み」で、正しい状態

#127でセレクトボックスが手書き695名から自動生成691名に変わったとき、
単純な4名減ではなく88名減・84名増だった。この差が退行かどうかを
確かめるためにこのスクリプトを作り、2026-09-12に実行した結果:

- データがあるのに候補に入っていない: 689名(houou 605 / ouka 84)
- うち#127以前は選べた: 78名(houou 66 / ouka 12)

**この78名は全員が日本プロ麻雀連盟を退会済みであることを確認した
(#168)。「プロ」シートのY列="Y"は在籍・公開対象を表すため、退会者が
選択リストに出ないのは正しい挙動。対応不要。**

## それでもこのスクリプトを残す理由

「プロ」シートのY列や最高リーグ列の入力漏れを検知できる。
**ここに在籍中の選手が現れたらシート側の入力漏れ**で、その選手は
選択リストからもJSONからも落ち、`?name=`付きURL(検索流入の主力。
docs/handover.mdのSEO節)でも折れ線が出なくなる。

出力は警告ではなく参考情報として読むこと。退会者が並ぶのは正常。

## 生成スクリプトを変更しない方針

`generate_*.py` から定数と period_of() / fill_front_half() をimportし、
集計は lib/leagues.py を生成時と同じ引数で呼ぶ。import時にmain()は
走らない(`if __name__ == "__main__"`で守られているため)ので、
ページの再生成は発生しない。

引数を生成側と揃えることが前提のため、生成スクリプト側で
build_player_series() の引数を変えたときはこのスクリプトも直すこと。

使い方:
    python3 scripts/check_leagues_dropped.py
    python3 scripts/check_leagues_dropped.py --json result.json
"""
import argparse
import json
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))

import generate_houou_leagues as houou  # noqa: E402
import generate_ouka_leagues as ouka  # noqa: E402
from lib.leagues import (  # noqa: E402
    build_player_series,
    count_leagues,
    select_periods,
    upper_counts,
)
from lib.sheets import fetch_sheet  # noqa: E402


# #127でセレクトボックスが自動生成に変わる直前のコミット。ここから
# 手書きだった旧option一覧を取り出し、「以前は選べたのに選べなくなり、
# かつデータを持っている」選手＝#127による実際の退行分を切り分ける。
#
# 漏れの総数(689名)には、鳳凰シートが52期(約26年)の履歴を持つために
# 含まれる引退選手が大量に混ざる。それらは元々選べなかったので#127の
# 退行ではなく、「引退選手も閲覧できるようにするか」という別の判断。
PRE_127_REF = "03cb23b~1"


def previous_option_names(page_file):
    """#127直前のHTMLから、手書きだった旧option一覧を取り出す。

    actions/checkout の既定(fetch-depth: 1)では履歴が無く取得できない。
    取れなかった場合はNoneを返し、比較を省いて総数だけ報告する。
    """
    try:
        html = subprocess.run(
            ["git", "show", f"{PRE_127_REF}:{page_file}"],
            capture_output=True, text=True, check=True,
        ).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    return set(re.findall(r"\?name=([^\"]+)\"", html))


def analyze(mod, *, page_file, period_sort_key=None, fill_front_half=None, zero_leagues=()):
    """生成スクリプトと同じ手順で series と option_names を作り、
    両方向の差分を返す。"""
    rows = fetch_sheet(mod.SPREADSHEET_ID, mod.SHEET_NAME, mod.QUERY)
    pro_rows = fetch_sheet(mod.SPREADSHEET_ID, mod.PRO_SHEET_NAME, mod.PRO_QUERY)
    candidate_names = [r[0] for r in pro_rows]

    # 差分の判定自体は期の並び順に依存しないが、報告に「最後の期」を
    # 出すため生成スクリプトと同じ規則で並べ替える。
    periods = sorted(select_periods(rows, mod.period_of, rank_idx=4), key=period_sort_key)
    counts = count_leagues(rows, periods, mod.LEAGUES, mod.period_of, league_idx=3)
    if fill_front_half:
        fill_front_half(counts, periods)
    upper = upper_counts(counts, periods, mod.LEAGUES)
    series = build_player_series(
        rows, periods, mod.LEAGUES, upper, mod.period_of,
        name_idx=0, league_idx=3, rank_idx=4, zero_leagues=zero_leagues,
    )

    candidates = set(candidate_names)
    option_names = [n for n in candidate_names if n in series]

    # 本題: データがあるのに候補に入っていない選手
    dropped = sorted(n for n in series if n not in candidates)
    # 既知の向き: 候補にいるがデータが無い選手(生成時のログに出るもの)
    no_data = sorted(n for n in candidate_names if n not in series)

    def entry(n):
        return {
            "name": n,
            "points": len(series[n]),
            "last_period": mod.period_label(periods[series[n][-1][0]]),
            # 直近の期から何期前か。判断の重みづけに使う(直近まで出ていた
            # 選手ほど、選べなくなった影響が大きい)
            "periods_ago": len(periods) - 1 - series[n][-1][0],
        }

    # #127の退行分: 以前は選べて、データもあるのに、いま選べない選手。
    # 直近の期に出ていた順に並べる(判断の優先度が高い順)。
    previous = previous_option_names(page_file)
    regressed = (
        None if previous is None
        else sorted((entry(n) for n in dropped if n in previous),
                    key=lambda e: (e["periods_ago"], -e["points"], e["name"]))
    )

    return {
        "sheet": mod.SHEET_NAME,
        "regressed": regressed,
        "rows": len(rows),
        "periods": len(periods),
        "candidates": len(candidate_names),
        "options": len(option_names),
        "series": len(series),
        "dropped": [entry(n) for n in dropped],
        "no_data": no_data,
    }


def report(result) -> str:
    lines = [
        f"## 「{result['sheet']}」シート",
        "",
        f"- シートの行数: {result['rows']}",
        f"- 採用した期: {result['periods']}",
        f"- 選択候補(プロシートの基準): {result['candidates']}名",
        f"- 実際のoption: {result['options']}名",
        f"- リーグデータを持つ選手: {result['series']}名",
        "",
    ]

    regressed = result["regressed"]
    if regressed is None:
        lines += [
            "> #127直前のoption一覧を取得できなかったため、退行分の切り分けは"
            "省略した(actions/checkoutのfetch-depthを0にする必要がある)。",
            "",
        ]
    elif regressed:
        lines += [
            f"### 参考: #127以前は選べたが、いま選べない選手: {len(regressed)}名",
            "",
            "#127でセレクトボックスが手書きから自動生成に変わった際に"
            "選べなくなり、かつリーグの実データを持つ。**2026-09-12の確認では"
            "全員が退会済みで、選択リストに出ないのが正しい状態だった（#168）。**"
            "この一覧に在籍中の選手が現れた場合だけ、「プロ」シートの"
            "Y列・最高リーグ列の入力漏れを疑うこと。直近の期に出ていた順に"
            "並べた（在籍中の選手が混ざっていれば上に出る）。",
            "",
            "| 名前 | データ点数 | 最後の期 | 何期前 |",
            "| --- | --- | --- | --- |",
        ] + [
            f"| {e['name']} | {e['points']} | {e['last_period']} | {e['periods_ago']} |"
            for e in regressed
        ] + [""]
    else:
        lines += [
            "### #127以前は選べたが、いま選べない選手: **0名**",
            "",
            "以前選べた選手のうち、データを持ちながら選べなくなった人はいない。"
            "下記の漏れはすべて#127以前から選べなかった選手。",
            "",
        ]

    dropped = result["dropped"]
    if dropped:
        lines += [
            f"### 参考: データがあるのにoptionから漏れている選手（総数）: {len(dropped)}名",
            "",
            "「プロ」シートの基準(Y列=\"Y\" かつ 最高リーグが非NULL)に"
            "入っていないため、選択リストにもJSONにも含まれていない。"
            "**退会済みの選手。鳳凰シートは52期(約26年)の履歴を持つため、"
            "現在は在籍していない選手が大量に含まれる。** 「退会者の"
            "リーグ推移も閲覧できるようにするか」は#127/#168とは別の判断"
            "(現状は見られない)。",
            "",
            "| 名前 | データ点数 | 最後の期 |",
            "| --- | --- | --- |",
        ]
        lines += [
            f"| {d['name']} | {d['points']} | {d['last_period']} |"
            for d in dropped
        ]
    else:
        lines.append("### 参考: データがあるのにoptionから漏れている選手（総数）: **0名**")
        lines.append("")
        lines.append("リーグデータを持つ選手はすべて選択リストに含まれている。対応不要。")

    lines += [
        "",
        f"### 参考: 候補にいるがデータが無い選手: {len(result['no_data'])}名",
        "",
        "初出場の期が進行中で順位が未確定の選手(#168の項目1で対応済み。"
        "着地時に説明を出すようにした)。期が確定すれば自然に解消する。",
        "",
    ]
    if result["no_data"]:
        lines.append("```")
        lines.append(", ".join(result["no_data"]))
        lines.append("```")

    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", metavar="PATH", help="結果をJSONで書き出す")
    args = ap.parse_args()

    results = [
        analyze(
            houou,
            page_file="houou_leagues.html",
            period_sort_key=lambda p: (p[0], 0 if p[1] == "前" else 1),
            fill_front_half=houou.fill_front_half,
            zero_leagues=houou.ZERO_LEAGUES,
        ),
        # oukaは「桜花」をLEAGUESに含めないためzero_leagues指定なしで足りる
        # (generate_ouka_leagues.pyのdocstring参照)。前期A1/A2の補完も
        # houou固有なので渡さない。期は数値なので既定の並び順でよい。
        analyze(ouka, page_file="ouka_leagues.html"),
    ]

    print("\n\n".join(report(r) for r in results))

    total_dropped = sum(len(r["dropped"]) for r in results)
    regressed_known = all(r["regressed"] is not None for r in results)
    total_regressed = (
        sum(len(r["regressed"]) for r in results) if regressed_known else None
    )
    print()
    print(f"==> データを持ちながらoptionから漏れている総数: {total_dropped}名(退会済み)")
    if total_regressed is None:
        print("==> #127以前は選べた選手の抽出: 判定できず(履歴が浅い)")
    elif total_regressed:
        print(f"==> うち{total_regressed}名は#127以前は選べた。")
        print("    2026-09-12の確認では全員退会済みで正しい状態(#168)。")
        print("    在籍中の選手が混ざっていないかだけ確認すること。")
    else:
        print("==> #127以前は選べたのに選べなくなった選手は0名。")

    if args.json:
        pathlib.Path(args.json).write_text(
            json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    # 漏れがあっても異常終了はしない(検知結果の報告が目的で、CIを
    # 落としたいわけではない)。件数は標準出力とJSONで判断する。
    return 0


if __name__ == "__main__":
    sys.exit(main())
