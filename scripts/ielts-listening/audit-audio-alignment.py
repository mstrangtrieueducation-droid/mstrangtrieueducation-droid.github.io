#!/usr/bin/env python3
"""Semantically audit every IELTS Listening audio against its transcript.

The lightweight CI audit locks reviewed audio bytes by SHA-256. Run this deeper
audit whenever audio is added or replaced. It transcribes the first 150 seconds
of every section, finds the closest transcript among all 120 sections, and only
writes the manifest when every audio's best match is its own test and section.
"""

from __future__ import annotations

import argparse
import base64
import collections
import hashlib
import io
import json
import math
import re
import tempfile
from pathlib import Path

import av
from faster_whisper import WhisperModel


ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "ielts-nghe"
MANIFEST = ROOT / "tests" / "ielts-listening" / "audio-manifest.json"
SOURCE_AUDIO_URLS = {
    (17, section): f"https://www.luckyielts.com/wp-content/uploads/2025/07/cambridge-ielts-13-academic-listening-1-audio-{section}.mp3"
    for section in range(1, 5)
}
STOP_WORDS = set(
    "the and that this you your for are was were have has had with from but they their there what will "
    "would could should about into just some more then than been being very really also one two three four "
    "five six seven eight nine ten now well yes right okay like because when where which who how can not "
    "all our out any much many only first second each other"
    .split()
)


def parse_data(page: Path) -> dict | None:
    text = page.read_text(encoding="utf-8")
    match = re.search(r"const DATA\s*=\s*", text)
    if not match:
        return None
    try:
        return json.JSONDecoder().raw_decode(text[match.end() :])[0]
    except (json.JSONDecodeError, ValueError):
        return None


def transcript_text(section: dict) -> str:
    value = section.get("transcript", "")
    if isinstance(value, list):
        return " ".join(map(str, value))
    return re.sub(r"<[^>]+>", " ", str(value))


def collect_sections() -> dict[tuple[int, int], dict]:
    found: dict[tuple[int, int], dict] = {}
    for page in sorted(SITE.glob("*.html")):
        data = parse_data(page)
        if not data or not data.get("sections"):
            continue
        test = int(data.get("test", 0))
        if not 1 <= test <= 30:
            continue
        for section in data["sections"]:
            key = (test, int(section["number"]))
            if key in found:
                raise ValueError(f"Duplicate Test {test} Section {key[1]}")
            found[key] = {
                "page": page.name,
                "sourceRef": data.get("sourceRef") or section.get("title") or f"IELTS Listening Test {test}",
                "section": section,
                "transcript": transcript_text(section),
            }
    if len(found) != 120:
        raise ValueError(f"Expected 120 sections, found {len(found)}")
    return found


def audio_bytes(record: dict) -> tuple[bytes, str, str]:
    value = str(record["section"].get("audio", ""))
    if value.startswith("data:audio/"):
        header, encoded = value.split(",", 1)
        suffix = ".ogg" if "ogg" in header else ".mp3"
        return base64.b64decode(encoded), "embedded", suffix
    relative = value.removeprefix("./")
    path = SITE / relative
    if not path.exists():
        raise FileNotFoundError(path)
    return path.read_bytes(), relative, path.suffix


def duration_seconds(content: bytes) -> float:
    with av.open(io.BytesIO(content), mode="r", metadata_errors="ignore") as container:
        if container.duration is None:
            return 0.0
        return round(float(container.duration / av.time_base), 3)


def tokens(value: str) -> list[str]:
    return [word for word in re.findall(r"[a-z]+", value.lower()) if len(word) > 2 and word not in STOP_WORDS]


def vectors(corpus: dict[tuple[int, int], str]):
    document_frequency = collections.Counter()
    for value in corpus.values():
        document_frequency.update(set(tokens(value)))
    count = len(corpus)

    def vector(value: str) -> dict[str, float]:
        frequency = collections.Counter(tokens(value))
        return {
            word: occurrences * math.log((count + 1) / (document_frequency.get(word, 0) + 1)) + 0.01
            for word, occurrences in frequency.items()
        }

    return vector


