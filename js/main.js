/* We Do — web v1.4 — 2026-10-27 */
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
  var last = secs.length - 1, active = -1, touched = false, restT;

  function go(i) { sc.scrollTo({ top: i * sc.clientHeight, behavior: 'smooth' }); }

  function bubble() {
    var intro = active === 0 && !touched, end = active === last;
    bub.classList.toggle('show', intro || end);
    bub.classList.toggle('up', end);
    if (intro) bubTxt.textContent = 'Scroll';
    else if (end) bubTxt.textContent = 'Again?';
  }

  function set(i) {
    if (i === active) return;
    active = i;
    secs.forEach(function (s, k) { s.classList.toggle('on', k === i); });
    document.body.dataset.theme = secs[i].dataset.theme;
    dots.forEach(function (d, k) { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    count.textContent = '0' + (i + 1) + ' / 0' + secs.length;
    talk.textContent = i === last ? 'Back to top' : 'Let’s talk';
    pet.setAttribute('aria-label', i === last ? 'Back to top' : 'Next section');
    bubble();
  }

  sc.addEventListener('scroll', function () {
    var h = sc.clientHeight || 1;
    set(Math.max(0, Math.min(last, Math.round(sc.scrollTop / h))));
    bar.style.width = (sc.scrollTop / Math.max(1, sc.scrollHeight - h) * 100) + '%';
    if (!touched) { touched = true; bubble(); }
    document.body.classList.add('moving');
    clearTimeout(restT);
    restT = setTimeout(function () { document.body.classList.remove('moving'); }, 420);
  }, { passive: true });

  dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
  document.querySelector('.logo').addEventListener('click', function () { go(0); });
  talk.addEventListener('click', function () { go(active === last ? 0 : last); });
  pet.addEventListener('click', function () { go(active === last ? 0 : active + 1); });

  // Hero: the word "text" cycles through languages and scripts
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

  requestAnimationFrame(function () { set(0); });
  sc.focus({ preventScroll: true });
})();
