const express = require("express");
const router = new express.Router();
const db = require("../db");

router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    const result = await db.query(
      "INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry",
      [code, industry]
    );

    return res.status(201).json({ industry: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT i.code, i.industry, array_agg(ci.comp_code) AS companies FROM industries AS i LEFT JOIN companies_industries AS ci ON i.code = ci.industry_code GROUP BY i.code"
    );

    return res.json({ industries: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { comp_code } = req.body;
    await db.query(
      "INSERT INTO companies_industries (comp_code, industry_code) VALUES ($1, $2)",
      [comp_code, code]
    );
    return res.json({ status: "associated" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
