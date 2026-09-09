---
description: docs/issues-snapshot.md をGitHub Issuesの現状で再生成する
---

`docs/issues-snapshot.md` を最新化してください。手順:

1. 以下のコマンドでリポジトリ `retroeater/mj` の全issue（open/closed問わず）を取得する。

```
gh issue list --repo retroeater/mj --state all --limit 200 \
  --json number,title,state,labels \
  --template '{{range .}}| #{{.number}} | {{.title}} | {{.state}} | {{range .labels}}{{.name}} {{end}} |
{{end}}'
```

2. `docs/issues-snapshot.md` の「生成日時」を今日の日付に更新し、表の内容を取得結果で丸ごと置き換える（コマンド例の節は変更しない）。
3. 変更内容を確認し、差分をユーザーに提示する。コミット・プッシュはユーザーから明示的に依頼された場合のみ行う。
