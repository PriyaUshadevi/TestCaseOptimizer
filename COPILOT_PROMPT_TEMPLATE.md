# COPILOT PROMPT TEMPLATE — JIRA GAP ANALYSIS
### Use this in Microsoft Copilot (Teams or Web) after cleaning your test suite

---

## HOW TO USE THIS TEMPLATE

1. Open **Microsoft Copilot** (Teams or browser at copilot.microsoft.com)
2. Copy the prompt below
3. Replace the [PLACEHOLDERS] with your real content
4. Paste and send

You can re-use this as many times as you like — one story at a time.

---

## THE PROMPT — COPY FROM HERE

---

You are a senior QA test analyst with 15 years of experience testing Workday HCM modules,
specifically Compensation, Advanced Compensation, Payroll, and GPS.

I am going to give you:
1. A Jira user story or task
2. A list of my existing test cases in that area

Your job is to analyse the story against my existing tests and give me a structured response.

---

**JIRA STORY:**

[PASTE YOUR FULL JIRA STORY HERE — include Title, Description, and Acceptance Criteria]

---

**MY EXISTING TEST CASES IN THIS AREA:**

[PASTE YOUR RELEVANT TEST CASES HERE — copy from your Excel, the Test Case ID and Summary columns are enough]

Example format:
TC-001 | Verify merit increase within guideline is approved automatically
TC-002 | Verify merit increase above guideline is flagged for review
TC-003 | Verify compensation change is saved correctly in Workday

---

**PLEASE GIVE ME:**

## 1. EXISTING TESTS TO UPDATE
For each existing test case that needs changing because of this story:
- Test Case ID and current name
- What specifically needs to change
- Why it needs to change

## 2. EXISTING TESTS STILL VALID
List any of my existing test cases that cover this story and need no changes.

## 3. NEW TEST CASES TO ADD
For each gap you identify, write the test case in this format:

**Test Name:** [Clear descriptive name]
**Scenario:**
  - Given: [precondition / setup in Workday]
  - When: [the action taken]
  - Then: [the expected result]
**Priority:** High / Medium / Low
**Workday Module:** [e.g. Advanced Compensation / Payroll / GPS]
**Test Case Area:** [e.g. Merit Increase / Allowance / Grade Change]

## 4. REGRESSION RISK
Which other Workday areas could be affected by this change that I should also test?

---

## TIPS FOR BETTER RESULTS

- Paste the full Jira acceptance criteria if available — the more detail you give, the better
- Filter your test cases by Test Case Area before pasting (paste only relevant ones)
- Run this once per story — do not paste 10 stories at once
- After getting results, copy the new test cases into your Excel master sheet
- Use the BDD format (Given/When/Then) directly when creating tests in Xray

---

## EXAMPLE OF A GOOD JIRA PASTE

Story: Merit Increase Above Guideline — Approval Workflow
As a Compensation Manager, I need the system to flag any merit increase above 10% so that
HR Director approval is required before the change takes effect in Workday.

Acceptance Criteria:
- Merit increases of 0–10%: auto-approved, no additional workflow
- Merit increases of 10.01–15%: flagged, requires Compensation Manager sign-off
- Merit increases above 15%: flagged, requires HR Director approval
- Employee record must not update in Workday until all approvals are complete
- Rejection must trigger a notification to the initiating manager

---

*Template created for: Lloyds Banking Workday Compensation Testing*
*Use in: Microsoft Copilot (Teams or Web)*
*No client data to leave the system — Copilot is your approved AI tool*
