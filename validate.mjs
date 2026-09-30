import fs from "node:fs";
import vm from "node:vm";

const required = ["index.html", "styles.css", "config.js", "data.js", "extra-tests.js", "app.js", "server.mjs", "apps-script/Code.gs"];
const errors = required.filter(file => !fs.existsSync(file)).map(file => `Missing ${file}`);
const context = { window: {} };
vm.createContext(context);
for (const file of ["data.js", "extra-tests.js"]) vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
const tests = [...(context.window.BUNDLED_TESTS || []), ...(context.window.EXTRA_TESTS || [])];
const testIds = new Set();
let questionCount = 0;
for (const test of tests) {
  for (const key of ["id", "conceptGroup", "grammarFocus", "title", "sourceBook", "sourceUnit", "level"]) if (!test[key]) errors.push(`${test.title || "Test"}: missing ${key}`);
  if (testIds.has(test.id)) errors.push(`Duplicate test id ${test.id}`); testIds.add(test.id);
  if (!Array.isArray(test.questions) || !test.questions.length) errors.push(`${test.id}: no questions`);
  const questionIds = new Set();
  for (const question of test.questions || []) {
    questionCount += 1;
    if (!question.id || questionIds.has(question.id)) errors.push(`${test.id}: missing or duplicate question id`); questionIds.add(question.id);
    if (!question.prompt || !question.answers?.length || !question.explanation || !question.errorTag) errors.push(`${test.id}/${question.id}: incomplete question`);
    if (!["choice", "text", "correction"].includes(question.type)) errors.push(`${test.id}/${question.id}: unsupported type`);
    if (question.type === "choice" && question.choices?.length < 2) errors.push(`${test.id}/${question.id}: too few choices`);
  }
}
const app = fs.readFileSync("app.js", "utf8");
for (const marker of ["submitToSpreadsheet", "mistakeNotebook", "downloadReport", "testsFromCSV", "localStorage"]) if (!app.includes(marker)) errors.push(`app.js missing ${marker}`);
const code = fs.readFileSync("apps-script/Code.gs", "utf8");
for (const marker of ["doPost", "LockService", "question responses", "safeCell"]) if (!code.includes(marker)) errors.push(`Apps Script missing ${marker}`);
if (errors.length) { errors.forEach(error => console.error(`- ${error}`)); process.exit(1); }
console.log(JSON.stringify({ tests: tests.length, questions: questionCount, conceptGroups: [...new Set(tests.map(test => test.conceptGroup))], status: "valid" }, null, 2));
