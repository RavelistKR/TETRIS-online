(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'bgCanvas';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  const PIECE_COLORS_LIST = ['#2de3ff', '#ff3d7f', '#8b6bff', '#39ffb0', '#ffd166', '#4d7dff', '#ff9f43'];
  let particles = [];

  function resizeBg() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makeParticle() {
    const size = 14 + Math.random() * 20;
    return {
      x: Math.random() * window.innerWidth,
      y: -size,
      size: size,
      speed: 0.3 + Math.random() * 0.6,
      rot: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.01,
      color: PIECE_COLORS_LIST[Math.floor(Math.random() * PIECE_COLORS_LIST.length)],
      alpha: 0.05 + Math.random() * 0.10
    };
  }

  function initParticles() {
    const count = Math.floor((window.innerWidth * window.innerHeight) / 60000);
    particles = [];
    for (let i = 0; i < count; i++) {
      const p = makeParticle();
      p.y = Math.random() * window.innerHeight;
      particles.push(p);
    }
  }

  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(function (p) {
      p.y += p.speed;
      p.rot += p.rotSpeed;
      if (p.y > canvas.height + p.size) {
        const fresh = makeParticle();
        Object.assign(p, fresh);
        p.y = -p.size;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    requestAnimationFrame(step);
  }

  window.addEventListener('resize', function () {
    resizeBg();
    initParticles();
  });

  resizeBg();
  initParticles();
  requestAnimationFrame(step);
})();
