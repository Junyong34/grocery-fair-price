# Supabase Free 일시정지 기준

조사일: 2026-10-26. 티켓: `.scratch/ingest-schedule/issues/04-supabase-free-pause.md`. pipeline.md 6장 "무엇을 활동으로 치는지 확인해야 한다"의 답이다.

출처 등급: **[공식]** supabase.com 문서·가격 페이지·KB, Supabase GitHub의 Maintainer 글. **[커뮤니티]** Collaborator 배지(직원 아님)·일반 사용자 글. 커뮤니티 글은 근거가 아니라 정황으로만 쓴다.

## 짧은 답

1. **기준은 "사용자 DB 활동"이고, 문턱값은 공개돼 있지 않다.** 공식 문서는 "지난 1주 동안 충분한 사용자 데이터베이스 활동(user database activity)이 없으면 비활성"이라고만 하고, "대개 지난 1주 동안 하루 몇 번의 사용자 DB 요청이면 충분하다"고 적는다. 무엇이 "사용자" 요청인지, 어느 경로(Data API·Supavisor·직접 접속·Storage)를 세는지는 문서에 없다.
2. **매일 `ingest_writer`가 Supavisor 5432로 붙어 실제로 쓰는 것은 막아 줄 가능성이 높지만 확인된 사실은 아니다.** 근거: 문서가 게이트웨이(API)가 아니라 "DB 활동"·"user queries"를 기준으로 적는다. 외부 작업이 매일 DB에 직접 트랜잭션을 날려 2024-03 이후 한 번도 일시정지되지 않았다는 사용자 보고가 있다 [커뮤니티]. 반대 정황: Collaborator(직원 아님)가 "풀러 연결은 안 세는 것 같다, REST나 대시보드여야 한다"고 추측한 글이 있다 [커뮤니티, 추측]. 어느 쪽도 Supabase 직원의 답이 아니다.
3. **Storage 업로드가 활동으로 잡히는지는 모른다.** 공식 문서에 언급이 없다. Auth·Storage 헬스체크는 안 센다는 제3자 글이 있지만 업로드(내부적으로 `storage.objects`에 행을 쓴다)를 시험한 글은 찾지 못했다.
4. **일시정지 전에 메일이 온다.** 프로젝트 소유자에게 일시정지 약 1주 전 경고 1통, 일시정지 후 확인 1통 [공식]. 경고를 받은 뒤 대시보드에서 프로젝트를 열거나 API 요청을 보내면 막을 수 있다 [공식].
5. **일시정지되면** 모든 요청이 막힌다(HTTP 540, 커뮤니티 보고로는 DNS 자체가 안 풀림). 데이터는 일시정지 과정에서 백업되고, 대시보드 **Resume project** 한 번으로 데이터·설정이 그대로 돌아온다 [공식]. 복구 창은 현재 문서 기준 **1년**(2024-06 공지는 90일, 문서 안에도 90일 흔적이 남아 있다). 창이 지나면 원클릭 복구 대신 백업 파일과 Storage 객체를 내려받아 새 프로젝트에 직접 복원해야 한다 [공식].

결론: 매일 수집이 도는 한 일시정지될 가능성은 낮다고 보지만, **기준이 비공개이고 Data API를 쓰지 않는 구성이라 "확실히 막는다"고 말할 수 없다.** 그래서 막는 장치보다 **빨리 아는 장치**(경고 메일 받기, 수집 실패를 일시정지로 분류, heartbeat에서 상태 확인)를 둔다. 아래 "heartbeat(14)·알림(13)에 더할 것".

## 근거

### 1. 일시정지 조건 [공식]

[Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing) (2026-10-26 확인, `.md` 원문으로 읽음):

> Supabase pauses Free Plan projects that show low activity over a 7-day period to save server resources.

> A Free plan project is considered inactive if it does not receive sufficient user database activity over the past week. Projects with too few user queries during that window are the clearest candidates for pausing. While you may be actively using the project, it's possible that usage is not enough to exclude it from automatic pausing. Typically a few user requests to the database each day over the previous week is enough to keep the project from being paused.

