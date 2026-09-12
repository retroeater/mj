"""Googleスプレッドシートのgvizエンドポイントからデータを取得する共通ライブラリ。

サイト内の各ページ生成スクリプトから共通で利用する。
既存のフロントエンドJS(google.visualization.Query)と同じクエリ言語(SELECT文)を
そのままサーバーサイド(Python)から実行できる。
"""
import json
import re
import urllib.parse
import urllib.request


def fetch_sheet(spreadsheet_id: str, sheet_name: str, query: str, formatted: bool = False) -> list:
    """指定したスプレッドシート・シート名・Google Visualization APIクエリ言語
    (SELECT文)の実行結果を取得し、行のリスト(各行はセル値のリスト)として返す。

    ヘッダー行は含まない。値が空セルの場合は None が入る。

    formatted=False(既定)では各セルの生の値(v)を_normalize()した結果を返す。
    formatted=True にすると、セルに表示用文字列(f)があればそれを優先して使う
    (シートに設定された表示形式("#,##0.0"等)をそのまま反映する。旧Google
    Charts版のTable chartはこのfをそのまま描画していた)。

    既定をFalseにしているのは、選手IDやYouTube動画IDなどURL・HTML属性に
    埋め込む値では、fの桁区切り("6,010")がリンクを壊すため
    (_normalize()がfloatの"6010.0"を防いでいるのと同じ問題)。
    formatted=Trueを使うページでは、URLやHTML属性の組み立てに使う列が
    含まれていないことを必ず確認すること。

    文字列セルは _normalize() が前後の空白を除去する(#13)。スプレッドシート
    入力時の余分な空白(タイトル列の末尾スペース等)がJSON-LDやHTML表示に
    そのまま混入する事故があったため、個別のページ側で対処するのではなく
    取得処理の入口で一括して落とす。
    """
    encoded_query = urllib.parse.quote(query)
    encoded_sheet = urllib.parse.quote(sheet_name)
    url = (
        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/gviz/tq"
        f"?sheet={encoded_sheet}&headers=1&tq={encoded_query}&tqx=out:json"
    )

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as res:
        raw = res.read().decode("utf-8")

    # レスポンスは `google.visualization.Query.setResponse({...});` でラップされた
    # JSONPなので、中身のJSON部分だけを取り出す
    match = re.search(r"setResponse\((.*)\);?\s*$", raw, re.DOTALL)
    if not match:
        raise ValueError(f"想定外のレスポンス形式です: {raw[:200]}")

    data = json.loads(match.group(1))

    status = data.get("status")
    if status == "error":
        errors = data.get("errors", [])
        raise RuntimeError(f"スプレッドシートのクエリでエラーが発生しました: {errors}")

    rows = []
    for row in data["table"]["rows"]:
        cells = row.get("c") or []
        values = [_extract_cell(cell, formatted) for cell in cells]
        rows.append(values)

    return rows


def _extract_cell(cell, formatted):
    if not cell:
        return None
    if formatted and "f" in cell:
        return _normalize(cell["f"])
    return _normalize(cell["v"])


def _normalize(value):
    """gvizは数値セルをJSONの数値で返すため、Python側ではfloatになる。
    そのままf-stringに埋めるとIDや件数が "6010.0" のようになり、
    URLや表示が壊れる(例: https://ron2.jp/pro/6010.0)。

    整数値のfloatはintに変換して、スプレッドシート上の見た目に合わせる。
    小数部を持つ値(3.5など)は意味があるためそのまま残す。

    文字列セルは前後の空白を除去する(#13)。入力時に紛れ込んだ末尾スペース
    (例:「第11期桜蕾戦 」)がそのまま連結・出力され、JSON-LDの name が
    二重スペースになったり ?name= の完全一致が効かなくなったりしていた。
    """
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, str):
        return value.strip()
    return value
