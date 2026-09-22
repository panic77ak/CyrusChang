const ARTBOARD_WIDTH = 2160;
const ARTBOARD_HEIGHT = 1080;
const artboard = document.querySelector('#artboard');
const status = document.querySelector('#status');
const grid = document.querySelector('.menu-grid');
const topNav = document.querySelector('.top-nav');
const toast = document.querySelector('#toast');
const resetBtn = document.querySelector('#reset-btn');
const cancelBtn = document.querySelector('#cancel-btn');
const saveBtn = document.querySelector('#save-btn');

/* 长按（按住 0.3s）才进入可拖动态：先放大浮起，再允许拖动 */
const LONG_PRESS_MS = 300;

const state = {
  draggingId: null,
  draggingNavId: null,
  statusTimer: null,
  toastTimer: null,
  /* 长按抬起后紧跟的 click 需忽略，避免"拖完又被点击移动" */
  suppressClick: false,
  dragActive: false,
  scale: 1,
};

let suppressClickTimer;
function suppressNextClick() {
  state.suppressClick = true;
  window.clearTimeout(suppressClickTimer);
  suppressClickTimer = window.setTimeout(() => {
    state.suppressClick = false;
  }, 350);
}

function updateScale() {
  const availableWidth = Math.max(window.innerWidth - 32, 320);
  const availableHeight = Math.max(window.innerHeight - 32, 180);
  const scale = Math.min(availableWidth / ARTBOARD_WIDTH, availableHeight / ARTBOARD_HEIGHT, 1);
  state.scale = scale; /* 拖动列表时把屏幕位移换算回画板坐标 */
  artboard.style.setProperty('--artboard-scale', String(scale));
}

function announce(message) {
  window.clearTimeout(state.statusTimer);
  status.textContent = message;
  status.classList.add('is-visible');
  state.statusTimer = window.setTimeout(() => status.classList.remove('is-visible'), 1800);
}

