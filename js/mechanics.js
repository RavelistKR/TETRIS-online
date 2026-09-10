function createBoard(playerId, opts) {
  opts = opts || {};
  const grid = [];
  for (let i = 0; i < ROWS; i++) {
    grid.push(new Array(COLS).fill(null));
  }

  return {
    id: playerId,
    grid: grid,
    current: null,
    hold: null,
    holdUsed: false,
    queue: [],
    bag: [],
    score: 0,
    lines: 0,
    level: 1,
    dropInterval: BASE_DROP_MS,
    dropTimer: 0,
    lockTimer: 0,
    lockResets: 0,
    softDrop: false,
    item: null,
    shield: 0,
    slowUntil: 0,
    fogUntil: 0,
    gameOver: false,
    canvas: null,
    ctx: null,
    itemMode: !!opts.itemMode,
    isRemoteView: !!opts.isRemoteView
  };
}

function collides(board, cells, x, y) {
  for (let i = 0; i < cells.length; i++) {
    const gx = x + cells[i][0];
    const gy = y + cells[i][1];
    if (gx < 0 || gx >= COLS || gy >= ROWS) {
      return true;
    }
    if (gy >= 0 && board.grid[gy][gx]) {
      return true;
    }
  }
  return false;
}

function tryMove(board, dx, dy) {
  const p = board.current;
  const nx = p.x + dx;
  const ny = p.y + dy;
  const cells = PIECE_ROTATIONS[p.type][p.rot];

  if (!collides(board, cells, nx, ny)) {
    p.x = nx;
    p.y = ny;
    if (dx !== 0) {
      sfx.move();
    }
    resetLockIfGrounded(board);
    return true;
  }
  return false;
}

function tryRotate(board, dir) {
  const p = board.current;
  const nrot = (p.rot + dir + 4) % 4;
  const cells = PIECE_ROTATIONS[p.type][nrot];

  for (let i = 0; i < KICK_OFFSETS.length; i++) {
    const ox = KICK_OFFSETS[i][0];
    const oy = KICK_OFFSETS[i][1];
    if (!collides(board, cells, p.x + ox, p.y + oy)) {
      p.rot = nrot;
      p.x += ox;
      p.y += oy;
      sfx.rotate();
      resetLockIfGrounded(board);
      return true;
    }
  }
  return false;
}

function isGrounded(board) {
  const p = board.current;
  const cells = PIECE_ROTATIONS[p.type][p.rot];
  return collides(board, cells, p.x, p.y + 1);
}

function resetLockIfGrounded(board) {
  if (isGrounded(board) && board.lockResets < MAX_LOCK_RESETS) {
    board.lockTimer = 0;
    board.lockResets++;
  }
}

function hardDrop(board) {
  const p = board.current;
  const cells = PIECE_ROTATIONS[p.type][p.rot];
  let dy = 0;

  while (!collides(board, cells, p.x, p.y + dy + 1)) {
    dy++;
  }
  p.y += dy;
  board.score += dy * 2;
  lockPiece(board);
}

function holdPiece(board) {
  if (board.holdUsed) {
    return;
  }
  board.holdUsed = true;
  const cur = board.current.type;

  if (board.hold === null) {
    board.hold = cur;
    spawnPiece(board);
    board.holdUsed = true; // spawnPiece가 초기화하므로 다시 true로 고정
  } else {
    const swap = board.hold;
    board.hold = cur;
    board.current = {
      type: swap,
      rot: 0,
      x: 3,
      y: -1,
      cells: PIECE_ROTATIONS[swap][0]
    };
    board.lockTimer = 0;
    board.lockResets = 0;
  }
}

function lockPiece(board) {
  const cells = pieceCells(board);
  for (let i = 0; i < cells.length; i++) {
    const x = cells[i][0];
    const y = cells[i][1];
    if (y >= 0) {
      board.grid[y][x] = board.current.type;
    }
  }
  sfx.lock();

  const cleared = clearLines(board);
  if (cleared.length > 0) {
    handleLinesCleared(board, cleared.length);
  }

  if (board.grid[0].some(function (c) { return !!c; })) {
    board.gameOver = true;
    return;
  }
  spawnPiece(board);
}

function clearLines(board) {
  const cleared = [];
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board.grid[y].every(function (c) { return !!c; })) {
      cleared.push(y);
    }
  }

  if (cleared.length > 0) {
    board.grid = board.grid.filter(function (row, y) {
      return cleared.indexOf(y) === -1;
    });
    while (board.grid.length < ROWS) {
      board.grid.unshift(new Array(COLS).fill(null));
    }
    sfx.clear(cleared.length);
  }
  return cleared;
}

function handleLinesCleared(board, n) {
  const scoreTable = { 1: 100, 2: 300, 3: 500, 4: 800 };
  board.score += (scoreTable[n] || 0) * board.level;
  board.lines += n;
  board.level = 1 + Math.floor(board.lines / 10);
  board.dropInterval = Math.max(120, BASE_DROP_MS - (board.level - 1) * 70);

  if (board.itemMode) {
    const before = Math.floor((board.lines - n) / ITEM_SPAWN_EVERY_LINES);
    const after = Math.floor(board.lines / ITEM_SPAWN_EVERY_LINES);
    if (after > before && !board.item) {
      grantRandomItem(board);
    }
  }

  if (App.mode === 'duo' || App.mode === 'item' || App.mode === 'online') {
    const garbage = n >= 2 ? n - 1 : 0;
    if (garbage > 0) {
      sendGarbageToOpponent(board, garbage);
    }
  }
}

function addGarbageLines(board, count) {
  if (board.shield > 0) {
    board.shield--;
    showToast('방어 성공! 공격을 막았습니다');
    return;
  }

  for (let i = 0; i < count; i++) {
    board.grid.shift();
    const hole = Math.floor(Math.random() * COLS);
    const row = new Array(COLS).fill('G');
    row[hole] = null;
    board.grid.push(row);
  }

  if (board.grid[0].some(function (c) { return !!c; })) {
    board.gameOver = true;
  }
}
