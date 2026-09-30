const app = document.querySelector("#app");
const STORAGE = "grammar-review:";
const importedKey = `${STORAGE}imported-tests`;
const attemptsKey = `${STORAGE}attempts`;
const mistakesKey = `${STORAGE}mistakes`;
const identityKey = `${STORAGE}identity`;

let importedTests = readJSON(importedKey, []);
let tests = combineTests();
let currentAttempt = null;

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function combineTests() {
  const byId = new Map();
  [...(window.BUNDLED_TESTS || []), ...(window.EXTRA_TESTS || []), ...importedTests].forEach(test => byId.set(test.id, test));
  return [...byId.values()];
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function normalize(value = "") {
  return String(value)
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isCorrect(question, answer) {
  const value = normalize(answer);
  return (question.answers || []).some(accepted => normalize(accepted) === value);
}

function findTest(id) {
  return tests.find(test => test.id === id);
}

function attempts() { return readJSON(attemptsKey, []); }
function mistakes() { return readJSON(mistakesKey, []); }

function savedIdentity() {
  return readJSON(identityKey, { studentName: "", className: "" });
}

function bestScore(testId) {
  const values = attempts().filter(item => item.testId === testId && item.attemptType === "initial").map(item => item.percentage);
  return values.length ? Math.max(...values) : null;
}

function updateMistakeCount() {
  document.querySelector("#mistake-count").textContent = mistakes().length;
}

function dashboard() {
  const groups = [...new Set(tests.map(test => test.conceptGroup || "Other Grammar"))];
  const levels = [...new Set(tests.map(test => test.level).filter(Boolean))];
  app.innerHTML = `
    <div class="shell">
      <section class="hero">
        <p class="eyebrow">English Grammar · Interactive Review</p>
        <h1>One grammar focus.<br>One clear next step.</h1>
        <p>Choose tests from different books, review every mistake, retry only what went wrong, and build a clear record of progress.</p>
        <div class="hero-stats"><span>${tests.length} tests</span><span>${tests.reduce((n, test) => n + test.questions.length, 0)} questions</span><span>${mistakes().length} mistakes to review</span><span>Google Sheets ready</span></div>
      </section>
      <div class="toolbar">
        <input id="test-search" class="search" type="search" placeholder="Search grammar, book, unit, or level…" aria-label="Search tests">
        <select id="level-filter" aria-label="Filter by level"><option value="">All levels</option>${levels.map(level => `<option>${escapeHTML(level)}</option>`).join("")}</select>
      </div>
      <div id="concept-groups">${groups.map(group => conceptSection(group)).join("")}</div>
    </div>`;
  const applyFilters = () => {
    const query = normalize(document.querySelector("#test-search").value);
    const level = document.querySelector("#level-filter").value;
    document.querySelectorAll(".test-card").forEach(card => {
      const matchText = !query || normalize(card.dataset.search).includes(query);
      const matchLevel = !level || card.dataset.level === level;
      card.hidden = !(matchText && matchLevel);
    });
    document.querySelectorAll(".concept-section").forEach(section => {
      section.hidden = ![...section.querySelectorAll(".test-card")].some(card => !card.hidden);
    });
  };
  document.querySelector("#test-search").addEventListener("input", applyFilters);
  document.querySelector("#level-filter").addEventListener("change", applyFilters);
  app.focus();
}

function conceptSection(group) {
  const cards = tests.filter(test => (test.conceptGroup || "Other Grammar") === group).map(testCard).join("");
  return `<section class="concept-section" data-group="${escapeHTML(group)}">
    <div class="concept-head"><div><p class="eyebrow">Grammar Concept</p><h2>${escapeHTML(group)}</h2><p>Similar grammar units from different books are placed together.</p></div></div>
    <div class="test-grid">${cards}</div>
  </section>`;
}

function testCard(test) {
  const score = bestScore(test.id);
  const remaining = mistakes().filter(item => item.testId === test.id).length;
  const search = [test.title, test.grammarFocus, test.sourceBook, test.sourceUnit, test.level].join(" ");
  return `<article class="test-card" style="--accent:${escapeHTML(test.color || "#2563eb")}" data-level="${escapeHTML(test.level || "")}" data-search="${escapeHTML(search)}">
    <p class="eyebrow">${escapeHTML(test.grammarFocus)}</p>
    <h3>${escapeHTML(test.title)}</h3>
    <p>${escapeHTML(test.description || "Focused grammar practice and feedback.")}</p>
    <div class="card-meta"><span class="pill source">${escapeHTML(test.sourceBook || "Teacher Upload")} · ${escapeHTML(test.sourceUnit || "")}</span><span class="pill">${escapeHTML(test.level || "Mixed")}</span><span class="pill">${test.questions.length} questions</span></div>
    <div class="card-footer"><small>${score === null ? "Not attempted" : `Best score ${score}%`}${remaining ? ` · ${remaining} to retry` : ""}</small><a class="button primary" href="#/test/${encodeURIComponent(test.id)}">${score === null ? "Start test" : "Test again"}</a></div>
  </article>`;
}

function testPage(test, retry = false) {
  const identity = savedIdentity();
  const retryIds = new Set(mistakes().filter(item => item.testId === test.id).map(item => item.questionId));
  const questions = retry ? test.questions.filter(question => retryIds.has(question.id)) : test.questions;
  if (retry && !questions.length) return mistakeNotebook();
  app.innerHTML = `<div class="shell">
    <div class="page-head"><div><div class="breadcrumbs"><a href="#/">Mother Board</a> / ${retry ? '<a href="#/mistakes">My Mistakes</a> / ' : ""}${escapeHTML(test.grammarFocus)}</div><p class="eyebrow">${escapeHTML(test.sourceBook)} · ${escapeHTML(test.sourceUnit)} · ${escapeHTML(test.level)}</p><h1>${retry ? "Retry mistakes" : escapeHTML(test.title)}</h1><p>${retry ? `Retest the ${questions.length} question${questions.length === 1 ? "" : "s"} still in your mistake notebook.` : escapeHTML(test.description)}</p></div><a class="button ghost" href="#/">Back to board</a></div>
    <section class="panel">
      <p class="eyebrow">Student information</p>
      <div class="identity-grid"><div class="field"><label for="student-name">Student name *</label><input id="student-name" value="${escapeHTML(identity.studentName)}" autocomplete="name"></div><div class="field"><label for="class-name">Class / group</label><input id="class-name" value="${escapeHTML(identity.className)}" placeholder="Example: 801"></div></div>
      <p class="notice">Your answers are checked after submission. The original attempt and every retry are kept separately.</p>
    </section>
    <form id="test-form" class="question-list" style="--accent:${escapeHTML(test.color || "#2563eb")}">
      ${questions.map((question, index) => renderQuestion(question, index)).join("")}
      <div class="panel submit-row"><button class="button primary" type="submit">${retry ? "Check retry" : "Submit test"}</button><small>Unanswered questions will be marked incorrect.</small></div>
    </form>
  </div>`;
  const startedAt = Date.now();
  document.querySelector("#test-form").addEventListener("submit", event => {
    event.preventDefault();
    gradeTest(test, questions, retry, startedAt);
  });
  app.focus();
}

function renderQuestion(question, index) {
  const input = question.type === "choice"
    ? `<div class="choice-list">${question.choices.map(choice => `<label class="choice"><input type="radio" name="q-${escapeHTML(question.id)}" value="${escapeHTML(choice)}"><span>${escapeHTML(choice)}</span></label>`).join("")}</div>`
    : `<input class="answer-input" id="q-${escapeHTML(question.id)}" type="text" autocomplete="off" spellcheck="true" placeholder="Type your answer…">`;
  return `<article class="question-card"><span class="question-number">Question ${index + 1} · ${escapeHTML(question.type)}</span><h3>${escapeHTML(question.prompt)}</h3>${input}</article>`;
}

function collectAnswer(question) {
  if (question.type === "choice") return document.querySelector(`input[name="q-${CSS.escape(question.id)}"]:checked`)?.value || "";
  return document.querySelector(`#q-${CSS.escape(question.id)}`)?.value || "";
}

function gradeTest(test, questions, retry, startedAt) {
  const studentName = document.querySelector("#student-name").value.trim();
  const className = document.querySelector("#class-name").value.trim();
  if (!studentName) {
    document.querySelector("#student-name").focus();
    alert("Please enter the student's name before submitting.");
    return;
  }
  writeJSON(identityKey, { studentName, className });
  const duration = Date.now() - startedAt;
  const responseTime = Math.round(duration / Math.max(1, questions.length));
  const retryNumber = retry ? 1 + attempts().filter(item => item.testId === test.id && item.attemptType === "mistake_retry").length : 0;
  const responses = questions.map((question, index) => {
    const studentAnswer = collectAnswer(question);
    const correct = isCorrect(question, studentAnswer);
    return { questionId: question.id, questionNumber: index + 1, questionType: question.type, prompt: question.prompt, studentAnswer, correctAnswer: question.answers[0], isCorrect: correct, explanation: question.explanation, errorTag: question.errorTag || "grammar", retryNumber, responseTimeMs: responseTime, correctScore: correct ? 1 : 0 };
  });
  const correctCount = responses.filter(item => item.isCorrect).length;
  const percentage = Math.round(correctCount / Math.max(1, responses.length) * 100);
  const attempt = {
    attemptId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timeDate: new Date().toISOString(), studentName, className, testId: test.id,
    unitName: `${test.sourceBook} ${test.sourceUnit} · ${test.title}`,
    grammarFocus: test.grammarFocus, attemptType: retry ? "mistake_retry" : "initial",
    retryNumber, percentage, durationMs: duration, responses
  };
  const history = attempts();
  history.push(attempt);
  writeJSON(attemptsKey, history.slice(-250));
  updateMistakeBank(test, attempt);
  submitToSpreadsheet(attempt);
  currentAttempt = attempt;
  resultsPage(test, attempt);
}

function updateMistakeBank(test, attempt) {
  let bank = mistakes();
  attempt.responses.forEach(response => {
    const index = bank.findIndex(item => item.testId === test.id && item.questionId === response.questionId);
    if (response.isCorrect) {
      if (index >= 0) bank.splice(index, 1);
    } else {
      const record = { testId: test.id, testTitle: test.title, grammarFocus: test.grammarFocus, questionId: response.questionId, prompt: response.prompt, studentAnswer: response.studentAnswer, correctAnswer: response.correctAnswer, explanation: response.explanation, errorTag: response.errorTag, updatedAt: attempt.timeDate };
      if (index >= 0) bank[index] = { ...bank[index], ...record };
      else bank.push(record);
    }
  });
  writeJSON(mistakesKey, bank);
  updateMistakeCount();
}

function resultsPage(test, attempt) {
  const wrong = attempt.responses.filter(response => !response.isCorrect);
  const endpointReady = Boolean(window.APP_CONFIG?.resultsEndpoint);
  app.innerHTML = `<div class="shell">
    <div class="page-head"><div><div class="breadcrumbs"><a href="#/">Mother Board</a> / Results</div><p class="eyebrow">${escapeHTML(attempt.attemptType === "initial" ? "Initial attempt" : `Mistake retry ${attempt.retryNumber}`)}</p><h1>${escapeHTML(test.grammarFocus)} results</h1></div><a class="button ghost" href="#/">Back to board</a></div>
    <section class="panel">
      <div class="score-hero"><div class="score-ring">${attempt.percentage}%</div><div><h2>${wrong.length ? `${wrong.length} question${wrong.length === 1 ? "" : "s"} to review` : "Everything is correct!"}</h2><p>${wrong.length ? "Read each explanation, then retry only the mistakes." : "This grammar focus is currently clear. Keep practicing occasionally."}</p></div></div>
      <div class="submit-row">${wrong.length ? `<a class="button coral" href="#/retry/${encodeURIComponent(test.id)}">Retry mistakes</a>` : ""}<button id="download-report" class="button secondary" type="button">Download questions & answers</button><a class="button ghost" href="#/test/${encodeURIComponent(test.id)}">Take full test again</a></div>
      <p class="notice ${endpointReady ? "success" : ""}">${endpointReady ? "This attempt was sent to the teacher's result spreadsheet." : "This attempt is saved on this device. Automatic spreadsheet submission will begin after the Apps Script deployment URL is added to config.js."}</p>
    </section>
    <section class="review-list">${attempt.responses.map(renderResponse).join("")}</section>
  </div>`;
  document.querySelector("#download-report").addEventListener("click", () => downloadReport(test, attempt));
  app.focus();
}

function renderResponse(response) {
  return `<article class="result-card ${response.isCorrect ? "correct" : "wrong"}"><p class="eyebrow">${response.isCorrect ? "Correct" : `Review · ${escapeHTML(response.errorTag)}`}</p><h3>${escapeHTML(response.prompt)}</h3><div class="answer-compare"><div class="answer-box"><strong>Your answer</strong>${escapeHTML(response.studentAnswer || "—")}</div><div class="answer-box"><strong>Correct answer</strong>${escapeHTML(response.correctAnswer)}</div></div><p><strong>Why:</strong> ${escapeHTML(response.explanation)}</p></article>`;
}

function submitToSpreadsheet(attempt) {
  const endpoint = window.APP_CONFIG?.resultsEndpoint;
  if (!endpoint) return;
  const form = document.createElement("form");
  form.method = "POST";
  form.action = endpoint;
  form.target = "result-submit-frame";
  form.hidden = true;
  const payload = document.createElement("input");
  payload.type = "hidden";
  payload.name = "payload";
  payload.value = JSON.stringify({ action: "recordAttempt", ...attempt });
  form.appendChild(payload);
  document.body.appendChild(form);
  form.submit();
  setTimeout(() => form.remove(), 2000);
}

function mistakeNotebook() {
  const bank = mistakes();
  const groups = [...new Set(bank.map(item => item.testId))];
  app.innerHTML = `<div class="shell"><div class="page-head"><div><div class="breadcrumbs"><a href="#/">Mother Board</a> / My Mistakes</div><p class="eyebrow">Personal review queue</p><h1>My Mistake Notebook</h1><p>Questions disappear from this list only after they are answered correctly in a retry.</p></div><a class="button ghost" href="#/">Back to board</a></div>
    ${bank.length ? groups.map(id => mistakeGroup(id, bank.filter(item => item.testId === id))).join("") : `<div class="panel empty-state"><h2>No mistakes waiting</h2><p>Complete a test and any missed questions will appear here.</p><a class="button primary" href="#/">Choose a test</a></div>`}
  </div>`;
  app.focus();
}

function mistakeGroup(testId, items) {
  const test = findTest(testId);
  return `<section class="panel mistake-group"><p class="eyebrow">${escapeHTML(items[0].grammarFocus)}</p><h2>${escapeHTML(items[0].testTitle)}</h2><table class="mistake-table"><thead><tr><th>Question</th><th>Your answer</th><th>Correct answer</th><th>Weakness</th></tr></thead><tbody>${items.map(item => `<tr><td>${escapeHTML(item.prompt)}</td><td>${escapeHTML(item.studentAnswer || "—")}</td><td>${escapeHTML(item.correctAnswer)}</td><td>${escapeHTML(item.errorTag)}</td></tr>`).join("")}</tbody></table><div class="submit-row"><a class="button coral" href="#/retry/${encodeURIComponent(testId)}">Retry ${items.length} mistake${items.length === 1 ? "" : "s"}</a>${test ? `<a class="button ghost" href="#/test/${encodeURIComponent(testId)}">Full test</a>` : ""}</div></section>`;
}

function downloadReport(test, attempt) {
  const rows = attempt.responses.map(response => `<section><h2>${escapeHTML(response.prompt)}</h2><p><b>Your answer:</b> ${escapeHTML(response.studentAnswer || "—")}</p><p><b>Correct answer:</b> ${escapeHTML(response.correctAnswer)}</p><p><b>Explanation:</b> ${escapeHTML(response.explanation)}</p><p><b>Status:</b> ${response.isCorrect ? "Correct" : "Needs review"}</p></section>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHTML(test.title)} report</title><style>body{font:16px/1.55 Arial,sans-serif;max-width:850px;margin:40px auto;padding:0 24px;color:#18302a}header{border-bottom:4px solid #163f35}section{padding:18px 0;border-bottom:1px solid #ccd7d1}h1{font-size:32px}h2{font-size:19px}</style></head><body><header><h1>${escapeHTML(test.title)}</h1><p>${escapeHTML(attempt.studentName)} · ${escapeHTML(attempt.className)} · ${attempt.percentage}% · ${escapeHTML(attempt.timeDate)}</p></header>${rows}</body></html>`;
  downloadBlob(`${test.id}-${attempt.studentName || "student"}-report.html`, html, "text/html");
}

function uploadPage() {
  app.innerHTML = `<div class="shell"><div class="page-head"><div><div class="breadcrumbs"><a href="#/">Mother Board</a> / Teacher Upload</div><p class="eyebrow">Question bank tools</p><h1>Add tests from any book</h1><p>Import JSON or CSV, validate it, preview it on this device, then download a publish-ready extra-tests.js file.</p></div><a class="button ghost" href="#/">Back to board</a></div>
    <div class="upload-layout"><section class="panel"><div class="drop-zone"><h2>Choose a question-bank file</h2><p>Accepted formats: .json and .csv</p><input id="import-file" type="file" accept=".json,.csv,application/json,text/csv"><p><a href="question-bank-template.csv" download>Download CSV template</a></p></div><div id="import-status"></div><div class="submit-row"><button id="save-import" class="button primary" type="button" disabled>Save imported tests</button><button id="export-tests" class="button secondary" type="button">Download publish file</button><button id="clear-imports" class="button ghost" type="button">Clear local imports</button></div></section>
      <aside class="panel"><p class="eyebrow">Current local library</p><h2>${importedTests.length} imported test${importedTests.length === 1 ? "" : "s"}</h2><div id="local-import-list" class="import-preview">${importedTests.length ? importedTests.map(test => `<p><strong>${escapeHTML(test.title)}</strong><br><small>${escapeHTML(test.sourceBook)} · ${escapeHTML(test.sourceUnit)} · ${test.questions.length} questions</small></p>`).join("") : "<p>No local imports yet.</p>"}</div><p class="code-note">Local import affects only this browser. Replace the repository's extra-tests.js with the downloaded publish file to make the tests available to every student.</p></aside></div>
  </div>`;
  let staged = [];
  const status = document.querySelector("#import-status");
  const save = document.querySelector("#save-import");
  document.querySelector("#import-file").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      staged = file.name.toLowerCase().endsWith(".csv") ? testsFromCSV(text) : JSON.parse(text);
      const errors = validateTests(staged);
      if (errors.length) throw new Error(errors.join("\n"));
      status.innerHTML = `<p class="notice success">${staged.length} test${staged.length === 1 ? "" : "s"} validated successfully: ${staged.map(test => escapeHTML(test.title)).join(", ")}</p>`;
      save.disabled = false;
    } catch (error) {
      staged = [];
      save.disabled = true;
      status.innerHTML = `<p class="notice">Import failed: ${escapeHTML(error.message)}</p>`;
    }
  });
  save.addEventListener("click", () => {
    const byId = new Map(importedTests.map(test => [test.id, test]));
    staged.forEach(test => byId.set(test.id, test));
    importedTests = [...byId.values()];
    writeJSON(importedKey, importedTests);
    tests = combineTests();
    uploadPage();
  });
  document.querySelector("#export-tests").addEventListener("click", () => downloadBlob("extra-tests.js", `window.EXTRA_TESTS = ${JSON.stringify(importedTests, null, 2)};\n`, "text/javascript"));
  document.querySelector("#clear-imports").addEventListener("click", () => {
    if (!importedTests.length || confirm("Clear all tests imported into this browser?")) {
      importedTests = [];
      writeJSON(importedKey, []);
      tests = combineTests();
      uploadPage();
    }
  });
  app.focus();
}

