#!/usr/bin/env python3
"""docs/issues-snapshot.md と docs/issues-open.md をGitHub Issuesの現状(本文・コメント込み)で再生成する。

.claude/commands/issues.md (/issuesコマンド) から呼ばれる想定、および
gh issueコマンド実行後のPostToolUseフックから呼ばれる想定のため、
失敗してもClaude Codeの動作は止めない(呼び出し側で `|| true` する)。

issues-snapshot.md は全件（Open+Closed）、issues-open.md はOpenのみ。
片方だけ更新されると「Open側には残っているが実はClose済み」という食い違いが
起きるため、必ず両方を同じタイミングで生成する(#143)。

使い方:
    python3 scripts/build_issues_snapshot.py
"""
import datetime
import json
import pathlib
import subprocess
import sys
from zoneinfo import ZoneInfo

REPO = "retroeater/mj"
REPO_ROOT = pathlib.Path(__file__).parent.parent
SNAPSHOT_PATH = REPO_ROOT / "docs" / "issues-snapshot.md"
OPEN_PATH = REPO_ROOT / "docs" / "issues-open.md"
LIMIT = 500

ALL_FIELDS = "number,title,state,stateReason,labels,body,comments,createdAt,closedAt"

ALL_FETCH_CMD = (
    f'gh issue list --repo {REPO} --state all --limit {LIMIT} \\\n'
    f'  --json {ALL_FIELDS}'
)


def fetch_issues():
    result = subprocess.run(
        [
            "gh", "issue", "list", "--repo", REPO, "--state", "all", "--limit", str(LIMIT),
            "--json", ALL_FIELDS,
        ],
        capture_output=True, text=True, check=True,
    )
    return json.loads(result.stdout)


def render_issue_block(issue, include_state):
    lines = []
    n = issue["number"]
    title = issue["title"]
    labels = ", ".join(l["name"] for l in issue.get("labels", []))
    created = issue.get("createdAt", "")[:10]

    if include_state:
        state = issue["state"]
        reason = issue.get("stateReason")
        closed = issue.get("closedAt")
        closed = closed[:10] if closed else ""
        status_line = f"状態: {state}"
        if reason and reason not in ("None", None):
            status_line += f" ({reason})"
        status_line += f" / 作成: {created}"
        if closed:
            status_line += f" / クローズ: {closed}"
    else:
        status_line = f"作成: {created}"

    lines.append(f"## #{n} {title}")
    lines.append("")
    lines.append(f"- {status_line}")
    lines.append(f"- ラベル: {labels if labels else '(なし)'}")
    lines.append("")

    body = (issue.get("body") or "").strip()
    if body:
        lines.append("### 本文")
        lines.append("")
        lines.append(body)
        lines.append("")

    comments = issue.get("comments") or []
    if comments:
        lines.append(f"### コメント ({len(comments)}件)")
        lines.append("")
        for c in comments:
            author = c.get("author", {}).get("login", "unknown")
            cdate = (c.get("createdAt") or "")[:10]
            cbody = (c.get("body") or "").strip()
            lines.append(f"**{author}** ({cdate}):")
            lines.append("")
            lines.append(cbody)
            lines.append("")

    lines.append("---")
    lines.append("")
    return lines


def render(issues, header_lines, include_state):
    issues = sorted(issues, key=lambda x: -x["number"])
    lines = list(header_lines)
    for issue in issues:
        lines.extend(render_issue_block(issue, include_state))
    return "\n".join(lines).rstrip() + "\n"


def snapshot_header(generated_on, count):
    return [
        "# GitHub Issues スナップショット（全件）",
        "",
        f"生成日時: {generated_on}",
        "",
        "このファイルは会話でissueの内容を共有するためのスナップショットです。",
        "本文・コメントを含みます（他のClaudeチャットに経緯まで正しく",
        "理解してもらうため）。Closed分も含む全件です。",
        "",
        "【参照ルール】セッション開始時はこのファイルではなく issues-open.md を",
        "読んでください。このファイルは、セッション中に指示が正しく実施されたかを",
        "確認するときに参照します（完了するとOpen側から消えるため）。",
        "",
        "最新化が必要になったら `/issues` コマンドを実行するか、以下のコマンドで",
        "issues-open.md と同時に再生成してください。",
        "",
        "```",
        ALL_FETCH_CMD,
        "```",
        "",
        f"件数: {count}件（open/closed含む）。番号降順。",
        "",
        "---",
        "",
    ]


def open_header(generated_on, count):
    return [
        "# GitHub Issues スナップショット（Openのみ）",
        "",
        f"生成日時: {generated_on}",
        "",
        "未完了のissueだけを抜き出したスナップショットです。本文・コメントを",
        "含みます（他のClaudeチャットに経緯まで正しく理解してもらうため）。",
        "",
        "【参照ルール】セッション開始時はこのファイルを読んでください。",
        "完了確認など、Close済みのissueを見る必要があるときは",
        "issues-snapshot.md（全件）を参照します。",
        "",
        "最新化が必要になったら `/issues` コマンドを実行してください。",
        "issues-snapshot.md と同時に再生成されます。",
        "",
        f"件数: {count}件（openのみ）。番号降順。",
        "",
        "---",
        "",
    ]


def main():
    all_issues = fetch_issues()
    open_issues = [i for i in all_issues if i["state"] == "OPEN"]
    generated_on = datetime.datetime.now(ZoneInfo("Asia/Tokyo")).strftime("%Y-%m-%d %H:%M JST")

    snapshot_output = render(all_issues, snapshot_header(generated_on, len(all_issues)), include_state=True)
    open_output = render(open_issues, open_header(generated_on, len(open_issues)), include_state=False)

    SNAPSHOT_PATH.write_text(snapshot_output, encoding="utf-8")
    OPEN_PATH.write_text(open_output, encoding="utf-8")

    print(f"{SNAPSHOT_PATH} を更新しました({len(all_issues)}件)。", file=sys.stderr)
    print(f"{OPEN_PATH} を更新しました({len(open_issues)}件)。", file=sys.stderr)
    if len(all_issues) >= LIMIT:
        print(
            f"警告: 全件版が --limit {LIMIT} に到達しました。上限を引き上げる必要があるかもしれません。",
            file=sys.stderr,
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
