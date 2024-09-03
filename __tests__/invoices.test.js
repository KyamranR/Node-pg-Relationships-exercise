const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testId = 1;

beforeEach(async () => {
  await db.query("BEGIN");
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");

  await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple Computer', 'Maker of OSX.')`
  );
  await db.query(
    `INSERT INTO invoices (id, comp_code, amt, paid, add_date, paid_date) VALUES 
    ($1, 'apple', 100, false, '2024-08-30', null)`,
    [testId]
  );
});

afterEach(async () => {
  await db.query("ROLLBACK");
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("Get a list of invoices", async () => {
    const res = await request(app).get("/invoices");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoices: [{ id: testId, comp_code: "apple" }],
    });
  });
});

describe("GET /invoices/:id", () => {
  test("Get details of a specific invoice", async () => {
    const res = await request(app).get("/invoices/1");
    expect(res.statusCode).toBe(200);
    expect(res.body.invoice).toEqual({
      id: 1,
      amt: 100,
      paid: false,
      add_date: "2024-08-30T05:00:00.000Z",
      paid_date: null,
      comp_code: "apple",
      company: {
        code: "apple",
        name: "Apple Computer",
        description: "Maker of OSX.",
      },
    });
  });

  test("Responds with 404 if invoice not found", async () => {
    const res = await request(app).get("/invoices/9999");
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /invoices", () => {
  test("Create a new invoice", async () => {
    const res = await request(app)
      .post("/invoices")
      .send({ comp_code: "apple", amt: 300 });
    expect(res.statusCode).toBe(201);
    expect(res.body.invoice).toHaveProperty("id");
    expect(res.body.invoice.amt).toBe(300);
    expect(res.body.invoice.paid).toBe(false);
  });
});

describe("PUT /invoices/:id", () => {
  test("Update an existing invoice", async () => {
    const res = await request(app)
      .put("/invoices/1")
      .send({ amt: 150, paid: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.invoice.amt).toBe(150);
    expect(res.body.invoice.paid).toBe(true);
    expect(res.body.invoice.paid_date).not.toBeNull();
  });

  test("Responds with 404 if invoice not found", async () => {
    const res = await request(app)
      .put("/invoices/9999")
      .send({ amt: 150, paid: true });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /invoices/:id", () => {
  test("Delete an invoice", async () => {
    const res = await request(app).delete("/invoices/1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });

  test("Responds with 404 if invoice not found", async () => {
    const res = await request(app).delete("/invoices/9999");
    expect(res.statusCode).toBe(404);
  });
});
