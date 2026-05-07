# How To Run The Test Suite Duplicate Detector

This guide is written for non-technical users. Follow the steps exactly.

## One-Time Setup

Install Python dependencies:

```bash
pip install pandas openpyxl
```

You only need to do this once on your machine.

## Run The Included Demo

From this project folder, run:

```bash
python analyze_tests.py
```

The script uses the included file:

```text
test_cases.xlsx
```

It creates this output file:

```text
test_cases_DUPLICATES_FLAGGED.xlsx
```

Open that file in Excel and start with the `SUMMARY` tab.

## Run Your Own Excel File

Put your Excel file in the same folder as `analyze_tests.py`.

Run:

```bash
python analyze_tests.py Your_File_Name.xlsx
```

Example:

```bash
python analyze_tests.py Workday_Test_Cases.xlsx
```

The output will be:

```text
Workday_Test_Cases_DUPLICATES_FLAGGED.xlsx
```

## Required Columns

Your Excel file must include:

- `Test Case ID`
- `Summary` or `Test Case Name`

Optional but useful columns:

- `Description`
- `Test Case Area`
- `Area`
- `Module`
- `Feature`

## Understanding The Output

The generated Excel file has three tabs:

| Tab | What it shows |
| --- | --- |
| `SUMMARY` | Totals, color guide, and next steps |
| `All Tests - Flagged` | Every original row with duplicate status |
| `Duplicate Pairs Report` | Duplicate pairs side by side with match percentage |

| Color | Meaning | What to do |
| --- | --- | --- |
| Red | Exact duplicate | Review and remove/merge one |
| Orange | Near duplicate | Read both and decide |
| Green | Unique | Keep |

## Troubleshooting

### Cannot find file

Check that:

- The Excel filename is spelled exactly right
- The Excel file is in the same folder as `analyze_tests.py`
- You included `.xlsx` at the end of the filename

### No module named pandas or openpyxl

Run:

```bash
pip install pandas openpyxl
```

### Missing required column

Make sure your Excel file contains:

- `Test Case ID`
- `Summary` or `Test Case Name`

Rename the columns in Excel if needed, save the file, then run the command again.
