"""
=============================================================
  TEST SUITE DUPLICATE DETECTOR
  For: Workday Compensation Test Cases
  How to use: Change the filename on line 20, then run.
=============================================================
"""

import pandas as pd
from difflib import SequenceMatcher
from openpyxl import load_workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import os

# ─────────────────────────────────────────────────────────────
#  STEP 1: PUT YOUR EXCEL FILENAME HERE
#  Make sure the file is in the same folder as this script
# ─────────────────────────────────────────────────────────────
INPUT_FILE = "my_test_cases.xlsx"   # <-- Change this to your filename

# Similarity thresholds (you can adjust these)
EXACT_THRESHOLD    = 0.92   # 92%+ = likely exact duplicate
SIMILAR_THRESHOLD  = 0.70   # 70%+ = near duplicate worth reviewing

# ─────────────────────────────────────────────────────────────
#  COLOURS used in the output Excel
# ─────────────────────────────────────────────────────────────
RED    = "FFD7D7"   # Exact duplicate
ORANGE = "FFE8CC"   # Near duplicate
YELLOW = "FFFACC"   # Possible overlap
GREEN  = "D7F5E3"   # Unique - keep
HEADER = "1F4E79"   # Dark blue header background
WHITE  = "FFFFFF"

def similarity(a, b):
    """Return 0-1 similarity score between two strings."""
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, str(a).lower().strip(), str(b).lower().strip()).ratio()

def clean(val):
    return str(val).strip() if pd.notna(val) else ""


print("\n" + "="*60)
print("  TEST SUITE DUPLICATE DETECTOR")
print("="*60)

# ─────────────────────────────────────────────────────────────
#  LOAD EXCEL
# ─────────────────────────────────────────────────────────────
if not os.path.exists(INPUT_FILE):
    print(f"\n  ERROR: Cannot find file '{INPUT_FILE}'")
    print("  Please make sure your Excel file is in the same folder as this script")
    print("  and the filename matches exactly (including capitals).\n")
    input("Press Enter to close...")
    exit()

print(f"\n  Loading: {INPUT_FILE}")
df = pd.read_excel(INPUT_FILE, dtype=str)
df.columns = [c.strip() for c in df.columns]
print(f"  Rows loaded: {len(df)}")
print(f"  Columns found: {list(df.columns)}\n")

# ─────────────────────────────────────────────────────────────
#  MAP COLUMN NAMES  (handles slight variations in naming)
# ─────────────────────────────────────────────────────────────
col_map = {}
for col in df.columns:
    cl = col.lower().strip()
    if "test case id" in cl or cl in ["id", "tc id", "testcaseid"]:
        col_map["id"] = col
    elif "summary" in cl:
        col_map["summary"] = col
    elif "test case area" in cl or "area" in cl:
        col_map["area"] = col
    elif "description" in cl:
        col_map["description"] = col
    elif "step number" in cl or cl in ["step no", "step #"]:
        col_map["step_number"] = col
    elif "step action" in cl or ("action" in cl and "step" in cl):
        col_map["step_action"] = col
    elif "expected result" in cl or "expected" in cl:
        col_map["expected"] = col

required = ["id", "summary"]
for r in required:
    if r not in col_map:
        print(f"  ERROR: Could not find the '{r}' column.")
        print(f"  Columns in your file: {list(df.columns)}")
        print(f"  Please rename the column so it contains '{r}' and try again.\n")
        input("Press Enter to close...")
        exit()

ID_COL   = col_map["id"]
SUM_COL  = col_map["summary"]
AREA_COL = col_map.get("area", None)
DESC_COL = col_map.get("description", None)

print(f"  Mapped columns:")
for k, v in col_map.items():
    print(f"    {k:15} → '{v}'")

# ─────────────────────────────────────────────────────────────
#  GROUP BY TEST CASE ID
#  (Each test case can have multiple rows — one per step)
# ─────────────────────────────────────────────────────────────
print("\n  Grouping rows by Test Case ID...")
grouped = df.groupby(ID_COL, sort=False).first().reset_index()
total_unique = len(grouped)
print(f"  Unique test cases found: {total_unique}")

# Build a clean comparison list
cases = []
for _, row in grouped.iterrows():
    tc_id   = clean(row[ID_COL])
    summary = clean(row[SUM_COL])
    area    = clean(row[AREA_COL]) if AREA_COL else ""
    desc    = clean(row[DESC_COL]) if DESC_COL else ""
    # Combined text for comparison
    combined = f"{summary} {desc}".strip()
    cases.append({
        "id": tc_id,
        "summary": summary,
        "area": area,
        "description": desc,
        "combined": combined
    })

