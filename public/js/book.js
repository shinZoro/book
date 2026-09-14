(function () {
  const PAGE_COUNT = 21;
  const COVER = -1;
  const CLOSING = PAGE_COUNT; // index right after the last page

  let content = null;
  let current = COVER;
  let animating = false;

  const bookEl = document.getElementById('book');
  const frontCover = document.getElementById('front-cover');
  const frontCoverImgHolder = document.getElementById('front-cover-card');
  const frontCoverPlaceholder = document.getElementById('front-cover-placeholder');
  const frontCoverTitle = document.getElementById('front-cover-title');
  const spreadLayer = document.getElementById('spread-layer');
  const closingScreen = document.getElementById('closing-screen');
  const epilogueImg = document.getElementById('epilogue-img');
  const epiloguePlaceholder = document.getElementById('epilogue-placeholder');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const navIndicator = document.getElementById('nav-indicator');
  const replyMessage = document.getElementById('reply-message');
  const revealScreen = document.getElementById('reveal-screen');
  const revealImg = document.getElementById('reveal-img');
  const revealMessage = document.getElementById('reveal-message');

  function marginFor(page) {
    const m = (page && page.margin) || content.globalMargin || { top: 24, right: 24, bottom: 24, left: 24 };
    return m;
  }

  function buildSpreadEl(pageIndex) {
    const page = content.pages[pageIndex];
    const el = document.createElement('div');
    el.className = 'spread';
    el.dataset.index = pageIndex;

    const left = document.createElement('div');
    left.className = 'page page-left';

    const qt = page.quoteTransform || { x: 15, y: 20, width: 70, height: 45, rotation: 0 };
    const frame = document.createElement('div');
    frame.className = 'quote-frame';
    frame.style.left = qt.x + '%';
    frame.style.top = qt.y + '%';
    frame.style.width = qt.width + '%';
    frame.style.height = qt.height + '%';
    frame.style.transform = `rotate(${qt.rotation || 0}deg)`;

    if (page.quoteImage) {
      const img = document.createElement('img');
      img.src = page.quoteImage;
      img.alt = 'Quote';
      frame.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'quote-placeholder';
      ph.textContent = 'quote image ' + (pageIndex + 1);
      frame.appendChild(ph);
    }
    left.appendChild(frame);
    const leftNum = document.createElement('div');
    leftNum.className = 'page-number';
    leftNum.textContent = String(pageIndex * 2 + 1);
    left.appendChild(leftNum);

    const right = document.createElement('div');
    right.className = 'page page-right';
    const margin = marginFor(page);
    const noteFill = document.createElement('div');
    noteFill.className = 'note-fill';
    noteFill.style.top = margin.top + 'px';
    noteFill.style.right = margin.right + 'px';
    noteFill.style.bottom = margin.bottom + 'px';
    noteFill.style.left = margin.left + 'px';

    if (page.noteImage) {
      const img = document.createElement('img');
      img.src = page.noteImage;
      img.alt = 'Handwritten note';
      noteFill.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'note-placeholder';
      ph.textContent = 'note image ' + (pageIndex + 1);
      noteFill.appendChild(ph);
    }
    right.appendChild(noteFill);
    const rightNum = document.createElement('div');
    rightNum.className = 'page-number';
    rightNum.textContent = String(pageIndex * 2 + 2);
    right.appendChild(rightNum);

    el.appendChild(left);
    el.appendChild(right);
    el.appendChild(buildThreadBinding());
    return el;
  }

  function buildThreadBinding() {
    const thread = document.createElement('div');
    thread.className = 'thread-binding';
    for (let i = 0; i < 16; i++) {
      const stitch = document.createElement('div');
      stitch.className = 'stitch';
      thread.appendChild(stitch);
    }
    return thread;
  }

  function renderCover() {
    if (content.coverImage) {
      frontCoverPlaceholder.classList.add('hidden');
      let img = frontCoverImgHolder.querySelector('img.cover-img');
      if (!img) {
        img = document.createElement('img');
        img.className = 'cover-img';
        frontCoverImgHolder.insertBefore(img, frontCoverImgHolder.firstChild);
      }
      img.src = content.coverImage;
    } else {
      frontCoverTitle.textContent = content.title || 'Happy Birthday';
    }
  }

  function renderClosing() {
    if (content.epilogueImage) {
      epiloguePlaceholder.classList.add('hidden');
      epilogueImg.classList.remove('hidden');
      epilogueImg.src = content.epilogueImage;
    } else {
      epiloguePlaceholder.classList.remove('hidden');
      epilogueImg.classList.add('hidden');
    }
  }

  function updateNav() {
    btnPrev.disabled = current === COVER;
    btnNext.disabled = current === CLOSING;
    if (current === COVER) navIndicator.textContent = 'cover';
    else if (current === CLOSING) navIndicator.textContent = 'the end';
    else navIndicator.textContent = `page ${current * 2 + 1}–${current * 2 + 2} of ${PAGE_COUNT * 2}`;
  }

  function showSpreadInstant(index) {
    spreadLayer.innerHTML = '';
    spreadLayer.appendChild(buildSpreadEl(index));
  }

  function goTo(target) {
    if (animating || target === current) return;
    if (target < COVER || target > CLOSING) return;
    animating = true;

    const direction = target > current ? 'next' : 'prev';
    btnPrev.disabled = true;
    btnNext.disabled = true;

    // Leaving the cover
    if (current === COVER && target >= 0) {
      bookEl.classList.add('opening');
      showSpreadInstant(target);
      spreadLayer.style.opacity = '0';
      requestAnimationFrame(() => {
        spreadLayer.style.transition = 'opacity 0.5s ease 0.25s';
        spreadLayer.style.opacity = '1';
      });
      setTimeout(() => {
        current = target;
        updateNav();
        animating = false;
      }, 900);
      return;
    }

    // Returning to the cover
    if (target === COVER) {
      bookEl.classList.remove('opening');
      spreadLayer.style.transition = 'opacity 0.3s ease';
      spreadLayer.style.opacity = '0';
      setTimeout(() => {
        current = COVER;
        spreadLayer.innerHTML = '';
        spreadLayer.style.opacity = '1';
        spreadLayer.style.transition = '';
        updateNav();
        animating = false;
      }, 500);
      return;
    }

    // Entering closing screen from last page
    if (target === CLOSING) {
      const outEl = spreadLayer.querySelector('.spread');
      if (outEl) outEl.classList.add('turn-out-next');
      renderClosing();
      closingScreen.classList.remove('hidden');
      closingScreen.style.opacity = '0';
      closingScreen.style.transform = 'rotateY(20deg)';
      requestAnimationFrame(() => {
        closingScreen.style.transition = 'opacity 0.45s ease, transform 0.45s cubic-bezier(.65,0,.35,1)';
        closingScreen.style.opacity = '1';
        closingScreen.style.transform = 'rotateY(0deg)';
      });
      setTimeout(() => {
        current = CLOSING;
        spreadLayer.innerHTML = '';
        updateNav();
        animating = false;
      }, 480);
      return;
    }

    // Leaving closing screen back to last page
    if (current === CLOSING) {
      closingScreen.style.transition = 'opacity 0.35s ease, transform 0.35s cubic-bezier(.65,0,.35,1)';
      closingScreen.style.opacity = '0';
      closingScreen.style.transform = 'rotateY(-20deg)';
      showSpreadInstant(target);
      const inEl = spreadLayer.querySelector('.spread');
      inEl.classList.add('turn-in-from-next', 'turn-in-instant');
      requestAnimationFrame(() => {
        inEl.classList.remove('turn-in-instant');
        requestAnimationFrame(() => inEl.classList.remove('turn-in-from-next'));
      });
      setTimeout(() => {
        closingScreen.classList.add('hidden');
        current = target;
        updateNav();
        animating = false;
      }, 420);
      return;
    }

    // Regular spread-to-spread turn
    const outEl = spreadLayer.querySelector('.spread');
    if (outEl) outEl.classList.add(direction === 'next' ? 'turn-out-next' : 'turn-out-prev');

    setTimeout(() => {
      showSpreadInstant(target);
      const inEl = spreadLayer.querySelector('.spread');
      inEl.classList.add(direction === 'next' ? 'turn-in-from-next' : 'turn-in-from-prev', 'turn-in-instant');
      requestAnimationFrame(() => {
        inEl.classList.remove('turn-in-instant');
        requestAnimationFrame(() => {
          inEl.classList.remove('turn-in-from-next', 'turn-in-from-prev');
        });
      });
      current = target;
      updateNav();
      setTimeout(() => { animating = false; }, 420);
    }, 380);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function setupEvents() {
    btnNext.addEventListener('click', next);
    btnPrev.addEventListener('click', prev);
    frontCoverImgHolder.addEventListener('click', () => { if (current === COVER) goTo(0); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });

    document.getElementById('btn-yes').addEventListener('click', () => {
      replyMessage.textContent = '';
      if (content.trueCoverImage) {
        revealImg.src = content.trueCoverImage;
        revealImg.classList.remove('hidden');
      } else {
        revealImg.classList.add('hidden');
      }
      revealMessage.textContent = content.yesMessage || '';
      revealScreen.classList.add('visible');
    });

    document.getElementById('btn-no').addEventListener('click', () => {
      replyMessage.textContent = content.noMessage || '';
    });
  }

  async function loadContent() {
    const res = await fetch('/api/content');
    content = await res.json();
  }

  async function init() {
    await loadContent();
    renderCover();
    updateNav();
    setupEvents();
  }

  init();
})();
