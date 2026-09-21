const cases = {
  wanxiangqi: {
    title: '王者万象棋', meta: 'UX Designer · 2025年10月 — 至今',
    icon: 'assets/wangzhe-wanxiangqi-icon.png',
    intro: '一个规则密度很高的自走棋项目。我负责项目中的系统交互，把策划规则整理成玩家看得懂、走得通，也能被开发完整实现的体验。',
    facts: [],
    feature: {
      title: '让一次夺冠，变成可以再次使用的阵容',
      deck: '夺冠原本只停留在单局结算里。这个方案把夺冠阵容保存下来，让玩家之后还能查看、替换，并用它发起异步挑战。',
      problem: '真正需要设计的不是一个“收藏”按钮，而是收藏在什么时候解锁、已有阵容如何处理、挑战前要知道什么，以及成功、失败和重复挑战分别怎样反馈。',
      systemDecision: '把解锁、收藏、替换、挑战与结算串成同一条状态链，并补齐重复挑战、无奖励、失败与他人无数据等边界。',
      flows: [
        {
          src: 'assets/cases/wanxiangqi/champion-collect.jpg',
          title: '解锁、入口与首次收藏',
          text: '满足条件后从排位结果进入阵容页；未收藏与已收藏使用不同动作，让入口状态和玩家当前进度保持一致。'
        },
        {
          src: 'assets/cases/wanxiangqi/champion-replace.jpg',
          title: '命名、替换与完成反馈',
          text: '命名限制在输入时说明；覆盖已有阵容前再次确认，完成后同步改变按钮和阵容状态。'
        },
        {
          src: 'assets/cases/wanxiangqi/champion-preview.jpg',
          title: '挑战预览与重复挑战',
          text: '并列双方阵容、羁绊和消耗；再次挑战时直接说明奖励次数变化，避免玩家用一次试错才理解规则。'
        },
        {
          src: 'assets/cases/wanxiangqi/champion-result.jpg',
          title: '局内信息与胜负分支',
          text: '进入局内后只保留必要信息；胜利、失败、有奖励和无奖励分别进入对应的结算反馈。'
        },
        {
          src: 'assets/cases/wanxiangqi/champion-profile.jpg',
          title: '生涯页、空状态与展示边界',
          text: '收藏结果沉淀到生涯页，同时补齐未收藏、他人无数据和未达条件等状态，让这套阵容能够被持续查看。'
        }
      ],
      outcome: '最终形成了从解锁、收藏、管理到挑战与结算的完整状态链。交互稿不仅描述主流程，也覆盖替换、重复挑战、无奖励和失败等容易遗漏的边界。',
      secondary: [
        {
          title: '一对一私教',
          summary: '一套同时服务学员与教练的多角色系统，涵盖邀请、加入、对局与退出。核心教学规则已由策划确定，教练端的点击、滑动会映射到学员界面。在梳理对局体验时，我主动提出补充教练离线提示：教练离线后，学员仍可继续对局，但需要知道教练当前是否在线。',
          decisionLabel: '让教练状态可见，保持对局连续',
          decision: '由于教练离线不阻止学员继续操作，我在屏幕顶部设计了小块区域显示“教练离线”，让学员能够了解情况，同时保持局内提示的克制，避免弹出提示打断操作。与策划讨论后，双方确认有必要保留。',
          details: [
            ['测试与上线', '上线前，我参与了实际测试，后续也由 QA 进行跑测。该方案现已上线。'],
            ['上线后的使用观察', '同事向我分享了一个意料之外的用法：有玩家让新手坐在教练位，观看有经验的玩家操作。这是一条来自同事转述的观察，也提示了角色名称之外的使用可能：教练位同样可以成为观看学习的位置。']
          ],
          flows: [
            ['多角色邀请与加入','assets/cases/wanxiangqi/private-coach-roles.jpg'],
            ['对局中的双端操作','assets/cases/wanxiangqi/private-coach-flow.jpg'],
            ['退出、失败与社交回流','assets/cases/wanxiangqi/private-coach-states.jpg']
          ]
        },
        {
          title: '百科与棋手卡牌',
          summary: '百科不只是把资料摆在一起：它需要帮玩家理解规则、查找内容，并看懂棋手、技能与卡牌之间的关系。',
          decision: '重新组织一级分类、多维筛选与详情结构；将棋手卡牌作为独立分支，补充技能、秘技、专属关系和收集状态。',
          flows: [
            ['百科架构与规则入口','assets/cases/wanxiangqi/encyclopedia-structure.jpg'],
            ['内容浏览与多维筛选','assets/cases/wanxiangqi/encyclopedia-browse.jpg'],
            ['棋手卡牌与关系状态','assets/cases/wanxiangqi/player-card-states.jpg']
          ]
        },
        {
          title: '棋手应援',
          summary: '一套跨越赛前、赛中与赛后的参与系统。玩家需要理解当前赛期、可选组合、参与成本，以及结果如何结算。',
          decision: '把入口状态、组合选择、二次确认、应援记录和赛后反馈连在同一条链路里；重要数字在动作发生前出现，而不是提交后才补充解释。',
          flows: [
            ['确认与参与成功','assets/cases/wanxiangqi/support-confirm.jpg'],
            ['揭晓、命中与奖励反馈','assets/cases/wanxiangqi/support-result.jpg'],
            ['超时、结束与未完成','assets/cases/wanxiangqi/support-boundary.jpg']
          ]
        },
        {
          title: '交易所',
          summary: '交易所同时承载卡牌与道具，需要让玩家在大量内容中找到目标，并在价格、数量和资源之间完成判断。',
          decision: '统一浏览与购买结构，补齐筛选、数量调整、资源不足和购买失败等状态；让价格变化与最终消耗始终靠近确认动作。',
          flows: [
            ['购买成功与资源不足','assets/cases/wanxiangqi/trading-buy.jpg'],
            ['上架、下架与收益','assets/cases/wanxiangqi/trading-sell.jpg'],
            ['出售状态与空状态','assets/cases/wanxiangqi/trading-states.jpg']
          ]
        },
        {
          title: '王者之路',
          summary: '把赛季成长从一串奖励节点，整理成玩家能够持续感知的长期目标。',
          decision: '区分首次解锁、成长中、达到条件与可领奖等界面状态；奖励只在关键节点出现，让成长反馈和目标感保持连续。',
          flows: [
            ['入口、等级与可领取','assets/cases/wanxiangqi/king-road-entry.jpg'],
            ['未开启与成长回溯','assets/cases/wanxiangqi/king-road-state.jpg'],
            ['等级奖励与收集内容','assets/cases/wanxiangqi/king-road-reward.jpg']
          ]
        },
        {
          title: '大厅体验',
          summary: '团队考虑到大厅外部的 5 个固定快捷入口未必符合不同玩家的使用习惯，希望开放排序与配置，也允许玩家清空全部入口。需求推进中，策划提出将调整范围扩展到菜单。我尝试了点击替换与拖动替换，并随着调整范围扩大，转向以拖动为主的操作方式。',
          decisionLabel: '让插入不再依赖瞄准缝隙',
          decision: '早期方案通过目标区域的判定与吸附确认落点。中间版本已支持命中缝隙后实时让位，但仍区分图标替换区、缝隙插入区和空位。在 Demo 的内部体验与讨论中，我们发现落点不易瞄准，判断规则也比较复杂。我进一步调整了插入规则：无需寻找图标之间的缝隙，拖到已有图标上也能触发让位，同时保留松手前的顺序预览。快捷栏满额时则按替换规则处理。',
          comparison: [
            ['中间方案 · 瞄准缝隙后插入', '图标替换区与缝隙插入区分开，需要先命中缝隙，才能触发插入与让位。', 'assets/cases/wanxiangqi/lobby-insert-before.png'],
            ['最终方案 · 拖到图标上也能让位', '插入无需寻找缝隙，拖到已有图标上也能触发让位，松手前即可看到调整后的顺序。', 'assets/cases/wanxiangqi/lobby-insert-after.jpg']
          ],
          details: [
            ['推进与进度', '经过多轮修改，我通过可操作的 Demo 与团队确认了最终规则。目前自定义方案已进入开发排期，计划于 S2 上线，实际使用效果尚待验证。'],
            ['大厅适配', '另外，针对不同屏幕比例下的展示安全，定义核心层、系统层、运营层和氛围层的安全区，兼容多种比例与设备。']
          ],
          flows: [
            ['自定义入口与编辑模式','assets/cases/wanxiangqi/lobby-customize.jpg'],
            ['拖拽、替换与数量边界','assets/cases/wanxiangqi/lobby-feedback.jpg'],
            ['摄像机比例与大厅安全区','assets/cases/wanxiangqi/camera-adaptation.jpg']
          ]
        }
      ]
    },
    source: ['项目官网','https://wxq.qq.com/'], sourcePlacement: 'header'
  },
  'club-koala': {
    title: 'Club Koala', meta: '模拟经营 · 2021年11月 — 2025年02月',
    icon: 'assets/club-koala-icon.png',
    intro: '在考拉项目后期，我完成了 DIY 绘图工具的体验优化设计。这是我在项目中的最后一次大型优化，重点是让玩家更容易开始绘制，并重新整理画布、工具与操作方式之间的关系。',
    facts: [['角色','UE Designer · 优化方案与交互原型设计'],['交付','设计方案、核心交互原型与手机操作演示'],['状态','后因项目解散，优化方案未正式落地']],
    koalaCase: true,
    sections: [
      ['从哪里开始','DIY 绘图工具让玩家绘制图案，并应用到服装、家具和地面等游戏内容中。我获得了团队提供的部分 CE 测试结论，作为理解问题的输入；测试由其他成员开展，我没有参与测试执行。'],
      ['先让玩家能够开始画','旧方案进入后没有默认选中的工具，需要先选工具，才会出现绘制操作。我在新方案中默认选中画笔，并增加直接触控绘制的方式，希望减少开始创作前需要理解的规则。'],
      ['给画布更多空间，也保留工具入口','我调整了画布与工具栏的布局，将画笔、图形、印章和填充组织为主要工具，再按需展开属性与颜色。收起色板时让画布保持完整，选色时再展开操作。这里的取舍是减少常驻控件，同时让工具的展开关系保持清楚。'],
      ['两种绘画方式，共用一套任务','触控模式下，单指可以直接点击或滑动绘制；光标模式下，单指先移动光标，再通过填色按钮绘制，也可以长按按钮配合滑动连续绘制。两种模式都围绕同一套绘图任务组织，并补充双指缩放、移动画布和复原规则。'],
      ['把编辑过程中的细节补齐','除了画笔操作，我还设计了撤销与重做、画布移动、镜像，以及切换模式、保存、发布和退出的流程。比如画布移动完成后作为一次操作回退，颜色切换时展示作品全貌并暂时禁止绘制，让不同操作状态有明确的边界。']
    ], source: ['Steam 页面','https://store.steampowered.com/app/2819220/Club_Koala/?l=schinese']
  },
  'dragon-city-rises': {
    title: 'Dragon City Rises', meta: 'SLG · 早期项目',
    icon: 'assets/dragon-city-rises-icon.png',
    intro: '一个从立项阶段开始参与的海外 SLG 项目。工作重点是把早期功能设想整理成可继续迭代的信息架构与基础体验方案。',
    facts: [['角色','UE Designer'],['阶段','自立项到早期迭代'],['重点','信息架构与基础体验方案']],
    sections: [
      ['问题','早期项目的系统边界和内容量仍在变化，需要先建立能够承接后续增长的基本结构。'],
      ['我的参与','协助整理核心功能之间的关系、入口与页面层级，把抽象的系统描述转成可讨论、可迭代的体验框架。'],
      ['案例边界','当前只展示能够确认的项目阶段与职责；更具体的内部设计内容暂不公开。']
    ], source: ['项目视频','https://www.youtube.com/watch?v=P9Kov4wqrss']
  }
};
const key = new URLSearchParams(location.search).get('project') || 'wanxiangqi';
const item = cases[key] || cases.wanxiangqi;
document.title = `${item.title} · 设计案例`;
const standardSections = item.sections
  ? `<div class="prose-sections">${item.sections.map(([h,p])=>`<section><h2>${h}</h2><p>${p}</p></section>`).join('')}</div>`
  : '';
