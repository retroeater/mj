#!/usr/bin/env python3
"""saikyo_results.html を Googleスプレッドシート「最強戦」シートのデータ
から静的HTMLとして再生成するスクリプト。lib/page.py の共通処理を使う(#7)。
型Aの2列ページ。ランキング3ページを除くと型Aで最後のページ。

これまでブラウザ側(saikyo_results.js + Google Charts)が毎回スプレッド
シートへ問い合わせていた処理を、ビルド時にPython側で一度だけ実行して
静的HTMLに焼き込む。

## ?name= のバグを修正して移行する(2026-09-11、実機確認済み)

旧JSは `queryStatement += ' AND A = "' + search_name + '"'` としており、
コメントで "A 対局日 / H 名前" と書きながら、名前ではなく対局日に対する
完全一致になっていた(gh-pages版で実機確認: ?name=<実在選手名>は0件、
?name=<実在の対局日>はヒットする)。

#122で ?name= 付きURLが検索結果に含まれている可能性を調べている最中で、
削除すると検索流入が全件表示に落ちる懸念があるため、パラメータ自体は
残しつつ「意図されていた挙動」(H列=名前の完全一致)に修正して移行する。
これは「ほぼ常に0件」から「名前で絞り込める」への意図的な挙動変更であり、
バグの再現はしない。#7にコメントで記録している。

## 写真が空の行(528件、全体の約20%)

旧JSのgetFormattedImage()はTwitter IDも画像URLもない行で戻り値が
未初期化(undefined)になるバグを持っていたが、実機確認の結果Google
Chartsはこれを空セル(&nbsp;)として表示しており「undefined」という
文字列が出るわけではなかった。build_image_cell()にurl=""・image_url=""
を渡せば同じ「空欄+フォールバック画像」の見た目になるため、この分岐を
個別に処理する必要はない。

使い方:
    python3 scripts/generate_saikyo_results.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, TableConfig, build_image_cell, esc, generate  # noqa: E402

SPREADSHEET_ID = "1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0"
SHEET_NAME = "最強戦"
# ?name= はクエリに足さない(旧版のバグを再現しない)。全行を焼き込んだ
# うえでdata-nameの完全一致に置き換える(jpml_titles/resource_logs/
# saikyo_mensと同じ方式)。
QUERY = 'SELECT A,B,C,D,E,F,G,H,I,J WHERE K = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "saikyo_results.html"

META = PageMeta(
    title="麻雀最強戦 | ryoei.pro",
    description="麻雀最強戦の成績（2011年以降のグループリーグおよびファイナル）をまとめています。",
    og_url="https://ryoei.pro/saikyo_results.html",
    h1="麻雀最強戦 成績",
    caption="麻雀最強戦の成績（2011年以降のグループリーグおよびファイナル）一覧。",
)

# ?name= はdata-nameの完全一致(H列=名前。旧版はA列=対局日に対する
# 完全一致になっていたバグを修正)。?tag= は概要の絞り込み欄の初期値
# (旧infoFilterのstate.valueがsearch_tagだったのを踏襲)。
# 旧Google Charts版のpageSize:100を踏襲する。
TABLE = TableConfig(
    table_id="saikyo_results_table",
    headers=["写真", "概要"],
    page_size=100,
    name_mode="exact",
    filter_param="tag",
)


def get_info_cell(game_date, fiscal_year, game_name, game_stage, game_table, player_rank, player_result, player_name) -> str:
    """概要列のセルを生成する。元のJS getFormattedTitle() と同じ組み立て。

    対局日があれば「対局日<br>麻雀最強戦{年度}」、なければ
    「麻雀最強戦{年度}」。卓が'-'なら卓番号を付けない。
    結果は順位の有無で「N位{結果}」か「{結果}」を出し分ける。
    フィールドはそれぞれescしてから<br>で連結する(<br>自体は意図した
    HTMLなのでescしない)。"""
    if game_date:
        game_title = f"{esc(game_date)}<br>麻雀最強戦{esc(fiscal_year)}"
    else:
        game_title = f"麻雀最強戦{esc(fiscal_year)}"

    if game_table == "-":
        game_name_full = f"{esc(game_name)} {esc(game_stage)}"
    else:
        game_name_full = f"{esc(game_name)} {esc(game_stage)} {esc(game_table)}卓"

    if player_result:
        if player_rank:
            result_suffix = f"<br>{esc(player_rank)}位{esc(player_result)}"
        else:
            result_suffix = f"<br>{esc(player_result)}"
    else:
        result_suffix = ""

    return f"{game_title}<br>{game_name_full}<br>{esc(player_name)}{result_suffix}"


def build_row_html(row) -> str:
    (
        game_date, fiscal_year, game_name, game_stage, game_table,
        player_rank, player_result, player_name, twitter_id, image_url,
    ) = row

    # 写真セル。Twitter IDがあればXへのリンクにする(旧版はtwitter.comの
    # ままだったが、saikyo_mensでx.comに揃えたのに合わせる)。
    # フォールバックはimg/avatar.svgに統一する(旧版はTwitter IDの有無で
    # img/twitter.svgとsrc=''(自ページへのリクエストになるバグ)に
    # 分かれていた。saikyo_mensでimg/avatar.svgに統一した前例に合わせる
    # 意図的な変更)。
    twitter_url = f"https://x.com/{twitter_id}" if twitter_id else ""
    photo_cell = build_image_cell(
        alt=player_name, url=twitter_url, image_url=image_url or "",
        css_class="rectangle", width=160, height=90, fallback="img/avatar.svg",
    )

    info_cell = get_info_cell(
        game_date, fiscal_year, game_name, game_stage, game_table,
        player_rank, player_result, player_name,
    )

    # 検索用文字列は <br> ではなく半角スペースで連結する。
    # 表示用HTMLをそのままエスケープすると "&lt;br&gt;" が入り「br」で
    # 全行がヒットしてしまう問題を避けるため(saikyo_mens等と同じ)。
    # 旧infoFilterは概要列(matchType:'any')に対する絞り込みだったため、
    # 表示に使うフィールドすべてを検索対象に含める。
    info_value = esc(
        " ".join(
            str(v) for v in [
                game_date, f"麻雀最強戦{fiscal_year}", game_name, game_stage,
                None if game_table == "-" else f"{game_table}卓",
                f"{player_rank}位" if player_rank else None,
                player_result, player_name,
            ]
            if v
        )
    )
    name_value = esc(player_name or "")

    return (
        f'<tr data-name="{name_value}" data-info="{info_value}">'
        f"<td>{photo_cell}</td>"
        f'<td class="mj-left">{info_cell}</td>'
        f"</tr>"
    )


if __name__ == "__main__":
    generate(SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html)
