# 모험가 자산 제작 기준 · 린과 레오

## 적용 범위

앞으로 모험가 하나는 다음 두 자산을 한 세트로 등록합니다.

1. 맵용 도트: 기본 대기 32프레임, 192×224 타일, 4열×8행, 발 기준 (96, 210).
2. 대화용 프로필: 수호신 일러스트와 어울리는 그림체, 투명 배경 상반신, 캐릭터의 머리·의상·소품 일치.

걷기·공격·방향별 동작은 아직 제작하지 않았습니다. 이번 32프레임은 대기 동작입니다.

## 첫 캐릭터: 린

첫걸음의 탐험가. 밤색 단발과 작은 땋은 머리, 청록 리본, 아이보리 망토와 남색 튜닉, 나침반 장식과 갈색 가방을 공통 외형으로 사용합니다.

린(여성)과 레오(남성)는 모든 계정이 새 이야기마다 선택할 수 있는 공통 시작 모험가입니다. 로그인 후 /adventure의 최대 5개 개인 로그 중 하나를 만들거나 이어하면 선택한 캐릭터가 실제 맵에 표시됩니다. 가챠·재화는 아직 연결하지 않았으며, 사건 대화 UI는 기존 방식을 유지합니다. /character-lab은 정적 자산 검수용입니다.

## 파일과 재생

- public/characters.js: 자산 등록 및 공통 규격. 규격에 맞지 않는 등록은 오류로 처리합니다.
- public/assets/characters/rin/portrait-v1.webp: 1024×1536 투명 대화 프로필.
- public/assets/characters/rin/master-v1.webp: 도트 동작의 고정 원화.
- public/assets/characters/rin/idle-v1.png: 768×1792, 32프레임 무손실 시트.
- public/assets/characters/rin/idle-v1.json: 프레임 사각형·발 기준·80ms 재생 시간.
- public/adventurer-motion.js: 호흡·옷자락·양쪽 눈 동시 깜빡임을 만드는 코드.
- scripts/build-adventurer-sheets.mjs: 고정 원화와 동작 코드를 32장 시트로 내보내는 도구.

매 프레임 캐릭터를 AI로 다시 그리지 않습니다. 내장 image_gen으로 만든 고정 원화에 코드 동작을 적용한 32단계 시트입니다. 전신 스케일은 고정하며 발 영역을 유지합니다. 눈 깜빡임은 눈썹 아래의 두 눈 영역을 함께 바꿔 원래 눈썹·속눈썹이 이중으로 겹치지 않게 합니다.

`npm run sprites:build`로 재생성합니다. 이미지 처리는 @napi-rs/canvas 개발 의존성을 사용합니다. PNG를 사용해 손실 압축에 따른 프레임별 픽셀 변화도 피합니다.

제작실은 무료 정적 자산 미리보기입니다. API 키·AI 대화·재화 API를 호출하지 않습니다. 프레임 선택, 재생·정지, 속도, 다크 테마, 시트·프로필 다운로드를 제공합니다. 페이지 비활성화·화면 밖에서는 재생을 쉬고 동작 줄이기 설정에서는 정지로 시작합니다.

## 검증

실제 PNG 시트를 디코딩해 32장 모두 비어 있지 않고 서로 다르며, 발 영역이 모든 프레임에서 픽셀 단위로 동일한지 검사합니다. 프로필 투명도, 두 눈 동시 깜빡임, 눈썹 유지와 등록 메타데이터/시트의 일치를 tests/characters.test.js에서 확인합니다.

## 최종 제작 프롬프트

제작 방식: 내장 image_gen. 프로필의 스타일 참고는 기존 아스트라 소개 일러스트이며, 도트의 정체성 참고는 새로 만든 린 프로필입니다. 입력 PNG는 generated_images에 보존하고 프로젝트에는 실제 소비하는 원화·프로필·시트를 저장합니다.

### 프로필

