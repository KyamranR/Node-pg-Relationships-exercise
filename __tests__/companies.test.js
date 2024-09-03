const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeEach(async () => {
  await db.query("BEGIN");
  await db.query("DELETE FROM companies");
  await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple', 'Maker of iPhones')`
  );
});

afterEach(async () => {
  await db.query("ROLLBACK");
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Get a list of companies", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      companies: [{ code: "apple", name: "Apple" }],
    });
  });
});

describe("GET /companies/:code", () => {
  test("Get details of a specific company", async () => {
    const res = await request(app).get("/companies/apple");
    expect(res.statusCode).toBe(200);
    expect(res.body.company).toEqual({
      code: "apple",
      name: "Apple",
      description: "Maker of iPhones",
      invoices: expect.any(Array),
      industries: expect.any(Array),
    });
  });

  test("Responds with 404 if company not found", async () => {
    const res = await request(app).get("/companies/nonexistent");
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /companies", () => {
  test("Create a new company", async () => {
    const res = await request(app)
      .post("/companies")
      .send({ name: "TestCo", description: "A test company" });
    expect(res.statusCode).toBe(201);
    expect(res.body.company).toHaveProperty("code");
    expect(res.body.company.name).toBe("TestCo");
  });
});

describe("PUT /companies/:code", () => {
  test("Update an existing company", async () => {
    const res = await request(app)
      .put("/companies/apple")
      .send({ name: "Apple Inc.", description: "Maker of Macs" });
    expect(res.statusCode).toBe(200);
    expect(res.body.company).toEqual({
      code: "apple",
      name: "Apple Inc.",
      description: "Maker of Macs",
    });
  });

  test("Responds with 404 if company not found", async () => {
    const res = await request(app)
      .put("/companies/nonexistent")
      .send({ name: "NonExistentCo", description: "Does not exist" });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /companies/:code", () => {
  test("Delete a company", async () => {
    const res = await request(app).delete("/companies/apple");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });

  test("Responds with 404 if company not found", async () => {
    const res = await request(app).delete("/companies/nonexistent");
    expect(res.statusCode).toBe(404);
  });
});
