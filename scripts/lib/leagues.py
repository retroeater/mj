"""型C(houou_leagues/ouka_leagues)の集計処理。

積み上げ棒グラフ(期ごとのリーグ別人数)と、選手ごとの折れ線値(上位
リーグの人数+その選手の順位)をシートの生データから計算する。houou・
ouka で異なるのは「期」の形(hououは年+前後、oukaは期のみ)と、鳳凰位/
桜花のような「上位リーグ人数を0扱いにする特別なリーグ名」の有無だけ
なので、period_of()とzero_leaguesを呼び出し側から渡す形にして共通化した
(#127)。

前期A1/A2リーグ人数の補完(houou固有)はここでは行わない。houou側の
generate_houou_leagues.pyでcount_leagues()の戻り値に対して行ループの
外側で1回だけ適用する(#127着手前の事前調査で、旧JSの補完ブロックが
行ループの内側にあり全行ぶん冗長に実行されていたと判明したため)。
"""
from collections import defaultdict


def select_periods(rows, period_of, rank_idx=5):
    """出現順にユニークな期のキーを集め、F値(順位)が1件でもある期だけを
    残して返す。

    最新の期はリーグ配属だけ決まっていて対局はこれから、ということが
    あり(houou 43後・ouka 21期)、その期はF列が全行空になる。この規則で
    そうした「進行中で未確定の期」を積み上げ棒からも自動的に除外する
    (#127着手前の事前調査で判明)。

    この除外の副作用として、その進行中の期が初参加の選手は
    build_player_series()の戻り値が空になり、呼び出し側
    (generate_houou_leagues.py/generate_ouka_leagues.py)の
    `n in series`フィルタでoption(選手選択リスト)からスキップされる。
    表記ゆれではなく、期が確定して次にこの関数が呼ばれれば自然に
    解消する。ただし新しい期が始まるたびに同じ現象が毎期発生する
    想定。詳細は#127のコメント参照。
    """
    ordered = []
    seen = set()
    has_rank = set()
    for r in rows:
        key = period_of(r)
        if key not in seen:
            seen.add(key)
            ordered.append(key)
        if r[rank_idx] is not None:
            has_rank.add(key)
    return [k for k in ordered if k in has_rank]


def count_leagues(rows, periods, leagues, period_of, league_idx=3):
    """{期: {リーグ名: 人数}} を返す。"""
    periods_set = set(periods)
    leagues_set = set(leagues)
    counts = {p: {lg: 0 for lg in leagues} for p in periods}
    for r in rows:
        p = period_of(r)
        lg = r[league_idx]
        if p in periods_set and lg in leagues_set:
            counts[p][lg] += 1
    return counts


def upper_counts(counts, periods, leagues):
    """{期: {リーグ名: そのリーグより上位のリーグの人数合計}} を返す。"""
    result = {}
    for p in periods:
        c = counts[p]
        result[p] = {}
        running = 0
        for lg in leagues:
            result[p][lg] = running
            running += c[lg]
    return result


def build_player_series(
    rows, periods, leagues, upper, period_of,
    name_idx=0, league_idx=3, rank_idx=5, zero_leagues=(),
):
    """選手名ごとに [(期のindex, value), ...] を返す(indexの昇順)。

    出場していない期・順位が未確定の行(桜花・鳳凰位以外でrankが空の行)は
    要素を作らない。これによりstacked_column_chart()側の折れ線描画が
    自動的にinterpolateNulls相当(前後の点を直線で結ぶ)になる。

    zero_leagues: 鳳凰位のような「そのリーグが最上位で、上位リーグ人数
    (ひいてはvalue)を0として扱う」特別なリーグ名の集合。桜花のような
    F値が常に空のプレースホルダ行はleaguesに含めていなければ何もしなくても
    自然に無視される(rankがNoneなら次のelifでもスキップされるため)。
    """
    period_index = {p: i for i, p in enumerate(periods)}
    series = defaultdict(list)
    for r in rows:
        p = period_of(r)
        if p not in period_index:
            continue
        name = r[name_idx]
        lg = r[league_idx]
        if lg in zero_leagues:
            value = 0
        elif lg in leagues:
            rank = r[rank_idx]
            if rank is None:
                continue
            value = upper[p][lg] + rank
        else:
            continue
        series[name].append((period_index[p], value))
    for name in series:
        series[name].sort()
    return series
