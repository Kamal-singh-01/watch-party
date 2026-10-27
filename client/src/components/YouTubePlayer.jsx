import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Loads the YouTube IFrame API script once and resolves with window.YT.
const loadYouTubeApi = () =>
  new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    if (!document.getElementById('yt-iframe-api')) {
      const script = document.createElement('script');
      script.id = 'yt-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }
  });

const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_BUFFERING = 3;

/**
 * Wraps the YouTube player.
 * - apply(state): called by the parent when the server sends sync_state.
 * - onPlay/onPause/onSeek: called when a host/moderator uses the native player controls.
 * Programmatic changes set `applyingRef` for 1s so they are not echoed back to the server.
 */
const YouTubePlayer = forwardRef(({ initial, canControl, onPlay, onPause, onSeek }, ref) => {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const readyRef = useRef(false);
  const pendingRef = useRef(initial); // state received before the player was ready
  const applyingRef = useRef(false);
  const applyTimer = useRef(null);
  const lastRef = useRef({ t: 0, at: Date.now(), playing: false });
  const cbRef = useRef({});
  cbRef.current = { canControl, onPlay, onPause, onSeek }; // always latest props

  const apply = (s) => {
    const p = playerRef.current;
    if (!readyRef.current || !p) {
      pendingRef.current = s;
      return;
    }
    applyingRef.current = true;
    clearTimeout(applyTimer.current);
    applyTimer.current = setTimeout(() => { applyingRef.current = false; }, 1000);

    const playing = s.playState === 'playing';
    const currentId = p.getVideoData?.().video_id;
    if (currentId !== s.videoId) {
      if (playing) p.loadVideoById({ videoId: s.videoId, startSeconds: s.currentTime });
      else p.cueVideoById({ videoId: s.videoId, startSeconds: s.currentTime });
    } else {
      if (Math.abs(p.getCurrentTime() - s.currentTime) > 0.5) p.seekTo(s.currentTime, true);
      if (playing) p.playVideo();
      else p.pauseVideo();
    }
    lastRef.current = { t: s.currentTime, at: Date.now(), playing };
  };

  useImperativeHandle(ref, () => ({
    apply,
    getTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
  }), []);

  // Create the player once.
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      const el = document.createElement('div');
      hostRef.current.appendChild(el);
      playerRef.current = new YT.Player(el, {
        width: '100%',
        height: '100%',
        videoId: initial.videoId,
        playerVars: { rel: 0, playsinline: 1 },
        events: {
          onReady: () => {
            readyRef.current = true;
            const s = pendingRef.current;
            pendingRef.current = null;
            if (s) apply(s);
          },
          onStateChange: (e) => {
            const { canControl, onPlay, onPause } = cbRef.current;
            if (applyingRef.current || !canControl) return;
            const t = playerRef.current.getCurrentTime();
            if (e.data === YT_PLAYING) {
              lastRef.current = { t, at: Date.now(), playing: true };
              onPlay(t);
            } else if (e.data === YT_PAUSED) {
              lastRef.current = { t, at: Date.now(), playing: false };
              onPause(t);
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      clearTimeout(applyTimer.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
      readyRef.current = false;
    };
  }, []);

  // The IFrame API has no "seeked" event, so detect scrubbing by watching for time jumps.
  useEffect(() => {
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!readyRef.current || !p || applyingRef.current || !cbRef.current.canControl) return;
      const state = p.getPlayerState();
      const t = p.getCurrentTime();
      const last = lastRef.current;
      const expected = last.playing ? last.t + (Date.now() - last.at) / 1000 : last.t;
      if (state !== YT_BUFFERING && Math.abs(t - expected) > 2) cbRef.current.onSeek(t);
      lastRef.current = { t, at: Date.now(), playing: state === YT_PLAYING };
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full aspect-video bg-black">
      <div ref={hostRef} className="absolute inset-0 [&_iframe]:w-full [&_iframe]:h-full" />
      {/* Participants can see the video but cannot click the player */}
      {!canControl && <div className="absolute inset-0" title="Only the host and moderators can control playback" />}
    </div>
  );
});

export default YouTubePlayer;
