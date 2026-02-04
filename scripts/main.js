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

  for (const videoFile of videoFiles) {
    const fileName = videoFile.name;
    const name = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
    let subtitleFile = files.find((file) => file.name.endsWith(".srt") && file.name.startsWith(name));
    if (subtitleFile) subtitleFile = await convertSrtToVtt(subtitleFile);
    const thumbnailFile = files.find((file) => file.type.startsWith("image/") && file.name.startsWith(name));

    const videoData = {
      id: fileName,
      type: videoFile.type,
      title: name,
      video: URL.createObjectURL(videoFile),
      subtitle: subtitleFile ? URL.createObjectURL(subtitleFile) : null,
      thumbnail: thumbnailFile ? URL.createObjectURL(thumbnailFile) : "assets/images/thumbnail.jpg",
    };
    currentVideos.push(videoData);
  }
}

function displayVideos() {
  messageEl.classList.add("hidden");

  const historiesMap = new Map(
    histories.map(history => [history.title, history])
  );

  videosEl.innerHTML =
    currentVideos
      .map((video, i) => {
        const progress = historiesMap.get(video.title)?.progress || 0

        return `
            <div class="item" onclick="loadVideo(${i})">
              <div class="thumbnail">
                <img src="${video.thumbnail}">
                <div class="progress">
                  <div style="width: ${progress}%;"></div>
                </div>
              </div>
              <span class="truncated">${video.title}</span>
            </div>
          `;
      })
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
  Player.isReady = false;
  changeScreen("home-screen");
  await getVideos(files || currentFiles);
  displayVideos();
  document.title = "Video Player"
  isLoading = false;
}

function loadVideo(index) {
  if (isLoading) return;
  isLoading = true;
  const video = currentVideos[index]
  Player.loadVideo(video.id);

  loadHistory();
  changeScreen("player-screen");
  document.title = video.title

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
  if (!Player.isReady) return;

  const history = histories.filter((video) => video.title === currentVideo.title)[0];

  const time = Player.videoEl.currentTime;
  const duration = Player.videoEl.duration;
  const progress = Number(((time / duration) * 100).toFixed(1));

  if (history) {
    history.time = time;
    history.progress = progress;
  } else {
    histories.push({ title: currentVideo.title, time, progress });

    if (histories.length > 100) {
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

function adjustVolume(direction) {
  const currentVolume = Player.currentVolume;
  let amount = 5 * direction;

  if ((direction >= 0 && currentVolume <= 4) || (direction < 0 && currentVolume <= 5)) amount = 1 * direction;

  Player.changeVolume(currentVolume + amount);
}

const keyActions = {
  Space: Player.pause,
  KeyK: Player.pause,
  ArrowUp: () => adjustVolume(1),
  KeyW: () => adjustVolume(1),
  KeyI: () => adjustVolume(1),
  ArrowDown: () => adjustVolume(-1),
  KeyS: () => adjustVolume(-1),
  KeyU: () => adjustVolume(-1),
  KeyM: Player.mute,
  KeyL: () => Player.jump(5),
  ArrowRight: () => Player.jump(5),
  KeyD: () => Player.jump(5),
  KeyJ: () => Player.jump(-5),
  ArrowLeft: () => Player.jump(-5),
  KeyA: () => Player.jump(-5),
  KeyF: toggleFullscreen,
};

document.addEventListener(
  "keydown",
  (event) => {
    const action = keyActions[event.code];
    if (action) {
      event.preventDefault();
      action();
    }
  },
  true,
);
