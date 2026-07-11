const screens = {
  start: document.getElementById("startScreen"),
  countdown: document.getElementById("countdownScreen"),
  cake: document.getElementById("cakeScreen"),
  result: document.getElementById("resultScreen")
};

const startButton = document.getElementById("startButton");
const countdownNumber = document.getElementById("countdownNumber");

const cake = document.getElementById("cake");
const microphoneButton =
  document.getElementById("microphoneButton");
const tapButton =
  document.getElementById("tapButton");

const instructionText =
  document.getElementById("instructionText");
const meterFill =
  document.getElementById("meterFill");
const meterText =
  document.getElementById("meterText");

const replayButton =
  document.getElementById("replayButton");

let audioContext = null;
let analyser = null;
let microphoneStream = null;
let animationFrameId = null;

let candlesAreOut = false;
let microphoneStarted = false;

/*
  息の検知感度。
  小さくすると消えやすく、
  大きくすると強く吹く必要があります。
*/
const BLOW_THRESHOLD = 20;

/*
  一瞬の大きな音だけで消えにくくするため、
  連続してしきい値を超えた回数を数えます。
*/
const REQUIRED_BLOW_FRAMES = 5;

let blowFrameCount = 0;


function showScreen(screenName) {
  Object.values(screens).forEach((screen) => {
    screen.classList.remove("active");
  });

  screens[screenName].classList.add("active");
}


function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}


async function startBirthdayExperience() {
  startButton.disabled = true;

  showScreen("countdown");

  const countdownValues = ["3", "2", "1", "🎂"];

  for (const value of countdownValues) {
    countdownNumber.textContent = value;
    await wait(850);
  }

  showScreen("cake");

  startButton.disabled = false;
}


async function startMicrophone() {
  if (microphoneStarted || candlesAreOut) {
    return;
  }

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    meterText.textContent =
      "このブラウザではマイクを利用できません";

    instructionText.innerHTML =
      "ケーキをタップして<br>ロウソクを消してね";

    return;
  }

  microphoneButton.disabled = true;
  microphoneButton.textContent = "マイクを準備中…";

  try {
    microphoneStream =
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    audioContext = new AudioContextClass();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const source =
      audioContext.createMediaStreamSource(
        microphoneStream
      );

    analyser = audioContext.createAnalyser();

    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.25;

    source.connect(analyser);

    microphoneStarted = true;

    microphoneButton.textContent =
      "🎤 マイク使用中";

    meterText.textContent =
      "iPhoneに向かって、ふーっとしてね";

    instructionText.innerHTML =
      "願いごとをしたら、<br>" +
      "iPhoneに向かって「ふーっ」としてね";

    monitorMicrophone();

  } catch (error) {
    console.error(
      "マイクの開始に失敗しました:",
      error
    );

    microphoneButton.disabled = false;
    microphoneButton.textContent =
      "🎤 もう一度マイクを試す";

    meterText.textContent =
      "マイクを使えませんでした";

    instructionText.innerHTML =
      "マイクを許可するか、<br>" +
      "ケーキをタップして消してね";
  }
}


function monitorMicrophone() {
  if (
    !analyser ||
    candlesAreOut
  ) {
    return;
  }

  const dataArray =
    new Uint8Array(
      analyser.fftSize
    );

  analyser.getByteTimeDomainData(
    dataArray
  );

  let sumOfSquares = 0;

  for (
    let index = 0;
    index < dataArray.length;
    index += 1
  ) {
    const normalizedValue =
      (dataArray[index] - 128) / 128;

    sumOfSquares +=
      normalizedValue *
      normalizedValue;
  }

  const rootMeanSquare =
    Math.sqrt(
      sumOfSquares /
      dataArray.length
    );

  const volumeLevel =
    Math.min(
      100,
      rootMeanSquare * 240
    );

  meterFill.style.width =
    `${volumeLevel}%`;

  if (volumeLevel >= BLOW_THRESHOLD) {
    blowFrameCount += 1;

    meterText.textContent =
      "そのまま、ふーっ！ 💨";
  } else {
    blowFrameCount = Math.max(
      0,
      blowFrameCount - 1
    );

    meterText.textContent =
      "iPhoneに向かって、ふーっとしてね";
  }

  if (
    blowFrameCount >=
    REQUIRED_BLOW_FRAMES
  ) {
    blowOutCandles();
    return;
  }

  animationFrameId =
    requestAnimationFrame(
      monitorMicrophone
    );
}


async function blowOutCandles() {
  if (candlesAreOut) {
    return;
  }

  candlesAreOut = true;

  cake.classList.add("blown-out");

  meterFill.style.width = "100%";
  meterText.textContent =
    "ロウソクが消えたよ！ 🎉";

  microphoneButton.disabled = true;
  tapButton.disabled = true;

  stopMicrophone();

  await wait(900);

  showScreen("result");
  createConfetti();
}


function stopMicrophone() {
  if (animationFrameId) {
    cancelAnimationFrame(
      animationFrameId
    );

    animationFrameId = null;
  }

  if (microphoneStream) {
    microphoneStream
      .getTracks()
      .forEach((track) => {
        track.stop();
      });

    microphoneStream = null;
  }

  if (audioContext) {
    audioContext.close().catch(() => {
      // 終了時のエラーは無視します。
    });

    audioContext = null;
  }

  analyser = null;
  microphoneStarted = false;
}


function createConfetti() {
  const confettiColors = [
    "#ec4899",
    "#c026d3",
    "#fbbf24",
    "#60a5fa",
    "#34d399",
    "#fb7185"
  ];

  const numberOfPieces = 90;

  for (
    let index = 0;
    index < numberOfPieces;
    index += 1
  ) {
    const piece =
      document.createElement("span");

    piece.className =
      "confetti-piece";

    piece.style.left =
      `${Math.random() * 100}vw`;

    piece.style.background =
      confettiColors[
        Math.floor(
          Math.random() *
          confettiColors.length
        )
      ];

    piece.style.animationDuration =
      `${2.6 + Math.random() * 2.4}s`;

    piece.style.animationDelay =
      `${Math.random() * 0.7}s`;

    piece.style.setProperty(
      "--drift",
      `${-120 + Math.random() * 240}px`
    );

    document.body.appendChild(piece);

    window.setTimeout(() => {
      piece.remove();
    }, 6000);
  }
}


function resetBirthdayExperience() {
  stopMicrophone();

  candlesAreOut = false;
  microphoneStarted = false;
  blowFrameCount = 0;

  cake.classList.remove("blown-out");

  meterFill.style.width = "0%";
  meterText.textContent =
    "マイクはまだオフです";

  instructionText.innerHTML =
    "下のボタンを押して、<br>" +
    "iPhoneに向かって「ふーっ」としてね";

  microphoneButton.disabled = false;
  microphoneButton.textContent =
    "🎤 マイクをオンにする";

  tapButton.disabled = false;

  showScreen("start");
}


startButton.addEventListener(
  "click",
  startBirthdayExperience
);

microphoneButton.addEventListener(
  "click",
  startMicrophone
);

tapButton.addEventListener(
  "click",
  blowOutCandles
);

cake.addEventListener(
  "click",
  blowOutCandles
);

cake.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      blowOutCandles();
    }
  }
);

replayButton.addEventListener(
  "click",
  resetBirthdayExperience
);

window.addEventListener(
  "pagehide",
  stopMicrophone
);