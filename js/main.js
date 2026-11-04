/* We Do — web v3.29 — 2026-11-04 */
(function () {
  var sc = document.querySelector('.scroller');
  var secs = Array.prototype.slice.call(sc.querySelectorAll('section'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('nav button'));
  var count = document.querySelector('.count');
  var bar = document.querySelector('.progress');
  var talk = document.querySelector('.talk');
  var bub = document.querySelector('.bubble');
  var bubTxt = bub.querySelector('span');
  var pet = document.querySelector('.mascot');
  var hdr = document.querySelector('header');
  var menu = document.getElementById('menu'), menuBtn = document.querySelector('.menu-btn');
  var menuItems = Array.prototype.slice.call(menu.querySelectorAll('[data-go]'));
  var last = secs.length - 1, active = -1, touched = false, restT;

  var tops = [];
  // v3.16 continuous scroll: header and floating controls take the colours of the block right under the header
  var themeNow = '';
  function paintTheme() {
    var y = sc.scrollTop + 48, idx = 0;
    for (var k = 0; k < tops.length; k++) if (tops[k] <= y) idx = k;
    var t = secs[idx] ? secs[idx].dataset.theme : 'light';
    if (t !== themeNow) { themeNow = t; document.body.dataset.theme = t; }
  }
  function measure() { tops = secs.map(function (s) { return s.offsetTop; }); }
  /* v3.15: pinned slide + rising panel turned off (blocks scroll normally). Kept for reference:
  // v3.14: service slides stay pinned while their "What we do" panel rises over them (only when the slide fits the screen)
  var stacks = secs.map(function (s) { var m = s.querySelector('.svc-main'); return m && s.querySelector('.tail') ? { s: s, m: m, h: 0, cov: -1 } : null; });
  function measure() {
    stacks.forEach(function (st) {
      if (!st) return;
      st.h = st.m.offsetHeight;
      st.s.classList.toggle('stack', window.innerWidth > 640 && st.h <= sc.clientHeight - 8);
    });
    tops = secs.map(function (s) { return s.offsetTop; });
    layer();
  }
  function layer() {
    var y = sc.scrollTop;
    stacks.forEach(function (st, k) {
      if (!st) return;
      var c = st.s.classList.contains('stack') ? Math.max(0, Math.min(1, (y - (tops[k] || 0)) / Math.max(1, st.h))) : 0;
      if (Math.abs(c - st.cov) > 0.002) { st.cov = c; st.m.style.setProperty('--cov', c.toFixed(3)); }
    });
  }
  */
  function go(i) { measure(); sc.scrollTo({ top: tops[i], behavior: 'smooth' }); }
  // Sections can be taller than the screen (service slides + their tails): find the active one by position
  function current() {
    var y = sc.scrollTop + sc.clientHeight * 0.45, idx = 0;
    for (var k = 0; k < tops.length; k++) if (tops[k] <= y) idx = k;
    return idx;
  }

  var nudge = false, nudged = false;
  function bubble() {
    var intro = active === 0 && !touched, end = active === last;
    var text = intro ? 'Scroll' : (end ? 'Let’s chat' : (nudge ? 'Need a hand?' : ''));
    bub.classList.toggle('show', !!text);
    bub.classList.toggle('noarrow', !intro);
    if (text) bubTxt.textContent = text;
  }

  function set(i) {
    if (i === active) return;
    active = i;
    secs.forEach(function (s, k) { s.classList.toggle('on', k === i); });
    // v3.16: the colour theme now follows the block under the header (see paintTheme), not the active block
    document.body.classList.toggle('hero-on', i === 0);
    dots.forEach(function (d, k) { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    count.textContent = '0' + (i + 1) + ' / 0' + secs.length;
    talk.textContent = i === last ? 'Back to top' : 'Let’s talk';
    if (i === 2 && !nudged) { nudged = true; nudge = true; setTimeout(function () { nudge = false; bubble(); }, 5000); }
    pet.parentNode.classList.toggle('away', secs[i].hasAttribute('data-nopet'));
    menuItems.forEach(function (b, k) { if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    bubble();
  }

  // Scroll work runs once per frame, with cached block positions (no layout reads per event)
  var ticking = false, moving = false;
  function onFrame() {
    ticking = false;
    var h = sc.clientHeight || 1;
    set(current());
    paintTheme();
    bar.style.transform = 'scaleX(' + Math.min(1, sc.scrollTop / Math.max(1, sc.scrollHeight - h)).toFixed(4) + ')';
    if (!touched) { touched = true; bubble(); }
    if (!moving) { moving = true; document.body.classList.add('moving'); }
    clearTimeout(restT);
    restT = setTimeout(function () { moving = false; document.body.classList.remove('moving'); }, 420);
  }
  sc.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }, { passive: true });
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
  document.querySelector('.logo').addEventListener('click', function () { go(0); });
  talk.addEventListener('click', function () { go(active === last ? 0 : last); });
  var aboutIdx = secs.findIndex(function (s) { return s.classList.contains('about'); });
  document.querySelector('.hab').addEventListener('click', function () { if (aboutIdx > -1) go(aboutIdx); });

  // ---------- WD assistant: a short scripted chat that turns visitors into contacts ----------
  // formEndpoint: paste a Formspree (or similar) URL to receive leads directly; empty = opens the visitor's email app.
  var CONTACT = { email: 'YOUR_EMAIL', formEndpoint: '' };
  var chat = document.getElementById('chat');
  var log = chat.querySelector('.chat-log'), quick = chat.querySelector('.chat-quick'), form = chat.querySelector('.chat-form');
  var answers = {}, started = false;
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var addMsg = function (text, who) {
    var p = document.createElement('p'); p.className = 'msg ' + who; p.textContent = text;
    log.appendChild(p); log.scrollTop = log.scrollHeight;
  };
  var say = async function (text) {
    var t = document.createElement('p'); t.className = 'msg bot typing'; t.setAttribute('aria-hidden', 'true');
    for (var k = 0; k < 3; k++) t.appendChild(document.createElement('i'));
    log.appendChild(t); log.scrollTop = log.scrollHeight;
    await wait(Math.min(1300, 420 + text.length * 11));
    t.remove(); addMsg(text, 'bot');
  };
  var ask = function (options) {
    return new Promise(function (resolve) {
      quick.textContent = '';
      options.forEach(function (o) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = o;
        b.addEventListener('click', function () { quick.textContent = ''; addMsg(o, 'me'); resolve(o); });
        quick.appendChild(b);
      });
      log.scrollTop = log.scrollHeight;
    });
  };
  var run = async function () {
    started = true;
    await say('Hi! I’m WD, the We Do assistant.');
    await say('What are you working on?');
    var what = await ask(['An eLearning course', 'A video', 'Documents & layouts', 'Just looking around']);
    answers.project = what;
    if (what === 'Just looking around') {
      await say('Fair enough! Want a quick hello from the team? Just an email, no sales pitch.');
      if (await ask(['Sure', 'Maybe later']) === 'Maybe later') { await say('No problem. I’ll be right here if you need me.'); return; }
    } else {
      await say({ 'An eLearning course': 'Nice, courses are our favorite.', 'A video': 'Great, video is a big part of what we do.', 'Documents & layouts': 'Perfect, multilingual layouts are our thing.' }[what]);
      await say('How many languages?');
      answers.languages = await ask(['1–2', '3–5', '6 or more', 'Not sure yet']);
      await say('And when do you need it?');
      answers.timing = await ask(['This week', 'This month', 'No rush']);
      await say('That’s all we need to get started. No forms, no commitment.');
    }
    await say('Where can we reach you?');
    form.hidden = false; form.querySelector('input').focus({ preventScroll: true });
  };
  var send = async function () {
    var summary = 'Project: ' + (answers.project || '-') + '\nLanguages: ' + (answers.languages || '-') +
      '\nTiming: ' + (answers.timing || '-') + '\nEmail: ' + answers.email;
    if (CONTACT.formEndpoint) {
      try {
        var r = await fetch(CONTACT.formEndpoint, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: answers.email, message: summary, _subject: 'New contact from the We Do website' }) });
        if (r.ok) { await say('Got it! We’ll get back to you soon. Talk soon!'); return; }
      } catch (err) { /* falls back to email below */ }
    }
    await say('Almost done: your email app will open with everything filled in. Just hit send.');
    await wait(900);
    window.location.href = 'mailto:' + CONTACT.email + '?subject=' + encodeURIComponent('Project inquiry — We Do website') + '&body=' + encodeURIComponent(summary);
  };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = form.querySelector('input');
    if (!input.checkValidity()) { input.reportValidity(); return; }
    answers.email = input.value.trim(); form.hidden = true; addMsg(answers.email, 'me'); send();
  });
  var openChat = function () {
    chat.hidden = false;
    requestAnimationFrame(function () { chat.classList.add('open'); });
    pet.setAttribute('aria-expanded', 'true'); document.body.classList.add('chatting');
    if (!started) run(); else chat.querySelector('.chat-close').focus({ preventScroll: true });
  };
  var closeChat = function () {
    chat.classList.remove('open'); pet.setAttribute('aria-expanded', 'false'); document.body.classList.remove('chatting');
    setTimeout(function () { chat.hidden = true; }, 260); pet.focus({ preventScroll: true });
  };
  pet.addEventListener('click', function () { if (chat.hidden) openChat(); else closeChat(); });
  chat.querySelector('.chat-close').addEventListener('click', closeChat);
  chat.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeChat(); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-chat]'), function (b) { b.addEventListener('click', openChat); });

  // Hero: the word "text" cycles through languages and scripts
  /* v3.21 word list (kept for reference):
  var words = [['text','EN','en'],['texto','ES','es'],['テキスト','JA','ja'],['نص','AR','ar'],['текст','RU','ru'],['文本','ZH','zh-Hans'],['texte','FR','fr'],['טקסט','HE','he'],['텍스트','KO','ko'],['ข้อความ','TH','th'],['testo','IT','it'],['tekst','PL','pl']];
  var word = document.getElementById('word'), code = document.querySelector('.code'), wi = 0;
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(function () {
      word.classList.add('out');
      setTimeout(function () {
        wi = (wi + 1) % words.length;
        word.textContent = words[wi][0]; word.lang = words[wi][2]; code.textContent = words[wi][1];
        word.classList.remove('out'); word.classList.add('pre');
        void word.offsetWidth;
        word.classList.remove('pre');
      }, 260);
    }, 1800);
  }

  */
  // v3.22: the big word says "We Do" in 13 languages; EN stays on screen a little longer.
  // Long words shrink just enough to fit before the lamp (desktop) or inside the column (phones).
  /* v3.22 fixed order (kept for reference):
  var words = [['We Do','EN','en'],['Hacemos','ES','es'],['نحن نفعل','AR','ar'],['やります','JA','ja'],['Κάνουμε','EL','el'],['हम करते हैं','HI','hi'],['Facciamo','IT','it'],['우리가 합니다','KO','ko'],['Мы делаем','RU','ru'],['Vi gör','SV','sv'],['เราทำ','TH','th'],['אנחנו עושים','HE','he'],['我们来做','ZH','zh-Hans']];
  */
  // v3.23: "We Do" first, then 3 or 4 languages picked at random from different groups, then back to "We Do"
  var WEDO = ['We Do','EN','en'];
  var GROUPS = [
    [['Hacemos','ES','es'],['Nous faisons','FR','fr'],['Facciamo','IT','it'],['Fazemos','PT-BR','pt-BR'],['Wir machen','DE','de']],
    [['やります','JA','ja'],['우리가 합니다','KO','ko'],['我们来做','ZH','zh-Hans']],
    [['Robimy','PL','pl'],['Vi gör','SV','sv'],['Robíme','SK','sk'],['Мы делаем','RU','ru']],
    [['نحن نفعل','AR','ar'],['אנחנו עושים','HE','he']],
    [['เราทำ','TH','th'],['हम करते हैं','HI','hi'],['Κάνουμε','EL','el']]
  ];
  var words = [WEDO].concat.apply([WEDO], GROUPS);
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  function newRound() {
    var order = GROUPS.map(function (g, k) { return k; }).sort(function () { return Math.random() - 0.5; });
    // v3.24: exactly 3 languages per round (v3.23 drew 3 or 4)
    return order.slice(0, 3).map(function (k) { return pick(GROUPS[k]); });
  }
  var round = [], cur = WEDO;
  var word = document.getElementById('word'), code = document.querySelector('.code'), wi = 0;
  var bigBox = word.parentNode, lampStage = document.querySelector('.lamp-stage');
  var heroSecW = word.closest('section');
  function fitWord() {
    word.style.fontSize = '';
    var r = word.getBoundingClientRect(), sr = heroSecW.getBoundingClientRect();
    var limit = Math.min(bigBox.getBoundingClientRect().right, sr.right - parseFloat(getComputedStyle(heroSecW).paddingRight));
    if (lampStage && window.innerWidth > 640) { var L = lampStage.getBoundingClientRect(); limit = Math.min(limit, L.left + 0.62 * L.width - 28); }
    var room = (limit - r.left) * 0.97;
    if (r.width > room && room > 0) word.style.fontSize = (parseFloat(getComputedStyle(word).fontSize) * room / r.width).toFixed(1) + 'px';
  }
  function showWord(w) {
    cur = w;
    word.textContent = w[0]; word.lang = w[2]; code.textContent = w[1];
    word.dir = (w[2] === 'ar' || w[2] === 'he') ? 'rtl' : 'ltr';
    fitWord();
  }
  showWord(WEDO);
  window.addEventListener('resize', fitWord);
  if (document.fonts) {
    // load every script's face up front, and re-fit whenever a face arrives (widths change when it swaps in)
    words.forEach(function (w) { try { document.fonts.load('800 1em ' + getComputedStyle(document.body).fontFamily, w[0]); } catch (e) {} });
    ['Noto Sans', 'Noto Sans Devanagari', 'Noto Sans SC', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans Arabic', 'Noto Sans Hebrew', 'Noto Sans Thai'].forEach(function (f, k) {
      try { document.fonts.load('800 1em "' + f + '"', words.map(function (w) { return w[0]; }).join('')); } catch (e) {}
    });
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fitWord);
    if (document.fonts.ready) document.fonts.ready.then(fitWord);
  }
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var nextWord = function () {
      word.classList.add('out');
      setTimeout(function () {
        if (cur === WEDO) round = newRound();
        showWord(round.length ? round.shift() : WEDO);
        word.classList.remove('out'); word.classList.add('pre');
        void word.offsetWidth;
        word.classList.remove('pre');
        setTimeout(nextWord, cur === WEDO ? 3200 : 1800);
      }, 260);
    };
    setTimeout(nextWord, 3200);
  }

  // DTP: the green highlight jumps between scripts at random
  var cells = Array.prototype.slice.call(document.querySelectorAll('.glyphs div'));
  var hl = 2;
  if (cells.length) setInterval(function () {
    var n;
    do { n = Math.floor(Math.random() * cells.length); } while (n === hl);
    cells[hl].classList.remove('hl'); cells[n].classList.add('hl'); hl = n;
  }, 1100);

  // eLearning: the video (OST + CC) and the playbars change language together
  var sync = document.getElementById('sync');
  if (sync) {
    var V = [
      { c: 'ES', l: 'es', d: 'ltr', ost: 'La seguridad primero', cc: 'Revisa la conexión antes de empezar.' },
      { c: 'DE', l: 'de', d: 'ltr', ost: 'Sicherheit geht vor', cc: 'Prüfen Sie vor dem Start die Verbindung.' },
      { c: 'JA', l: 'ja', d: 'ltr', ost: '安全第一', cc: '始める前に接続を確認してください。' },
      { c: 'AR', l: 'ar', d: 'rtl', ost: 'السلامة أولاً', cc: 'تحقق من الاتصال قبل البدء.' },
      { c: 'KO', l: 'ko', d: 'ltr', ost: '안전 제일', cc: '시작하기 전에 연결을 확인하세요.' }
    ];
    var vid = sync.querySelector('.phone .vid'), vlang = sync.querySelector('.phone .vlang');
    var ost = sync.querySelector('.phone .ost'), cc = sync.querySelector('.phone .cc');
    var vtext = Array.prototype.slice.call(sync.querySelectorAll('.phone .vscene, .phone .vcc'));
    var vrows = Array.prototype.slice.call(sync.querySelectorAll('.phone .row'));
    var monitor = sync.querySelector('.monitor');
    var vi = 0;
    var show = function (i) {
      vi = i;
      sync.classList.add('swap');
      vrows.forEach(function (r) { r.classList.remove('on'); });
      vid.classList.remove('play'); monitor.classList.remove('play');
      setTimeout(function () {
        var o = V[i];
        vlang.textContent = o.c; ost.textContent = o.ost; cc.textContent = o.cc;
        vtext.forEach(function (e) { e.lang = o.l; e.dir = o.d; });
        sync.classList.remove('swap');
        vrows[i].classList.add('on'); vid.classList.add('play'); monitor.classList.add('play');
      }, 200);
    };
    show(0);
    setInterval(function () { show((vi + 1) % V.length); }, 3000);
  }

  // Hero background video: plays only on the intro, never for reduced-motion users
  var heroVid = document.querySelector('.hero-bg');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroVid) {
    if (calm) { heroVid.removeAttribute('autoplay'); heroVid.pause(); }
    sc.addEventListener('scroll', function () {
      if (calm) return;
      if (active === 0) { if (heroVid.paused) { var p = heroVid.play(); if (p && p.catch) p.catch(function () {}); } }
      else if (!heroVid.paused) heroVid.pause();
    }, { passive: true });
  }

  // Hero: the real stars of the background image twinkle softly (positions in % of the image)
  var STARS = [[36.63,12.04,3.2,1.0],[48.71,12.5,3.2,1.0],[23.67,1.85,3.2,1.0],[26.8,15.28,3.2,1.0],[8.51,93.17,3.2,1.0],[60.79,16.09,3.2,1.0],[63.43,2.43,3.2,1.0],[56.07,22.8,3.2,1.0],[4.06,80.9,3.2,1.0],[55.52,32.06,3.2,1.0],[36.57,1.74,3.2,1.0],[2.2,68.63,3.2,1.0],[29.1,87.85,3.2,1.0],[45.74,23.38,3.2,1.0],[76.72,20.25,3.2,1.0],[45.91,9.49,3.2,1.0],[80.23,4.17,3.2,1.0],[49.2,37.27,3.2,1.0],[37.95,19.68,3.2,1.0],[71.28,19.79,3.2,1.0],[18.78,91.44,3.2,1.0],[67.87,19.21,3.2,1.0],[54.37,40.05,3.2,1.0],[32.07,5.9,3.2,1.0],[51.73,28.24,3.2,1.0],[43.99,28.47,3.2,1.0],[5.77,92.48,3.2,1.0],[92.31,15.74,3.2,1.0],[1.76,56.25,3.2,1.0],[79.9,27.66,3.2,1.0],[67.22,8.33,3.2,1.0],[78.69,15.05,3.2,1.0],[84.9,28.7,3.2,1.0],[40.36,7.29,3.2,0.99],[59.03,12.5,3.2,0.99],[19.38,99.19,3.1,0.98],[49.86,7.64,3.1,0.97],[65.95,4.63,3.1,0.97],[52.28,25.12,3.0,0.95],[5.82,28.7,3.0,0.95],[6.1,13.66,3.0,0.95],[97.47,17.48,3.0,0.94],[97.47,17.59,3.0,0.94],[61.5,20.6,3.0,0.94],[53.65,13.89,2.9,0.93],[29.38,2.66,2.9,0.91],[7.58,42.94,2.9,0.91],[1.1,75.12,2.9,0.91],[25.26,24.19,2.9,0.91],[2.91,49.07,2.8,0.89],[21.69,21.06,2.8,0.89],[78.69,21.41,2.8,0.89],[18.67,1.74,2.8,0.88],[41.9,52.78,2.7,0.88],[22.9,94.56,2.7,0.88],[13.4,23.73,2.7,0.87],[61.12,25.0,2.7,0.86],[90.99,20.95,2.6,0.85],[93.96,21.06,2.6,0.85],[44.59,13.77,2.6,0.84],[85.56,17.25,2.6,0.84],[46.18,35.3,2.6,0.83],[42.06,40.86,2.6,0.83],[47.61,3.12,2.5,0.82],[25.81,11.69,2.5,0.81],[26.08,87.85,2.5,0.8],[3.19,20.14,2.4,0.8],[23.89,84.61,2.4,0.8],[8.46,35.76,2.4,0.79],[80.45,3.47,2.4,0.78],[57.22,38.66,2.3,0.77],[37.23,35.76,2.3,0.76],[65.35,12.73,2.3,0.76],[52.17,18.87,2.3,0.75],[30.31,84.14,2.3,0.75],[1.1,22.11,2.2,0.75],[78.58,1.5,2.2,0.74],[18.56,10.53,2.2,0.74],[38.93,15.74,2.2,0.74],[33.94,8.45,2.2,0.74],[39.7,20.49,2.2,0.74],[48.76,52.66,2.2,0.73],[55.85,8.56,2.2,0.73],[85.94,12.15,2.2,0.73],[73.92,3.24,2.2,0.72],[64.31,13.43,2.2,0.72],[10.32,21.64,2.2,0.72],[55.52,53.01,2.2,0.72],[73.42,15.39,2.1,0.72],[73.48,15.39,2.1,0.72],[91.6,23.96,2.1,0.72],[85.67,18.06,2.1,0.72],[58.05,28.7,2.1,0.71],[50.85,12.96,2.1,0.71],[42.06,27.78,2.1,0.71],[51.29,45.14,2.1,0.71],[52.17,6.83,2.1,0.7],[39.04,14.12,2.1,0.7],[87.97,25.93,2.1,0.7],[0.6,47.57,2.1,0.7],[36.02,80.09,2.1,0.7],[37.51,25.23,2.0,0.7],[52.72,34.38,2.0,0.7],[65.24,23.61,2.0,0.69],[26.91,11.92,2.0,0.69],[58.26,15.97,2.0,0.69],[61.89,24.77,2.0,0.69],[1.26,28.94,2.0,0.69],[14.11,82.99,2.0,0.69],[68.53,26.97,2.0,0.69],[47.72,28.59,2.0,0.69],[49.86,22.34,2.0,0.68],[46.79,24.31,2.0,0.68],[25.32,76.5,2.0,0.68],[48.49,16.09,2.0,0.68],[77.27,31.48,2.0,0.68],[46.02,58.68,2.0,0.68],[36.24,19.1,2.0,0.68],[57.83,36.46,2.0,0.68],[46.07,4.86,2.0,0.67],[32.62,14.0,2.0,0.67],[54.26,22.22,2.0,0.67],[27.4,10.76,1.9,0.67],[91.82,24.54,1.9,0.67],[48.33,24.65,1.9,0.67],[58.81,39.0,1.9,0.67],[25.59,10.65,1.9,0.66],[49.59,11.0,1.9,0.66],[52.17,31.6,1.9,0.66],[45.96,31.83,1.9,0.66],[58.76,36.11,1.9,0.66],[38.88,50.81,1.9,0.66],[28.56,91.67,1.9,0.66],[44.98,2.78,1.9,0.66],[46.9,6.02,1.9,0.66],[61.34,7.06,1.9,0.66],[89.35,19.68,1.9,0.66],[33.61,3.24,1.9,0.66],[50.63,11.69,1.9,0.66],[78.03,27.31,1.9,0.66],[56.67,31.48,1.9,0.66],[53.1,33.68,1.9,0.66],[52.99,38.43,1.9,0.66],[47.39,58.56,1.9,0.66],[50.36,21.76,1.9,0.66],[62.05,27.2,1.9,0.66],[68.37,28.24,1.9,0.66],[33.83,9.84,1.9,0.65],[74.74,15.74,1.9,0.65],[47.28,17.48,1.9,0.65]];
  var starsBox = document.querySelector('.hero-stars');
  if (starsBox && !calm) {
    STARS.forEach(function (st) {
      var el = document.createElement('i');
      el.style.left = st[0] + '%'; el.style.top = st[1] + '%';
      el.style.setProperty('--s', st[2] + 'px'); el.style.setProperty('--o', st[3]);
      var tint = Math.random();
      if (tint < 0.2) { el.style.setProperty('--c', '#dbe9ff'); el.style.setProperty('--g', 'rgba(160,200,255,.8)'); }
      else if (tint < 0.3) { el.style.setProperty('--c', '#fff1d9'); el.style.setProperty('--g', 'rgba(255,215,160,.7)'); }
      el.style.setProperty('--t', (3 + Math.random() * 4).toFixed(2) + 's');
      el.style.setProperty('--dl', (-Math.random() * 7).toFixed(2) + 's');
      starsBox.appendChild(el);
    });
  }

  // Hero: a layer of fine star dust, an occasional shooting star, and subtle depth with the mouse
  var dust = document.querySelector('.hero-dust'), meteor = document.querySelector('.meteor');
  var heroSec = document.querySelector('.hero');
  if (dust) for (var d = 0; d < 70; d++) {
    var dot = document.createElement('i');
    dot.style.left = (Math.random() * 100).toFixed(2) + '%'; dot.style.top = (Math.random() * 70).toFixed(2) + '%';
    dot.style.setProperty('--o', (0.25 + Math.random() * 0.5).toFixed(2)); dust.appendChild(dot);
  }
  if (meteor && !calm) {
    var shoot = function () {
      if (active === 0) {
        meteor.style.setProperty('--x', (45 + Math.random() * 45).toFixed(1) + '%');
        meteor.style.setProperty('--y', (4 + Math.random() * 22).toFixed(1) + '%');
        meteor.classList.remove('go'); void meteor.offsetWidth; meteor.classList.add('go');
      }
      setTimeout(shoot, 10000 + Math.random() * 10000);
    };
    setTimeout(shoot, 4000);
  }
  if (heroSec && !calm && window.matchMedia('(pointer: fine)').matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    var step = function () {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      heroSec.style.setProperty('--mx', cx.toFixed(2) + 'px'); heroSec.style.setProperty('--my', cy.toFixed(2) + 'px');
      raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(step) : 0;
    };
    heroSec.addEventListener('mousemove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 8; ty = (e.clientY / window.innerHeight - 0.5) * 6;
      if (!raf) raf = requestAnimationFrame(step);
    });
  }

  // eLearning player: the course switches language (tabs, captions, quiz, buttons)
  var lms = document.getElementById('lms');
  if (lms) {
    var LP = [
      { l: 'en', title: 'Module 1: Getting Started', res: 'RESOURCES', cc: 'Let’s explore the key concepts together.', q: 'What is localization?', a1: 'Adapting content for a different language and culture.', a2: 'Translating every word literally.', a3: 'Changing the course design.', sub: 'Submit' },
      { l: 'es', title: 'Módulo 1: Primeros pasos', res: 'RECURSOS', cc: 'Exploremos juntos los conceptos clave.', q: '¿Qué es la localización?', a1: 'Adaptar el contenido a otro idioma y cultura.', a2: 'Traducir cada palabra literalmente.', a3: 'Cambiar el diseño del curso.', sub: 'Enviar' },
      { l: 'de', title: 'Modul 1: Erste Schritte', res: 'RESSOURCEN', cc: 'Lassen Sie uns die wichtigsten Konzepte gemeinsam erkunden.', q: 'Was ist Lokalisierung?', a1: 'Inhalte an eine andere Sprache und Kultur anpassen.', a2: 'Jedes Wort wörtlich übersetzen.', a3: 'Das Kursdesign ändern.', sub: 'Absenden' },
      { l: 'ja', title: 'モジュール1：はじめに', res: 'リソース', cc: '重要なポイントを一緒に見ていきましょう。', q: 'ローカリゼーションとは？', a1: 'コンテンツを別の言語と文化に合わせること。', a2: 'すべての単語を直訳すること。', a3: 'コースのデザインを変えること。', sub: '送信' }
    ];
    var lpTabs = Array.prototype.slice.call(lms.querySelectorAll('.lp-tabs i'));
    var lpKeys = Array.prototype.slice.call(lms.querySelectorAll('[data-l]'));
    var lpPlayer = lms.querySelector('.lms-player'), lpi = 0;
    var lpShow = function (i) {
      lpi = i; lms.classList.add('swap');
      setTimeout(function () {
        var o = LP[i];
        lpKeys.forEach(function (k) { k.textContent = o[k.dataset.l]; });
        lpPlayer.lang = o.l;
        lpTabs.forEach(function (t, k) { t.classList.toggle('on', k === i); });
        lms.classList.remove('swap', 'play'); void lms.offsetWidth; lms.classList.add('play');
      }, 200);
    };
    if (!calm) setInterval(function () { if (active === 2) lpShow((lpi + 1) % LP.length); }, 3200);
  }

  // Menu (3 lines): jump to any block, start a chat or email
  var openMenu = function () { menu.hidden = false; requestAnimationFrame(function () { menu.classList.add('open'); }); menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', 'Close menu'); menuItems[Math.max(0, active)].focus({ preventScroll: true }); };
  var closeMenu = function (back) { menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Menu'); setTimeout(function () { menu.hidden = true; }, 220); if (back) menuBtn.focus({ preventScroll: true }); };
  menuBtn.addEventListener('click', function () { if (menu.hidden) openMenu(); else closeMenu(true); });
  menuItems.forEach(function (b) { b.addEventListener('click', function () { closeMenu(); go(+b.dataset.go); }); });
  menu.querySelector('.menu-chat').addEventListener('click', function () { closeMenu(); });
  menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(true); });

  // ---------- v3.25: language selector (v3.26: cancelled for now; markup is commented out in index.html, so this code does nothing) ----------
  // To add a language later, add one item here (href = the page in that language). Nothing is translated yet.
  var LANGS = [
    { code: 'en', label: 'English', href: '' }
  ];
  var LANG_NOW = 'en';
  var TICK = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var langBtn = document.querySelector('.lang-btn'), langMenu = document.getElementById('lang-menu'), menuLangList = document.querySelector('.menu-lang-list');
  function chooseLang(l) { if (l.code !== LANG_NOW && l.href) window.location.href = l.href; }
  function buildLangs(list, asMenu) {
    if (!list) return;
    LANGS.forEach(function (l) {
      var li = document.createElement('li'), b = document.createElement('button');
      if (asMenu) li.setAttribute('role', 'none');
      b.type = 'button'; b.lang = l.code; b.dataset.lang = l.code;
      if (asMenu) { b.setAttribute('role', 'menuitemradio'); b.setAttribute('aria-checked', l.code === LANG_NOW ? 'true' : 'false'); b.tabIndex = -1; }
      else if (l.code === LANG_NOW) b.setAttribute('aria-current', 'true');
      b.innerHTML = '<span></span>' + (l.code === LANG_NOW ? TICK : '');
      b.firstChild.textContent = l.label;
      b.addEventListener('click', function () { if (asMenu) closeLang(true); else closeMenu(true); chooseLang(l); });
      li.appendChild(b); list.appendChild(li);
    });
  }
  buildLangs(langMenu, true); buildLangs(menuLangList, false);
  var langItems = langMenu ? Array.prototype.slice.call(langMenu.querySelectorAll('button')) : [];
  function openLang() {
    langMenu.hidden = false; langBtn.setAttribute('aria-expanded', 'true');
    var cur = langMenu.querySelector('[aria-checked="true"]') || langItems[0]; if (cur) cur.focus();
  }
  function closeLang(back) { if (!langMenu || langMenu.hidden) return; langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false'); if (back) langBtn.focus(); }
  if (langBtn && langMenu) {
    langBtn.addEventListener('click', function () { if (langMenu.hidden) openLang(); else closeLang(true); });
    langBtn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' && langMenu.hidden) { e.preventDefault(); openLang(); } });
    langMenu.addEventListener('keydown', function (e) {
      var k = langItems.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); closeLang(true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); langItems[(k + 1) % langItems.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); langItems[(k - 1 + langItems.length) % langItems.length].focus(); }
      else if (e.key === 'Tab') closeLang(false);
    });
    document.addEventListener('click', function (e) { if (!langMenu.hidden && !langMenu.contains(e.target) && !langBtn.contains(e.target)) closeLang(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !langMenu.hidden) closeLang(true); });
  }
  document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu(); });

  // Mini-sections fade in softly as they scroll into view (content is never hidden without JS or with reduced motion)
  var minis = Array.prototype.slice.call(document.querySelectorAll('.mini'));
  if ('IntersectionObserver' in window && !calm && minis.length) {
    minis.forEach(function (m) {
      Array.prototype.forEach.call(m.querySelectorAll('.mini-label, .team-list li, .todo li, .tools > div, .tools-note'), function (el, k) { el.style.setProperty('--i', k); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { root: sc, threshold: 0.12 });
    document.documentElement.classList.add('reveal-on');
    minis.forEach(function (m) { io.observe(m); });
  }

  requestAnimationFrame(function () { set(0); paintTheme(); });
  // v3.29: when the footer is on screen, the floating WD button rises above it
  var legal = document.querySelector('footer.legal');
  if (legal && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        document.body.style.setProperty('--foot-h', Math.round(e.intersectionRect.height) + 'px');
        document.body.classList.toggle('foot-in', e.isIntersecting);
      });
    }, { root: sc, threshold: [0, .25, .5, .75, 1] }).observe(legal);
  }
  // v3.16: each block reveals its content once, as soon as it scrolls into view (and stays visible)
  if ('IntersectionObserver' in window) {
    var seenIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('seen'); seenIO.unobserve(e.target); } });
    }, { root: sc, rootMargin: '0px 0px -12% 0px', threshold: 0 });
    secs.forEach(function (s) { seenIO.observe(s); });
  } else secs.forEach(function (s) { s.classList.add('seen'); });
  // v3.14: the language ribbon loops seamlessly (second copy is hidden from screen readers)
  var lt = document.querySelector('.langs-track');
  if (lt) Array.prototype.slice.call(lt.children).forEach(function (li) { var cl = li.cloneNode(true); cl.setAttribute('aria-hidden', 'true'); lt.appendChild(cl); });
  // Hero v3.13: the lamp switches on once, on arrival; the headline appears in its light
  var lampHero = document.querySelector('.hero-lamp') ? document.querySelector('.hero') : null;
  if (lampHero) requestAnimationFrame(function () {
    lampHero.classList.add('lamp-go', 'lamp-intro');
    setTimeout(function () { lampHero.classList.remove('lamp-intro'); }, 2600);
  });
  sc.focus({ preventScroll: true });
})();