function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell); if (row.some(value => value.trim())) rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  row.push(cell); if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

function testsFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error("The CSV has no question rows.");
  const headers = rows[0].map(value => value.trim());
  const objects = rows.slice(1).map(row => Object.fromEntries(headers.map((header, index) => [header, (row[index] || "").trim()])));
  const groups = new Map();
  objects.forEach(item => {
    if (!groups.has(item.testId)) groups.set(item.testId, { id: item.testId, conceptGroup: item.conceptGroup, grammarFocus: item.grammarFocus, title: item.title, sourceBook: item.sourceBook, sourceUnit: item.sourceUnit, level: item.level, description: item.description, color: item.color || "#2563eb", questions: [] });
    groups.get(item.testId).questions.push({ id: item.questionId, type: item.questionType, prompt: item.prompt, choices: item.choices ? item.choices.split("|").map(value => value.trim()) : [], answers: item.answers.split("|").map(value => value.trim()), explanation: item.explanation, errorTag: item.errorTag });
  });
  return [...groups.values()];
}

function validateTests(list) {
  const errors = [];
  if (!Array.isArray(list) || !list.length) return ["The file must contain at least one test."];
  const ids = new Set();
  list.forEach((test, testIndex) => {
    const label = test.title || `Test ${testIndex + 1}`;
    for (const key of ["id", "conceptGroup", "grammarFocus", "title", "sourceBook", "sourceUnit", "level"]) if (!test[key]) errors.push(`${label}: missing ${key}.`);
    if (ids.has(test.id)) errors.push(`${label}: duplicate test id ${test.id}.`); else ids.add(test.id);
    if (!Array.isArray(test.questions) || !test.questions.length) errors.push(`${label}: no questions.`);
    const questionIds = new Set();
    (test.questions || []).forEach((question, index) => {
      if (!question.id || questionIds.has(question.id)) errors.push(`${label}, question ${index + 1}: missing or duplicate id.`); else questionIds.add(question.id);
      if (!question.prompt || !Array.isArray(question.answers) || !question.answers.length || !question.explanation) errors.push(`${label}, question ${index + 1}: prompt, answer, or explanation is missing.`);
      if (question.type === "choice" && (!Array.isArray(question.choices) || question.choices.length < 2)) errors.push(`${label}, question ${index + 1}: choice questions need at least two choices.`);
      if (!["choice", "text", "correction"].includes(question.type)) errors.push(`${label}, question ${index + 1}: unsupported type ${question.type}.`);
    });
  });
  return errors;
}

function downloadBlob(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function route() {
  updateMistakeCount();
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  if (!parts.length) return dashboard();
  if (parts[0] === "test" && findTest(parts[1])) return testPage(findTest(parts[1]), false);
  if (parts[0] === "retry" && findTest(parts[1])) return testPage(findTest(parts[1]), true);
  if (parts[0] === "mistakes") return mistakeNotebook();
  if (parts[0] === "upload") return uploadPage();
  app.innerHTML = `<div class="shell empty-state"><h1>Page not found</h1><p><a href="#/">Return to the Mother Board</a></p></div>`;
}

window.addEventListener("hashchange", route);
route();
