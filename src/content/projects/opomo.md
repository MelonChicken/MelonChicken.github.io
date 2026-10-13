---
title: "OPOMO"
slug: "opomo"
generated: true
status: "archived"
summary: "인생네컷을 찍을때 매번 포즈가 고민이다 → 포즈를 수집&추천해주자"
date: "2022-10-20"
group: "product"
stack: 
  - "Vanila JS"
  - "Sass"
  - "Firebase"
  - "CSS"
roles: 
  - "🖥️ Front End"
  - "💾 Back End"
output: "🌐 Web"
repo: "https://github.com/MelonChicken/OPOMO_project"
notion: "https://app.notion.com/p/OPOMO-26314b84a0f280628145f5ce2e296cf3"
featured: false
problem: "인생네컷을 찍을때 매번 포즈가 고민이다 → 포즈를 수집&추천해주자"
---

<!-- This file is generated from Notion. Do not edit directly. -->

![Notion image](/notion-assets/opomo/26414b84a0f28030b1fddbaef94e0ea0.png)

# <strong>OPOMO</strong> – 오늘 포즈 모하지?

> 한줄 슬로건

> 해커톤/공모전 정보 (일시, 성취도)
>
> [2022 IT서비스 아이디어 기획/개발 공모전 개발분야 은상 수상](https://itm.seoultech.ac.kr/bachelor_of_information/notice?do=view&profboardidx=0&bnum=1947&bidx=528233&cate=7&allboard=false&nowpage=1) (2022.10.31.)
>
> [https://itm.seoultech.ac.kr/bachelor&#95;of&#95;information/notice?do=view&amp;profboardidx=0&amp;bnum=1947&amp;bidx=526247&amp;cate=7&amp;allboard=false&amp;nowpage=6](https://itm.seoultech.ac.kr/bachelor_of_information/notice?do=view&profboardidx=0&bnum=1947&bidx=526247&cate=7&allboard=false&nowpage=6)
>
> <details>
> <summary>결과 스크린샷</summary>
>
> ![Notion image](/notion-assets/opomo/2e814b84a0f28096a07ce2d22a4d2222.png)
>
> </details>

---

## <strong>1. 개요</strong>

- 프로젝트명: <strong>OPOMO</strong> (오늘 포즈 모하지?)

- 목적/가치: 4컷 사진 촬영을 위한 포즈 추천 웹 서비스

- 배경/동기: 2022년 IT서비스 기획/프로그래밍 경진대회 출품작

- 해커톤/공모전 정보: 2022년 IT서비스 기획/프로그래밍 경진대회&#93;

## <strong>2. 역할·스택·기간</strong>

- 역할/기여: FE 60%, BE 40%

- 스택: HTML5, CSS3(Sass), JavaScript(ES6+), Firebase(Database, Storage), jQuery

- 기간: 2022-10-20 ~ 2022-11-19

## <strong>3. 데모 &amp; 링크</strong>

- Demo: N/A

- Repo: [https://github.com/MelonChicken/OPOMO&#95;project](https://github.com/MelonChicken/OPOMO_project)

- 문서: N/A

- 시연영상: N/A

## <strong>4. 아키텍처 요약</strong>

- 데이터 흐름/외부 의존성:

  - Firebase Realtime Database를 통한 포즈 데이터 저장/조회

  - CDN을 통한 외부 라이브러리 로딩 (jQuery, FontAwesome)

  - html2canvas를 통한 클라이언트 사이드 이미지 캡처

- 배포/CI·CD/롤백: 정적 웹사이트 호스팅 (배포 설정 파일 없음)

## <strong>5. 핵심 기능(스크린샷/GIF 포함)</strong>

1. <strong>포즈 추천 시스템</strong> — 사용자가 원하는 인원수와 컨셉에 맞는 4컷 포즈를 추천 / 태그 기반 필터링 지원

2. <strong>커스텀 포즈 배치</strong> — 드래그 앤 드롭 인터페이스로 4컷 레이아웃 자유 구성 / 터치 디바이스 지원

3. <strong>위시리스트 기능</strong> — 마음에 드는 포즈들을 저장하고 관리

4. <strong>모바일 최적화</strong> — 터치 기반 인터랙션과 반응형 디자인

5. <strong>포즈 내보내기</strong> — html2canvas를 활용한 이미지 생성 및 다운로드

## <strong>6. 기술적 특징</strong>

- 포즈 데이터베이스: 카테고리별 포즈 이미지 (2명/3명/4명 이상)

- Sass를 활용한 모듈화된 스타일링

- jQuery UI Sortable을 통한 드래그 앤 드롭 구현

## <strong>7. 성과 및 영향</strong>

- 성공 기준(KPI): 사용자 편의성과 직관적인 포즈 선택 경험 제공

- 범위(Out of scope): 실시간 사진 촬영, SNS 공유 기능
