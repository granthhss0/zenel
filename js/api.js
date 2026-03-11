/**
 * Zenel — HiFi API Client
 * Mirrors how Monochrome interfaces with the hifi-api (binimum/hifi-api).
 *
 * Endpoints used:
 *   GET /search/?s=<query>          — track search
 *   GET /search/?a=<query>          — artist search
 *   GET /info/?id=<id>              — track metadata
 *   GET /track/?id=<id>&quality=... — stream manifest
 *   GET /album/?id=<id>             — album metadata + tracks
 *   GET /artist/?id=<id>            — artist metadata + top tracks + albums
 *   GET /recommendations/?id=<id>   — related tracks
 *
 * Cover art:  https://resources.tidal.com/images/<uuid-dashed>/640x640.jpg
 * Artist img: https://resources.tidal.com/images/<uuid-dashed>/750x750.jpg
 */

class HifiAPI {
  constructor(baseUrl = 'https://ohio.monochrome.tf') {
    this.base = baseUrl.replace(/\/$/, '');
  }

  setBase(url) {
    this.base = url.replace(/\/$/, '');
  }

  async _get(path) {
    const url = `${this.base}${path}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`API error ${resp.status}: ${url}`);
    return resp.json();
  }

  /* ---- Cover / image helpers ---- */
  coverUrl(uuid, size = 640) {
    if (!uuid) return '';
    const dashed = uuid.replace(/-/g, '/');
    return `https://resources.tidal.com/images/${dashed}/${size}x${size}.jpg`;
  }

  artistImgUrl(uuid, size = 750) {
    if (!uuid) return '';
    const dashed = uuid.replace(/-/g, '/');
    return `https://resources.tidal.com/images/${dashed}/${size}x${size}.jpg`;
  }

  /* ---- Search ---- */
  async searchTracks(query, limit = 25) {
    const data = await this._get(`/search/?s=${encodeURIComponent(query)}&limit=${limit}`);
    return data?.data?.items ?? [];
  }

  async searchArtists(query, limit = 20) {
    const data = await this._get(`/search/?a=${encodeURIComponent(query)}&limit=${limit}`);
    return data?.data?.artists?.items ?? data?.data?.items ?? [];
  }

  async searchAlbums(query, limit = 20) {
    // hifi-api returns tracks by default; fall through to track search and filter by album
    const data = await this._get(`/search/?s=${encodeURIComponent(query)}&limit=${limit}`);
    const tracks = data?.data?.items ?? [];
    // Deduplicate albums
    const seen = new Set();
    return tracks
      .map(t => t.album)
      .filter(a => a && !seen.has(a.id) && seen.add(a.id));
  }

  /* ---- Track ---- */
  async getTrackInfo(id) {
    const data = await this._get(`/info/?id=${id}`);
    return data?.data ?? null;
  }

  async getTrackStream(id, quality = 'LOSSLESS') {
    const data = await this._get(`/track/?id=${id}&quality=${quality}`);
    return data?.data ?? null;
  }

  /* ---- Album ---- */
  async getAlbum(id) {
    const data = await this._get(`/album/?id=${id}`);
    return data?.data ?? null;
  }

  /* ---- Artist ---- */
  async getArtist(id) {
    const data = await this._get(`/artist/?id=${id}`);
    return data?.data ?? null;
  }

  /* ---- Recommendations ---- */
  async getRecommendations(id) {
    const data = await this._get(`/recommendations/?id=${id}`);
    const items = data?.data?.items ?? [];
    return items.map(i => i.track ?? i).filter(Boolean);
  }

  /* ---- Manifest → stream URL ---- */
  resolveStreamUrl(streamData) {
    if (!streamData?.manifest) return null;

    const mime = streamData.manifestMimeType ?? '';
    const raw = atob(streamData.manifest);

    if (mime === 'application/vnd.tidal.bts') {
      // JSON manifest
      const json = JSON.parse(raw);
      return { url: json.urls?.[0] ?? null, type: 'direct', mimeType: json.mimeType };
    }

    if (mime === 'application/dash+xml') {
      // MPEG-DASH manifest — return MPD blob URL for use with a DASH player
      const blob = new Blob([raw], { type: 'application/dash+xml' });
      return { url: URL.createObjectURL(blob), type: 'dash', mimeType: 'application/dash+xml' };
    }

    return null;
  }

  /* ---- Quality label ---- */
  qualityLabel(streamData) {
    const q = streamData?.audioQuality ?? '';
    const depth = streamData?.bitDepth;
    const rate = streamData?.sampleRate;
    if (q === 'HI_RES_LOSSLESS') return depth && rate ? `${depth}bit/${Math.round(rate/1000)}kHz` : 'HiRes';
    if (q === 'LOSSLESS') return 'FLAC';
    if (q === 'HIGH') return '320 AAC';
    if (q === 'LOW') return '96 AAC';
    return q;
  }
}

window.api = new HifiAPI();
