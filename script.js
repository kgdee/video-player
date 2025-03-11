const videoList = document.getElementById("video-list");
const player = document.getElementById("player");
const videoElement = document.getElementById("video-player");
const videoSource = document.getElementById("video-source");
const videoSubtitles = document.getElementById("video-subtitles");
const folderPicker = document.getElementById("folder-picker");
const videoTitle = document.querySelector(".player-screen .title")
const playerOverlay = document.querySelector(".player-screen .overlay")

let videos = [];




function stopPropagation(event) {
  event.stopPropagation()
}

function hide(element) {
  element.classList.toggle("hidden")
}

function blink(element) {
  element.classList.add("hidden")
  
  setTimeout(() => element.classList.remove("hidden"), 100);
}





videoElement.addEventListener('play', () => {
  
});

videoElement.addEventListener('pause', () => {
  hide(playerOverlay)
});

function changeVolume(volume) {
  videoElement.volume = volume

  document.querySelector(".control.volume button").textContent = `Volume ${volume * 100}%`
}

function changePlaybackRate(playbackRate) {
  videoElement.playbackRate = playbackRate
  
  document.querySelector(".control.rate button").textContent = `Speed ${playbackRate}x`
}

function replay() {
  videoElement.currentTime = 0
  videoElement.play()
}



folderPicker.addEventListener("change", (event) => {
  videos = []; // Reset previous videos
  videoList.innerHTML = ""; // Clear old videos
  
  const files = Array.from(event.target.files);
  const videoFiles = files.filter(file => file.name.endsWith(".mp4"));
  const subtitleFiles = files.filter(file => file.name.endsWith(".srt"));
  const thumbnailFiles = files.filter(file => file.name.match(/\.(jpg|png)$/));

  videoFiles.forEach(videoFile => {
    const videoId = videoFile.name.replace(".mp4", "");
    const subtitleFile = subtitleFiles.find(sub => sub.name.startsWith(videoId));
    const thumbnailFile = thumbnailFiles.find(thumb => thumb.name.startsWith(videoId));

    const videoData = {
      id: videoId,
      title: videoFile.name.replace(".mp4", ""),
      video: URL.createObjectURL(videoFile),
      subtitleFile: subtitleFile || null,
      thumbnail: thumbnailFile ? URL.createObjectURL(thumbnailFile) : "default-thumbnail.jpg"
    };
    videos.push(videoData);
  });

  displayVideos();
});

function displayVideos() {
  videoList.innerHTML = "";
  videos.forEach(video => {
    const videoItem = document.createElement("div");
    videoItem.classList.add("video-item");
    videoItem.innerHTML = `
      <img src="${video.thumbnail}" alt="${video.title}">
      <p>${video.title}</p>
    `;
    videoItem.addEventListener("click", () => loadVideo(video.id));
    videoList.appendChild(videoItem);
  });
}

async function loadVideo(videoId) {
  const videoData = videos.find(v => v.id === videoId);
  if (!videoData) return;

  videoTitle.innerText = videoData.title;
  videoList.innerHTML = "";
 
  videoSource.src = videoData.video;
  if (videoData.subtitleFile) {
    videoSubtitles.src = await convertSrtToVtt(videoData.subtitleFile);
    videoSubtitles.track.mode = "showing";
  } else {
    videoSubtitles.src = "";
  }
  videoElement.load();

  changeScreen("player-screen")
}

async function convertSrtToVtt(srtFile) {
  if (!srtFile) return "";

  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = function(event) {
      let srtText = event.target.result;

      // Convert SRT to VTT format
      let vttText = "WEBVTT\n\n" + srtText
        .replace(/\r\n|\r|\n/g, "\n") // Normalize new lines
        .replace(/(\d+)\n(\d{2}:\d{2}:\d{2}),(\d{3}) --> (\d{2}:\d{2}:\d{2}),(\d{3})/g,
          "$1\n$2.$3 --> $4.$5"); // Convert timestamps

      const blob = new Blob([vttText], { type: "text/vtt" });
      resolve(URL.createObjectURL(blob));
    };
    reader.readAsText(srtFile);
  });
}


function changeScreen(screenName) {
  document.querySelectorAll(".screen").forEach(element => {
    element.classList.remove("active");
  });

  document.querySelector(`.${screenName}`).classList.add("active")
}

function goHome() {
  changeScreen("home-screen")
  displayVideos();
};
