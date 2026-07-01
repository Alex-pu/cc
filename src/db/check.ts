import { pool } from './pool.js';

const result = await pool.query<{ now: Date; database_name: string }>(
  'select now(), current_database() as database_name',
);

console.log({
  ok: true,
  database: result.rows[0]?.database_name,
  checkedAt: result.rows[0]?.now,
});

await pool.end();
