#!/usr/bin/env python3
"""Merge the reviewed cemetery workbook into data/graves.json.

The workbook is authoritative for biographical and grave-location fields.
Existing IDs and manually adjusted map positions are preserved by normalized name.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import unicodedata
import zipfile
from datetime import date, datetime
from pathlib import Path
from xml.etree import ElementTree as ET

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parents[1]
GRAVES_PATH = ROOT / "data" / "graves.json"
SPECIAL_LAYOUT_PATH = ROOT / "data" / "special-grave-layout.json"
SUPPLEMENTAL_GRAVES_PATH = ROOT / "data" / "supplemental-graves.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path, help="Reviewed cemetery .xlsx file")
    parser.add_argument("--map", dest="map_docx", type=Path, help="Optional cemetery map .docx for label audit")
    parser.add_argument("--output", type=Path, default=GRAVES_PATH)
    parser.add_argument("--existing-git-ref", help="Read the merge baseline from git, for example main:data/graves.json")
    return parser.parse_args()


def clean_text(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, (datetime, date)):
        return value.strftime("%d/%m/%Y")
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return re.sub(r"\s+", " ", str(value)).strip()


def normalize(value: object) -> str:
    text = clean_text(value).lower().replace("đ", "d")
    text = "".join(char for char in unicodedata.normalize("NFD", text) if unicodedata.category(char) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def make_id(khu: str, hang: int | None, mo: int | None, tt: int) -> str:
    if khu and hang and mo:
        zone = normalize(khu).replace(" ", "").upper().replace("D", "D")
        if normalize(khu) == "td b":
            zone = "TDB"
        elif normalize(khu) == "td n":
            zone = "TDN"
        return f"{zone}-{hang:02d}-{mo:02d}"
    return f"HS-{tt:03d}"


def load_special_layout() -> dict[tuple[str, int, int], tuple[float, float]]:
    layout = json.loads(SPECIAL_LAYOUT_PATH.read_text(encoding="utf-8"))
    return {
        (normalize(item["khu"]), int(item["hang"]), int(item["mo"])): (float(item["x"]), float(item["y"]))
        for item in layout["positions"]
    }


def read_map_labels(path: Path | None) -> list[str]:
    if not path:
        return []
    with zipfile.ZipFile(path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    labels = []
    for paragraph in root.findall(".//w:p", namespace):
        text = " ".join(node.text or "" for node in paragraph.findall(".//w:t", namespace)).strip()
        if text:
            labels.append(normalize(text))
    return labels


def main() -> None:
    args = parse_args()
    if args.existing_git_ref:
        raw_existing = subprocess.check_output(
            ["git", "show", args.existing_git_ref], cwd=ROOT, text=True, encoding="utf-8"
        )
        existing = json.loads(raw_existing)
    else:
        existing = json.loads(GRAVES_PATH.read_text(encoding="utf-8"))

    by_tt = {int(item["tt"]): item for item in existing if item.get("tt")}
    name_groups: dict[str, list[dict]] = {}
    for item in existing:
        if item.get("ten"):
            name_groups.setdefault(normalize(item["ten"]), []).append(item)
    by_unique_name = {name: items[0] for name, items in name_groups.items() if len(items) == 1}

    workbook = load_workbook(args.workbook, data_only=True, read_only=True)
    worksheet = next(sheet for sheet in workbook.worksheets if sheet.max_row >= 9 and sheet.max_column >= 13)

    rows = []
    special_layout = load_special_layout()
    next_tt = max((int(item.get("tt") or 0) for item in existing), default=0)
    added = 0
    preserved_positions = 0

    for values in worksheet.iter_rows(min_row=9, values_only=True):
        name = clean_text(values[1])
        if not name or normalize(name).startswith("tong cong"):
            continue

        raw_tt = values[0]
        old = by_tt.get(int(raw_tt)) if isinstance(raw_tt, (int, float)) and int(raw_tt) > 0 else None
        if old is None:
            old = by_unique_name.get(normalize(name))
        if isinstance(raw_tt, (int, float)) and int(raw_tt) > 0:
            tt = int(raw_tt)
        elif old and old.get("tt"):
            tt = int(old["tt"])
        else:
            next_tt += 1
            tt = next_tt

        mo = int(values[8]) if isinstance(values[8], (int, float)) else None
        hang = int(values[9]) if isinstance(values[9], (int, float)) else None
        khu = clean_text(values[11])
        note = clean_text(values[12])
        is_special = "mo lon" in normalize(note) or normalize(khu).startswith("td") or normalize(khu) == "e"

        record = {
            "id": old.get("id") if old else make_id(khu, hang, mo, tt),
            "tt": tt,
            "ten": name,
            "namSinh": clean_text(values[2]),
            "queQuan": clean_text(values[3]),
            "capBac": clean_text(values[4]),
            "donVi": clean_text(values[5]),
            "hySinh": clean_text(values[6]),
            "noiHySinh": clean_text(values[7]),
            "mo": mo,
            "hang": hang,
            "lo": clean_text(values[10]),
            "khu": khu,
            "ghiChu": note,
            "type": "special" if is_special else "normal",
            "placed": bool(old and old.get("placed")),
            "x": old.get("x") if old else None,
            "y": old.get("y") if old else None,
        }

        authoritative_position = special_layout.get((normalize(khu), hang, mo)) if hang and mo else None
        if authoritative_position:
            record["x"], record["y"] = authoritative_position
            record["placed"] = True
        elif old and old.get("x") is not None and old.get("y") is not None:
            preserved_positions += 1

        if old and old.get("updatedAt"):
            record["updatedAt"] = old["updatedAt"]
        if not old:
            added += 1
        rows.append(record)

    supplemental = json.loads(SUPPLEMENTAL_GRAVES_PATH.read_text(encoding="utf-8"))
    imported_ids = {item["id"] for item in rows}
    for source in supplemental:
        if source["id"] in imported_ids:
            continue
        record = dict(source)
        position = special_layout.get(
            (normalize(record["khu"]), int(record["hang"]), int(record["mo"]))
        )
        if not position:
            raise ValueError(f"Missing reviewed position for supplemental grave: {record['id']}")
        record["x"], record["y"] = position
        record["placed"] = True
        rows.append(record)
        imported_ids.add(record["id"])
        added += 1

    rows.sort(key=lambda item: (int(item.get("tt") or 9999), item["id"]))
    duplicate_ids = sorted({item["id"] for item in rows if sum(1 for candidate in rows if candidate["id"] == item["id"]) > 1})
    if duplicate_ids:
        raise ValueError(f"Duplicate grave IDs after import: {duplicate_ids}")
    args.output.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    map_labels = read_map_labels(args.map_docx)
    map_matched = 0
    if map_labels:
        map_blob = " | ".join(map_labels)
        map_matched = sum(1 for item in rows if normalize(item["ten"]) in map_blob)

    print(
        json.dumps(
            {
                "records": len(rows),
                "added": added,
                "special": sum(1 for item in rows if item["type"] == "special"),
                "placed": sum(1 for item in rows if item["placed"]),
                "preservedPositions": preserved_positions,
                "mapLabels": len(map_labels),
                "mapNameMatches": map_matched,
                "output": str(args.output),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
