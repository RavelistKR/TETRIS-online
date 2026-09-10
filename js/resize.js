// js/resize.js - 전체 교체
(function () {
  function isMobileMode() {
    return document.body.classList.contains('device-mobile');
  }

  function getViewportSize() {
    if (window.visualViewport) {
      return { w: window.visualViewport.width, h: window.visualViewport.height };
    }
    return { w: window.innerWidth, h: window.innerHeight };
  }

  function setCanvasSize(canvas, block, thumbWidthPx) {
    if (!canvas) return;
    canvas.width = COLS * block;
    canvas.height = ROWS * block;
    canvas.style.display = 'block';
    canvas.style.maxWidth = 'none';
    canvas.style.maxHeight = 'none';

    if (thumbWidthPx) {
      canvas.style.width = thumbWidthPx + 'px';
      canvas.style.height = Math.round(thumbWidthPx * ROWS / COLS) + 'px';
    } else {
      canvas.style.width = canvas.width + 'px';
      canvas.style.height = canvas.height + 'px';
    }
  }

  function resizeMiniCanvases(mobile) {
    const size = mobile ? 48 : 80;
    document.querySelectorAll('.mini-box canvas').forEach(function (c) {
      if (c.closest('#onlineLeftBar')) return;
      c.width = size;
      c.height = size;
      c.style.width = size + 'px';
      c.style.height = size + 'px';
    });
  }

  function measureOnlineBarWidth() {
    const bar = document.getElementById('onlineLeftBar');
    if (!bar) return 0;
    return Math.ceil(bar.getBoundingClientRect().width);
  }

  // 추가: 좌측 바의 실제 높이를 측정합니다.
  // 상대 보드(P2)를 이 바 바로 아래에 배치할 때 기준값으로 사용됩니다.
  // 아이콘/HOLD·NEXT/SCORE 구성이 바뀌어도 항상 정확한 위치에 붙도록
  // 폭(width)과 동일한 방식으로 매 리사이즈마다 실측합니다.
  function measureOnlineBarHeight() {
    const bar = document.getElementById('onlineLeftBar');
    if (!bar) return 0;
    return Math.ceil(bar.getBoundingClientRect().height);
  }

  function resizeBoards() {
    const mobile = isMobileMode();
    const viewport = getViewportSize();
    const vw = viewport.w;
    const vh = viewport.h;

    const versusScreen = document.getElementById('gameScreenVersus');
    const isVersusScreen = !!(versusScreen && versusScreen.classList.contains('active'));
    const isOnline = isVersusScreen && App.mode === 'online';
    const isLocalVersus = isVersusScreen && (App.mode === 'duo' || App.mode === 'item');

    resizeMiniCanvases(mobile);

    if (!isVersusScreen) {
      // ---- 솔로 모드 ----
      // 데스크톱에서는 캔버스 좌우로 HOLD/SCORE 패널, NEXT 패널과
      // 그 사이 gap(24px x2)이 실제로 폭을 차지합니다. 이걸 계산에서
      // 빼지 않으면 캔버스+패널 전체 폭이 화면보다 커져서
      // "게임창이 한 화면에 다 안 들어오는" 현상이 생깁니다.
      const topReserve = 60;
      const bottomReserve = mobile ? 0 : 24;
      const soloSideChrome = mobile ? 0 : 260; // HOLD/SCORE 패널 + NEXT 패널 + gap 여유값
      const availW = vw - soloSideChrome;
      const availH = vh - topReserve - bottomReserve;

      const maxBlockByW = Math.floor(availW / COLS);
      const maxBlockByH = Math.floor(availH / ROWS);
      let block = Math.min(maxBlockByW, maxBlockByH);
      // 데스크톱 최대 크기를 36→30으로 낮춰 게임창 전체가 여유 있게 한 화면에 들어오도록 함
      block = Math.max(8, Math.min(block, mobile ? 40 : 30));

      BLOCK = block;
      setCanvasSize(document.getElementById('canvasSolo'), block, null);

    } else if (isOnline) {
      // ---- 온라인 대전 ----
      let barWidth = measureOnlineBarWidth();
      if (!barWidth) {
        barWidth = mobile ? 74 : 110;
      }
      document.documentElement.style.setProperty('--online-bar-w', barWidth + 'px');

      // 추가: 좌측 바 높이를 --online-bar-h로 반영
      // (모바일에서 상대 보드를 이 바로 아래에 배치할 때 CSS가 이 변수를 참조합니다)
      let barHeight = measureOnlineBarHeight();
      if (!barHeight) {
        barHeight = mobile ? 240 : 260;
      }
      document.documentElement.style.setProperty('--online-bar-h', barHeight + 'px');

      const safeTop = 8;
      const safeBottom = mobile ? 8 : 10;
      const availW = vw - barWidth;
      const availH = vh - safeTop - safeBottom;

      const maxBlockByW = Math.floor(availW / COLS);
      const maxBlockByH = Math.floor(availH / ROWS);
      let block = Math.min(maxBlockByW, maxBlockByH);
      block = Math.max(8, Math.min(block, mobile ? 40 : 46));

      BLOCK = block;
      setCanvasSize(document.getElementById('canvasP1'), block, null);

      const thumbW = mobile ? 76 : 176;
      setCanvasSize(document.getElementById('canvasP2'), block, thumbW);

      const holdNextSize = mobile ? 26 : 34;
      document.querySelectorAll('#onlineLeftBar .mini-box canvas').forEach(function (c) {
        c.width = holdNextSize;
        c.height = holdNextSize;
        c.style.width = holdNextSize + 'px';
        c.style.height = holdNextSize + 'px';
      });

    } else if (isLocalVersus) {
      // ---- 로컬 대전(노멀/아이템) ----
      const topReserve = 60;
      const bottomReserve = mobile ? 20 : 24;
      const versusChrome = mobile ? 100 : 120;
      const availW = vw;
      const availH = vh - topReserve - bottomReserve - versusChrome;

      const gap = mobile ? 8 : 24;
      const perW = Math.floor((availW - gap) / 2);
      const maxBlockByW = Math.floor(perW / COLS);
      const maxBlockByH = Math.floor(availH / ROWS);
      let block = Math.min(maxBlockByW, maxBlockByH);
      block = Math.max(6, Math.min(block, mobile ? 24 : 32));

      BLOCK = block;
      setCanvasSize(document.getElementById('canvasP1'), block, null);
      setCanvasSize(document.getElementById('canvasP2'), block, null);
    }

    if (typeof renderAll === 'function') {
      renderAll();
    }
  }

  let resizeTimer = null;
  function scheduleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeBoards, 30);
  }

  window.addEventListener('resize', scheduleResize);
  window.addEventListener('orientationchange', scheduleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleResize);
  }

  window.resizeBoards = resizeBoards;
  document.addEventListener('DOMContentLoaded', resizeBoards);
})();
