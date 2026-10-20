# GGGC WORLD

로그인 후 ‘내 계정’에서 프로필과 제공자별 API 키를 관리할 수 있습니다. 키는 서버에서 암호화해 보관하며 실제 AI 호출은 아직 연결하지 않았습니다. [프로필·BYOK 안내](docs/profile-settings.md)를 참고하세요.

홈 지도는 미리보기로 유지하고, 오른쪽 아래 수호신 메뉴에서 새 탭의 전체 화면 게임으로 진입합니다. 타이틀과 바람 항구의 첫 만남까지 구현했으며 BYOK·AI 스토리 생성은 이후 연결할 예정입니다. [지도·모험 안내](docs/map-exploration.md)를 참고하세요.

게시글·댓글·추천을 D1에 저장하는 실제 게시판과 별도 글쓰기/상세 페이지를 연결했습니다. 기존 운영 DB에는 `migrations/0003_community.sql`을 한 번 적용해야 합니다. 자세한 내용은 [게시판 연결 안내](docs/community-setup.md)를 참고하세요.

GPT · Gemini · Grok · Claude 네 진영이 모이는 커뮤니티입니다.

## 현재 상태

아카라이브처럼 글 목록을 중심으로 구성한 **커뮤니티 프로토타입**입니다. Google 로그인과 계정 프로필 API를 추가했습니다. 실제 사용에는 Google OAuth와 D1 설정이 필요하며, 공유 게시판은 연결했고, 게임 기능은 아직 연결되지 않았습니다.

- 전체 광장과 진영별 글 목록
- 카테고리, 인기글, 검색, 페이지 이동
- 글 상세, 추천, 저장한 글
- 로그인 계정의 닉네임과 진영 확정
- 공유 글쓰기·댓글·추천과 본인 글 수정·삭제
- PC·태블릿·모바일 반응형 CSS
- 네 진영 도트 월드맵 미리보기와 별도 탭 모험: 타이틀·수호신 첫 만남, 낮·밤 전환, 동작 정지
- 네 지휘관의 32프레임 대기 애니메이션과 `/sprite-lab.html` 프레임 검사 페이지
- 선택 진영과 연동되는 오른쪽 아래 지휘관 메뉴

게시글·댓글·추천은 Cloudflare D1에 저장됩니다. 로그인 계정의 닉네임과 진영은 D1에 저장됩니다. 글 목록과 통계는 실제 게시판 데이터에서 계산합니다. 게스트 진영 선택은 체험용입니다. 로그인 후 최초 진영을 확정하면 서버와 DB에서 변경을 차단합니다.

## 확정된 개발 방향

- Cloudflare Workers: 사이트와 서버 API
- Cloudflare D1: 회원, 진영, 게시글, 댓글, 피로도, 가방
- Cloudflare R2: 사용자 이미지, 캐릭터, 맵 파일
- Better Auth: 구글 로그인과 세션
- 실제 가입 마지막 단계에서 진영을 확정하고 서버에서 일반 변경을 차단
- 커뮤니티 오른쪽 아래에 해당 진영의 도트 지휘관 배치
- 지휘관 메뉴: 모험 / 가방
- 모험 진입 시 짧은 포털 연출

## Cloudflare 최초 배포: Workers 기준

D1·R2·Google OAuth 설정 없이 화면을 먼저 배포할 수 있습니다. 로그인 활성화는 [설정 안내](docs/login-setup.md)에 따라 D1 연결, 마이그레이션, Google OAuth 환경변수 등록 후 진행합니다.

1. Cloudflare 대시보드에 로그인합니다.
2. Workers & Pages에서 새 Worker를 만들고 Git 저장소 가져오기를 선택합니다. 화면 언어나 개편에 따라 버튼 이름은 다를 수 있습니다.
3. GitHub 권한 선택 화면에서 `lim524/gggcworld` 저장소 접근을 허용합니다.
4. 저장소 `gggcworld`, 브랜치 `main`을 선택합니다.
5. 루트 디렉터리는 저장소 루트로 둡니다.
6. 빌드 명령은 `npm run build`로 설정합니다. 이 단계는 JS 문법을 검사합니다.
7. 배포 명령은 `npm run deploy`로 설정합니다. `npx wrangler deploy`도 같습니다.
8. Worker 이름은 `gggcworld`로 맞춥니다. 다른 이름을 쓰면 wrangler.jsonc의 name도 같이 맞춰야 합니다.
9. 저장하고 배포합니다. 성공 후 표시되는 workers.dev 주소를 엽니다.

Cloudflare Git 연동이 일반 배포 권한을 자동 제공하는 경우 API 토큰을 코드에 넣을 필요가 없습니다. 시크릿·API 키는 GitHub에 올리지 마세요.

화면이 실제로 배포됐다는 뜻은 아닙니다. Cloudflare에서 배포 성공과 사이트 주소를 확인해야 합니다.

공식 문서:
- https://developers.cloudflare.com/workers/static-assets/get-started/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/

## 로컬 실행

Node.js 지원 버전을 설치한 환경에서:

```
npm install
npm run check
npm run dev
```

CLI에서 직접 배포하려면:

```
npx wrangler login
npm run deploy
```

## 구조

```
public/index.html  커뮤니티 화면
public/style.css   반응형 스타일
public/community-app.js      공유 게시판 목록과 공통 UI
public/assets/    제공된 캐릭터에서 추출한 WebP
wrangler.jsonc    Cloudflare Worker와 정적 자산 배포 설정
```

## 월드 애니메이션

아스트라·세린·루미·녹스 모두 투명 배경의 32프레임 시트를 재생합니다. `/sprite-lab.html`에서 지휘관을 선택해 프레임을 비교할 수 있습니다. 월드 캐릭터 선택은 대사를 미리 보는 동작이며, 사용자 진영을 바꾸지는 않습니다. 자세한 구현과 제한은 `docs/world-scene.md`, `docs/astra-animation.md`를 참고하세요.

## 검증과 제한

시안의 JS 문법과 진영 필터·검색·인기 정렬·페이지 이동·글 저장·댓글 저장·HTML 이스케이프 로직을 검사했습니다. 이번 월드 작업은 브라우저에서 PC와 390px 프레임 레이아웃, 캐릭터 대사 전환, 낮·밤 전환, 동작 정지, 게시판 연결, 지휘관 진영 변경을 확인했습니다. 모바일 실기기 검증과 Cloudflare 운영 배포 확인은 별도입니다.

Better Auth와 D1 로그인 API, 마이그레이션, 계정별 프로필·진영 확정과 세션 검증 테스트를 추가했습니다. 운영 Google 계정 로그인은 사용자 소유 OAuth 설정과 D1 연결 후 검증해야 합니다. R2는 아직 연결되지 않았습니다.

