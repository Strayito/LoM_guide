document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('site-header');
  if (!container) return;

  try {
    const res = await fetch('assets/html/header.html', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Header fetch failed: ${res.status}`);
    container.innerHTML = await res.text();
    document.dispatchEvent(new Event('headerLoaded'));

    // preserve language choice on nav click (avoid having to re-click EN)
    container.querySelectorAll('nav a').forEach(a => {
      a.addEventListener('click', () => {
        const lang = localStorage.getItem('siteLang') || 'fr';
        localStorage.setItem('siteLang', lang);
      });
    });
  } catch (err) {
    console.error('Could not load header:', err);
    // fallback header so the page isn't left without navigation
    container.innerHTML = `
      <header class="site-header">
        <div class="header-top">
          <img src="assets/image/logo_lom.webp" alt="logo" class="site-logo">
          <h1><span class="lang-fr">LoM Guide</span><span class="lang-en hidden">LoM Guide</span></h1>
          <div class="lang-switcher">
            <button data-lang="fr" class="active">FR</button>
            <button data-lang="en">EN</button>
          </div>
        </div>
        <nav><ul><li><a href="index.html">Accueil</a></li><li><a href="guide.html">Guides</a></li></ul></nav>
      </header>`;
    document.dispatchEvent(new Event('headerLoaded'));
  }
});