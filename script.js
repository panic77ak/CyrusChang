const icons = {
wechat:'<path d="M14.5 9.5c0-4-4-6.5-7.5-5.5S1 7.5 2 11c.4 1.4 1.3 2.4 2.6 3.1L4 17l3-1.5"/><path d="M22 14c0-3-2.7-5-6-5s-6 2-6 5 2.7 5 6 5h1.5l2.5 1-.4-2.1A4.6 4.6 0 0 0 22 14Z"/><path d="M6 8h.01M10 8h.01M14 13h.01M18 13h.01"/>',
product:'<circle cx="12" cy="12" r="10"/><circle cx="9" cy="8" r="2"/><path d="M5.5 17v-2a3.5 3.5 0 0 1 7 0v2M16 7v10m0-10h2a2.5 2.5 0 0 1 0 5h-2"/>',
medium:'<circle cx="6" cy="12" r="5.5" fill="currentColor" stroke="none"/><ellipse cx="16" cy="12" rx="3" ry="5.5" fill="currentColor" stroke="none"/><ellipse cx="22" cy="12" rx="1" ry="5.5" fill="currentColor" stroke="none"/>',
gmail:'<path d="M3 20V5l9 7 9-7v15h-4V12l-5 4-5-4v8H3Z" stroke-linejoin="round"/>',
download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
game:'<rect x="3" y="6" width="18" height="13" rx="4"/><path d="M7 10v5m-2.5-2.5h5M16 11h.01M19 14h.01"/>',
layers:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
gem:'<path d="m10 2 7 3 4 10-9 7-8-5 2-10 4-5Z" fill="currentColor" stroke="none"/><path d="m10 2 2 20 5-17" stroke="white" opacity=".4"/>',
code:'<path d="m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16"/>',
pen:'<path d="m15 4 5 5M4 20l5-1L21 7l-4-4L5 15l-1 5Z"/>',
github:'<path d="M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-2.5c3-.4 6-1.5 6-6a4.7 4.7 0 0 0-1.3-3.3 4.5 4.5 0 0 0-.1-3.2S17.5 2.6 15 4a12 12 0 0 0-6 0C6.5 2.6 5.4 3 5.4 3a4.5 4.5 0 0 0-.1 3.2A4.7 4.7 0 0 0 4 9.5c0 4.5 3 5.6 6 6A3.5 3.5 0 0 0 9 18v4"/>',
chat:'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.3 0-2.5-.3-3.6-.8L3 21l1.8-5.9A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
article:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
flask:'<path d="M9 3h6m-5 0v7l-6 9a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3M7 15h10"/>',
mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/>',
file:'<path d="M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8m-8 4h6"/>'
};
document.querySelectorAll('[data-icon]').forEach(el => {
el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[el.dataset.icon] || '') + '</svg>';
});

const portraitSlot = document.querySelector('.portrait-slot');
const portrait = portraitSlot?.querySelector('.avatar');

