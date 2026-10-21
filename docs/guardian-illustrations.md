# 소개용 수호신 일러스트 v1

제작 방식: 내장 image_gen 도구. 첨부된 네 캐릭터 설정화를 정체성 참고로 사용하고, 각 캐릭터를 별도의 투명 배경 전신 일러스트로 제작했습니다. 원본 PNG는 작업 공간의 generated_images에 남기고, 웹에서는 투명도를 유지한 1024×1536 WebP를 사용합니다.

## 연결

- public/guardians.js의 portrait 메타데이터가 이미지 주소, 크기, 대체 텍스트를 관리합니다.
- public/guardian-page.js는 소개 화면의 고정 도트 대신 img를 표시합니다.
- CSS object-fit:contain과 고유 크기로 비율을 유지합니다. 큰 화면 최대 높이 660px, 모바일 460px입니다.
- 한 번에 선택한 수호신 이미지만 요청합니다. 다른 세 이미지는 미리 내려받지 않습니다.
- 첫 선택 이미지에는 높은 로딩 우선순위를 줍니다. 탭을 바꿔도 계정 진영이나 테마는 바뀌지 않습니다.
- 월드·게임·메뉴의 기존 도트 애니메이션은 그대로 사용합니다.
- 이 자산은 제공자 API를 호출하거나 키를 사용하지 않는 정적 이미지입니다.

## 저장 경로

- public/assets/guardians/astra-portrait-v1.webp
- public/assets/guardians/serin-portrait-v1.webp
- public/assets/guardians/lumi-portrait-v1.webp
- public/assets/guardians/nox-portrait-v1.webp

## 최종 프롬프트

검증: `npm run build`의 문법 검사와 실제 SQLite를 사용하는 28개 테스트가 통과했습니다. 네 WebP는 1024×1536 RGBA, 투명 알파 보존과 총 약 1.7MB를 확인했습니다. 로컬 서버는 원격 검수 브라우저에서 접근되지 않아, 브라우저 화면 확인은 배포 후 진행합니다.

공통:

```text
Use case: stylized-concept. Asset type: production character illustration cutout for the left panel of a guardian introduction website. The attached image is a CHARACTER IDENTITY reference, NOT an edit target to retain the poster layout. Create ONE character only, no poster, no text, no logos, no panels or miniatures. A clearly adult woman age approximately 25, natural elegant 7-head proportions, refined adult face, warm poised expression; NOT chibi, NOT a child. High quality anime fantasy game character illustration, mostly flat cel shading with crisp clean line art and limited restrained soft highlights, coherent detailing, fully clothed tasteful elegant fantasy outfit. Full body including both boots and all hair, generous transparent margin around silhouette, centered portrait composition with no cropped head/feet/prop. TRUE transparent background, no backdrop, no floor, no colored rectangle or cast-shadow ground. Keep recognizably the same hair colors, eye colors, head accessories and outfit motifs as the reference, while making proportions more mature. Hands anatomically correct with clear plausible grip. One specific prop described below; remove all extra weapons, floating interface cards and unrelated objects from the reference.
```

### astra

참고: 첨부 원화 01_28_39-1(2).png

```text
Astra: silver-white hair with pale mint lengths, emerald eyes, distinctive emerald ear-disc ornaments and graceful golden star halo from reference, white/deep forest-green scholar robe with fine gold edges. Calm wise encouraging expression. Holding a single ornate closed or slightly open green BOOK with both hands naturally at mid torso. Absolutely NO staff. Green/gold star details, no standalone spells. Modest layered long robe.
```

### serin

참고: 첨부 원화 01_28_39-2(2).png

```text
Serin: warm long champagne blonde hair with pale copper ends, amber eyes, reference sunburst hair ornament and simple golden halo arc, white and deep warm RED knight-commander coat with restrained gold trim. Mature dignified gentle knight. One elegant SWORD held naturally at her side, blade pointing downward, the other hand relaxed. No book, no staff, no floating screen. Make red faction clearly visible rather than orange-only. Tasteful complete uniform, not bikini armor.
```

### lumi

참고: 첨부 원화 01_28_43-3(2).png

```text
Lumi: long silver-blue hair with reference loosely tied twin sections and star hair ornaments, bright blue eyes, small delicate orbital golden halo. Adult curious explorer, lively yet composed smile. White/navy and cobalt-blue celestial mage coat with gold constellation details, long layered panels, fully clothed. Holding ONE beautiful blue star-and-crystal STAFF in one hand, other hand gracefully open. Staff completely in frame. No book, no floating robot, no holographic screens.
```

### nox

참고: 첨부 원화 01_28_44-4(2).png

```text
Nox: long silvery lavender hair, violet eyes, recognizable dark crescent/circular halo and geometric hair accents. Adult confident playful knowing smile. Black and rich violet elegant long adventurer coat with silver/limited purple accents, tasteful opaque fully clothed fitted underlayers. Holding ONE glowing violet STAR SHARD, a small irregular star-shaped purple crystal, visibly resting above her open gloved hand at chest level. Other hand relaxed at side. No sword, no dagger, no staff, no book, no interface screens. Restrained purple glow, don't obscure face.
```