const renderShot = (title, label, src, className = 'case-flow-shot') => `
  <button class="case-shot ${className}" type="button" data-shot="${src}" data-alt="${title}：${label}" aria-label="放大查看：${title}，${label}">
    <img src="${src}" alt="${title}：${label}" loading="lazy"><span>点击放大</span>
  </button>`;
const renderGallery = (title, flows) => `<div class="secondary-gallery" aria-label="${title}交互片段">${flows.map(([label, src]) => `
  <figure class="case-flow-card">${renderShot(title, label, src)}<figcaption>${label}</figcaption></figure>`).join('')}</div>`;
const renderDetails = (label, content) => `<details class="case-disclosure"><summary>${label}</summary><div class="case-disclosure-body">${content}</div></details>`;
const renderNotes = (notes) => notes.map(([label, text]) => `<p class="secondary-decision"><span>${label}</span>${text}</p>`).join('');

const renderFeatureCase = (feature) => {
  const lobby = feature.secondary.find(section => section.title === '大厅体验');
  const coach = feature.secondary.find(section => section.title === '一对一私教');
  const others = feature.secondary.filter(section => section !== lobby && section !== coach);
  const summaries = {
    '百科与棋手卡牌': '通过分类、筛选与详情结构，帮助玩家查找内容、理解棋手与卡牌的关系。',
    '棋手应援': '在确认参与前说明组合、成本与赛期，并串联赛后结果和奖励反馈。',
    '交易所': '围绕价格、数量与资源组织买卖操作，补齐资源不足和交易失败等状态。',
    '王者之路': '区分解锁、成长与领奖状态，让玩家看清当前进度和下一步目标。'
  };
  return `<section class="case-secondary case-systems">
    <header><p class="feature-kicker">项目案例</p><h2>从具体的体验问题说起</h2></header>
    <div class="case-secondary-list">
      <article id="lobby">
        <div class="secondary-copy">
          <p class="feature-kicker">大厅体验</p><h3>让插入不再依赖瞄准缝隙</h3>
          <p>团队希望让玩家自由配置大厅的 5 个快捷入口，随后将调整范围扩展到菜单。我尝试了点击替换与拖动替换，并随着范围扩大，转向以拖动为主的操作方式。</p>
          <p class="secondary-decision"><span>在 Demo 中发现问题</span>中间方案已支持插入时实时让位，但需要区分图标替换区、缝隙插入区和空位。内部体验与讨论发现，缝隙不易瞄准，落点规则也较复杂。</p>
          <p class="secondary-decision"><span>我的调整</span>让玩家拖到已有图标上也能触发插入与让位，松手前即可预览顺序；快捷栏满额时，仍按替换规则处理。</p>
          <div class="case-comparison" aria-label="拖动插入方案前后对比">${lobby.comparison.map(([label, description, src]) => `<figure><figcaption><strong>${label}</strong><p>${description}</p></figcaption>${renderShot(lobby.title, label, src, 'comparison-shot')}</figure>`).join('')}</div>
          ${renderNotes([['推进与进度', '通过多轮修改与可操作的 Demo，我和团队确认了最终规则。方案已进入开发排期，计划于 S2 上线，实际效果尚待验证。']])}
        </div>
        ${renderDetails('查看完整交互与大厅适配', renderGallery(lobby.title, lobby.flows) + `<div class="secondary-copy">${renderNotes(lobby.details.slice(1))}</div>`)}
      </article>
      <article id="private-coach">
        <div class="secondary-copy">
          <p class="feature-kicker">一对一私教</p><h3>让学员知道教练离线，又不打断对局</h3>
          <p>这套系统同时服务学员与教练，核心教学规则由策划确定，教练操作会映射到学员界面。我在梳理对局体验时，主动提出补充教练离线提示。</p>
          <p class="secondary-decision"><span>我的判断</span>教练离线后，学员仍可继续对局。因此我在屏幕顶部用小块区域显示“教练离线”，让状态可见，又避免弹窗打断操作。与策划讨论后，双方确认保留。</p>
        </div>
        <figure class="case-flow-card case-feature-evidence">${renderShot(coach.title, coach.flows[1][0], coach.flows[1][1], 'case-evidence-shot')}<figcaption>对局中的双端操作 · 点击查看完整交互稿</figcaption></figure>
        <div class="secondary-copy">${renderNotes([
          ['测试与上线', '我参与了上线前的实际测试，后续由 QA 跑测，方案现已上线。'],
          ['上线后的使用观察', '同事转述，有玩家让新手坐在教练位，观看有经验的玩家操作。这个意料之外的用法提示：教练位也可以成为观看学习的位置。']
        ])}</div>
        ${renderDetails('查看邀请、加入与退出流程', renderGallery(coach.title, [coach.flows[0], coach.flows[2]]))}
      </article>
      <article id="champion" class="case-brief">
        <div class="secondary-copy"><p class="feature-kicker">夺冠对战</p><h3>让一次夺冠，变成可以再次使用的阵容</h3>
          <p>${feature.deck}</p>
          <p class="secondary-decision"><span>我的处理</span>${feature.systemDecision}</p>
        </div>
        <figure class="case-flow-card case-feature-evidence">${renderShot('夺冠对战', '解锁、入口与首次收藏', feature.flows[0].src, 'case-evidence-shot')}<figcaption>解锁、入口与首次收藏 · 点击查看完整交互稿</figcaption></figure>
        ${renderDetails('查看替换、挑战与结算流程', renderGallery('夺冠对战', feature.flows.slice(1).map(flow => [flow.title, flow.src])))}
      </article>
    </div>
    <section class="case-other" aria-labelledby="other-systems"><h2 id="other-systems">其他系统设计</h2><p>更多信息组织与状态设计，按需展开查看。</p>
      <div class="case-other-list">${others.map(section => `<details class="case-other-item"><summary>
        <img src="${section.flows[0][1]}" alt="" loading="lazy">
        <span class="case-other-copy"><strong>${section.title}</strong><span>${summaries[section.title]}</span></span><span class="case-expand-label" aria-hidden="true"></span>
      </summary><div class="case-disclosure-body"><div class="secondary-copy"><p class="secondary-decision"><span>设计处理</span>${section.decision}</p></div>${renderGallery(section.title, section.flows)}</div></details>`).join('')}</div>
    </section>
    <section class="case-closing" aria-label="案例说明"><p>以上是我在项目中的部分工作，重点呈现具体问题、设计判断与交互证据。</p></section>
  </section>`;
};
const renderKoalaCase = () => `<section class="feature-case koala-case">
  <header class="feature-intro"><p class="feature-kicker">DIY 绘图工具</p><h2>让玩家不用先学会工具，也能开始画</h2><p>DIY 图案可以应用到服装、家具和地面。这个优化从玩家开始创作时的阻碍出发，重新组织画布、工具和输入方式之间的关系。</p></header>
  <div class="case-question"><span>设计输入</span><p>我获得了团队提供的部分 CE 测试结论，用于理解“进入后不知道如何开始”“工具难找”等问题；测试由其他成员开展，我没有参与测试执行。</p></div>
  <section class="case-secondary case-systems">
    <header><p class="feature-kicker">方案与原型</p><h2>把操作规则做成可以直接演示的交互</h2></header>
    <div class="case-secondary-list">
      <article>
        <div class="secondary-copy"><p class="feature-kicker">开始绘制</p><h3>默认给出第一步，不让画布从空白开始</h3><p>旧方案需要先选择工具，绘制操作才会出现。新方案默认选中画笔，并增加直接触控绘制，让玩家先做出第一笔，再逐步理解更完整的功能。</p><p class="secondary-decision"><span>我的处理</span>画布在横屏中占据主要区域；颜色在需要时展开，避免常驻控件压缩创作空间。</p></div>
        <figure class="case-flow-card case-feature-evidence">${renderShot('DIY 绘图工具', '触控开始与颜色选择', 'assets/cases/club-koala/demo-entry.jpg', 'case-evidence-shot')}<figcaption>触控开始与颜色选择 · 点击放大查看</figcaption></figure>
        ${renderDetails('查看原型中的画布与颜色变化', renderGallery('DIY 绘图工具', [['进入绘图画布', 'assets/cases/club-koala/demo-entry.jpg'], ['展开色板', 'assets/cases/club-koala/demo-colors.jpg'], ['选色后继续绘制', 'assets/cases/club-koala/demo-canvas.jpg']]))}
      </article>
      <article>
        <div class="secondary-copy"><p class="feature-kicker">绘画方式</p><h3>两种输入方式，共用一套创作任务</h3><p>触控模式下，单指可以点击或滑动绘制；光标模式下，单指移动光标，再通过填色按钮绘制，也可以长按按钮配合滑动连续绘制。</p><p class="secondary-decision"><span>设计判断</span>保留点触方式给偏轻度的玩家，同时提供更连续的触控方式，让想快速画的玩家不必被单格操作限制。</p></div>
        <figure class="case-flow-card case-feature-evidence">${renderShot('DIY 绘图工具', '双模式与工具面板', 'assets/cases/club-koala/demo-mode.jpg', 'case-evidence-shot')}<figcaption>双模式与工具面板 · 点击放大查看</figcaption></figure>
      </article>
      <article class="case-brief">
        <div class="secondary-copy"><p class="feature-kicker">编辑中的安全感</p><h3>让不同操作有清楚的边界和回退</h3><p>我补齐了缩放、画布移动、镜像、撤销与重做，以及切换模式、保存、发布和退出的流程。画布移动完成后作为一次操作回退；颜色切换时展示作品全貌并暂停绘制，减少误操作。</p><p class="secondary-decision"><span>交付状态</span>核心交互已在 Figma 原型中还原，并录制了手机操作演示。后因项目解散，方案未正式落地，因此不以效率、评分或完成率描述成果。</p></div>
        <figure class="case-flow-card case-feature-evidence"><video controls playsinline preload="metadata" poster="assets/cases/club-koala/diy-phone-poster.jpg" aria-label="DIY 绘图工具手机操作演示"><source src="assets/cases/club-koala/diy-phone-demo.mp4" type="video/mp4"></video><figcaption>手机操作演示 · 约 14 秒 · 交互原型</figcaption></figure>
      </article>
    </div>
    <section class="case-closing" aria-label="案例说明"><p>以上展示的是我在项目后期完成的优化方案与原型证据，重点呈现具体问题、设计判断和交互细节。</p></section>
  </section>
</section>`;
const featureCase = item.feature ? renderFeatureCase(item.feature) : '';
const koalaCase = item.koalaCase ? renderKoalaCase() : '';

