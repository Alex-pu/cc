import { pool } from './pool.js';

export const query = async <Row extends object>(sql: string, params: unknown[] = []) => {
  const result = await pool.query<Row>(sql, params);
  return result;
};
