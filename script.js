const screens = {
  opening: document.getElementById("openingScreen"),
  cake: document.getElementById("cakeScreen"),
  gift: document.getElementById("giftScreen"),
  rose: document.getElementById("roseScreen"),
  bouquet: document.getElementById("bouquetScreen"),
  photo: document.getElementById("photoScreen"),
  final: document.getElementById("finalScreen"),
  credit: document.getElementById("creditScreen"),
  letter: document.getElementById("letterScreen"),
  message: document.getElementById("messageScreen"),
  closing: document.getElementById("closingScreen")
};

const startButton = document.getElementById("startButton");

const cakeArea = document.getElementById("cakeArea");
const cakeTapButton = document.getElementById("cakeTapButton");
const microphoneButton = document.getElementById("microphoneButton");
const cakeInstruction = document.getElementById("cakeInstruction");
const meterFill = document.getElementById("meterFill");
const meterText = document.getElementById("meterText");

const giftBox = document.getElementById("giftBox");
const giftMessage = document.getElementById("giftMessage");

const roseGarden = document.getElementById("roseGarden");
const roseCount = document.getElementById("roseCount");
const roseMessage = document.getElementById("roseMessage");
const addRoseButton = document.getElementById("addRoseButton");

const photoButton = document.getElementById("photoButton");
const memoryPhoto = document.getElementById("memoryPhoto");
const photoCaption = document.getElementById("photoCaption");
const photoProgress = document.getElementById("photoProgress");
const nextPhotoButton = document.getElementById("nextPhotoButton");

const creditButton = document.getElementById("creditButton");
const envelope = document.getElementById("envelope");
const replayButton = document.getElementById("replayButton");
const closingReplayButton = document.getElementById("closingReplayButton");
const letterPaper = document.getElementById("letterPaper");
const typewriterTargets = Array.from(document.querySelectorAll(".typewriter-target"));
const typewriterOriginalTexts = typewriterTargets.map((element) => element.innerText.trim());
let typewriterRunId = 0;

let audioContext = null;
let analyser = null;
let microphoneStream = null;
let microphoneAnimationId = null;

let candlesAreOut = false;
let microphoneStarted = false;
let blowFrameCount = 0;

let currentRoseCount = 0;
let currentPhotoIndex = 0;

const BLOW_THRESHOLD = 17;
const REQUIRED_BLOW_FRAMES = 5;


/*
  動画表示用のvideoタグをJavaScriptで自動作成する。
*/
const photoFrame = memoryPhoto.closest(".photo-frame");

const memoryVideo = document.createElement("video");

memoryVideo.id = "memoryVideo";
memoryVideo.muted = true;
memoryVideo.loop = true;
memoryVideo.autoplay = true;
memoryVideo.playsInline = true;

memoryVideo.setAttribute("playsinline", "");
memoryVideo.setAttribute("webkit-playsinline", "");

memoryVideo.preload = "metadata";

memoryVideo.style.display = "none";
memoryVideo.style.width = "100%";
memoryVideo.style.height = "100%";
memoryVideo.style.objectFit = "cover";

photoFrame.appendChild(memoryVideo);


/*
  27本のバラに表示するメッセージ
*/
const roseMessages = [
  "笑顔がかわいいところ",
  "一緒にいると楽しいところ",
  "電話いつもしてくれるところ",
  "頑張り屋なところ",
  "笑い方がかわいいところ",
  "一緒にいると落ち着くところ",
  "話を聞いてくれるところ",
  "いっぱい話してくれるところ",
  "美味しそうに食べるところ",
  "照れた顔がかわいいところ",
  "俺の時間も大切にしてくれるところ",
  "お出かけを楽しんでくれるところ",
  "何気ない時間も楽しくしてくれるところ",
  "かわいい声",
  "一緒に笑えるところ",
  "一緒にいると安心できるところ",
  "思いやりがあるところ",
  "会える日を楽しみにしてくれるところ",
  "頑張っている姿",
  "自分らしくいてくれるところ",
  "ぷんちゃんのこと好きなところ",
  "俺のことも好きでいてくれるところ",
  "俺のことを選んでくれたところ",
  "好きって言ってくれるところ",
  "好きになってくれたこと",
  "いつもそばにいてくれること",
  "いつか一緒にいたいな"
];


