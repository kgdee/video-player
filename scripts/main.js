const videoList = document.querySelector(".video-list");
const messageEl = document.querySelector(".message");
const folderInput = document.querySelector(".folder-input input");
let videoHistory = JSON.parse(localStorage.getItem("videoHistory")) || [];

let currentVolume = parseInt(localStorage.getItem(`${projectName}_currentVolume`)) || 50;
let currentFiles = []
let currentVideos = [];
let currentVideo = null;
let playerAvailable = false;
let darkTheme = JSON.parse(localStorage.getItem(`${projectName}_darkTheme`)) || false;

document.addEventListener("DOMContentLoaded", function () {
  toggleTheme(darkTheme);
  setInterval(updateHistory(), 10000);
});

function getVideos(files) {
  currentFiles = files
  currentVideos = [];
  videoList.innerHTML = "";

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
      thumbnail: thumbnailFile ? URL.createObjectURL(thumbnailFile) : defaultThumbnail,
    };
    currentVideos.push(videoData);
  });
}

function displayVideos() {
  messageEl.classList.add("hidden");

  videoList.innerHTML =
    currentVideos
      .map(
        (video) => `
      <div class="item" onclick="Player.loadVideo('${video.id}')">
        <img src="${video.thumbnail}" alt="${video.title}">
        <p>${video.title}</p>
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
  playerAvailable = false;
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
  if (!playerAvailable) return;

  const existingIndex = videoHistory.findIndex((video) => video.title === currentVideo.title);

  if (existingIndex !== -1) {
    videoHistory[existingIndex].time = Player.videoEl.currentTime;
  } else {
    videoHistory.unshift({ title: currentVideo.title, time: Player.videoEl.currentTime });

    if (videoHistory.length > 10) {
      videoHistory.pop();
    }
  }

  localStorage.setItem("videoHistory", JSON.stringify(videoHistory));
}

function loadHistory() {
  if (videoHistory.length <= 0) return;

  const pastVideo = videoHistory.find((video) => video.title === currentVideo.title);

  if (pastVideo) Player.videoEl.currentTime = pastVideo.time;
}

function toggleTheme(force = undefined) {
  const toggle = document.querySelector(".theme-toggle");
  force === undefined ? (darkTheme = !darkTheme) : (darkTheme = force);
  localStorage.setItem(`${projectName}_darkTheme`, darkTheme);
  document.body.classList.toggle("dark-theme", darkTheme);
  toggle.innerHTML = darkTheme ? `<i class="bi bi-sun"></i>` : `<i class="bi bi-moon"></i>`;
}

document.addEventListener("keydown", function (event) {
  if (Player.videoEl.contains(event.target)) event.preventDefault();

  if (event.code === "Space" || event.code === "KeyK") Player.pauseVideo();
  // Volume controls
  if (event.code === "ArrowUp" || event.code === "ArrowDown" || event.code === "KeyW" || event.code === "KeyS" || event.code === "KeyI" || event.code === "KeyU") {
    let amount = 5;
    if (event.code === "ArrowUp" || event.code === "KeyW" || event.code === "KeyI") {
      amount = currentVolume < 5 ? 1 : 5;
    } else {
      amount = currentVolume <= 5 ? -1 : -5;
    }
    Player.changeVolume(currentVolume + amount);
  }
  if (event.code === "KeyM") Player.mute();
  if (event.code === "KeyJ" || event.code === "ArrowLeft" || event.code === "KeyA") Player.jump(-5);
  if (event.code === "KeyL" || event.code === "ArrowRight" || event.code === "KeyD") Player.jump(5);
  if (event.code === "KeyF") toggleFullscreen();
});
