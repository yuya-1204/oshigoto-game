(() => {
  "use strict";

  const recordKey = "oshigotoAiReadyNumberCompareV1";
  const timeText = document.getElementById("time");
  const correctText = document.getElementById("correct");
  const missesText = document.getElementById("misses");
  const bestText = document.getElementById("best");
  const attemptsText = document.getElementById("attempts");
  const prompt = document.getElementById("prompt");
  const leftChoice = document.getElementById("leftChoice");
  const rightChoice = document.getElementById("rightChoice");
  const feedback = document.getElementById("feedback");
  const startButton = document.getElementById("startButton");
  const soundToggle = document.getElementById("soundToggle");

  const state = {
    running: false,
    locked: false,
    remaining: 60,
    correct: 0,
    misses: 0,
    target: "large",
    values: [0, 0],
    timer: 0,
    nextTimer: 0
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

  const tone = (good) => {
    if (!soundOn) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = good ? "sine" : "square";
      oscillator.frequency.value = good ? 680 : 170;
      gain.gain.setValueAtTime(0.08, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.16);
    } catch {
      // 音が使えない環境でもゲームは続けます。
    }
  };

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const expression = (level) => {
    if (level === 0) {
      const value = randomInt(1, 99);
      return { text: String(value), value };
    }
    if (level === 1) {
      const a = randomInt(2, 35);
      const b = randomInt(1, 30);
      return { text: `${a} ＋ ${b}`, value: a + b };
    }
    if (level === 2) {
      const a = randomInt(12, 80);
      const b = randomInt(1, a - 1);
      return { text: `${a} － ${b}`, value: a - b };
    }
    if (level === 3) {
      const a = randomInt(2, 12);
      const b = randomInt(2, 9);
      return { text: `${a} × ${b}`, value: a * b };
    }
    const divisor = randomInt(2, 9);
    const quotient = randomInt(2, 12);
    return { text: `${divisor * quotient} ÷ ${divisor}`, value: quotient };
  };

  const updateStatus = () => {
    const { entry } = entryForToday();
    timeText.textContent = `${state.remaining}秒`;
    correctText.textContent = `${state.correct}回`;
    missesText.textContent = `${state.misses} / 3`;
    bestText.textContent = `${Math.max(entry.best, state.correct)}回`;
    attemptsText.textContent = `今日 ${entry.attempts} / 3回`;
    const limited = entry.attempts >= 3;
    startButton.disabled = limited || state.running;
    startButton.hidden = state.running;
    startButton.textContent = limited ? "本日は3回実施済み" : entry.attempts ? "もう一度練習する" : "練習を開始";
  };

  const saveBest = () => {
    const { records, entry } = entryForToday();
    entry.best = Math.max(entry.best, state.correct);
    saveRecords(records);
  };

  const nextQuestion = (message = "") => {
    if (!state.running) return;
    const level = Math.min(4, Math.floor(state.correct / 5));
    let left = expression(level);
    let right = expression(level);
    let guard = 0;
    while (left.value === right.value && guard < 20) {
      right = expression(level);
      guard += 1;
    }
    state.values = [left.value, right.value];
    state.target = Math.random() < 0.5 ? "large" : "small";
    state.locked = false;
    prompt.textContent = `${state.target === "large" ? "大きい方" : "小さい方"}を選んでください`;
    prompt.style.background = state.target === "large" ? "#0e6549" : "#7453a6";
    leftChoice.textContent = left.text;
    rightChoice.textContent = right.text;
    [leftChoice, rightChoice].forEach((button) => {
      button.disabled = false;
      button.classList.remove("correct", "incorrect");
    });
    feedback.textContent = message || `レベル ${level + 1}｜落ち着いて選びましょう。`;
    feedback.className = "feedback";
    updateStatus();
  };

  const finish = (reason) => {
    if (!state.running) return;
    state.running = false;
    clearInterval(state.timer);
    clearTimeout(state.nextTimer);
    saveBest();
    [leftChoice, rightChoice].forEach((button) => {
      button.disabled = true;
      button.classList.remove("correct", "incorrect");
    });
    prompt.textContent = reason === "misses" ? "3回ミスで終了しました" : "60秒が経過しました";
    feedback.textContent = `今回は ${state.correct}回正解でした。速さより、無理のない範囲で取り組めたことを振り返りましょう。`;
    feedback.className = "feedback good";
    updateStatus();
  };

  const answer = (choiceIndex, button) => {
    if (!state.running || state.locked) return;
    state.locked = true;
    const [left, right] = state.values;
    const correctIndex = state.target === "large" ? (left > right ? 0 : 1) : (left < right ? 0 : 1);
    const good = choiceIndex === correctIndex;
    if (good) {
      state.correct += 1;
      button.classList.add("correct");
      feedback.textContent = "正解です。";
      feedback.className = "feedback good";
    } else {
      state.misses += 1;
      button.classList.add("incorrect");
      (correctIndex === 0 ? leftChoice : rightChoice).classList.add("correct");
      feedback.textContent = `確認しましょう。ミス ${state.misses}回目です。`;
      feedback.className = "feedback bad";
    }
    [leftChoice, rightChoice].forEach((item) => {
      item.disabled = true;
    });
    tone(good);
    saveBest();
    updateStatus();
    if (state.misses >= 3) {
      state.nextTimer = window.setTimeout(() => finish("misses"), 420);
      return;
    }
    state.nextTimer = window.setTimeout(() => nextQuestion(good ? "正解です。次の問題です。" : "次の問題です。"), 420);
  };

  const start = () => {
    const { records, entry } = entryForToday();
    if (entry.attempts >= 3 || state.running) return;
    entry.attempts += 1;
    saveRecords(records);
    clearInterval(state.timer);
    clearTimeout(state.nextTimer);
    Object.assign(state, { running: true, locked: false, remaining: 60, correct: 0, misses: 0 });
    updateStatus();
    nextQuestion();
    state.timer = window.setInterval(() => {
      state.remaining -= 1;
      updateStatus();
      if (state.remaining <= 0) finish("time");
    }, 1000);
  };

  leftChoice.addEventListener("click", () => answer(0, leftChoice));
  rightChoice.addEventListener("click", () => answer(1, rightChoice));
  startButton.addEventListener("click", start);
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    soundToggle.textContent = `効果音：${soundOn ? "オン" : "オフ"}`;
  });
  window.addEventListener("storage", updateStatus);
  updateStatus();
})();
