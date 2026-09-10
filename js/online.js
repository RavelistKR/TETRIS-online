// js/online.js
// 통신사 이동통신망(4G/5G)처럼 서로 다른 네트워크 간에는 STUN만으로는
// P2P 직접 연결이 실패하는 경우가 많아, TURN(중계) 서버를 반드시 추가해야 합니다.
// 아래는 metered.ca에서 발급받은 전용 TURN 자격증명을 사용한 설정입니다.
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: '4049c8339e5df0cb85ecd0ae',
      credential: 'y1x/uVP6elqJeFHM'
    },
    {
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username: '4049c8339e5df0cb85ecd0ae',
      credential: 'y1x/uVP6elqJeFHM'
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: '4049c8339e5df0cb85ecd0ae',
      credential: 'y1x/uVP6elqJeFHM'
    },
    {
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username: '4049c8339e5df0cb85ecd0ae',
      credential: 'y1x/uVP6elqJeFHM'
    }
  ]
};

const PEER_OPTIONS = { config: ICE_CONFIG };

let connectTimeoutTimer = null;

function clearConnectTimeout() {
  if (connectTimeoutTimer) {
    clearTimeout(connectTimeoutTimer);
    connectTimeoutTimer = null;
  }
}

function startConnectTimeout(statusEl) {
  clearConnectTimeout();
  connectTimeoutTimer = setTimeout(function () {
    if (!App.online.connected) {
      statusEl.textContent = '연결 시간 초과. 같은 Wi-Fi인지, 코드가 정확한지 확인 후 다시 시도해주세요.';
    }
  }, 30000);
}

function createRoom(itemsEnabled) {
  App.itemsEnabled = itemsEnabled;
  const code = String(Math.floor(10000 + Math.random() * 90000));
  App.online.roomCode = code;
  App.online.isHost = true;
  App.online.peer = new Peer('tet-' + code, PEER_OPTIONS);

  const statusEl = document.getElementById('onlineStatus');
  statusEl.textContent = '연결 준비 중...';

  App.online.peer.on('open', function () {
    document.getElementById('roomCodeDisplay').style.display = 'block';
    document.getElementById('roomCodeDisplay').textContent = code;
    statusEl.textContent = '상대방이 코드를 입력해 접속하기를 기다리는 중...';
    startConnectTimeout(statusEl);
  });

  App.online.peer.on('connection', function (conn) {
    App.online.conn = conn;
    setupOnlineConn(conn, statusEl, function () {
      conn.send({ type: 'start', itemsEnabled: App.itemsEnabled });
      startGame('online', App.itemsEnabled, false);
    });
  });

  App.online.peer.on('error', function (err) {
    clearConnectTimeout();
    statusEl.textContent = '오류: ' + err.type + ' (같은 코드로 이미 방이 열려있거나 네트워크 문제일 수 있습니다)';
  });

  App.online.peer.on('disconnected', function () {
    statusEl.textContent = '서버와 연결이 끊어졌습니다. 재접속 시도 중...';
    if (App.online.peer && !App.online.peer.destroyed) {
      App.online.peer.reconnect();
    }
  });
}

function joinRoom(code, itemsEnabled) {
  App.online.isHost = false;
  App.online.peer = new Peer(PEER_OPTIONS);

  const statusEl = document.getElementById('onlineStatus');
  statusEl.textContent = '연결 중...';

  App.online.peer.on('open', function () {
    const conn = App.online.peer.connect('tet-' + code, { reliable: true });
    App.online.conn = conn;
    startConnectTimeout(statusEl);

    conn.on('error', function (err) {
      statusEl.textContent = '연결 실패: ' + (err.type || err.message || '알 수 없는 오류');
    });

    setupOnlineConn(conn, statusEl, function () {
      statusEl.textContent = '연결됨. 방장이 게임을 시작하면 자동으로 시작됩니다.';
    });
  });

  App.online.peer.on('error', function (err) {
    clearConnectTimeout();
    statusEl.textContent = '연결 실패: ' + err.type + ' (방 코드를 다시 확인해주세요)';
  });
}

function setupOnlineConn(conn, statusEl, onOpen) {
  conn.on('open', function () {
    clearConnectTimeout();
    App.online.connected = true;
    document.getElementById('onlinePingStatus').style.display = 'inline';
    document.getElementById('onlinePingStatus').textContent = '온라인 연결됨';

    // 진단용 로그: 문제가 생기면 콘솔에서 원인을 바로 확인할 수 있습니다.
    if (conn.peerConnection) {
      conn.peerConnection.oniceconnectionstatechange = function () {
        console.log('[online] ICE state:', conn.peerConnection.iceConnectionState);
      };
      conn.peerConnection.onicecandidateerror = function (e) {
        console.warn('[online] ICE candidate error:', e.errorText, e.url);
      };
    }

    if (onOpen) {
      onOpen();
    }
  });

  conn.on('data', function (msg) {
    handleOnlineMessage(msg);
  });

  conn.on('close', function () {
    document.getElementById('onlinePingStatus').textContent = '연결 끊김';
    if (App.active) {
      endMatch('상대방 연결 끊김');
    }
  });

  conn.on('error', function (err) {
    if (statusEl) {
      statusEl.textContent = '연결 중 오류: ' + (err.type || err.message || '알 수 없는 오류');
    }
  });
}

function handleOnlineMessage(msg) {
  if (msg.type === 'start') {
    App.itemsEnabled = msg.itemsEnabled;
    startGame('online', App.itemsEnabled, false);
  } else if (msg.type === 'snap') {
    const rb = App.boards.p2;
    if (!rb) {
      return;
    }
    rb.grid = msg.grid;
    rb.current = msg.current;
    rb.score = msg.score;
    const el = document.getElementById('scoreP2');
    if (el) {
      el.textContent = msg.score;
    }
  } else if (msg.type === 'garbage') {
    addGarbageLines(App.boards.p1, msg.count);
  } else if (msg.type === 'item') {
    if (msg.item !== 'shield') {
      applyItemEffect(msg.item, App.boards.p1);
    }
  } else if (msg.type === 'gameover') {
    endMatch('승리했습니다!');
  }
}

function sendOnlineMessage(obj) {
  if (App.online.conn && App.online.connected) {
    App.online.conn.send(obj);
  }
}

let lastSnapTs = 0;

function throttledSnapshot(board) {
  const now = Date.now();
  if (now - lastSnapTs < 100) {
    return;
  }
  lastSnapTs = now;
  sendOnlineSnapshot(board);
}

function sendOnlineSnapshot(board) {
  sendOnlineMessage({
    type: 'snap',
    grid: board.grid,
    current: board.current,
    score: board.score
  });
}

function sendGarbageToOpponent(board, count) {
  if (App.mode === 'online') {
    sendOnlineMessage({ type: 'garbage', count: count });
  } else {
    const opp = board.id === 'p1' ? App.boards.p2 : App.boards.p1;
    if (opp) {
      addGarbageLines(opp, count);
    }
  }
}

function sendOnlineItem(type) {
  sendOnlineMessage({ type: 'item', item: type });
}

function teardownOnline() {
  clearConnectTimeout();
  if (App.online.conn) {
    App.online.conn.close();
  }
  if (App.online.peer) {
    App.online.peer.destroy();
  }
  App.online = {
    peer: null,
    conn: null,
    isHost: false,
    roomCode: null,
    connected: false
  };
  document.getElementById('roomCodeDisplay').style.display = 'none';
  document.getElementById('onlinePingStatus').style.display = 'none';
}
