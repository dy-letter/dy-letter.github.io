/* 토시이 숲 — 아이 전용 대시보드
   홈 · 토시이 · 쿠폰판 · 기록 · 준비물
   순수 HTML/CSS/JS · 외부 요청 없음 · localStorage 자동 저장 */
(function () {
  'use strict';

  var KEY = 'toshii.forest.v1';
  var AGE = 10;

  var LEVELS = [
    { min: 0,  name: '아기 토시이',   emoji: '🥚' },
    { min: 5,  name: '씩씩 토시이',   emoji: '🐣' },
    { min: 15, name: '튼튼 토시이',   emoji: '🐥' },
    { min: 30, name: '숲지기 토시이', emoji: '🦖' },
    { min: 50, name: '전설 토시이',   emoji: '🌟' }
  ];

  var GROUPS = {
    morning: { name: '아침', icon: '🌅', long: '아침 루틴' },
    evening: { name: '저녁', icon: '🌙', long: '저녁 루틴' }
  };

  var DEFAULT_TODOS = {
    morning: [
      { id: 'm1', icon: '🍳', label: '아침식사' },
      { id: 'm2', icon: '🪥', label: '세안/양치' },
      { id: 'm3', icon: '👕', label: '옷입기' },
      { id: 'm4', icon: '🎒', label: '준비물체크' }
    ],
    evening: [
      { id: 'e1', icon: '🧳', label: '가방정리' },
      { id: 'e2', icon: '🍚', label: '저녁식사' },
      { id: 'e3', icon: '🛁', label: '목욕' },
      { id: 'e4', icon: '📚', label: '공부' },
      { id: 'e5', icon: '🧸', label: '놀기' },
      { id: 'e6', icon: '🌙', label: '잠자기' }
    ]
  };

  var DEFAULT_SCHEDULE = [
    { id: 's1', time: '07:30', icon: '🌞', label: '일어나기' },
    { id: 's2', time: '08:00', icon: '🍳', label: '아침 먹기' },
    { id: 's3', time: '16:30', icon: '🎒', label: '숙제' },
    { id: 's4', time: '19:00', icon: '🛁', label: '목욕' },
    { id: 's5', time: '19:30', icon: '📚', label: '공부 (영어·수학)' },
    { id: 's6', time: '21:00', icon: '🪥', label: '양치' },
    { id: 's7', time: '21:10', icon: '🌙', label: '잠자리' }
  ];

  var FEEDS = ['🍖', '🥕', '🥦', '🍎', '🍇', '🍌'];
  var COUPON_MAX = 30;

  var MESSAGES = [
    '오늘의 미션: 책 10쪽 읽기! 다 하면 토시이한테 먹이를 주자. 🦖',
    '씻고 양치하면 토시이가 폴짝 기뻐해. 하나씩 해 보자!',
    '수학 한 장, 영어 한 장. 끝나면 숲에서 만나자.',
    '정리정돈은 10분이면 충분해. 장난감이 제 집을 찾아갈 수 있게 도와줘!',
    '오늘도 천천히, 하나씩. 선생님이 숲에서 지켜보고 있단다.',
    '잘했어! 스스로 끝낸 일은 절대 사라지지 않아.',
    '9시까지 자면 내일 키가 쑥! 잠자리 준비도 오늘의 미션이다.',
    '먹이를 주면 토시이가 자라. 오늘은 몇 살이 될까?',
    '아침 네 개, 저녁 여섯 개. 다 하면 오늘 하루 완벽!',
    '모르는 건 틀린 게 아니야. 물어보는 게 제일 용감한 거란다.',
    '10칸을 다 채우면 토시이가 맛있는 걸 먹고 쿠폰 도장도 하나 찍혀!'
  ];

  var STICKERS = ['⭐', '💎', '🌈', '🌸', '🍀', '🦋', '🎀', '👑', '🍓', '🍄', '🌙', '☁️', '🍬', '✨', '🕶️', '🎈'];
  var ICONS = ['🍳', '🪥', '👕', '🎒', '🧳', '🍚', '🛁', '📚', '🧸', '🌙', '🧹', '🎨', '🏃', '🎹', '🧩', '💧'];

  /* ---------------- helpers ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function dateKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function minutesOf(hhmm) {
    var p = String(hhmm || '0:0').split(':');
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }
  function minutesNow() {
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  function prettyTime(hhmm) {
    var m = minutesOf(hhmm), h = Math.floor(m / 60), mm = m % 60;
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    if (mm === 0) return h12 + '시';
    if (mm === 30) return h12 + '시 반';
    return h12 + '시 ' + mm + '분';
  }
  function dateLabel(d) {
    d = d || new Date();
    var dow = '일월화수목금토'[d.getDay()];
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + dow + ')';
  }
  function shortDate(d) {
    d = d || new Date();
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  }
  function weekStart(d) {
    d = d || new Date();
    var t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    return t;
  }
  function weekDates() {
    var s = weekStart(), out = [];
    for (var i = 0; i < 7; i++) out.push(new Date(s.getFullYear(), s.getMonth(), s.getDate() + i));
    return out;
  }
  function cloneTodos(src) {
    return {
      morning: src.morning.map(function (t) { return { id: t.id, icon: t.icon, label: t.label }; }),
      evening: src.evening.map(function (t) { return { id: t.id, icon: t.icon, label: t.label }; })
    };
  }

  /* ---------------- state ---------------- */
  var state = null;

  function freshSupplies() {
    return {
      date: '',
      today: [
        { id: uid('p'), text: '물통', done: false },
        { id: uid('p'), text: '알림장', done: false }
      ],
      tomorrow: []
    };
  }

  function fresh() {
    return {
      version: 3,
      todos: cloneTodos(DEFAULT_TODOS),
      daily: { date: '', done: [] },
      history: {},
      heroGroup: 'auto',
      heroGroupDate: '',
      rewardDate: '',
      feeds: 0,
      growth: 0,
      coupon: { filled: 0, completed: 0 },
      supplies: freshSupplies(),
      schedule: DEFAULT_SCHEDULE.map(function (s) { return { id: s.id, time: s.time, icon: s.icon, label: s.label }; }),
      messageIndex: Math.floor(Math.random() * MESSAGES.length),
      customMessage: '',
      charImage: '',
      stickers: [],
      sound: true,
      seen: false
    };
  }

  function load() {
    var base = fresh();
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return base;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return base;
      Object.keys(base).forEach(function (k) {
        if (saved[k] === undefined || saved[k] === null) return;
        base[k] = saved[k];
      });
      if (!base.todos || Array.isArray(base.todos) || !Array.isArray(base.todos.morning) || !Array.isArray(base.todos.evening)) {
        base.todos = cloneTodos(DEFAULT_TODOS);
      }
      if (!Array.isArray(base.schedule) || !base.schedule.length) base.schedule = fresh().schedule;
      if (!base.daily || !Array.isArray(base.daily.done)) base.daily = { date: '', done: [] };
      if (!Array.isArray(base.stickers)) base.stickers = [];
      if (!base.history || typeof base.history !== 'object' || Array.isArray(base.history)) base.history = {};
      if (!base.coupon || typeof base.coupon !== 'object') {
        var legacy = saved.stamps && typeof saved.stamps === 'object' ? Object.keys(saved.stamps).length : 0;
        base.coupon = { filled: Math.min(COUPON_MAX - 1, legacy), completed: 0 };
      }
      base.coupon.filled = clamp(parseInt(base.coupon.filled, 10) || 0, 0, COUPON_MAX);
      base.coupon.completed = Math.max(0, parseInt(base.coupon.completed, 10) || 0);
      if (!base.supplies || typeof base.supplies !== 'object' || !Array.isArray(base.supplies.today)) {
        base.supplies = freshSupplies();
      }
      if (!Array.isArray(base.supplies.tomorrow)) base.supplies.tomorrow = [];
      return base;
    } catch (e) {
      return base;
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      toast('저장 공간이 부족해요. 그림을 조금 작게 올려 주세요.');
      return false;
    }
  }

  function rollDay() {
    var changed = false;
    var today = dateKey();
    if (state.daily.date !== today) {
      if (state.daily.date && state.daily.done.length) {
        state.history[state.daily.date] = state.daily.done.length;
      }
      state.daily = { date: today, done: [] };
      state.heroGroup = 'auto';
      state.heroGroupDate = '';
      changed = true;
    }
    // 준비물: 내일 → 오늘로 넘기기
    if (state.supplies.date !== today) {
      if (state.supplies.date) {
        state.supplies.today = (state.supplies.tomorrow || []).map(function (x) {
          return { id: uid('p'), text: x.text, done: false };
        });
        state.supplies.tomorrow = [];
      }
      state.supplies.date = today;
      changed = true;
    }
    if (changed) {
      state.history[today] = state.daily.done.length;
    }
    return changed;
  }

  /* ---------------- sound ---------------- */
  var actx = null;
  function tone(freq, start, dur, type, gain) {
    if (!actx) return;
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, actx.currentTime + start);
    g.gain.setValueAtTime(0.0001, actx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, actx.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + start + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(actx.currentTime + start);
    o.stop(actx.currentTime + start + dur + 0.02);
  }
  function sound(kind) {
    if (!state || !state.sound) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) actx = new AC();
      if (actx.state === 'suspended' && actx.resume) actx.resume();
      if (kind === 'pop') { tone(660, 0, 0.10, 'sine', 0.10); tone(990, 0.07, 0.10, 'sine', 0.07); }
      else if (kind === 'done') { tone(523, 0, 0.12, 'triangle', 0.10); tone(784, 0.1, 0.14, 'triangle', 0.09); }
      else if (kind === 'win') { tone(523, 0, 0.12, 'triangle', 0.1); tone(659, 0.12, 0.12, 'triangle', 0.1); tone(784, 0.24, 0.16, 'triangle', 0.1); tone(1046, 0.4, 0.24, 'sine', 0.08); }
      else if (kind === 'nope') { tone(300, 0, 0.12, 'square', 0.05); tone(220, 0.1, 0.16, 'square', 0.05); }
    } catch (e) { /* 소리는 없어도 괜찮아요 */ }
  }

  /* ---------------- toast / fx ---------------- */
  var toastEl, toastTimer = null;
  function toast(msg) {
    if (!toastEl) toastEl = $('#toast');
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(function () { toastEl.classList.add('show'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
      setTimeout(function () { toastEl.hidden = true; }, 220);
    }, 2600);
  }

  function floatFx(glyph, className) {
    var layer = $('#fx-layer');
    if (!layer) return;
    var el = document.createElement('span');
    el.className = className || 'fx-heart';
    el.textContent = glyph;
    el.style.marginLeft = (Math.random() * 40 - 20) + 'px';
    layer.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1150);
  }

  function celebrate() {
    var layer = $('#celebrate-layer');
    if (!layer) return;
    var glyphs = ['⭐', '🎁', '🌸', '🍀', '✨', '🎉', '🦖'];
    for (var i = 0; i < 20; i++) {
      var s = document.createElement('span');
      s.className = 'confetti';
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = (Math.random() * 96) + '%';
      s.style.animationDuration = (1.8 + Math.random() * 1.6) + 's';
      s.style.animationDelay = (Math.random() * 0.5) + 's';
      s.style.fontSize = (16 + Math.random() * 14) + 'px';
      layer.appendChild(s);
      (function (node) { setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 4200); })(s);
    }
  }

  /* ---------------- todos model ---------------- */
  function groupTodos(g) { return (state.todos && state.todos[g]) ? state.todos[g] : []; }
  function allTodoList() { return groupTodos('morning').concat(groupTodos('evening')); }
  function totalTodos() { return allTodoList().length; }
  function doneCount() { return state.daily.done ? state.daily.done.length : 0; }
  function isDone(id) { return state.daily.done.indexOf(id) >= 0; }
  function allDone() { return totalTodos() > 0 && doneCount() >= totalTodos(); }
  function findTodo(id) {
    var list = allTodoList();
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
    return null;
  }
  function groupOf(id) {
    var m = groupTodos('morning');
    for (var i = 0; i < m.length; i++) { if (m[i].id === id) return 'morning'; }
    return 'evening';
  }
  function groupDone(g) {
    var n = 0;
    groupTodos(g).forEach(function (t) { if (isDone(t.id)) n++; });
    return n;
  }
  function heroGroup() {
    var today = dateKey();
    if (state.heroGroupDate === today && (state.heroGroup === 'morning' || state.heroGroup === 'evening')) {
      return state.heroGroup;
    }
    return new Date().getHours() < 12 ? 'morning' : 'evening';
  }
  function flipHeroGroup() {
    var next = heroGroup() === 'morning' ? 'evening' : 'morning';
    state.heroGroup = next;
    state.heroGroupDate = dateKey();
    save();
    renderHero();
    sound('pop');
    toast(GROUPS[next].long + '으로 바꿨어요');
  }

  /* ---------------- level ---------------- */
  function levelInfo() {
    var g = state ? state.growth : 0;
    var i = 0;
    for (var k = 0; k < LEVELS.length; k++) { if (g >= LEVELS[k].min) i = k; }
    var lv = LEVELS[i], next = LEVELS[i + 1] || null;
    var pct = next ? clamp(((g - lv.min) / (next.min - lv.min)) * 100, 0, 100) : 100;
    return { i: i, name: lv.name, emoji: lv.emoji, min: lv.min, next: next, toNext: next ? next.min - g : 0, pct: pct };
  }
  function charSrc() { return (state && state.charImage) ? state.charImage : 'assets/toshii-default.png'; }

  /* ---------------- render: home ---------------- */
  function renderClock() {
    var d = new Date();
    var c = $('#clock');
    if (c) c.textContent = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    var nt = $('#now-time');
    if (nt) nt.textContent = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    var td = $('#today-date');
    if (td) td.textContent = dateLabel(d);
  }

  function nextSchedule() {
    var now = minutesNow();
    var sorted = state.schedule.slice().sort(function (a, b) { return minutesOf(a.time) - minutesOf(b.time); });
    for (var i = 0; i < sorted.length; i++) {
      if (minutesOf(sorted[i].time) > now) return sorted[i];
    }
    return null;
  }

  function renderHint() {
    var el = $('#next-hint');
    if (!el) return;
    var n = nextSchedule();
    if (n) el.textContent = prettyTime(n.time) + ' ' + n.label + ' 시간';
    else if (state.schedule.length) el.textContent = '오늘 일정은 다 끝났어요';
    else el.textContent = '시간표를 만들어 보자';
  }

  function renderHero() {
    renderClock();
    renderHint();

    var g = heroGroup();
    var items = groupTodos(g);
    var col = $('#todos-col');
    if (col) col.setAttribute('data-count', items.length);

    var toggle = $('#btn-group');
    if (toggle) {
      toggle.setAttribute('aria-label', GROUPS[g].long + ' ' + items.length + '개 중 ' + groupDone(g) + '개 완료. 눌러서 다른 루틴 보기');
    }
    var gi = $('#group-ico'); if (gi) gi.textContent = GROUPS[g].icon;
    var gn = $('#group-name'); if (gn) gn.textContent = GROUPS[g].name;
    var gc = $('#group-count'); if (gc) gc.textContent = groupDone(g) + '/' + items.length;

    var todosBox = $('#hero-todos');
    if (todosBox) {
      todosBox.innerHTML = items.map(function (t) {
        var on = isDone(t.id);
        return '<button class="todo-orb-btn" data-todo="' + esc(t.id) + '" aria-pressed="' + on + '" aria-label="' + esc(t.label) + (on ? ' 끝냄' : ' 하기') + '">' +
          '<span class="todo-orb"><span class="orb-ico">' + esc(t.icon) + '</span><span class="orb-txt">' + esc(t.label) + '</span></span>' +
          '</button>';
      }).join('');
    }

    var img = $('#hero-char');
    if (img && img.getAttribute('src') !== charSrc()) img.setAttribute('src', charSrc());
    var menuImg = $('.menu-face img');
    if (menuImg) menuImg.setAttribute('src', charSrc());

    var nb = $('#hero-name');
    if (nb) nb.innerHTML = '토시이<span class="age">· ' + AGE + '살</span>';
    var bl = $('#badge-level'); if (bl) bl.textContent = 'Lv.' + (levelInfo().i + 1);
    var bg = $('#badge-growth'); if (bg) bg.textContent = '먹이 ' + state.growth;

    var gauge = $('#day-gauge');
    if (gauge) {
      var n = doneCount(), segs = '';
      var max = Math.max(10, totalTodos());
      for (var gi2 = 0; gi2 < max; gi2++) segs += '<span class="gauge-seg' + (gi2 < n ? ' on' : '') + '"></span>';
      gauge.innerHTML = segs;
      gauge.setAttribute('aria-valuenow', n);
      gauge.setAttribute('aria-valuemax', max);
      var gcount = $('#gauge-count'); if (gcount) gcount.textContent = n + '/' + totalTodos();
    }

    var fb = $('#feed-badge'); if (fb) fb.textContent = state.feeds;
    var feedBtn = $('#btn-feed');
    if (feedBtn) feedBtn.setAttribute('aria-label', '토시이에게 먹이 주기, 남은 먹이 ' + state.feeds + '개');

    var dt = $('#dino-text');
    if (dt) dt.textContent = state.customMessage || MESSAGES[state.messageIndex % MESSAGES.length];

    renderPlacedStickers();
  }

  /* ---------------- render: todo editor ---------------- */
  function taskRow(t, on) {
    return '<div class="task-row' + (on ? ' done' : '') + '">' +
      '<button class="task-main" data-todo="' + esc(t.id) + '" aria-pressed="' + on + '">' +
        '<span class="task-orb">' + esc(t.icon) + '</span>' +
        '<span class="task-label"><b>' + esc(t.label) + '</b><span>' + (on ? '끝! 먹이 1개 받았어' : '누르면 끝!') + '</span></span>' +
      '</button>' +
      '<button class="edit-btn" data-edit="' + esc(t.id) + '" aria-label="' + esc(t.label) + ' 고치기">✎</button>' +
    '</div>';
  }

  function renderTodo() {
    var list = $('#todo-list');
    if (list) {
      var html = '';
      ['morning', 'evening'].forEach(function (g) {
        var items = groupTodos(g);
        html += '<div class="routine-block">' +
          '<div class="routine-head"><span class="routine-name">' + GROUPS[g].icon + ' ' + GROUPS[g].long + '</span>' +
          '<span class="routine-count">' + groupDone(g) + '/' + items.length + '</span></div>' +
          '<div class="task-list">' + items.map(function (t) { return taskRow(t, isDone(t.id)); }).join('') + '</div>' +
          '</div>';
      });
      list.innerHTML = html;
    }
    var pct = totalTodos() ? (doneCount() / totalTodos()) * 100 : 0;
    var fill = $('#progress-fill'); if (fill) fill.style.width = pct + '%';
    var pl = $('#progress-label'); if (pl) pl.textContent = '오늘 ' + doneCount() + '개 끝냈어요';
    var pf = $('#progress-feeds'); if (pf) pf.textContent = '먹이 ' + state.feeds + '개 있어요';
    var tc = $('#todo-count'); if (tc) tc.textContent = doneCount() + '/' + totalTodos();
    var ts = $('#todo-sub');
    if (ts) ts.textContent = allDone() ? '오늘 목표 달성! 쿠폰 도장도 확인해 봐 🎟️' : '아침 4개 · 저녁 6개, 끝낼 때마다 먹이 1개!';
  }

  /* ---------------- render: coupon ---------------- */
  function renderCoupon() {
    var filled = clamp(state.coupon.filled, 0, COUPON_MAX);
    var grid = $('#coupon-grid');
    if (grid) {
      var h = '';
      for (var i = 0; i < COUPON_MAX; i++) {
        var on = i < filled;
        h += '<div class="coupon-cell' + (on ? ' on' : '') + (on && i === filled - 1 ? ' pop' : '') + '">' +
          (on ? '🐾' : (i + 1)) + '</div>';
      }
      grid.innerHTML = h;
    }
    var cc = $('#coupon-count'); if (cc) cc.textContent = filled + '/' + COUPON_MAX;
    var cd = $('#coupon-done'); if (cd) cd.textContent = '지금까지 ' + state.coupon.completed + '판 완성';
    var desc = $('#coupon-desc');
    if (desc) desc.textContent = filled >= COUPON_MAX ? '다 모았어요! 선물을 받아요' : (COUPON_MAX - filled) + '개 더 모으면 작은 선물!';
    var gift = $('#gift-card');
    if (gift) gift.hidden = filled < COUPON_MAX;
    var card = $('#coupon-card');
    if (card) card.classList.toggle('full', filled >= COUPON_MAX);
  }

  /* ---------------- render: record ---------------- */
  function historyCount(keys) {
    var n = 0;
    keys.forEach(function (k) { n += (parseInt(state.history[k], 10) || 0); });
    return n;
  }
  function renderRecord() {
    var weekKeys = weekDates().map(function (d) { return dateKey(d); });
    var week = historyCount(weekKeys);
    var today = new Date();
    var monthKeys = [];
    for (var d = 1; d <= new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(); d++) {
      monthKeys.push(today.getFullYear() + '-' + pad2(today.getMonth() + 1) + '-' + pad2(d));
    }
    var month = historyCount(monthKeys);

    var wn = $('#week-num'); if (wn) wn.textContent = week;
    var mn = $('#month-num'); if (mn) mn.textContent = month;
    var rt = $('#record-today'); if (rt) rt.textContent = '오늘 ' + doneCount() + '개';

    var wk = $('#week-note');
    if (wk) wk.textContent = week === 0 ? '이번 주도 하나씩 해 보자!' : (week >= 30 ? '이번 주 최고! 정말 잘했어' : '이번 주도 잘 가고 있어요');

    var dots = $('#week-dots');
    if (dots) {
      dots.innerHTML = weekKeys.map(function (k) {
        return '<i class="' + ((parseInt(state.history[k], 10) || 0) > 0 ? 'on' : '') + '"></i>';
      }).join('');
    }

    var fill = $('#month-fill');
    if (fill) {
      var days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      fill.style.width = clamp((month / (days * totalTodos())) * 100, 0, 100) + '%';
    }
    var mnote = $('#month-note');
    if (mnote) mnote.textContent = month === 0 ? '이번 달 첫 체크를 기다리는 중' : (month + '개나 해냈어요!');

    var bestKey = '', bestVal = 0;
    Object.keys(state.history).forEach(function (k) {
      var v = parseInt(state.history[k], 10) || 0;
      if (v > bestVal) { bestVal = v; bestKey = k; }
    });
    var bt = $('#best-title'); if (bt) bt.textContent = '가장 많이 한 날';
    var bd = $('#best-desc');
    if (bd) {
      if (bestKey) {
        var p = bestKey.split('-');
        bd.textContent = (parseInt(p[1], 10)) + '월 ' + (parseInt(p[2], 10)) + '일 · ' + bestVal + '개';
      } else {
        bd.textContent = '아직 기록이 없어요';
      }
    }
  }

  /* ---------------- render: supplies ---------------- */
  function supplyList(list, which) {
    if (!list.length) return '<p class="supply-empty">아직 없어요. 아래 버튼으로 추가해 보세요.</p>';
    return list.map(function (it) {
      return '<div class="supply-item' + (it.done ? ' done' : '') + '">' +
        '<button class="supply-check" data-supply="' + which + '" data-sid="' + esc(it.id) + '" aria-pressed="' + !!it.done + '" aria-label="' + esc(it.text) + (it.done ? ' 체크 해제' : ' 체크') + '">✓</button>' +
        '<span class="supply-text">' + esc(it.text) + '</span>' +
        '<button class="supply-del" data-supply-del="' + which + '" data-sid="' + esc(it.id) + '" aria-label="' + esc(it.text) + ' 지우기">✕</button>' +
      '</div>';
    }).join('');
  }

  function renderSupplies() {
    var s = state.supplies;
    var t = $('#supply-today');
    if (t) t.innerHTML = supplyList(s.today, 'today');
    var tm = $('#supply-tomorrow');
    if (tm) tm.innerHTML = supplyList(s.tomorrow, 'tomorrow');

    var now = new Date();
    var tmr = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    var sd = $('#supply-today-date'); if (sd) sd.textContent = shortDate(now);
    var sd2 = $('#supply-tomorrow-date'); if (sd2) sd2.textContent = shortDate(tmr);

    var done = s.today.filter(function (x) { return x.done; }).length;
    var sc = $('#supply-count'); if (sc) sc.textContent = done + '/' + s.today.length;
  }

  /* ---------------- render: toshi ---------------- */
  function renderPlacedStickers() {
    var positions = state.stickers || [];
    ['#hero-stickers', '#deco-stickers'].forEach(function (sel) {
      var layer = $(sel);
      if (!layer) return;
      layer.innerHTML = '';
      positions.forEach(function (s) {
        var el = document.createElement('span');
        el.className = 'sticker';
        el.textContent = s.emoji;
        el.style.left = s.x + '%';
        el.style.top = s.y + '%';
        if (sel === '#deco-stickers') {
          el.setAttribute('role', 'button');
          el.setAttribute('aria-label', s.emoji + ' 스티커 떼기');
          el.dataset.sticker = s.id;
        } else {
          el.style.pointerEvents = 'none';
        }
        layer.appendChild(el);
      });
    });
  }

  function renderToshi() {
    var img = $('#deco-img');
    if (img && img.getAttribute('src') !== charSrc()) img.setAttribute('src', charSrc());
    var lv = levelInfo();
    var dl = $('#deco-level'); if (dl) dl.textContent = 'Lv.' + (lv.i + 1) + ' ' + lv.name;
    var de = $('#deco-eaten'); if (de) de.textContent = '지금까지 먹은 먹이 ' + state.growth + '개';
    var df = $('#deco-fill'); if (df) df.style.width = lv.pct + '%';
    var dn = $('#deco-next');
    if (dn) dn.textContent = lv.next ? ('다음 성장까지 먹이 ' + lv.toNext + '개') : '마지막 단계까지 왔어요!';
    var top = $('#toshi-level-top'); if (top) top.textContent = 'Lv.' + (lv.i + 1);

    var shelf = $('#deco-shelf');
    if (shelf) {
      shelf.innerHTML = STICKERS.map(function (em) {
        return '<button class="sticker-pick" data-sticker-add="' + em + '" aria-label="' + em + ' 스티커 붙이기">' + em + '</button>';
      }).join('');
    }
    var book = $('#book-grid');
    if (book) {
      book.innerHTML = LEVELS.map(function (lv2) {
        var unlocked = state.growth >= lv2.min;
        return '<div class="book-card' + (unlocked ? '' : ' locked') + '">' +
          '<span class="book-emoji">' + (unlocked ? lv2.emoji : '🔒') + '</span>' +
          '<span class="book-name">' + lv2.name + '</span>' +
          '<span class="book-req">먹이 ' + lv2.min + '개</span>' +
          '</div>';
      }).join('');
    }
    renderPlacedStickers();
  }

  /* ---------------- render: schedule ---------------- */
  function sortedSchedule() {
    return state.schedule.slice().sort(function (a, b) { return minutesOf(a.time) - minutesOf(b.time); });
  }

  function renderCountdown() {
    var now = minutesNow();
    var sorted = sortedSchedule();
    var next = null;
    for (var i = 0; i < sorted.length; i++) {
      if (minutesOf(sorted[i].time) > now) { next = sorted[i]; break; }
    }
    var label = $('#cd-label'), main = $('#cd-main'), sub = $('#cd-sub'), fill = $('#cd-fill');
    if (!label) return;
    if (next) {
      label.textContent = '다음 일정';
      var remain = minutesOf(next.time) - now;
      var hh = Math.floor(remain / 60), mm = remain % 60;
      if (main) main.textContent = hh >= 1 ? (hh + '시간 ' + (mm ? mm + '분' : '') + ' 남음') : (mm + '분 남음');
      if (sub) sub.textContent = prettyTime(next.time) + ' · ' + next.icon + ' ' + next.label;
      var first = sorted.length ? minutesOf(sorted[0].time) : 0;
      var last = sorted.length ? minutesOf(sorted[sorted.length - 1].time) : 1;
      var pct = last > first ? clamp(((now - first) / (last - first)) * 100, 0, 100) : 0;
      if (fill) fill.style.width = pct + '%';
    } else {
      label.textContent = '오늘 일정';
      if (main) main.textContent = sorted.length ? '오늘 일정 끝!' : '일정이 없어요';
      if (sub) sub.textContent = sorted.length ? '내일 다시 만나요 🌙' : '＋ 로 일정을 추가해 보세요';
      if (fill) fill.style.width = sorted.length ? '100%' : '0%';
    }
  }

  function renderSchedule() {
    renderCountdown();
    var list = $('#sched-list');
    if (!list) return;
    var now = minutesNow();
    var sorted = sortedSchedule();
    var nextId = null;
    for (var i = 0; i < sorted.length; i++) {
      if (minutesOf(sorted[i].time) > now) { nextId = sorted[i].id; break; }
    }
    var h = '';
    sorted.forEach(function (s) {
      var isPast = minutesOf(s.time) < now;
      var isNext = s.id === nextId;
      h += '<div class="sched-row' + (isPast ? ' past' : '') + (isNext ? ' now' : '') + '" data-sched="' + esc(s.id) + '" role="button" tabindex="0">' +
        '<span class="sched-time">' + esc(s.time) + '</span>' +
        '<span class="sched-ico">' + esc(s.icon) + '</span>' +
        '<span class="sched-label">' + esc(s.label) + '</span>' +
        (isNext ? '<span class="sched-tag">다음</span>' : '') +
        '<button class="sched-del" data-del="' + esc(s.id) + '" aria-label="' + esc(s.label) + ' 지우기">✕</button>' +
        '</div>';
    });
    if (!sorted.length) h = '<p class="hint-line">아직 시간표가 없어요. 아래 버튼으로 하나씩 추가해 보세요.</p>';
    list.innerHTML = h;
    var ss = $('#sched-sub');
    if (ss) ss.textContent = nextId ? '홈에 ‘다음 일정’으로 보여요' : '오늘 일정을 다 마쳤어요';
  }

  function renderAll() {
    renderClock();
    renderHero();
    renderTodo();
    renderCoupon();
    renderRecord();
    renderSupplies();
    renderToshi();
    renderSchedule();
  }

  /* ---------------- reward ---------------- */
  function spawnSpark(stage) {
    var s = document.createElement('span');
    s.className = 'fx-spark';
    s.textContent = ['✨', '💛', '⭐', '💫'][Math.floor(Math.random() * 4)];
    s.style.left = (30 + Math.random() * 40) + '%';
    s.style.top = (18 + Math.random() * 50) + '%';
    s.style.animationDelay = (Math.random() * 0.25) + 's';
    stage.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 1300);
  }

  function celebrateDay(feedEmoji) {
    var gauge = $('#day-gauge');
    if (gauge) {
      gauge.classList.remove('sparkle');
      void gauge.offsetWidth;
      gauge.classList.add('sparkle');
      setTimeout(function () { gauge.classList.remove('sparkle'); }, 2600);
    }
    var stage = $('#char-stage');
    if (!stage) return;
    var feed = document.createElement('span');
    feed.className = 'feed-fly';
    feed.textContent = feedEmoji;
    stage.appendChild(feed);
    sound('pop');
    setTimeout(function () {
      if (feed.parentNode) feed.parentNode.removeChild(feed);
      var img = $('#hero-char');
      if (img) {
        img.classList.remove('eating');
        void img.offsetWidth;
        img.classList.add('eating');
        setTimeout(function () { img.classList.remove('eating'); }, 1600);
      }
      var word = document.createElement('span');
      word.className = 'fx-eat';
      word.textContent = '냠냠!';
      stage.appendChild(word);
      setTimeout(function () { if (word.parentNode) word.parentNode.removeChild(word); }, 1800);
      for (var i = 0; i < 8; i++) spawnSpark(stage);
      floatFx('💛', 'fx-heart');
      sound('win');
    }, 880);
  }

  function grantDayReward() {
    var today = dateKey();
    if (state.rewardDate === today) {
      toast('오늘 할 일 10개를 모두 끝냈어요! 보상은 이미 받았어요');
      return;
    }
    var before = levelInfo().i;
    var feedEmoji = FEEDS[Math.floor(Math.random() * FEEDS.length)];
    state.rewardDate = today;
    state.growth += 1;
    var couponBefore = state.coupon.filled;
    state.coupon.filled = clamp(state.coupon.filled + 1, 0, COUPON_MAX);
    var after = levelInfo();
    save();
    renderAll();
    try {
      document.body.dataset.reward = today;
      document.body.dataset.feed = feedEmoji;
      document.body.dataset.coupon = String(state.coupon.filled);
    } catch (e) {}
    if (current !== 'home') go('home');
    celebrateDay(feedEmoji);

    setTimeout(function () {
      if (state.coupon.filled >= COUPON_MAX && couponBefore < COUPON_MAX) {
        toast('쿠폰판 완성! 🎁 작은 선물을 받을 시간이에요');
        celebrate();
      } else if (after.i > before) {
        toast('10칸 완성! 토시이가 ' + feedEmoji + '를 냠냠 🍽️ Lv.' + (after.i + 1) + ' ' + after.name);
        celebrate();
      } else {
        toast('10칸 완성! 토시이가 ' + feedEmoji + '를 냠냠 먹고 쿠폰 도장 1개 🎟️');
      }
    }, 1450);
  }

  /* ---------------- actions ---------------- */
  function toggleTodo(id) {
    var t = findTodo(id);
    if (!t) return;
    rollDay();
    var idx = state.daily.done.indexOf(id);
    if (idx >= 0) {
      state.daily.done.splice(idx, 1);
      state.feeds = Math.max(0, state.feeds - 1);
      toast('‘' + t.label + '’를 다시 할 일로 돌렸어요. 먹이 1개를 돌려놨어요.');
      sound('nope');
    } else {
      state.daily.done.push(id);
      state.feeds += 1;
      toast('‘' + t.label + '’ 끝! 먹이 1개를 받았어요 🍖');
      floatFx('+🍖', 'fx-plus');
      sound('done');
      if (allDone()) {
        setTimeout(grantDayReward, 260);
      } else {
        var gid = groupOf(id);
        if (groupDone(gid) === groupTodos(gid).length) {
          setTimeout(function () {
            toast(GROUPS[gid].long + ' 완료! ' + (gid === 'morning' ? '이제 저녁 루틴도 준비하자' : '오늘 하루 끝!'));
          }, 500);
        }
      }
    }
    state.history[state.daily.date] = state.daily.done.length;
    save();
    renderAll();
  }

  function feed() {
    if (state.feeds <= 0) {
      toast('먹이가 없어요. 할 일을 하나 끝내면 먹이 1개를 받아요!');
      sound('nope');
      return;
    }
    var before = levelInfo().i;
    state.feeds -= 1;
    state.growth += 1;
    var after = levelInfo();
    save();
    renderAll();
    var img = $('#hero-char');
    if (img) {
      img.classList.remove('bounce');
      void img.offsetWidth;
      img.classList.add('bounce');
    }
    floatFx('💛', 'fx-heart');
    setTimeout(function () { floatFx('🍖', 'fx-heart'); }, 180);
    sound('pop');
    if (after.i > before) {
      setTimeout(function () {
        toast('토시이가 자랐어요! Lv.' + (after.i + 1) + ' ' + after.name + ' 🎉');
        celebrate();
        sound('win');
      }, 420);
    } else {
      toast('냠냠! 먹이 ' + state.growth + '개째 · 다음 성장까지 ' + after.toNext + '개');
    }
  }

  function startNewCoupon() {
    if (state.coupon.filled < COUPON_MAX) { toast('아직 30개를 다 모으지 않았어요'); return; }
    openConfirm({
      title: '새 쿠폰판 시작',
      text: '완성한 쿠폰판을 접고 새 쿠폰판을 펼칠까요? 완성한 판은 기록에 남아요.',
      okText: '새로 시작',
      onOk: function () {
        state.coupon.completed += 1;
        state.coupon.filled = 0;
        save();
        renderAll();
        celebrate();
        sound('win');
        toast('새 쿠폰판 시작! 첫 도장을 기다리고 있어요 🎟️');
      }
    });
  }

  function addSticker(emoji) {
    state.stickers.push({
      id: uid('st'),
      emoji: emoji,
      x: Math.round(12 + Math.random() * 70),
      y: Math.round(12 + Math.random() * 62)
    });
    if (state.stickers.length > 24) state.stickers.shift();
    save();
    renderToshi();
    renderHero();
    sound('pop');
    toast(emoji + ' 스티커를 붙였어요!');
  }

  function removeSticker(id) {
    var i = -1;
    state.stickers.forEach(function (s, k) { if (s.id === id) i = k; });
    if (i < 0) return;
    state.stickers.splice(i, 1);
    save();
    renderToshi();
    renderHero();
    toast('스티커를 뗐어요');
  }

  function toggleSupply(which, id) {
    var list = state.supplies[which] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { list[i].done = !list[i].done; break; }
    }
    save();
    renderSupplies();
    sound('pop');
  }

  function removeSupply(which, id) {
    state.supplies[which] = (state.supplies[which] || []).filter(function (x) { return x.id !== id; });
    save();
    renderSupplies();
    toast('준비물에서 지웠어요');
  }

  function addSupply(which) {
    openForm({
      title: which === 'today' ? '오늘 준비물 추가' : '내일 준비물 추가',
      fields: [{
        key: 'text', label: '무엇을 챙길까?', type: 'text', value: '',
        maxlength: 20, placeholder: '예: 물통, 체육복, 우산'
      }],
      submitText: '추가',
      onSubmit: function (v) {
        var text = String(v.text || '').trim().slice(0, 20);
        if (!text) { toast('준비물 이름을 적어 주세요'); return false; }
        state.supplies[which].push({ id: uid('p'), text: text, done: false });
        save();
        renderSupplies();
        toast('‘' + text + '’ 준비물에 추가했어요');
      }
    });
  }

  /* ---------------- dialogs ---------------- */
  var dialogSubmit = null;
  var dialogOverlay, dialogTitle, dialogFields;

  function closeDialog() {
    if (!dialogOverlay) return;
    dialogOverlay.hidden = true;
    dialogSubmit = null;
    dialogFields.innerHTML = '';
  }

  function openForm(opt) {
    dialogOverlay = dialogOverlay || $('#dialog-overlay');
    dialogTitle = dialogTitle || $('#dialog-title');
    dialogFields = dialogFields || $('#dialog-fields');
    var saveBtn = $('#btn-dialog-save');

    dialogTitle.textContent = opt.title || '고치기';
    saveBtn.textContent = opt.submitText || '저장';
    saveBtn.classList.toggle('danger', !!opt.danger);
    dialogFields.innerHTML = '';

    (opt.fields || []).forEach(function (f) {
      var wrap = document.createElement('div');
      wrap.className = 'field';
      var id = 'f_' + f.key;
      var label = document.createElement('label');
      label.setAttribute('for', id);
      label.textContent = f.label || '';
      wrap.appendChild(label);

      var input;
      if (f.type === 'textarea') { input = document.createElement('textarea'); input.rows = 3; }
      else { input = document.createElement('input'); input.type = f.type || 'text'; }
      input.id = id;
      input.name = f.key;
      input.value = f.value == null ? '' : f.value;
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.maxlength) input.maxLength = f.maxlength;
      if (f.type === 'emoji') { input.maxLength = 4; }
      wrap.appendChild(input);

      if (f.hints && f.hints.length) {
        var box = document.createElement('div');
        box.className = 'emoji-hints';
        f.hints.forEach(function (em) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'emoji-hint';
          b.textContent = em;
          b.addEventListener('click', function () { input.value = em; });
          box.appendChild(b);
        });
        wrap.appendChild(box);
      }
      if (f.note) {
        var note = document.createElement('span');
        note.className = 'field-note';
        note.textContent = f.note;
        wrap.appendChild(note);
      }
      dialogFields.appendChild(wrap);
    });

    if (opt.note) {
      var p = document.createElement('p');
      p.className = 'field-note';
      p.textContent = opt.note;
      dialogFields.appendChild(p);
    }
    dialogFields.style.display = (opt.fields && opt.fields.length) ? '' : 'none';

    dialogSubmit = function () {
      var values = {};
      (opt.fields || []).forEach(function (f) {
        var el = document.getElementById('f_' + f.key);
        values[f.key] = el ? el.value : '';
      });
      var keep = opt.onSubmit ? opt.onSubmit(values) : true;
      if (keep === false) return;
      closeDialog();
    };

    dialogOverlay.hidden = false;
    var first = dialogFields.querySelector('input,textarea');
    if (first) setTimeout(function () { try { first.focus(); } catch (e) {} }, 60);
  }

  function openConfirm(opt) {
    openForm({
      title: opt.title,
      note: opt.text,
      submitText: opt.okText || '그래',
      danger: true,
      fields: [],
      onSubmit: function () { if (opt.onOk) opt.onOk(); }
    });
  }

  /* ---------------- menu / views ---------------- */
  function openMenu() {
    var ov = $('#menu-overlay');
    if (!ov) return;
    var sv = $('#sound-value');
    if (sv) sv.textContent = state.sound ? '켜짐 🔊' : '꺼짐 🔇';
    ov.hidden = false;
  }
  function closeMenu() {
    var ov = $('#menu-overlay');
    if (ov) ov.hidden = true;
  }

  var MAIN_VIEWS = ['home', 'toshi', 'coupon', 'record', 'supplies'];
  var ALL_VIEWS = MAIN_VIEWS.concat(['todo', 'schedule']);
  var current = 'home';

  function go(view) {
    if (ALL_VIEWS.indexOf(view) < 0) view = 'home';
    current = view;
    $$('.view').forEach(function (v) {
      var on = v.dataset.view === view;
      v.hidden = !on;
      v.classList.toggle('is-active', on);
    });
    closeMenu();
    renderAll();
    try { window.scrollTo(0, 0); } catch (e) {}
    try { if (history.replaceState) history.replaceState(null, '', '#' + view); } catch (e) {}
  }

  function stepView(dir) {
    var i = MAIN_VIEWS.indexOf(current);
    if (i < 0) i = 0;
    go(MAIN_VIEWS[(i + dir + MAIN_VIEWS.length) % MAIN_VIEWS.length]);
  }

  /* ---------------- image upload ---------------- */
  function handleFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast('그림 파일만 올릴 수 있어요.'); return; }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      try {
        var max = 560;
        var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        var scale = Math.min(1, max / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        var data = canvas.toDataURL('image/png');
        var prev = state.charImage;
        state.charImage = data;
        if (!save()) state.charImage = prev;
        else { toast('토시이 그림을 바꿨어요! 🖼'); sound('done'); }
        renderAll();
      } catch (e) {
        toast('그림을 읽지 못했어요. 다른 사진으로 해 보세요.');
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      toast('그림을 읽지 못했어요. 다른 사진으로 해 보세요.');
    };
    img.src = url;
  }

  /* ---------------- events ---------------- */
  function bind() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      var todoBtn = t.closest ? t.closest('[data-todo]') : null;
      if (todoBtn) { toggleTodo(todoBtn.dataset.todo); return; }
      var editBtn = t.closest ? t.closest('[data-edit]') : null;
      if (editBtn) { editTodo(editBtn.dataset.edit); return; }
      var addSt = t.closest ? t.closest('[data-sticker-add]') : null;
      if (addSt) { addSticker(addSt.dataset.stickerAdd); return; }
      var rmSt = t.closest ? t.closest('[data-sticker]') : null;
      if (rmSt) { removeSticker(rmSt.dataset.sticker); return; }
      var supCheck = t.closest ? t.closest('[data-supply]') : null;
      if (supCheck) { toggleSupply(supCheck.dataset.supply, supCheck.dataset.sid); return; }
      var supDel = t.closest ? t.closest('[data-supply-del]') : null;
      if (supDel) { removeSupply(supDel.dataset.supplyDel, supDel.dataset.sid); return; }
      var supAdd = t.closest ? t.closest('[data-add]') : null;
      if (supAdd) { addSupply(supAdd.dataset.add); return; }
      var delSch = t.closest ? t.closest('[data-del]') : null;
      if (delSch) { e.stopPropagation(); askDeleteSchedule(delSch.dataset.del); return; }
      var goBtn = t.closest ? t.closest('[data-go]') : null;
      if (goBtn) { go(goBtn.dataset.go); return; }
      var schedRow = t.closest ? t.closest('[data-sched]') : null;
      if (schedRow) { editSchedule(schedRow.dataset.sched); return; }
    });

    var nb = $('#nav-back'); if (nb) nb.addEventListener('click', function () { stepView(-1); });
    var nn = $('#nav-next'); if (nn) nn.addEventListener('click', function () { stepView(1); });
    var bl = $('#btn-list'); if (bl) bl.addEventListener('click', openMenu);
    var bm = $('#btn-menu'); if (bm) bm.addEventListener('click', openMenu);
    var bmc = $('#btn-menu-close'); if (bmc) bmc.addEventListener('click', closeMenu);
    var mo = $('#menu-overlay');
    if (mo) mo.addEventListener('click', function (e) { if (e.target === mo) closeMenu(); });

    var bf = $('#btn-feed'); if (bf) bf.addEventListener('click', feed);
    var bd = $('#btn-deco'); if (bd) bd.addEventListener('click', function () { go('toshi'); });
    var hc = $('#hero-char'); if (hc) hc.addEventListener('click', feed);
    var gb = $('#btn-group'); if (gb) gb.addEventListener('click', flipHeroGroup);

    var br = $('#btn-dino-random');
    if (br) br.addEventListener('click', function () {
      state.customMessage = '';
      state.messageIndex = (state.messageIndex + 1 + Math.floor(Math.random() * (MESSAGES.length - 1))) % MESSAGES.length;
      save(); renderHero(); sound('pop');
    });
    var be = $('#btn-dino-edit');
    if (be) be.addEventListener('click', function () {
      openForm({
        title: '공룡선생님 한마디',
        fields: [{
          key: 'msg', label: '오늘 아이에게 전하고 싶은 말', type: 'textarea',
          value: state.customMessage || '',
          placeholder: '예: 오늘은 책 10쪽! 다 하면 토시이한테 먹이 주자.',
          maxlength: 120
        }],
        note: '비워 두면 기본 응원 문구로 돌아가요.',
        submitText: '저장',
        onSubmit: function (v) {
          state.customMessage = String(v.msg || '').trim().slice(0, 120);
          if (!state.customMessage) state.messageIndex = (state.messageIndex + 1) % MESSAGES.length;
          save(); renderHero(); toast('한마디를 저장했어요');
        }
      });
    });

    var ts = $('#btn-todo-stamp');
    if (ts) ts.addEventListener('click', function () { go('coupon'); });

    var bn = $('#btn-new-coupon'); if (bn) bn.addEventListener('click', startNewCoupon);
    var sa = $('#btn-sched-add'); if (sa) sa.addEventListener('click', function () { addSchedule(); });

    var fc = $('#file-char');
    if (fc) fc.addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      handleFile(f);
      try { e.target.value = ''; } catch (err) {}
    });
    var tu = $('#btn-upload-line');
    if (tu) tu.addEventListener('click', function () {
      closeMenu();
      var input = $('#file-char');
      if (input) input.click();
    });
    var cr = $('#btn-char-reset');
    if (cr) cr.addEventListener('click', function () {
      if (!state.charImage) { toast('이미 기본 그림이에요'); return; }
      openConfirm({
        title: '기본 그림으로',
        text: '올린 그림을 지우고 기본 토시이 그림으로 돌아갈까요?',
        okText: '기본 그림으로',
        onOk: function () { state.charImage = ''; save(); renderAll(); toast('기본 그림으로 돌아왔어요'); }
      });
    });
    var cs = $('#btn-clear-stickers');
    if (cs) cs.addEventListener('click', function () {
      if (!state.stickers.length) { toast('붙인 스티커가 없어요'); return; }
      openConfirm({
        title: '스티커 떼기', text: '붙인 스티커를 모두 뗄까요?', okText: '모두 떼기',
        onOk: function () { state.stickers = []; save(); renderAll(); toast('스티커를 모두 뗐어요'); }
      });
    });

    var snd = $('#btn-sound');
    if (snd) snd.addEventListener('click', function () {
      state.sound = !state.sound;
      save();
      var sv = $('#sound-value'); if (sv) sv.textContent = state.sound ? '켜짐 🔊' : '꺼짐 🔇';
      if (state.sound) sound('done');
      toast(state.sound ? '소리를 켰어요' : '소리를 껐어요');
    });

    var reset = $('#btn-data-reset');
    if (reset) reset.addEventListener('click', function () {
      openConfirm({
        title: '처음부터 다시',
        text: '할 일 체크, 먹이, 쿠폰, 기록, 준비물, 올린 그림까지 모두 지우고 처음 상태로 돌아갑니다. 이 기기의 기록만 지워져요.',
        okText: '모두 지우기',
        onOk: function () {
          state = fresh();
          state.seen = true;
          save();
          renderAll();
          closeMenu();
          go('home');
          toast('처음 상태로 돌아갔어요');
        }
      });
    });

    var tres = $('#btn-todo-reset');
    if (tres) tres.addEventListener('click', function () {
      openConfirm({
        title: '할 일 이름 되돌리기',
        text: '할 일 10개의 이름과 그림을 처음 값(아침 4개 · 저녁 6개)으로 돌릴까요? 오늘 체크한 기록은 그대로 남아요.',
        okText: '되돌리기',
        onOk: function () {
          var doneIds = state.daily.done.slice();
          state.todos = cloneTodos(DEFAULT_TODOS);
          state.daily.done = doneIds.filter(function (id) { return !!findTodo(id); });
          save(); renderAll(); closeMenu(); toast('할 일 이름을 되돌렸어요');
        }
      });
    });

    var form = $('#dialog-form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (dialogSubmit) dialogSubmit();
    });
    var dc = $('#btn-dialog-close'); if (dc) dc.addEventListener('click', closeDialog);
    var dcan = $('#btn-dialog-cancel'); if (dcan) dcan.addEventListener('click', closeDialog);
    var dov = $('#dialog-overlay');
    if (dov) dov.addEventListener('click', function (e) { if (e.target === dov) closeDialog(); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeDialog(); closeMenu(); }
    });

    setInterval(function () {
      var changed = rollDay();
      if (changed) { save(); renderAll(); }
      else {
        renderClock();
        renderHint();
        if (current === 'schedule') renderSchedule();
      }
    }, 1000);

    window.addEventListener('storage', function (e) {
      if (e.key === KEY) { state = load(); rollDay(); renderAll(); }
    });
  }

  /* ---------------- editing ---------------- */
  function editTodo(id) {
    var t = findTodo(id);
    if (!t) return;
    var g = groupOf(id);
    openForm({
      title: GROUPS[g].long + ' 고치기',
      fields: [
        { key: 'icon', label: '그림 (이모지)', type: 'emoji', value: t.icon, hints: ICONS, maxlength: 4 },
        { key: 'label', label: '이름', type: 'text', value: t.label, maxlength: 8, placeholder: '예: 수학' }
      ],
      submitText: '저장',
      onSubmit: function (v) {
        var label = String(v.label || '').trim().slice(0, 8);
        if (!label) { toast('이름을 적어 주세요'); return false; }
        t.label = label;
        t.icon = String(v.icon || '⭐').trim().slice(0, 4) || '⭐';
        save(); renderAll(); toast('할 일을 고쳤어요');
      }
    });
  }

  function addSchedule() {
    var d = new Date();
    var def = pad2(Math.min(23, d.getHours() + 1)) + ':00';
    openForm({
      title: '일정 추가',
      fields: [
        { key: 'time', label: '시간', type: 'time', value: def },
        { key: 'icon', label: '그림 (이모지)', type: 'emoji', value: '⏰', hints: ['⏰', '📚', '🛁', '🪥', '🍚', '🎨', '🛏️', '⚽'], maxlength: 4 },
        { key: 'label', label: '무엇을 할까?', type: 'text', value: '', maxlength: 16, placeholder: '예: 책 읽기' }
      ],
      submitText: '추가',
      onSubmit: function (v) {
        var label = String(v.label || '').trim().slice(0, 16);
        var time = String(v.time || '').trim();
        if (!time) { toast('시간을 골라 주세요'); return false; }
        if (!label) { toast('무엇을 할지 적어 주세요'); return false; }
        state.schedule.push({ id: uid('s'), time: time, icon: String(v.icon || '⏰').slice(0, 4), label: label });
        save(); renderSchedule(); renderHint(); toast('일정을 추가했어요 ⏰');
      }
    });
  }

  function editSchedule(id) {
    var s = null;
    state.schedule.forEach(function (x) { if (x.id === id) s = x; });
    if (!s) return;
    openForm({
      title: '일정 고치기',
      fields: [
        { key: 'time', label: '시간', type: 'time', value: s.time },
        { key: 'icon', label: '그림 (이모지)', type: 'emoji', value: s.icon, hints: ['⏰', '📚', '🛁', '🪥', '🍚', '🎨', '🛏️', '⚽'], maxlength: 4 },
        { key: 'label', label: '무엇을 할까?', type: 'text', value: s.label, maxlength: 16 }
      ],
      submitText: '저장',
      onSubmit: function (v) {
        var label = String(v.label || '').trim().slice(0, 16);
        var time = String(v.time || '').trim();
        if (!time) { toast('시간을 골라 주세요'); return false; }
        if (!label) { toast('무엇을 할지 적어 주세요'); return false; }
        s.time = time; s.icon = String(v.icon || s.icon).slice(0, 4); s.label = label;
        save(); renderSchedule(); renderHint(); toast('일정을 고쳤어요');
      }
    });
  }

  function askDeleteSchedule(id) {
    var s = null;
    state.schedule.forEach(function (x) { if (x.id === id) s = x; });
    if (!s) return;
    openConfirm({
      title: '일정 지우기',
      text: '‘' + s.time + ' ' + s.label + '’ 일정을 지울까요?',
      okText: '지우기',
      onOk: function () {
        state.schedule = state.schedule.filter(function (x) { return x.id !== id; });
        save(); renderSchedule(); renderHint(); toast('일정을 지웠어요');
      }
    });
  }

  /* ---------------- start ---------------- */
  function start() {
    state = load();
    rollDay();
    if (!state.seen) state.seen = true;
    if (!state.history[state.daily.date]) state.history[state.daily.date] = state.daily.done.length;
    save();
    bind();
    renderAll();
    var h = '';
    try { h = (location.hash || '').replace('#', ''); } catch (e) {}
    go(ALL_VIEWS.indexOf(h) >= 0 ? h : 'home');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
