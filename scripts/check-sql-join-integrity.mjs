import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import Papa from 'papaparse';
import initSqlJs from 'sql.js';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const root = process.cwd();
const fixtureDir = path.join(root, 'scripts', 'fixtures');

function loadDataset(fileName) {
  const csv = fs.readFileSync(path.join(fixtureDir, fileName), 'utf8');
  const parsed = Papa.parse(csv, { skipEmptyLines: true });
  assert.equal(parsed.errors.length, 0, `${fileName} must parse without CSV errors`);
  const [headers, ...data] = parsed.data;
  return { name: fileName, headers, data };
}

const orders = loadDataset('sql-join-orders.csv');
const customers = loadDataset('sql-join-customers.csv');
assert.equal(orders.data.length, 27, 'historical Orders fixture must contain 27 rows');
assert.equal(customers.data.length, 15, 'historical Customers fixture must contain 15 rows');

// Protect the source-of-truth workspace rows. SQL imports may coerce numeric
// columns inside SQLite, but must never mutate the original dataset arrays.
const ordersBefore = structuredClone(orders);
const customersBefore = structuredClone(customers);

const vite = await createServer({
  root,
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
});

try {
  const { SQLRuntime } = await vite.ssrLoadModule('/src/runtimes/SQLRuntime.ts');
  assert.equal(typeof SQLRuntime, 'function', 'Vite must load the real SQLRuntime TypeScript module');

  const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
  const SQL = await initSqlJs({ locateFile: () => wasmPath });
  const runtime = new SQLRuntime();

  // initialize() intentionally uses Vite's browser asset URL. For Node CI,
  // inject the same sql.js engine/database directly, then exercise the actual
  // production syncDatasets() and execute() methods unchanged.
  runtime.SQL = SQL;
  runtime.db = new SQL.Database();
  runtime.isInitialized = true;

  const mappings = runtime.syncDatasets([orders, customers]);
  assert.deepEqual(orders, ordersBefore, 'SQL import must not mutate Orders source values');
  assert.deepEqual(customers, customersBefore, 'SQL import must not mutate Customers source values');

  const orderTable = mappings.find((entry) => entry.datasetName === orders.name)?.tableName;
  const customerTable = mappings.find((entry) => entry.datasetName === customers.name)?.tableName;
  assert.ok(orderTable, 'Orders fixture must be mapped to a SQLite table');
  assert.ok(customerTable, 'Customers fixture must be mapped to a SQLite table');

  const quote = (identifier) => `"${String(identifier).replaceAll('"', '""')}"`;
  const query = `
    SELECT
      l.*,
      r.customer_name,
      r.state,
      r.segment,
      r.signup_date
    FROM ${quote(orderTable)} AS l
    LEFT JOIN ${quote(customerTable)} AS r
      ON l.customer_id = r.customer_id
    ORDER BY l.order_id;
  `;

  const outputChunks = [];
  const result = await runtime.execute(query, (text) => outputChunks.push(text));
  assert.equal(result.error, undefined, `historical LEFT JOIN must execute cleanly: ${result.error || ''}`);
  assert.equal(result.datasets?.length, 1, 'historical LEFT JOIN must produce one result dataset');

  const joined = result.datasets[0];
  assert.equal(joined.headers.length, 11, 'LEFT JOIN result must have an aligned 11-column schema');
  assert.equal(joined.data.length, 27, 'LEFT JOIN must retain all 27 Orders rows');
  assert.ok(outputChunks.length > 0, 'SQLRuntime must emit the rendered result through onOutput');

  const customerIdIndex = joined.headers.indexOf('customer_id');
  const customerNameIndex = joined.headers.indexOf('customer_name');
  const stateIndex = joined.headers.indexOf('state');
  const segmentIndex = joined.headers.indexOf('segment');
  const signupIndex = joined.headers.indexOf('signup_date');
  for (const index of [customerIdIndex, customerNameIndex, stateIndex, segmentIndex, signupIndex]) {
    assert.ok(index >= 0, 'joined output must contain expected customer columns');
  }

  // Every text-valued Orders field must survive the real SQL import/join exactly.
  // Numeric SQLite columns may normalize display (for example 49.0 -> 49), so
  // those are deliberately excluded from this exact-string comparison.
  const exactOrderColumns = ['order_id', 'customer_id', 'order_date', 'product', 'status'];
  for (const [rowIndex, sourceRow] of orders.data.entries()) {
    const joinedRow = joined.data[rowIndex];
    for (const column of exactOrderColumns) {
      const sourceIndex = orders.headers.indexOf(column);
      const joinedIndex = joined.headers.indexOf(column);
      assert.equal(
        joinedRow[joinedIndex],
        sourceRow[sourceIndex],
        `${column} changed during SQL import/join on Orders row ${rowIndex + 1}`,
      );
    }
  }

  const customerRowsById = new Map(
    customers.data.map((row) => [row[customers.headers.indexOf('customer_id')], row]),
  );
  const joinedCustomerColumns = ['customer_name', 'state', 'segment', 'signup_date'];
  for (const joinedRow of joined.data) {
    const customerId = joinedRow[customerIdIndex];
    const sourceCustomer = customerRowsById.get(customerId);
    if (!sourceCustomer) continue;
    for (const column of joinedCustomerColumns) {
      const sourceIndex = customers.headers.indexOf(column);
      const joinedIndex = joined.headers.indexOf(column);
      assert.equal(
        joinedRow[joinedIndex],
        sourceCustomer[sourceIndex],
        `${column} changed during SQL import/join for ${customerId}`,
      );
    }
  }

  for (const orphanId of ['C999', 'C888']) {
    const row = joined.data.find((candidate) => candidate[customerIdIndex] === orphanId);
    assert.ok(row, `${orphanId} must remain in the LEFT JOIN result`);
    assert.equal(row[customerNameIndex], '', `${orphanId} customer_name must export SQL NULL as an empty cell`);
    assert.equal(row[stateIndex], '', `${orphanId} state must export SQL NULL as an empty cell`);
    assert.equal(row[segmentIndex], '', `${orphanId} segment must export SQL NULL as an empty cell`);
    assert.equal(row[signupIndex], '', `${orphanId} signup_date must export SQL NULL as an empty cell`);
  }

  // The historical corruption suffixed repeated legitimate cell values with
  // identifier-style uniqueness markers such as C001_2 and Starter Plan_2.
  for (const row of joined.data) {
    for (const value of row) {
      assert.doesNotMatch(String(value), /_2$/, `historical cell uniqueness mutation reappeared: ${value}`);
    }
  }

  // Exercise the same rectangular dataset through a CSV serialization round-trip.
  // This specifically guards the old corruption where the Customers header was
  // appended to the final Orders row and subsequent rows had a different width.
  const exportedCsv = Papa.unparse([joined.headers, ...joined.data]);
  const reparsed = Papa.parse(exportedCsv, { skipEmptyLines: true });
  assert.equal(reparsed.errors.length, 0, 'joined CSV export must parse normally');
  assert.equal(reparsed.data.length, 28, 'joined CSV export must contain one header plus 27 data rows');
  for (const [index, row] of reparsed.data.entries()) {
    assert.equal(row.length, 11, `CSV row ${index + 1} must remain aligned to 11 fields`);
  }

  console.log('bIDE SQL historical join integrity regression passed: 27 rows, 11 columns, exact text preservation, orphan preservation, no cell mutation, valid CSV round-trip.');
} finally {
  await vite.close();
}
