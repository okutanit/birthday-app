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
  message: document.getElementById("messageScreen")
};

const startButton = document.getElementById("startButton");

const cakeArea = document.getElementById("cakeArea");
const cakeTapButton = document.getElementById("cakeTapButton");
const microphoneButton =
  document.getElementById("microphoneButton");
const cakeInstruction =
  document.getElementById("cakeInstruction");
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
const nextPhotoButton =
  document.getElementById("nextPhotoButton");

const creditButton = document.getElementById("creditButton");
const envelope = document.getElementById("envelope");
const replayButton = document.getElementById("replayButton");

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

const roseMessages = [
  "笑顔がかわいいところ",
  "一緒にいると楽しいところ",
  "優しいところ",
  "頑張り屋なところ",
  "よく笑ってくれるところ",
  "一緒にいると落ち着くところ",
  "話を聞いてくれるところ",
  "素直なところ",
  "美味しそうに食べるところ",
  "照れた顔がかわいいところ",
  "自分のことを大切にしてくれるところ",
  "お出かけを楽しんでくれるところ",
  "何気ない時間も楽しくしてくれるところ",
  "かわいい声",
  "一緒に笑えるところ",
  "一緒にいると安心できるところ",
  "思いやりがあるところ",
  "会える日を楽しみにしてくれるところ",
  "頑張っている姿",
  "自分らしくいてくれるところ",
  "一緒に思い出を作ってくれるところ",
  "どんな時もかわいいところ",
  "一緒にいる未来を想像できるところ",
  "出会ってくれたこと",
  "好きになってくれたこと",
  "いつもそばにいてくれること",
  "生まれてきてくれてありがとう"
];

const photos = [
  {
    src: "images/photo1.jpg",
    caption: "一緒に過ごした大切な時間"
  },
  {
    src: "images/photo2.jpg",
    caption: "何気ない一日も、特別な思い出"
  },
  {
    src: "images/photo3.jpg",
    caption: "これからもいろんな場所へ行こうね"
  },
  {
    src: "images/photo4.jpg",
    caption: "一緒に笑えることが幸せです"
  },
  {
    src: "images/photo5.jpg",
    caption: "これからもたくさん思い出作ろうね"
  }
];


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


function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}


function createConfetti(pieceCount = 90) {
  const colors = [
    "#ec4899",
    "#c65bd4",
    "#f6c453",
    "#65a8ff",
    "#54cf9e",
    "#ff7f9f"
  ];

  for (
    let index = 0;
    index < pieceCount;
    index += 1
  ) {
    const piece =
      document.createElement("span");

    piece.className = "confetti";

    piece.style.left =
      `${Math.random() * 100}vw`;

    piece.style.backgroundColor =
      colors[
        Math.floor(
          Math.random() * colors.length
        )
      ];

    piece.style.animationDuration =
      `${2.8 + Math.random() * 2.6}s`;

    piece.style.animationDelay =
      `${Math.random() * 0.7}s`;

    piece.style.setProperty(
      "--drift",
      `${-130 + Math.random() * 260}px`
    );

    document.body.appendChild(piece);

    window.setTimeout(() => {
      piece.remove();
    }, 6500);
  }
}


async function startExperience() {
  startButton.disabled = true;

  startButton.textContent =
    "準備しています…";

  await wait(900);

  showScreen("cake");

  startButton.disabled = false;
  startButton.textContent =
    "物語を始める ▶";
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
    analyser.smoothingTimeConstant = 0.2;

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


function monitorMicrophone() {
  if (!analyser || candlesAreOut) {
    return;
  }

  const dataArray =
    new Uint8Array(analyser.fftSize);

  analyser.getByteTimeDomainData(dataArray);

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

  if (volume >= BLOW_THRESHOLD) {
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

  microphoneAnimationId =
    requestAnimationFrame(
      monitorMicrophone
    );
}


async function blowOutCandles() {
  if (candlesAreOut) {
    return;
  }

  candlesAreOut = true;

  cakeArea.classList.add("blown-out");

  meterFill.style.width = "100%";
  meterText.textContent =
    "ロウソクが消えたよ！ 🎉";

  microphoneButton.disabled = true;
  cakeTapButton.disabled = true;

  stopMicrophone();

  createConfetti();

  await wait(1600);

  showScreen("gift");
}


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
    audioContext.close().catch(() => {});

    audioContext = null;
  }

  analyser = null;
  microphoneStarted = false;
}


