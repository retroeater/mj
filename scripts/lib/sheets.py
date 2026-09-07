"""Googleスプレッドシートのgvizエンドポイントからデータを取得する共通ライブラリ。

サイト内の各ページ生成スクリプトから共通で利用する。
既存のフロントエンドJS(google.visualization.Query)と同じクエリ言語(SELECT文)を
そのままサーバーサイド(Python)から実行できる。
"""
import json
import re
import urllib.parse
import urllib.request


def fetch_sheet(spreadsheet_id: str, sheet_name: str, query: str) -> list:
    """指定したスプレッドシート・シート名・Google Visualization APIクエリ言語
    (SELECT文)の実行結果を取得し、行のリスト(各行はセル値のリスト)として返す。

    ヘッダー行は含まない。値が空セルの場合は None が入る。
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
        values = [cell["v"] if cell else None for cell in cells]
        rows.append(values)

    return rows