const caseFacts = item.facts.length
  ? `<dl class="case-facts">${item.facts.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`
  : '';
const headerSource = item.source && item.sourcePlacement === 'header'
  ? `<a class="case-header-source" href="${item.source[1]}" target="_blank" rel="noopener noreferrer">${item.source[0]} ↗</a>`
  : '';
const sourceLink = item.source && item.sourcePlacement !== 'header'
  ? `<a class="source-link" href="${item.source[1]}" target="_blank" rel="noopener noreferrer">${item.source[0]} ↗</a>`
  : '';
document.querySelector('#case-content').innerHTML = `<header class="case-header${item.icon ? ' has-icon' : ''}">${item.icon ? `<img class="case-project-icon" src="${item.icon}" alt="">` : ''}<div><h1>${item.title}</h1><p class="case-meta"><span>${item.meta}</span>${headerSource}</p></div><p class="lead">${item.intro}</p></header>${caseFacts}${featureCase}${koalaCase}${item.koalaCase ? '' : standardSections}${sourceLink}`;

if (item.feature || item.koalaCase) {
  const dialog = document.createElement('dialog');
  dialog.className = 'case-lightbox';
  dialog.innerHTML = '<button type="button" class="lightbox-close" aria-label="关闭预览">关闭</button><img alt="">';
  document.body.append(dialog);
  const image = dialog.querySelector('img');

  document.querySelectorAll('.case-shot').forEach((button) => {
    button.addEventListener('click', () => {
      image.src = button.dataset.shot;
      image.alt = button.dataset.alt;
      dialog.showModal();
    });
  });
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}