/*
  写真と動画の一覧

  type: "image" → 静止画像
  type: "video" → 動画
*/
const photos = [
  {
    type: "image",
    src: "images/IMG_6404.jpg",
    caption: "シール集めまた今後したいなー🍊🍎"
  },
  {
    type: "image",
    src: "images/IMG_6392.jpg",
    caption: "この写真かわいい✨"
  },
  {
    type: "video",
    src: "images/IDFJ5899.mp4",
    caption: "この時も楽しかった📖"
  },
  {
    type: "video",
    src: "images/BNFF6892.mp4",
    caption: "いろんな温泉いこー♨️"
  },
  {
    type: "video",
    src: "images/UHBP2581.mp4",
    caption: "これからもいっぱい思い出作ろねー✨"
  }
];


/*
  画面切り替え
*/
function showScreen(screenName) {
  Object.values(screens).forEach((screen) => {
    screen.classList.remove("active");
  });

  screens[screenName].classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/*
  待機処理
*/
function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}


/*
  花びら演出
*/
function createConfetti(pieceCount = 36) {
  const isSmallScreen =
    window.matchMedia("(max-width: 600px)").matches;

  /*
    iPhoneなどのスマホでは最大30枚、
    PCでは最大42枚に制限する。
  */
  const totalPetals =
    Math.min(
      pieceCount,
      isSmallScreen ? 30 : 42
    );

  const batchSize =
    isSmallScreen ? 5 : 7;

  const batchInterval =
    isSmallScreen ? 170 : 130;

  const petalColors = [
    "#ffd8e4",
    "#ffc4d6",
    "#f5a6c0",
    "#fff6f8",
    "#e982aa"
  ];

  let createdCount = 0;

  function createPetalBatch() {
    const remainingCount =
      totalPetals - createdCount;

    const currentBatchSize =
      Math.min(
        batchSize,
        remainingCount
      );

    for (
      let index = 0;
      index < currentBatchSize;
      index += 1
    ) {
      const petal =
        document.createElement("span");

      petal.className =
        "flower-petal";

      petal.style.left =
        `${Math.random() * 100}vw`;

      petal.style.backgroundColor =
        petalColors[
          Math.floor(
            Math.random() *
            petalColors.length
          )
        ];

      const size =
        10 + Math.random() * 10;

      const direction =
        Math.random() < 0.5
          ? -1
          : 1;

      const firstSway =
        direction *
        (20 + Math.random() * 55);

      const secondSway =
        direction *
        -(15 + Math.random() * 45);

      const finalDrift =
        direction *
        (40 + Math.random() * 120);

      const startRotation =
        Math.floor(
          Math.random() * 120
        );

      const endRotation =
        startRotation +
        direction *
        (280 + Math.random() * 360);

      petal.style.width =
        `${size}px`;

      petal.style.height =
        `${size * (0.62 + Math.random() * 0.18)}px`;

      petal.style.setProperty(
        "--petal-x1",
        `${firstSway}px`
      );

      petal.style.setProperty(
        "--petal-x2",
        `${secondSway}px`
      );

      petal.style.setProperty(
        "--petal-x3",
        `${finalDrift}px`
      );

      petal.style.setProperty(
        "--petal-r0",
        `${startRotation}deg`
      );

      petal.style.setProperty(
        "--petal-r1",
        `${startRotation + direction * 120}deg`
      );

      petal.style.setProperty(
        "--petal-r2",
        `${startRotation + direction * 230}deg`
      );

      petal.style.setProperty(
        "--petal-r3",
        `${endRotation}deg`
      );

      petal.style.animationDuration =
        `${5.2 + Math.random() * 2.8}s`;

      petal.style.animationDelay =
        `${Math.random() * 0.25}s`;

      document.body.appendChild(
        petal
      );

      petal.addEventListener(
        "animationend",
        () => {
          petal.remove();
        },
        {
          once: true
        }
      );
    }

    createdCount += currentBatchSize;

    if (
      createdCount < totalPetals
    ) {
      window.setTimeout(
        createPetalBatch,
        batchInterval
      );
    }
  }

  createPetalBatch();

  createSparkles(
    isSmallScreen
      ? 3
      : Math.max(
          4,
          Math.floor(totalPetals / 10)
        )
  );
}

/*
  キラキラ演出
*/
function createSparkles(sparkleCount = 6) {
  const sparkleSymbols = [
    "✨",
    "✦",
    "⋆"
  ];

  for (
    let index = 0;
    index < sparkleCount;
    index += 1
  ) {
    const sparkle = document.createElement("span");

    sparkle.className = "flower-sparkle";

    sparkle.textContent =
      sparkleSymbols[
        Math.floor(
          Math.random() * sparkleSymbols.length
        )
      ];

    sparkle.style.left =
      `${8 + Math.random() * 84}vw`;

    sparkle.style.top =
      `${10 + Math.random() * 45}vh`;

    sparkle.style.animationDelay =
      `${Math.random() * 0.7}s`;

    document.body.appendChild(sparkle);

    window.setTimeout(() => {
      sparkle.remove();
    }, 2600);
  }
}



