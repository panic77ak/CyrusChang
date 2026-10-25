const welcome = document.getElementById('welcome');
const embeddedChat = document.querySelector('[data-chat-layout="embedded"]');
const isContentPreview = embeddedChat?.dataset.chatMode === 'preview';
const chatToggle = document.getElementById('chat-toggle');
const chatDock = document.getElementById('chat-dock');
const contactLauncher = document.getElementById('contact-launch');
const contactLabel = document.getElementById('contact-label');
const contactStatus = document.getElementById('contact-status');
const composerPanel = document.getElementById('chat-composer');
const homeIntro = document.getElementById('home-intro');
const conversation = document.getElementById('conversation');
const brandHome = document.getElementById('brand-home');
const form = document.getElementById('composer');
const question = document.getElementById('question');
const topicButtons = [...document.querySelectorAll('[data-topic]')];
const sendButton = form.querySelector('.send-button');
const history = [];
let isSending = false;
let chatMode = 'home';
let modeTransitionId = 0;
let modeAnimation = null;
let homeScrollPosition = 0;
const sessionKey = chatDock ? 'cyrus-chat-v2:home' : `cyrus-chat-v1:${location.pathname}`;
let restoring = false;
let activeRequest = null;
let launcherAnimation = null;
let topicsAnimation = null;