[가격 페이지](https://supabase.com/pricing) (2026-10-26 확인):

> Free projects are paused after 1 week of inactivity. Limit of 2 active projects.

> Projects on paid plans aren't paused for inactivity.

[Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod):

> We may pause applications on the Free Plan that exhibit low activity in a 7-day period to save on server resources.

읽은 것:
- 기준은 "1주에 무언가 하나라도 있으면 된다"가 아니라 **1주 동안의 양**이다("sufficient", "a few … each day"). 실제로 5일에 1번 읽기, 주 2회 익명 읽기로는 일시정지됐다는 2026-09~10 보고가 여럿 있다 (아래 4절).
- "user database activity"가 무엇을 세는지(롤, 연결 경로, 읽기/쓰기)는 공식 문서·가격 페이지·KB 어디에도 없다.
- 가격 페이지의 "Limit of 2 active projects": 무료 프로젝트 2개가 이미 켜져 있으면 일시정지된 프로젝트를 되살릴 수 없다 ([Billing](https://supabase.com/docs/guides/platform/billing-on-supabase): "Paused projects do not count towards your free project limit.").

### 2. 경고 메일과 막는 방법 [공식]

[Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing):

> Supabase sends two emails to the project owner regarding project pausing:
> 1. A warning email roughly one week before the pause takes effect.
> 2. A confirmation email once the project has been paused.

> After receiving an initial email warning, the pause can be prevented by taking one of the following steps:
> - Visit the project from the Supabase Dashboard to generate activity.
> - Generate a sufficient amount of activity by making API calls to your project or sending requests via your connected application.

- 받는 사람은 "project owner"다. 조직 소유자 계정의 메일이다. 그 메일함을 실제로 보는지가 이 장치의 전부다.
- "roughly one week before"라는 문장과 "1주 비활성이면 일시정지"를 함께 읽으면, 활동이 줄어든 걸 감지한 시점에 경고하고 그 뒤 1주 더 지켜보는 흐름으로 보인다 (추정. 정확한 시간표는 문서에 없다).

### 3. 일시정지 중과 복구 [공식]

요청: [HTTP status codes KB](https://supabase.com/kb/troubleshooting/http-status-codes):

> #### 540 project paused
> The project the request was being made against has been paused. The project cannot process requests until it is un-paused by the owner.
> Free Plan projects may be paused due to inactivity, on request by the owner, or in rare instances, due to abuse.

- 커뮤니티 보고로는 일시정지된 프로젝트에 curl을 보내면 `curl: (6) Could not resolve host`(DNS 없음)가 났다 ([ibe-osu/ibe#77](https://github.com/ibe-osu/ibe/issues/77), [dev.to 글](https://dev.to/muhammad_hamza_0e80c384ca/my-supabase-keepalive-was-working-the-project-paused-anyway-6m0), 둘 다 2026-10). 그러니 540과 DNS 실패 **둘 다** 일시정지 신호로 다뤄야 한다. Supavisor(5432)로 붙을 때 어떤 오류가 나는지는 찾지 못했다.
- 우리 구성에서 뜻하는 것: 일시정지 중에는 `ingest_writer` 적재, Storage 원본 업로드, Vercel의 `web_reader` 읽기가 **모두** 실패한다. 원본 파일도 Storage에 못 올라가므로 그날 원본은 따로 남기지 않으면 없다.

데이터: [Discussion #27497](https://github.com/orgs/supabase/discussions/27497) (2024-06-24 공지 스레드). Maintainer darora:

> A backup is taken as part of the pause process. … There is no risk of data loss.

복구: [Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing):

> You can restore a paused project for up to 1 year after it was paused:
> 1. Open the Supabase Dashboard
> 2. Select the organization, followed by the paused project
> 3. Click **Resume project** and confirm
>
> The project will return to its previous state, including data and configurations.

[Upgrading](https://supabase.com/docs/guides/platform/upgrading) (2026-10-26 확인):

> Free projects will move to the latest minor version when their paused project is restored.

> When a project is paused, users have a 1-year window to restore the project on the platform from within Supabase Studio.

> After the restore window, you can download your project's backup file, and Storage objects from the project dashboard.

> If you upgrade to a paid plan while your project is paused, any expired one-click restore options are reenabled. Since the backup was taken outside the backwards compatibility window, it may fail to restore.

**90일과 1년이 섞여 있다.**
- [Changelog 2024-06-24 "Paused Free Plan projects are restorable for 90 days"](https://supabase.com/changelog/27497-paused-free-plan-projects-are-restorable-for-90-days) (Maintainer olirice): "paused Free projects are restorable for 90 days following their pause date". 창이 지나면 "the latest logical backup, taken right before the project is paused, and all Storage objects"를 내려받는 버튼으로 바뀐다.
- 지금 문서 본문은 1년이다. 하지만 같은 문서의 앵커가 `#90-day-window-to-restore`이고 Upgrading 문서의 그림 설명이 "Project Paused: 90 Days Remaining"이다. 1년으로 늘린 changelog 글은 찾지 못했다.
- 우리 쪽 판단: **90일을 마감으로 본다.** 어차피 일시정지는 수집이 멈췄다는 뜻이라 며칠 안에 되살려야 한다.

복구로 돌아오지 않는 것 (참고): 백업은 DB 논리 백업이다. Ringflash(2026-10-07, 직원 아님)는 파일 복원 시 Edge Functions·Auth 설정·API 키·Realtime 설정·업로드 파일이 빠진다고 썼다 [커뮤니티]. 이것은 **창이 지난 뒤 파일로 새 프로젝트에 복원할 때** 이야기다. 창 안에서 Resume을 누르면 "data and configurations"가 돌아온다 [공식].

### 4. 무엇이 활동으로 잡히나: 커뮤니티 정황

공식 답이 없어서 모은 정황이다. 모두 직원 답이 아니다.

| 출처 | 경로 | 결과 |
|---|---|---|
| [Discussion #13121](https://github.com/orgs/supabase/discussions/13121) 작성자 ricemountainer (2023-03, 2025-06 후기) | 외부(Heroku) 작업이 DB에 직접 접속 | 접속만 하는 작업으로는 일시정지됐다. "at least one transaction per day can avoid deactivation, but just establishing a connection is not sufficient", "never been deactivated since March 2024" |
| 같은 스레드, GaryAustin1 (Collaborator, 직원 아님, 2023-03) | — | "It can't just be something running in the database as there are all kinds of Postgres things running" (DB 안 작업, 예: pg_cron은 안 셀 것이라는 추측) |
| [Discussion #35015](https://github.com/orgs/supabase/discussions/35015), GaryAustin1 (2025-04) | Session Pooler만 쓰는 사용자 | "If you are only using the DB connection directly then you would need to do some REST activity every 7 days." "I'm assuming Supabase is saying that does not count … It has to be REST activity or dashboard access." 스스로 "I'm not an employee"라고 밝힌 추측 |
| [carlosz44/web#64](https://github.com/carlosz44/web/pull/64) (2026-10-14) | 매일 두 번의 PostgREST 읽기 | 매주 일시정지 경고 메일이 계속 왔다. Drizzle(Postgres 직접 접속)로 한 행을 upsert하는 쓰기로 바꿈. 바꾼 뒤 결과는 기록 없음 |
| [ibe-osu/ibe#77](https://github.com/ibe-osu/ibe/issues/77) (2026-10-23) | 주 2회, RLS가 `[]`를 돌려주는 익명 REST 읽기 | 두 프로젝트 모두 일시정지 |
| [dev.to 글](https://dev.to/muhammad_hamza_0e80c384ca/my-supabase-keepalive-was-working-the-project-paused-anyway-6m0) (2026-10-24) | 5일에 1번 REST 읽기 | 마지막 성공 약 1주 뒤 일시정지 |
| [Discussion #27497](https://github.com/orgs/supabase/discussions/27497), [travisvn/supabase-pause-prevention#1](https://github.com/travisvn/supabase-pause-prevention/discussions/1) | — | 활동 정의에 대한 직원 답 없음. 관리자도 "모른다" |

정리:
- 빈도가 낮은 읽기(주 1~2회)는 부족했다는 보고가 일관된다. "하루 몇 번"이라는 공식 문구와 맞는다.
- "접속만"은 부족, "외부에서 매일 실제 트랜잭션"은 충분했다는 보고가 있다. 우리 수집은 후자(매일 수천 행 upsert)에 가깝다.
- Supavisor/직접 접속이 안 센다는 말은 직원 아닌 사람의 추측 하나뿐이다. 반대로 직접 접속 쓰기로 버틴 보고가 있다. 그래도 확정할 근거는 없다.
- 이 프로젝트의 `ingest_writer`는 사용자가 만든 롤이고 실제 DML을 한다. "user queries"를 롤로 거른다면 시스템 롤(`supabase_admin` 등)을 빼는 것으로 보이며 `ingest_writer`는 사용자 쪽일 것이다 (추정).

### 5. 상태를 기계로 확인하는 방법 [공식]

[Management API 스펙](https://api.supabase.com/api/v1-json) (2026-10-26 받아 읽음):
- `GET /v1/projects/{ref}` (`projects:read`): `status`가 `INACTIVE`, `ACTIVE_HEALTHY`, `PAUSING`, `RESTORING`, `RESTORE_FAILED`, `PAUSE_FAILED` 등. 일시정지는 `INACTIVE`로 보인다 (값 이름으로 한 추정, 실측 안 함).
- `POST /v1/projects/{ref}/restore` (`projects:write`): 일시정지 프로젝트를 되살린다.
- 둘 다 Personal Access Token(또는 OAuth)이 필요하다. PAT는 계정의 모든 프로젝트·조직을 다룰 수 있는 강한 키다. **공개 저장소의 Actions Secret에 넣는 것은 권하지 않는다** (아래 권고 참고).

## heartbeat(14)·알림(13)에 더할 것

우선순위 순. 새 비밀값이 필요 없는 것부터.

1. **경고 메일을 받을 사람을 정한다 (사람, 0원).** Supabase 조직 소유자 계정 메일이 실제로 읽히는 메일함인지 확인하고, "Supabase … paused" 류 제목을 놓치지 않게 필터·알림을 건다. 경고가 일시정지 약 1주 전에 오므로 이것만 지켜도 대부분 막힌다. 15(closeout) 또는 사람 체크리스트에 넣는다.
2. **수집 실패를 "일시정지"로 분류한다 (13).** 07의 CLI가 DB 접속 또는 Storage 호출에서 다음을 보면 `error_code`를 `supabase_paused`(이름은 07에서 정함)로 남기고, 13은 이것을 키 오류처럼 **즉시 알림**으로 다룬다:
   - Storage/HTTP 응답 상태 540
   - Supabase 호스트 DNS 실패(`ENOTFOUND`/`EAI_AGAIN`), Supavisor 접속 거부
   - 이슈 본문에는 "대시보드 → 조직 → 프로젝트 → Resume project" 복구 순서와, 되살린 뒤 08(빈 날 채우기)을 돌리라는 안내를 넣는다. 접속 주소·키는 넣지 않는다.
   - 주의: DNS 실패는 러너 네트워크 문제와 구분이 어렵다. 2회 연속이면 확정으로 본다.
3. **heartbeat가 Supabase 상태를 본다 (14).** 주 1회로는 7일 창에 늦다. 그래서 heartbeat는 막는 게 아니라 **확인**만 한다: 이미 가진 `SUPABASE_URL` + `SUPABASE_SECRET_KEY`로 Storage에 가벼운 요청(예: `raw` 버킷 조회) 1회 → 540이나 DNS 실패면 2의 알림을 연다. 동시에 `ingest_writer`로 `select max(...)` 1회를 해서 출처별 마지막 `ok`(이미 14의 할 일)를 읽으면 그것이 DB 쪽 확인이 된다.
4. **활동을 "하루 몇 번"으로 맞춘다 (11·12, 비용 0).** 수집은 KAMIS·축평원 매일, KAMIS 주간 월요일이 있으므로 매일 최소 2~3개 세션이 DB에 실제 쓰기를 한다. 공식 문구("a few user requests to the database each day")에 맞는다. 따로 keep-alive를 추가하지 않는다. 다만 KAMIS·축평원 두 워크플로가 같이 꺼지면(GitHub 60일 규칙) 그 순간부터 7일 시계가 돈다. 이 경우는 14의 "꺼진 워크플로 다시 켜기"가 이미 막는다.
5. **추가 보험은 넣지 않는 것을 권한다.** Data API keep-alive(REST로 읽기 1회)는 `price` 스키마를 노출하지 않는 이 구성에서는 별도 공개 테이블·RPC가 필요하고, 그래도 읽기 핑이 부족했다는 2026-10 보고가 여럿이다. Management API PAT는 공개 저장소에 두기엔 권한이 너무 크다. 1~3으로 "일시정지되면 하루 안에 안다"를 확보하고, 실제로 경고 메일이 한 번이라도 오면 그때 활동을 늘린다 (예: 수집 워크플로마다 `ingest_writer`로 `source_day` 갱신을 한 번 더). 점수: 1~3 조합 8/10, PostgREST keep-alive 추가 3/10, PAT 기반 자동 복구 2/10.
6. **원본 손실 대비 (선택, 13 또는 07).** 일시정지 중에는 Storage도 막혀 그날 받은 원본이 사라진다. 적재·업로드가 실패하면 원본 gzip을 Actions 아티팩트(보존 며칠)로 남기면 08 없이 다시 넣을 수 있다. KAMIS·축평원은 API로 다시 받을 수 있으니 필수는 아니고, 참가격은 API 기간 보장이 없어서(지도 Notes) 가치가 있다.

pipeline.md 6장 표의 "주의" 칸은 이 문서가 확정되면 다음처럼 바꿀 수 있다: "1주 동안 '사용자 DB 활동'이 충분하지 않으면 일시정지된다(기준 비공개, '하루 몇 번의 DB 요청이면 대개 충분'). 매일 수집이 `ingest_writer`로 쓰는 것으로 막을 것으로 보되 확인되지 않았다. 약 1주 전 경고 메일이 소유자에게 온다. 일시정지 중 요청은 540/DNS 실패. 대시보드 Resume으로 데이터째 복구, 문서상 1년(옛 공지 90일)."

## 모르는 것

- **Supavisor(5432) 세션 모드로 들어온 `ingest_writer` 쿼리가 "user database activity"로 세지는지.** 공식 문서에 없고 직원 답도 없다. 커뮤니티 정황은 "센다" 쪽이 조금 더 많지만 확인되지 않았다. 확인하려면 운영에서 실제로 몇 주 돌려 경고 메일이 안 오는지 보는 수밖에 없다.
- **Storage API 업로드가 활동인지.** 공식 문서·직원 답·실험 보고 모두 찾지 못했다.
- **"충분한" 양의 문턱값.** 공개되지 않았다. "하루 몇 번"이 전부다.
- **경고 메일의 정확한 시점과 조건.** "roughly one week before"만 있다.
- **복구 창이 1년인지 90일인지.** 현재 본문은 1년, 2024 공지·앵커·그림은 90일. 1년으로 바꾼 공지를 못 찾았다.
- **일시정지 중 Supavisor 접속 시 오류 모양.** HTTP는 540, 커뮤니티 보고는 DNS 실패. Postgres 접속 오류 문자열은 모른다. 03 실측 때 같이 볼 수 없으니(일부러 일시정지시켜야 함), 무료 두 번째 프로젝트로 시험하거나 실제 상황에서 기록한다.
- **Management API의 `INACTIVE`가 자동 일시정지 상태와 같은지.** 값 이름으로 한 추정이다.

## 확인한 페이지 (2026-10-26)

- https://supabase.com/docs/guides/platform/free-project-pausing
- https://supabase.com/docs/guides/platform/upgrading
- https://supabase.com/pricing
- https://supabase.com/docs/guides/deployment/going-into-prod
- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://supabase.com/kb/troubleshooting/http-status-codes
- https://supabase.com/changelog/27497-paused-free-plan-projects-are-restorable-for-90-days
- https://api.supabase.com/api/v1-json
- https://github.com/orgs/supabase/discussions/27497
- https://github.com/orgs/supabase/discussions/13121
- https://github.com/orgs/supabase/discussions/35015
- https://github.com/orgs/supabase/discussions/41710
- https://github.com/carlosz44/web/pull/64
- https://github.com/ibe-osu/ibe/issues/77
- https://dev.to/muhammad_hamza_0e80c384ca/my-supabase-keepalive-was-working-the-project-paused-anyway-6m0

조사 방법: wigolo MCP가 이 세션에 없어 WebSearch/WebFetch와 `curl`(supabase.com 문서의 `.md` 원문)을 썼다. 공식 문구는 `.md` 원문에서 그대로 옮겼다.
