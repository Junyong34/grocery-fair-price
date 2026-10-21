-- ① 수집 기반: 계산 상수 초기값과 관측값 보존 기간 정리 (pipeline.md 3-4 "계산 상수", 3-9 보관 1·2, 6-1)

-- 운영 DB에도 있어야 하는 값이라 시드가 아니라 마이그레이션에 둔다.
insert into price.calc_param (key, value, status, decided_in, note) values
  ('chamga.disappear_streak',   '3',   'decided',     'chamgagyeok.md 9장', '연속 3개 조사일 결측이면 조사 안 됨'),
  ('chamga.partial.day_ratio',  '0.8', 'decided',     'chamgagyeok.md 9장', null),
  ('chamga.partial.seller_ratio', '0.5', 'decided',   'chamgagyeok.md 9장', null),
  ('chamga.partial.store_ratio', '0.5', 'decided',    'chamgagyeok.md 9장', null),
  ('kamis.partial.item_ratio',  '0.5', 'decided',     'pipeline.md 5-2',    '일부만 옴'),
  ('aggregate.min_n',           null,  'placeholder', null,                 '범위별 최소 표본 수. ② 판정 설계에서 정하면 meets_min_n을 채운다'),
  ('kamis.carried_over_days',   null,  'placeholder', null,                 '② (kamis.md 6-4)'),
  ('ekape.carried_over_days',   null,  'placeholder', null,                 '② (ekape.md 9장)'),
  ('outlier.day_over_day',      '0.5', 'placeholder', null,                 '5-2 이상치. ②에서 다시 본다'),
  ('outlier.vs_median',         '3',   'placeholder', null,                 '5-2 이상치. ②에서 다시 본다');

-- 주 1회 보존 정리. KAMIS 관측값은 최근 90일, 참가격은 최근 6 조사일만 남긴다.
-- 참가격은 원래 8 조사일이었다. 2026-10-21 실측(1년차 495~575MB)으로 3-9 보관 2의 축소 순서대로 6으로 줄였다.
-- 축평원 관측값은 영구라 건드리지 않는다. 출처 조건은 source_item 조인으로 건다 (관측값에 source 열이 없다).
-- security invoker: 부르는 롤(ingest_writer)의 권한과 RLS로 지운다. 정리 대상은 BRIN (obs_date)이 찾는다.
create function price.purge_expired_observations(
  p_today date default (now() at time zone 'Asia/Seoul')::date
)
returns table (source text, deleted bigint)
language plpgsql
set search_path = ''
as $$
declare
  v_chamga_keep_from date;
  v_count bigint;
begin
  delete from price.observation o
  using price.source_item si
  where si.id = o.source_item_id and si.source = 'kamis'
    and o.obs_date < p_today - 90;
  get diagnostics v_count = row_count;
  source := 'kamis'; deleted := v_count;
  return next;

  -- 최근 6 조사일 중 가장 이른 날. 조사일이 6개보다 적으면 지우지 않는다.
  select min(d.obs_date) into v_chamga_keep_from
  from (
    select distinct o.obs_date
    from price.observation o
    join price.source_item si on si.id = o.source_item_id
    where si.source = 'chamga' and o.obs_date <= p_today
    order by o.obs_date desc
    limit 6
  ) d
  having count(*) = 6;

  v_count := 0;
  if v_chamga_keep_from is not null then
    delete from price.observation o
    using price.source_item si
    where si.id = o.source_item_id and si.source = 'chamga'
      and o.obs_date < v_chamga_keep_from;
    get diagnostics v_count = row_count;
  end if;
  source := 'chamga'; deleted := v_count;
  return next;
end
$$;

revoke execute on function price.purge_expired_observations(date) from public, anon, authenticated;
grant execute on function price.purge_expired_observations(date) to ingest_writer;
