* ── Guardian tab ── */
(function () {
  'use strict';
  if (typeof GUARDIAN_LIST === 'undefined') return;

  var gTab = document.getElementById('sim-tab-guardian');
  if (!gTab) return;

  /* Accordion delegation scoped to the guardian tab */
  gTab.addEventListener('click', function (e) {
    var head = e.target.closest('.acc-head');
    if (!head) return;
    var item = head.closest('.acc-item');
    if (item) item.classList.toggle('open');
  });

  var RARITY_ORDER = ['Beast','War','Wrath','Spirit','Sage','Hero'];
  var RARITY_ICON  = {Beast:'🐾',War:'⚔️',Wrath:'🔥',Spirit:'👁️',Sage:'✨',Hero:'👑'};
  function imgSrc(f) { return 'Image/Calculator_Guardian/' + encodeURIComponent(f); }
  function fmt(n) { return n.toLocaleString(); }

  /* ── 1. Overview ── */
  var overviewEl = document.getElementById('g-overview');
  var html = '';
  RARITY_ORDER.forEach(function (rarity) {
    var group = GUARDIAN_LIST.filter(function (g) { return g.rarity === rarity; });
    html += '<div class="g-section gr-' + rarity + '">';
    html += '<div class="g-section-title">' + RARITY_ICON[rarity] + ' ' + rarity + '</div>';
    html += '<div class="g-grid">';
    group.forEach(function (g) {
      var starData = GUARDIAN_STARS[g.name];
      var dispTpen = starData ? starData[0][1] : g.tpen;
      var dispTen  = starData ? starData[0][2] : g.ten;
      html += '<div class="g-card">';
      html += '<img class="g-card-img" src="' + imgSrc(g.img) + '" alt="' + g.name + '" loading="lazy"'
           + ' onerror="this.style.opacity=.3;this.src=\'data:image/svg+xml,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\'><text y=\\\'48\\\' font-size=\\\'48\\\'>🛡️</text></svg>\'">';
      html += '<div class="g-card-info">';
      html += '<div class="g-card-name">' + g.name + '</div>';
      html += '<span class="g-badge">' + rarity + '</span>';
      html += '<div class="g-stats"><span class="g-stat g-tpen">TPEN <b>' + fmt(dispTpen) + '</b></span>'
           + '<span class="g-stat g-ten">Ten. <b>' + fmt(dispTen) + '</b></span></div>';
      if (starData) {
        html += '<div class="g-stars" data-name="' + g.name + '">';
        for (var s = 1; s <= 5; s++) {
          html += '<button class="g-star-btn' + (s === 1 ? ' active' : '') + '" data-s="' + s + '">★' + s + '</button>';
        }
        html += '</div>';
      }
      html += '<div class="g-skill">' + g.skill + '</div>';
      html += '</div></div>';
    });
    html += '</div></div>';
  });
  overviewEl.innerHTML = html;

  overviewEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.g-star-btn');
    if (!btn) return;
    var starsDiv = btn.closest('.g-stars');
    var name = starsDiv.getAttribute('data-name');
    var star = parseInt(btn.getAttribute('data-s'), 10);
    var rows = GUARDIAN_STARS[name];
    if (!rows) return;
    var row = rows[star - 1];
    var card = starsDiv.closest('.g-card');
    card.querySelector('.g-tpen b').textContent = fmt(row[1]);
    card.querySelector('.g-ten b').textContent  = fmt(row[2]);
    starsDiv.querySelectorAll('.g-star-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });

  /* ── 2. Star tables ── */
  var starsEl = document.getElementById('g-stars-container');
  var stHtml = '';
  var starNames = Object.keys(GUARDIAN_STARS);
  starNames.forEach(function (name) {
    var g = GUARDIAN_LIST.find(function (x) { return x.name === name; });
    var rows = GUARDIAN_STARS[name];
    var slug = name.replace(/\s+/g, '-');
    stHtml += '<div class="acc-item" id="gacc-g-' + slug + '">';
    stHtml += '<button class="acc-head">';
    stHtml += '<img class="acc-head-img" src="' + imgSrc(g.img) + '" alt="' + name + '" loading="lazy">';
    stHtml += '<span class="acc-title" style="margin-left:.4rem">' + name + '</span>';
    stHtml += '<span class="acc-badge">' + g.rarity + '</span>';
    stHtml += '<span class="acc-chev">▼</span></button>';
    stHtml += '<div class="acc-body">';
    stHtml += '<div class="tbl-scroll"><table class="dt">';
    stHtml += '<thead><tr><th>★</th><th class="r">TPEN</th><th class="r">Δ</th>'
           + '<th class="r">Tenacity</th><th class="r">Δ</th>'
           + '<th class="r">Puissance</th><th class="r">Δ</th></tr></thead><tbody>';
    rows.forEach(function (row, i) {
      var star = row[0], tpen = row[1], ten = row[2], pow = row[3];
      var dTpen = i > 0 ? '+' + fmt(tpen - rows[i-1][1]) : '—';
      var dTen  = i > 0 ? '+' + fmt(ten  - rows[i-1][2]) : '—';
      var powN  = parseInt(pow);
      var dPow  = (i > 0 && !isNaN(powN)) ? '+' + (powN - parseInt(rows[i-1][3])) + '%' : '—';
      stHtml += '<tr><td class="hi">★' + star + '</td>'
             + '<td class="r">' + fmt(tpen) + '</td><td class="r val-teal" style="font-size:.73rem">' + dTpen + '</td>'
             + '<td class="r">' + fmt(ten)  + '</td><td class="r val-teal" style="font-size:.73rem">' + dTen  + '</td>'
             + '<td class="r val-gold">' + pow + '</td><td class="r val-dim">' + dPow + '</td></tr>';
    });
    stHtml += '</tbody></table></div></div></div>';
  });
  starsEl.innerHTML = stHtml;

  /* ── 3. Simulation ── */
  var gGuardianSel = document.getElementById('g-sim-guardian');
  var gFromSel     = document.getElementById('g-sim-from');
  var gToSel       = document.getElementById('g-sim-to');
  var gWarn        = document.getElementById('g-sim-warn');
  var gCardsEl     = document.getElementById('g-sim-cards');
  var gDuration    = document.getElementById('g-sim-duration');
  var gTimingEl    = document.getElementById('g-timing-cards');
  var gTimeline    = document.getElementById('g-timeline-bar');
  var gTlMid       = document.getElementById('g-tl-mid');
  var gTlEnd       = document.getElementById('g-tl-end');

  starNames.forEach(function (name) {
    var opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    gGuardianSel.appendChild(opt);
  });

  function renderGSim() {
    var name = gGuardianSel.value;
    var fi = parseInt(gFromSel.value);
    var ti = parseInt(gToSel.value);
    var rows = GUARDIAN_STARS[name];
    if (ti <= fi) {
      gWarn.style.display = '';
      gCardsEl.innerHTML = '';
    } else {
      gWarn.style.display = 'none';
      var from = rows[fi], to = rows[ti];
      var dTpen = to[1] - from[1], dTen = to[2] - from[2];
      var dPow  = parseInt(to[3]) - parseInt(from[3]);
      var pTpen = ((dTpen / from[1]) * 100).toFixed(1);
      var pTen  = ((dTen  / from[2]) * 100).toFixed(1);
      function card(label, fv, tv, delta, pct, color) {
        return '<div class="gsim-card"><div class="gsim-card-label">' + label + '</div>'
          + '<div class="gsim-card-val" style="color:' + color + '">' + fmt(fv) + ' → ' + fmt(tv) + '</div>'
          + '<div class="gsim-card-delta">+' + fmt(delta) + ' (+' + pct + ')</div></div>';
      }
      gCardsEl.innerHTML =
        card('TPEN', from[1], to[1], dTpen, pTpen + '%', 'var(--teal)') +
        card('Tenacity', from[2], to[2], dTen, pTen + '%', 'var(--blue)') +
        '<div class="gsim-card"><div class="gsim-card-label">Puissance Globale</div>'
          + '<div class="gsim-card-val" style="color:var(--gold)">' + from[3] + ' → ' + to[3] + '</div>'
          + '<div class="gsim-card-delta">+' + dPow + '%</div></div>';
    }
    renderGTiming();
  }

  function renderGTiming() {
    var D = Math.max(1, parseInt(gDuration.value) || 60);
    var summons = [];
    for (var t = 2; t <= D; t += 15) summons.push(t);
    var count = summons.length, stacks = Math.min(8, count);
    gTimingEl.innerHTML =
      '<div class="gtiming-card"><div class="gtiming-val">' + count + '</div>'
        + '<div class="gtiming-unit">Invocations en ' + D + 's</div></div>'
      + '<div class="gtiming-card"><div class="gtiming-val">' + stacks + '/8</div>'
        + '<div class="gtiming-unit">Stacks Final DMG Boost</div></div>'
      + '<div class="gtiming-card"><div class="gtiming-val">+' + (stacks * 10) + '%</div>'
        + '<div class="gtiming-unit">Boost Dégâts Final</div></div>';
    gTlMid.textContent = Math.round(D / 2) + 's';
    gTlEnd.textContent = D + 's';
    gTimeline.innerHTML = summons.map(function (t) {
      var w0 = t, w1 = Math.min(t + 10, D);
      return '<div class="gtl-segment" style="left:' + (w0/D*100).toFixed(2) + '%;width:' + ((w1-w0)/D*100).toFixed(2) + '%;background:var(--teal);opacity:.75"></div>';
    }).join('');
  }

  gGuardianSel.addEventListener('change', renderGSim);
  gFromSel.addEventListener('change', renderGSim);
  gToSel.addEventListener('change', renderGSim);
  gDuration.addEventListener('input', renderGTiming);
  renderGSim();

  /* ── 4. Combat 1v1 ── */
  (function () {
    var cbPSel   = document.getElementById('cb-p-guardian');
    var cbESel   = document.getElementById('cb-e-guardian');
    var cbPStar  = document.getElementById('cb-p-star');
    var cbEStar  = document.getElementById('cb-e-star');
    var cbPImg   = document.getElementById('cb-p-img');
    var cbEImg   = document.getElementById('cb-e-img');
    var cbPName  = document.getElementById('cb-p-name');
    var cbEName  = document.getElementById('cb-e-name');
    var cbPRar   = document.getElementById('cb-p-rarity');
    var cbERar   = document.getElementById('cb-e-rarity');
    var cbPTpenB = document.getElementById('cb-p-tpen-base');
    var cbETpenB = document.getElementById('cb-e-tpen-base');
    var cbPTenB  = document.getElementById('cb-p-ten-base');
    var cbETenB  = document.getElementById('cb-e-ten-base');
    var cbPTpenV = document.getElementById('cb-p-tpen-var');
    var cbETpenV = document.getElementById('cb-e-tpen-var');
    var cbPTenV  = document.getElementById('cb-p-ten-var');
    var cbETenV  = document.getElementById('cb-e-ten-var');
    var cbPTpenN = document.getElementById('cb-p-tpen-bonus');
    var cbETpenN = document.getElementById('cb-e-tpen-bonus');
    var cbPTenN  = document.getElementById('cb-p-ten-bonus');
    var cbETenN  = document.getElementById('cb-e-ten-bonus');
    var cbPTpenT = document.getElementById('cb-p-tpen-total');
    var cbETpenT = document.getElementById('cb-e-tpen-total');
    var cbPTenT  = document.getElementById('cb-p-ten-total');
    var cbETenT  = document.getElementById('cb-e-ten-total');
    var cbDur    = document.getElementById('cb-duration');
    var cbRes    = document.getElementById('cb-results');
    var cbChrt   = document.getElementById('cb-chart');
    if (!cbPSel || !cbESel || !cbPStar || !cbEStar || !cbDur || !cbRes || !cbChrt) return;

    GUARDIAN_LIST.forEach(function (g) {
      [cbPSel, cbESel].forEach(function (sel) {
        var o = document.createElement('option');
        o.value = g.name;
        o.textContent = g.name + ' (' + g.rarity + ')';
        sel.appendChild(o);
      });
    });

    function readBase(el) {
      return parseInt((el.textContent || '').replace(/[\s,]/g, '')) || 0;
    }

    /* Total = (Gardien★ + Remold) × (1 + Global%/100) */
    function setTotal(totEl, baseEl, varEl, bonEl, color) {
      var b = readBase(baseEl);
      var v = Math.round(parseFloat(varEl.value) || 0);
      var g = parseFloat(bonEl.value) || 0;
      var total = b ? Math.round((b + v) * (1 + g / 100)) : 0;
      totEl.querySelector('span:last-child').textContent = b ? fmt(total) : '—';
      totEl.querySelector('span:last-child').style.color = color;
      return total;
    }

    function fillPanel(sel, starSel, imgEl, nameEl, rarEl, tpenBEl, tenBEl) {
      var g = GUARDIAN_LIST.find(function (x) { return x.name === sel.value; });
      var stars = g ? GUARDIAN_STARS[g.name] : null;
      starSel.style.opacity = (g && stars) ? '1' : '.4';
      if (g) {
        var star = parseInt(starSel.value) || 1;
        var row  = stars ? stars[star - 1] : null;
        imgEl.src = imgSrc(g.img);
        imgEl.style.opacity = '1';
        nameEl.textContent  = g.name;
        rarEl.textContent   = g.rarity;
        tpenBEl.textContent = fmt(row ? row[1] : g.tpen);
        tenBEl.textContent  = fmt(row ? row[2] : g.ten);
      } else {
        imgEl.src = '';
        imgEl.style.opacity = '.15';
        nameEl.textContent  = '— Aucun —';
        rarEl.textContent   = '';
        tpenBEl.textContent = '—';
        tenBEl.textContent  = '—';
      }
    }

    function renderCombat() {
      var D = Math.max(1, parseInt(cbDur.value) || 60);

      var pTPEN = setTotal(cbPTpenT, cbPTpenB, cbPTpenV, cbPTpenN, 'var(--teal)');
      var pTEN  = setTotal(cbPTenT,  cbPTenB,  cbPTenV,  cbPTenN,  '#5599ff');
      var eTPEN = setTotal(cbETpenT, cbETpenB, cbETpenV, cbETpenN, '#e04040');
      var eTEN  = setTotal(cbETenT,  cbETenB,  cbETenV,  cbETenN,  '#5599ff');

      var summons = [];
      for (var t = 2; t <= D; t += 15) summons.push(t);
      var count  = summons.length;
      var stacks = Math.min(8, count);
      var boost  = stacks * 10;

      /*
       * Le gardien perd naturellement 10 % de sa Ténacité max / seconde
       * (→ mort automatique en 10 s sans TPEN ennemi).
       * En combat, le TPEN ennemi s'ajoute à cette décroissance naturelle.
       *
       * Drain total / s  = Ténacité × 0.10  +  TPEN_ennemi
       * Survie (s)       = Ténacité / (Ténacité × 0.10 + TPEN_ennemi)
       *                  = min(10s, résultat)
       */
      var survP = pTEN > 0 ? Math.min(10, pTEN / (pTEN * 0.10 + eTPEN)) : 0;
      var survE = eTEN > 0 ? Math.min(10, eTEN / (eTEN * 0.10 + pTPEN)) : 0;
      var dmgP  = Math.round(pTPEN * survP);
      var dmgE  = Math.round(eTPEN * survE);
      var totP  = dmgP * count;
      var totE  = dmgE * count;

      var noData = !readBase(cbPTpenB) && !readBase(cbETpenB);

      var verdict, vColor;
      if (noData)           { verdict = 'Sélectionnez deux gardiens pour commencer';      vColor = 'var(--text-muted)'; }
      else if (totP > totE) { verdict = '🏆 Avantage Joueur — dégâts totaux supérieurs'; vColor = 'var(--teal)'; }
      else if (totE > totP) { verdict = '⚔️ Avantage Ennemi — l\'ennemi inflige plus';   vColor = '#e04040'; }
      else                  { verdict = '⚔️ Duel équilibré — dégâts totaux égaux';       vColor = 'var(--gold)'; }

      function rbox(lbl, val, sub, col) {
        var rgb = col === 'var(--teal)' ? '32,212,168'
                : col === '#e04040'     ? '224,64,64'
                : col === '#5599ff'     ? '85,153,255'
                :                        '232,192,64';
        return '<div class="gcombat-res-box" style="background:rgba(' + rgb + ',.07);border:1px solid rgba(' + rgb + ',.22)">'
          + '<div class="gcombat-res-box-lbl" style="color:' + col + '">' + lbl + '</div>'
          + '<div class="gcombat-res-box-val" style="color:' + col + '">' + val + '</div>'
          + '<div class="gcombat-res-box-sub">' + sub + '</div>'
          + '</div>';
      }

      var subP = noData ? '—'
        : 'Tén.' + fmt(pTEN) + ' ÷ (Tén.×0.1 + TPEN' + fmt(eTPEN) + ')';
      var subE = noData ? '—'
        : 'Tén.' + fmt(eTEN) + ' ÷ (Tén.×0.1 + TPEN' + fmt(pTPEN) + ')';

      cbRes.innerHTML =
        '<div class="gcombat-results">'
          + rbox('Invocations', count + '×', 'sur ' + D + 's', 'var(--teal)')
          + rbox('Survie/fen. (Vous)',   noData ? '—' : survP.toFixed(2) + 's', subP, '#5599ff')
          + rbox('Survie/fen. (Ennemi)', noData ? '—' : survE.toFixed(2) + 's', subE, '#5599ff')
          + rbox('Dégâts/inv. (Vous)',   noData ? '—' : fmt(dmgP),
                 'TPEN ' + fmt(pTPEN) + ' × ' + survP.toFixed(2) + 's', 'var(--teal)')
          + rbox('Dégâts/inv. (Ennemi)', noData ? '—' : fmt(dmgE),
                 'TPEN ' + fmt(eTPEN) + ' × ' + survE.toFixed(2) + 's', '#e04040')
          + rbox('Stacks Boost', stacks + '/8', '+' + boost + '% Final DMG', 'var(--gold)')
          + rbox('Total (Vous)',   noData ? '—' : fmt(totP),
                 count + ' invocation' + (count > 1 ? 's' : ''), 'var(--teal)')
          + rbox('Total (Ennemi)', noData ? '—' : fmt(totE),
                 count + ' invocation' + (count > 1 ? 's' : ''), '#e04040')
          + rbox('Bilan net', noData ? '—' : (totP >= totE ? '+' : '') + fmt(totP - totE),
                 totP >= totE ? 'Avantage joueur' : 'Avantage ennemi',
                 totP >= totE ? 'var(--teal)' : '#e04040')
        + '</div>'
        + '<div class="gcombat-verdict" style="color:' + vColor + ';border-color:' + vColor + ';background:rgba(0,0,0,.18)">' + verdict + '</div>'
        + '<div class="info-note" style="margin-bottom:.75rem;font-size:.72rem">'
        + '📐 Survie = Ténacité ÷ (Ténacité×0.1 + TPEN_ennemi) · '
        + 'le gardien perd 10 % de sa Ténacité max/s naturellement · '
        + 'Dégâts/inv. = TPEN × Survie'
        + '</div>';

      renderCombatChart(summons, D, pTPEN, eTPEN, survP, survE);
    }

    function renderCombatChart(summons, D, pTPEN, eTPEN, survP, survE) {
      function buildLane(tpen, surv, bgFull, bgDead) {
        return summons.map(function (t, i) {
          var activeEnd = Math.min(t + surv, D);
          var deadEnd   = Math.min(t + 10, D);
          var pctAct0 = (t / D * 100).toFixed(2) + '%';
          var pctActW = ((activeEnd - t) / D * 100).toFixed(2) + '%';
          var pctDed0 = (activeEnd / D * 100).toFixed(2) + '%';
          var pctDedW = ((deadEnd - activeEnd) / D * 100).toFixed(2) + '%';
          var dmg = Math.round(tpen * surv);
          var lbl = dmg >= 10000 ? (dmg / 1000).toFixed(0) + 'k' : fmt(dmg);
          var tip = 'Invocation ' + (i + 1) + ' · t=' + t + 's · Survie=' + surv.toFixed(2) + 's · Dégâts: ' + fmt(dmg);
          var segs = '<div class="gcombat-seg" style="left:' + pctAct0 + ';width:' + pctActW + ';background:' + bgFull + '" title="' + tip + '">' + lbl + '</div>';
          if (deadEnd > activeEnd) {
            segs += '<div class="gcombat-seg" style="left:' + pctDed0 + ';width:' + pctDedW + ';background:' + bgDead + '" title="Gardien mort (HP épuisés)"></div>';
          }
          return segs;
        }).join('');
      }

      var count = summons.length;
      var tickN = Math.min(8, Math.max(2, count + 1));
      var ticks = [];
      for (var i = 0; i <= tickN; i++) ticks.push(Math.round(D * i / tickN) + 's');

      cbChrt.innerHTML =
        '<div class="gcombat-chart-title">📊 Timeline des invocations · ' + count + '× sur ' + D + 's</div>'
        + '<div style="display:flex;gap:1rem;font-size:.64rem;color:var(--text-muted);margin-bottom:.65rem">'
          + '<span><span style="display:inline-block;width:10px;height:8px;background:rgba(32,212,168,.85);border-radius:2px;vertical-align:middle;margin-right:3px"></span>Actif (survie)</span>'
          + '<span><span style="display:inline-block;width:10px;height:8px;background:rgba(32,212,168,.18);border-radius:2px;vertical-align:middle;margin-right:3px"></span>Mort (−10%/s)</span>'
          + '<span style="margin-left:auto;font-size:.6rem">Survol = détail par invocation</span>'
        + '</div>'
        + '<div class="gcombat-lane">'
          + '<div class="gcombat-lane-lbl" style="color:var(--teal)">👤 Vous</div>'
          + '<div class="gcombat-lane-bar">' + buildLane(pTPEN, survP, 'rgba(32,212,168,.85)', 'rgba(32,212,168,.14)') + '</div>'
        + '</div>'
        + '<div class="gcombat-lane">'
          + '<div class="gcombat-lane-lbl" style="color:#e04040">⚔️ Ennemi</div>'
          + '<div class="gcombat-lane-bar">' + buildLane(eTPEN, survE, 'rgba(224,64,64,.85)', 'rgba(224,64,64,.14)') + '</div>'
        + '</div>'
        + '<div class="gcombat-axis">' + ticks.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>';
    }

    cbPSel.addEventListener('change', function () {
      fillPanel(cbPSel, cbPStar, cbPImg, cbPName, cbPRar, cbPTpenB, cbPTenB);
      renderCombat();
    });
    cbESel.addEventListener('change', function () {
      fillPanel(cbESel, cbEStar, cbEImg, cbEName, cbERar, cbETpenB, cbETenB);
      renderCombat();
    });
    cbPStar.addEventListener('change', function () {
      fillPanel(cbPSel, cbPStar, cbPImg, cbPName, cbPRar, cbPTpenB, cbPTenB);
      renderCombat();
    });
    cbEStar.addEventListener('change', function () {
      fillPanel(cbESel, cbEStar, cbEImg, cbEName, cbERar, cbETpenB, cbETenB);
      renderCombat();
    });
    [cbPTpenV, cbPTenV, cbETpenV, cbETenV, cbPTpenN, cbPTenN, cbETpenN, cbETenN, cbDur].forEach(function (el) {
      el.addEventListener('input', renderCombat);
    });
    renderCombat();
  })();







})();