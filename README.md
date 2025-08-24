
# 로또 KR Lab Pro (Static SPA, v7)

- 1회부터 최신까지 당첨번호 + 1~3등 금액/인원 스크래핑 후 `data/*.json` 자동 생성 (GitHub Actions).
- 당첨번호 화면: 최근 50회만 표시.
- 추천: 제외수 모달(7열/칩), 1초 로딩 스피너 후 30셋트 생성, 각 셋트에 '당첨확률' 스코어 표시, 생성 즉시 30셋트 묶음으로 저장.
- 저장번호: 30셋트 그룹 보관, 그룹 헤더의 '리셋(30셋트 삭제)'로 해당 그룹 삭제.

## 배포 방법
1) 이 폴더를 레포 루트에 그대로 넣고 커밋/푸시(main).
2) GitHub → Settings → Pages 에서 Source: GitHub Actions 선택.
3) Actions 탭에서 `Build & Deploy (Pages + Full Lotto History)` 실행 확인.

스케줄은 KST 토요일 20:35~23:30 사이 여러 번 실행되도록 구성(UTC 11:35~14:30).
