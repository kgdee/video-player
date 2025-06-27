const Player = (() => {
  const element = document.querySelector(".player");
  const videoEl = element.querySelector("video");
  const sourceEl = element.querySelector("source");
  const trackEl = element.querySelector("track");
  const titleEl = document.querySelector(".player-screen .title");
  const controlsEl = document.querySelector(".controls");

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
    currentVolume = Math.floor(videoEl.volume * 100);

    document.querySelector(".control.volume button").textContent = videoEl.muted ? "Muted" : `Volume ${currentVolume}%`;

    localStorage.setItem(`${projectName}_currentVolume`, currentVolume);
  });

  videoEl.addEventListener("ratechange", () => {
    const playbackRate = videoEl.playbackRate;

    document.querySelector(".control.rate button").textContent = `Speed ${playbackRate}x`;
  });

  function pause() {
    if (!playerAvailable) return;
    videoEl.paused ? videoEl.play() : videoEl.pause();
  }

  function jump(amount) {
    if (!playerAvailable) return;
    videoEl.currentTime += amount;
    Toast.show(`${Math.abs(amount)} second${Math.abs(amount) >= 2 ? "s" : ""}`);
  }

  function changeVolume(value) {
    if (!playerAvailable) return;
    videoEl.muted = false;

    value = Math.max(0, Math.min(value, 100));
    videoEl.volume = value / 100;

    Toast.show(`${Math.floor(videoEl.volume * 100)}%`);
  }

  function mute() {
    if (!playerAvailable) return;
    videoEl.muted = !videoEl.muted;
  }

  function changePlaybackRate(playbackRate) {
    if (!playerAvailable) return;
    videoEl.playbackRate = playbackRate || clamp((videoEl.playbackRate + 0.25) % 1.75, 0.5, 1.5);
    Toast.show(`${videoEl.playbackRate}x`);
  }

  function replay() {
    if (!playerAvailable) return;
    videoEl.currentTime = 0;
    videoEl.play();
  }

  async function loadVideo(videoId) {
    currentVideo = currentVideos.find((video) => video.id === videoId);
    if (!currentVideo) return;

    titleEl.innerHTML = `<img src="assets/images/logo.png">${currentVideo.title}`;
    videoList.innerHTML = "";

    sourceEl.src = currentVideo.video;
    if (currentVideo.subtitleFile) {
      trackEl.src = await convertSrtToVtt(currentVideo.subtitleFile);
      trackEl.track.mode = "showing";
    } else {
      trackEl.src = "";
    }
    videoEl.load();
    videoEl.volume = currentVolume / 100;
    playerAvailable = true;

    loadHistory();

    changeScreen("player-screen");
  }

  return { videoEl, pause, jump, changeVolume, mute, changePlaybackRate, replay, loadVideo };
})();