if (portraitSlot && portrait) {
  const size = 40;
  const edge = 12;
  const gravity = 1750;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let isLoose = false;
  let isDragging = false;
  let moved = false;
  let suppressClick = false;
  let clickCount = 0;
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let rotation = 0;
  let spin = 0;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastPointerTime = 0;
  let frameId = 0;
  let lastFrame = 0;

  const floorY = () => Math.max(edge, window.innerHeight - size - edge);
  const maxX = () => Math.max(edge, window.innerWidth - size - edge);

  const applyLoosePosition = () => {
    portrait.style.setProperty('--loose-x', `${x}px`);
    portrait.style.setProperty('--loose-y', `${y}px`);
    portrait.style.setProperty('--portrait-angle', `${rotation}deg`);
  };

  const stopPhysics = () => {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrame = 0;
  };

  const isOverSlot = () => {
    const rect = portraitSlot.getBoundingClientRect();
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const magnet = 14;
    return centerX >= rect.left - magnet && centerX <= rect.right + magnet &&
      centerY >= rect.top - magnet && centerY <= rect.bottom + magnet;
  };

  const startPhysics = (initialVx = 0, initialVy = 80) => {
    stopPhysics();
    vx = initialVx;
    vy = initialVy;
    spin = Math.max(-220, Math.min(220, vx * .7));

    if (reduceMotion) {
      y = floorY();
      rotation = 0;
      applyLoosePosition();
      return;
    }

    const tick = time => {
      if (!isLoose || isDragging) return;
      if (!lastFrame) lastFrame = time;
      const dt = Math.min((time - lastFrame) / 1000, .032);
      lastFrame = time;

      vy += gravity * dt;
      x += vx * dt;
      y += vy * dt;
      rotation += spin * dt;

      if (x <= edge || x >= maxX()) {
        x = Math.max(edge, Math.min(maxX(), x));
        vx *= -.48;
        spin *= -.65;
      }

      if (y >= floorY()) {
        y = floorY();
        if (Math.abs(vy) < 70) {
          vy = 0;
          vx = 0;
          spin = 0;
          applyLoosePosition();
          frameId = 0;
          return;
        }
        vy *= -.28;
        vx *= .8;
        spin *= .72;
      }

      applyLoosePosition();
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
  };

  const undock = () => {
    const rect = portraitSlot.getBoundingClientRect();
    x = rect.left;
    y = rect.top;
    rotation = 0;
    clickCount = 0;
    isLoose = true;
    portrait.classList.remove('is-wobbling');
    portrait.classList.add('is-loose');
    portraitSlot.classList.add('is-empty');
    document.body.appendChild(portrait);
    applyLoosePosition();
    startPhysics((Math.random() - .5) * 90, 70);
  };

  const dock = () => {
    stopPhysics();
    isLoose = false;
    isDragging = false;
    clickCount = 0;
    x = 0;
    y = 0;
    rotation = 0;
    portrait.classList.remove('is-loose', 'is-dragging');
    portrait.style.removeProperty('--loose-x');
    portrait.style.removeProperty('--loose-y');
    portrait.style.setProperty('--portrait-angle', '0deg');
    portraitSlot.appendChild(portrait);
    portraitSlot.classList.remove('is-empty', 'is-ready');
  };

  portrait.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !isLoose) return;
    event.preventDefault();
    stopPhysics();
    isDragging = true;
    moved = false;
    dragOffsetX = event.clientX - x;
    dragOffsetY = event.clientY - y;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    lastPointerTime = performance.now();
    portrait.setPointerCapture(event.pointerId);
    portrait.classList.add('is-dragging');
  });

  portrait.addEventListener('pointermove', event => {
    if (!isDragging || !portrait.hasPointerCapture(event.pointerId)) return;
    const now = performance.now();
    const dt = Math.max(now - lastPointerTime, 8) / 1000;
    moved ||= Math.hypot(event.clientX - lastPointerX, event.clientY - lastPointerY) > 3;
    vx = Math.max(-900, Math.min(900, (event.clientX - lastPointerX) / dt));
    vy = Math.max(-900, Math.min(900, (event.clientY - lastPointerY) / dt));
    x = Math.max(edge, Math.min(maxX(), event.clientX - dragOffsetX));
    y = Math.max(edge, Math.min(floorY(), event.clientY - dragOffsetY));
    rotation = Math.max(-16, Math.min(16, vx * .018));
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    lastPointerTime = now;
    portraitSlot.classList.toggle('is-ready', isOverSlot());
    applyLoosePosition();
  });

  const releasePortrait = event => {
    if (!isDragging) return;
    if (portrait.hasPointerCapture(event.pointerId)) portrait.releasePointerCapture(event.pointerId);
    isDragging = false;
    suppressClick = moved;
    portrait.classList.remove('is-dragging');
    portraitSlot.classList.remove('is-ready');
    if (isOverSlot()) {
      dock();
      return;
    }
    startPhysics(vx * .28, Math.max(vy * .18, 60));
  };

  portrait.addEventListener('pointerup', releasePortrait);
  portrait.addEventListener('pointercancel', releasePortrait);
  portrait.addEventListener('click', event => {
    if (suppressClick) {
      event.preventDefault();
      suppressClick = false;
      return;
    }
    if (isLoose) return;
    clickCount += 1;
    if (clickCount >= 3) {
      undock();
      return;
    }
    portrait.classList.remove('is-wobbling');
    void portrait.offsetWidth;
    portrait.classList.add('is-wobbling');
  });
  portrait.addEventListener('animationend', () => {
    portrait.classList.remove('is-wobbling');
  });

  window.addEventListener('resize', () => {
    if (!isLoose) return;
    x = Math.max(edge, Math.min(maxX(), x));
    y = Math.min(floorY(), y);
    applyLoosePosition();
    if (!isDragging && y >= floorY() - 1) startPhysics(0, 0);
  });
}

