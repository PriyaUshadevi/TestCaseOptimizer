# HOW TO RUN THE TEST SUITE DUPLICATE DETECTOR
### No coding knowledge needed — just follow these steps exactly

---

## BEFORE YOU START — Install Two Things (One Time Only)

You need to install two Python libraries. You only do this once ever.

**Step 1:** Open **VS Code**

**Step 2:** At the top of VS Code, click **Terminal** → **New Terminal**
A black panel will open at the bottom of the screen. This is normal.

**Step 3:** Type this command exactly and press Enter:
```
pip install pandas openpyxl
```

Wait for it to finish. You will see text scrolling. When it stops and shows a `>` again, it is done.

---

## EVERY TIME YOU WANT TO RUN THE TOOL

### Step 1 — Put Your Files in One Folder

Create a folder on your desktop called **TestSuiteTool**

Put these two files inside that folder:
- `analyze_tests.py` (the Python script)
- Your Excel test case file (e.g. `WorkdayTestCases.xlsx`)

---

### Step 2 — Tell the Script Your Filename

Open `analyze_tests.py` in VS Code.

Look for **line 20** which says:
```python
INPUT_FILE = "my_test_cases.xlsx"
```

Change `my_test_cases.xlsx` to the **exact name** of your Excel file.

For example, if your file is called `Workday_TC_2024.xlsx`, change it to:
```python
INPUT_FILE = "Workday_TC_2024.xlsx"
```

Save the file (Ctrl + S).

---

### Step 3 — Open the Folder in VS Code

In VS Code: **File** → **Open Folder** → Select your **TestSuiteTool** folder

---

### Step 4 — Run the Script

Option A — Click the ▶ Play button at the top right of VS Code

Option B — In the Terminal at the bottom, type:
```
python analyze_tests.py
```
and press Enter.

---

### Step 5 — Wait

You will see messages appearing in the Terminal like:
```
Loading: Workday_TC_2024.xlsx
Rows loaded: 4523
Unique test cases found: 1043
Comparing 1043 test cases against each other...
This may take 1-2 minutes...
```

**Do not close VS Code.** Wait until you see "OUTPUT FILE SAVED".

For 1000+ test cases this takes about 1–3 minutes.

---

### Step 6 — Open Your Results

Look in your **TestSuiteTool** folder. A new file will have appeared:
```
Workday_TC_2024_DUPLICATES_FLAGGED.xlsx
```

Open it in Excel. It has **3 tabs**:

| Tab | What it shows |
|-----|---------------|
| **SUMMARY** | Start here — totals and colour guide |
| **All Tests - Flagged** | Every test case with colour coding |
| **Duplicate Pairs Report** | Every matched pair side by side with % score |

---

## UNDERSTANDING YOUR RESULTS

| Colour | Meaning | What to do |
|--------|---------|------------|
| 🔴 **Red** | Exact duplicate (92%+ match) | Delete one — very safe |
| 🟠 **Orange** | Near duplicate (70–91% match) | Read both and decide |
| 🟢 **Green** | Unique | Keep as is |

**Start with the Duplicate Pairs Report tab.**
- Sort by **Match %** column descending
- Red rows first — these are the safest to action
- For each pair: decide which one to KEEP (usually the more detailed / up to date one)

---

## IF SOMETHING GOES WRONG

**Error: "Cannot find file"**
→ Make sure your Excel filename matches exactly what is in line 20 of the script
→ Make sure both files are in the same folder

**Error: "No module named pandas"**
→ Go back to Before You Start and run `pip install pandas openpyxl` again

**Error: "Could not find the 'summary' column"**
→ Open your Excel and check the exact spelling of your column headers
→ The script expects: Test case id, Summary, Test case area, Description,
  Test step number, Test step action, Test step expected result

---

## NEED HELP?

Ask GitHub Copilot inside VS Code. Press **Ctrl+I** and type what the error says.
Example: *"I'm getting this error when running my Python script: [paste error]"*
Copilot will tell you exactly what to fix.

---

*Built for: Lloyds Banking — Workday Compensation Test Suite*
*Requires: Python + pandas + openpyxl (all free, no internet needed to run)*