function prepareTopicsMotion() {
  const topics = chatDock?.querySelector('.quick-topics');
  if (!topics || restoring || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const before = topics.getBoundingClientRect();
  topicsAnimation?.cancel();
  return () => {
    const after = topics.getBoundingClientRect();
    topicsAnimation = topics.animate([
      { transform: `translate(${before.left - after.left}px, ${before.top - after.top}px)` },
      { transform: 'translate(0, 0)' }
    ], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
}
const sendIcon = sendButton.innerHTML;
const replyStatus = document.createElement('span');
replyStatus.className = 'sr-only';
replyStatus.setAttribute('role', 'status');
document.body.append(replyStatus);

function revealMessage(node) {
  if (restoring || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  node.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], {
    duration: 180, easing: 'cubic-bezier(.22,1,.36,1)'
  });
}

function saveConversation() {
  if (restoring || !chatDock) return;
  const messages = [...conversation.children].map(node => {
    try { return JSON.parse(node.dataset.record); } catch { return null; }
  }).filter(Boolean);
  try {
    sessionStorage.setItem(sessionKey, JSON.stringify({
      updated: Date.now(), messages: messages.slice(-80),
      history: history.slice(-8), draft: question.value,
      active: contactLauncher.getAttribute('aria-expanded') === 'true',
      scroll: window.scrollY, homeScroll: homeScrollPosition
    }));
  } catch { /* Storage restrictions must not prevent chatting. */ }
}

const replies = {
  cv: {
    prompt: '我想看看你的 CV',
    html: `<p>这是我的简历，可以直接查看，或下载 PNG 长图。</p>
      <article class="result-card">
        <img class="result-card__image" src="assets/resume/CyrusChang-Resume.png" alt="常宸简历预览" width="1080" height="3600">
        <div class="result-card__body"><p class="result-eyebrow">简历</p><h2>常宸 · 体验设计师</h2><p>我的工作经历、项目和联系方式都在这份简历里。</p>
          <div class="result-links"><a href="resume.html">查看简历</a><a href="assets/resume/CyrusChang-Resume.png" download="CyrusChang-Resume.png">下载简历长图 ↓</a></div>
        </div><div class="result-card__footer"><span>资料来源：网站公开简历</span><a href="resume.html">打开原页 ↗</a></div>
      </article>`
  },
  about: {
    prompt: '介绍一下你自己',
    html: `<p>我是常宸，一名<strong>体验设计师</strong>。我目前主要处理游戏里的复杂系统交互，也在用 AI 和代码拓展设计能抵达的地方。</p>
      <article class="result-card"><div class="result-card__body"><p class="result-eyebrow">关于我</p><h2>从规则到可以使用的体验</h2>
        <p>我关注规则、状态、信息层级和反馈方式，习惯从真实任务与证据出发，再用可点击的原型尽早检验设计。</p>
        <div class="result-links"><a href="about.html">阅读完整介绍</a><a href="work.html">查看工作经历</a></div>
      </div><div class="result-card__footer"><span>资料来源：网站公开自述</span><a href="about.html">打开原页 ↗</a></div></article>`
  },
  project: {
    prompt: '我想看看你的项目案例',
    html: `<p>这里有三个已整理的项目案例，分别涉及复杂系统交互、绘图工具和早期系统架构。可以先看<strong>王者万象棋</strong>，也可以选择感兴趣的案例展开。</p>
      <article class="result-card">
        <img class="result-card__image result-card__image--case" src="assets/cases/wanxiangqi/lobby-insert-after.jpg" alt="王者万象棋大厅快捷入口调整方案" width="1500" height="570">
        <div class="result-card__body"><p class="result-eyebrow">代表项目 · 王者万象棋</p><h2>让复杂系统变得走得通</h2>
          <p>我整理了大厅体验、一对一私教，以及从收藏到挑战与结算的状态链。你可以直接看我的设计判断和对应的界面证据。</p>
          <div class="result-links"><a href="case.html?project=wanxiangqi">阅读完整案例</a><a href="demos.html">体验相关原型</a></div>
        </div><div class="result-card__footer"><span>资料来源：网站公开案例</span></div>
      </article>
      <article class="result-card"><div class="result-card__body"><h2>Club Koala · DIY 绘图工具</h2>
        <p>我在项目后期完成绘图工具的体验优化方案与原型，重点是直接绘制、工具布局，以及撤销、保存、发布等操作状态。</p>
        <div class="result-links"><a href="case.html?project=club-koala">查看案例详情</a></div>
      </div></article>
      <article class="result-card"><div class="result-card__body"><h2>Dragon City Rises · 早期系统架构</h2>
        <p>我参与这个海外 SLG 早期项目的系统关系梳理、信息架构和主城入口设计。案例展示目前可以公开的早期职责与基础体验方案。</p>
        <div class="result-links"><a href="case.html?project=dragon-city-rises">查看案例详情</a></div>
      </div></article>`
  },
  prototype: {
    prompt: '有哪些可以直接体验的原型？',
    html: `<p>我和 AI 一起做了两个可以直接操作的 HTML 原型，把页面之间的关系、操作反馈和状态变化放进了可试玩的体验里。</p>
      <div class="mini-grid">
        <a class="mini-card" href="demos/hall/index.html" target="_blank" rel="noopener"><strong>玩法大厅</strong><small>切换玩法、查看规则，以及在大厅与积分等页面之间导航。</small><span>打开原型 ↗</span></a>
        <a class="mini-card" href="demos/menu/index.html" target="_blank" rel="noopener"><strong>菜单自定义</strong><small>拖动菜单项目，调整快捷入口，查看保存与恢复默认状态。</small><span>打开原型 ↗</span></a>
      </div><p class="source-line">还可以看我的<a href="prototype-sharing.html">原型制作过程</a>，或浏览<a href="demos.html">全部设计实践</a>。</p>`
  },
  method: {
    prompt: '你怎样使用 AI 做设计？',
    html: `<p>我主要用 AI 协助<strong>材料整理、方案发散和可点击原型制作</strong>。设计目标、规则取舍和最终判断，还是由我来做。</p>
      <article class="result-card"><div class="result-card__body"><p class="result-eyebrow">工作方式</p><h2>让设计尽早可以被操作和讨论</h2>
        <p>例如，我会把静态设计稿做成 HTML 原型，用实际操作检查流程、状态和反馈。项目资料也会在 Obsidian 中保留来源，让我的设计判断可以回到证据。</p>
        <div class="result-links"><a href="prototype-sharing.html">看原型制作分享</a><a href="workflow.html">看知识整理方式</a><a href="design-workflow.html">看交互工作流程</a></div>
      </div><div class="result-card__footer"><span>资料来源：网站公开实践</span><a href="demos.html">浏览设计实践 ↗</a></div></article>`
  },
  writing: {
    prompt: '你写过哪些文章？',
    html: `<p>我写过一些关于体验设计、游戏 UX 和 AI 的文章，可以从这几篇读起：</p>
      <article class="result-card"><div class="result-card__body"><div class="project-list" aria-label="文章">
        <a href="article.html?slug=ai-decision"><span>设计同学，别被 AI 带着跑</span><span>阅读 ↗</span></a>
        <a href="article.html?slug=complex-ux"><span>我发现游戏 UX 可能还挺适合做 AI 产品的</span><span>阅读 ↗</span></a>
        <a href="article.html?slug=ai-new"><span>AI 到底新在哪儿。</span><span>阅读 ↗</span></a>
      </div></div><div class="result-card__footer"><span>资料来源：网站公开文章</span><a href="writing.html">查看文章列表 ↗</a></div></article>`
  },
  contact: {
    prompt: '怎么联系你？',
    html: `<p>可以直接给我发邮件，聊项目、合作，或一个具体的体验问题。</p><p class="text-links"><a href="mailto:changchen7775@gmail.com">changchen7775@gmail.com ↗</a></p>`
  }
};

function routeQuestion(value) {
  if (/(简历|CV|cv|履历|经历)/.test(value)) return 'cv';
  if (/(关于常宸|常宸是谁|你是谁|他是谁|自我介绍|介绍一下你自己|介绍一下自己|^介绍一下常宸$)/.test(value)) return 'about';
  if (/(原型|demo|Demo|试玩|交互演示)/.test(value)) return 'prototype';
  if (/(AI|ai|人工智能|工作方式|流程|方法|Obsidian)/.test(value)) return 'method';
  if (/(文章|写作|观点|随笔)/.test(value)) return 'writing';
  if (/(联系|邮箱|邮件|合作)/.test(value)) return 'contact';
  if (/(项目|案例|王者|万象棋|Koala|koala|Dragon)/.test(value)) return 'project';
  return null;
}

const greetingSuggestions = [
  { prompt: replies.project.prompt, topic: 'project' },
  { prompt: replies.cv.prompt, topic: 'cv' },
  { prompt: replies.method.prompt, topic: 'method' }
];

function appendGreetingSuggestions(target, askedPrompts = new Set()) {
  if (target.body.querySelector('.greeting-suggestions')) return;
  const available = greetingSuggestions.filter(({ prompt }) => !askedPrompts.has(prompt));
  if (!available.length) return;
  const prompts = document.createElement('div');
  prompts.className = 'follow-up-questions greeting-suggestions';
  prompts.setAttribute('aria-label', '你可以这样问');
  available.forEach(({ prompt, topic }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = prompt;
    button.addEventListener('click', () => {
      button.remove();
      sendMessage(prompt, topic);
    });
    prompts.append(button);
  });
  target.body.append(prompts);
}

function addUserMessage(value) {
  const message = document.createElement('div');
  message.className = 'message message--user';
  message.dataset.record = JSON.stringify({ role: 'user', answer: value });
  const bubble = document.createElement('div');
  bubble.className = 'user-bubble';
  bubble.textContent = value;
  message.appendChild(bubble);
  conversation.appendChild(message);
  revealMessage(message);
}

function scrollToLatest() {
  if (chatDock && (conversation.hidden || chatMode !== 'active')) return;
  if (embeddedChat) {
    requestAnimationFrame(() => {
      if (chatDock && (conversation.hidden || chatMode !== 'active')) return;
      conversation.lastElementChild?.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
      });
    });
    return;
  }
  requestAnimationFrame(() => window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  }));
}

