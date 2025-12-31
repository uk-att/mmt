const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

// Configure your PostgreSQL connection here
const pool = new Pool({
  user: process.env.PGUSER || 'idb_inventory_atrinet',
  host: process.env.PGHOST || 'eososs-wst3-nprd-pg.postgres.database.azure.com',
  database: process.env.PGDATABASE || 'dap',
  password: process.env.PGPASSWORD || 'jQ3rYLGhJiFO',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  ssl: { rejectUnauthorized: false }
});

// Get all schemas
router.get('/schemas', async (req, res) => {
  try {
    const result = await pool.query(`SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`);
    res.json(result.rows.map(r => r.schema_name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tables for a schema
router.get('/schemas/:schema/tables', async (req, res) => {
  const { schema } = req.params;
  try {
    const result = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`,
      [schema]
    );
    res.json(result.rows.map(r => r.table_name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all columns for a table in a schema
router.get('/schemas/:schema/tables/:table/columns', async (req, res) => {
  const { schema, table } = req.params;
  try {
    const result = await pool.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
      [schema, table]
    );
    res.json(result.rows.map(r => ({
      name: r.column_name,
      data_type: r.data_type,
      is_nullable: r.is_nullable
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
