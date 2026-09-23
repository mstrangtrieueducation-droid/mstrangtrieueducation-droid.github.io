#!/usr/bin/env python3
"""Apply verified source images to every layout-sensitive IELTS Listening visual.

The site historically recreated maps and diagrams with CSS/HTML. That is unsafe for
IELTS questions because a shifted road, label, or arrow changes the question itself.
This script makes the conversion reproducible and idempotent: spatial visuals use
the checked-in source image, while answer controls remain accessible below it.
"""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PAGES = ROOT / "ielts-nghe"

LEGACY_VISUALS = {
    (1, 4): ("./question-assets/test-1/section-4-visual-1.jpg", "Antigen-antibody reaction diagram", range(38, 41)),
    (3, 2): ("./question-assets/test-3/section-2-visual-1.jpg", "Museum first-floor plan", range(16, 21)),
    (3, 4): ("./question-assets/test-3/section-4-visual-1.png", "Total rice production pie chart", [40]),
    (4, 4): ("./question-assets/test-4/section-4-visual-1.jpg", "British Isles Venn diagram", range(33, 37)),
    (5, 1): ("./question-assets/test-5/section-1-visual-1.jpg", "Route from Hotel Armitage map", range(6, 11)),
    (5, 4): ("./question-assets/test-5/section-4-visual-1.jpg", "Hydroelectric dam diagram", range(36, 39)),
    (7, 3): ("./question-assets/test-7/section-3-visual-1.jpg", "World-map survey bar chart", range(29, 31)),
    (8, 2): ("./question-assets/test-8/section-2-visual-1.jpg", "Summerland site plan", range(17, 21)),
    (8, 3): ("./question-assets/test-8/section-3-visual-1.jpg", "Hydroculture systems diagram", range(23, 26)),
    (10, 3): ("./question-assets/test-10/section-3-visual-1.jpg", "Mangrove litter cycle diagram", range(27, 31)),
    (10, 4): ("./question-assets/test-10/section-4-visual-1.jpg", "Cloud types diagram", range(33, 38)),
}

MODERN_VISUALS = {
    12: {
        "section": 2,
        "old_class": "red-hill-map",
        "src": "./question-assets/test-12/section-2-visual-1.jpg",
        "alt": "Red Hill Improvement Plan - Cambridge IELTS 8 Test 4",
        "source_ref": "Cambridge IELTS 8 Academic Listening Test 4",
    },
    16: {
        "section": 2,
        "old_class": "sheepmarket-map",
        "src": "./question-assets/test-16/section-2-visual-1.jpg",
        "alt": "Art and History in the Sheepmarket - Cambridge IELTS 12 Test 4",
        "source_ref": "Cambridge IELTS 12 Academic Listening Test 4",
    },
    17: {
        "section": 2,
        "old_class": "granford-map",
        "src": "./question-assets/test-17/section-2-visual-1.jpg",
        "alt": "Proposed traffic changes in Granford - Cambridge IELTS 13 Test 1",
        "source_ref": "Cambridge IELTS 13 Academic Listening Test 1",
    },
    18: {
        "section": 2,
        "old_class": "hinchingbrooke-map",
        "src": "./question-assets/test-18/section-2-visual-1.jpg",
        "alt": "Hinchingbrooke Park - Cambridge IELTS 9 Test 2",
        "source_ref": "Cambridge IELTS 9 Academic Listening Test 2",
    },
}

LEGACY_CSS = """
.source-image-visual{display:grid;gap:16px}
.source-visual-image{display:block;width:min(100%,960px);height:auto;margin:0 auto;border:1px solid #cbd5e1;border-radius:12px;background:#fff}
.source-answer-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.source-answer-grid .inline-answer{width:100%;justify-content:flex-start}
""".strip()

MODERN_CSS = """
.verified-question-visual{margin:18px auto 24px;max-width:1000px}
.verified-question-visual img{display:block;width:100%;height:auto;border:1px solid #cbd5e1;border-radius:12px;background:#fff}
""".strip()

SOURCE_RENDERER = r'''function sourceImageVisualHtml(v,group={},items=[]){const wanted=new Set((v.questions||items.map(x=>x.number)).map(Number)),controls=items.filter(x=>wanted.has(Number(x.number))).map(x=>inlineControl(x.number,group,items)).join("");return `<div class="visual source-image-visual"><img class="source-visual-image" src="${esc(v.src)}" alt="${esc(v.alt||"IELTS Listening source visual")}" loading="lazy" decoding="async"><div class="source-answer-grid">${controls}</div></div>`}
'''


def decode_data(text: str) -> tuple[dict, int, int]:
    match = re.search(r"const DATA\s*=\s*", text)
    if not match:
        raise ValueError("const DATA not found")
    data, length = json.JSONDecoder().raw_decode(text[match.end() :])
    return data, match.end(), match.end() + length


