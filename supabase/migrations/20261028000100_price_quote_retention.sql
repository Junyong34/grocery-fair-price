-- 시세 요약 보존 정리 (ingest-foundation/04, pipeline 3-9 보관 4).
-- daily_quote는 최근 6개월(182일)은 모든 범위, 그보다 오래된 것은 national 범위만 영구 보관한다 (2026-10-27).
-- 6개월 밖 national은 평소가의 계절비율(3년, judgment.md)을 해마다 다시 만드는 재료라 지우지 않는다.
-- 지우는 것은 KAMIS 시세(basis = 'quote')의 시장 유형 범위뿐이다. 참가격 판매가(shelf_price)는 과거를 다시 받을 수 없어
-- 업태 범위도 건드리지 않는다.
create function price.purge_expired_quotes(
  p_today date default (now() at time zone 'Asia/Seoul')::date
)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_count bigint;
begin
  delete from price.daily_quote q
  where q.basis = 'quote' and q.scope_key <> 'national' and q.obs_date < p_today - 182;
  get diagnostics v_count = row_count;
  return v_count;
end
$$;

revoke execute on function price.purge_expired_quotes(date) from public, anon, authenticated;
grant execute on function price.purge_expired_quotes(date) to ingest_writer;

comment on function price.purge_expired_quotes(date) is '주 1회 시세 요약 정리: p_today − 182일보다 오래된 daily_quote 중 KAMIS 시세(basis quote)의 national 아닌 범위(시장 유형)를 지운다. national과 참가격 판매가는 영구. 지운 행 수를 돌려준다. ingest_writer만 실행 (3-9 보관 4)';