```text
Use case: stylized-concept. Asset type: transparent dialogue portrait for a fantasy exploration game. The attached image is STYLE reference only, not the same character. Draw ONE NEW clearly adult female traveler named Rin, age approximately 23. Warm chestnut brown chin-length bob hair, small braid on her left side tied with a dark teal ribbon, amber brown eyes, a friendly calm confident expression. Ivory short hooded shoulder cape with subtle teal lining, navy modest high-collar tunic, brown leather cross-body strap with brass compass clasp, brown satchel partially visible at hip, practical leather gloves. She is an ordinary beginning explorer, NO halo, crown, wings, large jewelry, staff or weapon. She holds the shoulder strap naturally with one hand. High quality anime fantasy character art matching the reference's elegant clean linework and predominantly flat cel shading, restrained highlights and detail. Portrait from top of head to hips, both shoulders and hair fully visible with generous margins, subject centered and looking slightly toward viewer. No extra expressions, no text, no logo, no background scene, no frame. Genuine transparent background; preserve clean alpha edges. Adult facial proportions, not chibi and not a child, tasteful fully clothed outfit. Intended for a visual novel portrait next to dialogue; keep a strong clear silhouette and readable face.
```

### 도트 고정 원화

```text
Use case: stylized-concept. Asset type: ONE full-body game pixel sprite master drawing, not a sprite sheet. Use the attached image as character identity reference. This is Rin, the same ADULT female beginning traveler: chestnut chin-length bob with a small braid on viewer right and dark teal ribbon, amber eyes, ivory short hooded cape with teal lining, navy high collar tunic, brass compass medallion on brown crossbody strap, brown satchel on viewer left hip, brown gloves, dark trousers and brown boots. Reinterpret her as a polished 16-bit RPG chibi map sprite about 3 heads tall, matching the detailed existing fantasy guardian map sprites. Crisp deliberate pixel clusters, limited coherent color palette, strong 1-2px dark outlines, cel shaded color ramps, readable miniature details, NOT smooth illustration and NOT blurry pixel filter. Standing exactly FRONT facing, face level and symmetric (no tilted face), both boots level on exactly the same baseline, arms down at sides in neutral breathing-ready idle stance, both eyes fully open at the SAME vertical level, eyebrows distinct ABOVE the eyes. A simple small friendly smile. The bag and cape remain clearly visible as recognizable landmarks. Both hands away from eyes. ONE character centered, all feet/hair/ribbon/cloak inside frame, a generous empty transparent margin. No giant cape flaring, no weapon, no halo, no floor, no shadow, no background, no labels, no UI, no text, no little variants. True transparent background. Render pixel art at roughly 128x160 logical pixels then clean nearest-neighbor enlargement so it is suitable for stable game animation.
```


## 레오 v2

초기 남성 시안의 여성형 허리·골반과 짧은 하의를 수정했습니다. 넓은 어깨, 곧은 남색 여행 재킷, 긴 바지와 부츠로 제작했습니다. 원본 프로필은 1024×1536, 도트는 린과 동일한 192×224×32입니다. 파일은 `public/assets/characters/leo/portrait-v2.webp`, `master-v2.webp`, `idle-v2.png`, `idle-v2.json`입니다.

실제 맵에서는 32px 타일에서 전체 프레임을 48×56 CSS px로, 64px 타일에서는 96×112 CSS px로 그립니다. 투명 여백을 제외한 인물은 대략 타일 폭의 2/3, 높이의 1.5배입니다. 두 캐릭터 모두 발 기준 (96,210)을 바닥에 맞춥니다. 이동은 위치 보간과 작은 보행 흔들림이며, 4방향 걷기 원화는 아직 없습니다.

제작: 내장 image_gen. 최종 프롬프트 요약: masculine young adult male explorer, broad shoulders, straight navy travel jacket, narrow hips, loose long dark trousers, brown boots, small ivory teal-lined shoulder cape, compass and satchel; short brown hair and amber eyes, refined anime style, transparent cutout. 도트 프롬프트: same identity and outfit, front-facing neutral idle, both eyes open, 3.4-head-tall chibi, crisp JRPG pixel clusters, full body with level feet, no shadow or scenery, transparent alpha. 배경 정리: preserve the character exactly and remove all smoky gradient, halo and background pixels.