function resetClosingScreen() {
  const closingScreen = screens.closing;

  if (!closingScreen) {
    return;
  }

  closingScreen.classList.remove(
    "show-title",
    "show-name",
    "show-signature",
    "show-replay"
  );
}

function showClosingScreen() {
  resetClosingScreen();
  showScreen("closing");

  window.setTimeout(() => {
    screens.closing?.classList.add("show-title");
  }, 250);

  window.setTimeout(() => {
    screens.closing?.classList.add("show-name");
  }, 1250);

  window.setTimeout(() => {
    screens.closing?.classList.add("show-signature");
  }, 3150);

  window.setTimeout(() => {
    createConfetti(15);
  }, 4000);

  window.setTimeout(() => {
    screens.closing?.classList.add("show-replay");
  }, 5200);
}


/*
  手紙のタイプライター表示
*/
function clearTypewriterText() {
  typewriterRunId += 1;
  letterPaper.classList.remove("typing", "typing-complete");
  typewriterTargets.forEach((element) => { element.textContent = ""; });
  replayButton.style.visibility = "hidden";
}

async function typeText(element, text, runId, characterDelay = 52) {
  for (let index = 0; index < text.length; index += 1) {
    if (runId !== typewriterRunId) return false;
    element.textContent += text[index];
    const character = text[index];
    let delay = characterDelay;
    if ("。！？".includes(character)) delay = 260;
    else if (character === "、" || character === "\n") delay = 130;
    await wait(delay);
  }
  return true;
}

async function startLetterTypewriter() {
  clearTypewriterText();
  const runId = typewriterRunId;
  letterPaper.classList.add("typing");

  for (let index = 0; index < typewriterTargets.length; index += 1) {
    const completed = await typeText(
      typewriterTargets[index],
      typewriterOriginalTexts[index],
      runId,
      index === 0 ? 75 : 48
    );
    if (!completed) return;
    await wait(index === 0 ? 380 : 520);
  }

  if (runId !== typewriterRunId) return;
  letterPaper.classList.remove("typing");
  letterPaper.classList.add("typing-complete");
  replayButton.style.visibility = "hidden";
  createSparkles(7);

  await wait(2000);

  if (runId !== typewriterRunId) return;

  showClosingScreen();
}

function openLetter() {
  showScreen("message");
  window.setTimeout(startLetterTypewriter, 450);
}

/*
  オープニング開始
*/
async function startExperience() {
  startButton.disabled = true;

  startButton.textContent =
    "ちょっと待ってね";

  await wait(900);

  showScreen("cake");

  startButton.disabled = false;

  startButton.textContent =
    "物語を始める ▶";
}


/*
  マイク開始
*/
async function startMicrophone() {
  if (
    microphoneStarted ||
    candlesAreOut
  ) {
    return;
  }

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    meterText.textContent =
      "このブラウザではマイクを使えません";

    cakeInstruction.innerHTML =
      "ケーキをタップして<br>" +
      "ロウソクを消してね";

    return;
  }

  microphoneButton.disabled = true;

  microphoneButton.textContent =
    "マイクを準備中…";

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

    audioContext =
      new AudioContextClass();

    if (
      audioContext.state === "suspended"
    ) {
      await audioContext.resume();
    }

    const source =
      audioContext.createMediaStreamSource(
        microphoneStream
      );

    analyser =
      audioContext.createAnalyser();

    analyser.fftSize = 2048;

    analyser.smoothingTimeConstant =
      0.2;

    source.connect(analyser);

    microphoneStarted = true;

    microphoneButton.textContent =
      "🎤 マイク使用中";

    meterText.textContent =
      "iPhoneに向かって、ふーっとしてね";

    monitorMicrophone();
  } catch (error) {
    console.error(
      "マイクの開始に失敗しました:",
      error
    );

    microphoneButton.disabled = false;

    microphoneButton.textContent =
      "🎤 もう一度試す";

    meterText.textContent =
      "マイクを使えませんでした";

    cakeInstruction.innerHTML =
      "マイクを許可するか、<br>" +
      "ケーキをタップして消してね";
  }
}