def replace_balanced_div(html: str, class_name: str, replacement: str) -> str:
    start_match = re.search(rf'<div\b[^>]*class="[^"]*\b{re.escape(class_name)}\b[^"]*"[^>]*>', html)
    if not start_match:
        return html
    depth = 1
    token_re = re.compile(r"<div\b[^>]*>|</div\s*>", re.I)
    for token in token_re.finditer(html, start_match.end()):
        depth += -1 if token.group(0).lower().startswith("</div") else 1
        if depth == 0:
            return html[: start_match.start()] + replacement + html[token.end() :]
    raise ValueError(f"Unbalanced div for class {class_name}")


def group_range(group: dict) -> list[int]:
    value = group.get("range")
    if isinstance(value, list) and value:
        start, end = int(value[0]), int(value[-1])
    else:
        nums = [int(x) for x in re.findall(r"\d+", str(value or group.get("heading", "")))]
        if not nums:
            raise ValueError(f"Cannot determine question range for {group.get('key')}")
        start, end = nums[0], nums[-1]
    return list(range(start, end + 1))


def apply_legacy(page: Path, text: str, data: dict) -> tuple[str, bool]:
    changed = False
    test = int(data["test"])
    for section in data.get("sections", []):
        key = (test, int(section.get("number", 0)))
        if key not in LEGACY_VISUALS:
            continue
        src, alt, target_questions = LEGACY_VISUALS[key]
        target_questions = list(target_questions)
        for group in section.get("groups", []):
            if "visual" not in group:
                continue
            if group_range(group) != target_questions:
                continue
            expected = {q["number"] for q in section.get("questions", [])}
            numbers = [n for n in group_range(group) if n in expected]
            new_visual = {"type": "source-image", "src": src, "alt": alt, "questions": numbers}
            if group["visual"] != new_visual:
                group["visual"] = new_visual
                changed = True
    has_source_visual = any(
        group.get("visual", {}).get("type") == "source-image"
        for section in data.get("sections", [])
        for group in section.get("groups", [])
    )
    if not has_source_visual:
        return text, False
    new_text = text
    if changed:
        _, start, end = decode_data(new_text)
        new_text = new_text[:start] + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + new_text[end:]
    if "function sourceImageVisualHtml" not in new_text:
        marker = "function visualHtml(v,group={},items=[]){"
        new_text = new_text.replace(marker, SOURCE_RENDERER + marker, 1)
    source_dispatch = 'if(v.type==="source-image")return sourceImageVisualHtml(v,group,items);'
    new_text = re.sub(rf'(?:{re.escape(source_dispatch)}){{2,}}', source_dispatch, new_text)
    if source_dispatch not in new_text:
        new_text = new_text.replace(
            'function visualHtml(v,group={},items=[]){if(!v)return"";',
            'function visualHtml(v,group={},items=[]){if(!v)return"";' + source_dispatch,
            1,
        )
    if ".source-image-visual{" not in new_text:
        new_text = new_text.replace("</style>", LEGACY_CSS + "\n</style>", 1)
    return new_text, new_text != text


def apply_modern(page: Path, text: str, data: dict, spec: dict) -> tuple[str, bool]:
    changed = False
    data["sourceRef"] = spec["source_ref"]
    for section in data.get("sections", []):
        if int(section.get("number", 0)) != spec["section"]:
            continue
        figure = (
            f'<figure class="verified-question-visual"><img src="{spec["src"]}" '
            f'alt="{spec["alt"]}" loading="lazy" decoding="async"></figure>'
        )
        before = section["questions"]
        section["questions"] = replace_balanced_div(before, spec["old_class"], figure)
        if section["questions"] != before:
            changed = True
        elif spec["src"] not in before:
            raise ValueError(f"Neither old visual nor verified asset found in {page.name}")
    _, start, end = decode_data(text)
    new_text = text[:start] + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + text[end:]
    if ".verified-question-visual{" not in new_text:
        new_text = new_text.replace("</style>", MODERN_CSS + "\n</style>", 1)
        changed = True
    return new_text, changed or new_text != text


def main() -> None:
    touched = []
    for page in sorted(PAGES.glob("*.html")):
        original = page.read_text(encoding="utf-8")
        try:
            data, _, _ = decode_data(original)
        except ValueError:
            continue
        test = int(data.get("test", 0))
        text = original
        changed = False
        if any(key[0] == test for key in LEGACY_VISUALS):
            text, changed = apply_legacy(page, text, data)
        elif test in MODERN_VISUALS:
            text, changed = apply_modern(page, text, data, MODERN_VISUALS[test])
        if changed and text != original:
            page.write_text(text, encoding="utf-8", newline="")
            touched.append(page.name)
    print(f"Applied verified visuals to {len(touched)} page(s): {', '.join(touched)}")


if __name__ == "__main__":
    main()
