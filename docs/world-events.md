# 첫 발견: 보랏빛 돌

그록 계정으로 모험에 들어가 시작 구역 (0, 0)의 중앙 출발점에서 오른쪽 한 칸 이동합니다. 돌의 네 방향 인접 칸에서 ‘조사하기’ 또는 E/Enter로 엽니다. 모바일은 조사 버튼을 사용합니다. 녹스의 기존 32프레임 스프라이트와 대화창을 지도 위에 표시하며, 이벤트·기록창에서는 이동을 멈춥니다. 다른 진영의 맵은 유지하고 이 이벤트는 그록만 진행합니다.

## 무료 안내와 유료 질문

조사·고정 안내·기록 열람·종료는 제공자 API를 호출하지 않습니다. 선택지 클릭 또는 질문 전송에만 해당 계정의 저장된 xAI 키를 서버에서 복호화해 사용합니다. 키 등록 후 ‘키 상태 새로고침’을 누릅니다. 키 저장은 유효성 확인을 겸하지 않으며 실제 질문에서 연결 오류를 안내합니다.

현재 공식 Responses API 모델 grok-4.7, reasoning low, 최대 출력 1200토큰을 사용합니다. 요청마다 사용자 API 비용이 발생하며 실패·중단에도 제공자가 이미 처리한 사용료가 발생할 수 있습니다. 질문·이 이벤트의 이전 대화·고정 세계 설정이 xAI로 전송됩니다. 키·계정 이메일·다른 이용자 대화는 프롬프트에 넣지 않습니다. store:false를 보내며 이는 제공자의 모든 보관 정책을 없앤다는 의미가 아닙니다.

성공한 질문은 이벤트당 8회, 한 번에 1개, 요청 간 최소 5초입니다. 클라이언트는 자동 재전송하지 않습니다. 서버의 65초 임대와 낙관적 turn 검사로 동시 질문을 제한합니다. 마지막 성공 요청 ID 재전송은 저장된 답변을 반환합니다. 모든 과거 요청에 대한 영구적 멱등성을 보장하지 않습니다. 제공자 응답 제한은 45초이며 오류 원문·키를 사용자에게 노출하거나 로그에 기록하지 않습니다.

## 세계 규칙과 저장

AI는 reply/emotion만 작성하고 지도·경제·아이템 상태 변경 도구는 받지 않습니다. 돌의 위치와 세 가지 관찰 사실은 코드로 고정합니다. 관찰 사실은 대화창에서도 확인 가능합니다. 명백한 보상·파괴·사망·금액 주장, URL·스크립트 등은 검증 후 고정 대사로 대체하며, 추가 유료 생성은 하지 않습니다. 문자열 검증은 모든 의미적 환각을 탐지하지 못하므로 AI 대사를 세계의 공식 사실로 적용하지 않습니다.

GET/POST /api/world/events/nox-stone은 Better Auth 세션과 서버의 확정 진영을 사용합니다. POST는 기존 Worker의 동일 Origin/JSON 검사를 거칩니다. 인접 좌표 및 시작 구역 생성 여부도 확인합니다. **이동 위치는 아직 클라이언트가 보고하므로 서버 권위의 위치 검증이나 부정행위 방지가 아닙니다.** 이 이벤트는 재화·아이템·경험치를 지급하지 않습니다.

0007_world_events.sql의 world_event_progress에 계정별 발견·조사 완료 시각, 성공 질문 수, 최대 16개 대화 메시지와 임대 상태를 저장합니다. 첫 이벤트 API 요청에서 같은 IF NOT EXISTS DDL을 자동 적용하므로 추가 환경변수나 수동 SQL은 필요 없습니다. 탐험 위치 저장 방식과 기존 지형 배열은 바꾸지 않습니다.

## 검증

실행기의 실제 이벤트 핸들러에 DB·제공자 모형을 주입한 15개 검사: 로그인/진영/인접 조건, 무료 조사·완료, 키 없음, 제공자 요청 고정·키 비노출·위조 history 무시, 최근 요청 재사용, 속도 제한, 대체 대사, 오류 후 임대 해제, 8회 제한, 계정 격리가 통과했습니다. 실제 UI 모듈에 DOM·전송 모형을 주입해 인접 조사 표시, 무료 열기와 일시정지, 명시적 질문, 저장 후 재개를 확인했습니다. 신규 모듈 문법을 검사했습니다.

