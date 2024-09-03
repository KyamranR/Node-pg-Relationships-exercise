const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeEach(async () => {
  await db.query("DELETE FROM companies_industries");
  await db.query("DELETE FROM industries");
  await db.query("DELETE FROM companies");

  await db.query(`
    INSERT INTO companies (code, name, description) VALUES 
    ('apple', 'Apple Computer', 'Maker of OSX.'),
    ('ibm', 'IBM', 'Big blue.')
  `);
});

afterEach(async () => {
  await db.query("DELETE FROM companies_industries");
  await db.query("DELETE FROM industries");
  await db.query("DELETE FROM companies");
});

afterAll(async () => {
  await db.end();
});

test("POST /industries - Create a new industry", async () => {
  const res = await request(app)
    .post("/industries")
    .send({ code: "tech", industry: "Technology" });

  expect(res.statusCode).toBe(201);
  expect(res.body.industry).toEqual({
    code: "tech",
    industry: "Technology",
  });
});

test("GET /industries - Get all industries", async () => {
  await db.query(`
      INSERT INTO industries (code, industry) VALUES 
      ('tech', 'Technology'),
      ('fin', 'Finance')
    `);

  await db.query(`
      INSERT INTO companies_industries (comp_code, industry_code) VALUES
      ('apple', 'tech')
    `);

  const res = await request(app).get("/industries");

  expect(res.statusCode).toBe(200);
  expect(res.body.industries).toEqual([
    {
      code: "tech",
      industry: "Technology",
      companies: ["apple"],
    },
    {
      code: "fin",
      industry: "Finance",
      companies: [null],
    },
  ]);
});

test("POST /industries/:code - Associate a company with an industry", async () => {
  await db.query(`
    INSERT INTO industries (code, industry) VALUES 
    ('tech', 'Technology')
  `);

  const res = await request(app)
    .post("/industries/tech")
    .send({ comp_code: "apple" });

  expect(res.statusCode).toBe(200);
  expect(res.body.status).toBe("associated");

  const industryRes = await db.query(`
    SELECT * FROM companies_industries WHERE comp_code = 'apple' AND industry_code = 'tech'
  `);

  expect(industryRes.rows.length).toBe(1);
  expect(industryRes.rows[0]).toEqual({
    comp_code: "apple",
    industry_code: "tech",
  });
});
