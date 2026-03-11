/**
 * Zenel — App
 * Main controller: wires UI events, handles views, drives search/album/artist flows.
 */

document.addEventListener('DOMContentLoaded', () => {
  ui.setGreeting();

  /* ---- API instance selector ---- */
  const instanceSelect = document.getElementById('api-instance');
  const customInput = document.getElementById('custom-api');

  const savedInstance = localStorage.getItem('zenel_api');
  if (savedInstance) {
    const opt = [...instanceSelect.options].find(o => o.value === savedInstance);
    if (opt) instanceSelect.value = savedInstance;
    else {
      instanceSelect.value = 'custom';
      customInput.value = savedInstance;
      customInput.style.display = '';
    }
    api.setBase(savedInstance);
  }

  instanceSelect.addEventListener('change', () => {
    if (instanceSelect.value === 'custom') {
      customInput.style.display = '';
      customInput.focus();
    } else {
      customInput.style.display = 'none';
      api.setBase(instanceSelect.value);
      localStorage.setItem('zenel_api', instanceSelect.value);
      ui.toast(`API: ${instanceSelect.options[instanceSelect.selectedIndex].text}`);
    }
  });

  customInput.addEventListener('change', () => {
    const url = customInput.value.trim();
    if (url) {
      api.setBase(url);
      localStorage.setItem('zenel_api', url);
      ui.toast('Custom API set');
    }
  });

  /* ---- Nav ---- */
  document.querySelectorAll('.nav-item').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const view = a.dataset.view;
      ui.showView(view);
      if (view === 'library') ui.renderLibrary();
    });
  });

  /* ---- Home search ---- */
  const homeSearch = document.getElementById('home-search');
  homeSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runHomeSearch(homeSearch.value.trim());
  });

  async function runHomeSearch(q) {
    if (!q) return;
    ui.showLoading(true);
    const resultsEl = document.getElementById('home-results');
    try {
      const [tracks, albums] = await Promise.all([
        api.searchTracks(q, 10),
        api.searchAlbums(q, 8)
      ]);
      let html = '';

      if (tracks.length) {
        html += `<div style="grid-column:1/-1"><p class="section-title">Tracks</p></div>`;
        html += `<div class="results-list" id="home-track-results" style="grid-column:1/-1">
          ${tracks.map((t, i) => ui.trackRow(t, i, true)).join('')}
        </div>`;
      }

      if (albums.length) {
        html += `<div style="grid-column:1/-1; margin-top:1.5rem"><p class="section-title">Albums</p></div>`;
        html += albums.map(a => ui.albumCard(a)).join('');
      }

      if (!html) html = `<div class="empty-state" style="grid-column:1/-1"><p>No results for "${q}"</p></div>`;

      resultsEl.innerHTML = html;
      resultsEl.classList.remove('hidden');

      // Bind track rows
      const trackList = document.getElementById('home-track-results');
      if (trackList) ui.attachTrackRowListeners(trackList, tracks);

      // Bind album cards
      resultsEl.querySelectorAll('[data-album-id]').forEach(card => {
        card.addEventListener('click', () => loadAlbum(card.dataset.albumId));
      });
    } catch (err) {
      ui.toast('Search failed: ' + err.message);
    } finally {
      ui.showLoading(false);
    }
  }

  /* ---- Search view ---- */
  const searchInput = document.getElementById('search-input');
  let searchType = 'tracks';
  let searchDebounce = null;

  document.querySelectorAll('.search-type-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      searchType = tab.dataset.type;
      if (searchInput.value.trim()) runSearch(searchInput.value.trim());
    });
  });

  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      if (searchInput.value.trim().length >= 2) runSearch(searchInput.value.trim());
    }, 400);
  });

  async function runSearch(q) {
    const resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = '<div class="empty-state"><div class="spinner"></div></div>';

    try {
      if (searchType === 'tracks') {
        const tracks = await api.searchTracks(q, 30);
        if (!tracks.length) { resultsEl.innerHTML = `<div class="empty-state"><p>No tracks found</p></div>`; return; }
        resultsEl.innerHTML = `<div class="results-list">${tracks.map((t, i) => ui.trackRow(t, i, true)).join('')}</div>`;
        ui.attachTrackRowListeners(resultsEl.querySelector('.results-list'), tracks);

      } else if (searchType === 'albums') {
        const albums = await api.searchAlbums(q, 20);
        if (!albums.length) { resultsEl.innerHTML = `<div class="empty-state"><p>No albums found</p></div>`; return; }
        resultsEl.innerHTML = `<div class="results-grid">${albums.map(a => ui.albumCard(a)).join('')}</div>`;
        resultsEl.querySelectorAll('[data-album-id]').forEach(card => {
          card.addEventListener('click', () => loadAlbum(card.dataset.albumId));
        });

      } else if (searchType === 'artists') {
        const artists = await api.searchArtists(q, 20);
        if (!artists.length) { resultsEl.innerHTML = `<div class="empty-state"><p>No artists found</p></div>`; return; }
        resultsEl.innerHTML = artists.map(a => `
          <div class="artist-row" data-artist-id="${a.id}">
            <img class="artist-avatar" src="${api.artistImgUrl(a.picture, 160)}" alt="${ui._esc(a.name)}" loading="lazy" />
            <div class="artist-name">${ui._esc(a.name)}</div>
          </div>`).join('');
        resultsEl.querySelectorAll('[data-artist-id]').forEach(row => {
          row.addEventListener('click', () => loadArtist(row.dataset.artistId));
        });
      }
    } catch (err) {
      resultsEl.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
    }
  }

  /* ---- Album view ---- */
  async function loadAlbum(id) {
    ui.showLoading(true);
    ui.showView('album');
    try {
      const album = await api.getAlbum(id);
      if (!album) throw new Error('Album not found');

      const tracks = album.tracks?.items ?? album.tracks ?? [];
      const artist = album.artist ?? album.artists?.[0] ?? {};
      const year = album.releaseDate ? new Date(album.releaseDate).getFullYear() : '';
      const duration = tracks.reduce((s, t) => s + (t.duration ?? 0), 0);

      document.getElementById('album-detail').innerHTML = `
        <div class="album-hero">
          <img class="album-hero-art" src="${api.coverUrl(album.cover, 640)}" alt="${ui._esc(album.title)}" />
          <div class="album-hero-info">
            <div class="album-hero-label">Album</div>
            <h1 class="album-hero-title">${ui._esc(album.title)}</h1>
            <div class="album-hero-artist" data-artist-id="${artist.id}">${ui._esc(artist.name)}</div>
            <div class="album-hero-meta">${year}${year && tracks.length ? ' · ' : ''}${tracks.length ? `${tracks.length} tracks` : ''}${duration ? ` · ${ui._fmt(duration)}` : ''}</div>
            <div class="album-actions">
              <button class="btn-primary" id="album-play-all">▶ Play All</button>
              <button class="btn-ghost" id="album-shuffle">⇌ Shuffle</button>
            </div>
          </div>
        </div>
        <div class="album-tracks" id="album-track-list">
          ${tracks.map((t, i) => ui.trackRow(t, i)).join('')}
        </div>`;

      const trackListEl = document.getElementById('album-track-list');
      ui.attachTrackRowListeners(trackListEl, tracks);

      document.getElementById('album-play-all').addEventListener('click', () => {
        player.setQueue(tracks, 0);
      });

      document.getElementById('album-shuffle').addEventListener('click', () => {
        const shuffled = [...tracks].sort(() => Math.random() - 0.5);
        player.setQueue(shuffled, 0);
      });

      document.querySelector('.album-hero-artist').addEventListener('click', () => {
        loadArtist(artist.id);
      });

    } catch (err) {
      document.getElementById('album-detail').innerHTML = `<div class="empty-state"><p>Failed: ${err.message}</p></div>`;
    } finally {
      ui.showLoading(false);
    }
  }

  /* ---- Artist view ---- */
  async function loadArtist(id) {
    ui.showLoading(true);
    ui.showView('artist');
    try {
      const data = await api.getArtist(id);
      if (!data) throw new Error('Artist not found');

      const artist = data.artist ?? data;
      const topTracks = data.topTracks?.items ?? data.topTracks ?? [];
      const albums = data.albums?.items ?? data.albums ?? [];

      const picUrl = api.artistImgUrl(artist.picture, 1080);

      let html = `<div class="artist-hero">
        ${picUrl ? `<img class="artist-hero-bg" src="${picUrl}" alt="" />` : ''}
        <div class="artist-hero-overlay"></div>
        <div class="artist-hero-content">
          <h1 class="artist-hero-name">${ui._esc(artist.name)}</h1>
        </div>
      </div>`;

      if (topTracks.length) {
        html += `<p class="artist-section-title">Top Tracks</p>
          <div class="results-list" id="artist-top-tracks">
            ${topTracks.slice(0, 10).map((t, i) => ui.trackRow(t, i, true)).join('')}
          </div>`;
      }

      if (albums.length) {
        html += `<p class="artist-section-title">Albums</p>
          <div class="results-grid" id="artist-albums">
            ${albums.map(a => ui.albumCard(a)).join('')}
          </div>`;
      }

      document.getElementById('artist-detail').innerHTML = html;

      if (topTracks.length) {
        const el = document.getElementById('artist-top-tracks');
        ui.attachTrackRowListeners(el, topTracks.slice(0, 10));
      }

      document.querySelectorAll('#artist-albums [data-album-id]').forEach(card => {
        card.addEventListener('click', () => loadAlbum(card.dataset.albumId));
      });

    } catch (err) {
      document.getElementById('artist-detail').innerHTML = `<div class="empty-state"><p>Failed: ${err.message}</p></div>`;
    } finally {
      ui.showLoading(false);
    }
  }

  // expose for use in ui.js album card click handler
  window._loadAlbum = loadAlbum;
  window._loadArtist = loadArtist;

  /* ---- Player controls ---- */
  document.getElementById('play-btn').addEventListener('click', () => player.togglePlay());
  document.getElementById('next-btn').addEventListener('click', () => player.next());
  document.getElementById('prev-btn').addEventListener('click', () => player.prev());
  document.getElementById('shuffle-btn').addEventListener('click', () => player.toggleShuffle());
  document.getElementById('repeat-btn').addEventListener('click', () => player.toggleRepeat());
  document.getElementById('like-btn').addEventListener('click', () => {
    if (player.currentTrack) ui.toggleLike(player.currentTrack.id);
  });

  /* ---- Progress bar scrubbing ---- */
  const progressBar = document.getElementById('progress-bar');
  let scrubbing = false;

  progressBar.addEventListener('mousedown', (e) => {
    scrubbing = true;
    scrub(e);
  });
  document.addEventListener('mousemove', (e) => { if (scrubbing) scrub(e); });
  document.addEventListener('mouseup', () => { scrubbing = false; });

  function scrub(e) {
    const rect = progressBar.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    player.seek(frac);
  }

  /* ---- Volume ---- */
  document.getElementById('volume-slider').addEventListener('input', (e) => {
    player.setVolume(+e.target.value);
  });

  /* ---- Keyboard shortcuts ---- */
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); player.togglePlay(); }
    if (e.code === 'ArrowRight') player.next();
    if (e.code === 'ArrowLeft') player.prev();
  });
});
