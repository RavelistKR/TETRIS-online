let SOUND_ON = localStorage.getItem('tetris_sound') !== 'off';
let audioCtx = null;

function ensureCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function beep(freq, dur, type, vol) {
  if (!SOUND_ON) {
    return;
  }
  type = type || 'sine';
  vol = vol === undefined ? 0.08 : vol;

  const ctx = ensureCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.stop(ctx.currentTime + dur);
}

const sfx = {
  move: function () {
    beep(220, 0.04, 'square', 0.05);
  },
  rotate: function () {
    beep(330, 0.05, 'square', 0.05);
  },
  lock: function () {
    beep(180, 0.06, 'triangle', 0.06);
  },
  clear: function (n) {
    beep(440 + n * 80, 0.15, 'sawtooth', 0.08);
  },
  item: function () {
    beep(600, 0.12, 'sine', 0.1);
  },
  gameover: function () {
    beep(120, 0.4, 'sawtooth', 0.1);
  },
  toggle: function () {
    SOUND_ON = !SOUND_ON;
    localStorage.setItem('tetris_sound', SOUND_ON ? 'on' : 'off');
    return SOUND_ON;
  }
};
