-- 참가격 판매처와 점포 → 판매처 자동 연결 (ingest-foundation/07, pipeline 3-2, chamgagyeok.md 11장).
-- 판매처 목록은 운영자가 정한다 (2026-10-29, 운영 점포 630곳 실측). 이 파일이 그 기준 데이터다.
-- 판매처 이름이 곧 연결 규칙이다: 점포 이름에서 '(주)'와 공백을 뺀 것이 판매처 이름으로 시작하고 업태가 같으면 잇는다.
-- 여럿이 맞으면 가장 긴 이름을 쓴다. 업태를 함께 보므로 이마트24(본사, 편의점)는 이마트(대형마트)로 묶이지 않는다.
-- 점포가 새 번호로 다시 등록되면 새 점포가 생기므로, 연결은 수집이 점포 마스터를 적재할 때마다 이 함수로 한다.
-- 농협은 법인 둘로 나눈다: 가격 정하는 방식이 다르다 (하나로유통은 법인 안 단일가 88%, 농협유통 35%, 10-09 조사일).

insert into price.seller (name, channel) values
  ('이마트', 'large_mart'),
  ('농협하나로유통', 'large_mart'),
  ('농협유통', 'large_mart'),
  ('롯데슈퍼', 'ssm'),
  ('GS더프레시', 'ssm'),
  ('현대백화점', 'department'),
  ('신세계백화점', 'department'),
  ('CU', 'convenience'),
  ('GS25', 'convenience'),
  ('세븐일레븐', 'convenience'),
  ('이마트24', 'convenience')
on conflict (name) do nothing;

-- 판매처 연결이 하나도 없는 점포에만 연결을 만든다. 운영자가 닫거나 바꾼 기간은 건드리지 않는다.
-- p_since: 연결의 유효 시작일. 참가격 API가 주는 첫 조사일이라 그 뒤 모든 조사일이 이 연결로 집계된다.
-- 돌려주는 값: 새로 이은 점포 수, 이은 뒤에도 연결이 없는 점포 수 (판매처 규칙에 맞지 않는 점포)
create function price.assign_store_sellers(
  p_since date default '2026-06-12'
)
returns table (assigned bigint, unassigned bigint)
language plpgsql
set search_path = ''
as $$
begin
  insert into price.store_seller (place_id, seller_id, valid_from)
  select distinct on (st.place_id) st.place_id, se.id, p_since
    from price.store st
    join price.seller se
      on se.channel = st.channel
     and starts_with(regexp_replace(st.name, '\(주\)|\s', '', 'g'), se.name)
   where not exists (select 1 from price.store_seller ss where ss.place_id = st.place_id)
   order by st.place_id, length(se.name) desc;
  get diagnostics assigned = row_count;

  select count(*) into unassigned
    from price.store st
   where not exists (select 1 from price.store_seller ss where ss.place_id = st.place_id);
  return next;
end
$$;

revoke execute on function price.assign_store_sellers(date) from public, anon, authenticated;
grant execute on function price.assign_store_sellers(date) to ingest_writer;

comment on function price.assign_store_sellers(date) is '점포 → 판매처 자동 연결: 연결이 없는 점포를 이름(''(주)''·공백 뺀 것)이 판매처 이름으로 시작하고 업태가 같은 판매처에 잇는다 (가장 긴 이름 우선, 유효 시작 p_since). 새로 이은 점포 수와 남은 미연결 점포 수를 돌려준다. ingest_writer만 실행 (ingest-foundation/07)';

comment on table price.store_seller is '점포 → 판매처 매핑 (기간별). 수집이 price.assign_store_sellers()로 자동으로 잇고, 운영자는 기간을 닫거나 바꿀 수 있다. 같은 점포의 기간이 겹치면 거부한다. 집계는 조사일이 속한 기간의 판매처로 센다 (3-2)';
