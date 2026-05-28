// LOM Combat Simulation Engine — Yuko v1.2 (vérifié sur code source jeu, 04/2025)
var SIM = (function () {
  'use strict';

  // ─── Caps (Attributes Maximum Limits — PDF p.21) ───
  var CAP_RES    = 80;   // Combo/Counter/Skill/Pal/Basic ATK/Boss/DMG RES
  var CAP_CRRES  = 60;   // Cannon DMG RES
  var CAP_RATE   = 100;  // Crit Rate, Combo, Counter, Stun, Launch

  // ─── PvP Damage Reduction Table — valeurs exactes Yuko v1.2 (Last Update: 04/2025) ───
  // Index 0 = avg level 1 … Index 219 = avg level 220
  var PVP_TABLE = [
    1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.10,1.15,1.40,   // 1-10
    1.60,1.70,2.00,2.10,2.40,2.50,2.55,2.95,3.05,3.45,   // 11-20
    3.85,4.00,4.15,4.25,4.75,4.90,5.05,5.15,5.30,5.80,   // 21-30
    6.45,6.60,6.75,6.95,7.65,7.80,7.95,8.15,8.35,8.50,   // 31-40
    9.35,9.50,9.70,9.90,10.05,10.25,10.45,10.65,10.80,11.00, // 41-50
    11.95,12.15,12.35,12.55,12.75,12.95,13.15,13.35,13.55,13.75, // 51-60
    14.90,15.10,15.35,15.55,16.10,16.70,17.30,17.90,18.60,19.20, // 61-70
    19.90,20.70,21.40,22.20,23.00,23.90,24.80,25.70,26.60,27.60, // 71-80
    28.60,29.70,30.80,31.90,33.10,34.30,35.60,36.90,38.20,39.60, // 81-90
    41.10,42.60,44.20,45.80,47.50,49.20,51.00,52.90,54.90,56.90, // 91-100
    59.00,61.20,63.40,65.80,68.20,70.70,73.30,76.00,78.80,81.70, // 101-110
    84.70,87.80,91.10,94.40,97.90,101.50,105.20,109.10,113.10,117.30, // 111-120
    121.60,126.10,130.80,135.60,140.60,145.80,151.00,156.20,161.40,166.60, // 121-130
    172.00,177.40,182.80,188.20,193.60,199.20,204.80,210.40,216.00,221.60, // 131-140
    227.40,233.20,239.00,244.80,250.60,256.60,262.60,268.60,274.60,280.60, // 141-150
    286.70,292.80,298.90,305.00,311.20,317.40,323.60,329.80,336.00,342.30, // 151-160
    348.60,354.90,361.20,367.50,373.90,380.30,386.70,393.10,399.50,406.00, // 161-170
    412.50,419.00,425.50,432.00,438.60,445.20,451.80,458.40,465.00,471.70, // 171-180
    478.40,485.10,491.80,498.50,505.30,512.10,518.90,525.70,532.50,539.40, // 181-190
    546.30,553.20,560.10,567.00,574.00,581.00,588.00,595.00,602.00,609.00, // 191-200
    616.10,623.20,630.30,637.40,644.50,651.70,658.90,666.10,673.30,680.50, // 201-210
    687.80,695.10,702.40,709.70,717.00,724.40,731.80,739.20,746.60,754.00  // 211-220
  ];

  // ─── Utility ───
  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
  // RES peut être négatif (debuffs augmentent les dégâts) — seulement plafonner le max
  function capRES(v)   { return Math.min(v, CAP_RES); }
  function capCRES(v)  { return Math.min(v, CAP_CRRES); }
  function capRate(v)  { return clamp(v, 0, CAP_RATE); }
  function fmt(v)      { return Math.round(v).toLocaleString(); }
  function fmtF(v, d)  { return (+v.toFixed(d != null ? d : 2)).toLocaleString(); }

  // ─── PvP ───
  function pvpAvgLv(a, b) { return Math.floor((a + b) / 2); }
  function pvpDiv(myLv, eLv) {
    return PVP_TABLE[clamp(pvpAvgLv(myLv, eLv) - 1, 0, 219)];
  }

  // ─── Spread: (ATK − DEF) min 1. En PvP enemyDEF peut être réel ; en PvE toujours > 0 ───
  function spread(atk, def) { return Math.max(1, atk - def); }

  // ─── Crit ratio: CritRES min 50%, ratio min 1.5 ───
  function critRatio(critDMGPct, critRESPct) {
    return Math.max(1.5, critDMGPct / Math.max(50, critRESPct));
  }

  // ─── Stats (formule à 3 parties) ───
  // FinalStat = Initial × (1 + Base%/100) × (1 + Global%/100)
  function finalStat(initial, basePct, globalPct) {
    return initial * (1 + basePct / 100) * (1 + globalPct / 100);
  }
  // Multiplicateurs (ComboMult, BasicATKMult, CritDMG, CritRES)
  function finalMult(base, bonusPct, globalPct) {
    return base * (1 + bonusPct / 100) * (1 + globalPct / 100);
  }

  // ─── Combat: Basic ATK / Combo / Counter / Skill ───
  // p: { atk, def, mult, type('basic'|'combo'|'counter'|'skill'),
  //      skillPlayerDMG (PlayerSkillDMG stat %, default 100),
  //      typeRES, globalRES,
  //      crit, critDMGPct, critRESPct,
  //      skillCrit, skillCritMult,
  //      boss, bossDMGPct,
  //      pvp, pvpMyLv, pvpELv }
  function calcCombat(p) {
    var log = [];
    var sp = spread(p.atk, p.def);
    log.push({ lbl: 'ATK − DEF (min 1)', val: sp });

    var A;
    if (p.type === 'skill') {
      // SkillDMG = (ATK-DEF) × SkillDMG%/100 × PlayerSkillDMG%/100
      var psd = p.skillPlayerDMG != null ? p.skillPlayerDMG : 100;
      A = sp * (p.mult / 100) * (psd / 100);
      log.push({ lbl: 'A — SkillDMG ' + p.mult + '% × PlayerSkillDMG ' + psd + '%', val: A });
    } else {
      A = sp * (p.mult / 100);
      log.push({ lbl: 'A — ×' + p.mult + '%', val: A });
    }

    // Crit (Basic/Combo/Counter) — CritRES min 50%, ratio min 1.5
    var B = A;
    if (p.crit && p.type !== 'skill') {
      var r = critRatio(p.critDMGPct, p.critRESPct);
      B = A * r;
      log.push({ lbl: 'B — Crit ×' + fmtF(r) + ' (CritDMG ' + p.critDMGPct + '% ÷ max(50%,' + p.critRESPct + '%))', val: B });
    } else if (p.skillCrit && p.type === 'skill') {
      // SkillCritDMG = SkillDMG × (1 + SkillCritDMG%/100)^0.98  — PAS réduit par CritRES
      B = A * Math.pow(1 + (p.skillCritMult || 0) / 100, 0.98);
      log.push({ lbl: 'B — SkillCrit ×(1+' + (p.skillCritMult || 0) + '%)^0.98 (ignore CritRES)', val: B });
    }

    // Resistances (peuvent être négatives — debuffs)
    var tRes = capRES(p.typeRES || 0);
    var gRes = capRES(p.globalRES || 0);
    var C = B * (1 - tRes / 100) * (1 - gRes / 100);
    log.push({ lbl: 'C — ×(1−' + tRes + '% TypeRES)×(1−' + gRes + '% DMG RES)', val: C });

    // Boss DMG bonus
    var D = C;
    if (p.boss) {
      D = C * (1 + (p.bossDMGPct || 0) / 100);
      log.push({ lbl: 'D — ×(1+' + (p.bossDMGPct || 0) + '% BossDMG)', val: D });
    }

    // PvP final division
    var final = D;
    if (p.pvp) {
      var div = pvpDiv(p.pvpMyLv, p.pvpELv);
      final = D / div;
      log.push({ lbl: 'Final — ÷' + fmtF(div) + ' (avg lv ' + pvpAvgLv(p.pvpMyLv, p.pvpELv) + ')', val: final });
    }

    return { log: log, final: Math.max(1, final) };
  }

  // ─── Pal ───
  // PalBasicATKDMG = (ATK-DEF) × PalDMGMULT × PlayerPalDMG%/100 × (1-PalDMGRES%/100) × (1-DMGRES%/100)
  // PalComboDMG    = PalBasicATKDMG × PalComboMULT/100
  // PalCritDMG     = PalDMG × (PalCritDMG% / EnemyCritRES%) — min ratio 1.5
  function calcPal(p) {
    var log = [];
    var sp = spread(p.atk, p.def);
    log.push({ lbl: 'ATK − DEF (min 1)', val: sp });

    var palDMG = p.palDMGPct != null ? p.palDMGPct : 100;
    var A = sp * (p.palMult / 100) * (palDMG / 100);
    log.push({ lbl: 'PalBasic — PalMULT ' + p.palMult + '% × PalDMG ' + palDMG + '%', val: A });

    if (p.palCrit) {
      var r = critRatio(p.palCritDMGPct, p.palCritRESPct);
      A = A * r;
      log.push({ lbl: 'PalCrit ×' + fmtF(r) + ' (PalCritDMG ÷ max(50%,CritRES))', val: A });
    }

    var pRes = capRES(p.palRES || 0);
    var gRes = capRES(p.globalRES || 0);
    var basicFinal = A * (1 - pRes / 100) * (1 - gRes / 100);
    log.push({ lbl: '×(1−' + pRes + '% PalDMGRES)×(1−' + gRes + '% DMGRES)', val: basicFinal });

    var total = basicFinal;
    if (p.palCombo) {
      // PalComboDMG = PalBasicATKDMG × PalComboMULT/100
      var cm = p.palComboMult != null ? p.palComboMult : 100;
      var comboDmg = basicFinal * (cm / 100);
      log.push({ lbl: 'PalCombo = PalBasic × ' + cm + '% (hit séparé)', val: comboDmg });
      total = basicFinal + comboDmg;
      log.push({ lbl: 'Total PalBasic + PalCombo', val: total });
    }

    if (p.boss) {
      total = total * (1 + (p.bossDMGPct || 0) / 100);
      log.push({ lbl: 'Boss DMG ×(1+' + (p.bossDMGPct || 0) + '%)', val: total });
    }

    if (p.pvp) {
      var div = pvpDiv(p.pvpMyLv, p.pvpELv);
      total = total / div;
      log.push({ lbl: 'Final ÷' + fmtF(div) + ' PvP', val: total });
    }

    return { log: log, final: Math.max(1, total) };
  }

  // ─── HP-Based Damage (6 étapes exactes PDF) ───
  // AUCUNE résistance. Ne peut pas être critique.
  // Min = BasicATKDMG × 0.8
  // Max = BasicATKDMG × 50 (HP courant) ou × 100 (HP max)
  function calcHPDmg(p) {
    var log = [];
    var pvpFactor = p.pvp ? pvpDiv(p.pvpMyLv, p.pvpELv) : 1;

    // Étape 1
    var raw = p.targetHP * (p.hpPct / 100);
    log.push({ lbl: '① HP DMG = TargetHP×' + p.hpPct + '%', val: raw });

    // Étape 2: ×PvP factor
    var step2 = raw * pvpFactor;
    if (p.pvp) log.push({ lbl: '② ×PvP ' + fmtF(pvpFactor) + ' (avg lv ' + pvpAvgLv(p.pvpMyLv, p.pvpELv) + ')', val: step2 });

    // Étape 3: Basic ATK DMG ref (sans RES, sans crit)
    var basicRef = spread(p.playerATK, p.enemyDEF) * ((p.basicMult || 100) / 100);
    log.push({ lbl: '③ ATKRef = (ATK−DEF)×' + (p.basicMult || 100) + '% (sans RES ni crit)', val: basicRef });

    // Étape 4: Min/Max
    var minDmg = basicRef * 0.8;
    var maxK = p.hpType === 'current' ? 50 : 100;
    var maxDmg = basicRef * maxK;
    log.push({ lbl: '④ Min=ATKRef×0.8, Max=ATKRef×' + maxK + ' (' + (p.hpType === 'current' ? 'HP courant' : 'HP max') + ')', val: minDmg });
    log.push({ lbl: '   Min=' + fmt(minDmg) + '  |  Max=' + fmt(maxDmg), val: maxDmg });

    // Étape 5: Clamp
    var clamped = clamp(step2, minDmg, maxDmg);
    var note = step2 <= minDmg ? '→ MIN appliqué' : step2 >= maxDmg ? '→ MAX appliqué' : '→ HP DMG inchangé';
    log.push({ lbl: '⑤ Clamp ' + note, val: clamped });

    // Étape 6: ÷PvP factor
    var final = p.pvp ? clamped / pvpFactor : clamped;
    log.push({ lbl: '⑥ Final' + (p.pvp ? ' ÷PvP ' + fmtF(pvpFactor) : '') + ' (pas de RES, pas de crit)', val: final });

    return { log: log, final: Math.max(1, final) };
  }

  // ─── Sailing / Cannon (formule PDF p.13-14) ───
  // FinalShipCannonDMG = CaptBasicATKDMG%/100 × (1+CaptBasicATKDMGRES%/100) × (1+ShipCannonDMG%/100+HullCannonDMG%/100)
  // CannonBasicATKDMG  = (CaptATK−EnemyCaptDEF) × FinalShipCannonDMG × (1−EnemyCannonDMGRES%) × (1−EnemyCaptDMGRES%)
  // CannonComboDMG     = CannonBasicATKDMG × CannonComboDMG%/100 × (1−EnemyCaptComboDMGRES%)
  function calcSailing(p) {
    var log = [];

    var fCannonMult = (p.captBasicATKDMG / 100)
      * (1 + (p.captBasicATKDMGRES || 0) / 100)
      * (1 + (p.shipCannonDMG || 0) / 100 + (p.hullCannonDMG || 0) / 100);
    log.push({ lbl: 'FinalShipCannonDMG = CaptBasicATKDMG%/100 × (1+CaptDMGRES%) × (1+Ship%+Hull%)', val: fCannonMult });

    var sp = spread(p.captATK, p.enemyCaptDEF);
    log.push({ lbl: 'CaptainATK − EnemyCaptainDEF (min 1)', val: sp });

    var cRes = capCRES(p.enemyCannonRES || 0);
    var dRes = capRES(p.enemyCaptDMGRES || 0);
    var basic = sp * fCannonMult * (1 - cRes / 100) * (1 - dRes / 100);
    log.push({ lbl: 'CannonBasicATK ×(1−' + cRes + '% CannonRES cap60)×(1−' + dRes + '% CaptDMGRES)', val: basic });

    var total = basic;
    if (p.hasCombo) {
      var cc = p.cannonComboDMG != null ? p.cannonComboDMG : 100;
      var ccRes = capRES(p.enemyCaptComboDMGRES || 0);
      var comboDmg = basic * (cc / 100) * (1 - ccRes / 100);
      log.push({ lbl: 'CannonCombo = CannonBasic×' + cc + '%×(1−' + ccRes + '% CaptComboDMGRES)', val: comboDmg });
      total = basic + comboDmg;
      log.push({ lbl: 'Total CannonBasic + CannonCombo', val: total });
    }

    return { log: log, final: Math.max(1, total) };
  }

  // ─── Mécaniques ───

  // Taux de combat (Evasion et Stun utilisent ^0.9 d'après le code jeu)
  // Combo%, Counter%, Launch% = linéaire
  function calcNetRate(playerVal, enemyIgnore, pow09) {
    var net = Math.max(0, playerVal - enemyIgnore);
    if (pow09) net = Math.pow(net / 100, 0.9) * 100; // normalise puis applique exposant
    return Math.min(100, net);
  }

  // Durée de stun
  // PvP: stunTime=1, StunRES=60% → 0.4 × (1 - ControlRES%)
  function calcStunDur(stunTime, stunRES, controlRES, isPvP) {
    if (isPvP) return 0.4 * (1 - Math.min(100, controlRES) / 100);
    return stunTime * (1 - Math.min(100, stunRES) / 100) * (1 - Math.min(100, controlRES) / 100);
  }

  // Pierce / Block / Pal Inspire / Pal RES
  // Net = max(0, Player - EnemyIgnore)
  // Effet (si proc 30%) = net × 0.01% de RES ignoré/gagné
  function calcNetPierceBlock(playerVal, enemyIgnore) {
    return Math.max(0, playerVal - enemyIgnore) * 0.01;
  }

  // Régénération
  // PvP: seulement 30% de la regen du joueur
  function calcNetRegen(playerRegen, enemyIgnore, isPvP) {
    var net = Math.max(0, playerRegen - enemyIgnore);
    return isPvP ? net * 0.30 : net;
  }

  // ─── Stats Calculator ───
  function calcStatFull(initial, basePct, globalPct) {
    return { result: finalStat(initial, basePct, globalPct), bFactor: 1 + basePct / 100, gFactor: 1 + globalPct / 100 };
  }

  // ─── UI helpers ───
  function $(id) { return document.getElementById(id); }
  function getN(id, def) {
    var el = $(id); if (!el) return def != null ? def : 0;
    var v = parseFloat(el.value); return isNaN(v) ? (def != null ? def : 0) : v;
  }
  function getB(id) { var el = $(id); return el ? el.checked : false; }
  function getV(id) { var el = $(id); return el ? el.value : ''; }
  function setTxt(id, txt) { var el = $(id); if (el) el.textContent = txt; }
  function toggleEl(id, show) { var el = $(id); if (el) el.style.display = show ? '' : 'none'; }

  function renderLog(containerId, result) {
    var el = $(containerId); if (!el) return;
    el.innerHTML = result.log.map(function (s) {
      return '<div class="sim-step"><span class="sim-step-lbl">' + s.lbl + '</span><span class="sim-step-val">' + fmt(s.val) + '</span></div>';
    }).join('');
    setTxt(containerId.replace('-steps', '-final'), fmt(result.final));
  }

  // ─── Update functions ───
  function updateCombat() {
    var type = (function () {
      var el = document.querySelector('#sc-type-btns .sim-type-btn.active');
      return el ? el.dataset.type : 'basic';
    })();
    var hasCrit   = getB('sc-crit');
    var hasSkCrit = getB('sc-skillcrit');
    var hasBoss   = getB('sc-boss');
    var hasPvP    = getB('sc-pvp');

    toggleEl('sc-skill-opts',     type === 'skill');
    toggleEl('sc-skillcrit-row',  type === 'skill');
    toggleEl('sc-crit-opts',      hasCrit && type !== 'skill');
    toggleEl('sc-skillcrit-opts', hasSkCrit && type === 'skill');
    toggleEl('sc-boss-opts',      hasBoss);
    toggleEl('sc-pvp-opts',       hasPvP);

    var result = calcCombat({
      atk: getN('sc-atk'), def: getN('sc-def'),
      mult: getN('sc-mult', 100), type: type,
      skillPlayerDMG: getN('sc-skillbonus', 100),
      typeRES: getN('sc-typeRES'), globalRES: getN('sc-globalRES'),
      crit: hasCrit, critDMGPct: getN('sc-critDMG', 150), critRESPct: getN('sc-critRES', 100),
      skillCrit: hasSkCrit, skillCritMult: getN('sc-skillCritMult', 50),
      boss: hasBoss, bossDMGPct: getN('sc-bossDMG'),
      pvp: hasPvP, pvpMyLv: getN('sc-pvpMyLv', 100), pvpELv: getN('sc-pvpELv', 100)
    });
    renderLog('sc-steps', result);
    if (hasPvP) setTxt('sc-pvp-div', fmtF(pvpDiv(getN('sc-pvpMyLv', 100), getN('sc-pvpELv', 100))));
  }

  function updateCompare() {
    var type = (function () {
      var el = document.querySelector('#cmp-type-btns .sim-type-btn.active');
      return el ? el.dataset.type : 'basic';
    })();
    var hasCrit = getB('cmp-crit'), hasBoss = getB('cmp-boss'), hasPvP = getB('cmp-pvp');
    toggleEl('cmp-crit-opts', hasCrit); toggleEl('cmp-boss-opts', hasBoss);
    toggleEl('cmp-pvp-opts', hasPvP); toggleEl('cmp-skill-opts', type === 'skill');

    function build(pfx) {
      return calcCombat({
        atk: getN(pfx + 'atk'), def: getN(pfx + 'def'),
        mult: getN('cmp-mult', 100), type: type,
        skillPlayerDMG: getN('cmp-skillbonus', 100),
        typeRES: getN('cmp-typeRES'), globalRES: getN('cmp-globalRES'),
        crit: hasCrit, critDMGPct: getN(pfx + 'critDMG', 150), critRESPct: getN('cmp-critRES', 100),
        skillCrit: false, skillCritMult: 0,
        boss: hasBoss, bossDMGPct: getN('cmp-bossDMG'),
        pvp: hasPvP, pvpMyLv: getN('cmp-pvpMyLv', 100), pvpELv: getN('cmp-pvpELv', 100)
      });
    }
    var rA = build('cmp-a-'), rB = build('cmp-b-');
    renderLog('cmp-a-steps', rA); renderLog('cmp-b-steps', rB);
    var diff = rB.final - rA.final;
    var pct  = rA.final > 0 ? diff / rA.final * 100 : 0;
    var el   = $('cmp-diff');
    if (el) { el.textContent = 'B ' + (diff >= 0 ? '+' : '') + fmt(diff) + ' (' + (diff >= 0 ? '+' : '') + fmtF(pct, 1) + '%)'; el.style.color = diff >= 0 ? 'var(--teal)' : 'var(--red)'; }
  }

  function updatePal() {
    var hasCrit = getB('pal-crit'), hasCombo = getB('pal-combo'), hasBoss = getB('pal-boss'), hasPvP = getB('pal-pvp');
    toggleEl('pal-crit-opts', hasCrit); toggleEl('pal-combo-opts', hasCombo);
    toggleEl('pal-boss-opts', hasBoss); toggleEl('pal-pvp-opts', hasPvP);
    var result = calcPal({
      atk: getN('pal-atk'), def: getN('pal-def'),
      palMult: getN('pal-mult', 100), palDMGPct: getN('pal-dmgpct', 100),
      palRES: getN('pal-res'), globalRES: getN('pal-globalres'),
      palCrit: hasCrit, palCritDMGPct: getN('pal-critdmg', 150), palCritRESPct: getN('pal-critres', 100),
      palCombo: hasCombo, palComboMult: getN('pal-combomult', 100),
      boss: hasBoss, bossDMGPct: getN('pal-bossdmg'),
      pvp: hasPvP, pvpMyLv: getN('pal-pvpMyLv', 100), pvpELv: getN('pal-pvpELv', 100)
    });
    renderLog('pal-steps', result);
  }

  function updateComparePal() {
    var hasCrit = getB('cpal-crit'), hasCombo = getB('cpal-combo'), hasBoss = getB('cpal-boss'), hasPvP = getB('cpal-pvp');
    toggleEl('cpal-crit-opts', hasCrit); toggleEl('cpal-combo-opts', hasCombo);
    toggleEl('cpal-boss-opts', hasBoss); toggleEl('cpal-pvp-opts', hasPvP);
    function build(pfx) {
      return calcPal({
        atk: getN(pfx + 'atk'), def: getN(pfx + 'def'),
        palMult: getN('cpal-mult', 100), palDMGPct: getN(pfx + 'dmgpct', 100),
        palRES: getN('cpal-palres'), globalRES: getN('cpal-globalres'),
        palCrit: hasCrit, palCritDMGPct: getN(pfx + 'critdmg', 150), palCritRESPct: getN('cpal-critres', 100),
        palCombo: hasCombo, palComboMult: getN('cpal-combomult', 100),
        boss: hasBoss, bossDMGPct: getN('cpal-bossdmg'),
        pvp: hasPvP, pvpMyLv: getN('cpal-pvpMyLv', 100), pvpELv: getN('cpal-pvpELv', 100)
      });
    }
    var rA = build('cpal-a-'), rB = build('cpal-b-');
    renderLog('cpal-a-steps', rA); renderLog('cpal-b-steps', rB);
    var diff = rB.final - rA.final;
    var pct  = rA.final > 0 ? diff / rA.final * 100 : 0;
    var el   = $('cpal-diff');
    if (el) { el.textContent = 'B ' + (diff >= 0 ? '+' : '') + fmt(diff) + ' (' + (diff >= 0 ? '+' : '') + fmtF(pct, 1) + '%)'; el.style.color = diff >= 0 ? 'var(--teal)' : 'var(--red)'; }
  }

  function updateHPDmg() {
    var hasPvP = getB('hp-pvp');
    var hpType = getV('hp-type') || 'max';
    toggleEl('hp-pvp-opts', hasPvP);
    var result = calcHPDmg({
      targetHP: getN('hp-target-hp', 1000000),
      hpPct:    getN('hp-pct', 5),
      hpType:   hpType,
      playerATK:  getN('hp-player-atk'),
      enemyDEF:   getN('hp-enemy-def'),
      basicMult:  getN('hp-basic-mult', 100),
      pvp: hasPvP, pvpMyLv: getN('hp-pvpMyLv', 100), pvpELv: getN('hp-pvpELv', 100)
    });
    renderLog('hp-steps', result);
  }

  function updateSailing() {
    var hasCombo = getB('sail-combo');
    toggleEl('sail-combo-opts', hasCombo);
    var result = calcSailing({
      captBasicATKDMG:    getN('sail-capt-basic-dmg', 100),
      captBasicATKDMGRES: getN('sail-capt-basic-dmgres'),
      shipCannonDMG:      getN('sail-ship-cannon-dmg'),
      hullCannonDMG:      getN('sail-hull-cannon-dmg'),
      captATK:            getN('sail-capt-atk'),
      enemyCaptDEF:       getN('sail-enemy-def'),
      enemyCannonRES:     getN('sail-cannon-res'),
      enemyCaptDMGRES:    getN('sail-capt-dmgres'),
      hasCombo:           hasCombo,
      cannonComboDMG:     getN('sail-combo-mult', 100),
      enemyCaptComboDMGRES: getN('sail-combo-res')
    });
    renderLog('sail-steps', result);
  }

  function updateMechanics() {
    // Taux de combat
    function outRate(id, p, ig, exp) { setTxt(id, fmtF(calcNetRate(p, ig, exp), 2) + '%'); }
    outRate('mec-combo-out',   getN('mec-combo'),   getN('mec-ign-combo'),   false);
    outRate('mec-counter-out', getN('mec-counter'), getN('mec-ign-counter'), false);
    outRate('mec-crit-out',    getN('mec-crit'),    getN('mec-ign-crit'),    false);
    outRate('mec-eva-out',     getN('mec-evasion'), getN('mec-ign-evasion'), true);
    outRate('mec-launch-out',  getN('mec-launch'),  getN('mec-ign-launch'),  false);
    outRate('mec-stun-out',    getN('mec-stun'),    getN('mec-ign-stun'),    true);

    // Durée de stun
    var isPvPS = getB('mec-stun-pvp');
    toggleEl('mec-stun-pve', !isPvPS);
    var dur = calcStunDur(getN('mec-stun-time', 1), getN('mec-stun-res', 60), getN('mec-control-res'), isPvPS);
    setTxt('mec-stun-dur', fmtF(Math.max(0, dur), 3) + ' sec');

    // Pierce / Block / Pal Inspire / Pal RES
    setTxt('mec-pierce-out',     fmtF(calcNetPierceBlock(getN('mec-pierce'),     getN('mec-ign-pierce')), 2)     + '% DMG RES ignoré (si proc 30%)');
    setTxt('mec-block-out',      fmtF(calcNetPierceBlock(getN('mec-block'),      getN('mec-ign-block')), 2)      + '% DMG RES gagné (si proc 30%)');
    setTxt('mec-palinsp-out',    fmtF(calcNetPierceBlock(getN('mec-palinsp'),    getN('mec-ign-palinsp')), 2)    + '% PalDMGRES ignoré (si proc 30%)');
    setTxt('mec-palres-out',     fmtF(calcNetPierceBlock(getN('mec-palres'),     getN('mec-ign-palres')), 2)     + '% PalDMGRES gagné (si proc 30%)');

    // Régénération
    var isPvPR = getB('mec-regen-pvp');
    var regen = calcNetRegen(getN('mec-regen'), getN('mec-ign-regen'), isPvPR);
    setTxt('mec-regen-out', fmtF(regen, 4) + '% HP max/sec' + (isPvPR ? ' (×30% PvP)' : ''));
  }

  function updateStats() {
    // ATK/HP/DEF
    var s = calcStatFull(getN('stat-initial'), getN('stat-base'), getN('stat-global'));
    setTxt('stat-bfactor', fmtF(s.bFactor));
    setTxt('stat-gfactor', fmtF(s.gFactor));
    setTxt('stat-final',   fmt(s.result));
    setTxt('stat-formula', fmt(getN('stat-initial')) + ' × ' + fmtF(s.bFactor) + ' × ' + fmtF(s.gFactor) + ' = ' + fmt(s.result));

    // Multiplicateurs (ComboMult, BasicATKMult…)
    var mR = finalMult(getN('stat-mult-base', 100), getN('stat-mult-bonus'), getN('stat-mult-global'));
    setTxt('stat-mult-out', fmtF(mR, 2) + '%');
    setTxt('stat-mult-formula', fmtF(getN('stat-mult-base', 100), 2) + '% × (1+' + getN('stat-mult-bonus') + '%) × (1+' + getN('stat-mult-global') + '%) = ' + fmtF(mR, 2) + '%');

    // Crit DMG / Crit RES final
    var fCritDMG = finalMult(getN('stat-cdmg', 150), getN('stat-cdmg-bonus'), getN('stat-cdmg-global'));
    var fCritRES = Math.max(50, finalMult(getN('stat-cres', 100), getN('stat-cres-bonus'), getN('stat-cres-global')));
    var ratio    = critRatio(fCritDMG, fCritRES);
    setTxt('stat-cdmg-out',  fmtF(fCritDMG, 2) + '%');
    setTxt('stat-cres-out',  fmtF(fCritRES, 2) + '% (min 50%)');
    setTxt('stat-cratio-out',fmtF(ratio) + '× (min 1.5)');
  }

  // ─── Init ───
  function wireTab(id, fn) {
    var t = $(id); if (!t) return;
    t.querySelectorAll('input,select').forEach(function (el) {
      el.addEventListener('input', fn); el.addEventListener('change', fn);
    });
  }
  function initTypeGroup(gid, fn) {
    var g = $(gid); if (!g) return;
    g.querySelectorAll('.sim-type-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        g.querySelectorAll('.sim-type-btn').forEach(function (x) { x.classList.remove('active'); });
        this.classList.add('active'); fn();
      });
    });
  }

  function init() {
    // Tab switching
    document.querySelectorAll('.sim-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.sim-tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.sim-tab-content').forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');
        var c = $('sim-tab-' + this.dataset.tab);
        if (c) c.classList.add('active');
      });
    });

    var ham = $('hamburger');
    if (ham) ham.addEventListener('click', function () { $('navLinks').classList.toggle('open'); });

    initTypeGroup('sc-type-btns', updateCombat);
    initTypeGroup('cmp-type-btns', updateCompare);

    wireTab('sim-tab-combat',    updateCombat);
    wireTab('sim-tab-compare',   updateCompare);
    wireTab('sim-tab-pal',       updatePal);
    wireTab('sim-tab-palcmp',    updateComparePal);
    wireTab('sim-tab-hpdmg',     updateHPDmg);
    wireTab('sim-tab-sailing',   updateSailing);
    wireTab('sim-tab-mechanics', updateMechanics);
    wireTab('sim-tab-stats',     updateStats);

    updateCombat(); updateCompare(); updatePal(); updateComparePal();
    updateHPDmg(); updateSailing(); updateMechanics(); updateStats();
  }

  return {
    init: init,
    pvpDiv: pvpDiv, PVP_TABLE: PVP_TABLE,
    calcCombat: calcCombat, calcPal: calcPal, calcHPDmg: calcHPDmg,
    calcSailing: calcSailing, finalStat: finalStat, finalMult: finalMult
  };
})();
