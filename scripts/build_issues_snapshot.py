#!/usr/bin/env python3
"""docs/issues-snapshot.md をGitHub Issuesの現状(本文・コメント込み)で再生成する。

.claude/commands/issues.md (/issuesコマンド) と同じ形式。
gh issueコマンド実行後のPostToolUseフックから呼ばれる想定のため、
失敗してもClaude Codeの動作は止めない(呼び出し側で `|| true` する)。

使い方:
    python3 scripts/build_issues_snapshot.py
"""
import datetime
import json
import pathlib
import subprocess
import sys

REPO = "retroeater/mj"
REPO_ROOT = pathlib.Path(__file__).parent.parent
OUTPUT_PATH = REPO_ROOT / "docs" / "issues-snapshot.md"

FETCH_CMD = (
    'gh issue list --repo retroeater/mj --state all --limit 200 \\\n'
    '  --json number,title,state,stateReason,labels,body,comments,createdAt,closedAt'
)


def fetch_issues():
    result = subprocess.run(
        [
            "gh", "issue", "list", "--repo", REPO, "--state", "all", "--limit", "200",
            "--json", "number,title,state,stateReason,labels,body,comments,createdAt,closedAt",
        ],
        capture_output=True, text=True, check=True,
    )
    return json.loads(result.stdout)


def render(issues, generated_on):
    issues = sorted(issues, key=lambda x: -x["number"])

    lines = []
    lines.append("# GitHub Issues スナップショット")
    lines.append("")
    lines.append("このファイルは会話でissueの内容を共有するためのスナップショットです。")
    lines.append("本文・コメントを含みます（他のClaudeチャットに経緯まで正しく")
    lines.append("理解してもらうため）。最新化が必要になったら `/issues` コマンドを")
    lines.append("実行するか、以下のコマンドで再生成してください。")
    lines.append("")
    lines.append("```")
    lines.append(FETCH_CMD)
    lines.append("```")
    lines.append("")
    lines.append(f"生成日時: {generated_on}")
    lines.append("")
    lines.append(f"件数: {len(issues)}件（open/closed含む）。番号降順。")
    lines.append("")
    lines.append("---")
    lines.append("")

    for issue in issues:
        n = issue["number"]
        title = issue["title"]
        state = issue["state"]
        reason = issue.get("stateReason")
        labels = ", ".join(l["name"] for l in issue.get("labels", []))
        created = issue.get("createdAt", "")[:10]
        closed = issue.get("closedAt")
        closed = closed[:10] if closed else ""

        status_line = f"状態: {state}"
        if reason and reason not in ("None", None):
            status_line += f" ({reason})"
        status_line += f" / 作成: {created}"
        if closed:
            status_line += f" / クローズ: {closed}"

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

    return "\n".join(lines).rstrip() + "\n"


def main():
    issues = fetch_issues()
    generated_on = datetime.date.today().isoformat()
    output = render(issues, generated_on)
    OUTPUT_PATH.write_text(output, encoding="utf-8")
    print(f"{OUTPUT_PATH} を更新しました({len(issues)}件)。", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