/* 屏幕居中提示（顶栏达上限等），1.8s 后自动收起 */
function showToast() {
  window.clearTimeout(state.toastTimer);
  toast.classList.add('is-visible');
  state.toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

/* ===== 基础资源与列表数据 =====
   菜单与顶栏全部由这份列表驱动：条目 = { id, label, cardIcon, navIcon, navIconStyle }
   末尾追加一组「邮件1 … 邮件N」（沿用邮件图标，仅名称带序号）。 */
const ASSETS = 'assets/CodeBuddyAssets/86_75443';
/* 菜单 4 列；顶栏槽位（步进 207 = 按钮 117 + 间距 90），最多 5 个 */
const MENU_COLUMNS = 4;
const NAV_SLOTS = [178, 385, 592, 799, 1006];
/* 追加项数量：邮件1 … 邮件N，改这个数字即可增减 */
const FILLER_COUNT = 11;

const MENU_ITEMS = [
  { id: 'mail', label: '邮件', cardIcon: '13.svg', navIcon: '../86_75009/1.svg', navIconStyle: 'left: 1.5px; top: 4.5px' },
  { id: 'wish', label: '祈愿', cardIcon: '14.svg', navIcon: '../86_75020/1.svg', navIconStyle: 'left: 0.74px; top: 0.75px' },
  { id: 'season', label: '赛季', cardIcon: '15.svg', navIcon: '../86_74875/1.svg', navIconStyle: 'left: 0; top: 0' },
  { id: 'team', label: '战队', cardIcon: '16.svg', navIcon: '../86_74920/1.svg', navIconStyle: 'left: 1.5px; top: 3px' },
  { id: 'friends', label: '好友', cardIcon: '17.svg', navIcon: '../86_75026/1.svg', navIconStyle: 'left: 3px; top: 0' },
  { id: 'formation', label: '阵容', cardIcon: '19.svg', navIcon: '23.svg', navIconStyle: 'left: 2px; top: -0.37px' },
  { id: 'bag', label: '背包', cardIcon: '18.svg', navIcon: '36.svg', navIconStyle: 'left: 4.5px; top: 1.5px' },
  { id: 'event', label: '活动', cardIcon: '35.svg', navIcon: '24.svg', navIconStyle: 'left: 4px; top: 0' },
  { id: 'mall', label: '商城', cardIcon: '20.svg', navIcon: '37.svg', navIconStyle: 'left: -4.5px; top: 1.94px' },
];

/* 追加项：沿用「邮件」图标，名称为 邮件1、邮件2 … 邮件N */
const MAIL_ICON = '13.svg';
const MAIL_NAV_ICON = '../86_75009/1.svg';
const MAIL_NAV_STYLE = 'left: 1.5px; top: 4.5px';

for (let i = 1; i <= FILLER_COUNT; i += 1) {
  MENU_ITEMS.push({
    id: `mail${i}`,
    label: `邮件${i}`,
    filler: true, /* 走 .is-filler 排版：名称整卡居中 */
    cardIcon: MAIL_ICON,
    navIcon: MAIL_NAV_ICON,
    navIconStyle: MAIL_NAV_STYLE,
  });
}

/* id → 条目 的查表 */
const SHORTCUTS = {};
MENU_ITEMS.forEach((item) => {
  SHORTCUTS[item.id] = item;
});

/* 初始排布：前 4 个快捷入口在顶栏，其余（含全部邮件N）在菜单 */
const NAV_START = ['formation', 'bag', 'event', 'mall'];
const navOrder = [...NAV_START];
let menuOrder = MENU_ITEMS.map((item) => item.id).filter((id) => !NAV_START.includes(id));

/* ===== 渲染 ===== */
function createCard(id) {
  const item = SHORTCUTS[id];
  const card = document.createElement('li');
  card.className = item.filler ? 'menu-item is-filler' : 'menu-item';
  card.draggable = false; /* 始终禁用原生拖拽 */
  card.dataset.id = id;
  card.dataset.label = item.label;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', item.label);
  card.innerHTML = `
    <span class="card-inner" aria-hidden="true">
      <span class="card-bg"></span>
      <span class="card-icon">${
        item.cardIcon
          ? `<img class="ic-${id}" src="${ASSETS}/${item.cardIcon}" alt="" />`
          : `<span class="filler-num">${item.filler}</span>`
      }</span>
      <span class="card-text">${item.label}</span>
    </span>`;
  return card;
}

/* 菜单空位：4 列网格末尾补出空格，拖动时显示白框，落到空位即排到菜单末位；
   末尾正好整行时再补一整行（平时透明不可见），保证拖动时总有空位可放 */
function renderMenuSlots() {
  grid.querySelectorAll('.menu-slot').forEach((slot) => slot.remove());
  let empty = (MENU_COLUMNS - (menuOrder.length % MENU_COLUMNS)) % MENU_COLUMNS;
  if (empty === 0) empty = MENU_COLUMNS;
  for (let i = 0; i < empty; i += 1) {
    const slot = document.createElement('li');
    slot.className = 'menu-slot';
    grid.append(slot);
  }
}

const DIVIDER_ASSETS = ['9.svg', '10.svg', '11.svg', '12.svg'];
const ROW_HEIGHT = 240 + 24;
const DIVIDER_TOP_OFFSET = 18;

/* 每行上方一条，末行下方再加一条 → rows + 1 条 */
function renderMenuDividers() {
  grid.querySelectorAll('.menu-divider').forEach((node) => node.remove());
  const rows = Math.max(1, Math.ceil(menuOrder.length / MENU_COLUMNS));
  for (let i = 0; i <= rows; i += 1) {
    const line = document.createElement('li');
    line.className = 'menu-divider';
    line.setAttribute('aria-hidden', 'true');
    line.style.top = `${DIVIDER_TOP_OFFSET + i * ROW_HEIGHT}px`;
    const src = `${ASSETS}/${DIVIDER_ASSETS[i % DIVIDER_ASSETS.length]}`;
    line.innerHTML = `<img src="${src}" alt="" />`;
    grid.append(line);
  }
}

/* 菜单 = 列表渲染：DOM 顺序即菜单顺序 */
function renderMenu() {
  if (landing || gesture.state !== 'idle') finishDrag();
  grid.querySelectorAll('.menu-item, .menu-slot').forEach((node) => node.remove());
  menuOrder.forEach((id) => grid.append(createCard(id)));
  renderMenuSlots();
  renderMenuDividers();
}

function renderNav() {
  if (landing || gesture.state !== 'idle') finishDrag();
  topNav.querySelectorAll('.nav-btn, .nav-slot').forEach((node) => node.remove());
  navOrder.forEach((id, index) => {
    const item = SHORTCUTS[id];
    const btn = document.createElement('button');
    btn.className = item.filler ? 'nav-btn is-filler' : 'nav-btn';
    btn.type = 'button';
    btn.draggable = false; /* 始终禁用原生拖拽 */
    btn.dataset.id = id;
    btn.dataset.label = item.label;
    btn.setAttribute('aria-label', item.label);
    btn.style.left = `${NAV_SLOTS[index]}px`;
    btn.innerHTML = `
      <span class="nav-btn-bg" aria-hidden="true"></span>
      <span class="nav-btn-icon" aria-hidden="true">${
        item.navIcon
          ? `<img src="${ASSETS}/${item.navIcon}" alt="" style="${item.navIconStyle}" />`
          : `<span class="nav-num">${item.filler}</span>`
      }</span>
      <span class="nav-btn-text">${item.label}</span>`;

    topNav.append(btn);
  });

  /* 剩余槽位渲染为可放置的空位：与选中底板同尺寸，左边界 = 槽位 - 41 */
  for (let i = navOrder.length; i < NAV_SLOTS.length; i += 1) {
    const slot = document.createElement('div');
    slot.className = 'nav-slot';
    slot.dataset.slot = String(i);
    slot.style.left = `${NAV_SLOTS[i] - 41}px`;
    topNav.append(slot);
  }
}

/* ===== 列表数据操作（只改数组，渲染统一交给 renderMenu/renderNav） ===== */
function menuAdd(id) {
  if (!menuOrder.includes(id)) menuOrder.push(id);
}

function menuRemove(id) {
  const index = menuOrder.indexOf(id);
  if (index >= 0) menuOrder.splice(index, 1);
}

function menuMoveToEnd(id) {
  const index = menuOrder.indexOf(id);
  if (index < 0 || index === menuOrder.length - 1) return;
  menuOrder.splice(index, 1);
  menuOrder.push(id);
}

function menuSwap(a, b) {
  const ia = menuOrder.indexOf(a);
  const ib = menuOrder.indexOf(b);
  if (ia < 0 || ib < 0) return;
  menuOrder[ia] = b;
  menuOrder[ib] = a;
}

/* 原位替换：用于顶栏项与菜单卡片互换 */
function menuReplace(id, newId) {
  const index = menuOrder.indexOf(id);
  if (index < 0) return;
  menuOrder[index] = newId;
}

/* ===== 单一指针手势：按压、长按准备、拖拽或菜单平移 ===== */
const gesture = {
  state: 'idle',
  pointerId: null,
  source: null,
  zone: null,
  timer: 0,
  raf: 0,
  ghost: null,
  origin: null,
  placeholder: null,
  center: null,
  previewStyles: new Map(),
  previewAnimations: new Map(),
  previewSlots: [],
};
state.dropPlan = null;

function draggingId() {
  return state.draggingNavId || state.draggingId;
}

function boardMetrics() {
  const rect = artboard.getBoundingClientRect();
  return { rect, scale: rect.width / ARTBOARD_WIDTH };
}

function boardPoint(point, metrics = boardMetrics()) {
  return {
    x: (point.clientX - metrics.rect.left) / metrics.scale,
    y: (point.clientY - metrics.rect.top) / metrics.scale,
  };
}

function rectAt(left, top, width, height) {
  return { left, top, right: left + width, bottom: top + height, width, height };
}

/* 只读布局 offset 链；不把按压/替换高亮的 transform 当成落点几何。 */
function layoutRect(element) {
  let left = 0;
  let top = 0;
  for (let node = element; node && node !== artboard; node = node.offsetParent) {
    const style = getComputedStyle(node);
    const x = style.position === 'absolute' ? parseFloat(style.left) : NaN;
    const y = style.position === 'absolute' ? parseFloat(style.top) : NaN;
    left += Number.isFinite(x) ? x : node.offsetLeft;
    top += Number.isFinite(y) ? y : node.offsetTop;
    const parent = node.offsetParent;
    if (parent && parent !== artboard) {
      left += parent.clientLeft;
      top += parent.clientTop;
    }
  }
  for (let parent = element.parentElement; parent && parent !== artboard; parent = parent.parentElement) {
    left -= parent.scrollLeft;
    top -= parent.scrollTop;
  }
  return rectAt(left, top, element.offsetWidth, element.offsetHeight);
}

function bodyRect(element) {
  return layoutRect(element.querySelector('.card-bg, .nav-btn-bg') || element);
}

function intersectRect(a, b) {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  return rectAt(left, top, Math.max(0, Math.min(a.right, b.right) - left), Math.max(0, Math.min(a.bottom, b.bottom) - top));
}

function containsPoint(rect, point) {
  return rect.width > 0 && rect.height > 0 && point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function zoneViewport(zone, metrics = boardMetrics()) {
  const element = zone === 'menu' ? grid : topNav;
  const rect = layoutRect(element);
  const viewport = rectAt(rect.left + element.clientLeft, rect.top + element.clientTop, element.clientWidth, element.clientHeight);
  const windowRect = rectAt(-metrics.rect.left / metrics.scale, -metrics.rect.top / metrics.scale, window.innerWidth / metrics.scale, window.innerHeight / metrics.scale);
  return intersectRect(intersectRect(viewport, rectAt(0, 0, ARTBOARD_WIDTH, ARTBOARD_HEIGHT)), windowRect);
}

function localRect(rect, zone) {
  const parent = zone === 'menu' ? grid : topNav;
  const origin = layoutRect(parent);
  return rectAt(rect.left - origin.left - parent.clientLeft + parent.scrollLeft, rect.top - origin.top - parent.clientTop + parent.scrollTop, rect.width, rect.height);
}

function contentRect(rect, zone) {
  const parent = zone === 'menu' ? grid : topNav;
  const origin = layoutRect(parent);
  return rectAt(rect.left + origin.left + parent.clientLeft - parent.scrollLeft, rect.top + origin.top + parent.clientTop - parent.scrollTop, rect.width, rect.height);
}

function pointOnScreen(point) {
  return Number.isFinite(point.clientX) && Number.isFinite(point.clientY) && point.clientX >= 0 && point.clientY >= 0 && point.clientX < window.innerWidth && point.clientY < window.innerHeight;
}

/* 拖影位置和落点中心同源，包括真实底板相对 cell 的偏移。 */
function ghostCenter(point = gesture.point) {
  const pointer = boardPoint(point);
  const left = pointer.x - gesture.grab.x;
  const top = pointer.y - gesture.grab.y;
  return {
    left,
    top,
    x: left + gesture.bodyOffset.left + gesture.bodyOffset.width / 2,
    y: top + gesture.bodyOffset.top + gesture.bodyOffset.height / 2,
  };
}

function moveGhost(point = gesture.point) {
  const center = ghostCenter(point);
  gesture.center = center;
  gesture.ghost.style.transform = `translate3d(${center.left}px, ${center.top}px, 0)`;
  return center;
}

function sortingOrder(zone) {
  return (zone === 'menu' ? menuOrder : navOrder).filter((id) => id !== draggingId());
}

function menuSortingGeometry() {
  const rect = layoutRect(grid);
  const style = getComputedStyle(grid);
  const width = parseFloat(style.gridTemplateColumns);
  const height = parseFloat(style.gridAutoRows);
  const gapX = parseFloat(style.columnGap) || 0;
  const gapY = parseFloat(style.rowGap) || 0;
  return {
    left: rect.left + grid.clientLeft + parseFloat(style.paddingLeft),
    top: rect.top + grid.clientTop + parseFloat(style.paddingTop) - grid.scrollTop,
    width, height, gapX, gapY,
    stepX: width + gapX,
    stepY: height + gapY,
  };
}

function sortingCell(zone, index) {
  if (zone === 'nav') return contentRect(gesture.navFrames[index], 'nav');
  const geometry = menuSortingGeometry();
  return rectAt(geometry.left + index % MENU_COLUMNS * geometry.stepX, geometry.top + Math.floor(index / MENU_COLUMNS) * geometry.stepY, geometry.width, geometry.height);
}

function fullNavReplacement(zone) {
  return zone === 'nav' && gesture.zone === 'menu' && navOrder.length >= NAV_SLOTS.length;
}

function computePlan(point = gesture.point, center = ghostCenter(point)) {
  if (!draggingId() || !gesture.ghost || !pointOnScreen(point)) return null;
  const first = contentRect(gesture.navFrames[0], 'nav');
  const last = contentRect(gesture.navFrames[NAV_SLOTS.length - 1], 'nav');
  const navArea = intersectRect(rectAt(first.left, first.top - 12, last.right - first.left, first.height + 24), zoneViewport('nav'));
  let zone;
  let index;
  if (containsPoint(navArea, center)) {
    zone = 'nav';
    const step = gesture.navFrames[1].left - gesture.navFrames[0].left;
    index = Math.max(0, Math.min(NAV_SLOTS.length - 1, Math.round((center.x - first.left - first.width / 2) / step)));
    if (fullNavReplacement(zone)) return { kind: 'swap', zone, targetId: navOrder[index] };
  } else if (containsPoint(zoneViewport('menu'), center)) {
    zone = 'menu';
    const geometry = menuSortingGeometry();
    const column = Math.max(0, Math.min(MENU_COLUMNS - 1, Math.floor((center.x - geometry.left + geometry.gapX / 2) / geometry.stepX)));
    const row = Math.max(0, Math.floor((center.y - geometry.top + geometry.gapY / 2) / geometry.stepY));
    index = row * MENU_COLUMNS + column;
  } else {
    return null;
  }
  const order = sortingOrder(zone);
  index = Math.min(index, order.length);
  // 槽位与显示动画分离：让位不能反过来改变鼠标下的索引。
  const previous = state.dropPlan;
  if (previous?.kind === 'insert' && previous.zone === zone && previous.index !== index && previous.index <= order.length) {
    const cell = sortingCell(zone, previous.index);
    if (containsPoint(rectAt(cell.left - 4, cell.top - 4, cell.width + 8, cell.height + 8), center)) index = previous.index;
  }
  return { kind: 'insert', zone, index, beforeId: order[index] || null };
}

function rememberPreviewStyle(element) {
  if (element && !gesture.previewStyles.has(element)) gesture.previewStyles.set(element, element.getAttribute('style'));
  return element;
}

function removeFeedback() {
  gesture.previewAnimations.forEach((animation) => animation.cancel());
  gesture.previewAnimations.clear();
  gesture.placeholder?.remove();
  gesture.placeholder = null;
  gesture.previewSlots.forEach((slot) => slot.remove());
  gesture.previewSlots = [];
  gesture.previewStyles.forEach((style, element) => {
    if (style === null) element.removeAttribute('style');
    else element.setAttribute('style', style);
  });
  gesture.previewStyles.clear();
  artboard.querySelectorAll('.is-swap-target').forEach((element) => element.classList.remove('is-swap-target'));
}

function setGridCell(element, index) {
  rememberPreviewStyle(element);
  element.style.gridRow = String(Math.floor(index / MENU_COLUMNS) + 1);
  element.style.gridColumn = String(index % MENU_COLUMNS + 1);
}

function previewElements() {
  return [...grid.querySelectorAll('.menu-item'), ...topNav.querySelectorAll('.nav-btn')].filter((element) => element !== gesture.source);
}

function animatePreview(previous) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const [element, rect] of previous) {
    if (!element.isConnected || getComputedStyle(element).display === 'none') continue;
    const next = visualRect(element);
    const dx = rect.left - next.left;
    const dy = rect.top - next.top;
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) continue;
    const animation = element.animate([
      { transform: `translate(${dx}px, ${dy}px)` },
      { transform: 'translate(0px, 0px)' },
    ], { duration: 150, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'both' });
    gesture.previewAnimations.set(element, animation);
    animation.finished.then(() => {
      if (gesture.previewAnimations.get(element) === animation) {
        gesture.previewAnimations.delete(element);
        animation.cancel();
      }
    }, () => {});
  }
}

