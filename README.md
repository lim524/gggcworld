# GGGC WORLD

GPT · Gemini · Grok · Claude 네 진영이 모이는 커뮤니티입니다.

## 현재 상태

아카라이브처럼 글 목록을 중심으로 구성한 **커뮤니티 프로토타입**입니다. 가입·공유 DB·게임 기능은 아직 구현되지 않았습니다.

- 전체 광장과 진영별 글 목록
- 카테고리, 인기글, 검색, 페이지 이동
- 글 상세, 추천, 저장한 글
- 닉네임과 진영 선택 체험
- 글쓰기와 댓글 작성
- PC·태블릿·모바일 반응형 CSS
- 네 진영 도트 월드맵: 캐릭터 대사, 진영 게시판 이동, 낮·밤 전환, 동작 정지
- 아스트라 4프레임 대기 애니메이션과 `/sprite-lab.html` 프레임 검사 페이지
- 선택 진영과 연동되는 오른쪽 아래 지휘관 메뉴

게시글·댓글·추천·프로필은 현재 각 브라우저의 localStorage에만 저장됩니다. 기본 게시글과 통계는 모두 예시입니다. 현재 진영 선택 UI는 체험용이며, 실제 가입 시 영구 확정 기능은 후속 구현 대상입니다.

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

이 버전은 정적 자산만 배포하므로 D1·R2·구글 OAuth 설정 없이 먼저 화면을 확인할 수 있습니다.

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
public/app.js      시안 동작과 브라우저 저장
public/assets/    제공된 캐릭터에서 추출한 WebP
wrangler.jsonc    Cloudflare 정적 자산 배포 설정
```

## 월드 애니메이션

아스트라는 4프레임 시트를 재생합니다. 세린·루미·녹스는 아직 단일 이미지에 CSS 대기 효과만 적용했습니다. 월드 캐릭터 선택은 대사를 미리 보는 동작이며, 사용자 진영을 바꾸지는 않습니다. 자세한 구현과 제한은 `docs/world-scene.md`, `docs/astra-animation.md`를 참고하세요.

## 검증과 제한

시안의 JS 문법과 진영 필터·검색·인기 정렬·페이지 이동·글 저장·댓글 저장·HTML 이스케이프 로직을 검사했습니다. 이번 월드 작업은 브라우저에서 PC와 390px 프레임 레이아웃, 캐릭터 대사 전환, 낮·밤 전환, 동작 정지, 게시판 연결, 지휘관 진영 변경을 확인했습니다. 모바일 실기기 검증과 Cloudflare 운영 배포 확인은 별도입니다.

D1, R2, Better Auth 의존성과 실제 연결은 아직 추가하지 않았습니다. 실제 회원가입과 공유 게시판을 구현하면서 별도 마이그레이션과 환경설정을 추가할 예정입니다.
