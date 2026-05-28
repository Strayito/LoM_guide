// LOM Combat Simulation — formulas from Yuko v1.2
// PVP_TABLE values are APPROXIMATE — replace with actual table from Yuko PDF.
var SIM = (function () {
  'use strict';

  // ─── Caps ───
  var CAP_RES    = 80;  // standard DMG RES cap
  var CAP_CR_RES = 60;  // Cannon DMG RES cap
  var CAP_CS     = 100; // Crit Rate, Combo Rate, Counter Rate, Stun, Launch

  // ─── PvP Reduction Divisor Table (220 entries, index 0 = avg level 1) ───
  // Formula: divisor = 1 + 0.018×lv + 0.00012×lv²  (APPROXIMATE)
  var PVP_TABLE = (function () {
    var t = [];
    for (var i = 1; i <= 220; i++) {
      t.push(+(1 + 0.018 * i + 0.00012 * i * i).toFixed(3));
    }
    return t;
  })();

  // ─── Utility ───
  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
  function capRES(v)  { return clamp(v, 0, CAP_RES); }
  function capCRES(v) { return clamp(v, 0, CAP_CR_RES); }
  function fmt(v)     { return Math.round(v).toLocaleString(); }
  function fmtF(v, d) { return (+v.toFixed(d || 2)).toLocaleString(); }

  // ─── Stats ───
  function finalStat(flat, basePct, globalPct) {
    return flat * (1 + basePct / 100) * (1 + globalPct / 100);
  }

  // ─── PvP ───
  function pvpAvgLv(myLv, eLv) { return Math.floor((myLv + eLv) / 2); }
  function pvpDiv(myLv, eLv) {
    return PVP_TABLE[clamp(pvpAvgLv(myLv, eLv) - 1, 0, 219)];
  }

  // ─── Core damage functions ───
  function spread(atk, def) { return Math.max(0, atk - def); }

  function critRatio(critDMGPct, critRESPct) {
    return Math.max(1.5, critDMGPct / Math.max(1, critRESPct));
  }

  function applyRES(dmg, typeRES, globalRES) {
    return dmg * (1 - capRES(typeRES) / 100) * (1 - capRES(globalRES) / 100);
  }

  function applyCannonRES(dmg, cannonRES, globalRES) {
    return dmg * (1 - capCRES(cannonRES) / 100) * (1 - capRES(globalRES) / 100);
  }

  // ─── Combat calculation (Basic/Combo/Counter/Skill) ───
  // p: { atk, def, mult, type('basic'|'combo'|'counter'|'skill'),
  //      skillDMGBonus (player Skill DMG stat %),
  //      typeRES, globalRES,
  //      crit: bool, critDMGPct, critRESPct,
  //      skillCrit: bool, skillCritMult,
  //      boss: bool, bossDMGPct,
  //      pvp: bool, pvpMyLv, pvpELv }
  function calcCombat(p) {
    var log = [];

    var sp = spread(p.atk, p.def);
    log.push({ lbl: 'ATK − DEF', val: sp });

    // Step A — base × mult (× skill bonus for skills)
    var A;
    if (p.type === 'skill') {
      A = sp * (p.mult / 100) * (1 + (p.skillDMGBonus || 0) / 100);
      log.push({ lbl: 'A — ×' + p.mult + '% × (1+SkillDMG ' + (p.skillDMGBonus || 0) + '%)', val: A });
    } else {
      A = sp * (p.mult / 100);
      log.push({ lbl: 'A — ×' + p.mult + '% mult', val: A });
    }

    // Step B — crit
    var B = A;
    if (p.crit) {
      var ratio = critRatio(p.critDMGPct, p.critRESPct);
      B = A * ratio;
      log.push({ lbl: 'B — Crit (×' + fmtF(ratio) + ') CritDMG ' + p.critDMGPct + '% ÷ CritRES ' + p.critRESPct + '%', val: B });
    } else if (p.skillCrit) {
      B = A * Math.pow(1 + (p.skillCritMult || 0) / 100, 0.98);
      log.push({ lbl: 'B — SkillCrit ×(1+' + (p.skillCritMult || 0) + '%)^0.98', val: B });
    }

    // Step C — resistances
    var C = applyRES(B, p.typeRES || 0, p.globalRES || 0);
    var tRes = capRES(p.typeRES || 0), gRes = capRES(p.globalRES || 0);
    log.push({ lbl: 'C — ×(1−' + tRes + '%)×(1−' + gRes + '%) RES', val: C });

    // Step D — boss bonus
    var D = C;
    if (p.boss) {
      D = C * (1 + (p.bossDMGPct || 0) / 100);
      log.push({ lbl: 'D — Boss ×(1+' + (p.bossDMGPct || 0) + '%)', val: D });
    }

    // Step E — PvP division
    var final = D;
    if (p.pvp) {
      var div = pvpDiv(p.pvpMyLv, p.pvpELv);
      final = D / div;
      log.push({ lbl: 'Final — ÷PvP ' + fmtF(div) + ' (avg lv ' + pvpAvgLv(p.pvpMyLv, p.pvpELv) + ')', val: final });
    }

    return { log: log, final: final };
  }

  // ─── Pal calculation ───
  // p: { atk, def, palMult, palDMGPct, palRES, globalRES,
  //      palCrit: bool, palCritDMGPct, palCritRESPct,
  //      palCombo: bool, palComboMult,
  //      pvp: bool, pvpMyLv, pvpELv }
  function calcPal(p) {
    var log = [];

    var sp = spread(p.atk, p.def);
    log.push({ lbl: 'ATK − DEF', val: sp });

    var A = sp * (p.palMult / 100) * ((p.palDMGPct || 100) / 100);
    log.push({ lbl: 'A — ×' + p.palMult + '% × PalDMG ' + (p.palDMGPct || 100) + '%', val: A });

    var B = A;
    if (p.palCrit) {
      var ratio = critRatio(p.palCritDMGPct, p.palCritRESPct);
      B = A * ratio;
      log.push({ lbl: 'B — PalCrit ×' + fmtF(ratio), val: B });
    }
    if (p.palCombo) {
      var cm = (p.palComboMult || 100) / 100;
      B = B * cm;
      log.push({ lbl: 'B — PalCombo ×' + fmtF(cm), val: B });
    }

    var palRES = capRES(p.palRES || 0);
    var gRES   = capRES(p.globalRES || 0);
    var C = B * (1 - palRES / 100) * (1 - gRES / 100);
    log.push({ lbl: 'C — ×(1−' + palRES + '%)×(1−' + gRES + '%) RES', val: C });

    var final = C;
    if (p.pvp) {
      var div = pvpDiv(p.pvpMyLv, p.pvpELv);
      final = C / div;
      log.push({ lbl: 'Final — ÷PvP ' + fmtF(div), val: final });
    }

    return { log: log, final: final };
  }

  // ─── HP-Based Damage (6-step) ───
  // p: { enemyHP, hpPct, playerATK, basicMult,
  //      minFactor (% of basicRef), maxFactor (% of basicRef),
  //      typeRES, globalRES,
  //      pvp: bool, pvpMyLv, pvpELv }
  function calcHPDmg(p) {
    var log = [];

    // Step 1: raw HP% damage
    var raw = p.enemyHP * (p.hpPct / 100);
    log.push({ lbl: '① Raw HP×' + p.hpPct + '%', val: raw });

    // Step 2: ×PvP factor (normalise to ATK scale)
    var pvpFactor = p.pvp ? pvpDiv(p.pvpMyLv, p.pvpELv) : 1;
    var step2 = raw * pvpFactor;
    if (p.pvp) log.push({ lbl: '② ×PvP factor (' + fmtF(pvpFactor) + ')', val: step2 });

    // Step 3: Basic ATK reference
    var basicRef = p.playerATK * ((p.basicMult || 100) / 100);
    var minDmg   = basicRef * ((p.minFactor || 50) / 100);
    var maxDmg   = basicRef * ((p.maxFactor || 300) / 100);
    log.push({ lbl: '③ ATK ref = ' + fmt(basicRef) + ' (min ' + fmt(minDmg) + ', max ' + fmt(maxDmg) + ')', val: basicRef });

    // Step 4/5: Clamp
    var clamped = clamp(step2, minDmg, maxDmg);
    log.push({ lbl: '④⑤ Clamped', val: clamped });

    // Step 6: Divide back by PvP factor
    var step6 = p.pvp ? clamped / pvpFactor : clamped;
    if (p.pvp) log.push({ lbl: '⑥ ÷PvP factor', val: step6 });

    // Apply resistances
    var final = applyRES(step6, p.typeRES || 0, p.globalRES || 0);
    log.push({ lbl: 'Final — after RES', val: final });

    return { log: log, final: final };
  }

  // ─── Sailing / Cannon ───
  // p: { cannonATK, enemyDEF, cannonMult, cannonDMGPct, cannonRES, globalRES }
  function calcSailing(p) {
    var log = [];

    var sp = spread(p.cannonATK, p.enemyDEF);
    log.push({ lbl: 'CannonATK − DEF', val: sp });

    var A = sp * (p.cannonMult / 100) * (1 + (p.cannonDMGPct || 0) / 100);
    log.push({ lbl: 'A — ×' + p.cannonMult + '% × (1+CannonDMG ' + (p.cannonDMGPct || 0) + '%)', val: A });

    var cRes = capCRES(p.cannonRES || 0);
    var gRes = capRES(p.globalRES || 0);
    var final = A * (1 - cRes / 100) * (1 - gRes / 100);
    log.push({ lbl: 'Final — ×(1−' + cRes + '% CannonRES cap60)×(1−' + gRes + '%)', val: final });

    return { log: log, final: final };
  }

  // ─── UI helpers ───
  function $(id) { return document.getElementById(id); }
  function getN(id, def) {
    var el = $(id); if (!el) return def || 0;
    var v = parseFloat(el.value); return isNaN(v) ? (def || 0) : v;
  }
  function getB(id) { var el = $(id); return el ? el.checked : false; }
  function setTxt(id, txt) { var el = $(id); if (el) el.textContent = txt; }

  function renderLog(containerId, result) {
    var el = $(containerId); if (!el) return;
    var html = result.log.map(function (s) {
      return '<div class="sim-step"><span class="sim-step-lbl">' + s.lbl + '</span><span class="sim-step-val">' + fmt(s.val) + '</span></div>';
    }).join('');
    el.innerHTML = html;
    setTxt(containerId.replace('-steps', '-final'), fmt(result.final));
  }

  function toggleEl(id, show) {
    var el = $(id); if (el) el.style.display = show ? '' : 'none';
  }

  // ─── Tab update functions ───
  function updateCombat() {
    var hasCrit = getB('sc-crit');
    var hasSkCrit = getB('sc-skillcrit');
    var hasBoss = getB('sc-boss');
    var hasPvP = getB('sc-pvp');
    var type = (function () {
      var el = document.querySelector('#sc-type-btns .sim-type-btn.active');
      return el ? el.dataset.type : 'basic';
    })();

    toggleEl('sc-crit-opts', hasCrit);
    toggleEl('sc-skillcrit-opts', hasSkCrit && type === 'skill');
    toggleEl('sc-boss-opts', hasBoss);
    toggleEl('sc-pvp-opts', hasPvP);
    toggleEl('sc-skill-opts', type === 'skill');

    if (hasCrit && hasSkCrit) { setB('sc-skillcrit', false); hasSkCrit = false; }

    var result = calcCombat({
      atk: getN('sc-atk'), def: getN('sc-def'),
      mult: getN('sc-mult', 100), type: type,
      skillDMGBonus: getN('sc-skillbonus'),
      typeRES: getN('sc-typeRES'), globalRES: getN('sc-globalRES'),
      crit: hasCrit, critDMGPct: getN('sc-critDMG', 150), critRESPct: getN('sc-critRES', 100),
      skillCrit: hasSkCrit && type === 'skill', skillCritMult: getN('sc-skillCritMult', 50),
      boss: hasBoss, bossDMGPct: getN('sc-bossDMG'),
      pvp: hasPvP, pvpMyLv: getN('sc-pvpMyLv', 100), pvpELv: getN('sc-pvpELv', 100)
    });
    renderLog('sc-steps', result);

    if (hasPvP) {
      setTxt('sc-pvp-div', fmtF(pvpDiv(getN('sc-pvpMyLv', 100), getN('sc-pvpELv', 100))));
    }
  }

  function setB(id, v) { var el = $(id); if (el) el.checked = v; }

  function updateCompare() {
    var type = (function () {
      var el = document.querySelector('#cmp-type-btns .sim-type-btn.active');
      return el ? el.dataset.type : 'basic';
    })();
    var hasCrit  = getB('cmp-crit');
    var hasBoss  = getB('cmp-boss');
    var hasPvP   = getB('cmp-pvp');

    function build(pfx) {
      return calcCombat({
        atk: getN(pfx + 'atk'), def: getN(pfx + 'def'),
        mult: getN('cmp-mult', 100), type: type,
        skillDMGBonus: getN('cmp-skillbonus'),
        typeRES: getN('cmp-typeRES'), globalRES: getN('cmp-globalRES'),
        crit: hasCrit, critDMGPct: getN(pfx + 'critDMG', 150), critRESPct: getN('cmp-critRES', 100),
        skillCrit: false, skillCritMult: 0,
        boss: hasBoss, bossDMGPct: getN('cmp-bossDMG'),
        pvp: hasPvP, pvpMyLv: getN('cmp-pvpMyLv', 100), pvpELv: getN('cmp-pvpELv', 100)
      });
    }

    var rA = build('cmp-a-'); var rB = build('cmp-b-');
    renderLog('cmp-a-steps', rA); renderLog('cmp-b-steps', rB);

    var diff = rB.final - rA.final;
    var pct  = rA.final > 0 ? (diff / rA.final * 100) : 0;
    var sign = diff >= 0 ? '+' : '';
    var diffEl = $('cmp-diff');
    if (diffEl) {
      diffEl.textContent = 'B ' + sign + fmt(diff) + ' (' + sign + fmtF(pct, 1) + '%)';
      diffEl.style.color = diff >= 0 ? 'var(--teal)' : 'var(--red)';
    }

    toggleEl('cmp-crit-opts', hasCrit);
    toggleEl('cmp-boss-opts', hasBoss);
    toggleEl('cmp-pvp-opts', hasPvP);
    toggleEl('cmp-skill-opts', type === 'skill');
  }

  function updatePal() {
    var hasCrit  = getB('pal-crit');
    var hasCombo = getB('pal-combo');
    var hasPvP   = getB('pal-pvp');
    toggleEl('pal-crit-opts', hasCrit);
    toggleEl('pal-combo-opts', hasCombo);
    toggleEl('pal-pvp-opts', hasPvP);

    var result = calcPal({
      atk: getN('pal-atk'), def: getN('pal-def'),
      palMult: getN('pal-mult', 100), palDMGPct: getN('pal-dmgpct', 100),
      palRES: getN('pal-res'), globalRES: getN('pal-globalres'),
      palCrit: hasCrit, palCritDMGPct: getN('pal-critdmg', 150), palCritRESPct: getN('pal-critres', 100),
      palCombo: hasCombo, palComboMult: getN('pal-combomult', 100),
      pvp: hasPvP, pvpMyLv: getN('pal-pvpMyLv', 100), pvpELv: getN('pal-pvpELv', 100)
    });
    renderLog('pal-steps', result);
  }

  function updateHPDmg() {
    var hasPvP = getB('hp-pvp');
    toggleEl('hp-pvp-opts', hasPvP);

    var result = calcHPDmg({
      enemyHP:    getN('hp-enemy-hp', 1000000),
      hpPct:      getN('hp-pct', 30),
      playerATK:  getN('hp-player-atk'),
      basicMult:  getN('hp-basic-mult', 100),
      minFactor:  getN('hp-min-factor', 50),
      maxFactor:  getN('hp-max-factor', 300),
      typeRES:    getN('hp-typeRES'), globalRES: getN('hp-globalRES'),
      pvp: hasPvP, pvpMyLv: getN('hp-pvpMyLv', 100), pvpELv: getN('hp-pvpELv', 100)
    });
    renderLog('hp-steps', result);
  }

  function updateSailing() {
    var result = calcSailing({
      cannonATK:    getN('sail-atk'),
      enemyDEF:     getN('sail-def'),
      cannonMult:   getN('sail-mult', 100),
      cannonDMGPct: getN('sail-dmgpct'),
      cannonRES:    getN('sail-res'),
      globalRES:    getN('sail-globalres')
    });
    renderLog('sail-steps', result);
  }

  // ─── Wire tab's inputs ───
  function wireTab(tabId, fn) {
    var tab = $(tabId); if (!tab) return;
    tab.querySelectorAll('input, select').forEach(function (el) {
      el.addEventListener('input', fn);
      el.addEventListener('change', fn);
    });
  }

  // ─── Type button groups ───
  function initTypeGroup(groupId, onChange) {
    var group = $(groupId); if (!group) return;
    group.querySelectorAll('.sim-type-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        group.querySelectorAll('.sim-type-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        onChange();
      });
    });
  }

  // ─── Tab switching ───
  function initTabs() {
    document.querySelectorAll('.sim-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.sim-tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.sim-tab-content').forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');
        var c = $('sim-tab-' + this.dataset.tab);
        if (c) c.classList.add('active');
      });
    });
  }

  // ─── Init ───
  function init() {
    initTabs();

    var ham = $('hamburger');
    if (ham) ham.addEventListener('click', function () { $('navLinks').classList.toggle('open'); });

    initTypeGroup('sc-type-btns', updateCombat);
    initTypeGroup('cmp-type-btns', updateCompare);

    wireTab('sim-tab-combat',   updateCombat);
    wireTab('sim-tab-compare',  updateCompare);
    wireTab('sim-tab-pal',      updatePal);
    wireTab('sim-tab-hpdmg',    updateHPDmg);
    wireTab('sim-tab-sailing',  updateSailing);

    updateCombat(); updateCompare(); updatePal(); updateHPDmg(); updateSailing();
  }

  return {
    init: init,
    calcCombat: calcCombat,
    calcPal: calcPal,
    calcHPDmg: calcHPDmg,
    calcSailing: calcSailing,
    pvpDiv: pvpDiv,
    finalStat: finalStat,
    PVP_TABLE: PVP_TABLE
  };
})();