function applyFeedback(plan) {
  rememberPreviewStyle(gesture.source).style.display = 'none';
  if (plan?.kind === 'insert') {
    const placeholder = document.createElement(plan.zone === 'menu' ? 'li' : 'div');
    placeholder.className = `${plan.zone}-insert-slot`;
    placeholder.setAttribute('aria-hidden', 'true');
    (plan.zone === 'menu' ? grid : topNav).append(placeholder);
    gesture.placeholder = placeholder;
  }
  for (const zone of ['menu', 'nav']) {
    const order = sortingOrder(zone);
    const inserting = plan?.kind === 'insert' && plan.zone === zone;
    const position = inserting ? plan.index : -1;
    const slotFor = (index) => index + (inserting && index >= position ? 1 : 0);
    const count = order.length + (inserting ? 1 : 0);
    if (zone === 'menu') {
      order.forEach((id, index) => setGridCell(grid.querySelector(`.menu-item[data-id="${id}"]`), slotFor(index)));
      if (inserting) setGridCell(gesture.placeholder, position);
      grid.querySelectorAll('.menu-slot').forEach((slot, index) => setGridCell(slot, count + index));
      continue;
    }
    order.forEach((id, index) => {
      const slot = slotFor(index);
      rememberPreviewStyle(topNav.querySelector(`.nav-btn[data-id="${id}"]`)).style.left = `${NAV_SLOTS[slot]}px`;
    });
    for (let index = 0; index < NAV_SLOTS.length; index += 1) {
      let slot = topNav.querySelector(`.nav-slot[data-slot="${index}"]`);
      if (!slot && index >= count) {
        slot = document.createElement('div');
        slot.className = 'nav-slot';
        slot.dataset.slot = String(index);
        slot.style.left = `${gesture.navFrames[index].left}px`;
        topNav.append(slot);
        gesture.previewSlots.push(slot);
      }
      if (slot) rememberPreviewStyle(slot).style.display = index < count ? 'none' : '';
    }
    if (inserting) {
      const frame = gesture.navFrames[position];
      Object.assign(gesture.placeholder.style, { left: `${frame.left}px`, top: `${frame.top}px`, width: `${frame.width}px`, height: `${frame.height}px` });
    }
  }
  if (plan?.kind === 'swap' && fullNavReplacement(plan.zone)) {
    topNav.querySelector(`.nav-btn[data-id="${plan.targetId}"]`)?.classList.add('is-swap-target');
  }
}

