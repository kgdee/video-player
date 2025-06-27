const videosEl = document.querySelector(".videos");
const messageEl = document.querySelector(".message");
const folderInput = document.querySelector(".folder-input input");
const themeToggle = document.querySelector(".theme-toggle");

let histories = load("histories", []);
let currentFiles = [];
let currentVideos = [];
let currentVideo = null;
let darkTheme = load("darkTheme", false);

document.addEventListener("DOMContentLoaded", function () {
  toggleTheme(darkTheme);
  setInterval(updateHistory(), 10000);
});

function getVideos(files) {
  currentFiles = files;
  currentVideos = [];
  videosEl.innerHTML = "";

  files = Array.from(files).map((file) => {
    const fileName = decodeURIComponent(file.name).split("/").pop();
    return new File([file], fileName);
  });
  const videoFiles = files.filter((file) => file.name.endsWith(".mp4"));
  const subtitleFiles = files.filter((file) => file.name.endsWith(".srt"));
  const thumbnailFiles = files.filter((file) => file.name.match(/\.(jpg|png)$/));

  videoFiles.forEach((videoFile) => {
    const videoId = videoFile.name.replace(".mp4", "");
    const subtitleFile = subtitleFiles.find((sub) => sub.name.startsWith(videoId));
    const thumbnailFile = thumbnailFiles.find((thumb) => thumb.name.startsWith(videoId));

    const videoData = {
      id: videoId,
      title: videoFile.name.replace(".mp4", ""),
      video: URL.createObjectURL(videoFile),
      subtitleFile: subtitleFile || null,
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
      <div class="item" onclick="Player.loadVideo('${video.id}')">
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

function goHome(files) {
  Player.isLoaded = false;
  changeScreen("home-screen");
  getVideos(files || currentFiles);
  displayVideos();
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
  save("darkTheme", darkTheme)
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
