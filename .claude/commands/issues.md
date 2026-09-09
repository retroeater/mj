---
description: docs/issues-snapshot.md をGitHub Issuesの現状（本文・コメント込み）で再生成する
---

`docs/issues-snapshot.md` を最新化してください。手順:

1. 以下のコマンドでリポジトリ `retroeater/mj` の全issue（open/closed問わず）を、本文・コメント込みで取得する。

```
gh issue list --repo retroeater/mj --state all --limit 200 \
  --json number,title,state,stateReason,labels,body,comments,createdAt,closedAt
```

2. 取得結果を番号の降順（新しい順）に並べ、各issueについて以下の形式でMarkdown化する。

```
## #<番号> <タイトル>

- 状態: <state>（stateReasonがあれば括弧で付記） / 作成: <createdAt日付> / クローズ: <closedAt日付、あれば>
- ラベル: <ラベル名をカンマ区切り。なければ「(なし)」>

### 本文

<body。空なら本文セクション自体を省略>

### コメント (<件数>件)

**<comment.author.login>** (<comment.createdAt日付>):

<comment.body>

（コメントが複数あれば同様に繰り返す。0件ならコメントセクション自体を省略）

---
```

3. ファイル先頭には見出し・件数・区切り線を置く（既存の `docs/issues-snapshot.md` の先頭の書式を踏襲する）。取得コマンドの例は先頭付近に残す。
4. 変更内容を確認し、差分をユーザーに提示する。コミット・プッシュはユーザーから明示的に依頼された場合のみ行う。

補足: このファイルは本文・コメントを含むため内容量が多く、差分も大きくなりやすい。issueの数が増えるとファイルサイズも増えていくことを踏まえておく。