const previews = {
  'work.html': {
    label: '最近在做什么',
    title: '经历与项目',
    body: '王者万象棋的局外系统交互，以及此前参与的游戏项目。'
  },
  'case.html?project=wanxiangqi': {
    label: '设计案例',
    title: '王者万象棋',
    body: '复杂局外系统里的规则表达、状态反馈与入口组织。'
  },
  'case.html?project=club-koala': {
    label: '设计案例',
    title: 'Club Koala',
    body: 'UX 框架、设计规范与 DIY 绘制系统的多端体验。'
  },
  'case.html?project=dragon-city-rises': {
    label: '设计案例',
    title: 'Dragon City Rises',
    body: '从立项阶段开始参与的海外 SLG 体验框架。'
  },
  'demos.html': {
    label: 'AI 工作流',
    title: '设计实践',
    body: '从前期调研和问题定位，到制作可点击原型，把 AI 放进日常设计工作。'
  },
  'writing.html': {
    label: '一些文章',
    title: '写一点',
    body: '关于体验、AI，以及人与工具如何相处的观察。'
  },
  'workflow.html': {
    label: '工作方式',
    title: 'Obsidian',
    body: '把知识、证据和设计判断整理成可以继续使用的系统。'
  },
  'products.html': {
    label: '个人产品',
    title: 'Vibe coding',
    body: 'MuroNote、万相资讯网站与个人 Design Harness。'
  },
  'moments.html': {
    label: '三十岁以后',
    title: '记下来的事',
    body: '不一定是重要节点，只是有些事情发生了，想把它们留下来。'
  }
};

const previewLinks = document.querySelectorAll('.home .pill, .home .text-link');
const supportsHoverPreview = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (previewLinks.length && supportsHoverPreview) {
  const preview = document.createElement('aside');
  preview.className = 'link-preview';
  preview.id = 'link-preview';
  preview.setAttribute('role', 'tooltip');
  preview.setAttribute('aria-hidden', 'true');
  document.body.append(preview);

  let activeLink = null;

  const positionPreview = () => {
    if (!activeLink) return;
    const linkRect = activeLink.getBoundingClientRect();
    const previewRect = preview.getBoundingClientRect();
    const edge = 12;
    let left = linkRect.left + linkRect.width / 2 - previewRect.width / 2;
    left = Math.max(edge, Math.min(left, window.innerWidth - previewRect.width - edge));
    let top = linkRect.bottom + 10;
    if (top + previewRect.height > window.innerHeight - edge) {
      top = linkRect.top - previewRect.height - 10;
    }
    preview.style.left = `${left}px`;
    preview.style.top = `${Math.max(edge, top)}px`;
  };

  const showPreview = link => {
    const data = previews[link.getAttribute('href')];
    if (!data) return;
    activeLink = link;
    preview.innerHTML = `<span>${data.label}</span><strong>${data.title}</strong><p>${data.body}</p>`;
    preview.setAttribute('aria-hidden', 'false');
    link.setAttribute('aria-describedby', preview.id);
    requestAnimationFrame(() => {
      positionPreview();
      preview.classList.add('is-visible');
    });
  };

  const hidePreview = link => {
    if (activeLink !== link) return;
    link.removeAttribute('aria-describedby');
    preview.classList.remove('is-visible');
    preview.setAttribute('aria-hidden', 'true');
    activeLink = null;
  };

  previewLinks.forEach(link => {
    if (!previews[link.getAttribute('href')]) return;
    link.addEventListener('pointerenter', () => showPreview(link));
    link.addEventListener('pointerleave', () => hidePreview(link));
    link.addEventListener('focus', () => showPreview(link));
    link.addEventListener('blur', () => hidePreview(link));
  });

  window.addEventListener('scroll', positionPreview, { passive: true });
  window.addEventListener('resize', positionPreview);
}
