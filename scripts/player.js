const Player = (() => {
  const element = document.querySelector(".player");
  const videoEl = element.querySelector("video");
  const titleEl = document.querySelector(".player-screen .title");
  const controlsEl = document.querySelector(".controls");

  let currentVolume = load("currentVolume", 50);
  let isReady = false;

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
    currentVolume = parseInt(videoEl.volume * 100);
    save("currentVolume", currentVolume);
    update();
  });

  videoEl.addEventListener("ratechange", () => {
    update();
  });

  function pause() {
    if (!isReady) return;
    videoEl.paused ? videoEl.play() : videoEl.pause();
  }

  function jump(amount) {
    if (!isReady) return;
    videoEl.currentTime += amount;
    Toast.show(`${Math.abs(amount)} second${Math.abs(amount) >= 2 ? "s" : ""}`);
  }

  function changeVolume(value) {
    if (!isReady) return;

    if (value == null) value = (videoEl.volume * 100 + 25) % 125;

    value = clamp(value, 0, 100);
    videoEl.volume = value / 100;

    Toast.show(`${value}%`);
  }

  function mute() {
    if (!isReady) return;
    videoEl.muted = !videoEl.muted;
  }

  function changePlaybackRate(playbackRate) {
    if (!isReady) return;
    videoEl.playbackRate = playbackRate || clamp((videoEl.playbackRate + 0.25) % 1.5, 0.75, 1.25);
    Toast.show(`${videoEl.playbackRate}x`);
  }

  function replay() {
    if (!isReady) return;
    videoEl.currentTime = 0;
    videoEl.play();
  }

  async function loadVideo(videoId) {
    currentVideo = currentVideos.find((video) => video.id === videoId);
    if (!currentVideo) return;

    titleEl.innerHTML = `<img src="assets/images/logo.png">${currentVideo.title}`;
    videosEl.innerHTML = "";

    videoEl.innerHTML = `
        <source src="${currentVideo.video}" type="${currentVideo.type}" />
        ${currentVideo.subtitle ? `<track src="${currentVideo.subtitle}" kind="subtitles" srclang="en" label="English" default />` : ""}
        Your browser does not support the video tag.
    `;

    videoEl.load();
    videoEl.volume = currentVolume / 100;
    isReady = true;
  }

  function update() {
    document.querySelector(".control.volume button").innerHTML = `<i class="bi bi-volume-down"></i> ${currentVolume}%`;
    const playbackRate = videoEl.playbackRate;

    document.querySelector(".control.rate button").innerHTML = `${playbackRate}x`;
  }

  return {
    videoEl,
    get currentVolume() {
      return currentVolume;
    },
    pause,
    jump,
    changeVolume,
    mute,
    changePlaybackRate,
    replay,
    loadVideo,
    get isLoaded() {
      return isReady;
    },
  };
})();
