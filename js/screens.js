let setupVersusPending = 'duo';

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function (s) {
    s.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

function setBodyModeClass(mode) {
  document.body.classList.remove('mode-solo', 'mode-duo', 'mode-item', 'mode-online');
  document.body.classList.add('mode-' + mode);
}

function clearBodyModeClass() {
  document.body.classList.remove('mode-solo', 'mode-duo', 'mode-item', 'mode-online');
}

function attachCanvasContext(board, canvasEl) {
  if (!canvasEl) return;
  board.canvas = canvasEl;
  board.ctx = canvasEl.getContext('2d');
}

let onlineLayoutActive = false;

function enterOnlineLayout() {
  if (onlineLayoutActive) return;

  const topBarV = document.getElementById('topBarV');
  const boardColP1 = document.querySelectorAll('#gameScreenVersus .board-col')[0];
  const miniRowP1 = document.getElementById('miniRowP1');
  const vsHudP1 = document.getElementById('vsHudP1');

  const bar = document.createElement('div');
  bar.id = 'onlineLeftBar';

  const iconWrap = document.createElement('div');
  iconWrap.className = 'online-icon-wrap';
  Array.from(topBarV.children).forEach(function (child) {
    iconWrap.appendChild(child);
  });
  bar.appendChild(iconWrap);

  if (miniRowP1) {
    miniRowP1.classList.add('online-vertical');
    bar.appendChild(miniRowP1);
  }

  if (vsHudP1) {
    bar.appendChild(vsHudP1);
  }

  document.getElementById('gameScreenVersus').appendChild(bar);
  onlineLayoutActive = true;
}

function exitOnlineLayout() {
  if (!onlineLayoutActive) return;

  const bar = document.getElementById('onlineLeftBar');
  if (!bar) {
    onlineLayoutActive = false;
    return;
  }

  const topBarV = document.getElementById('topBarV');
  const boardColP1 = document.querySelectorAll('#gameScreenVersus .board-col')[0];
  const iconWrap = bar.querySelector('.online-icon-wrap');
  const miniRow = bar.querySelector('#miniRowP1');
  const vsHud = bar.querySelector('#vsHudP1');

  if (iconWrap && topBarV) {
    Array.from(iconWrap.children).forEach(function (child) {
      topBarV.appendChild(child);
    });
  }

  if (miniRow && boardColP1) {
    miniRow.classList.remove('online-vertical');
    const canvasP1 = document.getElementById('canvasP1');
    boardColP1.insertBefore(miniRow, canvasP1);
  }

  if (vsHud && boardColP1) {
    boardColP1.appendChild(vsHud);
  }

  bar.remove();
  onlineLayoutActive = false;
}

function setupModeButtons() {
  document.getElementById('btnModeSolo').onclick = function () {
    showScreen('setupSolo');
  };

  document.getElementById('btnModeDuo').onclick = function () {
    App.itemsEnabled = false;
    document.getElementById('setupVersusTitle').textContent = '로컬 대전 · 노멀';
    setupVersusPending = 'duo';
    showScreen('setupVersus');
  };

  document.getElementById('btnModeItem').onclick = function () {
    App.itemsEnabled = true;
    document.getElementById('setupVersusTitle').textContent = '로컬 대전 · 아이템전';
    setupVersusPending = 'item';
    showScreen('setupVersus');
  };

  document.getElementById('btnModeOnline').onclick = function () {
    showScreen('setupOnline');
  };

  document.getElementById('btnOpenSettings').onclick = function () {
    renderKeySettings();
    applyShowNextUI();
    applyDeviceModeUI();
    showScreen('settingsScreen');
  };

  document.getElementById('backFromSettings').onclick = function () {
    cancelListening();
    showScreen('modeScreen');
  };

  document.getElementById('resetKeysBtn').onclick = function () {
    showConfirm('키 설정을 기본값으로 초기화할까요?', function () {
      resetKeysToDefault();
    });
  };

  document.getElementById('showNextCheck').onchange = function (e) {
    setShowNext(e.target.checked);
  };

  document.getElementById('deviceModePC').onclick = function () {
    setDeviceMode('pc');
  };

  document.getElementById('deviceModeMobile').onclick = function () {
    setDeviceMode('mobile');
  };

  document.getElementById('startSoloBtn').onclick = function () {
    startGame('solo', false);
  };

  document.getElementById('backFromSolo').onclick = function () {
    showScreen('modeScreen');
  };

  document.getElementById('startVersusBtn').onclick = function () {
    startGame(setupVersusPending, App.itemsEnabled);
  };

  document.getElementById('backFromVersus').onclick = function () {
    showScreen('modeScreen');
  };

  document.getElementById('createRoomBtn').onclick = function () {
    createRoom(document.getElementById('onlineItemsCheck').checked);
  };

  document.getElementById('joinRoomBtn').onclick = function () {
    const code = document.getElementById('joinCodeInput').value.trim();
    if (code.length !== 5) {
      showAlert('5자리 코드를 입력하세요');
      return;
    }
    joinRoom(code, document.getElementById('onlineItemsCheck').checked);
  };

  document.getElementById('backFromOnline').onclick = function () {
    teardownOnline();
    showScreen('modeScreen');
  };

  document.getElementById('resumeBtn').onclick = closePause;
  document.getElementById('pauseRestartBtn').onclick = restartCurrentMatch;
  document.getElementById('pauseQuitBtn').onclick = quitCurrentMatch;
  document.getElementById('resultRestartBtn').onclick = restartCurrentMatch;
  document.getElementById('resultQuitBtn').onclick = quitCurrentMatch;

  ['Solo', 'V'].forEach(function (suffix) {
    document.getElementById('pauseBtn' + suffix).onclick = togglePauseKey;
    document.getElementById('restartBtnTop' + suffix).onclick = restartCurrentMatch;
    document.getElementById('quitBtn' + suffix).onclick = quitCurrentMatch;

    const soundBtn = document.getElementById('soundBtn' + suffix);
    if (soundBtn) {
      soundBtn.onclick = function () {
        const on = sfx.toggle();
        soundBtn.textContent = on ? '🔊' : '🔇';
      };
    }
  });
}

function startGame(mode, itemsEnabled) {
  App.mode = mode;
  App.itemsEnabled = itemsEnabled;
  App.paused = false;

  unbindAllBoardKeys();
  setBodyModeClass(mode);

  const itemMode = itemsEnabled;
  const isMobile = getDeviceMode() === 'mobile';

  if (mode === 'solo') {
    App.boards = { p1: createBoard('p1', { itemMode: false }) };
    showScreen('gameScreenSolo');
    renderControlHints('hintLeftSolo', 'hintRightSolo');

    attachCanvasContext(App.boards.p1, document.getElementById('canvasSolo'));
    App.boards.p1.holdCanvas = document.getElementById('holdSolo');
    // NEXT 미리보기를 1개만 사용
    App.boards.p1.nextCanvases = [document.getElementById('next0Solo')];

    buildTouchControls('touchSolo', App.boards.p1, null, false);
  } else if (mode === 'duo' || mode === 'item') {
    App.boards = {
      p1: createBoard('p1', { itemMode: itemMode }),
      p2: createBoard('p2', { itemMode: itemMode })
    };
    document.getElementById('labelP1').textContent = 'P1';
    document.getElementById('labelP2').textContent = 'P2';
    document.getElementById('itemRowP1').style.display = itemMode ? 'flex' : 'none';
    document.getElementById('itemRowP2').style.display = itemMode ? 'flex' : 'none';
    document.getElementById('miniRowP2').style.display = 'flex';
    showScreen('gameScreenVersus');
    renderControlHints('hintLeftV', 'hintRightV');

    attachCanvasContext(App.boards.p1, document.getElementById('canvasP1'));
    attachCanvasContext(App.boards.p2, document.getElementById('canvasP2'));
    App.boards.p1.holdCanvas = document.getElementById('holdP1');
    App.boards.p1.nextCanvases = [document.getElementById('next0P1')];
    App.boards.p2.holdCanvas = document.getElementById('holdP2');
    App.boards.p2.nextCanvases = [document.getElementById('next0P2')];

    buildTouchControls('touchVersus', App.boards.p1, App.boards.p2, itemMode);

    if (isMobile) {
      showToast('이 모드는 두 명이 한 화면에서 조작합니다. 태블릿이나 가로 모드 사용을 추천해요.');
    }
  } else if (mode === 'online') {
    App.boards = {
      p1: createBoard('p1', { itemMode: itemMode }),
      p2: createBoard('p2', { itemMode: itemMode, isRemoteView: true })
    };
    document.getElementById('labelP1').textContent = '나';
    document.getElementById('labelP2').textContent = '상대';
    document.getElementById('itemRowP1').style.display = itemMode ? 'flex' : 'none';
    document.getElementById('itemRowP2').style.display = 'none';
    document.getElementById('miniRowP2').style.display = 'none';
    showScreen('gameScreenVersus');
    renderControlHints('hintLeftV', 'hintRightV');

    attachCanvasContext(App.boards.p1, document.getElementById('canvasP1'));
    attachCanvasContext(App.boards.p2, document.getElementById('canvasP2'));
    App.boards.p1.holdCanvas = document.getElementById('holdP1');
    App.boards.p1.nextCanvases = [document.getElementById('next0P1')];

    buildTouchControls('touchVersus', App.boards.p1, App.boards.p2, itemMode);

    enterOnlineLayout();
  }

  resizeBoards();
  spawnPiece(App.boards.p1);
  if (App.boards.p2 && !App.boards.p2.isRemoteView) {
    spawnPiece(App.boards.p2);
  }

  bindBoardKeys(App.boards.p1, KEYS_P1, App.boards.p2);
  if (mode === 'duo' || mode === 'item') {
    bindBoardKeys(App.boards.p2, KEYS_P2, App.boards.p1);
  }

  const itemUseBtn = document.getElementById('itemUseP1');
  if (itemUseBtn) {
    itemUseBtn.onclick = function () {
      useItemOrShield(App.boards.p1, App.boards.p2);
    };
  }

  document.getElementById('resultOverlay').style.display = 'none';
  applyShowNextUI();
  startLoop();
}

function renderControlHints(leftId, rightId) {
  const left = document.getElementById(leftId);
  const right = document.getElementById(rightId);
  if (!left || !right) {
    return;
  }

  function buildHtml(title, keys) {
    return '<div class="hint-title">' + title + '</div>' +
      '<div class="hint-row"><span>이동</span><span>' + keyLabelText(keys.left) + ' / ' + keyLabelText(keys.right) + '</span></div>' +
      '<div class="hint-row"><span>소프트 드롭</span><span>' + keyLabelText(keys.soft) + '</span></div>' +
      '<div class="hint-row"><span>하드 드롭</span><span>' + keyLabelText(keys.hard) + '</span></div>' +
      '<div class="hint-row"><span>회전</span><span>' + keyLabelText(keys.ccw) + ' / ' + keyLabelText(keys.cw) + '</span></div>' +
      '<div class="hint-row"><span>홀드</span><span>' + keyLabelText(keys.hold) + '</span></div>' +
      '<div class="hint-row"><span>아이템</span><span>' + keyLabelText(keys.item) + '</span></div>';
  }

  if (App.mode === 'solo') {
    left.innerHTML = buildHtml('조작법', KEYS_P1);
    right.innerHTML = '<div class="hint-title">TIP</div><div class="hint-tip">우측 상단 버튼으로 언제든 일시정지 · 재시작 · 종료할 수 있어요.</div>';
  } else if (App.mode === 'online') {
    left.innerHTML = buildHtml('내 조작법', KEYS_P1);
    right.innerHTML = '<div class="hint-title">ONLINE</div><div class="hint-tip">상대방은 자신의 기기에서 따로 조작합니다.</div>';
  } else {
    left.innerHTML = buildHtml('P1 조작법', KEYS_P1);
    right.innerHTML = buildHtml('P2 조작법', KEYS_P2);
  }
}
