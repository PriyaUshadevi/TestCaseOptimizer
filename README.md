# Test Case Deduplication Tool

A Python-based QA utility that analyzes Excel test suites, detects duplicate or similar test cases, and produces a clean Excel report that can be reviewed before importing or updating tests in Jira, Xray, Zephyr, or another test management tool.

This project is designed as a practical portfolio/client showcase: it solves a real QA operations problem, produces business-friendly output, and can be run locally with a simple command.

## Problem

Large QA teams often build test suites over multiple releases, teams, and imports. This can create:

- Duplicate test cases with different IDs
- Near-duplicate test coverage written in slightly different wording
- Higher test execution effort
- Noisy Jira/Xray imports
- Poor visibility of what coverage is truly unique

## Solution

The tool reads an Excel file, groups rows by test case ID, compares each test case summary/description, and generates a new Excel workbook with:

- A summary dashboard
- Duplicate status added to every test case row
- A side-by-side duplicate pair report
- Match percentage and duplicate type
- Color-coded output for quick review

## Key Features

- Detects exact duplicate test cases
- Detects near-duplicate/similar test cases
- Supports common column names such as `Summary` and `Test Case Name`
- Handles multi-row test cases grouped by `Test Case ID`
- Produces recruiter/client-friendly Excel output
- Works locally without sending test data to any external service
- Includes a sample Excel file for quick demonstration

## Tech Stack

- Python
- pandas
- openpyxl
- difflib / SequenceMatcher similarity scoring
- Excel input and Excel report output

## Repository Files

| File | Purpose |
| --- | --- |
| `analyze_tests.py` | Main production-ready duplicate analysis script |
| `test_cases.xlsx` | Small sample Excel file used for demo and verification |
| `dedup_tool.py` | Minimal starter script showing basic duplicate detection |
| `HOW_TO_RUN.md` | Step-by-step user guide for non-technical users |
| `COPILOT_PROMPT_TEMPLATE.md` | Prompt template for reviewing Jira story coverage |
| `test-suite-ai.jsx` | Frontend prototype concept for a future UI |

## How to Run

Install dependencies once:

```bash
pip install pandas openpyxl
```

Run the included demo:

```bash
python analyze_tests.py
```

This uses the included `test_cases.xlsx` file and creates:

```text
test_cases_DUPLICATES_FLAGGED.xlsx
```

Run against your own Excel file:

```bash
python analyze_tests.py Your_Test_Cases.xlsx
```

Optional custom output filename:

```bash
python analyze_tests.py Your_Test_Cases.xlsx --output duplicate_report.xlsx
```

## Expected Excel Columns

The tool requires:

- `Test Case ID`
- `Summary` or `Test Case Name`

Optional columns improve matching and reporting:

- `Description`
- `Test Case Area`
- `Area`
- `Module`
- `Feature`

The script is flexible with common variations, so files exported from Jira/Xray or manually maintained spreadsheets should be easy to adapt.

## Output Workbook

The generated workbook contains three tabs:

| Tab | Description |
| --- | --- |
| `SUMMARY` | High-level totals, color guide, and recommended next steps |
| `All Tests - Flagged` | Original test rows plus `DUPLICATE STATUS` |
| `Duplicate Pairs Report` | Side-by-side duplicate pairs with match percentage |

Status colors:

| Status | Meaning | Action |
| --- | --- | --- |
| Red | Exact duplicate | Review and remove/merge one test case |
| Orange | Near duplicate | Review manually before merging |
| Green | Unique | Keep |

## Example Result

Using the included `test_cases.xlsx`, the tool finds the duplicate `Login Test` scenario and writes a formatted Excel report.

Example terminal output:

```text
Total unique test cases : 3
Exact duplicate pairs   : 1
Near duplicate pairs    : 0
Test cases flagged      : 2
Output file saved       : test_cases_DUPLICATES_FLAGGED.xlsx
```

## Business Value

This project demonstrates:

- QA process improvement
- Test suite optimization
- Python automation
- Excel report generation
- Practical data cleanup before Jira/Xray upload
- Clear communication of technical results for business users

For clients, the value is reduced execution effort, cleaner test management, and faster review of duplicated coverage.

For recruiters, this project shows applied automation, data analysis, and QA domain knowledge in a working tool.

## Current Status

Completed and working as a local Excel-based duplicate detection tool.

Verified capabilities:

- Loads Excel test case files
- Maps common test case columns
- Detects exact and near duplicates
- Generates formatted Excel reports
- Runs successfully using the included sample file

## Future Enhancements

- Web UI for file upload and interactive review
- Jira/Xray API integration
- AI/NLP semantic matching for deeper similarity detection
- Export of recommended delete/merge actions
- Larger regression test suite with generated fixtures
