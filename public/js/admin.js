(function () {
  const PAGE_COUNT = 21;
  let content = null;
  let currentTarget = 'cover'; // 'cover' | 'page-<n>' | 'epilogue' | 'truecover' | 'global'
  let dirty = false;

  const loginScreen = document.getElementById('login-screen');
  const loginForm = document.getElementById('login-form');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const adminApp = document.getElementById('admin-app');
  const saveStatus = document.getElementById('save-status');
  const saveBtn = document.getElementById('save-btn');
  const pageList = document.getElementById('page-list');

  function markDirty() {
    dirty = true;
    saveStatus.textContent = 'Unsaved changes';
  }

  async function api(path, options) {
    const res = await fetch(path, options);
    if (res.status === 401) {
      showLogin();
      throw new Error('Not authenticated');
    }
    return res;
  }

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('image', file);
    const res = await api('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('Upload failed: ' + (err.error || res.status));
      throw new Error('upload failed');
    }
    const data = await res.json();
    return data.url;
  }

  function showLogin() {
    loginScreen.classList.remove('hidden');
    adminApp.classList.add('hidden');
  }

  function showApp() {
    loginScreen.classList.add('hidden');
    adminApp.classList.remove('hidden');
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: loginPassword.value })
    });
    if (res.ok) {
      await boot();
    } else {
      loginError.textContent = 'Wrong password';
    }
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    showLogin();
  });

  saveBtn.addEventListener('click', async () => {
    saveStatus.textContent = 'Saving...';
    const res = await api('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content)
    });
    if (res.ok) {
      dirty = false;
      saveStatus.textContent = 'All changes saved';
    } else {
      saveStatus.textContent = 'Save failed';
    }
  });

  window.addEventListener('beforeunload', (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // ---------- Sidebar ----------
  function buildSidebar() {
    pageList.innerHTML = '';
    for (let i = 0; i < PAGE_COUNT; i++) {
      const btn = document.createElement('button');
      btn.className = 'side-item';
      btn.dataset.target = 'page-' + i;
      btn.textContent = 'Page ' + (i + 1);
      pageList.appendChild(btn);
    }
  }

  function setActiveSidebar(target) {
    document.querySelectorAll('.side-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.target === target);
    });
  }

  function selectTarget(target) {
    currentTarget = target;
    setActiveSidebar(target);
    document.querySelectorAll('.panel').forEach((p) => p.classList.add('hidden'));
    if (target === 'cover') {
      document.getElementById('panel-cover').classList.remove('hidden');
      renderCoverPanel();
    } else if (target === 'epilogue') {
      document.getElementById('panel-epilogue').classList.remove('hidden');
      renderEpiloguePanel();
    } else if (target === 'truecover') {
      document.getElementById('panel-truecover').classList.remove('hidden');
      renderTrueCoverPanel();
    } else if (target === 'global') {
      document.getElementById('panel-global').classList.remove('hidden');
      renderGlobalPanel();
    } else if (target.startsWith('page-')) {
      document.getElementById('panel-page').classList.remove('hidden');
      const idx = parseInt(target.split('-')[1], 10);
      renderPagePanel(idx);
    }
  }

  document.querySelector('.sidebar').addEventListener('click', (e) => {
    const btn = e.target.closest('.side-item');
    if (!btn) return;
    selectTarget(btn.dataset.target);
  });

  // ---------- Cover ----------
  function renderCoverPanel() {
    const preview = document.getElementById('cover-preview');
    if (content.coverImage) {
      preview.innerHTML = `<img src="${content.coverImage}" />`;
    } else {
      preview.textContent = 'No image yet';
    }
    document.getElementById('cover-title').value = content.title || '';
  }

  document.getElementById('cover-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadFile(file);
    content.coverImage = url;
    markDirty();
    renderCoverPanel();
  });

  document.getElementById('cover-title').addEventListener('input', (e) => {
    content.title = e.target.value;
    markDirty();
  });

  // ---------- Epilogue ----------
  function renderEpiloguePanel() {
    const preview = document.getElementById('epilogue-preview');
    preview.innerHTML = content.epilogueImage ? `<img src="${content.epilogueImage}" />` : 'No image yet';
  }

  document.getElementById('epilogue-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadFile(file);
    content.epilogueImage = url;
    markDirty();
    renderEpiloguePanel();
  });

  // ---------- True cover ----------
  function renderTrueCoverPanel() {
    const preview = document.getElementById('truecover-preview');
    preview.innerHTML = content.trueCoverImage ? `<img src="${content.trueCoverImage}" />` : 'No image yet';
    document.getElementById('yes-message').value = content.yesMessage || '';
    document.getElementById('no-message').value = content.noMessage || '';
  }

  document.getElementById('truecover-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadFile(file);
    content.trueCoverImage = url;
    markDirty();
    renderTrueCoverPanel();
  });

  document.getElementById('yes-message').addEventListener('input', (e) => {
    content.yesMessage = e.target.value;
    markDirty();
  });
  document.getElementById('no-message').addEventListener('input', (e) => {
    content.noMessage = e.target.value;
    markDirty();
  });

  // ---------- Global margin ----------
  function renderGlobalPanel() {
    const m = content.globalMargin;
    document.getElementById('g-top').value = m.top;
    document.getElementById('g-right').value = m.right;
    document.getElementById('g-bottom').value = m.bottom;
    document.getElementById('g-left').value = m.left;
  }

  ['top', 'right', 'bottom', 'left'].forEach((side) => {
    document.getElementById('g-' + side).addEventListener('input', (e) => {
      content.globalMargin[side] = parseFloat(e.target.value) || 0;
      markDirty();
    });
  });

  // ---------- Page (quote + note) ----------
  let quoteDrag = null; // {mode:'move'|'resize', startX, startY, orig}

  function renderPagePanel(idx) {
    const page = content.pages[idx];
    document.getElementById('page-heading').textContent =
      `Page ${idx + 1} (spread ${idx * 2 + 1}-${idx * 2 + 2})`;

    const qt = page.quoteTransform;
    document.getElementById('q-x').value = qt.x;
    document.getElementById('q-y').value = qt.y;
    document.getElementById('q-w').value = qt.width;
    document.getElementById('q-h').value = qt.height;
    document.getElementById('q-r').value = qt.rotation || 0;

    const box = document.getElementById('quote-box');
    const inner = document.getElementById('quote-box-inner');
    box.style.left = qt.x + '%';
    box.style.top = qt.y + '%';
    box.style.width = qt.width + '%';
    box.style.height = qt.height + '%';
    box.style.transform = `rotate(${qt.rotation || 0}deg)`;
    inner.innerHTML = page.quoteImage ? `<img src="${page.quoteImage}" />` : 'no image';

    const noteBox = document.getElementById('note-box');
    noteBox.innerHTML = page.noteImage ? `<img src="${page.noteImage}" />` : 'no image';

    const override = !!page.margin;
    document.getElementById('margin-override').checked = override;
    const m = page.margin || content.globalMargin;
    document.getElementById('m-top').value = m.top;
    document.getElementById('m-right').value = m.right;
    document.getElementById('m-bottom').value = m.bottom;
    document.getElementById('m-left').value = m.left;
    document.getElementById('margin-fields').style.opacity = override ? '1' : '0.4';

    document.getElementById('quote-file').onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = await uploadFile(file);
      content.pages[idx].quoteImage = url;
      markDirty();
      renderPagePanel(idx);
    };

    document.getElementById('note-file').onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = await uploadFile(file);
      content.pages[idx].noteImage = url;
      markDirty();
      renderPagePanel(idx);
    };

    ['x', 'y', 'w', 'h', 'r'].forEach((key) => {
      const map = { x: 'x', y: 'y', w: 'width', h: 'height', r: 'rotation' };
      document.getElementById('q-' + key).oninput = (e) => {
        content.pages[idx].quoteTransform[map[key]] = parseFloat(e.target.value) || 0;
        markDirty();
        renderPagePanel(idx);
      };
    });

    document.getElementById('margin-override').onchange = (e) => {
      if (e.target.checked) {
        content.pages[idx].margin = { ...content.globalMargin };
      } else {
        content.pages[idx].margin = null;
      }
      markDirty();
      renderPagePanel(idx);
    };

    ['top', 'right', 'bottom', 'left'].forEach((side) => {
      document.getElementById('m-' + side).oninput = (e) => {
        if (!content.pages[idx].margin) content.pages[idx].margin = { ...content.globalMargin };
        content.pages[idx].margin[side] = parseFloat(e.target.value) || 0;
        markDirty();
      };
    });

    setupDrag(idx);
  }

  function setupDrag(idx) {
    const stage = document.getElementById('stage-left');
    const box = document.getElementById('quote-box');
    const handle = document.getElementById('resize-handle');

    box.onmousedown = (e) => {
      if (e.target === handle) return;
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      const qt = content.pages[idx].quoteTransform;
      quoteDrag = {
        mode: 'move',
        startX: e.clientX,
        startY: e.clientY,
        rectW: rect.width,
        rectH: rect.height,
        orig: { ...qt }
      };
    };

    handle.onmousedown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = stage.getBoundingClientRect();
      const qt = content.pages[idx].quoteTransform;
      quoteDrag = {
        mode: 'resize',
        startX: e.clientX,
        startY: e.clientY,
        rectW: rect.width,
        rectH: rect.height,
        orig: { ...qt }
      };
    };

    document.onmousemove = (e) => {
      if (!quoteDrag) return;
      const dxPct = ((e.clientX - quoteDrag.startX) / quoteDrag.rectW) * 100;
      const dyPct = ((e.clientY - quoteDrag.startY) / quoteDrag.rectH) * 100;
      const qt = content.pages[idx].quoteTransform;
      if (quoteDrag.mode === 'move') {
        qt.x = clamp(quoteDrag.orig.x + dxPct, 0, 100 - qt.width);
        qt.y = clamp(quoteDrag.orig.y + dyPct, 0, 100 - qt.height);
      } else {
        qt.width = clamp(quoteDrag.orig.width + dxPct, 5, 100 - qt.x);
        qt.height = clamp(quoteDrag.orig.height + dyPct, 5, 100 - qt.y);
      }
      markDirty();
      renderPagePanel(idx);
    };

    document.onmouseup = () => {
      quoteDrag = null;
    };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // ---------- Boot ----------
  async function boot() {
    const sessionRes = await fetch('/api/session');
    const session = await sessionRes.json();
    if (!session.isAdmin) {
      showLogin();
      return;
    }
    const contentRes = await fetch('/api/content');
    content = await contentRes.json();
    showApp();
    buildSidebar();
    selectTarget('cover');
  }

  boot();
})();
