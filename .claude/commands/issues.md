---
description: docs/issues-snapshot.md（全件）と docs/issues-open.md（Openのみ）をGitHub Issuesの現状（本文・コメント込み）で再生成する
---

`docs/issues-snapshot.md`（全件）と `docs/issues-open.md`（Openのみ）を最新化してください。手順:

1. 以下を実行する。整形ロジックは `scripts/build_issues_snapshot.py` 側にあり、
   `gh issue list --state all` を1回だけ叩いて取得したJSONから、
   Open状態のものを抽出して2ファイルを同じタイミングで書き出す
   （片方だけ更新されて内容が食い違う事故を防ぐため）。

```
python3 scripts/build_issues_snapshot.py
```

2. 変更内容を確認し、差分をユーザーに提示する。コミット・プッシュはユーザーから明示的に依頼された場合のみ行う。

補足:
- `docs/issues-snapshot.md` は全件（本文・コメント込み）のため内容量が多く、差分も大きくなりやすい。issueの数が増えるとファイルサイズも増えていくことを踏まえておく。
- `--limit 200` を超えそうな兆候（スクリプトが警告を出す）があればユーザーに知らせること。