function makeAssistantMessage() {
  const message = document.createElement('article');
  message.className = 'message message--assistant';
  const heading = document.createElement('p');
  heading.className = 'message-heading';
  heading.textContent = 'C · AI FRIEND';
  const body = document.createElement('div');
  body.className = 'message-body';
  message.append(heading, body);
  conversation.appendChild(message);
  revealMessage(message);
  return { message, body };
}

function renderAssistantMessage(target, answer, sources, topic, currentQuestion = '') {
  target.message.dataset.record = JSON.stringify({ role: 'assistant', answer, sources, topic, request: currentQuestion });
  target.body.replaceChildren();
  const paragraph = document.createElement('p');
  paragraph.className = 'ai-answer';
  paragraph.textContent = answer;
  target.body.appendChild(paragraph);

  const cardSources = {
    cv: 'resume.html',
    project: 'case.html?project=wanxiangqi',
    prototype: 'demos.html'
  };
  let shownCardHref = null;
  if (cardSources[topic] && (topic === 'cv' || sources.some(source => source.href === cardSources[topic]))) {
    const template = document.createElement('template');
    template.innerHTML = replies[topic].html;
    const card = template.content.querySelector('.result-card, .mini-grid');
    if (card) {
      // The primary action already opens this page; keep the footer as attribution.
      card.querySelector('.result-card__footer a')?.remove();
      target.body.appendChild(card);
      revealMessage(card);
      shownCardHref = cardSources[topic];
    }
  }

  const remainingSources = sources.filter(source => source.href !== shownCardHref);
  if (remainingSources.length) {
    const links = document.createElement('div');
    links.className = 'ai-sources';
    const label = document.createElement('span');
    label.textContent = '相关页面';
    links.appendChild(label);
    remainingSources.forEach(source => {
      const link = document.createElement('a');
      link.href = source.href;
      if (source.href.startsWith('/api/note?')) {
        if (chatDock) {
          const url = new URL(source.href, location.href);
          url.searchParams.set('via', 'chat');
          link.href = url.href;
        } else {
          link.target = '_blank';
          link.rel = 'noopener';
        }
      }
      link.textContent = `${source.title}${link.target === '_blank' ? ' ↗' : ''}`;
      if (link.target === '_blank') link.setAttribute('aria-label', `${source.title}（新标签页打开）`);
      links.appendChild(link);
    });
    target.body.appendChild(links);
    revealMessage(links);
  }
  const followUpTopic = topic || (sources.some(source => source.href.includes('case.html')) ? 'project' : sources.some(source => source.href.includes('resume.html')) ? 'cv' : null);
  const followUps = {
    project: ['这个项目里，你具体负责哪些部分？', '这个方案的效果是怎么验证的？'],
    cv: ['你最近负责的代表项目是什么？', '你的系统交互经验体现在哪些地方？'],
    about: ['带我看一个代表项目', '你通常怎样与团队推进设计？'],
    prototype: ['这个原型帮你验证了什么？', '哪些设计判断是由你来做的？'],
    method: ['能用一个具体项目说明吗？', '你怎样检查 AI 产出的质量？'],
  };
  if (sources.length && followUps[followUpTopic]) {
    const prompts = document.createElement('div');
    prompts.className = 'follow-up-questions';
    prompts.setAttribute('aria-label', '继续了解');
    followUps[followUpTopic].filter(text => text !== currentQuestion && !history.some(item => item.role === 'user' && item.content === text)).forEach(text => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = text;
      button.addEventListener('click', () => sendMessage(text, routeQuestion(text)));
      prompts.append(button);
    });
    target.body.append(prompts);
  }
  if (!restoring && !isSending) scrollToLatest();
}

