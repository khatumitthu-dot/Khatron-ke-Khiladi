/* ===========================================================
   YOUR TYPE — Shared Music Continuity Widget
   -----------------------------------------------------------
   Song SEARCH/SELECTION UI lives ONLY in the Admin panel
   (Music tab). This file does NOT add any search box or
   results list anywhere else.

   What this file does, on every page that includes it:
   - Shows the small "now playing" bar at the bottom
   - Keeps the same YouTube audio playing when you navigate
     from one page to another (admin -> store -> checkout, etc)
   - Reads/writes progress to localStorage so a fresh page load
     can resume from (roughly) where the song was

   Nothing is hosted on this server; YouTube's own servers
   handle the audio, exactly like before.
   =========================================================== */
(function(){
  const STORAGE_KEY = 'ytMusicState';
  let ytPlayer = null;
  let apiReady = false;
  let pendingVideoId = null;
  let pendingStart = 0;
  let saveTimer = null;

  function getState(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch(e){ return null; }
  }
  function setState(patch){
    const cur = getState() || {};
    const next = Object.assign({}, cur, patch, { updatedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }
  function clearState(){
    localStorage.removeItem(STORAGE_KEY);
  }

  function ensureBar(){
    let bar = document.getElementById('musicBar');
    if(bar) return bar;
    bar = document.createElement('div');
    bar.id = 'musicBar';
    bar.style.cssText = 'display:none;position:fixed;left:0;right:0;bottom:0;background:#0b121c;border-top:1px solid #1a2737;padding:10px 14px;align-items:center;gap:10px;z-index:9999;font-family:Arial,Helvetica,sans-serif';
    bar.innerHTML =
      '<img id="musicBarImg" src="" alt="" style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0">' +
      '<div style="flex:1;min-width:0">' +
        '<div id="musicBarTitle" style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#e8ecf1"></div>' +
        '<div id="musicBarStatus" style="font-size:11px;color:#86efac;margin-top:2px"></div>' +
      '</div>' +
      '<button id="musicBarBtn" style="min-width:44px;border:1px solid #2d3d52;background:#111a26;color:#fff;border-radius:9px;padding:9px 11px;cursor:pointer;touch-action:manipulation">⏸</button>' +
      '<button id="musicBarClose" title="Music band karein" style="min-width:36px;border:1px solid #2d3d52;background:#111a26;color:#9fb0c3;border-radius:9px;padding:9px 10px;cursor:pointer;touch-action:manipulation">✕</button>' +
      '<div id="ytPlayerMount" style="width:0;height:0;overflow:hidden"></div>';
    document.body.appendChild(bar);
    document.getElementById('musicBarBtn').onclick = window.musicToggle;
    document.getElementById('musicBarClose').onclick = window.musicStop;
    return bar;
  }

  function showBarInfo(s){
    const bar = ensureBar();
    bar.style.display = 'flex';
    document.getElementById('musicBarImg').src = s.thumb || '';
    document.getElementById('musicBarTitle').textContent = s.title || '';
    document.getElementById('musicBarStatus').textContent = s.playing ? 'Ab baj raha hai' : 'Pause hai';
    document.getElementById('musicBarBtn').textContent = s.playing ? '⏸' : '▶';
  }

  function loadApiIfNeeded(){
    if(window.YT && window.YT.Player){ apiReady = true; return; }
    if(document.getElementById('ytIframeApiScript')) return;
    const tag = document.createElement('script');
    tag.id = 'ytIframeApiScript';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  }

  // YouTube's IFrame API calls this automatically once it finishes loading
  window.onYouTubeIframeAPIReady = function(){
    apiReady = true;
    if(pendingVideoId){
      createPlayer(pendingVideoId, pendingStart);
      pendingVideoId = null;
    }
  };

  function createPlayer(videoId, startSeconds){
    ensureBar();
    ytPlayer = new YT.Player('ytPlayerMount', {
      height: '0',
      width: '0',
      videoId: videoId,
      playerVars: { autoplay: 1, start: Math.max(0, Math.floor(startSeconds || 0)) },
      events: {
        onReady: e => {
          e.target.playVideo();
          startPositionSaver();
        },
        onStateChange: e => {
          const btn = document.getElementById('musicBarBtn');
          const status = document.getElementById('musicBarStatus');
          if(e.data === YT.PlayerState.PLAYING){
            setState({ playing: true });
            if(status) status.textContent = 'Ab baj raha hai';
            if(btn) btn.textContent = '⏸';
          }
          if(e.data === YT.PlayerState.PAUSED){
            setState({ playing: false });
            if(status) status.textContent = 'Pause hai';
            if(btn) btn.textContent = '▶';
          }
        }
      }
    });
  }

  function startPositionSaver(){
    if(saveTimer) clearInterval(saveTimer);
    saveTimer = setInterval(() => {
      if(ytPlayer && ytPlayer.getCurrentTime){
        try { setState({ position: ytPlayer.getCurrentTime() }); } catch(e){}
      }
    }, 3000);
  }

  // Called by the Admin panel's music search results — this is the
  // ONLY place a new song gets picked from.
  window.musicPlay = function(videoId, title, thumb){
    setState({ videoId, title, thumb, playing: true, position: 0 });
    showBarInfo(getState());
    if(ytPlayer){
      ytPlayer.loadVideoById(videoId);
    } else if(apiReady && window.YT && window.YT.Player){
      createPlayer(videoId, 0);
    } else {
      pendingVideoId = videoId;
      pendingStart = 0;
      loadApiIfNeeded();
    }
  };

  window.musicToggle = function(){
    if(!ytPlayer) return;
    const s = getState();
    if(s && s.playing){ ytPlayer.pauseVideo(); } else { ytPlayer.playVideo(); }
  };

  window.musicStop = function(){
    if(ytPlayer){ try { ytPlayer.stopVideo(); } catch(e){} }
    clearState();
    if(saveTimer) clearInterval(saveTimer);
    const bar = document.getElementById('musicBar');
    if(bar) bar.style.display = 'none';
  };

  // On every page load: if a song was left playing (from the admin
  // panel or from any other page), pick it back up automatically.
  document.addEventListener('DOMContentLoaded', function(){
    const s = getState();
    if(!s || !s.videoId) return;
    showBarInfo(s);
    if(!s.playing) return; // was paused elsewhere — leave it paused

    let startAt = s.position || 0;
    if(s.updatedAt) startAt += (Date.now() - s.updatedAt) / 1000;

    if(window.YT && window.YT.Player){
      apiReady = true;
      createPlayer(s.videoId, startAt);
    } else {
      pendingVideoId = s.videoId;
      pendingStart = startAt;
      loadApiIfNeeded();
    }
  });
})();
