function makeBag() {
  const bag = PIECE_TYPES.slice();
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = bag[i];
    bag[i] = bag[j];
    bag[j] = tmp;
  }
  return bag;
}

function nextFromQueue(board) {
  if (board.bag.length === 0) {
    board.bag = makeBag();
  }
  return board.bag.shift();
}

function refillQueue(board) {
  while (board.queue.length < 3) {
    board.queue.push(nextFromQueue(board));
  }
}

function spawnPiece(board) {
  refillQueue(board);
  const type = board.queue.shift();
  refillQueue(board);

  board.current = {
    type: type,
    rot: 0,
    x: 3,
    y: -1,
    cells: PIECE_ROTATIONS[type][0]
  };
  board.holdUsed = false;
  board.lockTimer = 0;
  board.lockResets = 0;

  if (collides(board, board.current.cells, board.current.x, board.current.y)) {
    board.gameOver = true;
  }
}

function pieceCells(board) {
  const p = board.current;
  return PIECE_ROTATIONS[p.type][p.rot].map(function (cell) {
    return [cell[0] + p.x, cell[1] + p.y];
  });
}