function startConversation() {
  if (embeddedChat) {
    embeddedChat.classList.add('chat-is-open');
    if (chatToggle) {
      chatToggle.hidden = false;
      if (!chatDock) chatToggle.textContent = '收起对话';
      chatToggle.setAttribute('aria-expanded', 'true');
    }
    if (chatDock) {
      const animateTopics = contactLauncher.getAttribute('aria-expanded') !== 'true' ? prepareTopicsMotion() : () => {};
      updateContactState(true);
      composerPanel.hidden = false;
      question.style.height = 'auto';
      question.style.height = `${Math.min(question.scrollHeight, 120)}px`;
      chatDock.classList.add('is-expanded');
      updateDockHeight();
      animateTopics();
      enterChatMode();
    } else {
      embeddedChat.hidden = false;
      conversation.hidden = false;
    }
  } else {
    conversation.hidden = false;
    document.body.classList.add('has-conversation');
  }
}

function enterChatMode() {
  if (chatMode === 'active' || !homeIntro) {
    embeddedChat.hidden = false;
    conversation.hidden = false;
    chatMode = 'active';
    return;
  }
  if (chatMode === 'entering') return;

  const transitionId = ++modeTransitionId;
  homeScrollPosition = window.scrollY;
  const style = getComputedStyle(homeIntro);
  const from = { opacity: style.opacity, transform: style.transform };
  modeAnimation?.cancel();
  homeIntro.inert = true;
  embeddedChat.hidden = true;
  conversation.hidden = true;
  chatMode = 'entering';

  const revealConversation = () => {
    if (transitionId !== modeTransitionId) return;
    homeIntro.hidden = true;
    modeAnimation?.cancel();
    modeAnimation = null;
    document.body.classList.add('is-chat-mode');
    embeddedChat.hidden = false;
    conversation.hidden = false;
    chatMode = 'active';
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      modeAnimation = embeddedChat.animate([
        { opacity: 0, transform: 'translateY(14px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
    if (conversation.childElementCount > 2) scrollToLatest();
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealConversation();
    return;
  }
  modeAnimation = homeIntro.animate([
    from,
    { opacity: 0, transform: 'translateY(-48px)' }
  ], { duration: 300, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  modeAnimation.finished.then(revealConversation).catch(() => {});
}

function restoreHomeIntro() {
  if (!homeIntro || (chatMode === 'home' && !homeIntro.hidden)) return;
  ++modeTransitionId;
  const style = getComputedStyle(homeIntro);
  const from = homeIntro.hidden
    ? { opacity: 0, transform: 'translateY(-28px)' }
    : { opacity: style.opacity, transform: style.transform };
  modeAnimation?.cancel();
  modeAnimation = null;
  document.body.classList.remove('is-chat-mode');
  homeIntro.hidden = false;
  homeIntro.inert = false;
  chatMode = 'home';
  window.scrollTo({ top: homeScrollPosition, behavior: 'instant' });
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    modeAnimation = homeIntro.animate([
      from,
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
}

function updateContactState(active) {
  const before = contactLauncher.getBoundingClientRect();
  const changed = contactLauncher.classList.contains('is-active') !== active;
  launcherAnimation?.cancel();
  contactLauncher.classList.toggle('is-active', active);
  contactLauncher.setAttribute('aria-expanded', String(active));
  contactLauncher.setAttribute('aria-pressed', String(active));
  contactLauncher.setAttribute('aria-label', active ? 'C · AI FRIEND CHAT，点击关闭对话并保留记录' : '和我聊聊，展开 AI 对话');
  contactLauncher.title = active ? '退出对话，保留记录' : '展开聊天';
  contactLabel.textContent = active ? 'C · AI FRIEND CHAT' : '和我聊聊';
  contactStatus.hidden = !active;
  if (changed && !restoring && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const after = contactLauncher.getBoundingClientRect();
    launcherAnimation = contactLauncher.animate([
      { transform: `translate(${before.left - after.left}px, ${before.top - after.top}px)` },
      { transform: 'translate(0, 0)' }
    ], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
}

function updateDockHeight() {
  if (!chatDock) return;
  document.documentElement.style.setProperty('--chat-dock-height', `${Math.ceil(chatDock.getBoundingClientRect().height)}px`);
}

function collapseDockChat() {
  const animateTopics = prepareTopicsMotion();
  conversation.hidden = true;
  embeddedChat.hidden = true;
  embeddedChat.classList.remove('chat-is-open');
  composerPanel.hidden = true;
  updateContactState(false);
  chatDock.classList.remove('is-expanded');
  updateDockHeight();
  animateTopics();
  restoreHomeIntro();
  saveConversation();
}

function setSending(value) {
  isSending = value;
  replyStatus.textContent = value ? '正在思考，请稍候。可以使用停止生成按钮。' : '本次回答已结束。';
  sendButton.disabled = !value && !question.value.trim();
  sendButton.innerHTML = value ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"/></svg>' : sendIcon;
  sendButton.setAttribute('aria-label', value ? '停止生成' : '发送问题');
  sendButton.title = value ? '停止生成' : '发送问题';
  topicButtons.forEach(button => { button.disabled = value; });
  conversation.querySelectorAll('.retry-answer, .follow-up-questions button').forEach(button => { button.disabled = value; });
  form.setAttribute('aria-busy', String(value));
  conversation.setAttribute('aria-busy', String(value));
}

function offerRetry(target, value, topic, note) {
  const status = document.createElement('p');
  status.className = 'ai-pending';
  status.textContent = note;
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'retry-answer';
  retry.textContent = '重新回答';
  retry.addEventListener('click', () => sendMessage(value, topic, target));
  target.body.append(status, retry);
  const destinations = { project: ['查看项目', 'work.html'], cv: ['查看简历', 'resume.html'], about: ['关于我', 'about.html'], prototype: ['体验原型', 'demos.html'], method: ['设计工作方式', 'workflow.html'], writing: ['阅读文章', 'writing.html'] };
  if (destinations[topic]) {
    const link = document.createElement('a');
    link.className = 'retry-browse';
    [link.textContent, link.href] = destinations[topic];
    target.body.append(link);
  }
  const record = JSON.parse(target.message.dataset.record || '{}');
  target.message.dataset.record = JSON.stringify({ ...record, role: 'assistant', answer: record.answer || '', sources: [], request: value, topic, interrupted: true, notice: note });
}

async function sendMessage(value, topic, retryTarget = null) {
  if (isSending) return;
  startConversation();
  if (!retryTarget) addUserMessage(value);
  const target = retryTarget || makeAssistantMessage();
  target.body.replaceChildren();
  target.message.dataset.record = JSON.stringify({ role: 'assistant', answer: '', sources: [], request: value, topic, interrupted: true });
  const pending = document.createElement('p');
  pending.className = 'ai-pending';
  pending.dataset.waiting = 'true';
  const dots = document.createElement('span');
  dots.className = 'thinking-dots';
  dots.setAttribute('aria-hidden', 'true');
  dots.innerHTML = '<i></i><i></i><i></i>';
  const waitingLabel = document.createElement('span');
  waitingLabel.textContent = '正在思考';
  pending.append(dots, waitingLabel);
  target.body.appendChild(pending);
  setSending(true);
  scrollToLatest();

  const isResumeRequest = topic === 'cv' && (value === replies.cv.prompt || /^(?:请)?(?:下载|查看|看看|给我|发我)?(?:一下|一份|你的)?(?:简历|cv)[。？！!?]*$/i.test(value.trim()));
  const isProjectOverview = topic === 'project' && value === replies.project.prompt;
  if (isContentPreview || isResumeRequest || isProjectOverview || (chatDock && topic === 'contact')) {
    if (topic && replies[topic]) {
      target.body.innerHTML = replies[topic].html;
    } else {
      target.body.replaceChildren();
      const note = document.createElement('p');
      note.textContent = '当前为内容预览，可以选择上方的项目、简历、原型或文章。';
      target.body.appendChild(note);
    }
    history.push({ role: 'user', content: value }, { role: 'assistant', content: target.body.textContent.trim() });
    target.message.dataset.record = JSON.stringify({ role: 'assistant', answer: target.body.textContent.trim(), sources: [], topic, prepared: Boolean(topic && replies[topic]) });
    setSending(false);
    saveConversation();
    scrollToLatest();
    return;
  }

  let streamedAnswer = '';
  activeRequest = new AbortController();
  let timedOut = false;
  const slowTimer = setTimeout(() => { waitingLabel.textContent = '仍在等待回答，可随时停止'; }, 8000);
  const timeoutTimer = setTimeout(() => { timedOut = true; activeRequest?.abort(); }, 25000);
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      signal: activeRequest.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: value,
        stream: true,
        history: history.slice(-6).map(item => ({ role: item.role, content: item.content.slice(0, 300) }))
      })
    });
    if (!response.ok) throw new Error((await response.json()).error || 'request_failed');
    let data;
    if (response.headers.get('content-type')?.includes('application/x-ndjson')) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const paragraph = document.createElement('p');
      paragraph.className = 'ai-answer';
      try {
        while (true) {
          const { done, value: chunk } = await reader.read();
          buffer += done ? decoder.decode() : decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          if (done && buffer) lines.push(buffer);
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line);
            if (event.type === 'error') throw new Error(event.error);
            if (event.type === 'answer') {
              const nearBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight < 180;
              streamedAnswer = event.answer;
              if (!paragraph.isConnected) replyStatus.textContent = '正在生成回答。';
              clearTimeout(slowTimer);
              target.message.classList.add('is-streaming');
              target.message.dataset.record = JSON.stringify({ role: 'assistant', answer: streamedAnswer, sources: [], request: value, topic, interrupted: true });
              if (!paragraph.isConnected) target.body.replaceChildren(paragraph);
              paragraph.textContent = streamedAnswer;
              if (nearBottom && (!chatDock || chatMode === 'active')) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
            }
            if (event.type === 'done') data = event;
          }
          if (done) break;
        }
        if (!data) throw new Error('stream_interrupted');
      } finally {
        await reader.cancel().catch(() => {});
      }
    } else {
      data = await response.json();
    }
    if (typeof data.answer !== 'string' || !Array.isArray(data.sources)) throw new Error('invalid_response');
    renderAssistantMessage(target, data.answer, data.sources || [], topic, value);
    history.push({ role: 'user', content: value }, { role: 'assistant', content: data.answer });
  } catch (error) {
    if (streamedAnswer || error.name === 'AbortError') {
      if (!streamedAnswer) target.body.replaceChildren();
      offerRetry(target, value, topic, timedOut ? '等待超时了，可以再试一次。' : error.name === 'AbortError' ? '已停止生成。' : '回答中途断开了。');
      return;
    }
    if (error.message === 'not_configured' && topic && replies[topic]) {
      target.message.querySelector('.message-heading').textContent = 'C · AI FRIEND · 内容预览';
      target.body.innerHTML = `<p class="ai-pending">对话暂不可用，先展示已整理的网站内容。</p>${replies[topic].html}`;
      target.message.dataset.record = JSON.stringify({ role: 'assistant', answer: target.body.textContent.trim(), sources: [], topic, prepared: true, preview: true });
      scrollToLatest();
      return;
    }
    const messages = {
      not_configured: '对话暂不可用，可以先查看项目、简历或文章。',
      rate_limited: '发送得有些频繁，请一分钟后再试。',
      upstream_rate_limited: '服务暂时繁忙，请稍后重试。',
      empty_response: '这次没有收到回答，请重试。',
      invalid_upstream_response: '这次收到的回答不完整，请重试。',
      upstream_unavailable: '连接暂时中断，请稍后重试。',
      timeout: '等待回答超时，请重试。'
    };
    renderAssistantMessage(target, messages[error.message] || '暂时无法回答，请稍后重试。', [], null);
    offerRetry(target, value, topic, '可以重试这个问题。');
  } finally {
    clearTimeout(slowTimer);
    clearTimeout(timeoutTimer);
    target.message.classList.remove('is-streaming');
    activeRequest = null;
    setSending(false);
    saveConversation();
  }
}

topicButtons.forEach(button => {
  button.title = replies[button.dataset.topic].prompt;
  button.setAttribute('aria-label', `发送：${replies[button.dataset.topic].prompt}`);
  button.addEventListener('click', () => {
    if (!isSending && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      button.animate([
        { transform: 'scale(.95)' },
        { transform: 'scale(1.02)', offset: .65 },
        { transform: 'scale(1)' }
      ], { duration: 220, easing: 'ease-out' });
    }
    sendMessage(replies[button.dataset.topic].prompt, button.dataset.topic);
  });
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (isSending) {
    if (event.submitter === sendButton) activeRequest?.abort();
    return;
  }
  const value = question.value.trim();
  if (!value || isSending) return;
  question.value = '';
  question.style.height = '';
  sendMessage(value, routeQuestion(value));
});

question.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    if (!isSending) form.requestSubmit();
  }
});

