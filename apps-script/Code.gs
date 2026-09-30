const SPREADSHEET_ID = "15MlblOctbspwxMvvCC49GLBE_VoZGfzJS3IvMydk4D0";
const SUMMARY_SHEET = "test result";
const RESPONSE_SHEET = "question responses";

function doGet() {
  return jsonOutput({ ok: true, service: "Grammar Review Lab results" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const raw = e && e.parameter && e.parameter.payload
      ? e.parameter.payload
      : (e && e.postData && e.postData.contents) || "{}";
    const payload = JSON.parse(raw);
    if (payload.action !== "recordAttempt") throw new Error("Unsupported action.");
    validateAttempt(payload);

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const summary = spreadsheet.getSheetByName(SUMMARY_SHEET);
    const responses = spreadsheet.getSheetByName(RESPONSE_SHEET);
    if (!summary || !responses) throw new Error("Required result tabs are missing.");

    const mistakes = payload.responses
      .filter(item => !item.isCorrect)
      .map(item => item.questionNumber)
      .join(", ");
    summary.appendRow([
      new Date(payload.timeDate),
      safeCell(payload.studentName),
      safeCell(payload.unitName),
      payload.percentage / 100,
      mistakes
    ]);
    summary.getRange(summary.getLastRow(), 4).setNumberFormat("0%");

    const rows = payload.responses.map(item => [
      safeCell(payload.attemptId),
      new Date(payload.timeDate),
      safeCell(payload.studentName),
      safeCell(payload.className || ""),
      safeCell(payload.testId),
      safeCell(payload.unitName),
      safeCell(payload.grammarFocus),
      safeCell(item.questionId),
      Number(item.questionNumber),
      safeCell(item.questionType),
      safeCell(item.studentAnswer || ""),
      safeCell(item.correctAnswer || ""),
      Boolean(item.isCorrect),
      safeCell(item.errorTag || "grammar"),
      Number(item.retryNumber || 0),
      Number(item.responseTimeMs || 0),
      item.isCorrect ? 1 : 0
    ]);
    if (rows.length) responses.getRange(responses.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    SpreadsheetApp.flush();
    return jsonOutput({ ok: true, attemptId: payload.attemptId, responseCount: rows.length });
  } catch (error) {
    return jsonOutput({ ok: false, error: String(error.message || error) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function validateAttempt(payload) {
  for (const key of ["attemptId", "timeDate", "studentName", "testId", "unitName", "grammarFocus"]) {
    if (!payload[key] || String(payload[key]).length > 500) throw new Error("Invalid " + key + ".");
  }
  if (!Array.isArray(payload.responses) || !payload.responses.length || payload.responses.length > 200) throw new Error("Invalid responses.");
  if (!Number.isFinite(Number(payload.percentage)) || payload.percentage < 0 || payload.percentage > 100) throw new Error("Invalid percentage.");
}

function safeCell(value) {
  const text = String(value == null ? "" : value).slice(0, 5000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function jsonOutput(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
