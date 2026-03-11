/**
 * Zenel — Player
 * Handles audio element, queue management, playback state.
 */

class ZenelPlayer {
  constructor() {
    this.audio = document.getElementById('audio-element');
    this.queue = [];
    this.queueIndex = -1;
    this.shuffle = false;
    this.repeat = false; // false | 'one' | 'all'
    this.currentTrack = null;
    this.currentStream = null;
    this._dashPlayer = null;
    this._blobUrl = null;

    this._bindAudio();
  }

  /* ---- Queue ---- */
  setQueue(tracks, startIndex = 0) {
    this.queue = tracks;
    this.queueIndex = startIndex;
    this._playAtIndex(startIndex);
  }

  addToQueue(track) {
    this.queue.push(track);
    ui.renderQueue();
    ui.toast(`Added "${track.title}" to queue`);
  }

  async _playAtIndex(i) {
    if (i < 0 || i >= this.queue.length) return;
    this.queueIndex = i;
    const track = this.queue[i];
    await this.playTrack(track);
  }

  /* ---- Play a track object ---- */
  async playTrack(track) {
    if (!track) return;
    this.currentTrack = track;

    ui.setPlayerMeta(track);
    ui.showLoading(true);

    try {
      const stream = await api.getTrackStream(track.id, 'LOSSLESS');
      this.currentStream = stream;
      const resolved = api.resolveStreamUrl(stream);

      if (!resolved) throw new Error('Could not resolve stream URL');

      // Clean up previous blob
      if (this._blobUrl) { URL.revokeObjectURL(this._blobUrl); this._blobUrl = null; }

      // Tear down dash player if needed
      if (this._dashPlayer) {
        try { this._dashPlayer.destroy(); } catch (_) {}
        this._dashPlayer = null;
      }

      if (resolved.type === 'direct') {
        this.audio.src = resolved.url;
        this.audio.load();
        await this.audio.play();
      } else if (resolved.type === 'dash') {
        this._blobUrl = resolved.url;
        // Use dash.js if available, otherwise fall back to native (some browsers support DASH natively)
        if (window.dashjs) {
          const dash = dashjs.MediaPlayer().create();
          dash.initialize(this.audio, resolved.url, true);
          this._dashPlayer = dash;
        } else {
          this.audio.src = resolved.url;
          this.audio.load();
          await this.audio.play().catch(() => {});
        }
      }

      ui.setQualityBadge(stream);
      ui.updatePlayingState(true);
      ui.renderQueue();
    } catch (err) {
      console.error('Playback error:', err);
      ui.toast('Playback failed: ' + (err.message ?? 'unknown error'));
    } finally {
      ui.showLoading(false);
    }
  }

  /* ---- Transport ---- */
  togglePlay() {
    if (!this.currentTrack) return;
    if (this.audio.paused) {
      this.audio.play();
      ui.updatePlayingState(true);
    } else {
      this.audio.pause();
      ui.updatePlayingState(false);
    }
  }

  next() {
    if (!this.queue.length) return;
    if (this.repeat === 'one') { this.audio.currentTime = 0; this.audio.play(); return; }
    let next = this.queueIndex + 1;
    if (next >= this.queue.length) {
      if (this.repeat === 'all') next = 0;
      else return;
    }
    this._playAtIndex(next);
  }

  prev() {
    if (!this.queue.length) return;
    if (this.audio.currentTime > 3) { this.audio.currentTime = 0; return; }
    let prev = this.queueIndex - 1;
    if (prev < 0) prev = this.repeat === 'all' ? this.queue.length - 1 : 0;
    this._playAtIndex(prev);
  }

  seek(fraction) {
    if (!this.audio.duration) return;
    this.audio.currentTime = fraction * this.audio.duration;
  }

  setVolume(v) {
    this.audio.volume = Math.max(0, Math.min(1, v));
  }

  toggleShuffle() {
    this.shuffle = !this.shuffle;
    document.getElementById('shuffle-btn').classList.toggle('active', this.shuffle);
  }

  toggleRepeat() {
    const states = [false, 'one', 'all'];
    const idx = states.indexOf(this.repeat);
    this.repeat = states[(idx + 1) % states.length];
    const btn = document.getElementById('repeat-btn');
    btn.classList.toggle('active', this.repeat !== false);
    btn.title = this.repeat === 'one' ? 'Repeat One' : this.repeat === 'all' ? 'Repeat All' : 'Repeat';
  }

  /* ---- Audio events ---- */
  _bindAudio() {
    this.audio.addEventListener('timeupdate', () => ui.updateProgress(this.audio));
    this.audio.addEventListener('ended', () => {
      if (this.repeat === 'one') { this.audio.currentTime = 0; this.audio.play(); }
      else this.next();
    });
    this.audio.addEventListener('pause', () => ui.updatePlayingState(false));
    this.audio.addEventListener('play', () => ui.updatePlayingState(true));
    this.audio.addEventListener('error', (e) => {
      console.error('Audio error', e);
    });
  }
}

window.player = new ZenelPlayer();
