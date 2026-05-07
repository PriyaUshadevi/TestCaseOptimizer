# Test Case Deduplication Tool

A local Python utility for QA teams that scans Excel test suites, detects duplicate or near-duplicate test cases, and produces a clean Excel report for review before updating Jira, Xray, Zephyr, TestRail, or any other test management system.

This project is built as a practical recruiter/client showcase: it solves a real QA operations problem, protects sensitive test data by running locally, and creates business-friendly output that stakeholders can review without reading code.

## Problem Statement

Large test suites often grow across multiple releases, teams, imports, and maintenance cycles. Over time, this creates duplicate or overlapping test coverage.

Common symptoms:

- The same scenario exists under multiple test case IDs.
- Similar test cases are written with slightly different wording.
- Test execution takes longer than necessary.
- Jira/Xray/Zephyr imports become noisy and harder to maintain.
- QA leads cannot easily see which coverage is unique.
- Regression packs become expensive and slower to review.

## Solution

The tool reads an Excel workbook, groups rows by test case ID, compares each test case summary and optional description, then writes a new Excel workbook with duplicate flags and a summary dashboard.

It uses a hybrid similarity score:

- Case-insensitive exact text matching for identical tests.
- Sequence similarity for wording differences.
- Token overlap to catch shared business terms.

The result is a review-ready Excel report with:

- A `SUMMARY` tab for high-level metrics and next steps.
- An `All Tests - Flagged` tab containing the original rows plus `DUPLICATE STATUS`.
- A `Duplicate Pairs Report` tab showing duplicate pairs side by side.
- Match percentages and duplicate type.
- Color-coded rows for fast review.

## Current Status

Status: **completed, working, and test-covered for the local Excel workflow.**

Verified on the included sample file:

- Loads Excel input.
- Maps common test case columns.
- Groups multi-row test cases by test case ID.
- Detects exact and near duplicates.
- Generates a formatted Excel workbook.
- Creates output in the requested folder.
- Handles invalid threshold configuration.
- Includes unit tests and GitHub Actions CI.

The included `test-suite-ai.jsx` file is a frontend prototype concept for a future web UI. The production-ready, supported workflow in this repository is the Python Excel analyzer.

## Key Features

- Detects exact duplicate test cases.
- Detects near-duplicate or similar test cases.
- Supports common column names such as `Summary`, `Test Case Name`, `TC ID`, `Area`, `Module`, and `Description`.
- Handles multi-row exports grouped by `Test Case ID`.
- Runs locally without uploading test data to any external service.
- Produces recruiter/client-friendly Excel output.
- Includes sample Excel data for a quick demo.
- Includes automated tests for the core analysis and report generation logic.
- Includes a GitHub Actions workflow for CI validation.

## Tech Stack

- Python 3.10+
- pandas
- openpyxl
- difflib / SequenceMatcher
- pytest for automated tests
- Excel input and Excel report output

## Repository Structure

| File | Purpose |
| --- | --- |
| `analyze_tests.py` | Main duplicate analysis and Excel report generator |
| `dedup_tool.py` | Minimal starter example for basic duplicate detection |
| `test_cases.xlsx` | Sample Excel file used for demo and verification |
| `requirements.txt` | Runtime Python dependencies |
| `pytest.ini` | Test configuration |
| `tests/test_analyze_tests.py` | Unit tests for matching, validation, and workbook output |
| `.github/workflows/ci.yml` | GitHub Actions CI workflow |
| `HOW_TO_RUN.md` | Short non-technical run guide |
| `COPILOT_PROMPT_TEMPLATE.md` | Prompt template for Jira/test coverage review |
| `test-suite-ai.jsx` | Future UI prototype concept |

## Prerequisites

Install these before running the project:

- Python 3.10 or newer
- pip
- Microsoft Excel, LibreOffice, or another spreadsheet viewer to open the generated `.xlsx` report

Check Python:

```bash
python --version
```

If `python` is not available on your machine, try:

```bash
py --version
```

## Installation

From the project folder, install dependencies:

```bash
python -m pip install -r requirements.txt
```

For test execution, install pytest:

```bash
python -m pip install pytest
```

## Input File Requirements

The Excel file must contain:

- `Test Case ID`
- `Summary` or `Test Case Name`

Optional columns improve matching and reporting:

- `Description`
- `Test Case Area`
- `Area`
- `Module`
- `Feature`

The script accepts common variations, including:

- ID columns: `Test Case ID`, `TestCaseID`, `TC ID`, `ID`
- Summary columns: `Summary`, `Test Case Name`, `Test Name`, `Title`, `Name`
- Area columns: `Test Case Area`, `Area`, `Module`, `Feature`
- Description columns: `Description`, `Test Description`

## Configuration

The default configuration is defined in `analyze_tests.py`:

```python
DEFAULT_INPUT_FILE = "test_cases.xlsx"
EXACT_THRESHOLD = 0.92
SIMILAR_THRESHOLD = 0.70
```

You can override thresholds from the command line:

```bash
python analyze_tests.py test_cases.xlsx --exact-threshold 0.95 --similar-threshold 0.75
```

Threshold rules:

- Values must be between `0` and `1`.
- `--similar-threshold` must be less than or equal to `--exact-threshold`.
- Higher thresholds reduce false positives but may miss weaker duplicates.
- Lower thresholds catch more possible duplicates but need more manual review.

## How To Run

Run the included demo:

```bash
python analyze_tests.py
```

This reads:

```text
test_cases.xlsx
```

And creates:

```text
test_cases_DUPLICATES_FLAGGED.xlsx
```

Run against your own file:

```bash
python analyze_tests.py Your_Test_Cases.xlsx
```

Use a custom output filename:

```bash
python analyze_tests.py Your_Test_Cases.xlsx --output duplicate_report.xlsx
```

Write output into a folder:

```bash
python analyze_tests.py Your_Test_Cases.xlsx --output reports/duplicate_report.xlsx
```

## Expected Terminal Output

Using the included sample file, the expected result is:

```text
Total unique test cases : 3
Exact duplicate pairs   : 1
Near duplicate pairs    : 0
Test cases flagged      : 2
Output file saved       : test_cases_DUPLICATES_FLAGGED.xlsx
```

## Output Workbook

The generated workbook contains:

| Tab | Description |
| --- | --- |
| `SUMMARY` | High-level totals, color guide, and recommended review steps |
| `All Tests - Flagged` | Original test rows plus `DUPLICATE STATUS` |
| `Duplicate Pairs Report` | Side-by-side duplicate pairs with match percentage |

Status meanings:

| Status | Color | Meaning | Suggested Action |
| --- | --- | --- | --- |
| `EXACT DUPLICATE` | Red | Same or extremely similar test coverage | Review and merge/remove one copy if appropriate |
| `NEAR DUPLICATE` | Orange | Similar coverage that may overlap | Manually review before merging |
| `UNIQUE - KEEP` | Green | No duplicate found by configured thresholds | Keep in the suite |

## Running Tests

Install test dependency:

```bash
python -m pip install pytest
```

Run the test suite:

```bash
pytest -q
```

Run the sample analysis after tests:

```bash
python analyze_tests.py
```

## Code Review Summary

The current implementation has been reviewed for:

- Input file existence checks.
- Excel read failure handling.
- Required column validation.
- Threshold validation.
- Duplicate detection logic.
- Output workbook generation.
- Report sheet creation and styling.
- Repeatable tests.
- CI workflow correctness.

Known limitations:

- Similarity is text-based, not AI/NLP semantic matching.
- It does not automatically delete or merge tests; it flags candidates for human review.
- Very large workbooks may take longer because pair comparison is quadratic.
- The React UI file is a prototype and is not wired into a full frontend build in this repository.

## Business Value

For QA teams and clients:

- Reduces duplicate regression execution effort.
- Improves test suite maintainability.
- Cleans up test management imports.
- Helps QA leads make evidence-based merge/delete decisions.
- Keeps sensitive test data local.

For recruiters:

- Demonstrates Python automation.
- Shows QA domain knowledge.
- Includes Excel data handling and formatted reporting.
- Includes validation, tests, and CI.
- Presents a complete, understandable project with a real business use case.

## Troubleshooting

### Cannot find file

Check that:

- The Excel filename is spelled correctly.
- The file is in the same folder as `analyze_tests.py`, or you passed a full path.
- The filename includes `.xlsx`.

### Missing pandas or openpyxl

Run:

```bash
python -m pip install -r requirements.txt
```

### Missing required column

Make sure your workbook includes:

- `Test Case ID`
- `Summary` or `Test Case Name`

Rename the columns in Excel, save the file, and run the command again.

### Too many near duplicates

Increase the near-duplicate threshold:

```bash
python analyze_tests.py Your_Test_Cases.xlsx --similar-threshold 0.80
```

### Too few matches

Lower the near-duplicate threshold:

```bash
python analyze_tests.py Your_Test_Cases.xlsx --similar-threshold 0.60
```

## Future Enhancements

- Full web UI for upload, filtering, and interactive duplicate review.
- Jira/Xray/Zephyr API integration.
- AI/NLP semantic matching for deeper similarity detection.
- Export of recommended merge/delete actions.
- Performance optimization for very large test suites.
- Larger generated fixture suite for stress testing.

## Final Project Assessment

The Python Excel duplicate detection workflow is complete and in good working condition. It can be showcased as a finished local automation project.

Recommended project status: **Closed and Passed** for the current scope.
