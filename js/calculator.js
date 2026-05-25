'use strict';

// ─── i18n helper ────────────────────────────────────────────────────────────
function getLang() {
  return localStorage.getItem('siteLang') || 'fr';
}
function t(fr, en, sk) {
  var lang = getLang();
  if (lang === 'sk' && sk) return sk;
  return lang === 'fr' ? fr : en;
}

// ─── Stat Calculator ───────────────────────────────────────────────────────

function calcStat(finalBase, parkingAdditional, isParking, totalBuffDebuff, exclusiveBonus) {
  var parkingFactor = isParking ? (100 + parkingAdditional) / 100 : 1;
  var buffFactor    = (100 + totalBuffDebuff) / 100;
  return finalBase * parkingFactor * buffFactor + exclusiveBonus;
}

function updateStatCalc() {
  var isParking = document.getElementById('sc-parking').checked;

  var finalATK  = parseFloat(document.getElementById('sc-finalATK').value)  || 0;
  var finalDEF  = parseFloat(document.getElementById('sc-finalDEF').value)  || 0;
  var parkingPct = parseFloat(document.getElementById('sc-parkingPct').value) || 0;
  var buffPct    = parseFloat(document.getElementById('sc-buffDebuff').value)  || 0;
  var exclATK    = parseFloat(document.getElementById('sc-exclATK').value)    || 0;
  var exclDEF    = parseFloat(document.getElementById('sc-exclDEF').value)    || 0;

  var calcATK = calcStat(finalATK, parkingPct, isParking, buffPct, exclATK);
  var calcDEF = calcStat(finalDEF, parkingPct, isParking, buffPct, exclDEF);

  document.getElementById('sc-out-atk').textContent = Math.round(calcATK).toLocaleString();
  document.getElementById('sc-out-def').textContent = Math.round(calcDEF).toLocaleString();

  // formula breakdown
  var pStr = isParking ? '× ' + ((100 + parkingPct) / 100).toFixed(4) : '× 1';
  document.getElementById('sc-breakdown-atk').textContent =
    finalATK + ' ' + pStr + ' × ' + ((100 + buffPct) / 100).toFixed(4) + ' + ' + exclATK + ' = ' + Math.round(calcATK).toLocaleString();
  document.getElementById('sc-breakdown-def').textContent =
    finalDEF + ' ' + pStr + ' × ' + ((100 + buffPct) / 100).toFixed(4) + ' + ' + exclDEF + ' = ' + Math.round(calcDEF).toLocaleString();
}

// ─── Damage Calculator ──────────────────────────────────────────────────────

