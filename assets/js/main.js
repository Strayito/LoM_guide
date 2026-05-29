// This file contains the JavaScript code for the Legend of Mushroom guide website.
// It may include functionality such as interactive elements, event handling, and dynamic content updates.

function initLanguage() {
  const buttons = document.querySelectorAll('.lang-switcher button');
  const frBlocks = document.querySelectorAll('.lang-fr');
  const enBlocks = document.querySelectorAll('.lang-en');
  const skBlocks = document.querySelectorAll('.lang-sk');

  function setLanguage(lang) {
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
    frBlocks.forEach(el => el.classList.toggle('hidden', lang !== 'fr'));
    enBlocks.forEach(el => el.classList.toggle('hidden', lang !== 'en'));
    skBlocks.forEach(el => el.classList.toggle('hidden', lang !== 'sk'));
    document.documentElement.lang = lang;
    // update [data-lang-*] elements (e.g. <option> which can't hold spans)
    document.querySelectorAll('[data-lang-fr],[data-lang-en],[data-lang-sk]').forEach(el => {
      const v = el.getAttribute('data-lang-' + lang); if (v != null) el.textContent = v;
    });
    // update input placeholders
    document.querySelectorAll('[data-placeholder-fr],[data-placeholder-en],[data-placeholder-sk]').forEach(el => {
      const v = el.getAttribute('data-placeholder-' + lang); if (v != null) el.placeholder = v;
    });
    // update selects with data-level-prefix (lamp level options)
    document.querySelectorAll('select[data-level-prefix]').forEach(sel => {
      let map; try { map = JSON.parse(sel.getAttribute('data-level-prefix')); } catch(e) { return; }
      const prefix = map[lang] || map.fr || 'Level';
      Array.from(sel.options).forEach(opt => { if (opt.value) opt.textContent = prefix + ' ' + opt.value; });
    });
  }

  const savedLang = localStorage.getItem('siteLang') || 'fr';
  setLanguage(savedLang);

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const lang = button.dataset.lang;
      localStorage.setItem('siteLang', lang);
      setLanguage(lang);
    });
  });
}

// run when DOM ready (covers pages that already include header in HTML)
document.addEventListener('DOMContentLoaded', initLanguage);
// also run when header is loaded dynamically
document.addEventListener('headerLoaded', initLanguage);

// optional existing features (keep if needed)
document.addEventListener('DOMContentLoaded', function() {
  const alertButton = document.getElementById('alertButton');
  if (alertButton) {
    alertButton.addEventListener('click', function() {
      alert('Welcome to the Legend of Mushroom guide!');
    });
  }
  function updateContent() {
    const contentArea = document.getElementById('contentArea');
    if (contentArea) {
      contentArea.innerHTML = '<h2>Legend of Mushroom Guide</h2><p>Here you will find all the tips and tricks to master the game!</p>';
    }
  }
  updateContent();

  // new: handle discord link clicks (copy tag + open Discord)
  document.querySelectorAll('.discord-link').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const tag = link.dataset.tag || '';
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(tag);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = tag;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          textarea.remove();
        }
        // open Discord web app in new tab to let user add friend
        window.open('https://discord.com/', '_blank', 'noopener');
        // visual feedback
        alert(`Tag Discord "${tag}" copié dans le presse-papier.`);
      } catch (err) {
        alert('Impossible de copier le tag. Copiez manuellement : ' + tag);
      }
    });
  });
});

// animated custom cursor
(function() {
  if (typeof window === 'undefined') return;
  if ('ontouchstart' in window) return; // disable on touch devices

  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  document.body.appendChild(cursor);

  const img = document.createElement('img');
  img.alt = '';
  cursor.appendChild(img);

  // primary remote animated webp + local fallback
  const remote = 'https://cdn.discordapp.com/emojis/1496257168478044270.webp?size=240&animated=true';
  const fallback = 'assets/image/bongotap.gif';

  function useFallback() {
    if (img.src.endsWith(fallback)) return;
    img.src = fallback;
  }

  img.onload = () => {};
  img.onerror = () => { useFallback(); };

  // start by trying remote
  img.src = remote;

  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let cx = mouseX, cy = mouseY;
  let visible = false;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    if (!visible) {
      visible = true;
      cursor.style.display = 'block';
    }
  });

  const LERP = 0.28;
  function raf() {
    const dx = mouseX - cx, dy = mouseY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > 200) { cx = mouseX; cy = mouseY; }
    else { cx += dx * LERP; cy += dy * LERP; }
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // show native cursor on form fields
  const nativeTargets = 'input, textarea, select, [contenteditable="true"]';
  function onEnterNative() { document.body.classList.add('show-native-cursor'); cursor.style.display = 'none'; }
  function onLeaveNative() { document.body.classList.remove('show-native-cursor'); if (visible) cursor.style.display = 'block'; }
  document.querySelectorAll(nativeTargets).forEach(el => { el.addEventListener('mouseenter', onEnterNative); el.addEventListener('mouseleave', onLeaveNative); });

  window.addEventListener('mouseleave', () => cursor.style.display = 'none');
  window.addEventListener('mouseenter', () => { if (visible) cursor.style.display = 'block'; });
})();