/*
  マイク音量監視
*/
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
    const normalized =
      (dataArray[index] - 128) / 128;

    sumOfSquares +=
      normalized * normalized;
  }

  const rootMeanSquare =
    Math.sqrt(
      sumOfSquares /
      dataArray.length
    );

  const volume =
    Math.min(
      100,
      rootMeanSquare * 260
    );

  meterFill.style.width =
    `${volume}%`;

  if (
    volume >= BLOW_THRESHOLD
  ) {
    blowFrameCount += 1;

    meterText.textContent =
      "そのまま、ふーっ！ 💨";
  } else {
    blowFrameCount =
      Math.max(
        0,
        blowFrameCount - 1
      );

    meterText.textContent =
      "iPhoneに向かって、ふーってして";
  }

  if (
    blowFrameCount >=
    REQUIRED_BLOW_FRAMES
  ) {
    blowOutCandles();
    return;
  }

  microphoneAnimationId =
    requestAnimationFrame(
      monitorMicrophone
    );
}


/*
  ロウソクを消す
*/
async function blowOutCandles() {
  if (candlesAreOut) {
    return;
  }

  candlesAreOut = true;

  cakeArea.classList.add(
    "blown-out"
  );

  meterFill.style.width =
    "100%";

  meterText.textContent =
    "ロウソク消えたよー 🎉";

  microphoneButton.disabled = true;
  cakeTapButton.disabled = true;

  stopMicrophone();

  createConfetti(55);

  await wait(1600);

  showScreen("gift");
}


/*
  マイク停止
*/
function stopMicrophone() {
  if (microphoneAnimationId) {
    cancelAnimationFrame(
      microphoneAnimationId
    );

    microphoneAnimationId = null;
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
    audioContext
      .close()
      .catch(() => {});

    audioContext = null;
  }

  analyser = null;
  microphoneStarted = false;
}


/*
  プレゼントを開ける
*/
async function openGift() {
  if (
    giftBox.classList.contains(
      "opened"
    )
  ) {
    return;
  }

  giftBox.classList.add(
    "opened"
  );

  if (giftMessage) {
    giftMessage.textContent =
      "まだプレゼントまだあるよー… 🌹";
  }

  createConfetti(40);

  await wait(1900);

  showScreen("rose");
}


/*
  バラを1本ずつ追加
*/
function addRose() {
  if (
    currentRoseCount >= 27
  ) {
    return;
  }

  const rose =
    document.createElement("span");

  rose.className = "rose";
  rose.textContent = "🌹";

  rose.setAttribute(
    "aria-label",
    `${currentRoseCount + 1}本目の赤いバラ`
  );

  roseGarden.appendChild(rose);

  currentRoseCount += 1;

  roseCount.textContent =
    `${currentRoseCount} / 27`;

  roseMessage.textContent =
    roseMessages[
      currentRoseCount - 1
    ];

  if (
    currentRoseCount === 27
  ) {
    addRoseButton.disabled = true;

    addRoseButton.textContent =
      "27本のバラがそろいました 💖";

    window.setTimeout(() => {
      showScreen("bouquet");

      window.setTimeout(() => {
        createConfetti(90);
      }, 300);
    }, 2200);
  }
}


/*
  写真画面開始
*/
function showPhotos() {
  currentPhotoIndex = 0;

  showScreen("photo");

  updatePhoto();
}


/*
  写真・動画を非表示
*/
function hideAllMedia() {
  memoryVideo.pause();

  memoryVideo.style.display =
    "none";

  memoryPhoto.style.display =
    "none";
}


