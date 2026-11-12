"""재작성 기준(rewrite-criteria.md) 형식 검사.

사용: python3 -I .scratch/seasonal-content-assignments/check-chunk.py .scratch/chunks/fruit-02.md [...]
문제가 없으면 항목마다 OK, 있으면 이유를 출력하고 종료 코드 1을 돌려준다.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = json.loads((ROOT / "packages/seasonal/src/data/food-registry.json").read_text())

HEADINGS = ["1. 개요 및 특징", "2. 맛과 식감", "3. 고르는 방법", "4. 보관 및 손질법", "5. 추천 요리", None, "8. 출처 및 근거"]
SIXTH = {"6. 품종과 유통 특성", "6. 어종과 유통 특성", "6. 재배와 활용 특성"}
BANNED = ["면역", "항산화", "해독", "혈압", "혈당", "당뇨", "항암", "노화", "다이어트", "숙취", "피로 회복", "피로회복",
          "부종", "찬 성질", "따뜻한 성질", "콜레스테롤", "혈관", "일품", "제격", "최고조", "탁월", "Snippet"]
CLICKBAIT = ["이것만", "모르면 손해", "!", "?"]


def months_of(text):
    """'11월~이듬해 2월(달력)' → {11, 12, 1, 2}. 달이 없으면 빈 집합."""
    out = set()
    pattern = r"(\d+)\s*월?\s*~\s*(?:이듬해\s*)?(\d+)\s*월"
    for a, b in re.findall(pattern, text):
        m, end = int(a), int(b)
        while True:
            out.add(m)
            if m == end:
                break
            m = m % 12 + 1
    for group in re.findall(r"((?:\d+·)*\d+)월", re.sub(pattern, "", text)):
        out.update(int(a) for a in group.split("·"))
    return out


def check_entry(food_id, name, body):
    problems = []
    reg = REGISTRY.get(food_id)
    if not reg:
        return ["레지스트리에 없는 ID"]
    if reg["name"] != name:
        problems.append(f"이름이 레지스트리({reg['name']})와 다름")

    headings = re.findall(r"^### (.+)$", body, re.M)
    if len(headings) != 7 or headings[5] not in SIXTH or [h for i, h in enumerate(headings) if i != 5] != [h for h in HEADINGS if h]:
        problems.append(f"섹션 제목/순서가 기준과 다름: {headings}")

    summary = re.search(r"> \*\*한 줄 소개 \(summary, (\d+)자\)\*\*\n> (.+)", body)
    if not summary:
        problems.append("한 줄 소개 형식이 다름")
    else:
        text = summary.group(2).strip()
        if int(summary.group(1)) != len(text):
            problems.append(f"한 줄 소개 글자 수 표기 {summary.group(1)} ≠ 실제 {len(text)}")
        if not 70 <= len(text) <= 90:
            problems.append(f"한 줄 소개 {len(text)}자 (70~90)")
        if not text.startswith(name):
            problems.append("한 줄 소개가 품목명으로 시작하지 않음")
        if not months_of(text.split(".")[0]) & set(reg["months"]):
            problems.append("한 줄 소개 첫 문장에 제철 달이 없음")
        if not re.search(r"(요|세요)\.$", text):
            problems.append("한 줄 소개가 해요체로 끝나지 않음")
        for word in CLICKBAIT:
            if word in text:
                problems.append(f"한 줄 소개에 '{word}'")

    season = re.search(r"\*\*제철 / 절정\*\* \| (.+?) \|", body)
    if not season:
        problems.append("제철 / 절정 행 없음")
    else:
        main, _, peak = season.group(1).partition(" / ")
        memo = "검수 메모" in body
        if months_of(main) != set(reg["months"]) and not memo:
            problems.append(f"제철 {sorted(months_of(main))} ≠ 레지스트리 {reg['months']} (검수 메모 없음)")
        if reg.get("peak") and months_of(peak) != set(reg["peak"]) and not memo:
            problems.append(f"절정 {sorted(months_of(peak))} ≠ 레지스트리 {reg['peak']} (검수 메모 없음)")

    sources = re.search(r"### 8\. 출처 및 근거\n(.*?)(?:\n\n|\Z)", body, re.S)
    lines = re.findall(r"^- .*$", sources.group(1), re.M) if sources else []
    if not lines:
        problems.append("출처 없음")
    for line in lines:
        if not re.match(r"^- \[[^\]]+ · [^\]]+\]\(https?://[^)]+\) · \d{4}-\d{2}-\d{2} 확인$", line):
            problems.append(f"출처 형식: {line[:60]}")
    if len(lines) == 1 and "검수 메모" not in body:
        problems.append("출처 1개인데 검수 메모 없음")

    # 출처 줄의 자료 제목과 검수 메모는 화면에 나가지 않으므로 금지어 검사에서 뺀다.
    shown = re.sub(r"### 8\. 출처 및 근거.*", "", body, flags=re.S)
    for word in BANNED:
        if word in shown:
            problems.append(f"금지어 '{word}'")
    # 작업 메모가 본문에 섞이면 화면에 그대로 나간다.
    for phrase in re.findall(r"[^.\n]*(?:출처 자료에는|출처에는|출처에 없|원 자료에는|원 자료에 없)[^.\n]*", shown):
        problems.append(f"본문에 작업 메모: {phrase.strip()[:40]}")
    if re.search(r"^### \d\. .*\([A-Za-z]", body, re.M):
        problems.append("제목에 영어 병기")
    return problems


def main(paths):
    failed = False
    for path in paths:
        text = Path(path).read_text()
        entries = re.findall(r"\n## ([a-z0-9-]+) \| (.+?)\n(.*?)(?=\n## [a-z0-9-]+ \| |\Z)", text, re.S)
        done = len(re.findall(r"^- \[x\]", text, re.M))
        status = re.search(r"작성 (\d+)", text)
        if not status or int(status.group(1)) != done or done != len(entries):
            print(f"{path}: 상태 줄 작성 수, 체크 수({done}), 본문 수({len(entries)})가 맞지 않음")
            failed = True
        for food_id, name, body in entries:
            problems = check_entry(food_id, name.strip(), body)
            print(f"{'OK ' if not problems else 'NG '} {food_id}" + ("" if not problems else ": " + "; ".join(problems)))
            failed |= bool(problems)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
