-- ① 수집 기반: 확장·스키마·롤 (pipeline.md 3-0 "스키마와 노출", "역할")
-- 표는 Data API로 노출하지 않는 스키마 price에 두고, 앱은 ingest_writer·web_reader 롤로만 접속한다.

-- 기간 겹침 exclusion 제약용. 버전은 적지 않는다 (Supabase는 확장 버전 지정을 무시한다).
create extension if not exists btree_gist with schema extensions;

create schema price;   -- 소유자 postgres (마이그레이션)

-- Data API 롤과 PUBLIC은 price를 쓸 일이 없다. Supabase 기본값에 기대지 않고 직접 걷는다.
revoke all on schema price from public, anon, authenticated;
alter default privileges for role postgres in schema price
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema price
  revoke all on sequences from public, anon, authenticated;
-- 함수는 위 방식으로 막지 못한다 (전역 PUBLIC EXECUTE). price에 함수를 만드는 마이그레이션은
-- 같은 파일에서 revoke execute … from public, anon, authenticated 후 필요한 롤에만 grant한다 (3-0 "기본 권한의 한계").

-- 앱 롤. 비밀번호는 넣지 않는다 (사람이 ingest-foundation/01에서 alter role … password로 정한다).
-- 롤은 클러스터 전역이라 로컬 db reset 뒤에도 남는다. 없을 때만 만든다.
-- superuser·bypassrls 속성은 superuser만 바꿀 수 있어 alter에 적지 않는다 (create의 기본값이 no다).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'ingest_writer') then
    create role ingest_writer login nosuperuser nocreatedb nocreaterole noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'web_reader') then
    create role web_reader login nosuperuser nocreatedb nocreaterole noinherit;
  end if;
end
$$;

alter role ingest_writer with login nocreatedb nocreaterole noinherit;
alter role web_reader    with login nocreatedb nocreaterole noinherit;

-- 수집·재계산·백필. 백필 묶음 하나(최대 약 9만 행)가 한 트랜잭션이라 문장 시간은 넉넉히 둔다.
alter role ingest_writer set statement_timeout = '10min';
alter role ingest_writer set idle_in_transaction_session_timeout = '2min';

-- 웹앱 서버 컴포넌트. 읽기만 하고 짧게 끝낸다.
alter role web_reader set default_transaction_read_only = on;
alter role web_reader set statement_timeout = '5s';
alter role web_reader set idle_in_transaction_session_timeout = '30s';

grant usage on schema price to ingest_writer, web_reader;

-- 적재·백필의 세션 임시 표(create temp table … on commit drop)를 만든다.
-- 기본값으로 PUBLIC에 있지만 걷혀 있어도 되게 직접 준다.
do $$
begin
  execute format('grant temporary on database %I to ingest_writer', current_database());
end
$$;
