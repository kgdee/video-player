const projectName = "yt-player";

const videoList = document.getElementById("video-list");
const instructions = document.querySelector(".instructions");
const player = document.getElementById("player");
const videoElement = document.getElementById("video-player");
const videoSource = document.getElementById("video-source");
const videoSubtitles = document.getElementById("video-subtitles");
const folderPicker = document.getElementById("files-input");
const videoTitle = document.querySelector(".player-screen .title");
const playerOverlay = document.querySelector(".player-screen .overlay");
const toast = document.querySelector(".toast");

let currentVolume = parseInt(localStorage.getItem(`${projectName}_currentVolume`)) || 50;

let videos = [];

let playerIsVisible = false;

function stopPropagation(event) {
  event.stopPropagation();
}

function hide(element) {
  element.classList.toggle("hidden");
}

function blink(element) {
  element.classList.add("hidden");

  setTimeout(() => element.classList.remove("hidden"), 100);
}

videoElement.addEventListener("pause", () => {
  hide(playerOverlay);
});

videoElement.addEventListener("volumechange", () => {
  currentVolume = Math.floor(videoElement.volume * 100);

  document.querySelector(".control.volume button").textContent = videoElement.muted ? "Muted" : `Volume ${currentVolume}%`;

  localStorage.setItem(`${projectName}_currentVolume`, currentVolume);
});

videoElement.addEventListener("ratechange", () => {
  const playbackRate = videoElement.playbackRate;

  document.querySelector(".control.rate button").textContent = `Speed ${playbackRate}x`;
});

function pauseVideo() {
  if (!playerIsVisible) return;
  videoElement.paused ? videoElement.play() : videoElement.pause();
}

function jump(amount) {
  if (!playerIsVisible) return;
  videoElement.currentTime += amount;
  showToast(`${Math.abs(amount)} second${Math.abs(amount) >= 2 ? "s" : ""}`);
}

function changeVolume(value) {
  if (!playerIsVisible) return;
  videoElement.muted = false;

  value = Math.max(0, Math.min(value, 100));
  videoElement.volume = value / 100;

  showToast(`${Math.floor(videoElement.volume * 100)}%`);
}

function mute() {
  if (!playerIsVisible) return;
  videoElement.muted = !videoElement.muted;
}

function changePlaybackRate(playbackRate) {
  if (!playerIsVisible) return;
  videoElement.playbackRate = playbackRate;
  showToast(`${videoElement.playbackRate}x`);
}

function replay() {
  if (!playerIsVisible) return;
  videoElement.currentTime = 0;
  videoElement.play();
}

folderPicker.addEventListener("change", (event) => {
  videos = []; // Reset previous videos
  videoList.innerHTML = ""; // Clear old videos

  const files = Array.from(event.target.files).map((file) => {
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
      thumbnail: thumbnailFile ? URL.createObjectURL(thumbnailFile) : "default-thumbnail.jpg",
    };
    videos.push(videoData);
  });

  displayVideos();
});

function displayVideos() {
  instructions.classList.add("hidden");

  videoList.innerHTML =
    videos
      .map(
        (video) => `
      <div class="video-item" onclick="loadVideo('${video.id}')">
        <img src="${video.thumbnail}" alt="${video.title}">
        <p>${video.title}</p>
      </div>
    `
      )
      .join("") || "No videos found!";
}

async function loadVideo(videoId) {
  const videoData = videos.find((v) => v.id === videoId);
  if (!videoData) return;

  videoTitle.innerHTML = `<img src="logo.png">${videoData.title}`;
  videoList.innerHTML = "";

  videoSource.src = videoData.video;
  if (videoData.subtitleFile) {
    videoSubtitles.src = await convertSrtToVtt(videoData.subtitleFile);
    videoSubtitles.track.mode = "showing";
  } else {
    videoSubtitles.src = "";
  }
  videoElement.load();
  videoElement.volume = currentVolume / 100;
  playerIsVisible = true;

  changeScreen("player-screen");
}

async function convertSrtToVtt(srtFile) {
  if (!srtFile) return "";

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      let srtText = event.target.result;

      // Convert SRT to VTT format
      let vttText =
        "WEBVTT\n\n" +
        srtText
          .replace(/\r\n|\r|\n/g, "\n") // Normalize new lines
          .replace(/(\d+)\n(\d{2}:\d{2}:\d{2}),(\d{3}) --> (\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1\n$2.$3 --> $4.$5"); // Convert timestamps

      const blob = new Blob([vttText], { type: "text/vtt" });
      resolve(URL.createObjectURL(blob));
    };
    reader.readAsText(srtFile);
  });
}

function changeScreen(screenName) {
  document.querySelectorAll(".screen").forEach((element) => {
    element.classList.remove("active");
  });

  document.querySelector(`.${screenName}`).classList.add("active");
}

function goHome() {
  playerIsVisible = false;
  changeScreen("home-screen");
  displayVideos();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

let toastTimeout = null;
function showToast(content) {
  clearTimeout(toastTimeout);
  toast.classList.remove("hidden");
  toast.innerHTML = content;
  toastTimeout = setTimeout(() => {
    toast.classList.add("hidden");
  }, 1000);
}

document.addEventListener("keydown", function (event) {
  // Play/Pause
  if (event.code === "Space" || event.code === "KeyK") pauseVideo();
  // Volume controls
  if (event.code === "ArrowUp" || event.code === "ArrowDown" || event.code === "KeyW" || event.code === "KeyS" || event.code === "KeyI" || event.code === "KeyU") {
    let amount = 5;
    if (event.code === "ArrowUp" || event.code === "KeyW" || event.code === "KeyI") {
      amount = currentVolume < 5 ? 1 : 5;
    } else {
      amount = currentVolume <= 5 ? -1 : -5;
    }
    changeVolume(currentVolume + amount);
  }
  if (event.code === "KeyM") mute();
  // Jump backward/forward
  if (event.code === "KeyJ" || event.code === "ArrowLeft" || event.code === "KeyA") jump(-5);
  if (event.code === "KeyL" || event.code === "ArrowRight" || event.code === "KeyD") jump(5);
  // Fullscreen
  if (event.code === "KeyF") toggleFullscreen();
});

window.addEventListener("error", (event) => {
  const error = `${event.type}: ${event.message}`;
  console.error(error);
  alert(error);
});
