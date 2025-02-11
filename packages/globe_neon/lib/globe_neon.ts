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

registerJSModule("GlobeNeonSdk", {
  neon_execute,
});
