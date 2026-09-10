function drawMini(canvas, type) {
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!type) {
    return;
  }

  const b = canvas.width / 4;
  const cells = PIECE_ROTATIONS[type][0];
  ctx.fillStyle = COLORS[type];
  for (let i = 0; i < cells.length; i++) {
    const x = cells[i][0];
    const y = cells[i][1];
    ctx.fillRect(x * b, y * b, b - 1, b - 1);
  }
}

function drawBoard(board) {
  const ctx = board.ctx;
  if (!ctx) {
    return;
  }

  const w = COLS * BLOCK;
  const h = ROWS * BLOCK;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(120,180,255,.06)';
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK, 0);
    ctx.lineTo(x * BLOCK, h);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK);
    ctx.lineTo(w, y * BLOCK);
    ctx.stroke();
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const v = board.grid[y][x];
      if (v) {
        ctx.fillStyle = COLORS[v] || COLORS.G;
        ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
      }
    }
  }

  if (board.current) {
    const p = board.current;
    const cells = PIECE_ROTATIONS[p.type][p.rot];

    if (!board.isRemoteView) {
      let ghostY = p.y;
      while (!collides(board, cells, p.x, ghostY + 1)) {
        ghostY++;
      }
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = COLORS[p.type];
      for (let i = 0; i < cells.length; i++) {
        const gy = ghostY + cells[i][1];
        if (gy >= 0) {
          ctx.fillRect((p.x + cells[i][0]) * BLOCK + 1, gy * BLOCK + 1, BLOCK - 2, BLOCK - 2);
        }
      }
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = COLORS[p.type];
    for (let i = 0; i < cells.length; i++) {
      const gy = p.y + cells[i][1];
      if (gy >= 0) {
        ctx.fillRect((p.x + cells[i][0]) * BLOCK + 1, gy * BLOCK + 1, BLOCK - 2, BLOCK - 2);
      }
    }
  }

  if (board.fogUntil && Date.now() < board.fogUntil) {
    ctx.fillStyle = 'rgba(200,210,230,.55)';
    ctx.fillRect(0, 0, w, h);
  }
}

function drawSidePanels(board) {
  if (board.holdCanvas) {
    drawMini(board.holdCanvas, board.hold);
  }
  if (board.nextCanvases) {
    for (let i = 0; i < board.nextCanvases.length; i++) {
      drawMini(board.nextCanvases[i], board.queue[i]);
    }
  }
}

function renderAll() {
  Object.keys(App.boards).forEach(function (key) {
    const b = App.boards[key];
    if (b) {
      drawBoard(b);
      drawSidePanels(b);
    }
  });
}
