(() => {
  "use strict";

  const recordKey = "oshigotoAiReadyBreakerV1";
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");
  const stage = document.getElementById("stage");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const startButton = document.getElementById("startButton");
  const leftButton = document.getElementById("leftButton");
  const rightButton = document.getElementById("rightButton");
  const scoreText = document.getElementById("score");
  const livesText = document.getElementById("lives");
  const bestText = document.getElementById("best");
  const attemptsText = document.getElementById("attempts");
  const feedback = document.getElementById("feedback");
  const soundToggle = document.getElementById("soundToggle");

  const state = {
    running: false,
    score: 0,
    lives: 3,
    paddleX: 140,
    move: 0,
    ball: { x: 180, y: 445, vx: 165, vy: -225, radius: 7 },
    bricks: [],
    frame: 0,
    previousTime: 0
  };

  let soundOn = true;
  let audioContext = null;

  const todayKey = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const loadRecords = () => {
    try {
      const value = JSON.parse(localStorage.getItem(recordKey) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  };

  const saveRecords = (records) => {
    try {
      localStorage.setItem(recordKey, JSON.stringify(records));
    } catch {
      feedback.textContent = "この環境では記録を保存できませんが、ゲームは続けられます。";
    }
  };

  const entryForToday = () => {
    const records = loadRecords();
    const day = todayKey();
    const entry = records[day] && typeof records[day] === "object" ? records[day] : { attempts: 0, best: 0 };
    entry.attempts = Math.max(0, Math.min(3, Number(entry.attempts) || 0));
    entry.best = Math.max(0, Number(entry.best) || 0);
    records[day] = entry;
    return { records, entry };
  };

  const tone = (kind) => {
    if (!soundOn) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = kind === "miss" ? "square" : "sine";
      oscillator.frequency.value = kind === "brick" ? 590 : kind === "miss" ? 130 : 350;
      gain.gain.setValueAtTime(0.07, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.11);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.12);
    } catch {
      // 音が使えない環境でもゲームは続けます。
    }
  };

  const refreshRecord = () => {
    const { entry } = entryForToday();
    bestText.textContent = String(entry.best);
    attemptsText.textContent = `${entry.attempts} / 3`;
    const limited = entry.attempts >= 3;
    startButton.disabled = limited;
    startButton.textContent = limited ? "本日は3回実施済み" : entry.attempts ? "もう一度練習する" : "練習を開始";
    if (limited && !state.running) {
      overlayTitle.textContent = "今日はここまで";
      overlayText.textContent = `今日の最高は ${entry.best}個です。続きは明日行えます。`;
    }
  };

  const updateStatus = () => {
    scoreText.textContent = String(state.score);
    livesText.textContent = `${state.lives}機`;
    refreshRecord();
  };

  const makeBricks = () => {
    const colors = ["#16835f", "#f4bd37", "#7453a6", "#d7782f", "#2f7fb3", "#57a66f"];
    state.bricks = [];
    const columns = 8;
    const rows = 6;
    const width = 38;
    const height = 18;
    const gap = 5;
    const startX = 10;
    const startY = 42;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        state.bricks.push({
          x: startX + column * (width + gap),
          y: startY + row * (height + gap),
          width,
          height,
          color: colors[row % colors.length],
          active: true
        });
      }
    }
  };

  const resetBall = () => {
    const direction = Math.random() < 0.5 ? -1 : 1;
    state.ball = { x: 180, y: 445, vx: 165 * direction, vy: -225, radius: 7 };
    state.paddleX = 140;
  };

  const draw = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f9fffc";
    context.fillRect(0, 0, canvas.width, canvas.height);

    state.bricks.forEach((brick) => {
      if (!brick.active) return;
      context.fillStyle = brick.color;
      context.strokeStyle = "#17352b";
      context.lineWidth = 2;
      context.beginPath();
      context.roundRect(brick.x, brick.y, brick.width, brick.height, 5);
      context.fill();
      context.stroke();
    });

    context.fillStyle = "#17352b";
    context.beginPath();
    context.roundRect(state.paddleX, 478, 80, 14, 7);
    context.fill();

    context.fillStyle = "#d7782f";
    context.strokeStyle = "#17352b";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  };

  const finish = (cleared = false) => {
    state.running = false;
    cancelAnimationFrame(state.frame);
    const { records, entry } = entryForToday();
    entry.best = Math.max(entry.best, state.score);
    saveRecords(records);
    updateStatus();
    overlay.hidden = false;
    overlayTitle.textContent = cleared ? "全部クリア！" : "おつかれさまでした";
    overlayText.textContent = `今回は ${state.score}個、今日の最高は ${entry.best}個です。`;
    feedback.textContent = "速さや得点ではなく、無理のない範囲で取り組めたことを振り返りましょう。";
  };

  const loseLife = () => {
    state.lives -= 1;
    tone("miss");
    updateStatus();
    if (state.lives <= 0) {
      finish(false);
      return;
    }
    resetBall();
  };

  const intersects = (ball, brick) => (
    ball.x + ball.radius > brick.x &&
    ball.x - ball.radius < brick.x + brick.width &&
    ball.y + ball.radius > brick.y &&
    ball.y - ball.radius < brick.y + brick.height
  );

  const update = (delta) => {
    const paddleSpeed = 290;
    state.paddleX = Math.max(0, Math.min(canvas.width - 80, state.paddleX + state.move * paddleSpeed * delta));
    const speedScale = 1 + Math.min(0.65, state.score * 0.012);
    const ball = state.ball;
    ball.x += ball.vx * delta * speedScale;
    ball.y += ball.vy * delta * speedScale;

    if (ball.x - ball.radius <= 0 && ball.vx < 0) {
      ball.x = ball.radius;
      ball.vx *= -1;
      tone("wall");
    }
    if (ball.x + ball.radius >= canvas.width && ball.vx > 0) {
      ball.x = canvas.width - ball.radius;
      ball.vx *= -1;
      tone("wall");
    }
    if (ball.y - ball.radius <= 0 && ball.vy < 0) {
      ball.y = ball.radius;
      ball.vy *= -1;
      tone("wall");
    }

    if (
      ball.vy > 0 &&
      ball.y + ball.radius >= 478 &&
      ball.y - ball.radius <= 492 &&
      ball.x >= state.paddleX &&
      ball.x <= state.paddleX + 80
    ) {
      const offset = (ball.x - (state.paddleX + 40)) / 40;
      ball.vx = 210 * offset;
      ball.vy = -Math.max(190, Math.abs(ball.vy));
      ball.y = 470;
      tone("wall");
    }

    for (const brick of state.bricks) {
      if (!brick.active || !intersects(ball, brick)) continue;
      brick.active = false;
      state.score += 1;
      ball.vy *= -1;
      tone("brick");
      updateStatus();
      break;
    }

    if (state.bricks.length && state.bricks.every((brick) => !brick.active)) {
      finish(true);
      return;
    }

    if (ball.y - ball.radius > canvas.height) loseLife();
  };

  const frame = (time) => {
    if (!state.running) return;
    const delta = Math.min(0.025, (time - state.previousTime) / 1000 || 0);
    state.previousTime = time;
    update(delta);
    draw();
    if (state.running) state.frame = requestAnimationFrame(frame);
  };

  const start = () => {
    const { records, entry } = entryForToday();
    if (entry.attempts >= 3 || state.running) return;
    entry.attempts += 1;
    saveRecords(records);
    Object.assign(state, { running: true, score: 0, lives: 3, move: 0, previousTime: 0 });
    makeBricks();
    resetBall();
    overlay.hidden = true;
    feedback.textContent = "画面を左右になぞるか、左右ボタン・矢印キーでバーを動かします。";
    updateStatus();
    draw();
    state.frame = requestAnimationFrame(frame);
  };

  const setPaddleFromPointer = (event) => {
    if (!state.running) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    state.paddleX = Math.max(0, Math.min(canvas.width - 80, x - 40));
  };

  const bindMoveButton = (button, direction) => {
    const begin = (event) => {
      event.preventDefault();
      state.move = direction;
    };
    const end = (event) => {
      event.preventDefault();
      if (state.move === direction) state.move = 0;
    };
    button.addEventListener("pointerdown", begin);
    button.addEventListener("pointerup", end);
    button.addEventListener("pointercancel", end);
    button.addEventListener("pointerleave", end);
  };

  startButton.addEventListener("click", start);
  stage.addEventListener("pointerdown", setPaddleFromPointer);
  stage.addEventListener("pointermove", (event) => {
    if (event.buttons || event.pointerType === "touch") setPaddleFromPointer(event);
  });
  bindMoveButton(leftButton, -1);
  bindMoveButton(rightButton, 1);

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") state.move = -1;
    if (event.key === "ArrowRight") state.move = 1;
  });
  document.addEventListener("keyup", (event) => {
    if ((event.key === "ArrowLeft" && state.move < 0) || (event.key === "ArrowRight" && state.move > 0)) state.move = 0;
  });

  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    soundToggle.textContent = `効果音：${soundOn ? "オン" : "オフ"}`;
  });

  window.addEventListener("storage", refreshRecord);
  makeBricks();
  resetBall();
  draw();
  updateStatus();
})();
