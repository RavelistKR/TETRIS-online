const KEY_LABELS = {
  left: '왼쪽',
  right: '오른쪽',
  soft: '소프트 드롭',
  hard: '하드 드롭',
  cw: '시계 회전',
  ccw: '반시계 회전',
  hold: '홀드',
  item: '아이템 사용',
  pause: '일시정지'
};

const KEY_ORDER = ['left', 'right', 'soft', 'hard', 'cw', 'ccw', 'hold', 'item', 'pause'];

let listeningState = null;

function keyLabelText(code) {
  if (!code) {
    return '-';
  }
  let text = code;
  text = text.replace('Arrow', '');
  text = text.replace('Key', '');
  text = text.replace('Digit', '');
  text = text.replace('Left', ' L');
  text = text.replace('Right', ' R');
  return text;
}

function renderKeySettings() {
  renderKeyColumn('p1', KEYS_P1, document.getElementById('keyColP1'));
  renderKeyColumn('p2', KEYS_P2, document.getElementById('keyColP2'));
}

function renderKeyColumn(player, keys, container) {
  container.innerHTML = '';

  KEY_ORDER.forEach(function (action) {
    const row = document.createElement('div');
    row.className = 'key-row';

    const label = document.createElement('span');
    label.className = 'key-label';
    label.textContent = KEY_LABELS[action];

    const badge = document.createElement('button');
    badge.className = 'key-badge';
    badge.textContent = keyLabelText(keys[action]);
    badge.addEventListener('click', function () {
      startListening(player, action, badge);
    });

    row.appendChild(label);
    row.appendChild(badge);
    container.appendChild(row);
  });
}

function cancelListening() {
  if (!listeningState) {
    return;
  }
  document.removeEventListener('keydown', listeningState.handler, true);
  listeningState = null;
  renderKeySettings();
}

function startListening(player, action, badgeEl) {
  cancelListening();

  badgeEl.textContent = '입력 대기...';
  badgeEl.classList.add('listening');

  const handler = function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.code === 'Escape') {
      cancelListening();
      return;
    }

    document.removeEventListener('keydown', handler, true);
    listeningState = null;

    const conflict = findKeyConflict(player, action, e.code);
    if (conflict) {
      showConfirm(conflict + '\n\n그래도 이 키로 설정하시겠습니까?', function () {
        applyKeyBinding(player, action, e.code);
        renderKeySettings();
      }, function () {
        renderKeySettings();
      });
      return;
    }

    applyKeyBinding(player, action, e.code);
    renderKeySettings();
  };

  listeningState = { player: player, action: action, badgeEl: badgeEl, handler: handler };
  document.addEventListener('keydown', handler, true);
}

function findKeyConflict(player, action, code) {
  const own = player === 'p1' ? KEYS_P1 : KEYS_P2;
  for (const act in own) {
    if (act !== action && own[act] === code) {
      return '같은 플레이어의 "' + KEY_LABELS[act] + '" 키와 중복됩니다.';
    }
  }

  const otherPlayer = player === 'p1' ? 'p2' : 'p1';
  const other = player === 'p1' ? KEYS_P2 : KEYS_P1;
  for (const act in other) {
    if (other[act] === code) {
      return (otherPlayer === 'p1' ? 'P1' : 'P2') + '의 "' + KEY_LABELS[act] + '" 키와 중복됩니다.';
    }
  }

  return null;
}

function applyKeyBinding(player, action, code) {
  const target = player === 'p1' ? KEYS_P1 : KEYS_P2;
  target[action] = code;
  saveKeysToStorage();
}

function resetKeysToDefault() {
  cancelListening();
  KEYS_P1 = Object.assign({}, DEFAULT_KEYS_P1);
  KEYS_P2 = Object.assign({}, DEFAULT_KEYS_P2);
  saveKeysToStorage();
  renderKeySettings();
}

function getShowNext() {
  return localStorage.getItem('tetris_show_next') !== 'off';
}

function setShowNext(value) {
  localStorage.setItem('tetris_show_next', value ? 'on' : 'off');
  applyShowNextUI();
}

function applyShowNextUI() {
  const show = getShowNext();
  document.querySelectorAll('.next-preview-panel').forEach(function (el) {
    el.style.display = show ? '' : 'none';
  });
  const check = document.getElementById('showNextCheck');
  if (check) {
    check.checked = show;
  }
}

function getDeviceMode() {
  let mode = localStorage.getItem('tetris_device_mode');
  if (!mode) {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    mode = coarse ? 'mobile' : 'pc';
  }
  return mode;
}

function setDeviceMode(mode) {
  localStorage.setItem('tetris_device_mode', mode);
  applyDeviceModeUI();
  updateTouchVisibility();
  if (App.active) {
    resizeBoards();
  }
}

function applyDeviceModeUI() {
  const mode = getDeviceMode();
  const pcBtn = document.getElementById('deviceModePC');
  const mobileBtn = document.getElementById('deviceModeMobile');
  if (pcBtn && mobileBtn) {
    pcBtn.classList.toggle('active', mode === 'pc');
    mobileBtn.classList.toggle('active', mode === 'mobile');
  }
  applyLayoutClass();
}

function applyLayoutClass() {
  const mode = getDeviceMode();
  document.body.classList.toggle('device-mobile', mode === 'mobile');
  document.body.classList.toggle('device-pc', mode !== 'mobile');
}