function planKey(plan) {
  return plan ? `${plan.kind}:${plan.zone}:${plan.kind === 'swap' ? plan.targetId : plan.index}` : 'none';
}

function updateDropPlan(point = gesture.point, center = ghostCenter(point)) {
  const plan = computePlan(point, center);
  if (!gesture.previewStyles.size || planKey(plan) !== planKey(state.dropPlan)) {
    const previous = new Map(previewElements().map((element) => [element, visualRect(element)]));
    removeFeedback();
    state.dropPlan = plan;
    applyFeedback(plan);
    animatePreview(previous);
  }
  return state.dropPlan;
}

function performDrop() {
  const id = draggingId();
  const plan = state.dropPlan;
  if (!id || !SHORTCUTS[id] || !plan) return false;
  const source = gesture.zone === 'menu' ? menuOrder : navOrder;
  const target = plan.zone === 'menu' ? menuOrder : navOrder;
  const sourceIndex = source.indexOf(id);
  if (sourceIndex < 0) return false;
  if (plan.kind === 'swap') {
    if (!fullNavReplacement(plan.zone)) return false;
    const targetIndex = target.indexOf(plan.targetId);
    if (targetIndex < 0 || plan.targetId === id) return false;
    source[sourceIndex] = plan.targetId;
    target[targetIndex] = id;
    announce(`已交换「${SHORTCUTS[id].label}」与「${SHORTCUTS[plan.targetId].label}」的位置`);
    return true;
  }
  if (plan.zone === 'nav' && source !== target && target.length >= NAV_SLOTS.length) {
    showToast();
    return false;
  }
  if (plan.beforeId !== null && (plan.beforeId === id || !target.includes(plan.beforeId))) return false;
  source.splice(sourceIndex, 1);
  const position = plan.beforeId === null ? target.length : target.indexOf(plan.beforeId);
  target.splice(position, 0, id);
  announce(`「${SHORTCUTS[id].label}」已插入${plan.zone === 'menu' ? '菜单' : '顶栏'}第 ${position + 1} 位`);
  return true;
}

