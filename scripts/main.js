const videosEl = document.querySelector(".videos");
const messageEl = document.querySelector(".message");
const folderInput = document.querySelector(".folder-input input");
const themeToggle = document.querySelector(".theme-toggle");

let histories = load("histories", []);
let currentFiles = [];
let currentVideos = [];
let currentVideo = null;
let darkTheme = load("darkTheme", false);
let isLoading = false;

document.addEventListener("DOMContentLoaded", function () {
  toggleTheme(darkTheme);
  setInterval(updateHistory(), 10000);
});

async function getVideos(files) {
  currentFiles = files;
  currentVideos = [];
  videosEl.innerHTML = "";

  files = Array.from(files).map((file) => {
    const fileName = decodeURIComponent(file.name).split("/").pop();
    return new File([file], fileName, { type: file.type });
  });
  const videoFiles = files.filter((file) => file.type.startsWith("video/"));
  let subtitleFiles = files.filter((file) => file.name.endsWith(".srt"));
  subtitleFiles = await Promise.all(subtitleFiles.map((file) => convertSrtToVtt(file)));
  const thumbnailFiles = files.filter((file) => file.type.startsWith("image/"));

  videoFiles.forEach((videoFile) => {
    const fileName = videoFile.name;
    const name = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
    const subtitleFile = subtitleFiles.find((file) => file.name.startsWith(name));
    const thumbnailFile = thumbnailFiles.find((file) => file.name.startsWith(name));

    const videoData = {
      id: fileName,
      type: videoFile.type,
      title: name,
      video: URL.createObjectURL(videoFile),
      subtitle: URL.createObjectURL(subtitleFile),
      thumbnail: thumbnailFile ? URL.createObjectURL(thumbnailFile) : "assets/images/thumbnail.jpg",
    };
    currentVideos.push(videoData);
  });
}

function displayVideos() {
  messageEl.classList.add("hidden");

  videosEl.innerHTML =
    currentVideos
      .map(
        (video) => `
      <div class="item" onclick="loadVideo('${video.id}')">
        <img src="${video.thumbnail}" alt="${video.title}">
        <span class="truncated">${video.title}</span>
      </div>
    `
      )
      .join("") || "No videos found!";
}

function changeScreen(screenName) {
  document.querySelectorAll(".screen").forEach((element) => {
    element.classList.add("hidden");
  });

  document.querySelector(`.${screenName}`).classList.remove("hidden");
}

async function goHome(files) {
  if (isLoading) return;
  isLoading = true;
  Player.isLoaded = false;
  changeScreen("home-screen");
  await getVideos(files || currentFiles);
  displayVideos();
  isLoading = false;
}

function loadVideo(id) {
  if (isLoading) return;
  isLoading = true;
  Player.loadVideo(id);

  loadHistory();
  changeScreen("player-screen");

  isLoading = false;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function updateHistory() {
  if (!Player.isLoaded) return;

  const history = histories.filter((video) => video.title === currentVideo.title)[0];

  if (history) {
    history.time = Player.videoEl.currentTime;
  } else {
    histories.push({ title: currentVideo.title, time: Player.videoEl.currentTime });

    if (histories.length > 10) {
      histories.shift();
    }
  }

  save("histories", histories);
}

function loadHistory() {
  if (histories.length <= 0) return;

  const pastVideo = histories.find((video) => video.title === currentVideo.title);

  if (pastVideo) Player.videoEl.currentTime = pastVideo.time;
}

function toggleTheme(force) {
  darkTheme = force != null ? force : !darkTheme;
  document.body.classList.toggle("dark-theme", darkTheme);
  themeToggle.innerHTML = darkTheme ? `<i class="bi bi-sun"></i>` : `<i class="bi bi-moon"></i>`;
  save("darkTheme", darkTheme);
}

document.addEventListener("keydown", function (event) {
  if (Player.videoEl.contains(event.target)) event.preventDefault();

  const shortcuts = {
    pause: event.code === "Space" || event.key === " " || event.code === "KeyK",
    volumeUp: event.code === "ArrowUp" || event.code === "KeyW" || event.code === "KeyI",
    volumeDown: event.code === "ArrowDown" || event.code === "KeyS" || event.code === "KeyU",
    mute: event.code === "KeyM",
    jumpForward: event.code === "KeyL" || event.code === "ArrowRight" || event.code === "KeyD",
    jumpBackward: event.code === "KeyJ" || event.code === "ArrowLeft" || event.code === "KeyA",
    fullscreen: event.code === "KeyF",
  };
  if (shortcuts.pause) Player.pauseVideo();
  if (shortcuts.volumeDown || shortcuts.volumeUp) {
    let amount = 5;
    if (shortcuts.volumeUp) {
      amount = Player.currentVolume < 0.05 ? 0.01 : 0.05;
    } else {
      amount = Player.currentVolume <= 0.05 ? -0.01 : -0.05;
    }
    Player.changeVolume(Player.currentVolume + amount);
  }
  if (shortcuts.mute) Player.mute();
  if (shortcuts.jumpForward) Player.jump(5);
  if (shortcuts.jumpBackward) Player.jump(-5);
  if (shortcuts.fullscreen) toggleFullscreen();
});
