const COLS = 10;
const ROWS = 25;
let BLOCK = 28;

const COLORS = {
  I: '#2de3ff',
  O: '#ffd166',
  T: '#8b6bff',
  S: '#39ffb0',
  Z: '#ff3d7f',
  J: '#4d7dff',
  L: '#ff9f43',
  G: '#4a4f5e'
};

const PIECE_ROTATIONS = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]]
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]]
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]]
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]]
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]]
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]]
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]]
  ]
};

const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
const KICK_OFFSETS = [[0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [-2, 0], [2, 0]];

const LOCK_DELAY = 500;
const MAX_LOCK_RESETS = 15;
const BASE_DROP_MS = 900;

const ITEM_TYPES = ['bomb', 'attack', 'shield', 'slow', 'fog'];
const ITEM_ICON = { bomb: '💣', attack: '⚔️', shield: '🛡️', slow: '🐌', fog: '🌫️' };
const ITEM_NAME = { bomb: '폭탄', attack: '공격', shield: '방어', slow: '슬로우', fog: '안개' };
const ITEM_SPAWN_EVERY_LINES = 3;
const ITEM_EFFECT_MS = 5000;

const App = {
  mode: null,
  itemsEnabled: false,
  paused: false,
  active: false,
  boards: {},
  keyHandlers: [],
  online: {
    peer: null,
    conn: null,
    isHost: false,
    roomCode: null,
    connected: false
  }
};