function captureGesture() {
  try {
    artboard.setPointerCapture(gesture.pointerId);
    return true;
  } catch {
    finishDrag();
    return false;
  }
}

function createGhost() {
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.inert = true;
  ghost.style.width = `${gesture.source.offsetWidth}px`;
  ghost.style.height = `${gesture.source.offsetHeight}px`;
  const clone = gesture.source.cloneNode(true);
  clone.classList.remove('is-pressed', 'is-lifted', 'is-drag-source', 'is-swap-target');
  clone.removeAttribute('style');
  clone.style.left = '0px';
  clone.style.top = '0px';
  clone.style.pointerEvents = 'none';
  for (const element of [clone, ...clone.querySelectorAll('*')]) {
    for (const name of ['id', 'data-id', 'draggable', 'tabindex']) element.removeAttribute(name);
  }
  ghost.append(clone);
  artboard.append(ghost);
  gesture.ghost = ghost;
  gesture.origin = null;
}

function startPointerDrag() {
  if (gesture.state !== 'lifted' || !gesture.source?.isConnected) return;
  if (!captureGesture()) return;
  gesture.state = 'drag';
  state.dragActive = true;
  state.draggingId = gesture.zone === 'menu' ? gesture.source.dataset.id : null;
  state.draggingNavId = gesture.zone === 'nav' ? gesture.source.dataset.id : null;
  gesture.source.classList.remove('is-pressed', 'is-lifted');
  gesture.source.classList.add('is-drag-source');
  artboard.classList.add('is-pointer-dragging');
  grid.classList.add('is-receiving');
  topNav.classList.add('is-receiving');
  createGhost();
  updateDropPlan(gesture.point, moveGhost());
  gesture.frameTime = performance.now();
  gesture.raf = requestAnimationFrame(autoScrollWhileDragging);
}

function autoScrollWhileDragging(time) {
  gesture.raf = 0;
  if (gesture.state !== 'drag') return;
  if (!gesture.source?.isConnected || !artboard.isConnected) {
    finishDrag();
    return;
  }
  const elapsed = Math.min(0.05, Math.max(0, (time - gesture.frameTime) / 1000));
  gesture.frameTime = time;
  const center = ghostCenter();
  const viewport = zoneViewport('menu');
  if (pointOnScreen(gesture.point) && containsPoint(viewport, center)) {
    const edge = Math.min(70, viewport.height / 4);
    const upper = Math.max(0, 1 - (center.y - viewport.top) / edge);
    const lower = Math.max(0, 1 - (viewport.bottom - center.y) / edge);
    const previous = grid.scrollTop;
    grid.scrollTop += (lower - upper) * 650 * elapsed;
    if (grid.scrollTop !== previous) updateDropPlan(gesture.point, center);
  }
  gesture.raf = requestAnimationFrame(autoScrollWhileDragging);
}

function finishDrag(suppress = true) {
  finishLanding();
  const pointerId = gesture.pointerId;
  const active = gesture.state !== 'idle';
  gesture.state = 'idle';
  gesture.pointerId = null;
  window.clearTimeout(gesture.timer);
  cancelAnimationFrame(gesture.raf);
  gesture.timer = gesture.raf = 0;
  removeFeedback();
  gesture.ghost?.remove();
  gesture.origin?.remove();
  gesture.source?.classList.remove('is-pressed', 'is-lifted', 'is-drag-source');
  gesture.ghost = gesture.origin = gesture.source = gesture.center = null;
  gesture.zone = null;
  state.dragActive = false;
  state.draggingId = state.draggingNavId = state.dropPlan = null;
  grid.classList.remove('is-panning', 'is-receiving');
  topNav.classList.remove('is-receiving');
  artboard.classList.remove('is-pointer-gesture', 'is-pointer-dragging');
  if (active && suppress) {
    gesture.cancelledPointerId = pointerId;
    suppressNextClick();
  }
  if (pointerId !== null && artboard.hasPointerCapture(pointerId)) artboard.releasePointerCapture(pointerId);
}

