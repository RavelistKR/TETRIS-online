const DEFAULT_KEYS_P1 = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  soft: 'ArrowDown',
  hard: 'ArrowUp',
  cw: 'KeyX',
  ccw: 'KeyZ',
  hold: 'KeyC',
  item: 'ShiftRight',
  pause: 'Escape'
};

const DEFAULT_KEYS_P2 = {
  left: 'KeyA',
  right: 'KeyD',
  soft: 'KeyS',
  hard: 'KeyW',
  cw: 'KeyE',
  ccw: 'KeyQ',
  hold: 'KeyF',
  item: 'ShiftLeft',
  pause: 'Escape'
};

let KEYS_P1 = Object.assign({}, DEFAULT_KEYS_P1);
let KEYS_P2 = Object.assign({}, DEFAULT_KEYS_P2);

function loadKeysFromStorage() {
  try {
    const savedP1 = JSON.parse(localStorage.getItem('tetris_keys_p1') || 'null');
    const savedP2 = JSON.parse(localStorage.getItem('tetris_keys_p2') || 'null');
    if (savedP1) {
      KEYS_P1 = Object.assign({}, DEFAULT_KEYS_P1, savedP1);
    }
    if (savedP2) {
      KEYS_P2 = Object.assign({}, DEFAULT_KEYS_P2, savedP2);
    }
  } catch (e) {
    KEYS_P1 = Object.assign({}, DEFAULT_KEYS_P1);
    KEYS_P2 = Object.assign({}, DEFAULT_KEYS_P2);
  }
}

function saveKeysToStorage() {
  localStorage.setItem('tetris_keys_p1', JSON.stringify(KEYS_P1));
  localStorage.setItem('tetris_keys_p2', JSON.stringify(KEYS_P2));
}

loadKeysFromStorage();
