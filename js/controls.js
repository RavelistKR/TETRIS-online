function bindBoardKeys(board, keys, opponent) {
  const handler = function (e) {
    if (board.id === 'p1' && e.code === keys.pause) {
      togglePauseKey();
      e.preventDefault();
      return;
    }

    if (!App.active || App.paused || board.gameOver) {
      return;
    }

    switch (e.code) {
      case keys.left:
        tryMove(board, -1, 0);
        e.preventDefault();
        break;
      case keys.right:
        tryMove(board, 1, 0);
        e.preventDefault();
        break;
      case keys.soft:
        tryMove(board, 0, 1);
        e.preventDefault();
        break;
      case keys.hard:
        hardDrop(board);
        e.preventDefault();
        break;
      case keys.cw:
        tryRotate(board, 1);
        e.preventDefault();
        break;
      case keys.ccw:
        tryRotate(board, -1);
        e.preventDefault();
        break;
      case keys.hold:
        holdPiece(board);
        e.preventDefault();
        break;
      case keys.item:
        e.preventDefault();
        useItemOrShield(board, opponent);
        break;
      default:
        break;
    }
  };

  document.addEventListener('keydown', handler);
  App.keyHandlers.push(handler);
}

function unbindAllBoardKeys() {
  App.keyHandlers.forEach(function (handler) {
    document.removeEventListener('keydown', handler);
  });
  App.keyHandlers = [];
}

function useItemOrShield(board, opponent) {
  if (board.item === 'shield') {
    board.item = null;
    board.shield++;
    updateItemSlotUI(board);
    sfx.item();
  } else {
    activateItem(board, opponent);
  }
}

function togglePauseKey() {
  if (!App.active) {
    return;
  }
  if (App.paused) {
    closePause();
  } else {
    openPause();
  }
}

function openPause() {
  App.paused = true;
  document.getElementById('pauseOverlay').style.display = 'flex';
  updateTouchVisibility();
}

function closePause() {
  App.paused = false;
  document.getElementById('pauseOverlay').style.display = 'none';
  updateTouchVisibility();
}

function restartCurrentMatch() {
  showConfirm('현재 게임을 그만두고 다시 시작할까요?', function () {
    closePause();
    document.getElementById('resultOverlay').style.display = 'none';
    startGame(App.mode, App.itemsEnabled);
  });
}

function quitCurrentMatch() {
  showConfirm('게임을 종료하고 모드 선택으로 돌아갈까요?', function () {
    closePause();
    document.getElementById('resultOverlay').style.display = 'none';
    App.active = false;
    unbindAllBoardKeys();
    if (App.mode === 'online') {
      exitOnlineLayout();
      teardownOnline();
    }
    clearBodyModeClass();
    showScreen('modeScreen');
    updateTouchVisibility();
  });
}
