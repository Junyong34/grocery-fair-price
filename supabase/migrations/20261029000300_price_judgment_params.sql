-- 판정 숫자 확정 (judgment.md 6장, 2026-10-29). 표본 밖 백테스트(packages/price-ingest/scripts/judgment-sweep.ts)로 정했다.
-- 평소가·판정 구간 상수는 usual.*로 두고 usual 명령이 읽는다. 표본 수 · 갱신 지연 기준은 시세 요약 재계산이 읽는다.

insert into price.calc_param (key, value, status, decided_in, note) values
  ('usual.window_days',             '14',   'decided', 'judgment.md 6장', '계절비율을 모으는 앞뒤 날 수. ±7일보다 평소가 오차 7.7% → 6.9%'),
  ('usual.season_years',            '3',    'decided', 'judgment.md 1-1', '계절비율을 만드는 기간 (해)'),
  ('usual.min_history_days',        '730',  'decided', 'judgment.md 3장', '계절비율 이력이 이보다 짧으면 판정 전'),
  ('usual.level_days',              '182',  'decided', 'judgment.md 6장', '수준을 내는 기간 (26주). 짧을수록 평소가 오차는 줄지만 몇 주 이어진 급등을 보통으로 본다'),
  ('usual.min_level_weeks',         '8',    'decided', 'judgment.md 3장', '수준 기간 안에 시세가 있어야 하는 주 수'),
  ('usual.min_active_months',       '10',   'decided', 'judgment.md 5장', '최근 12개월 중 시세가 있는 달이 이보다 적으면 제철 품목, 판정 전'),
  ('usual.min_band_days',           '365',  'decided', 'judgment.md 5장', '품종 판정 구간을 쓰려면 판정한 날이 이만큼. 그 전에는 카테고리 공통 구간'),
  ('usual.min_grade_share',         '0.5',  'decided', 'judgment.md 5-2', '같은 품종에서 조사 시장이 가장 많은 규격의 이 비율보다 적은 규격은 판정하지 않는다'),
  ('usual.min_season_consistency',  '0',    'decided', 'judgment.md 5-4', '해마다 계절 모양이 닮은 정도가 이보다 낮으면 계절비율을 1로 둔다'),
  ('usual.band_percentile',         '0.2',  'decided', 'judgment.md 6장', '판정 구간: 시세 ÷ 평소가의 하위·상위 비율. 표본 밖 22.5 · 60.4 · 17.1%'),
  ('usual.band_floor',              '0.05', 'decided', 'judgment.md 6장', '판정 구간 바닥 (±)'),
  ('usual.band_ceiling',            '0.25', 'decided', 'judgment.md 6장', '판정 구간 천장 (±). 실측에서 걸린 규격이 없다'),
  ('usual.verdict_days',            '3',    'decided', 'judgment.md 6장', '판정 차이 = 최근 이만큼의 시세 있는 날 편차의 중앙값. 판정이 바뀌는 횟수 1년 37 → 26번');

update price.calc_param
   set value = '{"share": 0.5, "days": 182}', status = 'decided', decided_in = 'judgment.md 6장',
       note = '그날 관측 수가 같은 품종·규격·범위의 최근 days일 관측 수 중앙값의 share배 이상이면 표본 충분. 미달한 날은 |편차| 9.1% (나머지 6.3%)'
 where key = 'aggregate.min_n';

update price.calc_param
   set value = '7', status = 'decided', decided_in = 'judgment.md 6장',
       note = '전국 값 하나로 오는 시세(축평원)가 이 조사일 수 이상 같으면 갱신 지연'
 where key = 'ekape.carried_over_days';

update price.calc_param
   set value = null, status = 'decided', decided_in = 'judgment.md 6장',
       note = '쓰지 않는다. 시장 표본 중앙값은 여러 시장이 실제로 같은 값을 내 이어질 수 있어 갱신 지연으로 보지 않는다 (kamis.md 6-4)'
 where key = 'kamis.carried_over_days';

comment on column price.daily_quote.stale_days is '같은 값이 이어진 시세 있는 날 수 (이날 포함, 바뀐 날이면 1). 전국 값 하나로 오는 출처(축평원)만 센다. 세지 않으면 null. calc_param ekape.carried_over_days 이상이면 갱신 지연';
comment on column price.daily_quote.meets_min_n is '표본 충분: n이 같은 품종·규격·기준·범위의 최근 182일(이날 포함) n 중앙값의 절반 이상인가 (calc_param aggregate.min_n). 계산 전이면 null';