function beginPointerGesture(event) {
  if (landing || gesture.state !== 'idle' || event.button !== 0 || event.isPrimary === false || !(event.target instanceof Element)) return;
  const source = event.target.closest('.menu-item, .nav-btn');
  const inMenu = grid.contains(event.target);
  if (!inMenu && (!source || !topNav.contains(source))) return;
  if (source && !SHORTCUTS[source.dataset.id]) return;
  const metrics = boardMetrics();
  if (!(metrics.scale > 0)) return;
  artboard.classList.add('is-pointer-gesture');
  gesture.state = 'press';
  gesture.pointerId = event.pointerId;
  gesture.source = source;
  gesture.zone = inMenu ? 'menu' : 'nav';
  gesture.point = { clientX: event.clientX, clientY: event.clientY };
  gesture.start = { ...gesture.point };
  gesture.startScroll = grid.scrollTop;
  if (!source) return;
  const cell = layoutRect(source);
  const body = bodyRect(source);
  const point = boardPoint(event, metrics);
  gesture.grab = { x: point.x - cell.left, y: point.y - cell.top };
  gesture.bodyOffset = rectAt(body.left - cell.left, body.top - cell.top, body.width, body.height);
  gesture.sourceCell = localRect(cell, gesture.zone);
  gesture.sourceBody = localRect(body, gesture.zone);
  gesture.navFrames = NAV_SLOTS.map((_, index) => {
    const element = index < navOrder.length ? topNav.querySelector(`.nav-btn[data-id="${navOrder[index]}"]`) : topNav.querySelector(`.nav-slot[data-slot="${index}"]`);
    return localRect(bodyRect(element), 'nav');
  });
  source.classList.add('is-pressed');
  gesture.timer = window.setTimeout(() => {
    gesture.timer = 0;
    if (gesture.state !== 'press' || !source.isConnected) return;
    gesture.state = 'lifted';
    source.classList.remove('is-pressed');
    source.classList.add('is-lifted');
    if (Math.hypot(gesture.point.clientX - gesture.start.clientX, gesture.point.clientY - gesture.start.clientY) > 3) startPointerDrag();
  }, LONG_PRESS_MS);
}

function movePointerGesture(event) {
  if (event.pointerId !== gesture.pointerId || gesture.state === 'idle') return;
  if (event.buttons === 0 || (gesture.source && !gesture.source.isConnected)) {
    finishDrag();
    return;
  }
  gesture.point = { clientX: event.clientX, clientY: event.clientY };
  const distance = Math.hypot(event.clientX - gesture.start.clientX, event.clientY - gesture.start.clientY);
  if (gesture.state === 'press' && distance > 6) {
    window.clearTimeout(gesture.timer);
    gesture.timer = 0;
    gesture.source?.classList.remove('is-pressed');
    if (gesture.zone !== 'menu') {
      gesture.state = 'cancelled';
      return;
    }
    gesture.state = 'pan';
    grid.classList.add('is-panning');
    if (!captureGesture()) return;
  }
  if (gesture.state === 'pan') {
    event.preventDefault();
    const scale = boardMetrics().scale;
    grid.scrollTop = gesture.startScroll - (event.clientY - gesture.start.clientY) / scale;
    return;
  }
  if (gesture.state === 'lifted' && distance > 3) startPointerDrag();
  if (gesture.state === 'drag') {
    event.preventDefault();
    updateDropPlan(gesture.point, moveGhost());
  }
}

const LANDING_DURATION = 210;
const LANDING_FADE = 100;
let landing = null;
const landingImages = new Map();
for (const item of MENU_ITEMS) {
  for (const file of [item.cardIcon, item.navIcon]) {
    if (!file) continue;
    const url = new URL(`${ASSETS}/${file}`, document.baseURI).href;
    if (landingImages.has(url)) continue;
    const image = new Image();
    image.src = url;
    landingImages.set(url, image);
  }
}

function visualRect(element) {
  const { rect, scale } = boardMetrics();
  const box = element.getBoundingClientRect();
  return rectAt((box.left - rect.left) / scale, (box.top - rect.top) / scale, box.width / scale, box.height / scale);
}

function landingItem(zone, id) {
  const parent = zone === 'menu' ? grid : topNav;
  return parent.querySelector(`[data-id="${id}"]`);
}

function landingIcon(element, id, zone) {
  const image = element?.querySelector('.card-icon img, .nav-btn-icon img');
  if (!image) return null;
  if (!image.naturalWidth) {
    const cached = landingImages.get(image.src);
    if (!cached?.naturalWidth) return null;
    image.width = cached.naturalWidth;
    image.height = cached.naturalHeight;
  }
  const box = visualRect(image);
  // 菜单资源带阴影留白；阵容顶栏资源另有 23px 底部透明留白。
  const padded = zone === 'menu' && SHORTCUTS[id].cardIcon !== '35.svg';
  const sx = box.width / (image.naturalWidth || image.width);
  const sy = box.height / (image.naturalHeight || image.height);
  const insetX = padded ? 26 * sx : 0;
  const insetY = padded ? 26 * sy : 0;
  const bottom = padded ? 65 : zone === 'nav' && SHORTCUTS[id].navIcon === '23.svg' ? 23 : 0;
  const width = box.width - insetX * 2;
  const height = box.height - bottom * sy;
  if (width <= 0 || height <= 0) return null;
  const clone = image.cloneNode();
  clone.removeAttribute('class');
  clone.removeAttribute('style');
  clone.alt = '';
  Object.assign(clone.style, { left: `${-insetX}px`, top: `${-insetY}px`, width: `${box.width}px`, height: `${box.height}px` });
  return { image: clone, rect: rectAt(box.left + insetX, box.top + insetY, width, height) };
}