function updateDmgCalc() {
  // ATK inputs
  var atkBase     = parseFloat(document.getElementById('dc-atkBase').value)     || 0;
  var atkIsParking= document.getElementById('dc-atkParking').checked;
  var atkParkPct  = parseFloat(document.getElementById('dc-atkParkPct').value)  || 0;
  var atkBuffPct  = parseFloat(document.getElementById('dc-atkBuff').value)     || 0;
  var atkExcl     = parseFloat(document.getElementById('dc-atkExcl').value)     || 0;

  // DEF inputs
  var defBase     = parseFloat(document.getElementById('dc-defBase').value)     || 0;
  var defIsParking= document.getElementById('dc-defParking').checked;
  var defParkPct  = parseFloat(document.getElementById('dc-defParkPct').value)  || 0;
  var defBuffPct  = parseFloat(document.getElementById('dc-defBuff').value)     || 0;
  var defExcl     = parseFloat(document.getElementById('dc-defExcl').value)     || 0;

  // Final Multiplier inputs
  var skillMult   = parseFloat(document.getElementById('dc-skillMult').value)   || 0;
  var buffAdd     = parseFloat(document.getElementById('dc-buffAdd').value)     || 0;
  var buffMultPct = parseFloat(document.getElementById('dc-buffMult').value)    || 0;
  var buffExclPct = parseFloat(document.getElementById('dc-buffExcl').value)    || 0;
  var dmgMultPct  = parseFloat(document.getElementById('dc-dmgMult').value)     || 100;

  // Attack type
  var atkType     = document.getElementById('dc-atkType').value;

  // Crit inputs
  var critMult    = parseFloat(document.getElementById('dc-critMult').value)    || 100;
  var critRES     = parseFloat(document.getElementById('dc-critRES').value)     || 100;

  // Skill Crit inputs
  var skillCritMult = parseFloat(document.getElementById('dc-skillCritMult').value) || 0;

  // Resistance inputs
  var someRES     = parseFloat(document.getElementById('dc-someRES').value)     || 0;
  var dmgRES      = parseFloat(document.getElementById('dc-dmgRES').value)      || 0;
  var buffFinalPct= parseFloat(document.getElementById('dc-buffFinal').value)   || 0;

  // Context
  var context     = document.getElementById('dc-context').value;
  var pvpDecrease = parseFloat(document.getElementById('dc-pvpDecrease').value) || 1;
  var playerClass = document.getElementById('dc-class').value;
  var bossDmgRES  = parseFloat(document.getElementById('dc-bossDmgRES').value)  || 0;
  var bossDmgPct  = parseFloat(document.getElementById('dc-bossDmgPct').value)  || 0;

  // ── Step 1: Calculated ATK & DEF ──
  var calcATK = calcStat(atkBase, atkParkPct, atkIsParking, atkBuffPct, atkExcl);
  var calcDEF = calcStat(defBase, defParkPct, defIsParking, defBuffPct, defExcl);

  // ── Step 2 part A: Final Multiplier ──
  var finalMult = (skillMult + buffAdd) / 100 * (100 + buffMultPct) / 100 + buffExclPct / 100;

  // ── Step 2: Base Damage A ──
  var spread = Math.max(0, calcATK - calcDEF);
  var A = spread * finalMult * dmgMultPct / 100;

  // ── Step 3: Crit / Skill Crit ──
  var B = A;
  var critLabel = t('Normal (sans crit)', 'Normal (no crit)', 'Normálny (bez kritu)');
  if (atkType === 'crit') {
    B = A * (critMult / 100) / (critRES / 100);
    critLabel = t('Dégâts Critique', 'Crit DMG', 'Kritické poškodenie');
  } else if (atkType === 'skillcrit') {
    var base = A * (1 + skillCritMult / 100);
    B = Math.pow(Math.max(0, base), 0.98);
    critLabel = t('Crit. Compétence', 'Skill Crit DMG', 'Krit. schopnosti');
  }

  // ── Step 4: Resistance → C ──
  var C = B * (100 - someRES) / 100 * (100 - dmgRES) / 100 * (100 + buffFinalPct) / 100;

  // ── Step 5: Final DMG ──
  var finalDmg = 0;
  var finalLabel = '';
  var pveBonusLabels = { sword: '×1.10 (Sword)', axe: '×1.05 (Axe)', magic: '×1.00 (Magic)' };
  var pveBonusValues = { sword: 1.10, axe: 1.05, magic: 1.00 };

  if (context === 'pvp') {
    finalDmg   = C / Math.max(0.01, pvpDecrease);
    finalLabel = t('Dégâts PvP = C ÷ ', 'PvP DMG = C ÷ ', 'PvP Poškodenie = C ÷ ') + pvpDecrease.toFixed(2);
  } else if (context === 'pve') {
    var pveMult = pveBonusValues[playerClass] || 1.0;
    finalDmg   = C * pveMult;
    finalLabel = t('Dégâts PvE = C × ', 'PvE DMG = C × ', 'PvE Poškodenie = C × ') + pveBonusLabels[playerClass];
  } else if (context === 'boss') {
    var pveMult2 = pveBonusValues[playerClass] || 1.0;
    var pveDmg   = C * pveMult2;
    var fromBoss = C * (100 - bossDmgRES) / 100;
    var toBoss   = pveDmg * (100 + bossDmgPct) / 100;
    document.getElementById('dc-r-final-label').textContent = t('Vers Boss', 'To Boss DMG', 'Poškodenie Bossa');
    document.getElementById('dc-r-final-val').textContent   = Math.round(toBoss).toLocaleString();
    document.getElementById('dc-r-boss-row').style.display  = 'block';
    document.getElementById('dc-r-fromboss').textContent    = Math.round(fromBoss).toLocaleString();
    document.getElementById('dc-r-toboss').textContent      = Math.round(toBoss).toLocaleString();

    finalDmg   = toBoss;
    finalLabel = t('Vers Boss = PvE × (100 + Boss DMG%) / 100', 'To Boss DMG = PvE × (100 + Boss DMG%) / 100', 'Poškodenie Bossa = PvE × (100 + Boss DMG%) / 100');
  }

  if (context !== 'boss') {
    document.getElementById('dc-r-boss-row').style.display = 'none';
    document.getElementById('dc-r-final-label').textContent = context === 'pvp' ? t('Dégâts PvP', 'PvP DMG', 'PvP Poškodenie') : t('Dégâts PvE', 'PvE DMG', 'PvE Poškodenie');
    document.getElementById('dc-r-final-val').textContent   = Math.round(finalDmg).toLocaleString();
  }

  // Update result elements
  document.getElementById('dc-r-atk').textContent       = Math.round(calcATK).toLocaleString();
  document.getElementById('dc-r-def').textContent       = Math.round(calcDEF).toLocaleString();
  document.getElementById('dc-r-spread').textContent    = Math.round(spread).toLocaleString();
  document.getElementById('dc-r-finalmult').textContent = finalMult.toFixed(4);
  document.getElementById('dc-r-A').textContent         = Math.round(A).toLocaleString();
  document.getElementById('dc-r-crittype').textContent  = critLabel;
  document.getElementById('dc-r-B').textContent         = Math.round(B).toLocaleString();
  document.getElementById('dc-r-C').textContent         = Math.round(C).toLocaleString();
}

