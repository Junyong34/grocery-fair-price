-- 보존 정리에 안전장치를 둔다 (ingest-foundation/10, pipeline 3-9 보관 1·2).
-- 처음 정의(20261021000400)는 기간만 보고 지웠다. 지운 날은 관측값에서 다시 계산할 수 없으므로
-- 그날의 요약이 있을 때만 지운다:
--   KAMIS: 그날 KAMIS가 낸 시세 요약(daily_quote, sources에 'kamis')이 있거나, 그날 대표로 집계될 KAMIS 행이 없을 때
--          (매핑 안 된 품목뿐인 날은 요약이 생기지 않는다. 그런 날까지 막으면 영영 지우지 못한다)
--   참가격: 그 조사일의 상품 요약(product_daily_summary)이 있을 때 (ingest-foundation/07이 만든다. 그 전에는 지우지 않는다)
create or replace function price.purge_expired_observations(
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
    and o.obs_date < p_today - 90
    and (
      exists (select 1 from price.daily_quote q where q.obs_date = o.obs_date and 'kamis' = any(q.sources))
      or not exists (
        select 1 from price.observation k
          join price.source_item ks on ks.id = k.source_item_id and ks.source = 'kamis'
          join price.source_code_map m on m.source_item_id = k.source_item_id and m.status = 'mapped' and m.role = 'primary'
           and daterange(m.valid_from, m.valid_to) @> k.obs_date
         where k.obs_date = o.obs_date and k.price_per_base is not null)
    );
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
      and o.obs_date < v_chamga_keep_from
      and exists (select 1 from price.product_daily_summary s where s.obs_date = o.obs_date);
    get diagnostics v_count = row_count;
  end if;
  source := 'chamga'; deleted := v_count;
  return next;
end
$$;

revoke execute on function price.purge_expired_observations(date) from public, anon, authenticated;
grant execute on function price.purge_expired_observations(date) to ingest_writer;

comment on function price.purge_expired_observations(date) is '주 1회 보존 정리: KAMIS 관측값은 p_today − 90일보다 오래된 것(그날 KAMIS 시세 요약이 있거나 대표로 집계될 행이 없는 날만), 참가격은 최근 6 조사일보다 오래된 것(그 조사일의 상품 요약이 있는 날만)을 지운다. 축평원은 건드리지 않는다. 출처별 지운 행 수를 돌려준다. ingest_writer만 실행 (3-9)';