function captureLanding() {
  const plan = state.dropPlan;
  if (!plan || plan.full || plan.zone === gesture.zone || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const id = draggingId();
  const icon = landingIcon(gesture.ghost, id, gesture.zone);
  if (!icon) return null;
  const moves = [{ id, zone: plan.zone, icon }];
  if (plan.kind === 'swap') {
    const target = landingIcon(landingItem(plan.zone, plan.targetId), plan.targetId, plan.zone);
    if (!target) return null;
    moves.push({ id: plan.targetId, zone: gesture.zone, icon: target });
  }
  const frames = new Map();
  for (const zone of ['menu', 'nav']) {
    const order = zone === 'menu' ? menuOrder : navOrder;
    order.forEach((itemId) => frames.set(`${zone}:${itemId}`, visualRect(landingItem(zone, itemId))));
  }
  const feedback = gesture.placeholder || landingItem(plan.zone, plan.targetId)?.querySelector('.card-bg, .nav-btn-bg');
  return { moves, frames, ghost: gesture.ghost, origin: gesture.origin, feedback: feedback ? visualRect(feedback) : null };
}

function finishLanding(session = landing) {
  if (!session || landing !== session) return;
  landing = null;
  window.clearTimeout(session.timer);
  session.animations.forEach((animation) => animation.cancel());
  session.nodes.forEach((node) => node.remove());
  artboard.classList.remove('is-settling');
}

function playLanding(snapshot) {
  const session = { animations: [], nodes: [snapshot.ghost, snapshot.origin].filter(Boolean), timer: 0, scrollTop: grid.scrollTop };
  landing = session;
  artboard.classList.add('is-settling');
  const animate = (element, frames, options) => {
    const animation = element.animate(frames, { fill: 'both', ...options });
    session.animations.push(animation);
    animation.finished.catch(() => {});
    return animation;
  };
  try {
    const menuMove = snapshot.moves.find((move) => move.zone === 'menu');
    if (menuMove) {
      const body = bodyRect(landingItem('menu', menuMove.id));
      const viewport = zoneViewport('menu');
      if (body.bottom > viewport.bottom) grid.scrollTop += body.bottom - viewport.bottom;
      else if (body.top < viewport.top) grid.scrollTop -= viewport.top - body.top;
    }
    session.scrollTop = grid.scrollTop;
    if (snapshot.feedback) {
      const outline = document.createElement('div');
      outline.className = 'landing-outline';
      outline.setAttribute('aria-hidden', 'true');
      const rect = snapshot.feedback;
      Object.assign(outline.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
      artboard.append(outline);
      session.nodes.push(outline);
      animate(outline, [{ opacity: 1 }, { opacity: 0 }], { duration: LANDING_FADE });
    }
    const activeIds = new Set(snapshot.moves.map((move) => move.id));
    for (const zone of ['menu', 'nav']) {
      const order = zone === 'menu' ? menuOrder : navOrder;
      for (const id of order) {
        const item = landingItem(zone, id);
        const previous = snapshot.frames.get(`${zone}:${id}`);
        if (!previous || activeIds.has(id)) continue;
        const next = visualRect(item);
        const transform = `translate(${previous.left - next.left}px, ${previous.top - next.top}px)`;
        const frames = [{ transform }, { transform: 'translate(0px, 0px)' }];
        animate(item, frames, { delay: LANDING_DURATION, duration: LANDING_FADE, easing: 'ease-out' });
      }
    }
    snapshot.ghost.querySelector('.card-icon, .nav-btn-icon').style.visibility = 'hidden';
    animate(snapshot.ghost, [{ opacity: 0.92 }, { opacity: 0 }], { duration: LANDING_FADE });
    if (snapshot.origin) animate(snapshot.origin, [{ opacity: 0.35 }, { opacity: 0 }], { delay: LANDING_DURATION, duration: LANDING_FADE });
    for (const move of snapshot.moves) {
      const target = landingItem(move.zone, move.id);
      const targetIcon = landingIcon(target, move.id, move.zone);
      if (!targetIcon) { finishLanding(session); return; }
      const from = move.icon.rect;
      const to = targetIcon.rect;
      const scale = Math.min(to.width / from.width, to.height / from.height);
      const x = to.left + (to.width - from.width * scale) / 2;
      const y = to.top + (to.height - from.height * scale) / 2;
      const flight = document.createElement('div');
      flight.className = 'landing-flight';
      flight.setAttribute('aria-hidden', 'true');
      flight.inert = true;
      flight.style.width = `${from.width}px`;
      flight.style.height = `${from.height}px`;
      flight.append(move.icon.image);
      artboard.append(flight);
      session.nodes.push(flight);
      animate(flight, [
        { transform: `translate(${from.left}px, ${from.top}px) scale(1)` },
        { transform: `translate(${x}px, ${y}px) scale(${scale})` },
      ], { duration: LANDING_DURATION, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
      animate(flight, [{ opacity: 1 }, { opacity: 0 }], { delay: LANDING_DURATION, duration: LANDING_FADE });
      animate(target, [{ opacity: 0 }, { opacity: 1 }], { delay: LANDING_DURATION, duration: LANDING_FADE });
    }
    Promise.all(session.animations.map((animation) => animation.finished.catch(() => {}))).then(() => finishLanding(session));
    session.timer = window.setTimeout(() => finishLanding(session), LANDING_DURATION + LANDING_FADE + 150);
  } catch {
    finishLanding(session);
  }
}

function endPointerGesture(event) {
  if (event.pointerId !== gesture.pointerId || gesture.state === 'idle') return;
  gesture.point = { clientX: event.clientX, clientY: event.clientY };
  if (gesture.state !== 'drag') {
    finishDrag(gesture.state !== 'press');
    return;
  }
  event.preventDefault();
  let changed = false;
  let snapshot = null;
  if (gesture.source?.isConnected && pointOnScreen(gesture.point)) {
    updateDropPlan(gesture.point, moveGhost());
    snapshot = captureLanding();
    changed = performDrop();
  }
  if (changed && snapshot) {
    gesture.ghost = null;
    gesture.origin = null;
  }
  finishDrag();
  if (changed) {
    if (snapshot) artboard.classList.add('is-settling');
    renderNav();
    renderMenu();
    if (snapshot) playLanding(snapshot);
  }
}

window.addEventListener('pointerdown', (event) => {
  if (event.pointerId === gesture.cancelledPointerId) gesture.cancelledPointerId = null;
}, true);
artboard.addEventListener('pointerdown', beginPointerGesture);
window.addEventListener('pointermove', movePointerGesture, { passive: false });
window.addEventListener('pointerup', (event) => {
  endPointerGesture(event);
  if (event.pointerId === gesture.cancelledPointerId) {
    gesture.cancelledPointerId = null;
    suppressNextClick();
  }
});
window.addEventListener('pointercancel', (event) => {
  if (event.pointerId === gesture.pointerId) finishDrag();
  if (event.pointerId === gesture.cancelledPointerId) gesture.cancelledPointerId = null;
});
artboard.addEventListener('lostpointercapture', (event) => {
  if (event.target === artboard && event.pointerId === gesture.pointerId) finishDrag();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && (landing || gesture.state !== 'idle')) {
    event.preventDefault();
    finishDrag();
  }
});
window.addEventListener('blur', () => finishDrag());
window.addEventListener('resize', () => finishDrag());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) finishDrag();
});
artboard.addEventListener('dragstart', (event) => event.preventDefault());
artboard.addEventListener('click', (event) => {
  const action = event.target instanceof Element && event.target.closest('#reset-btn, #cancel-btn, #save-btn');
  if (action && (landing || gesture.state !== 'idle')) {
    finishDrag();
    return;
  }
  if (landing || state.dragActive || state.suppressClick || (gesture.state !== 'idle' && gesture.state !== 'press')) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);
grid.addEventListener('scroll', () => {
  if (landing && grid.scrollTop !== landing.scrollTop) finishLanding();
  if (gesture.state === 'drag') updateDropPlan(gesture.point, moveGhost());
}, { passive: true });
new MutationObserver(() => {
  if (gesture.state !== 'idle' && gesture.source && !gesture.source.isConnected) finishDrag();
}).observe(artboard, { childList: true, subtree: true });

/* ===== 顶栏 ⇄ 菜单：点击 =====
   点顶栏某项：移入菜单末位；点菜单卡片：移回顶栏末位（顶栏最多 5 个） */
topNav.addEventListener('click', (event) => {
  if (state.dragActive || state.suppressClick) return;
  const nav = event.target.closest('.nav-btn');
  if (!nav || !SHORTCUTS[nav.dataset.id]) return;
  const id = nav.dataset.id;
  navOrder.splice(navOrder.indexOf(id), 1);
  menuAdd(id);
  renderNav();
  renderMenu();
  announce(`「${SHORTCUTS[id].label}」已加入菜单末位`);
});

grid.addEventListener('click', (event) => {
  if (state.dragActive || state.suppressClick) return;
  const card = event.target.closest('.menu-item');
  if (!card || !SHORTCUTS[card.dataset.id]) return;
  const id = card.dataset.id;
  if (navOrder.length >= NAV_SLOTS.length) {
    showToast();
    return;
  }
  menuRemove(id);
  navOrder.push(id);
  renderNav();
  renderMenu();
  announce(`「${SHORTCUTS[id].label}」已移回顶栏末位`);
});

/* 列表项支持键盘：Enter / Space 等同点击 */
grid.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const card = event.target.closest('.menu-item');
  if (!card) return;
  event.preventDefault();
  card.click();
});

