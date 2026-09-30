# Elementary to High School & FCE Grammar

An interactive grammar-review website with:

- a grammar-concept motherboard;
- tests from multiple books and units;
- automatic scoring and explanations;
- a personal mistake notebook and mistake-only retries;
- downloadable mistake reports;
- local teacher import for JSON/CSV question banks; and
- optional Google Sheets result recording.

## Open locally

Double-click `Start Website.cmd`, or run:

```text
node server.mjs
```

Then open `http://127.0.0.1:8877`.

## Connect the result spreadsheet

The target spreadsheet is already identified in `config.js`. To activate automatic submissions:

1. Open the Google Sheet.
2. Choose **Extensions → Apps Script**.
3. Replace the editor contents with `apps-script/Code.gs`.
4. Choose **Deploy → New deployment → Web app**.
5. Run as the script owner and allow the intended students to access it.
6. Copy the deployed `/exec` URL into `config.js` as `resultsEndpoint`.

The Apps Script writes a summary to `test result` and item-level rows to `question responses`. The `weakness analysis` tab groups results by student and grammar focus.

## Add tests

Open **Teacher upload** in the website. It accepts:

- a JSON array using the same schema as `data.js`; or
- a CSV based on `question-bank-template.csv`.

Imports are first saved in that browser for preview. Use **Download publish file** to create `extra-tests.js`, replace the repository's file with it, and publish the repository again so every student receives the new tests.

## Validate

```text
node validate.mjs
node --check app.js
node --check data.js
node --check extra-tests.js
```

## Deploy

The project is static and works on GitHub Pages or Cloudflare Pages. The Google Apps Script endpoint remains server-side and no Google credential is stored in the website.
