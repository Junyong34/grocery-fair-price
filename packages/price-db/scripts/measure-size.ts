// 행당 크기 실측 (ingest-foundation/02 "용량 먼저 재기", pipeline.md 3-9).
// 표마다 같은 정의(열·check·인덱스·저장 설정)의 세션 임시 표를 만들고, 샘플 모양의 행 N개를 넣어
// pg_total_relation_size로 잰다. 영구 표에는 쓰지 않으므로 로컬 DB를 더럽히지 않는다.
// 실행: pnpm --filter @workspace/price-db measure [행 수 …]   (기본 10000 100000)
import { connectAdmin } from "../src/db.ts"

type Case = { table: string; label: string; options?: string; insert: (n: number) => string }

// 행 모양은 저장 샘플과 pipeline.md 3-10을 따른다. 숫자 값의 분포는 크기에 거의 영향이 없다.
const CASES: Case[] = [
  {
    table: "observation",
    label: "observation (KAMIS 시장 행)",
    options: "fillfactor = 90, autovacuum_vacuum_scale_factor = 0.05",
    // 하루 약 5,200행: 원천 키 700 × 시장 8로 하루를 채우고 날짜 순서로 넣는다
    insert: (n) => `
      select 1 + (g % 5200) % 700, date '2026-07-01' + g / 5200, 1 + (g % 5200) / 700, 'retail', 'quote_sample',
             null, 1 + (g % 220), 1 + (g % 220), 1000 + (g * 37) % 40000, 1, '포기',
             round(((1000 + (g * 37) % 40000) / 1.0)::numeric, 2), 1, null, null, null, null, null,
             timestamptz '2026-07-01 15:06:40+00' + make_interval(days => g / 5200),
             timestamptz '2026-07-02 02:27:09+00' + make_interval(days => g / 5200), 0, 1 + g / 1000
      from generate_series(0, ${n} - 1) g`,
  },
  {
    table: "observation",
    label: "observation (참가격 점포 행)",
    options: "fillfactor = 90, autovacuum_vacuum_scale_factor = 0.05",
    // 조사일 하나에 점포 450 × 상품 220. 품종 매핑 전이라 variety·기준 단위 가격이 비어 있다
    insert: (n) => `
      select 1000 + (g % 220), date '2026-09-25' + 14 * (g / 99000), 1 + (g % 99000) / 220, 'retail', 'shelf_price',
             1 + (g % 220), null, null, 1000 + (g * 37) % 20000, null, null, null, null, false, false, null, null, null,
             timestamptz '2026-09-23 03:06:47+00', timestamptz '2026-10-12 02:27:09+00', 0, 1 + g / 1000
      from generate_series(0, ${n} - 1) g`,
  },
  {
    table: "observation",
    label: "observation (참가격 점포 행, 품종 매핑 뒤)",
    options: "fillfactor = 90, autovacuum_vacuum_scale_factor = 0.05",
    // 상품 → 품종이 이어지면 품종·규격·기준 단위 가격·규칙이 차고 품종 부분 인덱스에도 들어간다
    insert: (n) => `
      select 1000 + (g % 220), date '2026-09-25' + 14 * (g / 99000), 1 + (g % 99000) / 220, 'retail', 'shelf_price',
             1 + (g % 220), 1 + (g % 220), 1 + (g % 220), 1000 + (g * 37) % 20000, null, null,
             round(((1000 + (g * 37) % 20000) / 1.1)::numeric, 2), 1, false, false, null, null, null,
             timestamptz '2026-09-23 03:06:47+00', timestamptz '2026-10-12 02:27:09+00', 0, 1 + g / 1000
      from generate_series(0, ${n} - 1) g`,
  },
  {
    table: "daily_quote",
    label: "daily_quote",
    // 품종·규격 220 × 범위 4 × 날짜
    insert: (n) => `
      select 1 + (g % 220), 1 + (g % 220), 'retail', 'quote',
             (array['national', 'market_type:traditional', 'market_type:large_retail', 'channel:large_mart'])[1 + (g / 220) % 4],
             date '2021-10-01' + g / 880, 1234.5 + g % 100, 1234.5, 900, 1800, 30, null, array['kamis'], 0, null, null, null,
             'v1', now()
      from generate_series(0, ${n} - 1) g`,
  },
  {
    table: "product_daily_summary",
    label: "product_daily_summary",
    // 상품 457 × 범위 약 8 × 조사일
    insert: (n) => `
      select 1 + (g % 457), (array['national', 'channel:large_mart', 'channel:ssm', 'channel:department',
                                   'channel:convenience', 'seller:1', 'seller:2', 'seller:3'])[1 + (g / 457) % 8],
             date '2026-06-12' + 14 * (g / 3656), 1200, 1480.5, 1980, 1450, 1475.25, 120, 12, 3, 0, null, now()
      from generate_series(0, ${n} - 1) g`,
  },
  {
    table: "reference_price",
    label: "reference_price",
    insert: (n) => `
      select 1 + (g % 220), 1 + (g % 220), (array['normal_year', 'year_ago'])[1 + (g / 220) % 2], 'computed', 'national',
             date '2026-01-01' + g / 440, 2345.67, 'kamis_5y_trimmed_mean', now()
      from generate_series(0, ${n} - 1) g`,
  },
  {
    table: "usual_price",
    label: "usual_price",
    // components는 평소가 계산의 근거 (100B 안팎)
    insert: (n) => `
      select 1 + (g % 220), 1 + (g % 220), date '2026-01-01' + g / 220, 2345.67, 'median_28d_excl_promo',
             jsonb_build_object('window_days', 28, 'n_days', 20, 'n_obs', 412, 'normal_year', 2400.5,
                                'trim', 0.1, 'sources', jsonb_build_array('kamis', 'chamga')), 2
      from generate_series(0, ${n} - 1) g`,
  },
]

const sizes = process.argv.slice(2).map(Number).filter((n) => n > 0)
const counts = sizes.length > 0 ? sizes : [10_000, 100_000]

const sql = connectAdmin()
try {
  const results: Record<string, string | number>[] = []
  for (const c of CASES) {
    for (const n of counts) {
      await sql.begin(async (tx) => {
        await tx.unsafe(`create temp table m (like price.${c.table} including all)
                         ${c.options ? `with (${c.options})` : ""} on commit drop`)
        await tx.unsafe(`insert into m ${c.insert(n)}`)
        await tx.unsafe(`analyze m`)
        const [row] = await tx.unsafe(`
          select pg_relation_size('m') as heap, pg_indexes_size('m') as idx, pg_total_relation_size('m') as total`)
        results.push({
          표: c.label,
          행: n,
          "표 B/행": Math.round(Number(row!.heap) / n),
          "인덱스 B/행": Math.round(Number(row!.idx) / n),
          "합계 B/행": Math.round(Number(row!.total) / n),
          "합계 MB": Math.round((Number(row!.total) / 1024 / 1024) * 10) / 10,
        })
      })
    }
  }
  console.table(results)
} finally {
  await sql.end()
}
