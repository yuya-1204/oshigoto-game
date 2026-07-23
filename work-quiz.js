(() => {
  "use strict";

  const definitions = {
    mail: {
      title: "依頼メール仕分け",
      lead: "架空の依頼メールを読み、期限に合わせて「今日対応」「今週対応」「参考」に分ける練習です。",
      questions: [
        { title: "件名：明日10時の会議確認", detail: "出席可否を本日17時までに返信してください。", options: ["今日対応", "今週対応", "参考"], correct: 0, explanation: "返信期限が本日17時なので「今日対応」です。" },
        { title: "件名：来月の社内研修", detail: "参加希望者は今週金曜日までに申し込んでください。", options: ["今日対応", "今週対応", "参考"], correct: 1, explanation: "期限が今週金曜日なので「今週対応」です。" },
        { title: "件名：社内報8月号", detail: "新しい福利厚生制度の紹介です。返信や申込みは不要です。", options: ["今日対応", "今週対応", "参考"], correct: 2, explanation: "対応期限や返信がないため「参考」です。" },
        { title: "件名：請求書の金額修正", detail: "本日14時までに金額を修正し、経理担当へ再提出してください。", options: ["今日対応", "今週対応", "参考"], correct: 0, explanation: "再提出期限が本日14時なので「今日対応」です。" },
        { title: "件名：備品棚卸しのお願い", detail: "来週水曜日の集計に向け、担当分を今週中に入力してください。", options: ["今日対応", "今週対応", "参考"], correct: 1, explanation: "担当分の入力期限が今週中なので「今週対応」です。" }
      ]
    },
    check: {
      title: "データ照合チェック",
      lead: "入力元と登録データを見比べ、同じ内容か、確認が必要かを選ぶ練習です。",
      questions: [
        { title: "伝票1｜交通費", detail: "入力元：7/10・A-104・交通費・1,280円\n登録値：7/10・A-104・交通費・1,280円", options: ["一致", "要確認"], correct: 0, explanation: "4項目すべて一致しています。" },
        { title: "伝票2｜書籍費", detail: "入力元：7/11・B-208・書籍費・2,640円\n登録値：7/11・B-208・書籍費・2,460円", options: ["一致", "要確認"], correct: 1, explanation: "金額が2,640円と2,460円で異なります。" },
        { title: "伝票3｜郵送費", detail: "入力元：7/12・C-315・郵送費・840円\n登録値：7/12・C-351・郵送費・840円", options: ["一致", "要確認"], correct: 1, explanation: "社員コードがC-315とC-351で異なります。" },
        { title: "伝票4｜消耗品費", detail: "入力元：7/13・D-402・消耗品費・980円\n登録値：7/13・D-402・消耗品費・980円", options: ["一致", "要確認"], correct: 0, explanation: "4項目すべて一致しています。" },
        { title: "伝票5｜書籍費", detail: "入力元：7/14・E-507・書籍費・1,500円\n登録値：7/14・E-507・郵送費・1,500円", options: ["一致", "要確認"], correct: 1, explanation: "区分が書籍費と郵送費で異なります。" }
      ]
    },
    order: {
      title: "今日の段取りパズル",
      lead: "画面に書かれた期限や確認条件を読み、次に行う手順を選ぶ練習です。",
      questions: [
        { title: "会議資料を作り始める前", detail: "依頼メールには、提出期限と指定テンプレートが書かれています。最初に行うことは？", options: ["すぐ本文を書く", "依頼内容と期限を確認する", "翌日に回す"], correct: 1, explanation: "作業前に依頼内容・期限・指定形式を確認します。" },
        { title: "数値が資料と合わない", detail: "売上表の数値と元データが一致せず、どちらが正しいか判断できません。次に行うことは？", options: ["推測で入力する", "数値を空欄で提出する", "担当者へ確認する"], correct: 2, explanation: "判断できない数値は推測せず、担当者へ確認します。" },
        { title: "資料の更新が終わった", detail: "指定は「共有フォルダへ保存し、完了後に返信」です。次に行うことは？", options: ["保存先とファイル名を確認して保存・返信する", "自分のPCだけに保存する", "返信せず終了する"], correct: 0, explanation: "指定された保存先とファイル名を確認し、保存後に完了返信します。" },
        { title: "2つの依頼が届いた", detail: "Aは本日16時までの修正、Bは来週水曜日までの資料整理です。先に確認するのは？", options: ["Bの資料整理", "Aの本日締切の修正", "どちらも翌日にする"], correct: 1, explanation: "画面上の期限では、本日締切のAを先に確認します。" },
        { title: "社外メールを送る前", detail: "宛先と添付ファイルを指定して送信する作業です。送信直前に行うことは？", options: ["宛先・添付・本文を再確認する", "件名だけ確認する", "確認せず送信する"], correct: 0, explanation: "誤送信を防ぐため、宛先・添付・本文を送信前に確認します。" }
      ]
    }
  };

  const key = document.body.dataset.game;
  const game = definitions[key] || definitions.mail;
  const recordKey = `oshigotoAiReadyQuizV1:${key}`;
  const title = document.querySelector("[data-game-title]");
  const lead = document.querySelector("[data-game-lead]");
  const startPanel = document.getElementById("startPanel");
  const playPanel = document.getElementById("playPanel");
  const resultPanel = document.getElementById("resultPanel");
  const startButton = document.getElementById("startButton");
  const replayButton = document.getElementById("replayButton");
  const progressText = document.getElementById("progressText");
  const progressBar = document.getElementById("progressBar");
  const questionTitle = document.getElementById("questionTitle");
  const questionDetail = document.getElementById("questionDetail");
  const choices = document.getElementById("choices");
  const feedback = document.getElementById("feedback");
  const nextButton = document.getElementById("nextButton");
  const scoreText = document.getElementById("scoreText");
  const resultText = document.getElementById("resultText");
  const bestText = document.getElementById("bestText");
  const soundToggle = document.getElementById("soundToggle");

  let index = 0;
  let correct = 0;
  let answered = false;
  let soundOn = true;
  let audioContext = null;

  const todayKey = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const loadRecord = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(recordKey) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch {
      return {};
    }
  };

  const beep = (good) => {
    if (!soundOn) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = good ? "sine" : "square";
      oscillator.frequency.value = good ? 660 : 180;
      gain.gain.setValueAtTime(0.08, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.16);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.17);
    } catch {
      // 音が使えない環境でもゲームは続けられます。
    }
  };

  const showPanel = (panel) => {
    [startPanel, playPanel, resultPanel].forEach((item) => {
      item.hidden = item !== panel;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderQuestion = () => {
    const question = game.questions[index];
    answered = false;
    progressText.textContent = `${index + 1} / ${game.questions.length}`;
    progressBar.style.width = `${(index / game.questions.length) * 100}%`;
    questionTitle.textContent = question.title;
    questionDetail.textContent = question.detail;
    feedback.textContent = "";
    feedback.className = "feedback";
    nextButton.hidden = true;
    choices.replaceChildren();

    question.options.forEach((option, optionIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.textContent = option;
      button.addEventListener("click", () => answer(optionIndex, button));
      choices.append(button);
    });
  };

  const answer = (optionIndex, button) => {
    if (answered) return;
    answered = true;
    const question = game.questions[index];
    const good = optionIndex === question.correct;
    const buttons = [...choices.querySelectorAll("button")];
    buttons.forEach((item, itemIndex) => {
      item.disabled = true;
      if (itemIndex === question.correct) item.classList.add("correct");
    });
    if (!good) button.classList.add("incorrect");
    if (good) correct += 1;
    beep(good);
    feedback.textContent = `${good ? "正解です。" : "確認しましょう。"} ${question.explanation}`;
    feedback.className = `feedback ${good ? "good" : "bad"}`;
    nextButton.textContent = index === game.questions.length - 1 ? "結果を見る" : "次の問題へ";
    nextButton.hidden = false;
    progressBar.style.width = `${((index + 1) / game.questions.length) * 100}%`;
    nextButton.focus();
  };

  const finish = () => {
    const score = correct * 20;
    const records = loadRecord();
    const day = todayKey();
    records[day] = Math.max(Number(records[day]) || 0, score);
    try {
      localStorage.setItem(recordKey, JSON.stringify(records));
    } catch {
      // 保存できない場合も今回の結果は表示します。
    }
    scoreText.textContent = `${score}点`;
    resultText.textContent = `${game.questions.length}問中 ${correct}問正解でした。速さではなく、確認しながら進めた過程を振り返りましょう。`;
    bestText.textContent = `今日の最高：${records[day]}点`;
    showPanel(resultPanel);
  };

  const start = () => {
    index = 0;
    correct = 0;
    renderQuestion();
    showPanel(playPanel);
  };

  nextButton.addEventListener("click", () => {
    if (!answered) return;
    if (index >= game.questions.length - 1) {
      finish();
      return;
    }
    index += 1;
    renderQuestion();
  });

  startButton.addEventListener("click", start);
  replayButton.addEventListener("click", start);
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    soundToggle.textContent = `効果音：${soundOn ? "オン" : "オフ"}`;
  });

  document.title = `${game.title}｜おしごと練習`;
  title.textContent = game.title;
  lead.textContent = game.lead;
})();
