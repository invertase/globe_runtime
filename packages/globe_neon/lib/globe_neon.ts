import { neon, NeonQueryFunction } from "@neondatabase/serverless";

type GlobeNeonState = {
  neon?: NeonQueryFunction<false, false>;
};

const neon_execute = async (
  state: GlobeNeonState,
  dbUrl: string,
  statement: string,
  options: string,
  callbackId: number
) => {
  const sql = (state.neon ??= neon(dbUrl));

  const parsedOptions = JSON.parse(options);
  const params = parsedOptions.params || [];
  const authToken = parsedOptions.authToken || undefined;
  const arrayMode = parsedOptions.arrayMode || undefined;
  const fetchOptions = parsedOptions.fetchOptions || {};
  const fullResults = parsedOptions.fullResults || undefined;

  const rows = await sql(statement, params, {
    arrayMode,
    authToken,
    fetchOptions,
    fullResults,
  });

  send_value_to_dart(callbackId, rows);
};

const neon_transaction = async (
  state: GlobeNeonState,
  dbUrl: string,
  sql_and_options: string,
  txn_options: string,
  callbackId: number
) => {
  const sql = (state.neon ??= neon(dbUrl));

  const queries = JSON.parse(sql_and_options);
  const parsedTxnOptions = JSON.parse(txn_options);

  const txnQueries = queries.map(
    (query: { sql: string; params: any[]; options: {} }) => {
      return sql(query.sql, query.params, query.options);
    }
  );

  const rows = await sql.transaction(txnQueries, parsedTxnOptions);

  send_value_to_dart(callbackId, rows);
};