question.addEventListener('input', () => {
  question.style.height = 'auto';
  question.style.height = `${Math.min(question.scrollHeight,120)}px`;
  sendButton.disabled = !isSending && !question.value.trim();
  saveConversation();
});

chatToggle?.addEventListener('click', () => {
  if (chatDock) {
    collapseDockChat();
    contactLauncher.focus({ preventScroll: true });
    return;
  }
  conversation.hidden = !conversation.hidden;
  chatToggle.setAttribute('aria-expanded', String(!conversation.hidden));
  chatToggle.textContent = conversation.hidden ? '继续对话' : '收起对话';
  embeddedChat.classList.toggle('chat-is-open', !conversation.hidden);
  if (!conversation.hidden) scrollToLatest();
});

brandHome?.addEventListener('click', event => {
  if (embeddedChat) {
    event.preventDefault();
    if (chatDock) collapseDockChat();
    window.scrollTo({top:0,behavior:'instant'});
    return;
  }
  conversation.hidden = true;
  document.body.classList.remove('has-conversation');
  window.scrollTo({top:0,behavior:'instant'});
});

contactLauncher?.addEventListener('click', () => {
  if (contactLauncher.getAttribute('aria-expanded') === 'true') {
    collapseDockChat();
    contactLauncher.focus({ preventScroll: true });
    return;
  }
  if (conversation.childElementCount) {
    startConversation();
    scrollToLatest();
    return;
  }
  startConversation();
  const greeting = '嗨，我是 C · AI FRIEND，常宸的网站 AI 分身。可以从下面选一个问题，也可以直接问我。';
  const target = makeAssistantMessage();
  renderAssistantMessage(target, greeting, [], null);
  appendGreetingSuggestions(target);
  target.message.dataset.record = JSON.stringify({ role: 'assistant', answer: greeting, sources: [], topic: null, greeting: true });
  history.push({ role: 'assistant', content: greeting });
  saveConversation();
});

