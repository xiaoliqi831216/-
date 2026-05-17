(function () {
  'use strict';

  const isMobile = () => window.innerWidth < 768;
  const isDesktop = () => !isMobile();

  /* ----- Smooth anchor scroll ----- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ----- Navigation fade-in ----- */
  const siteNav = document.getElementById('siteNav');
  let navVisible = false;

  function updateNav() {
    const show = window.scrollY > 100;
    if (show !== navVisible) {
      navVisible = show;
      siteNav.classList.toggle('visible', show);
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ----- Parallax (desktop only) ----- */
  const parallaxLayers = document.querySelectorAll('.parallax-layer');

  function updateParallax() {
    if (!isDesktop()) {
      parallaxLayers.forEach((el) => { el.style.transform = ''; });
      return;
    }
    const scrollY = window.scrollY;
    parallaxLayers.forEach((layer) => {
      const speed = parseFloat(layer.dataset.speed) || 1;
      const rect = layer.getBoundingClientRect();
      const offset = rect.top + scrollY;
      const y = (scrollY - offset) * (1 - speed);
      layer.style.transform = `translate3d(0, ${y}px, 0)`;
    });
  }

  window.addEventListener('scroll', updateParallax, { passive: true });
  window.addEventListener('resize', updateParallax);
  updateParallax();

  /* ----- Progressive image loading ----- */
  const progressiveImages = document.querySelectorAll('.progressive-img[data-src]');

  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const src = img.dataset.src;
        if (!src || img.dataset.loading) return;
        img.dataset.loading = 'true';

        const hi = new Image();
        hi.onload = () => {
          img.src = src;
          img.classList.add('loaded');
          requestAnimationFrame(() => {
            img.classList.add('sharp');
            img.style.filter = img.closest('.gallery-hover')
              ? 'saturate(0.9)'
              : '';
          });
        };
        hi.src = src;
        imageObserver.unobserve(img);
      });
    },
    { rootMargin: '200px 0px' }
  );

  progressiveImages.forEach((img) => imageObserver.observe(img));

  /* ----- Custom cursor (gallery) ----- */
  const cursor = document.getElementById('customCursor');
  const gallerySection = document.getElementById('gallery');
  const hoverItems = document.querySelectorAll('.gallery-hover');
  let cursorX = 0;
  let cursorY = 0;
  let cursorActive = false;

  document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    if (cursorActive) {
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
    }
  });

  function setGalleryCursor(on) {
    if (isMobile()) return;
    cursorActive = on;
    document.body.classList.toggle('gallery-cursor-active', on);
    cursor.classList.toggle('visible', on);
    if (on) {
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
    }
  }

  gallerySection.addEventListener('mouseenter', () => setGalleryCursor(true));
  gallerySection.addEventListener('mouseleave', () => {
    setGalleryCursor(false);
    hoverItems.forEach((el) => el.classList.remove('hover-active'));
  });

  hoverItems.forEach((wrap) => {
    wrap.addEventListener('mouseenter', () => wrap.classList.add('hover-active'));
    wrap.addEventListener('mouseleave', () => wrap.classList.remove('hover-active'));
  });

  /* ----- Philosophy stagger reveal ----- */
  const philosophySection = document.getElementById('philosophy');
  const philosophyLines = document.querySelectorAll('.philosophy-line:not(.gap)');
  let philosophyAnimated = false;

  const philosophyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || philosophyAnimated) return;
        const rect = entry.boundingClientRect;
        const vh = window.innerHeight;
        const centerInView =
          rect.top < vh * 0.75 && rect.bottom > vh * 0.25;
        if (!centerInView) return;

        philosophyAnimated = true;
        let delay = 0;
        philosophyLines.forEach((line) => {
          if (line.classList.contains('gap')) return;
          setTimeout(() => line.classList.add('visible'), delay);
          delay += 800;
        });
        philosophyObserver.disconnect();
      });
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] }
  );

  if (philosophySection) philosophyObserver.observe(philosophySection);

  /* ----- Horizontal notes scroll + drag inertia ----- */
  const notesTrack = document.getElementById('notesTrack');
  if (notesTrack) {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let velX = 0;
    let lastX = 0;
    let lastTime = 0;
    let momentumId = null;

    notesTrack.addEventListener('mousedown', (e) => {
      isDown = true;
      notesTrack.classList.add('dragging');
      startX = e.pageX - notesTrack.offsetLeft;
      scrollLeft = notesTrack.scrollLeft;
      lastX = e.pageX;
      lastTime = Date.now();
      velX = 0;
      if (momentumId) cancelAnimationFrame(momentumId);
    });

    notesTrack.addEventListener('mouseleave', () => {
      if (!isDown) return;
      isDown = false;
      notesTrack.classList.remove('dragging');
      applyMomentum();
    });

    notesTrack.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      notesTrack.classList.remove('dragging');
      applyMomentum();
    });

    notesTrack.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - notesTrack.offsetLeft;
      const walk = (x - startX) * 1.2;
      notesTrack.scrollLeft = scrollLeft - walk;

      const now = Date.now();
      const dt = now - lastTime;
      if (dt > 0) velX = (e.pageX - lastX) / dt;
      lastX = e.pageX;
      lastTime = now;
    });

    function applyMomentum() {
      if (Math.abs(velX) < 0.05) return;
      function step() {
        notesTrack.scrollLeft -= velX * 16;
        velX *= 0.92;
        if (Math.abs(velX) > 0.02) momentumId = requestAnimationFrame(step);
      }
      momentumId = requestAnimationFrame(step);
    }
  }

  /* ----- Note card lightbox ----- */
  const lightbox = document.getElementById('lightbox');
  const lightboxContent = document.getElementById('lightboxContent');

  document.querySelectorAll('.note-card[data-expandable]').forEach((card) => {
    card.addEventListener('click', () => {
      const clone = card.cloneNode(true);
      clone.style.transform = 'none';
      clone.style.boxShadow = 'none';
      lightboxContent.innerHTML = '';
      lightboxContent.appendChild(clone);
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
    });
  });

  lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      if (echoPanel.classList.contains('open')) closeEcho();
    }
  });

  /* ----- Atelier Echo chat ----- */
  const echoTrigger = document.getElementById('echoTrigger');
  const echoTriggerWrap = document.getElementById('echoTriggerWrap');
  const echoPanel = document.getElementById('echoPanel');
  const echoClose = document.getElementById('echoClose');
  const echoBackMobile = document.getElementById('echoBackMobile');
  const echoForm = document.getElementById('echoForm');
  const echoInput = document.getElementById('echoInput');
  const echoSend = document.getElementById('echoSend');
  const echoMessages = document.getElementById('echoMessages');

  const echoReplies = [
    '礼奇在优尚品引入了 style3D 展示，客户不用等实物样衣就能确认版型，转化率明显提升。',
    '浪登时期他主导针织九年，从毛衣、T 恤到配饰，都经历过完整的订货会周期。',
    '港派年代曾为金利来、华斯度等一线男装品牌开发季度系列，懂品牌方的选款逻辑。',
    '3D 数字化版型库 + Midjourney 出图，是他现在降低打样成本的核心工作流。',
    '制服项目他会先分析客户场景与品牌形象，再给出定制方案——从设计到拍摄一站完成。',
    '他持续跟踪国内外潮流，并曾赴日韩做一线、二线品牌的市场调研。',
  ];

  function openEcho() {
    echoTrigger.classList.add('flash');
    setTimeout(() => echoTrigger.classList.remove('flash'), 200);
    echoTriggerWrap.classList.add('hidden');
    echoPanel.classList.add('open');
    echoPanel.setAttribute('aria-hidden', 'false');
    setTimeout(() => echoInput.focus(), 500);
  }

  function closeEcho() {
    echoPanel.classList.add('closing');
    echoPanel.classList.remove('open');
    setTimeout(() => {
      echoPanel.classList.remove('closing');
      echoPanel.setAttribute('aria-hidden', 'true');
      echoTriggerWrap.classList.remove('hidden');
    }, 350);
  }

  echoTrigger.addEventListener('click', openEcho);
  echoClose.addEventListener('click', closeEcho);
  echoBackMobile.addEventListener('click', closeEcho);

  echoInput.addEventListener('input', () => {
    echoSend.disabled = !echoInput.value.trim();
  });

  echoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = echoInput.value.trim();
    if (!text) return;

    appendUserMessage(text);
    echoInput.value = '';
    echoSend.disabled = true;

    const thinking = document.createElement('div');
    thinking.className = 'msg msg-ai msg-thinking';
    thinking.textContent = '让我想想...';
    echoMessages.appendChild(thinking);
    echoMessages.scrollTop = echoMessages.scrollHeight;

    const delay = 1500 + Math.random() * 1000;
    setTimeout(() => {
      thinking.remove();
      const reply =
        echoReplies[Math.floor(Math.random() * echoReplies.length)];
      appendAiMessage(reply);
    }, delay);
  });

  function appendUserMessage(text) {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-user';
    wrap.innerHTML = `<p>${escapeHtml(text)}</p>`;
    echoMessages.appendChild(wrap);
    echoMessages.scrollTop = echoMessages.scrollHeight;
  }

  function appendAiMessage(text) {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-ai';
    wrap.innerHTML = `
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <time class="msg-time">刚刚</time>
    `;
    echoMessages.appendChild(wrap);
    echoMessages.scrollTop = echoMessages.scrollHeight;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ----- Page bottom: echo pulse + back to top ----- */
  const backToTop = document.getElementById('backToTop');
  const pageEnd = document.getElementById('pageEnd');
  let bottomInvited = false;

  function checkPageBottom() {
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40;

    backToTop.classList.toggle('visible', atBottom);

    if (atBottom && !bottomInvited && !echoPanel.classList.contains('open')) {
      bottomInvited = true;
      echoTriggerWrap.classList.add('invite-pulse');
      setTimeout(() => echoTriggerWrap.classList.remove('invite-pulse'), 1500);
    }
  }

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', checkPageBottom, { passive: true });
  checkPageBottom();

  /* ----- Section enter animations (generic fade) ----- */
  const fadeSections = document.querySelectorAll('.section-header');
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        fadeObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  fadeSections.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    fadeObserver.observe(el);
  });
})();