/*
  写真表示
*/
function showImage(item) {
  hideAllMedia();

  memoryPhoto.classList.add(
    "changing"
  );

  memoryPhoto.onload = () => {
    memoryPhoto.classList.remove(
      "changing"
    );
  };

  memoryPhoto.onerror = () => {
    console.error(
      `画像を読み込めませんでした: ${item.src}`
    );

    memoryPhoto.src =
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="600"
          height="800"
        >
          <rect
            width="100%"
            height="100%"
            fill="#f5dce8"
          />

          <text
            x="50%"
            y="45%"
            text-anchor="middle"
            font-size="35"
            fill="#a65d80"
          >
            写真を確認してね
          </text>

          <text
            x="50%"
            y="55%"
            text-anchor="middle"
            font-size="80"
          >
            📷
          </text>
        </svg>
      `);

    memoryPhoto.classList.remove(
      "changing"
    );
  };

  memoryPhoto.src = item.src;

  memoryPhoto.style.display =
    "block";
}


/*
  動画表示
*/
function showVideo(item) {
  hideAllMedia();

  memoryVideo.src = item.src;

  memoryVideo.style.display =
    "block";

  memoryVideo.currentTime = 0;

  memoryVideo.onerror = () => {
    console.error(
      `動画を再生できませんでした: ${item.src}`
    );

    photoCaption.textContent =
      "動画を再生できませんでした。" +
      "MP4形式を確認してね。";
  };

  memoryVideo
    .play()
    .catch((error) => {
      console.warn(
        "動画の自動再生に失敗しました:",
        error
      );

      memoryVideo.controls = true;
    });
}


/*
  写真・動画更新
*/
function updatePhoto() {
  const item =
    photos[currentPhotoIndex];

  if (!item) {
    return;
  }

  photoCaption.textContent =
    item.caption;

  photoProgress.textContent =
    `${currentPhotoIndex + 1} / ${photos.length}`;

  if (
    item.type === "video"
  ) {
    showVideo(item);
  } else {
    showImage(item);
  }

  if (
    currentPhotoIndex ===
    photos.length - 1
  ) {
    nextPhotoButton.textContent =
      "最後のメッセージへ 💖";
  } else {
    nextPhotoButton.textContent =
      "次の思い出へ →";
  }
}


/*
  次の写真・動画へ
*/
function showNextPhoto() {
  memoryVideo.pause();

  if (
    currentPhotoIndex <
    photos.length - 1
  ) {
    currentPhotoIndex += 1;

    updatePhoto();

    return;
  }

  createConfetti(75);

  showScreen("final");
}


/*
  エンドロール開始
*/
function startCredits() {
  showScreen("credit");

  window.setTimeout(() => {
    showScreen("letter");
  }, 16000);
}


/*
  最初からやり直す
*/
function resetExperience() {
  stopMicrophone();

  memoryVideo.pause();

  memoryVideo.removeAttribute(
    "src"
  );

  memoryVideo.load();

  memoryVideo.controls = false;

  candlesAreOut = false;
  microphoneStarted = false;
  blowFrameCount = 0;

  currentRoseCount = 0;
  currentPhotoIndex = 0;

  cakeArea.classList.remove(
    "blown-out"
  );

  meterFill.style.width =
    "0%";

  meterText.textContent =
    "マイクはまだオフです";

  microphoneButton.disabled =
    false;

  microphoneButton.textContent =
    "🎤 マイクをオンにする";

  cakeTapButton.disabled =
    false;

  giftBox.classList.remove(
    "opened"
  );

  if (giftMessage) {
    giftMessage.textContent =
      "🎁";
  }

  roseGarden.innerHTML = "";

  roseCount.textContent =
    "0 / 27";

  roseMessage.textContent =
    "1本ずつ気持ちを込めて作ってみた";

  addRoseButton.disabled =
    false;

  addRoseButton.textContent =
    "🌹 バラを受け取る 🌹";

  clearTypewriterText();
  resetClosingScreen();
  showScreen("opening");
}


/*
  イベント設定
*/
startButton.addEventListener(
  "click",
  startExperience
);

microphoneButton.addEventListener(
  "click",
  startMicrophone
);

cakeTapButton.addEventListener(
  "click",
  blowOutCandles
);

cakeArea.addEventListener(
  "click",
  blowOutCandles
);

cakeArea.addEventListener(
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

giftBox.addEventListener(
  "click",
  openGift
);

addRoseButton.addEventListener(
  "click",
  addRose
);

photoButton.addEventListener(
  "click",
  showPhotos
);

nextPhotoButton.addEventListener(
  "click",
  showNextPhoto
);

creditButton.addEventListener(
  "click",
  startCredits
);

envelope.addEventListener("click", openLetter);
envelope.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openLetter();
  }
});

replayButton.addEventListener(
  "click",
  resetExperience
);

closingReplayButton?.addEventListener(
  "click",
  resetExperience
);


/* ボタンを押したときの沈み込み */
document.querySelectorAll(".main-button, .sub-button").forEach((button) => {
  const releaseButton = () => button.classList.remove("button-pressed");
  button.addEventListener("pointerdown", () => {
    if (!button.disabled) button.classList.add("button-pressed");
  });
  button.addEventListener("pointerup", releaseButton);
  button.addEventListener("pointercancel", releaseButton);
  button.addEventListener("pointerleave", releaseButton);
});

clearTypewriterText();

/*
  ページを閉じるときにマイクと動画を停止
*/
window.addEventListener(
  "pagehide",
  () => {
    stopMicrophone();

    memoryVideo.pause();
  }
);
