#!/usr/bin/env python3
"""ページの再生成をまとめて扱うスクリプト。

scripts/generate_<ページ名>.py が存在するページを「生成対象」とみなす。
新しいページを自動化するときは生成スクリプトを1本足すだけでよく、
ワークフローのYAMLを書き換える必要がない。

使い方:
    python3 scripts/regenerate.py --list                # 対象ページの一覧
    python3 scripts/regenerate.py all                   # すべて再生成
    python3 scripts/regenerate.py jpml_pros             # 指定ページのみ
    python3 scripts/regenerate.py --changed a.js b.py   # 変更ファイルから判定
"""
import argparse
import pathlib
import subprocess
import sys

REPO_ROOT = pathlib.Path(__file__).parent.parent
SCRIPTS_DIR = REPO_ROOT / "scripts"
SHARED = "scripts/lib/"   # ここが変わったら全ページを作り直す


def known_pages():
    """scripts/generate_<名前>.py があるページの一覧"""
    return sorted(
        p.stem[len("generate_"):]
        for p in SCRIPTS_DIR.glob("generate_*.py")
    )


def pages_for_changes(changed, pages):
    """変更されたファイルの一覧から、作り直すべきページを決める。

    - scripts/lib/ 配下(共通ライブラリ)が変わったら全ページ
    - scripts/generate_<page>.py または <page>.js が変わったらそのページ
    """
    targets = set()
    for path in changed:
        path = path.strip()
        if not path:
            continue
        if path.startswith(SHARED):
            return list(pages)
        for page in pages:
            if path in (f"scripts/generate_{page}.py", f"{page}.js"):
                targets.add(page)
    return sorted(targets)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pages", nargs="*", help="ページ名、または all")
    ap.add_argument("--list", action="store_true", help="対象ページを一覧表示する")
    ap.add_argument("--changed", nargs="*", metavar="PATH",
                    help="変更ファイルの一覧から対象を判定する")
    args = ap.parse_args()

    pages = known_pages()

    if args.list:
        print("\n".join(pages))
        return 0

    if args.changed is not None:
        targets = pages_for_changes(args.changed, pages)
    elif not args.pages or "all" in args.pages:
        targets = pages
    else:
        targets = []
        for p in args.pages:
            if p not in pages:
                print(f"生成スクリプトがありません: scripts/generate_{p}.py", file=sys.stderr)
                return 1
            targets.append(p)

    if not targets:
        print("再生成の対象はありませんでした。", file=sys.stderr)
        return 0

    print(f"対象: {', '.join(targets)}", file=sys.stderr)
    for page in targets:
        script = SCRIPTS_DIR / f"generate_{page}.py"
        print(f"\n== {page} ==", file=sys.stderr)
        # 生成スクリプト自身の標準出力(進捗表示)がここで拾われ、
        # 呼び出し元のstdout(=最終行の対象ページ一覧)に混入してしまうため、
        # stderrへ流す
        result = subprocess.run([sys.executable, str(script)], cwd=REPO_ROOT, stdout=sys.stderr)
        if result.returncode != 0:
            print(f"{page} の生成に失敗しました。", file=sys.stderr)
            return result.returncode

    # コミット対象をワークフローに伝える
    print(" ".join(f"{p}.html" for p in targets))
    return 0


if __name__ == "__main__":
    sys.exit(main())
