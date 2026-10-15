/*
  CodeCraftHub API tests.

  Uses Node's built-in test runner (no extra packages needed).

  1. Start the server in one terminal:   npm start
  2. Run the tests in another terminal:  npm test
*/
const test = require("node:test");
const assert = require("node:assert");

const BASE_URL = "http://localhost:5000/api/courses";

// Small helper to send JSON requests
async function request(method, url, body) {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (body !== undefined) {
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const validCourse = {
  name: "Test Course",
  description: "Created by the automated tests",
  target_date: "2026-12-31",
  status: "Not Started"
};

test("full CRUD flow", async () => {
  // Create
  const created = await request("POST", BASE_URL, validCourse);
  assert.strictEqual(created.status, 201);
  assert.ok(Number.isInteger(created.body.id));
  assert.ok(created.body.created_at);
  const id = created.body.id;

  // Read all
  const all = await request("GET", BASE_URL);
  assert.strictEqual(all.status, 200);
  assert.ok(all.body.some(c => c.id === id));

  // Read one
  const one = await request("GET", `${BASE_URL}/${id}`);
  assert.strictEqual(one.status, 200);
  assert.strictEqual(one.body.name, validCourse.name);

  // Partial update
  const updated = await request("PUT", `${BASE_URL}/${id}`, { status: "In Progress" });
  assert.strictEqual(updated.status, 200);
  assert.strictEqual(updated.body.status, "In Progress");
  assert.strictEqual(updated.body.name, validCourse.name);
  assert.strictEqual(updated.body.created_at, created.body.created_at);

  // Delete
  const deleted = await request("DELETE", `${BASE_URL}/${id}`);
  assert.strictEqual(deleted.status, 204);

  // Confirm it is gone
  const missing = await request("GET", `${BASE_URL}/${id}`);
  assert.strictEqual(missing.status, 404);
});

test("stats endpoint returns totals by status", async () => {
  const res = await request("GET", `${BASE_URL}/stats`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(typeof res.body.total, "number");
  for (const s of ["Not Started", "In Progress", "Completed"]) {
    assert.strictEqual(typeof res.body.by_status[s], "number");
  }
});

test("rejects missing required fields", async () => {
  const res = await request("POST", BASE_URL, { name: "Only a name" });
  assert.strictEqual(res.status, 400);
});

test("rejects invalid status", async () => {
  const res = await request("POST", BASE_URL, { ...validCourse, status: "Started" });
  assert.strictEqual(res.status, 400);
});

test("rejects invalid date", async () => {
  const res = await request("POST", BASE_URL, { ...validCourse, target_date: "2026-02-30" });
  assert.strictEqual(res.status, 400);
});

test("rejects invalid JSON", async () => {
  const res = await request("POST", BASE_URL, "{bad json");
  assert.strictEqual(res.status, 400);
});

test("returns 404 for unknown course and 400 for bad id", async () => {
  assert.strictEqual((await request("GET", `${BASE_URL}/999999`)).status, 404);
  assert.strictEqual((await request("GET", `${BASE_URL}/abc`)).status, 400);
});