// ─── Basic Stats Calculator ─────────────────────────────────────────────────

function getActiveStat() {
  var btn = document.querySelector('.bsc-type-btn.active');
  return btn ? btn.dataset.stat : 'atk';
}

function sumInputs(selector) {
  var sum = 0;
  document.querySelectorAll(selector).forEach(function(el) {
    sum += parseFloat(el.value) || 0;
  });
  return sum;
}

function updateBasicStats() {
  var sections = [
    { key: 'flat',   cls: '.bsc-flat-input',   quickId: 'bsc-flat-quick' },
    { key: 'base',   cls: '.bsc-base-input',   quickId: 'bsc-base-quick' },
    { key: 'global', cls: '.bsc-global-input', quickId: 'bsc-global-quick' }
  ];
  var totals = {};

  sections.forEach(function(s) {
    var section = document.getElementById('bsc-' + s.key + '-section');
    var quickEl = document.getElementById(s.quickId);
    if (section && section.classList.contains('expanded')) {
      var sum = sumInputs(s.cls);
      if (quickEl) quickEl.value = sum;
      totals[s.key] = sum;
    } else {
      totals[s.key] = parseFloat(quickEl ? quickEl.value : 0) || 0;
    }
  });

  var flatSum    = totals.flat;
  var baseSum    = totals.base;
  var globalSum  = totals.global;
  var baseFactor = 1 + baseSum   / 100;
  var glbFactor  = 1 + globalSum / 100;
  var final      = flatSum * baseFactor * glbFactor;

  var stat = getActiveStat();
  var icons = { atk: '⚔️', hp: '❤️', def: '🛡️' };
  var header = document.getElementById('bsc-results-header');
  if (header) header.firstChild.textContent = icons[stat] + ' ';

  var labelEl = document.getElementById('bsc-stat-label');
  if (labelEl) labelEl.textContent = stat.toUpperCase();

  var rVal = document.getElementById('bsc-r-final');
  if (rVal) {
    rVal.className = 'val ' + (stat === 'atk' ? 'atk' : stat === 'def' ? 'def' : '');
  }

  function set(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }
  set('bsc-r-flat',         Math.round(flatSum).toLocaleString());
  set('bsc-r-basepct',      baseSum.toFixed(2) + '%');
  set('bsc-r-basefactor',   baseFactor.toFixed(4));
  set('bsc-r-globalpct',    globalSum.toFixed(2) + '%');
  set('bsc-r-globalfactor', glbFactor.toFixed(4));
  set('bsc-r-final',        Math.round(final).toLocaleString());
  set('bsc-r-breakdown',
    Math.round(flatSum).toLocaleString() +
    ' × ' + baseFactor.toFixed(4) +
    ' × ' + glbFactor.toFixed(4) +
    ' = ' + Math.round(final).toLocaleString());
}

