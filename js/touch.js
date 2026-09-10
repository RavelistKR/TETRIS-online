// js/touch.js - 전체 교체 (keymap.js의 실제 속성명(left/right/soft/hard/cw/ccw/hold)에 맞춰 수정)
(function () {
  // keymap.js의 KEYS_P1 실제 속성 이름과 정확히 일치시킵니다.
  const ACTION_ALIASES = {
    left: ['left'],
    right: ['right'],
    down: ['soft'],
    hardDrop: ['hard'],
    rotateCW: ['cw'],
    rotateCCW: ['ccw'],
    hold: ['hold']
  };
  // 커스텀 키가 아직 없을 때 사용할 기본값도 실제 DEFAULT_KEYS_P1과 동일하게 맞춥니다.
  const FALLBACK_CODE = {
    left: 'ArrowLeft', right: 'ArrowRight', down: 'ArrowDown',
    hardDrop: 'ArrowUp', rotateCW: 'KeyX', rotateCCW: 'KeyZ',
    hold: 'KeyC'
  };

  function resolveCode(action, keys) {
    const names = ACTION_ALIASES[action] || [action];
    if (keys) {
      for (const n of names) {
        if (keys[n]) return keys[n];
      }
    }
    return FALLBACK_CODE[action];
  }

  function fireKey(type, code) {
    document.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));
  }

  function tap(action, keys) {
    const code = resolveCode(action, keys);
    if (!code) return;
    fireKey('keydown', code);
    setTimeout(() => fireKey('keyup', code), 50);
  }

  const SOFT_DROP_INTERVAL = 140; // 값을 늘리면 더 느려짐

  function makeSoftDropRepeater(getCode) {
    let timer = null;
    return {
      start() {
        const code = getCode();
        if (!code) return;
        fireKey('keydown', code);
        clearInterval(timer);
        timer = setInterval(() => fireKey('keydown', code), SOFT_DROP_INTERVAL);
      },
      stop() {
        clearInterval(timer);
        timer = null;
        const code = getCode();
        if (code) fireKey('keyup', code);
      }
    };
  }

  function makeHoldRepeater(getCode, delay = 300, interval = 45) {
    let timer = null, delayTimer = null;
    return {
      start() {
        const code = getCode();
        if (!code) return;
        fireKey('keydown', code);
        clearTimeout(delayTimer);
        clearInterval(timer);
        delayTimer = setTimeout(() => {
          timer = setInterval(() => fireKey('keydown', code), interval);
        }, delay);
      },
      stop() {
        clearTimeout(delayTimer);
        clearInterval(timer);
        timer = null;
        const code = getCode();
        if (code) fireKey('keyup', code);
      }
    };
  }

  function injectStyle() {
    if (document.getElementById('tvStyle')) return;
    const style = document.createElement('style');
    style.id = 'tvStyle';
    style.textContent = `
      .touch-controls{position:fixed;inset:0;z-index:30;pointer-events:none;display:none;}
      body.device-mobile .touch-controls.tv-ready{display:block;}
      .tv-joystick{position:absolute;left:max(env(safe-area-inset-left),16px);bottom:max(env(safe-area-inset-bottom),56px);
        width:clamp(96px,26vmin,140px);height:clamp(96px,26vmin,140px);border-radius:50%;
        background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.18);pointer-events:auto;touch-action:none;}
      .tv-joystick-knob{position:absolute;left:50%;top:50%;width:44%;height:44%;border-radius:50%;
        background:rgba(255,255,255,.35);transform:translate(-50%,-50%);pointer-events:none;}
      .tv-buttons{position:absolute;right:max(env(safe-area-inset-right),16px);bottom:max(env(safe-area-inset-bottom),56px);
        display:grid;grid-template-columns:repeat(2,1fr);gap:10px;pointer-events:auto;}
      .tv-btn{width:clamp(52px,14vmin,68px);height:clamp(52px,14vmin,68px);border-radius:50%;
        background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.2);color:#fff;font-size:.85rem;font-weight:700;
        display:flex;align-items:center;justify-content:center;touch-action:none;font-family:inherit;}
      .tv-btn:active{background:rgba(255,255,255,.25);}
    `;
    document.head.appendChild(style);
  }

  function buildTouchControls(containerId, boardP1, boardP2, itemsEnabled) {
    injectStyle();
    const container = document.getElementById(containerId);
    if (!container) return;

    // 재시작 시 중복 생성 방지
    container.innerHTML = '';
    container.classList.add('tv-ready');

    const keys = (typeof KEYS_P1 !== 'undefined') ? KEYS_P1 : null;

    container.innerHTML = `
      <div class="tv-joystick" id="tvJoystick_${containerId}"><div class="tv-joystick-knob"></div></div>
      <div class="tv-buttons">
        <div class="tv-btn" id="tvHold_${containerId}">HOLD</div>
        <div class="tv-btn" id="tvRotCW_${containerId}">⟳</div>
        <div class="tv-btn" id="tvRotCCW_${containerId}">⟲</div>
        <div class="tv-btn" id="tvHardDrop_${containerId}">⤓</div>
      </div>
    `;

    const repeaters = {
      left: makeHoldRepeater(() => resolveCode('left', keys)),
      right: makeHoldRepeater(() => resolveCode('right', keys)),
      down: makeSoftDropRepeater(() => resolveCode('down', keys))
    };

    const joystick = document.getElementById(`tvJoystick_${containerId}`);
    let originX = 0, originY = 0, active = false, curDir = null;
    const DEAD = 14;

    function setDir(dir) {
      if (curDir === dir) return;
      if (curDir && repeaters[curDir]) repeaters[curDir].stop();
      curDir = dir;
      if (curDir && repeaters[curDir]) repeaters[curDir].start();
    }

    joystick.addEventListener('touchstart', function (e) {
      const t = e.touches[0];
      originX = t.clientX;
      originY = t.clientY;
      active = true;
      curDir = null;
      e.preventDefault();
    }, { passive: false });

    joystick.addEventListener('touchmove', function (e) {
      if (!active) return;
      const t = e.touches[0];
      const dx = t.clientX - originX;
      const dy = t.clientY - originY;

      if (Math.abs(dx) < DEAD && Math.abs(dy) < DEAD) {
        setDir(null);
        e.preventDefault();
        return;
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        setDir(dx > 0 ? 'right' : 'left');
      } else if (dy > 0) {
        setDir('down'); // 아래로만 반응, 느린 소프트드롭
      } else {
        setDir(null); // 위쪽은 아무 동작 없음 (하드드롭 없음)
      }
      e.preventDefault();
    }, { passive: false });

    function endJoystick(e) {
      active = false;
      setDir(null);
      if (e) e.preventDefault();
    }
    joystick.addEventListener('touchend', endJoystick, { passive: false });
    joystick.addEventListener('touchcancel', endJoystick, { passive: false });

    function bindTap(id, action) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', function (e) {
        e.preventDefault();
        tap(action, keys);
      }, { passive: false });
    }
    bindTap(`tvHold_${containerId}`, 'hold');
    bindTap(`tvRotCW_${containerId}`, 'rotateCW');
    bindTap(`tvRotCCW_${containerId}`, 'rotateCCW');
    bindTap(`tvHardDrop_${containerId}`, 'hardDrop');
  }

  function updateTouchVisibility() {
    const mobile = document.body.classList.contains('device-mobile');
    document.querySelectorAll('.touch-controls').forEach(function (el) {
      // 이미 buildTouchControls로 내용이 채워진 컨테이너에 한해 모바일 여부에 맞춰 토글
      el.classList.toggle('tv-ready', mobile && el.children.length > 0);
    });
  }

  window.buildTouchControls = buildTouchControls;
  window.updateTouchVisibility = updateTouchVisibility;
})();
