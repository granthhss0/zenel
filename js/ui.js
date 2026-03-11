/**
 * Zenel — UI
 * All DOM rendering and interaction logic.
 */

class ZenelUI {
  constructor() {
    this._toastTimer = null;
    this._liked = new Set(JSON.parse(localStorage.getItem('zenel_liked') ?? '[]'));
  }

  /* ---- Toast ---- */
  toast(msg, duration = 2400) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
  }

  /* ---- Loading ---- */
  showLoading(show) {
    document.getElementById('loading-overlay').classList.toggle('hidden', !show);
  }

  /* ---- Views ---- */
  showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${name}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(a => {
      a.classList.toggle('active', a.dataset.view === name);
    });
  }

  /* ---- Player meta ---- */
  setPlayerMeta(track) {
    document.getElementById('player-title').textContent = track.title ?? '—';
    document.getElementById('player-artist').textContent =
      (track.artists ?? [track.artist]).map(a => a?.name).filter(Boolean).join(', ') || '—';
    const cover = document.getElementById('player-cover');
    const coverUuid = track.album?.cover ?? null;
    cover.src = coverUuid ? api.coverUrl(coverUuid, 160) : '';
    this._updateLikeBtn(track.id);
  }

  setQualityBadge(stream) {
    const badge = document.getElementById('quality-badge');
    const label = api.qualityLabel(stream);
    const q = stream?.audioQuality ?? '';
    badge.textContent = label;
    badge.className = 'quality-badge';
    if (q === 'HI_RES_LOSSLESS') badge.classList.add('hires');
    else if (q === 'LOSSLESS') badge.classList.add('lossless');
    badge.classList.remove('hidden');
  }

  updatePlayingState(playing) {
    document.getElementById('play-icon').style.display = playing ? 'none' : '';
    document.getElementById('pause-icon').style.display = playing ? '' : 'none';
    this.renderQueue();
  }

  updateProgress(audio) {
    if (!audio.duration) return;
    const frac = audio.currentTime / audio.duration;
    document.getElementById('progress-fill').style.width = `${frac * 100}%`;
    document.getElementById('progress-thumb').style.left = `${frac * 100}%`;
    document.getElementById('time-current').textContent = this._fmt(audio.currentTime);
    document.getElementById('time-total').textContent = this._fmt(audio.duration);
  }

  _fmt(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = String(Math.floor(s % 60)).padStart(2, '0');
    return `${m}:${sec}`;
  }

  /* ---- Queue ---- */
  renderQueue() {
    const list = document.getElementById('queue-list');
    if (!player.queue.length) { list.innerHTML = ''; return; }
    list.innerHTML = player.queue.map((t, i) => {
      const active = i === player.queueIndex;
      const num = active
        ? `<div class="playing-bars"><span></span><span></span><span></span></div>`
        : `<span class="queue-item-num">${i + 1}</span>`;
      return `<div class="queue-item ${active ? 'playing' : ''}" data-qi="${i}">
        ${num}
        <div class="queue-item-info">
          <div class="queue-item-title">${this._esc(t.title)}</div>
          <div class="queue-item-artist">${this._esc((t.artists ?? [t.artist]).map(a => a?.name).filter(Boolean).join(', '))}</div>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('.queue-item').forEach(el => {
      el.addEventListener('click', () => player._playAtIndex(+el.dataset.qi));
    });
  }

  /* ---- Track row ---- */
  trackRow(track, index, showCover = false) {
    const artists = (track.artists ?? [track.artist]).map(a => a?.name).filter(Boolean).join(', ');
    const coverHtml = showCover
      ? `<img class="track-cover" src="${api.coverUrl(track.album?.cover, 80)}" alt="" loading="lazy" />`
      : `<span class="track-num">${index + 1}</span>`;
    return `<div class="track-row" data-id="${track.id}" data-idx="${index}">
      ${coverHtml}
      <div class="track-info">
        <div class="track-title">${this._esc(track.title)}</div>
        <div class="track-artist">${this._esc(artists)}</div>
      </div>
      <span class="track-duration">${this._fmt(track.duration)}</span>
    </div>`;
  }

  attachTrackRowListeners(container, tracks) {
    container.querySelectorAll('.track-row').forEach(row => {
      row.addEventListener('click', () => {
        const idx = +row.dataset.idx;
        player.setQueue(tracks, idx);
      });
      row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const idx = +row.dataset.idx;
        player.addToQueue(tracks[idx]);
      });
    });
  }

  /* ---- Card ---- */
  albumCard(album) {
    const artistName = album.artist?.name ?? album.artists?.[0]?.name ?? '';
    return `<div class="card" data-album-id="${album.id}">
      <img class="card-art" src="${api.coverUrl(album.cover, 320)}" alt="${this._esc(album.title)}" loading="lazy" />
      <div class="card-info">
        <div class="card-title">${this._esc(album.title)}</div>
        <div class="card-sub">${this._esc(artistName)}</div>
      </div>
      <div class="card-play-overlay">
        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </div>
    </div>`;
  }

  /* ---- Like ---- */
  _updateLikeBtn(trackId) {
    const btn = document.getElementById('like-btn');
    btn.classList.toggle('liked', this._liked.has(trackId));
  }

  toggleLike(trackId) {
    if (this._liked.has(trackId)) this._liked.delete(trackId);
    else this._liked.add(trackId);
    localStorage.setItem('zenel_liked', JSON.stringify([...this._liked]));
    this._updateLikeBtn(trackId);
    this.renderLibrary();
  }

  /* ---- Library ---- */
  renderLibrary() {
    const container = document.getElementById('library-content');
    if (!this._liked.size) {
      container.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <p>Your liked tracks will appear here.</p>
        <p class="small">Like a song by pressing the ♥ button.</p>
      </div>`;
      return;
    }
    const ids = [...this._liked];
    container.innerHTML = `<p class="section-title">${ids.length} Liked Track${ids.length !== 1 ? 's' : ''}</p><div class="results-list" id="library-tracks"></div>`;
    // Load track info async
    const listEl = document.getElementById('library-tracks');
    Promise.all(ids.map(id => api.getTrackInfo(id).catch(() => null))).then(tracks => {
      const valid = tracks.filter(Boolean);
      listEl.innerHTML = valid.map((t, i) => this.trackRow(t, i, true)).join('');
      this.attachTrackRowListeners(listEl, valid);
    });
  }

  /* ---- Greeting ---- */
  setGreeting() {
    const h = new Date().getHours();
    const g = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
    document.getElementById('greeting-time').textContent = g;
  }

  /* ---- Escape ---- */
  _esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.ui = new ZenelUI();