def cosine(left: dict[str, float], right: dict[str, float]) -> float:
    dot = sum(value * right.get(word, 0.0) for word, value in left.items())
    left_norm = math.sqrt(sum(value * value for value in left.values()))
    right_norm = math.sqrt(sum(value * value for value in right.values()))
    return dot / (left_norm * right_norm) if left_norm and right_norm else 0.0


def load_cache(path: Path | None) -> dict[str, dict]:
    return json.loads(path.read_text(encoding="utf-8")) if path and path.exists() else {}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, help="Optional JSON cache of ASR text keyed by test-section")
    parser.add_argument("--model", default="tiny.en")
    parser.add_argument("--clip-seconds", type=int, default=150)
    parser.add_argument("--write-manifest", action="store_true")
    args = parser.parse_args()

    sections = collect_sections()
    corpus = {key: value["transcript"] for key, value in sections.items()}
    vector = vectors(corpus)
    expected_vectors = {key: vector(value) for key, value in corpus.items()}
    cache = load_cache(args.cache)
    model = None
    entries = []
    failures = []

    with tempfile.TemporaryDirectory(prefix="ielts-audio-audit-") as temp_dir:
        temp = Path(temp_dir)
        for key in sorted(sections):
            test, section_number = key
            cache_key = f"{test}-{section_number}"
            content, audio_ref, suffix = audio_bytes(sections[key])
            cached = cache.get(cache_key, {})
            recognised = str(cached.get("text", "")).strip()
            used_clip_seconds = int(cached.get("clipSeconds", 150))
            if not recognised:
                if model is None:
                    model = WhisperModel(args.model, device="cpu", compute_type="int8")
                audio_file = temp / f"test-{test}-section-{section_number}{suffix}"
                audio_file.write_bytes(content)
                segments, _ = model.transcribe(
                    str(audio_file), beam_size=1, vad_filter=True,
                    clip_timestamps=f"0,{args.clip_seconds}",
                )
                recognised = " ".join(segment.text.strip() for segment in segments)
                used_clip_seconds = args.clip_seconds
                cache[cache_key] = {"text": recognised, "clipSeconds": used_clip_seconds, "model": args.model}

            recognised_vector = vector(recognised)
            ranking = sorted(
                ((cosine(recognised_vector, expected), candidate) for candidate, expected in expected_vectors.items()),
                reverse=True,
            )
            score, matched = ranking[0]
            if matched != key or score < 0.10:
                failures.append(
                    f"Test {test} Section {section_number}: best transcript match is "
                    f"Test {matched[0]} Section {matched[1]} ({score:.3f})"
                )
                print(f"FAIL {failures[-1]}")
            else:
                print(f"PASS Test {test:02d} Section {section_number}: transcript match {score:.3f}")
            entry = {
                    "test": test,
                    "section": section_number,
                    "page": sections[key]["page"],
                    "audio": audio_ref,
                    "bytes": len(content),
                    "durationSeconds": duration_seconds(content),
                    "sha256": hashlib.sha256(content).hexdigest(),
                    "sourceRef": sections[key]["sourceRef"],
                    "asrReview": {
                        "model": args.model,
                        "clipSeconds": used_clip_seconds,
                        "matchedTest": matched[0],
                        "matchedSection": matched[1],
                        "score": round(score, 4),
                    },
                }
            if key in SOURCE_AUDIO_URLS:
                entry["sourceAudioUrl"] = SOURCE_AUDIO_URLS[key]
            entries.append(entry)

    if failures:
        raise ValueError("Audio/transcript mismatches:\n" + "\n".join(failures))
    if args.cache:
        args.cache.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.write_manifest:
        manifest = {
            "version": 1,
            "reviewedAt": "2026-09-24",
            "policy": "Every audio must be the reviewed byte-for-byte file whose ASR best match is its own transcript.",
            "entries": entries,
        }
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"WROTE {MANIFEST} ({len(entries)} reviewed sections)")


if __name__ == "__main__":
    main()