# ─────────────────────────────────────────────────────────────
#  FIND DUPLICATES
# ─────────────────────────────────────────────────────────────
print(f"\n  Comparing {total_unique} test cases against each other...")
print("  This may take 1-2 minutes for 1000+ test cases. Please wait...\n")

duplicate_pairs = []     # List of (id_a, id_b, score, type)
flagged_ids     = {}     # id -> "EXACT", "NEAR", "OVERLAP"

for i in range(len(cases)):
    for j in range(i + 1, len(cases)):
        a = cases[i]
        b = cases[j]
        score = similarity(a["combined"], b["combined"])

        if score >= EXACT_THRESHOLD:
            dup_type = "EXACT DUPLICATE"
            flagged_ids[a["id"]] = flagged_ids.get(a["id"], "EXACT DUPLICATE")
            flagged_ids[b["id"]] = flagged_ids.get(b["id"], "EXACT DUPLICATE")
            duplicate_pairs.append((a["id"], a["summary"], b["id"], b["summary"], round(score * 100, 1), dup_type))
        elif score >= SIMILAR_THRESHOLD:
            dup_type = "NEAR DUPLICATE"
            if a["id"] not in flagged_ids:
                flagged_ids[a["id"]] = "NEAR DUPLICATE"
            if b["id"] not in flagged_ids:
                flagged_ids[b["id"]] = "NEAR DUPLICATE"
            duplicate_pairs.append((a["id"], a["summary"], b["id"], b["summary"], round(score * 100, 1), dup_type))

# Sort duplicate pairs: exact first, then by score desc
duplicate_pairs.sort(key=lambda x: -x[4])

exact_count = sum(1 for p in duplicate_pairs if p[5] == "EXACT DUPLICATE")
near_count  = sum(1 for p in duplicate_pairs if p[5] == "NEAR DUPLICATE")
unique_dup_ids = len(flagged_ids)

print(f"  ✓ Analysis complete!")
print(f"\n  RESULTS SUMMARY")
print(f"  {'─'*40}")
print(f"  Total test cases reviewed : {total_unique}")
print(f"  Exact duplicates found    : {exact_count} pairs")
print(f"  Near duplicates found     : {near_count} pairs")
print(f"  Test cases flagged        : {unique_dup_ids}")
print(f"  Estimated safe to remove  : ~{exact_count * 2 // 2 + near_count // 2}")
print(f"  {'─'*40}\n")

# ─────────────────────────────────────────────────────────────
#  BUILD OUTPUT EXCEL
# ─────────────────────────────────────────────────────────────
output_file = INPUT_FILE.replace(".xlsx", "_DUPLICATES_FLAGGED.xlsx").replace(".xls", "_DUPLICATES_FLAGGED.xlsx")

# Add duplicate status to the original dataframe
df["DUPLICATE STATUS"] = df[ID_COL].map(lambda x: flagged_ids.get(clean(x), "UNIQUE — KEEP"))

# Write both sheets
with pd.ExcelWriter(output_file, engine="openpyxl") as writer:
    df.to_excel(writer, sheet_name="All Tests - Flagged", index=False)

    if duplicate_pairs:
        pairs_df = pd.DataFrame(duplicate_pairs, columns=[
            "Test ID (A)", "Summary (A)",
            "Test ID (B)", "Summary (B)",
            "Match %", "Type"
        ])
        pairs_df.to_excel(writer, sheet_name="Duplicate Pairs Report", index=False)

# ─────────────────────────────────────────────────────────────
#  FORMAT THE OUTPUT EXCEL
# ─────────────────────────────────────────────────────────────
wb = load_workbook(output_file)