/* ===== 恢复默认 / 取消 / 保存 =====
   默认排布 = 初始 NAV_START + 其余条目；
   保存 = 记下当前排布作为快照；取消 = 回到快照；恢复默认 = 回到默认排布并重置快照 */
function defaultOrder() {
  return {
    nav: [...NAV_START],
    menu: MENU_ITEMS.map((item) => item.id).filter((id) => !NAV_START.includes(id)),
  };
}

let savedOrder = defaultOrder();

function applyOrder(order) {
  if (landing || gesture.state !== 'idle') finishDrag();
  navOrder.length = 0;
  navOrder.push(...order.nav);
  menuOrder = [...order.menu];
  grid.scrollTop = 0; /* 回到列表顶部，避免停在已不存在的滚动位置 */
  renderNav();
  renderMenu();
}

resetBtn.addEventListener('click', () => {
  if (landing || gesture.state !== 'idle') finishDrag();
  savedOrder = defaultOrder();
  applyOrder(savedOrder);
  announce('已恢复默认排布');
});

cancelBtn.addEventListener('click', () => {
  applyOrder(savedOrder);
  announce('已取消修改，回到上次保存的排布');
});

saveBtn.addEventListener('click', () => {
  if (landing || gesture.state !== 'idle') finishDrag();
  savedOrder = { nav: [...navOrder], menu: [...menuOrder] };
  announce('已保存当前排布');
});

window.addEventListener('resize', updateScale);
renderNav();
renderMenu();
updateScale();
