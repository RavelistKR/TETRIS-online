function grantRandomItem(board) {
  const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
  board.item = type;
  updateItemSlotUI(board);
}

function updateItemSlotUI(board) {
  const elId = board.id === 'p1' ? 'itemSlotP1' : 'itemSlotP2';
  const el = document.getElementById(elId);
  if (!el) {
    return;
  }
  el.textContent = board.item ? ITEM_ICON[board.item] : '-';
  el.title = board.item ? ITEM_NAME[board.item] : '';
}

function activateItem(board, opponent) {
  if (!board.item) {
    return;
  }
  const type = board.item;
  board.item = null;
  updateItemSlotUI(board);
  sfx.item();

  if (App.mode === 'online') {
    sendOnlineItem(type);
    return;
  }
  applyItemEffect(type, opponent);
}

function applyItemEffect(type, target) {
  if (!target) {
    return;
  }

  if (type === 'bomb') {
    if (target.shield > 0) {
      target.shield--;
      showToast('방어 성공! 폭탄을 막았습니다');
      return;
    }
    const cx = Math.floor(Math.random() * COLS);
    const cy = Math.floor(ROWS * 0.4 + Math.random() * ROWS * 0.5);
    const cross = [[cx, cy], [cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]];
    for (let i = 0; i < cross.length; i++) {
      const x = cross[i][0];
      const y = cross[i][1];
      if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
        target.grid[y][x] = null;
      }
    }
  } else if (type === 'attack') {
    addGarbageLines(target, 2);
  } else if (type === 'slow') {
    target.slowUntil = Date.now() + ITEM_EFFECT_MS;
  } else if (type === 'fog') {
    target.fogUntil = Date.now() + ITEM_EFFECT_MS;
  }
  // shield 타입은 상대에게 적용하지 않고, 사용한 본인의 board.shield를
  // controls.js / online.js에서 직접 증가시킵니다.
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'fog-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () {
    t.remove();
  }, 1600);
}
