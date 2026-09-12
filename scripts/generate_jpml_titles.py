#!/usr/bin/env python3
"""jpml_titles.html を Googleスプレッドシート「タイトル」シートのデータから
静的HTMLとして再生成するスクリプト。lib/page.py の共通処理を使う(#7の
共通化で generate_jpml_pros.py 以外の型A・2列ページから括り出したもの)。

これまでブラウザ側(jpml_titles.js + Google Charts)が毎回スプレッドシートへ
問い合わせていた処理を、ビルド時にPython側で一度だけ実行して静的HTMLに
焼き込む。フィルター・ページ送りはページ側の共有JS(table.js)に委譲する。

使い方:
    python3 scripts/generate_jpml_titles.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib.page import PageMeta, TableConfig, build_image_cell, esc, generate  # noqa: E402

SPREADSHEET_ID = "1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0"
SHEET_NAME = "タイトル"
QUERY = 'SELECT A,B,C,D,E,F WHERE G = "Y"'

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "jpml_titles.html"

META = PageMeta(
    title="タイトル | 日本プロ麻雀連盟 | ryoei.pro",
    description="日本プロ麻雀連盟の麻雀プロが出場するタイトル戦について、歴代優勝者と決勝進出者{count}件をまとめています。選手名・タイトル戦名称などで検索できます。",
    og_url="https://ryoei.pro/jpml_titles.html",
    h1="日本プロ麻雀連盟 タイトル戦一覧",
    caption="日本プロ麻雀連盟のタイトル戦、歴代優勝者と決勝進出者一覧。",
)

# ?name= は data-name との完全一致(旧 Google Charts 版の WHERE A = "名前" と
# 同じ挙動)。?tag= は概要の絞り込み欄の初期値(部分一致)に使う。
TABLE = TableConfig(
    table_id="titles_table",
    headers=["写真", "概要"],
    page_size=100,
    name_mode="exact",
    filter_param="tag",
)


def get_info_cell(published_date, title, rank, name) -> str:
    """概要列のセルを生成する。元のJS getFormattedTitle() と同じく、
    日付 / タイトル / 名前 / 順位+"位" を <br> で連結する。
    空の項目は行ごと省く。"""
    parts = [published_date, title, name]
    if rank:
        parts.append(f"{rank}位")
    return "<br>".join(esc(p) for p in parts if p)


def build_row_html(row) -> str:
    name, profile_url, image_url, rank, title, published_date = row

    image_cell = build_image_cell(
        alt=name, url=profile_url, image_url=image_url,
        css_class="avatar", width=80, height=80, fallback="img/avatar.svg",
    )
    info_cell = get_info_cell(published_date, title, rank, name)

    # 検索用文字列は <br> ではなく半角スペースで連結する。
    # jpml_pros の data-place で、表示用HTMLをそのままエスケープすると
    # "&lt;br&gt;" が入り「br」で全行がヒットしてしまった問題の再発を避ける。
    info_value = esc(
        " ".join(filter(None, [published_date, title, name, f"{rank}位" if rank else None]))
    )
    name_value = esc(name or "")

    # 概要セルへの data-sort は付けない。値が data-info(行のtr属性)と
    # 完全に同一で、そのまま出力すると全行分重複してHTMLが膨らむため。
    # 列ヘッダによるソートは jpml_pros.html 専用の機能とする方針のため、
    # このページ自体はソートを持たない。
    return (
        f'<tr data-name="{name_value}" data-info="{info_value}">'
        f"<td>{image_cell}</td>"
        f'<td class="mj-left">{info_cell}</td>'
        f"</tr>"
    )


if __name__ == "__main__":
    generate(SPREADSHEET_ID, SHEET_NAME, QUERY, OUTPUT_PATH, META, TABLE, build_row_html)
