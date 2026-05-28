(function () {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────────────────────
  function n(id) { return document.getElementById(id); }
  function parseK(s){var u=String(s).trim().replace(/\s/g,'').toUpperCase();if(u.endsWith('K'))return(parseFloat(u)||0)*1e3;if(u.endsWith('B'))return(parseFloat(u)||0)*1e6;return parseFloat(u)||0;}
  function v(id){return parseK(n(id).value);}
  function isChecked(id) { return n(id).checked; }
  function fmt(x){var a=Math.abs(x);if(a>=1e6)return(x/1e6).toFixed(2)+'B';if(a>=1e3)return(x/1e3).toFixed(2)+'K';return x.toFixed(2);}
  function fmtDec(x, d) { return x.toFixed(d === undefined ? 2 : d); }

  // ── i18n ─────────────────────────────────────────────────────────────────
  function getLang() { return localStorage.getItem('siteLang') || 'fr'; }
  var i18n = {
    noEntries:  { fr: 'Aucune entrée sauvegardée', en: 'No saved entries', sk: 'Žiadne uložené záznamy' },
    unpin:      { fr: 'Désépingler', en: 'Unpin', sk: 'Odopnúť' },
    pin:        { fr: 'Épingler', en: 'Pin', sk: 'Pripnúť' },
    pinCompare: { fr: 'Épingler pour comparer', en: 'Pin to compare', sk: 'Pripnúť pre porovnanie' },
    delete:     { fr: 'Supprimer', en: 'Delete', sk: 'Vymazať' },
    comparison: { fr: '📊 Comparaison', en: '📊 Comparison', sk: '📊 Porovnanie' },
    pinned:     { fr: '📌 Épinglé', en: '📌 Pinned', sk: '📌 Pripnuté' },
    current:    { fr: '🔵 Actuel', en: '🔵 Current', sk: '🔵 Aktuálne' }
  };
  function t(key) { var l = getLang(); return (i18n[key] && i18n[key][l]) || i18n[key].fr; }
  function fmtDate(ts) {
    var locales = { fr: 'fr-FR', en: 'en-GB', sk: 'sk-SK' };
    var loc = locales[getLang()] || 'fr-FR';
    var d = new Date(ts);
    return d.toLocaleDateString(loc) + ' ' + d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
  }

  // ── Tab switching ─────────────────────────────────────────────────────────
  function initTabs() {
    var tabs = document.getElementById('calcTabs');
    if (!tabs) return;
    tabs.addEventListener('click', function (e) {
      var btn = e.target.closest('.tab-btn');
      if (!btn) return;
      var tab = btn.dataset.tab;
      tabs.querySelectorAll('.tab-btn').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      document.querySelectorAll('.tab-content').forEach(function (tc) {
        tc.classList.toggle('active', tc.id === 'tab-' + tab);
      });
    });
  }

  // ── Damage Calculator (dc-*) ──────────────────────────────────────────────
  function calcDamage() {
    // Step 1 — ATK
    var atkBase = v('dc-atkBase');
    var atkPark = isChecked('dc-atkParking') ? v('dc-atkParkPct') : 0;
    var atkBuff = v('dc-atkBuff');
    var atkExcl = v('dc-atkExcl');
    var atk = (atkBase * (1 + atkPark / 100)) * (1 + atkBuff / 100) + atkExcl;

    // Step 1 — DEF
    var defBase = v('dc-defBase');
    var defPark = isChecked('dc-defParking') ? v('dc-defParkPct') : 0;
    var defBuff = v('dc-defBuff');
    var defExcl = v('dc-defExcl');
    var def = (defBase * (1 + defPark / 100)) * (1 + defBuff / 100) + defExcl;

    var spread = Math.max(1, atk - def);

    // Step 2 — Final Multiplier
    var skillMult = v('dc-skillMult');
    var buffAdd = v('dc-buffAdd');
    var buffMult = v('dc-buffMult');
    var buffExcl = v('dc-buffExcl');
    var dmgMult = v('dc-dmgMult');
    var finalMult = (skillMult + buffAdd) / 100 * (1 + buffMult / 100) + buffExcl / 100;

    // Step 3 — A
    var A = spread * finalMult * dmgMult / 100;

    // Step 4 — B (crit)
    var atkType = n('dc-atkType').value;
    var B = A;
    var critLabel = '—';
    if (atkType === 'crit') {
      var critMult = v('dc-critMult');
      var critRES = Math.max(50, v('dc-critRES'));
      B = A * critMult / critRES;
      critLabel = 'A × ' + critMult + '% ÷ ' + fmtDec(critRES, 1) + '%';
    } else if (atkType === 'skillcrit') {
      var skillCritMult = v('dc-skillCritMult');
      B = Math.pow(A * (1 + skillCritMult / 100), 0.98);
      critLabel = '{A × ' + fmtDec(1 + skillCritMult / 100, 3) + '}^0.98';
    }

    // Step 5 — C (after resistances)
    var someRES = v('dc-someRES');
    var dmgRES = Math.min(80, v('dc-dmgRES'));
    var buffFinal = v('dc-buffFinal');
    var C = B * (1 - someRES / 100) * (1 - dmgRES / 100) * (1 + buffFinal / 100);

    // Step 6 — Final
    var context = n('dc-context').value;
    var classVal = n('dc-class').value;
    var pveBonusMap = { sword: 1.10, axe: 1.05, magic: 1.00 };
    var pveBonus = pveBonusMap[classVal] || 1;
    var pvpDecrease = Math.max(0.01, v('dc-pvpDecrease'));
    var bossDmgRES = v('dc-bossDmgRES');
    var bossDmgPct = v('dc-bossDmgPct');

    var final = C;
    var fromBoss = 0, toBoss = 0;
    if (context === 'pve') {
      final = C * pveBonus;
    } else if (context === 'pvp') {
      final = C / pvpDecrease;
    } else if (context === 'boss') {
      var pve = C * pveBonus;
      toBoss = pve * (1 + bossDmgPct / 100);
      fromBoss = C * (1 - bossDmgRES / 100);
      final = toBoss;
    }

    // Update DOM
    n('dc-r-atk').textContent = fmt(atk);
    n('dc-r-def').textContent = fmt(def);
    n('dc-r-spread').textContent = fmt(spread);
    n('dc-r-finalmult').textContent = fmtDec(finalMult, 4) + '×';
    n('dc-r-A').textContent = fmt(A);
    n('dc-r-crittype').innerHTML = atkType === 'normal' ? '—' : critLabel;
    n('dc-r-B').textContent = atkType === 'normal' ? '—' : fmt(B);
    n('dc-r-C').textContent = fmt(C);
    n('dc-r-final-val').textContent = fmt(final);

    var bossRow = n('dc-r-boss-row');
    if (context === 'boss') {
      bossRow.style.display = '';
      n('dc-r-fromboss').textContent = fmt(fromBoss);
      n('dc-r-toboss').textContent = fmt(toBoss);
    } else {
      bossRow.style.display = 'none';
    }
  }

  function initDamageCalc() {
    var form = document.getElementById('dmg-calc-form');
    if (!form) return;

    n('dc-atkParking').addEventListener('change', function () {
      n('dc-atkpark-section').classList.toggle('hidden', !this.checked);
      calcDamage();
    });
    n('dc-defParking').addEventListener('change', function () {
      n('dc-defpark-section').classList.toggle('hidden', !this.checked);
      calcDamage();
    });
    n('dc-atkType').addEventListener('change', function () {
      n('dc-crit-section').classList.toggle('hidden', this.value !== 'crit');
      n('dc-skillcrit-section').classList.toggle('hidden', this.value !== 'skillcrit');
      calcDamage();
    });
    n('dc-context').addEventListener('change', function () {
      var isPvP = this.value === 'pvp';
      var isBoss = this.value === 'boss';
      n('dc-pve-section').classList.toggle('hidden', isPvP);
      n('dc-pvp-section').classList.toggle('hidden', !isPvP);
      n('dc-boss-section').classList.toggle('hidden', !isBoss);
      calcDamage();
    });

    form.addEventListener('input', calcDamage);
    calcDamage();
  }

  // ── Yuko Formula Calculator (yk-*) ────────────────────────────────────────
  var YK_KEY = 'yk_history';
  var YK_MAX = 10;
  var ykDmgType = 'basic';
  var ykCritType = 'none';
  var ykCtx = 'pve';
  var ykPinned = null;
  var ykCurrentResult = null;

  var ykTypeLabels = { basic: 'ATQ Basique', combo: 'Combo', counter: 'Contre-attaque', skill: 'Compétence' };
  var ykCritSuffix = { none: '', normal: ' + Crit', skill: ' + Skill Crit' };
  var ykCtxLabels = { pve: 'PvE', pvp: 'PvP', boss: 'Boss' };

  function ykGet(id) { var el = n(id); return el ? parseK(el.value) : 0; }

  function calcYuko() {
    // Final ATK
    var atkFlat = ykGet('yk-atk-flat');
    var atkBase = ykGet('yk-atk-base');
    var atkGlobal = ykGet('yk-atk-global');
    var finalATK = atkFlat * (1 + atkBase / 100) * (1 + atkGlobal / 100);

    // Final DEF
    var defFlat = ykGet('yk-def-flat');
    var defBase = ykGet('yk-def-base');
    var defGlobal = ykGet('yk-def-global');
    var finalDEF = defFlat * (1 + defBase / 100) * (1 + defGlobal / 100);

    n('yk-atk-preview').textContent = fmt(finalATK);
    n('yk-def-preview').textContent = fmt(finalDEF);

    var spread = Math.max(1, finalATK - finalDEF);

    // Multiplier by damage type
    var finalMult = 0;
    if (ykDmgType === 'basic') {
      var bMult = ykGet('yk-basic-mult');
      var bBonus = ykGet('yk-basic-dmg-bonus');
      var bGlobal = ykGet('yk-basic-global');
      finalMult = bMult / 100 * (1 + bBonus / 100) * (1 + bGlobal / 100);
    } else if (ykDmgType === 'combo') {
      var cMult = ykGet('yk-combo-mult');
      var cBonus = ykGet('yk-combo-dmg-bonus');
      var cGlobal = ykGet('yk-combo-global');
      finalMult = cMult / 100 * (1 + cBonus / 100) * (1 + cGlobal / 100);
    } else if (ykDmgType === 'counter') {
      var ctMult = ykGet('yk-counter-mult');
      var ctBonus = ykGet('yk-counter-dmg-bonus');
      var ctGlobal = ykGet('yk-counter-global');
      finalMult = ctMult / 100 * (1 + ctBonus / 100) * (1 + ctGlobal / 100);
    } else if (ykDmgType === 'skill') {
      var sMult = ykGet('yk-skill-mult');
      var sPlayer = ykGet('yk-skill-player-dmg');
      var sGlobal = ykGet('yk-skill-global');
      finalMult = sMult / 100 * sPlayer / 100 * (1 + sGlobal / 100);
    }

    var baseDmg = spread * finalMult;

    // Crit
    var afterCrit = baseDmg;
    if (ykCritType === 'normal') {
      var critDmgPct = ykGet('yk-crit-dmg');
      var critRES = Math.max(50, ykGet('yk-crit-res'));
      afterCrit = baseDmg * critDmgPct / critRES;
    } else if (ykCritType === 'skill') {
      var skillCritBonus = ykGet('yk-skill-crit-dmg');
      afterCrit = Math.pow(baseDmg * (1 + skillCritBonus / 100), 0.98);
    }

    // Resistances (each capped at 80%)
    var typeRES = Math.min(80, ykGet('yk-type-res'));
    var dmgRES = Math.min(80, ykGet('yk-dmg-res'));
    var afterRES = afterCrit * (1 - typeRES / 100) * (1 - dmgRES / 100);

    // Context
    var finalDmg = afterRES;
    if (ykCtx === 'pvp') {
      var pvpFactor = Math.max(1, ykGet('yk-pvp-factor'));
      finalDmg = afterRES / pvpFactor;
    } else if (ykCtx === 'boss') {
      var bossDmgBonus = ykGet('yk-boss-dmg');
      finalDmg = afterRES * (1 + bossDmgBonus / 100);
    }

    // Update results DOM
    n('yk-r-final-atk').textContent = fmt(finalATK);
    n('yk-r-final-def').textContent = fmt(finalDEF);
    n('yk-r-spread').textContent = fmt(spread);
    n('yk-r-mult').textContent = fmtDec(finalMult, 4) + '×';
    n('yk-r-base').textContent = fmt(baseDmg);
    n('yk-r-after-crit').textContent = ykCritType === 'none' ? '—' : fmt(afterCrit);
    n('yk-r-after-res').textContent = fmt(afterRES);
    n('yk-r-final').textContent = fmt(finalDmg);

    ykCurrentResult = {
      type: ykDmgType,
      crit: ykCritType,
      ctx: ykCtx,
      finalATK: Math.round(finalATK),
      finalDEF: Math.round(finalDEF),
      spread: Math.round(spread),
      mult: finalMult,
      baseDmg: Math.round(baseDmg),
      afterCrit: Math.round(afterCrit),
      afterRES: Math.round(afterRES),
      final: Math.round(finalDmg),
      ts: Date.now()
    };

    ykRenderCompare();
  }

  function ykLoadHistory() {
    try { return JSON.parse(localStorage.getItem(YK_KEY)) || []; } catch (e) { return []; }
  }

  function ykSave() {
    if (!ykCurrentResult) return;
    var entry = Object.assign({}, ykCurrentResult, { ts: Date.now() });
    var hist = ykLoadHistory();
    hist.unshift(entry);
    if (hist.length > YK_MAX) hist.pop();
    localStorage.setItem(YK_KEY, JSON.stringify(hist));
    ykRenderHistory();
  }

  function ykRenderHistory() {
    var list = n('yk-history-list');
    var hist = ykLoadHistory();
    if (!hist.length) {
      list.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:16px 0">' + t('noEntries') + '</div>';
      return;
    }
    list.innerHTML = hist.map(function (entry, i) {
      var ds = fmtDate(entry.ts);
      var lbl = (ykTypeLabels[entry.type] || entry.type) + (ykCritSuffix[entry.crit] || '') + ' — ' + (ykCtxLabels[entry.ctx] || entry.ctx);
      var pinned = ykPinned && ykPinned.ts === entry.ts;
      return '<div class="yk-history-entry' + (pinned ? ' yk-pinned' : '') + '">'
        + '<div class="yk-entry-info"><span class="yk-entry-label">' + lbl + '</span><span class="yk-entry-date">' + ds + '</span></div>'
        + '<div class="yk-entry-val">' + fmt(entry.final) + '</div>'
        + '<div class="yk-entry-actions">'
        + '<button class="yk-action-btn yk-pin-btn" data-i="' + i + '" title="' + (pinned ? t('unpin') : t('pinCompare')) + '">📌</button>'
        + '<button class="yk-action-btn yk-del-btn" data-i="' + i + '" title="' + t('delete') + '">🗑️</button>'
        + '</div></div>';
    }).join('');

    list.querySelectorAll('.yk-pin-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.dataset.i);
        var h = ykLoadHistory();
        ykPinned = (ykPinned && ykPinned.ts === h[idx].ts) ? null : h[idx];
        ykRenderHistory();
        ykRenderCompare();
      });
    });
    list.querySelectorAll('.yk-del-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.dataset.i);
        var h = ykLoadHistory();
        if (ykPinned && ykPinned.ts === h[idx].ts) ykPinned = null;
        h.splice(idx, 1);
        localStorage.setItem(YK_KEY, JSON.stringify(hist));
        ykRenderHistory();
        ykRenderCompare();
      });
    });
  }

  function ykRenderCompare() {
    var panel = n('yk-compare-panel');
    if (!ykPinned || !ykCurrentResult) { panel.style.display = 'none'; return; }
    panel.style.display = '';
    var cur = ykCurrentResult;
    var pin = ykPinned;
    var diff = cur.final - pin.final;
    var diffPct = pin.final ? fmtDec(diff / pin.final * 100, 1) : '—';
    var diffColor = diff >= 0 ? 'var(--teal)' : '#e05c6f';
    var sign = diff >= 0 ? '+' : '';
    panel.innerHTML =
      '<div class="yk-compare-header">' + t('comparison') + '</div>'
      + '<div class="yk-compare-grid">'
      + '<div class="yk-compare-col">'
      + '<div class="yk-compare-lbl">' + t('pinned') + '</div>'
      + '<div style="font-size:0.8rem;color:var(--orange)">ATK: ' + fmt(pin.finalATK) + '</div>'
      + '<div style="font-size:0.8rem;color:var(--blue)">DEF: ' + fmt(pin.finalDEF) + '</div>'
      + '<div style="font-size:1.05rem;font-weight:700;color:var(--gold);margin-top:4px">' + fmt(pin.final) + '</div>'
      + '<div style="font-size:0.72rem;color:var(--text-muted)">' + (ykTypeLabels[pin.type] || pin.type) + (ykCritSuffix[pin.crit] || '') + ' • ' + (ykCtxLabels[pin.ctx] || pin.ctx) + '</div>'
      + '</div>'
      + '<div style="font-weight:900;color:var(--text-muted);font-size:0.9rem;align-self:center">VS</div>'
      + '<div class="yk-compare-col">'
      + '<div class="yk-compare-lbl">' + t('current') + '</div>'
      + '<div style="font-size:0.8rem;color:var(--orange)">ATK: ' + fmt(cur.finalATK) + '</div>'
      + '<div style="font-size:0.8rem;color:var(--blue)">DEF: ' + fmt(cur.finalDEF) + '</div>'
      + '<div style="font-size:1.05rem;font-weight:700;color:var(--gold);margin-top:4px">' + fmt(cur.final) + '</div>'
      + '<div style="font-size:0.72rem;color:var(--text-muted)">' + (ykTypeLabels[cur.type] || cur.type) + (ykCritSuffix[cur.crit] || '') + ' • ' + (ykCtxLabels[cur.ctx] || cur.ctx) + '</div>'
      + '</div></div>'
      + '<div style="text-align:center;font-size:1rem;font-weight:700;color:' + diffColor + ';margin-top:10px;padding:8px;background:var(--bg-secondary);border-radius:var(--r)">'
      + sign + fmt(diff) + ' (' + sign + diffPct + '%)</div>';
  }

  function initYukoCalc() {
    var tab = document.getElementById('tab-yuko');
    if (!tab) return;

    tab.querySelectorAll('.yk-type-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tab.querySelectorAll('.yk-type-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        ykDmgType = this.dataset.type;
        tab.querySelectorAll('.yk-type-section').forEach(function (s) { s.classList.add('hidden'); });
        var sec = n('yk-sec-' + ykDmgType);
        if (sec) sec.classList.remove('hidden');
        calcYuko();
      });
    });

    tab.querySelectorAll('.yk-crit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tab.querySelectorAll('.yk-crit-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        ykCritType = this.dataset.crit;
        n('yk-crit-normal-inputs').classList.toggle('hidden', ykCritType !== 'normal');
        n('yk-crit-skill-inputs').classList.toggle('hidden', ykCritType !== 'skill');
        calcYuko();
      });
    });

    tab.querySelectorAll('.yk-ctx-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tab.querySelectorAll('.yk-ctx-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        ykCtx = this.dataset.ctx;
        n('yk-pvp-inputs').classList.toggle('hidden', ykCtx !== 'pvp');
        n('yk-boss-inputs').classList.toggle('hidden', ykCtx !== 'boss');
        calcYuko();
      });
    });

    n('yk-save-btn').addEventListener('click', ykSave);
    tab.addEventListener('input', calcYuko);

    ykRenderHistory();
    calcYuko();
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    initDamageCalc();
    initYukoCalc();
  });

}());