tests/world-events.test.js에는 실제 Node SQLite를 사용하는 영속성·동시성·제공자 모형 통합 테스트를 추가했습니다. 현재 로컬 실행 환경과 브라우저 도구가 없어 이 통합 테스트, 실제 PC/모바일 화면, 실제 유료 API 호출 및 Cloudflare 배포는 확인하지 못했습니다. 테스트에는 실제 API 키를 사용하지 않습니다.

공식 API 문서:
- https://docs.x.ai/developers/grok-4-7
- https://docs.x.ai/developers/model-capabilities/text/structured-outputs

## 502 진단 구분

이전 PROVIDER_ERROR 응답은 통신 예외·JSON 해석 실패·완료되지 않은 응답·빈 대사를 구분하지 못했습니다. 이 메시지만으로 과거 요청의 실제 원인을 소급 확정할 수 없습니다.

이제 대화창 오류 문구에 구체적인 code를 표시하고 응답 JSON에 diagnosticId를 제공합니다. Worker 로그에는 event/diagnosticId/code/stage/upstreamStatus/model만 기록합니다. 질문, 대화, API 키, 제공자 오류 원문, 사용자 ID는 기록하지 않습니다.

- PROVIDER_NETWORK / PROVIDER_READ_FAILED: 연결 또는 응답 읽기 실패
- PROVIDER_TIMEOUT: 504, 대기 중단
- PROVIDER_INVALID_JSON / PROVIDER_RESPONSE_FORMAT: 응답 형식 문제
- PROVIDER_OUTPUT_LIMIT / PROVIDER_INCOMPLETE: 잘린 응답 또는 생성 미완료
- PROVIDER_EMPTY_BODY / PROVIDER_EMPTY_OUTPUT: 본문 또는 표시할 대사 없음
- PROVIDER_RESPONSE_TOO_LARGE: 256 KiB 응답 크기 제한
- PROVIDER_REQUEST_REJECTED / PROVIDER_MODEL_UNAVAILABLE / PROVIDER_HTTP_ERROR: 제공자 HTTP 400·422 / 404 / 기타 오류
- EVENT_SAVE_FAILED: 응답 이후 기록 저장 실패, 503

잘린 응답을 성공으로 처리하거나 자동으로 유료 재요청하지 않습니다. 모델·출력 한도·비용 설정은 그대로 유지합니다. 임대 해제 실패가 원래 진단 응답을 덮어쓰지 않도록 하며, 임대는 기존 만료 시각으로 해제됩니다.

검증: 파서 모형 9건, 실제 핸들러에 DB·제공자 모형을 주입한 26건(진단 시나리오 11건 포함)이 통과했습니다. 키·질문·오류 원문 비노출, 실패 시 성공 횟수 미증가, 임대 해제, 자동 재시도 없음도 확인했습니다. Node/SQLite 통합 테스트는 추가했으나 실행 환경 부재로 실행하지 못했습니다. 실제 xAI 호출 및 배포는 미검증입니다.

## Workers redirect 호환성 수정

PROVIDER_NETWORK의 코드상 확정 원인 하나를 찾았습니다. 기존 redirect:'error'는 workerd의 Request 파서에서 거부됩니다. fetch의 실제 네트워크 요청 이전에 TypeError가 발생해 연결 실패로 보였습니다. Cloudflare 공식 엔진 소스 src/workerd/api/http.c++의 Request::tryParseRedirect 및 Request 초기화부에서 follow/manual만 허용함을 확인했습니다.

redirect:'manual'로 바꾸고 모든 3xx를 PROVIDER_REDIRECT_BLOCKED로 반환합니다. Location을 따라가지 않고 API 키를 다른 호스트에 전달하지 않습니다. 모델·키·비용·재시도 정책은 유지합니다.

공식 소스: https://github.com/cloudflare/workerd/blob/main/src/workerd/api/http.c%2B%2B

회귀 테스트에는 Workers와 같은 옵션 허용 조건을 가진 fetch 모형으로 정상 응답 저장, 301/302/303/307/308 차단 및 단일 요청을 추가했습니다. 실제 Workers·유료 xAI API 재검증은 배포 후 필요합니다.
