Lotto 6/45 — Integrated Overlay + Anti Engine v3 ("anti-5th" risk guard)

핵심
- 크기/간격/폰트: 기존 핀 그대로(색상만 클래스 토글)
- 저장번호 최신 매칭 색상칩 / 제외수 색상칩 & 영구 저장
- 범위 배지 포함
- ★ Anti Engine v3:
  - 과거 세트/페어/트리플 금지(윈도 확장: sets=800, pairs=400, triples=600)
  - 핫넘버 상한(Top12 중 최대 2개까지만 허용)
  - 몬테카를로 샘플링 기반 위험률 추정 → 3개 이상 일치 위험률 max 0.1% 이하만 통과

설치(리포 루트, VS Code PowerShell)
  PS> powershell -ExecutionPolicy Bypass -File scripts\apply_patch.ps1 -ZipPath ".\patch_lotto_kr_v7_integrated_anti_v3.zip"
  PS> git add -A
  PS> git commit -m "chore: integrate overlays + Anti Engine v3 (risk-based)"
  PS> git push

튜닝(브라우저 콘솔)
  window.__ANTI_V3__.cfg.maxRisk3p = 0.0005;   // 위험률 더 낮추기
  window.__ANTI_V3__.cfg.hotTop = 10;          // 핫넘버 집합 축소
  window.__ANTI_V3__.cfg.maxFromHot = 1;       // 핫넘버 허용 1개로 축소
