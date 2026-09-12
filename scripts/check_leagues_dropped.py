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

#127でセレクトボックスが手書き695名から自動生成691名に変わったとき、
単純な4名減ではなく88名減・84名増だった。その88名の中に「鳳凰戦の記録が
あるのに選べなくなった選手」がいないかを確認するのがこのスクリプトの目的。
`?name=`付きURLは検索流入の主力(docs/handover.mdのSEO節)なので、
該当するとインデックス済みURLに影響が出る。

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


def analyze(mod, *, period_sort_key=None, fill_front_half=None, zero_leagues=()):
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

    return {
        "sheet": mod.SHEET_NAME,
        "rows": len(rows),
        "periods": len(periods),
        "candidates": len(candidate_names),
        "options": len(option_names),
        "series": len(series),
        "dropped": [
            {
                "name": n,
                "points": len(series[n]),
                "last_period": mod.period_label(periods[series[n][-1][0]]),
            }
            for n in dropped
        ],
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

    dropped = result["dropped"]
    if dropped:
        lines += [
            f"### ⚠ データがあるのにoptionから漏れている選手: {len(dropped)}名",
            "",
            "「プロ」シートの基準(Y列=\"Y\" かつ 最高リーグが非NULL)に"
            "入っていないため、選択リストにもJSONにも含まれていない。"
            "`?name=`で直接指定しても折れ線が出ない。",
            "",
            "| 名前 | データ点数 | 最後の期 |",
            "| --- | --- | --- |",
        ]
        lines += [
            f"| {d['name']} | {d['points']} | {d['last_period']} |"
            for d in dropped
        ]
    else:
        lines.append("### データがあるのにoptionから漏れている選手: **0名**")
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
            period_sort_key=lambda p: (p[0], 0 if p[1] == "前" else 1),
            fill_front_half=houou.fill_front_half,
            zero_leagues=houou.ZERO_LEAGUES,
        ),
        # oukaは「桜花」をLEAGUESに含めないためzero_leagues指定なしで足りる
        # (generate_ouka_leagues.pyのdocstring参照)。前期A1/A2の補完も
        # houou固有なので渡さない。期は数値なので既定の並び順でよい。
        analyze(ouka),
    ]

    print("\n\n".join(report(r) for r in results))

    total_dropped = sum(len(r["dropped"]) for r in results)
    print()
    if total_dropped:
        print(f"==> 要対応: 合計{total_dropped}名がデータを持ちながらoptionから漏れている。")
    else:
        print("==> 対応不要: データを持つ選手の漏れは両ページで0名。")

    if args.json:
        pathlib.Path(args.json).write_text(
            json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    # 漏れがあっても異常終了はしない(検知結果の報告が目的で、CIを
    # 落としたいわけではない)。件数は標準出力とJSONで判断する。
    return 0


if __name__ == "__main__":
    sys.exit(main())
