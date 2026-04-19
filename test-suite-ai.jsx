import { useState, useRef } from "react";
import * as XLSX from "xlsx";

// ─── Markdown renderer ───────────────────────────────────────────────────────
function MD({ content }) {
  if (!content) return null;
  const lines = content.split("\n");
  const out = [];
  let listBuf = [];

  const flush = () => {
    if (!listBuf.length) return;
    out.push(
      <ul key={`ul-${out.length}`} className="list-disc list-inside space-y-1 ml-3 mb-3">
        {listBuf.map((t, i) => {
          const parts = t.split(/\*\*(.*?)\*\*/);
          return (
            <li key={i} className="text-slate-300 text-sm leading-relaxed">
              {parts.map((p, j) =>
                j % 2 === 0 ? p : <strong key={j} className="text-white">{p}</strong>
              )}
            </li>
          );
        })}
      </ul>
    );
    listBuf = [];
  };

  lines.forEach((line, i) => {
    if (line.startsWith("## ")) {
      flush();
      out.push(<h2 key={i} className="text-teal-400 font-bold text-sm mt-5 mb-2 pb-1 border-b border-slate-700 uppercase tracking-wider">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      flush();
      out.push(<h3 key={i} className="text-amber-400 font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h3>);
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      listBuf.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      flush();
      const parts = line.split(/\*\*(.*?)\*\*/);
      out.push(<p key={i} className="text-slate-300 text-sm ml-3 mb-1">{parts.map((p, j) => j % 2 === 0 ? p : <strong key={j} className="text-white">{p}</strong>)}</p>);
    } else if (line.trim() === "") {
      flush();
    } else {
      flush();
      const parts = line.split(/\*\*(.*?)\*\*/);
      out.push(
        <p key={i} className="text-slate-300 text-sm mb-1.5 leading-relaxed">
          {parts.map((p, j) => j % 2 === 0 ? p : <strong key={j} className="text-white font-semibold">{p}</strong>)}
        </p>
      );
    }
  });
  flush();
  return <div className="space-y-0.5">{out}</div>;
}

// ─── Claude API call ──────────────────────────────────────────────────────────
async function callClaude(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: user }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.map(b => b.text || "").join("");
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ["Upload", "Map Columns", "Analyse"];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
            ${i + 1 < current ? "bg-teal-600 text-white" :
              i + 1 === current ? "bg-teal-500 text-white ring-2 ring-teal-500 ring-offset-2 ring-offset-slate-900" :
              "bg-slate-700 text-slate-500"}`}>
            {i + 1 < current ? "✓" : i + 1}
          </div>
          <span className={`text-xs font-medium ${i + 1 === current ? "text-white" : "text-slate-500"}`}>{s}</span>
          {i < steps.length - 1 && <div className={`w-8 h-px ${i + 1 < current ? "bg-teal-600" : "bg-slate-700"}`} />}
        </div>
      ))}
    </div>
  );
}

// ─── Main app ─────────────────────────────────────────────────────────────────
export default function TestSuiteAI() {
  const [step, setStep] = useState(1);
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [colMap, setColMap] = useState({ id: "", name: "", description: "", module: "", steps: "", expected: "" });
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFor, setLoadingFor] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [dupResult, setDupResult] = useState("");
  const [jiraText, setJiraText] = useState("");
  const [jiraResult, setJiraResult] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [tab, setTab] = useState("dup");
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();

  // ── Parse Excel ────────────────────────────────────────────────────────────
  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (data.length > 1) {
          const hdrs = data[0].map(h => String(h || "").trim());
          const rows = data.slice(1).filter(r => r.some(c => String(c).trim()));
          setHeaders(hdrs);
          setRawData(rows);
          // Auto-detect columns
          const auto = { id: "", name: "", description: "", module: "", steps: "", expected: "" };
          hdrs.forEach(h => {
            const l = h.toLowerCase();
            if (!auto.id && (l.includes("id") || l === "tc" || l.includes("ref") || l.includes("number"))) auto.id = h;
            if (!auto.name && (l.includes("name") || l.includes("title") || l.includes("summary") || l === "test case" || l.includes("scenario"))) auto.name = h;
            if (!auto.description && (l.includes("desc") || l.includes("objective") || l.includes("purpose"))) auto.description = h;
            if (!auto.module && (l.includes("module") || l.includes("area") || l.includes("feature") || l.includes("component") || l.includes("suite") || l.includes("section"))) auto.module = h;
            if (!auto.steps && l.includes("step") && !l.includes("expected")) auto.steps = h;
            if (!auto.expected && (l.includes("expected") || l.includes("result") || l.includes("outcome"))) auto.expected = h;
          });
          setColMap(auto);
          setStep(2);
        }
      } catch { alert("Could not read the file. Please make sure it is an .xlsx or .xls file."); }
    };
    reader.readAsBinaryString(file);
  };

  // ── Process test cases ─────────────────────────────────────────────────────
  const process = () => {
    const idx = (k) => headers.indexOf(colMap[k]);
    const get = (row, k) => idx(k) >= 0 ? String(row[idx(k)] || "").trim() : "";
    const tcs = rawData.map((row, i) => ({
      id: get(row, "id") || `TC-${String(i + 1).padStart(4, "0")}`,
      name: get(row, "name"),
      description: get(row, "description"),
      module: get(row, "module") || "General",
      steps: get(row, "steps"),
      expected: get(row, "expected")
    })).filter(tc => tc.name || tc.description);
    setTestCases(tcs);
    setStep(3);
    setTab("dup");
  };

  // ── Duplicate analysis ─────────────────────────────────────────────────────
  const analyzeDup = async () => {
    setLoading(true); setLoadingFor("dup"); setDupResult("");
    setLoadingMsg(`Reading all ${testCases.length} test cases…`);
    const lines = testCases.map(tc =>
      `[${tc.id}] (${tc.module}) ${tc.name}${tc.description && tc.description !== tc.name ? " | " + tc.description.slice(0, 120) : ""}`
    ).join("\n");
    try {
      const r = await callClaude(
        `You are a senior QA analyst helping a Workday test lead optimise their test suite. 
Analyse the provided test case list and identify duplicates precisely. 
Respond in clean structured markdown with ## for main sections.
Be specific with IDs. Keep explanations brief and actionable.`,
        `I have ${testCases.length} Workday compensation/HR test cases. Identify duplicates.

## 1. EXACT DUPLICATES
Pairs or groups that are the same test written twice. List IDs, say which to keep, which to delete.

## 2. NEAR DUPLICATES  
Same scenario, slightly different wording. List ID pairs and recommend which to keep.

## 3. OVERLAPPING / REDUNDANT
Different IDs but effectively testing the same condition. Recommend consolidation.

## 4. SUMMARY
- Total test cases reviewed: ${testCases.length}
- Estimated duplicates to remove: [X]
- Recommended count after clean-up: [Y]

TEST CASES:
${lines}`
      );
      setDupResult(r);
    } catch (e) { setDupResult("⚠️ Error: " + e.message + "\n\nPlease try again."); }
    setLoading(false); setLoadingFor("");
  };

  // ── Jira analysis ──────────────────────────────────────────────────────────
  const analyzeJira = async () => {
    if (!jiraText.trim()) return;
    setLoading(true); setLoadingFor("jira"); setJiraResult("");
    const filtered = moduleFilter === "All" ? testCases : testCases.filter(tc => tc.module === moduleFilter);
    setLoadingMsg(`Cross-referencing against ${filtered.length} test cases…`);
    const subset = filtered.slice(0, 250);
    const lines = subset.map(tc =>
      `[${tc.id}] (${tc.module}) ${tc.name}${tc.description ? " | " + tc.description.slice(0, 120) : ""}${tc.expected ? " | Expected: " + tc.expected.slice(0, 80) : ""}`
    ).join("\n");
    try {
      const r = await callClaude(
        `You are a senior QA test lead with 15 years of Workday testing experience specialising in Compensation, Advanced Compensation, Payroll, and GPS modules.
You are an expert at test gap analysis — spotting what is covered vs. what is missing.
Format your response in clean structured markdown with ## for sections and **bold** for test IDs and names.`,
        `JIRA STORY:
${jiraText}

EXISTING TEST CASES LOADED (${subset.length} of ${filtered.length}):
${lines}

## 1. EXISTING TESTS TO UPDATE
For each existing test case that must change due to this story:
- **[TC-ID] Test Name** — what specifically needs to change and why

## 2. EXISTING TESTS STILL VALID
List test IDs that cover this area and need no changes.

## 3. NEW TEST CASES TO ADD
For each gap identified, provide:
- **Test Name**: [descriptive name]
- **Scenario**: Given [precondition] / When [action] / Then [expected result]
- **Priority**: High / Medium / Low
- **Workday Module**: [module name]

## 4. WORKDAY RISKS & REGRESSION AREAS
Specific Workday compensation/payroll areas that could regress from this change.`
      );
      setJiraResult(r);
    } catch (e) { setJiraResult("⚠️ Error: " + e.message + "\n\nPlease try again."); }
    setLoading(false); setLoadingFor("");
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modules = ["All", ...new Set(testCases.map(tc => tc.module).filter(Boolean))];

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Upload
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 1) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Steps current={1} />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-500 bg-opacity-10 border border-teal-500 border-opacity-25 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-400 text-xs font-semibold tracking-widest uppercase">AI Powered</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Test Suite Intelligence</h1>
          <p className="text-slate-400 text-sm">Workday Compensation · Duplicate Detection · Jira Gap Analysis</p>
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
            ${dragOver ? "border-teal-400 bg-teal-500 bg-opacity-10 scale-105" : "border-slate-600 hover:border-teal-600 bg-slate-800 bg-opacity-60"}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}
          onClick={() => fileRef.current.click()}
        >
          <div className="text-5xl mb-4">📊</div>
          <p className="text-white font-semibold text-base mb-1">Drop your Excel file here</p>
          <p className="text-slate-400 text-sm mb-5">or click to browse</p>
          <span className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            Choose File
          </span>
          <p className="text-slate-600 text-xs mt-5">.xlsx or .xls · 1000+ test cases supported</p>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { if (e.target.files[0]) parseFile(e.target.files[0]); }} />

        {/* Feature chips */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[["🔍", "Find Duplicates"], ["📋", "Jira Gap Analysis"], ["✨", "BDD Test Cases"]].map(([icon, label]) => (
            <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <p className="text-slate-300 text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Column Mapping
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 2) return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <Steps current={2} />
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-white font-bold text-xl mb-1">Map Your Columns</h2>
            <p className="text-slate-400 text-sm">We found <span className="text-teal-400 font-semibold">{rawData.length} test cases</span>. Confirm which columns contain what data.</p>
          </div>
          <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-300 text-sm border border-slate-700 px-3 py-1.5 rounded-lg transition-colors">
            ← Back
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-4">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">Column Mapping</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "id", label: "Test Case ID", req: false, hint: "e.g. TC-001, REF, Number" },
              { key: "name", label: "Test Name / Title ✱", req: true, hint: "The main test description" },
              { key: "description", label: "Description", req: false, hint: "Scenario or objective" },
              { key: "module", label: "Module / Area", req: false, hint: "e.g. Compensation, Pay" },
              { key: "steps", label: "Test Steps", req: false, hint: "Numbered steps column" },
              { key: "expected", label: "Expected Result", req: false, hint: "What should happen" },
            ].map(({ key, label, hint }) => (
              <div key={key}>
                <label className="block text-slate-300 text-xs font-semibold mb-1">{label}</label>
                <p className="text-slate-500 text-xs mb-1.5">{hint}</p>
                <select
                  value={colMap[key]}
                  onChange={e => setColMap(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
                >
                  <option value="">— Not mapped —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Preview table */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-5 overflow-x-auto">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Preview — First 3 rows</p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>{headers.map(h => <th key={h} className="text-left text-slate-400 font-medium pb-2 pr-6 whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rawData.slice(0, 3).map((row, i) => (
                <tr key={i} className="border-t border-slate-700">
                  {headers.map((_, j) => (
                    <td key={j} className="text-slate-300 py-2 pr-6 max-w-48 truncate">{String(row[j] || "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={process}
          disabled={!colMap.name}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
        >
          Continue to Analysis →
        </button>
        {!colMap.name && <p className="text-amber-500 text-xs text-center mt-2">⚠️ Please map the Test Name / Title column to continue</p>}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Analysis tabs
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header bar */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-sm">Test Suite Intelligence</h1>
            <p className="text-slate-400 text-xs">{testCases.length} test cases · {modules.length - 1} modules</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("dup")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === "dup" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
            >
              🔍 Duplicate Finder
            </button>
            <button
              onClick={() => setTab("jira")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === "jira" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
            >
              📋 Jira Analysis
            </button>
            <button
              onClick={() => { setStep(1); setTestCases([]); setDupResult(""); setJiraResult(""); }}
              className="px-3 py-2 text-slate-500 hover:text-slate-300 text-xs border border-slate-700 rounded-lg transition-colors"
            >
              ↩ New File
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">

        {/* ── DUPLICATE TAB ─────────────────────────────────────────────────── */}
        {tab === "dup" && (
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-1">Find Duplicate Test Cases</h3>
              <p className="text-slate-400 text-sm mb-4">
                AI will scan all <span className="text-teal-400 font-semibold">{testCases.length}</span> test cases and identify exact duplicates, near-duplicates, and overlapping scenarios. Takes about 20–30 seconds.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={analyzeDup}
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  {loading && loadingFor === "dup" ? "⏳ Analysing…" : "🔍 Analyse All Test Cases"}
                </button>
                {dupResult && (
                  <button
                    onClick={() => copy(dupResult)}
                    className="border border-slate-600 hover:border-slate-500 text-slate-400 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors"
                  >
                    {copied ? "✓ Copied!" : "📋 Copy"}
                  </button>
                )}
              </div>
            </div>

            {loading && loadingFor === "dup" && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3 animate-pulse">🔍</div>
                <p className="text-teal-400 font-semibold">{loadingMsg}</p>
                <p className="text-slate-500 text-sm mt-1">Comparing test names and descriptions for similarity…</p>
              </div>
            )}

            {dupResult && !loading && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
                  <span className="text-white font-bold text-sm">Duplicate Analysis Results</span>
                  <span className="text-xs text-teal-400 bg-teal-900 bg-opacity-40 border border-teal-800 px-2.5 py-0.5 rounded-full">AI Generated</span>
                </div>
                <MD content={dupResult} />
              </div>
            )}
          </div>
        )}

        {/* ── JIRA TAB ──────────────────────────────────────────────────────── */}
        {tab === "jira" && (
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-1">Jira Story Analysis</h3>
              <p className="text-slate-400 text-sm mb-4">
                Paste any Jira story or requirement below. AI will compare it against your existing test suite and tell you <span className="text-white font-semibold">exactly what to update and what new tests to add</span>.
              </p>

              {/* Module filter */}
              <div className="flex items-center gap-3 mb-3">
                <label className="text-slate-400 text-xs font-medium whitespace-nowrap">Filter by module:</label>
                <select
                  value={moduleFilter}
                  onChange={e => setModuleFilter(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-500"
                >
                  {modules.map(m => (
                    <option key={m} value={m}>
                      {m} ({m === "All" ? testCases.length : testCases.filter(tc => tc.module === m).length} tests)
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={jiraText}
                onChange={e => setJiraText(e.target.value)}
                placeholder={`Paste your Jira story here…\n\nExample:\nStory: As a Compensation Manager, I need to approve merit increases above guideline with justification.\n\nAcceptance Criteria:\n- Flag any merit increase above 10%\n- Manager must provide written justification\n- HR Director approval required above 15%`}
                className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-xl px-4 py-3 h-44 resize-none focus:outline-none focus:border-teal-500 placeholder-slate-600 leading-relaxed"
              />

              <div className="flex gap-3 items-center mt-3">
                <button
                  onClick={analyzeJira}
                  disabled={loading || !jiraText.trim()}
                  className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  {loading && loadingFor === "jira" ? "⏳ Analysing…" : "📋 Analyse Story"}
                </button>
                {jiraText && (
                  <button onClick={() => { setJiraText(""); setJiraResult(""); }} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                    Clear
                  </button>
                )}
                {jiraResult && (
                  <button
                    onClick={() => copy(jiraResult)}
                    className="ml-auto border border-slate-600 hover:border-slate-500 text-slate-400 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors"
                  >
                    {copied ? "✓ Copied!" : "📋 Copy Results"}
                  </button>
                )}
              </div>
            </div>

            {loading && loadingFor === "jira" && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3 animate-pulse">🤖</div>
                <p className="text-teal-400 font-semibold">{loadingMsg}</p>
                <p className="text-slate-500 text-sm mt-1">Identifying gaps and update requirements…</p>
              </div>
            )}

            {jiraResult && !loading && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
                  <span className="text-white font-bold text-sm">Gap Analysis Results</span>
                  <span className="text-xs text-teal-400 bg-teal-900 bg-opacity-40 border border-teal-800 px-2.5 py-0.5 rounded-full">AI Generated · BDD Format</span>
                </div>
                <MD content={jiraResult} />
                <div className="mt-5 pt-4 border-t border-slate-700">
                  <p className="text-slate-500 text-xs">💡 Tip: Copy these results and paste into Confluence or your Xray test plan directly.</p>
                </div>
              </div>
            )}

            {!jiraResult && !loading && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center border-dashed">
                <p className="text-slate-500 text-sm">Paste a Jira story above and click <span className="text-teal-400 font-semibold">Analyse Story</span></p>
                <p className="text-slate-600 text-xs mt-1">You can run this as many times as you need for different stories</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
