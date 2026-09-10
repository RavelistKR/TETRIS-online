let lastTs = 0;

function startLoop() {
  App.active = true;
  App.paused = false;
  lastTs = performance.now();
  updateTouchVisibility();
  requestAnimationFrame(tick);
}

function tick(ts) {
  if (!App.active) {
    return;
  }

  const dt = ts - lastTs;
  lastTs = ts;
  requestAnimationFrame(tick);

  if (App.paused) {
    renderAll();
    return;
  }

  Object.keys(App.boards).forEach(function (key) {
    const board = App.boards[key];
    if (!board || board.isRemoteView || board.gameOver) {
      return;
    }
    stepBoard(board, dt);
  });

  renderAll();
  checkGameEnd();
}

function stepBoard(board, dt) {
  let interval = board.dropInterval;
  if (board.slowUntil && Date.now() < board.slowUntil) {
    interval *= 2;
  }

  board.dropTimer += dt;
  if (board.dropTimer >= interval) {
    board.dropTimer = 0;
    if (!tryMove(board, 0, 1)) {
      board.lockTimer += interval;
    }
  }

  if (isGrounded(board)) {
    board.lockTimer += dt;
    if (board.lockTimer >= LOCK_DELAY) {
      lockPiece(board);
      if (App.mode === 'online') {
        sendOnlineSnapshot(board);
      }
    }
  } else {
    board.lockTimer = Math.max(0, board.lockTimer);
  }

  if (App.mode === 'online' && board.id === 'p1') {
    throttledSnapshot(board);
  }

  updateScoreUI(board);
}

function updateScoreUI(board) {
  if (App.mode === 'solo') {
    document.getElementById('scoreSolo').textContent = board.score;
    document.getElementById('linesSolo').textContent = board.lines;
  } else {
    const scoreId = board.id === 'p1' ? 'scoreP1' : 'scoreP2';
    const el = document.getElementById(scoreId);
    if (el) {
      el.textContent = board.score;
    }
  }
}

function checkGameEnd() {
  if (App.mode === 'solo') {
    if (App.boards.p1 && App.boards.p1.gameOver) {
      endMatch('게임 오버');
    }
  } else if (App.mode === 'duo' || App.mode === 'item') {
    const p1 = App.boards.p1;
    const p2 = App.boards.p2;
    if (p1.gameOver || p2.gameOver) {
      let title;
      if (p1.gameOver && p2.gameOver) {
        title = '무승부';
      } else if (p1.gameOver) {
        title = 'P2 승리!';
      } else {
        title = 'P1 승리!';
      }
      endMatch(title);
    }
  } else if (App.mode === 'online') {
    if (App.boards.p1 && App.boards.p1.gameOver) {
      sendOnlineMessage({ type: 'gameover' });
      endMatch('패배했습니다');
    }
  }
}

function endMatch(title) {
  App.active = false;
  document.getElementById('resultTitle').textContent = title;
  document.getElementById('resultOverlay').style.display = 'flex';
  sfx.gameover();
  updateTouchVisibility();
}