function toggleBscSection(sectionId) {
  var section = document.getElementById(sectionId);
  if (!section) return;
  var key = sectionId.replace('bsc-', '').replace('-section', '');
  var detail = document.getElementById('bsc-' + key + '-detail');
  var expanded = section.classList.toggle('expanded');
  if (detail) detail.classList.toggle('hidden', !expanded);
  updateBasicStats();
}

// ─── Visibility toggles ─────────────────────────────────────────────────────

function toggleSection(id, show) {
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('hidden',  !show);
  el.classList.toggle('visible',  show);
}

// ─── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {

  // Hamburger nav
  var hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', function() {
      document.getElementById('navLinks').classList.toggle('open');
    });
  }

  // Tab system
  document.querySelectorAll('[data-tab]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var group = btn.closest('[role="tablist"]') || btn.parentElement;
      group.querySelectorAll('[data-tab]').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var tabId = 'tab-' + btn.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(function(c) {
        if (c.id === tabId) c.classList.add('active');
        else c.classList.remove('active');
      });
    });
  });

  // Stat Calculator live update
  document.querySelectorAll('#stat-calc-form input').forEach(function(el) {
    el.addEventListener('input', updateStatCalc);
  });
  updateStatCalc();

  // Parking toggle → show/hide parking %
  var scParking = document.getElementById('sc-parking');
  if (scParking) {
    scParking.addEventListener('change', function() {
      toggleSection('sc-parking-section', scParking.checked);
      updateStatCalc();
    });
  }

  // Damage Calculator live update
  document.querySelectorAll('#dmg-calc-form input, #dmg-calc-form select').forEach(function(el) {
    el.addEventListener('input', updateDmgCalc);
    el.addEventListener('change', updateDmgCalc);
  });

  // Attack type visibility
  var atkTypeEl = document.getElementById('dc-atkType');
  if (atkTypeEl) {
    atkTypeEl.addEventListener('change', function() {
      toggleSection('dc-crit-section',      atkTypeEl.value === 'crit');
      toggleSection('dc-skillcrit-section', atkTypeEl.value === 'skillcrit');
      updateDmgCalc();
    });
  }

  // ATK parking toggle
  var dcAtkParking = document.getElementById('dc-atkParking');
  if (dcAtkParking) {
    dcAtkParking.addEventListener('change', function() {
      toggleSection('dc-atkpark-section', dcAtkParking.checked);
    });
  }

  // DEF parking toggle
  var dcDefParking = document.getElementById('dc-defParking');
  if (dcDefParking) {
    dcDefParking.addEventListener('change', function() {
      toggleSection('dc-defpark-section', dcDefParking.checked);
    });
  }

  // Context visibility
  var ctxEl = document.getElementById('dc-context');
  if (ctxEl) {
    ctxEl.addEventListener('change', function() {
      toggleSection('dc-pvp-section',   ctxEl.value === 'pvp');
      toggleSection('dc-pve-section',   ctxEl.value === 'pve' || ctxEl.value === 'boss');
      toggleSection('dc-boss-section',  ctxEl.value === 'boss');
    });
  }

  updateDmgCalc();

  // Basic Stats Calculator
  document.querySelectorAll('.bsc-type-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.bsc-type-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      updateBasicStats();
    });
  });

  document.querySelectorAll('.bsc-expand-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      toggleBscSection(btn.dataset.target);
    });
  });

  document.querySelectorAll('#bsc-form input').forEach(function(el) {
    el.addEventListener('input', updateBasicStats);
  });

  updateBasicStats();
});
