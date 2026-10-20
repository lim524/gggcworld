# Google 로그인 연결

로그인 코드는 Better Auth 1.7.12 + Workers + D1 기준입니다. 비밀번호 로그인은 사용하지 않습니다. 설정이 없으면 사이트는 정상 표시되고 로그인 버튼에는 준비 중 안내가 나타납니다. 브라우저 체험 프로필을 실제 회원으로 취급하지 않습니다.

## 운영 설정

1. Cloudflare에서 D1 데이터베이스 `gggcworld`를 만듭니다. CLI는 `npx wrangler d1 create gggcworld`입니다.
2. 생성 결과의 실제 ID를 사용해 `wrangler.jsonc` 최상위에 다음 항목을 추가하고 커밋합니다. 아래 ID 문자열은 그대로 배포하지 마세요.

```json
"d1_databases": [{
  "binding": "DB",
  "database_name": "gggcworld",
  "database_id": "실제-D1-데이터베이스-ID",
  "migrations_dir": "migrations"
}]
```

3. `npm ci` 후 `npm run db:remote`로 두 마이그레이션을 적용합니다. 기존 DB를 재사용한다면 먼저 백업하고 테이블 충돌 여부를 확인하세요. 운영 요청에서 자동으로 마이그레이션하지 않습니다.
4. Google Cloud Console에서 OAuth 동의 화면과 **웹 애플리케이션** OAuth 클라이언트를 만듭니다. 승인된 리디렉션 URI는 `https://실제-고정-도메인/api/auth/callback/google`입니다. 임시 미리보기 주소 대신 운영 고정 주소를 사용하세요. 테스트 모드라면 테스트 사용자를 등록해야 합니다.
5. Cloudflare Worker 설정에서 다음 환경변수를 등록합니다. URL은 일반 변수, 나머지는 시크릿으로 등록하세요. CLI는 `npx wrangler secret put 변수이름`으로 입력할 수 있습니다. 값은 GitHub, 게시글, 채팅에 올리지 마세요.

| 이름 | 값 |
| --- | --- |
| `BETTER_AUTH_URL` | `https://실제-고정-도메인` (경로 없음) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` 등으로 생성한 무작위 값 |
| `GOOGLE_CLIENT_ID` | Google 웹 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google 웹 클라이언트 시크릿 |

6. 재배포 후 `/api/config`의 `loginEnabled: true`를 확인합니다. 이 값은 설정 존재 여부만 나타냅니다. DB 마이그레이션과 OAuth 자격 증명의 유효성은 실제 로그인으로 확인해야 합니다.
7. Google 로그인 → 닉네임/진영 확정 → 새로고침 → 로그아웃 → 재로그인 순서로 확인합니다. 두 번째 계정과 모바일에서도 계정 분리를 확인하세요. Google 취소/오류 후 재시도도 확인합니다.

## 동작

- 로그인 세션은 7일, 하루마다 갱신합니다. Secure/HttpOnly 쿠키를 사용하고 세션 캐시를 사용하지 않아 로그아웃과 만료를 서버에서 검사합니다.
- 닉네임/진영은 별도 `member_profile` 테이블에 저장합니다. Google 계정의 이름과 이메일을 공개 닉네임으로 자동 노출하지 않습니다.
- 최초 진영 확정 후에는 닉네임만 수정할 수 있습니다. 원자적 SQL과 DB 트리거가 진영 변경을 막습니다. 다른 진영 테마는 UI에서 선택할 수 없습니다. 테마는 접근권한이 아니라 화면 설정입니다.
- 로그인한 회원의 프로필을 localStorage에 표시용으로 복사하지만 서버는 이를 인증이나 권한 판단에 사용하지 않습니다.
- 게시글·댓글·추천·구독은 여전히 브라우저 체험 기능입니다. 공유 게시판 연결은 별도 작업입니다.
- Better Auth의 OAuth 상태 검증, 세션 서명, 출처 검증과 DB 기반 요청 제한을 사용합니다. Cloudflare가 제공하는 `CF-Connecting-IP`만 요청 제한용으로 읽습니다.
- 운영 연결 전 검증: 실제 Better Auth D1 어댑터를 SQLite 테스트 대역으로 실행해 서명된 세션/로그아웃/계정 분리/잘못된 출처/외부 콜백/위조 OAuth 상태를 검사합니다. Google의 실계정 리디렉션 전체 흐름은 운영 설정 후 검증해야 합니다.

## 개발

`npm run build`, `npm test`, `npx wrangler deploy --dry-run`으로 확인합니다. `.dev.vars.example`은 이름 안내만 제공합니다. 실제 값을 `.dev.vars`에 넣을 때 커밋하지 마세요. Secure 쿠키와 HTTPS URL 검증을 사용하므로 전체 로그인 로컬 검증은 HTTPS 개발 도메인을 등록해 진행하세요.

공식 문서: https://better-auth.com/docs/authentication/google / https://better-auth.com/docs/concepts/database / https://developers.cloudflare.com/d1/get-started/
