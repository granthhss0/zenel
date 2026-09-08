<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gemini</title>
<style>
  @font-face {
    font-family: 'system-serif';
    src: local('Iowan Old Style'), local('Palatino Linotype'), local('Georgia');
  }

  :root {
    --ink: #14131b;
    --panel: #1c1b26;
    --panel-2: #232230;
    --line: #322f42;
    --text: #ece9f4;
    --muted: #918da3;
    --gold: #c9a15e;
    --violet: #8f83d6;
    --error: #d97878;
  }

  * { box-sizing: border-box; }

  html, body {
    height: 100%;
    margin: 0;
  }

  body {
    background: var(--ink);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    background-image:
      radial-gradient(circle at 15% 8%, rgba(143,131,214,0.08), transparent 40%),
      radial-gradient(circle at 85% 92%, rgba(201,161,94,0.07), transparent 40%);
    background-attachment: fixed;
  }

  header {
    padding: 28px 24px 18px;
    text-align: center;
    position: relative;
  }

  header .mark {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  header .mark svg { width: 20px; height: 20px; }

  header h1 {
    font-family: 'system-serif', Georgia, serif;
    font-weight: 500;
    font-size: 22px;
    letter-spacing: 0.01em;
    margin: 0;
    color: var(--text);
  }

  header p {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--muted);
  }

  .toolbar {
    position: absolute;
    top: 24px;
    right: 24px;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  select {
    background: var(--panel);
    border: 1px solid var(--line);
    color: var(--muted);
    font-size: 12px;
    padding: 6px 8px;
    border-radius: 7px;
  }

  .icon-btn {
    background: transparent;
    border: 1px solid var(--line);
    color: var(--muted);
    width: 30px;
    height: 30px;
    border-radius: 7px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    line-height: 1;
  }
  .icon-btn:hover { color: var(--text); border-color: var(--violet); }

  main {
    flex: 1;
    overflow-y: auto;
    display: flex;
    justify-content: center;
  }

  #chat {
    width: 100%;
    max-width: 640px;
    padding: 12px 20px 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .empty {
    margin-top: 18vh;
    text-align: center;
    color: var(--muted);
  }
  .empty .glyph {
    font-family: 'system-serif', Georgia, serif;
    font-size: 40px;
    color: var(--violet);
    margin-bottom: 10px;
    font-style: italic;
  }
  .empty p { font-size: 14px; max-width: 320px; margin: 0 auto; line-height: 1.6; }

  .row { display: flex; flex-direction: column; gap: 6px; }
  .row.user { align-items: flex-end; }
  .row.ai { align-items: flex-start; }

  .label {
    font-size: 11px;
    color: var(--muted);
    padding: 0 4px;
  }

  .bubble {
    max-width: 500px;
    padding: 12px 16px;
    line-height: 1.6;
    font-size: 14.5px;
    white-space: pre-wrap;
    word-wrap: break-word;
    border-radius: 4px;
  }

  .row.user .bubble {
    background: transparent;
    border-right: 2px solid var(--violet);
    color: var(--text);
    padding-right: 14px;
    text-align: right;
  }

  .row.ai .bubble {
    background: var(--panel);
    border-left: 2px solid var(--gold);
    border-radius: 4px 10px 10px 4px;
  }

  .row.ai .bubble.pending {
    color: var(--muted);
    font-style: italic;
  }

  .row.ai .bubble.error {
    border-left-color: var(--error);
    color: var(--error);
    background: rgba(217,120,120,0.08);
  }

  .dot-flow span {
    display: inline-block;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--muted);
    margin-right: 3px;
    animation: pulse 1.2s infinite ease-in-out;
  }
  .dot-flow span:nth-child(2) { animation-delay: 0.15s; }
  .dot-flow span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes pulse {
    0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
    40% { opacity: 1; transform: scale(1); }
  }

  form {
    display: flex;
    justify-content: center;
    padding: 16px 20px 24px;
  }

  .composer-wrap {
    width: 100%;
    max-width: 640px;
    display: flex;
    flex-direction: column;
  }

  .composer {
    width: 100%;
    display: flex;
    gap: 10px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 8px 8px 8px 8px;
    align-items: flex-end;
  }

  .composer:focus-within {
    border-color: var(--violet);
  }

  .attach-btn {
    background: transparent;
    border: none;
    color: var(--muted);
    width: 36px;
    height: 36px;
    border-radius: 9px;
    cursor: pointer;
    font-size: 18px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .attach-btn:hover { color: var(--gold); }

  .previews {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  .preview-chip {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 5px 8px;
    font-size: 12px;
    color: var(--muted);
    max-width: 180px;
  }
  .preview-chip img {
    width: 22px;
    height: 22px;
    object-fit: cover;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .preview-chip .fname {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .preview-chip .rm {
    cursor: pointer;
    color: var(--muted);
    font-size: 13px;
    padding: 0 2px;
  }
  .preview-chip .rm:hover { color: var(--error); }

  .attachments {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
    justify-content: flex-end;
  }
  .row.ai .attachments { justify-content: flex-start; }
  .attachments img {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid var(--line);
  }
  .attachments .file-chip {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--muted);
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 4px 8px;
  }

  textarea {
    flex: 1;
    resize: none;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text);
    font-size: 14.5px;
    font-family: inherit;
    line-height: 1.5;
    padding: 8px 0;
    max-height: 140px;
  }

  textarea::placeholder { color: var(--muted); }

  button[type="submit"] {
    background: var(--violet);
    border: none;
    color: #14131b;
    width: 36px;
    height: 36px;
    border-radius: 9px;
    cursor: pointer;
    font-size: 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s;
  }
  button[type="submit"]:disabled { opacity: 0.35; cursor: not-allowed; }
  button[type="submit"]:not(:disabled):hover { opacity: 0.85; }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-thumb { background: var(--line); border-radius: 8px; }
</style>
</head>
<body>

<header>
  <div class="toolbar">
    <select id="model">
      <option value="gemini-2.5-flash">2.5 flash</option>
      <option value="gemini-2.5-pro">2.5 pro</option>
      <option value="gemini-2.0-flash">2.0 flash</option>
    </select>
    <button class="icon-btn" id="clearBtn" title="Clear conversation">↺</button>
  </div>
  <div class="mark">
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 8 18 10 22 10C18 10 12 12 12 22C12 12 6 10 2 10C6 10 12 8 12 2Z" fill="#c9a15e" fill-opacity="0.9"/>
    </svg>
    <h1>Gemini</h1>
  </div>
  <p>A quiet place to think out loud.</p>
</header>

<main>
  <div id="chat">
    <div class="empty" id="emptyState">
      <div class="glyph">"</div>
      <p>Start a conversation. Whatever you type here goes straight to Gemini and back — nothing in between.</p>
    </div>
  </div>
</main>

<form id="form">
  <div class="composer-wrap">
    <div class="previews" id="previews"></div>
    <div class="composer">
      <input type="file" id="fileInput" accept="image/*,application/pdf" multiple style="display:none;">
      <button type="button" class="attach-btn" id="attachBtn" title="Attach photos or a PDF">+</button>
      <textarea id="input" rows="1" placeholder="Say something..."></textarea>
      <button type="submit" id="sendBtn" title="Send">↑</button>
    </div>
  </div>
</form>

<script>
  // ── Put your Gemini API key here ─────────────────────────────
  const API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE";
  // ──────────────────────────────────────────────────────────────

  const chatEl = document.getElementById('chat');
  const emptyState = document.getElementById('emptyState');
  const form = document.getElementById('form');
  const input = document.getElementById('input');
  const modelEl = document.getElementById('model');
  const sendBtn = document.getElementById('sendBtn');
  const clearBtn = document.getElementById('clearBtn');
  const fileInput = document.getElementById('fileInput');
  const attachBtn = document.getElementById('attachBtn');
  const previewsEl = document.getElementById('previews');

  let history = [];
  let pendingFiles = []; // { name, mimeType, base64, previewUrl }

  const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB, generous local cap

  function hideEmpty() {
    if (emptyState) emptyState.remove();
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  }

  attachBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files || []);
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        hideEmpty();
        addRow('ai', `"${file.name}" is too large (over 15MB) — skipping it.`, { error: true });
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        const entry = {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64,
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        };
        pendingFiles.push(entry);
      } catch (err) {
        hideEmpty();
        addRow('ai', `Couldn't read "${file.name}": ${err.message}`, { error: true });
      }
    }
    fileInput.value = '';
    renderPreviews();
  });

  function renderPreviews() {
    previewsEl.innerHTML = '';
    pendingFiles.forEach((f, i) => {
      const chip = document.createElement('div');
      chip.className = 'preview-chip';
      if (f.previewUrl) {
        const img = document.createElement('img');
        img.src = f.previewUrl;
        chip.appendChild(img);
      }
      const name = document.createElement('span');
      name.className = 'fname';
      name.textContent = f.name;
      chip.appendChild(name);
      const rm = document.createElement('span');
      rm.className = 'rm';
      rm.textContent = '✕';
      rm.title = 'Remove';
      rm.addEventListener('click', () => {
        pendingFiles.splice(i, 1);
        renderPreviews();
      });
      chip.appendChild(rm);
      previewsEl.appendChild(chip);
    });
  }

  function addRow(role, content, opts = {}) {
    const row = document.createElement('div');
    row.className = 'row ' + role;

    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = role === 'user' ? 'you' : 'gemini';
    row.appendChild(label);

    if (opts.files && opts.files.length) {
      const attachWrap = document.createElement('div');
      attachWrap.className = 'attachments';
      opts.files.forEach(f => {
        if (f.previewUrl) {
          const img = document.createElement('img');
          img.src = f.previewUrl;
          attachWrap.appendChild(img);
        } else {
          const chip = document.createElement('div');
          chip.className = 'file-chip';
          chip.textContent = '📄 ' + f.name;
          attachWrap.appendChild(chip);
        }
      });
      row.appendChild(attachWrap);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble' + (opts.pending ? ' pending' : '') + (opts.error ? ' error' : '');
    if (opts.pending) {
      bubble.innerHTML = '<span class="dot-flow"><span></span><span></span><span></span></span>';
    } else if (content) {
      bubble.textContent = content;
    }
    if (content || opts.pending) row.appendChild(bubble);

    chatEl.appendChild(row);
    chatEl.parentElement.scrollTop = chatEl.parentElement.scrollHeight;
    return { row, bubble };
  }

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  clearBtn.addEventListener('click', () => {
    history = [];
    chatEl.innerHTML = '';
    chatEl.appendChild(emptyState);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    const filesToSend = pendingFiles.slice();
    if (!text && filesToSend.length === 0) return;

    if (!API_KEY || API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
      hideEmpty();
      addRow('ai', 'No API key set. Open the file and paste your key into the API_KEY constant near the top of the script.', { error: true });
      return;
    }

    hideEmpty();
    addRow('user', text, { files: filesToSend });

    const parts = [];
    filesToSend.forEach(f => {
      parts.push({ inlineData: { mimeType: f.mimeType, data: f.base64 } });
    });
    if (text) parts.push({ text });
    history.push({ role: 'user', parts });

    pendingFiles = [];
    renderPreviews();
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    const { row: pendingRow } = addRow('ai', '', { pending: true });

    const model = modelEl.value;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(API_KEY)}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: history })
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = (data && data.error && data.error.message) ? data.error.message : `Request failed (${res.status})`;
        pendingRow.remove();
        addRow('ai', 'Error: ' + msg, { error: true });
        history.pop();
        return;
      }

      const reply = data.candidates &&
                    data.candidates[0] &&
                    data.candidates[0].content &&
                    data.candidates[0].content.parts &&
                    data.candidates[0].content.parts.map(p => p.text || '').join('');

      pendingRow.remove();

      if (!reply) {
        addRow('ai', 'No reply came back — it may have been blocked. Check the browser console for details.', { error: true });
        console.log(data);
        history.pop();
        return;
      }

      addRow('ai', reply);
      history.push({ role: 'model', parts: [{ text: reply }] });

    } catch (err) {
      pendingRow.remove();
      addRow('ai', 'Network error: ' + err.message, { error: true });
      history.pop();
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  });
</script>

</body>
</html>