def style_sheet(ws, flag_col_name=None, type_col_name=None):
    """Apply formatting to a worksheet."""
    header_fill = PatternFill("solid", fgColor=HEADER)
    header_font = Font(bold=True, color=WHITE, size=10)
    thin = Border(
        left=Side(style="thin", color="CCCCCC"),
        right=Side(style="thin", color="CCCCCC"),
        bottom=Side(style="thin", color="CCCCCC")
    )

    # Header row
    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin
    ws.row_dimensions[1].height = 30

    # Find flag/type column index
    flag_idx = None
    type_idx = None
    for i, cell in enumerate(ws[1], 1):
        if cell.value == flag_col_name:
            flag_idx = i
        if cell.value == type_col_name:
            type_idx = i

    # Data rows
    fill_map = {
        "EXACT DUPLICATE": PatternFill("solid", fgColor=RED),
        "NEAR DUPLICATE":  PatternFill("solid", fgColor=ORANGE),
        "UNIQUE — KEEP":   PatternFill("solid", fgColor=GREEN),
    }

    for row in ws.iter_rows(min_row=2):
        status = None
        if flag_idx and row[flag_idx - 1].value:
            status = str(row[flag_idx - 1].value)
        if type_idx and row[type_idx - 1].value:
            status = str(row[type_idx - 1].value)

        row_fill = fill_map.get(status, None)
        for cell in row:
            cell.border = thin
            cell.alignment = Alignment(vertical="center", wrap_text=False)
            if row_fill:
                cell.fill = row_fill

    # Auto-width columns
    for col in ws.iter_cols():
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            try:
                if cell.value:
                    max_len = max(max_len, len(str(cell.value)))
            except:
                pass
        ws.column_dimensions[col_letter].width = min(max(max_len + 2, 12), 50)

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions

# Apply formatting
ws1 = wb["All Tests - Flagged"]
style_sheet(ws1, flag_col_name="DUPLICATE STATUS")

if "Duplicate Pairs Report" in wb.sheetnames:
    ws2 = wb["Duplicate Pairs Report"]
    style_sheet(ws2, type_col_name="Type")

# Add a summary tab
ws3 = wb.create_sheet("SUMMARY", 0)
summary_data = [
    ["TEST SUITE DUPLICATE ANALYSIS REPORT", ""],
    ["", ""],
    ["INPUT FILE",              INPUT_FILE],
    ["TOTAL TEST CASES",        total_unique],
    ["", ""],
    ["EXACT DUPLICATE PAIRS",   exact_count],
    ["NEAR DUPLICATE PAIRS",    near_count],
    ["TEST CASES FLAGGED",      unique_dup_ids],
    ["ESTIMATED SAFE TO REMOVE", exact_count * 2 // 2 + near_count // 2],
    ["RECOMMENDED FINAL COUNT",  total_unique - (exact_count * 2 // 2 + near_count // 2)],
    ["", ""],
    ["COLOUR GUIDE",            ""],
    ["🔴 RED",                  "Exact duplicate — very safe to delete one"],
    ["🟠 ORANGE",               "Near duplicate — review and decide"],
    ["🟢 GREEN",                "Unique — keep"],
    ["", ""],
    ["NEXT STEPS",              ""],
    ["1",                       "Review the 'Duplicate Pairs Report' tab — start with RED rows"],
    ["2",                       "Decide which test case in each pair to KEEP (usually the more detailed one)"],
    ["3",                       "Delete the duplicates from your master Excel"],
    ["4",                       "Use the Copilot Prompt Template for Jira gap analysis"],
]

for r_idx, row_data in enumerate(summary_data, 1):
    for c_idx, val in enumerate(row_data, 1):
        cell = ws3.cell(row=r_idx, column=c_idx, value=val)
        cell.alignment = Alignment(vertical="center")
        if r_idx == 1:
            cell.font = Font(bold=True, size=14, color=HEADER)
        elif val in ["COLOUR GUIDE", "NEXT STEPS", "INPUT FILE", "TOTAL TEST CASES",
                     "EXACT DUPLICATE PAIRS", "NEAR DUPLICATE PAIRS",
                     "TEST CASES FLAGGED", "ESTIMATED SAFE TO REMOVE", "RECOMMENDED FINAL COUNT"]:
            cell.font = Font(bold=True, size=10)

ws3.column_dimensions["A"].width = 30
ws3.column_dimensions["B"].width = 55

wb.save(output_file)

print(f"  OUTPUT FILE SAVED:")
print(f"  → {output_file}")
print(f"\n  Open that file in Excel to see your results.")
print(f"\n  The file has 3 tabs:")
print(f"    1. SUMMARY          — Start here")
print(f"    2. All Tests Flagged — Every test case with colour coding")
print(f"    3. Duplicate Pairs  — Every duplicate pair side by side")
print(f"\n{'='*60}\n")

input("Press Enter to close this window...")