async function openGift() {
  if (
    giftBox.classList.contains("opened")
  ) {
    return;
  }

  giftBox.classList.add("opened");

  giftMessage.textContent =
    "まだプレゼントは続きます… 🌹";

  createConfetti(45);

  await wait(1900);

  showScreen("rose");
}


function addRose() {
  if (currentRoseCount >= 27) {
    return;
  }

  const rose =
    document.createElement("img");

  rose.className = "rose";
  rose.src = "images/rose.png";
  rose.alt =
    `${currentRoseCount + 1}本目の赤いバラ`;

  rose.onerror = () => {
    const fallback =
      document.createElement("span");

    fallback.className = "rose rose-fallback";
    fallback.textContent = "🌹";

    rose.replaceWith(fallback);
  };

  roseGarden.appendChild(rose);

  currentRoseCount += 1;

  roseCount.textContent =
    `${currentRoseCount} / 27`;

  roseMessage.textContent =
    roseMessages[currentRoseCount - 1];

  if (currentRoseCount === 27) {
    addRoseButton.disabled = true;

    addRoseButton.textContent =
      "27本のバラがそろいました 💖";

    createConfetti(80);

    window.setTimeout(() => {
      showScreen("bouquet");
    }, 2200);
  }
}


function showPhotos() {
  currentPhotoIndex = 0;

  updatePhoto();

  showScreen("photo");
}


function updatePhoto() {
  const photo = photos[currentPhotoIndex];

  memoryPhoto.classList.add("changing");

  window.setTimeout(() => {
    memoryPhoto.src = photo.src;

    memoryPhoto.onerror = () => {
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
              写真を入れてね
            </text>

            <text
              x="50%"
              y="52%"
              text-anchor="middle"
              font-size="80"
            >
              📷
            </text>
          </svg>
        `);
    };

    photoCaption.textContent =
      photo.caption;

    photoProgress.textContent =
      `${currentPhotoIndex + 1} / ${photos.length}`;

    memoryPhoto.classList.remove("changing");

    if (
      currentPhotoIndex ===
      photos.length - 1
    ) {
      nextPhotoButton.textContent =
        "最後のメッセージへ 💖";
    } else {
      nextPhotoButton.textContent =
        "次の写真へ →";
    }
  }, 350);
}


function showNextPhoto() {
  if (
    currentPhotoIndex <
    photos.length - 1
  ) {
    currentPhotoIndex += 1;
    updatePhoto();
    return;
  }

  createConfetti(100);

  showScreen("final");
}


function startCredits() {
  showScreen("credit");

  window.setTimeout(() => {
    showScreen("letter");
  }, 16000);
}


function resetExperience() {
  stopMicrophone();

  candlesAreOut = false;
  microphoneStarted = false;
  blowFrameCount = 0;
  currentRoseCount = 0;
  currentPhotoIndex = 0;

  cakeArea.classList.remove("blown-out");

  meterFill.style.width = "0%";
  meterText.textContent =
    "マイクはまだオフです";

  microphoneButton.disabled = false;
  microphoneButton.textContent =
    "🎤 マイクをオンにする";

  cakeTapButton.disabled = false;

  giftBox.classList.remove("opened");
  giftMessage.textContent = "🎁";

  roseGarden.innerHTML = "";
  roseCount.textContent = "0 / 27";
  roseMessage.textContent =
    "1本ずつ、気持ちを込めました";

  addRoseButton.disabled = false;
  addRoseButton.textContent =
    "🌹 バラを受け取る";

  showScreen("opening");
}


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

envelope.addEventListener(
  "click",
  () => {
    showScreen("message");
  }
);

replayButton.addEventListener(
  "click",
  resetExperience
);

window.addEventListener(
  "pagehide",
  stopMicrophone
);
