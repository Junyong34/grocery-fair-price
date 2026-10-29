import type postgres from "postgres"

const ROLLBACK = Symbol("rollback")

// 묶음 안의 쓰기를 모두 되돌린다. 테스트가 다른 테스트의 데이터를 바꾸지 않게 한다.
export async function inRollback(sql: postgres.Sql, fn: (tx: postgres.TransactionSql) => Promise<void>) {
  try {
    await sql.begin(async (tx) => {
      await fn(tx)
      throw ROLLBACK
    })
  } catch (e) {
    if (e !== ROLLBACK) throw e
  }
}

// 오류의 SQLSTATE. 오류가 나지 않으면 null.
export async function sqlState(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run()
    return null
  } catch (e) {
    return (e as { code?: string }).code ?? String(e)
  }
}

export const PRICE_TABLES = [
  "category", "item", "variety", "spec", "alias", "variety_seasonal_map",
  "source_code_table", "source_item", "source_code_map", "unit_rule",
  "region", "region_code_map", "seller", "obs_place", "store", "store_link", "store_seller", "market",
  "source_master_change",
  "observation", "observation_revision", "reference_observation",
  "daily_quote", "product_daily_summary", "reference_price", "season_index", "usual_price",
  "judgment_batch", "judgment_current", "judgment_snapshot", "calc_param",
  "ingest_run", "source_day", "source_day_part", "backfill_task",
  "product", "product_source_key", "product_attr_history", "product_variety_map", "al_variety_rule",
  "raw_object",
] as const

// web_reader가 읽는 표와 뷰 (pipeline.md 3-0 "web_reader가 읽는 표")
export const WEB_READ = [
  "category", "item", "variety", "spec", "alias", "variety_seasonal_map",
  "daily_quote", "product_daily_summary", "reference_price", "usual_price",
  "judgment_current", "judgment_snapshot", "current_judgment",
  "product", "product_attr_history", "seller", "region",
] as const

export const OPERATOR_TABLES = [
  "category", "item", "variety", "spec", "alias", "variety_seasonal_map",
  "unit_rule", "al_variety_rule", "seller", "calc_param",
] as const
