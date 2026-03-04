const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');

const GRID = 20;        // размер клетки в пикселях
const COLS = canvas.width / GRID;   // 20 колонок
const ROWS = canvas.height / GRID;  // 20 строк

let snake, direction, nextDirection, food, score, highscore, gameLoop, running, paused;

highscore = 0;

function init() {
  snake = [
    { x: 10, y: 10 },
    { x: 9,  y: 10 },
    { x: 8,  y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = score;
  running = false;
  paused = false;
  spawnFood();
  draw();
}

function spawnFood() {
  do {
    food = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function start() {
  if (running) return;
  running = true;
  overlay.classList.add('hidden');
  gameLoop = setInterval(update, 120);
}

function update() {
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  // Стена
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return gameOver();
  }

  // Сам себя
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    if (score > highscore) {
      highscore = score;
      highscoreEl.textContent = highscore;
    }
    spawnFood();
    // Ускорение каждые 5 очков
    if (score % 5 === 0) {
      clearInterval(gameLoop);
      const speed = Math.max(60, 120 - score * 3);
      gameLoop = setInterval(update, speed);
    }
  } else {
    snake.pop();
  }

  draw();
}

function gameOver() {
  clearInterval(gameLoop);
  running = false;
  overlayText.textContent = `Игра окончена! Счёт: ${score}\nПробел — играть снова`;
  overlay.classList.remove('hidden');
  init();
}

function togglePause() {
  if (!running) {
    start();
    return;
  }
  if (paused) {
    paused = false;
    gameLoop = setInterval(update, Math.max(60, 120 - score * 3));
    overlay.classList.add('hidden');
  } else {
    paused = true;
    clearInterval(gameLoop);
    overlayText.textContent = 'Пауза — нажми ПРОБЕЛ';
    overlay.classList.remove('hidden');
  }
}

// ─── Отрисовка ───────────────────────────────────────────────

function draw() {
  // Фон
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Сетка (тонкая)
  ctx.strokeStyle = '#ffffff08';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= canvas.width; x += GRID) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += GRID) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Еда (пульсирующий круг)
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
  const glow = ctx.createRadialGradient(
    food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, 2,
    food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID * (0.6 + pulse * 0.2)
  );
  glow.addColorStop(0, '#ff4f4f');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID * (0.6 + pulse * 0.2), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff4f4f';
  ctx.beginPath();
  ctx.arc(food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Змейка
  snake.forEach((seg, i) => {
    const ratio = 1 - i / snake.length;
    const alpha = 0.4 + ratio * 0.6;

    ctx.fillStyle = i === 0
      ? `rgba(78, 255, 176, ${alpha})`       // голова — ярче
      : `rgba(30, 180, 100, ${alpha * 0.8})`; // тело — темнее

    const pad = i === 0 ? 1 : 2;
    roundRect(ctx,
      seg.x * GRID + pad,
      seg.y * GRID + pad,
      GRID - pad * 2,
      GRID - pad * 2,
      4
    );
    ctx.fill();

    // Глаза у головы
    if (i === 0) {
      ctx.fillStyle = '#000';
      const ex = direction.x, ey = direction.y;
      const cx = seg.x * GRID + GRID / 2;
      const cy = seg.y * GRID + GRID / 2;
      ctx.beginPath();
      ctx.arc(cx + ex * 4 + ey * 3, cy + ey * 4 - ex * 3, 2, 0, Math.PI * 2);
      ctx.arc(cx + ex * 4 - ey * 3, cy + ey * 4 + ex * 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Управление ──────────────────────────────────────────────

document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W':
      if (direction.y !== 1)  nextDirection = { x: 0, y: -1 }; break;
    case 'ArrowDown':  case 's': case 'S':
      if (direction.y !== -1) nextDirection = { x: 0, y:  1 }; break;
    case 'ArrowLeft':  case 'a': case 'A':
      if (direction.x !== 1)  nextDirection = { x: -1, y: 0 }; break;
    case 'ArrowRight': case 'd': case 'D':
      if (direction.x !== -1) nextDirection = { x:  1, y: 0 }; break;
    case ' ':
      e.preventDefault();
      togglePause();
      break;
  }
});

// Мобильные кнопки
document.getElementById('btn-up').onclick    = () => { if (direction.y !== 1)  nextDirection = { x: 0, y: -1 }; start(); };
document.getElementById('btn-down').onclick  = () => { if (direction.y !== -1) nextDirection = { x: 0, y:  1 }; start(); };
document.getElementById('btn-left').onclick  = () => { if (direction.x !== 1)  nextDirection = { x: -1, y: 0 }; start(); };
document.getElementById('btn-right').onclick = () => { if (direction.x !== -1) nextDirection = { x:  1, y: 0 }; start(); };

// Анимация еды
function animateFood() {
  if (!running) draw();
  requestAnimationFrame(animateFood);
}

init();
animateFood();
