import { neon } from "@neondatabase/serverless";

globalThis.neon_exec = async (database_url, statement, params, callback_id) => {
  const sql = neon(database_url);
  const rows = await sql(statement, []);

  send_to_dart(callback_id, rows);
};