if (chatDock) {
  restoring = true;
  try {
    const saved = JSON.parse(sessionStorage.getItem(sessionKey) || sessionStorage.getItem('cyrus-chat-v1:/home-chat-preview.html'));
    if (saved && Date.now() - saved.updated < 86400000 && Array.isArray(saved.messages)) {
      const askedPrompts = new Set(saved.messages.filter(item => item.role === 'user').map(item => item.answer));
      for (const item of saved.messages.slice(-80)) {
        if (typeof item.answer !== 'string') continue;
        if (item.role === 'user') addUserMessage(item.answer);
        else if (item.role === 'assistant') {
          const target = makeAssistantMessage();
          const sources = (Array.isArray(item.sources) ? item.sources : []).filter(source => {
            try { const url = new URL(source.href, location.href); return url.origin === location.origin; } catch { return false; }
          });
          renderAssistantMessage(target, item.answer, sources, item.topic, item.request || '');
          if (item.prepared && replies[item.topic]) target.body.innerHTML = replies[item.topic].html;
          if (item.greeting) appendGreetingSuggestions(target, askedPrompts);
          if (item.preview) target.message.querySelector('.message-heading').textContent = 'C · AI FRIEND · 内容预览';
          target.message.dataset.record = JSON.stringify(item);
          if (item.interrupted) {
            if (typeof item.request === 'string') offerRetry(target, item.request, item.topic, item.notice || '这条回答未完成。');
          }
        }
      }
      history.push(...(Array.isArray(saved.history) ? saved.history : []).filter(item => ['user', 'assistant'].includes(item.role) && typeof item.content === 'string').slice(-8));
      question.value = typeof saved.draft === 'string' ? saved.draft.slice(0, 240) : '';
      homeScrollPosition = Number(saved.homeScroll) || 0;
      if (saved.active) {
        chatMode = 'active';
        homeIntro.hidden = true;
        homeIntro.inert = true;
        document.body.classList.add('is-chat-mode');
        startConversation();
      }
      const restoreScroll = () => window.scrollTo({ top: Number(saved.scroll) || 0, behavior: 'instant' });
      requestAnimationFrame(restoreScroll);
      window.addEventListener('load', restoreScroll, { once: true });
    }
  } catch { /* Ignore unavailable or invalid saved sessions. */ }
  restoring = false;
  setSending(false);
  window.addEventListener('pagehide', saveConversation);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveConversation(); });
  document.addEventListener('click', event => { if (event.target.closest('a[href]')) saveConversation(); }, true);
  new ResizeObserver(updateDockHeight).observe(chatDock);
  const latest = document.createElement('button');
  latest.type = 'button';
  latest.className = 'jump-latest';
  latest.textContent = '回到最新 ↓';
  latest.setAttribute('aria-controls', 'conversation');
  latest.hidden = true;
  chatDock.querySelector('.chat-dock__inner').prepend(latest);
  const updateLatest = () => {
    latest.hidden = chatMode !== 'active' || conversation.getBoundingClientRect().bottom <= chatDock.getBoundingClientRect().top + 20;
  };
  latest.addEventListener('click', () => window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  }));
  window.addEventListener('scroll', updateLatest, { passive: true });
  new ResizeObserver(updateLatest).observe(conversation);
  new MutationObserver(updateLatest).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  const topics = chatDock.querySelector('.quick-topics');
  const updateTopicOverflow = () => {
    topics.classList.toggle('has-more', topics.scrollWidth - topics.clientWidth - topics.scrollLeft > 4);
  };
  topics.addEventListener('scroll', updateTopicOverflow, { passive: true });
  new ResizeObserver(updateTopicOverflow).observe(topics);
  updateTopicOverflow();
  updateDockHeight();
  const updateKeyboardPosition = () => {
    const viewport = window.visualViewport;
    const keyboardOffset = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
    chatDock.style.bottom = `${keyboardOffset}px`;
  };
  window.visualViewport?.addEventListener('resize', updateKeyboardPosition);
  window.visualViewport?.addEventListener('scroll', updateKeyboardPosition);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.isComposing && contactLauncher.getAttribute('aria-expanded') === 'true') {
      collapseDockChat();
      contactLauncher.focus({ preventScroll: true });
    }
  });
}
