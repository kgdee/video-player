const Player = (() => {
  const element = document.querySelector(".player");
  const videoEl = element.querySelector("video");
  const titleEl = document.querySelector(".player-screen .title");
  const controlsEl = document.querySelector(".controls");

  let currentVolume = load("currentVolume", 0.5);
  let isLoaded = false;

  videoEl.addEventListener("pause", () => {
    show(controlsEl);
    show(titleEl);
    updateHistory();
  });

  videoEl.addEventListener("play", () => {
    hide(controlsEl);
    hide(titleEl);
  });

  videoEl.addEventListener("volumechange", () => {
    currentVolume = videoEl.volume;

    document.querySelector(".control.volume button").innerHTML = `<i class="bi bi-volume-down"></i> ${parseInt(currentVolume * 100)}%`;

    save("currentVolume", currentVolume);
  });

  videoEl.addEventListener("ratechange", () => {
    const playbackRate = videoEl.playbackRate;

    document.querySelector(".control.rate button").innerHTML = `${playbackRate}x`;
  });

  function pause() {
    if (!isLoaded) return;
    videoEl.paused ? videoEl.play() : videoEl.pause();
  }

  function jump(amount) {
    if (!isLoaded) return;
    videoEl.currentTime += amount;
    Toast.show(`${Math.abs(amount)} second${Math.abs(amount) >= 2 ? "s" : ""}`);
  }

  function changeVolume(value) {
    if (!isLoaded) return;

    value = value != null ? clamp(value, 0, 1) : clamp((videoEl.volume + 0.25) % 1.25, 0, 1);
    videoEl.volume = value;

    Toast.show(`${parseInt(value * 100)}%`);
  }

  function mute() {
    if (!isLoaded) return;
    videoEl.muted = !videoEl.muted;
  }

  function changePlaybackRate(playbackRate) {
    if (!isLoaded) return;
    videoEl.playbackRate = playbackRate || clamp((videoEl.playbackRate + 0.25) % 1.5, 0.75, 1.25);
    Toast.show(`${videoEl.playbackRate}x`);
  }

  function replay() {
    if (!isLoaded) return;
    videoEl.currentTime = 0;
    videoEl.play();
  }

  async function loadVideo(videoId) {
    currentVideo = currentVideos.find((video) => video.id === videoId);
    if (!currentVideo) return;

    titleEl.innerHTML = `<img src="assets/images/logo.png">${currentVideo.title}`;
    videosEl.innerHTML = "";

    videoEl.innerHTML = `
        <source src="${currentVideo.video}" type="video/mp4" />
        ${currentVideo.subtitleFile ? `<track src="${await convertSrtToVtt(currentVideo.subtitleFile)}" kind="subtitles" srclang="en" label="English" default />` : ""}
        Your browser does not support the video tag.
    `;

    videoEl.load();
    videoEl.volume = currentVolume;
    isLoaded = true;

    loadHistory();

    changeScreen("player-screen");
  }

  return {
    videoEl,
    currentVolume,
    pause,
    jump,
    changeVolume,
    mute,
    changePlaybackRate,
    replay,
    loadVideo,
    get isLoaded() {
      return isLoaded;
    },
  };
})();
