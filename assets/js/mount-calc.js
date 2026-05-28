// @ts-check
// Mount Upgrade Calculator — derives STAGES from cwDet (clockwinder.js)
(function () {
  'use strict';

  var GEMS_PER_CW = 35;

  // cwDet format: [label, stepCW, cumulCW, atk%, hp%]
  var STAGES = cwDet.map(function (r) {
    return { label: r[0], cumul: parseInt(r[2]) };
  });

  var startSel = document.getElementById('mount-start');
  var endSel   = document.getElementById('mount-end');
  var ownedIn  = document.getElementById('mount-owned');
  var gemsChk  = document.getElementById('mount-gems');
  var warnEl   = document.getElementById('mount-warn');
  var bodyEl   = document.getElementById('mount-results-body');

  function buildSelect(sel) {
    var lastRank = '', grp = null;
    STAGES.forEach(function (s, i) {
      var rank = s.label.replace(/★\d+$/, '');
      if (rank !== lastRank) {
        grp = document.createElement('optgroup');
        grp.label = '── ' + rank + ' ──';
        sel.appendChild(grp);
        lastRank = rank;
      }
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = s.label;
      grp.appendChild(opt);
    });
  }

  buildSelect(startSel);
  buildSelect(endSel);
  startSel.value = 0;
  var r5idx = STAGES.findIndex(function (s) { return s.label === 'R5★1'; });
  endSel.value = r5idx;

  var fmt  = function (n) { return Math.round(n).toLocaleString(); };
  var fmtK = function (n) { return n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n); };

  function getBreakdown(si, ei) {
    var map = {};
    for (var i = si; i < ei; i++) {
      var rank = STAGES[i + 1].label.replace(/★\d+$/, '');
      var cost = STAGES[i + 1].cumul - STAGES[i].cumul;
      map[rank] = (map[rank] || 0) + cost;
    }
    return Object.keys(map).map(function (k) { return [k, map[k]]; });
  }

  function render() {
    var si      = parseInt(startSel.value);
    var ei      = parseInt(endSel.value);
    var owned   = Math.max(0, parseInt(ownedIn.value) || 0);
    var showGem = gemsChk.checked;

    if (ei <= si) {
      warnEl.style.display = '';
      bodyEl.innerHTML = '';
      return;
    }
    warnEl.style.display = 'none';

    var totalCW  = STAGES[ei].cumul - STAGES[si].cumul;
    var stillNeed = Math.max(0, totalCW - owned);
    var hasEnough = owned > 0 && owned >= totalCW;
    var gemTotal  = totalCW * GEMS_PER_CW;
    var gemStill  = stillNeed * GEMS_PER_CW;
    var hasOwned  = owned > 0;
    var bkd       = getBreakdown(si, ei);

    var h = '';

    // Route summary
    h += '<div style="text-align:center;margin-bottom:16px;font-size:0.9rem;font-weight:700">';
    h += '<span style="color:var(--gold)">' + STAGES[si].label + '</span>';
    h += ' <span style="color:var(--text-muted)">→</span> ';
    h += '<span style="color:var(--gold)">' + STAGES[ei].label + '</span>';
    h += ' <span style="color:var(--text-muted);font-weight:400;font-size:0.78rem">(' + (ei - si) + ' étoiles)</span>';
    h += '</div>';

    // Result rows
    h += '<div class="result-row"><span class="lbl">⚙️ Total Clock-winders</span><span class="val gold">' + fmt(totalCW) + '</span></div>';

    if (hasOwned) {
      h += '<div class="result-row"><span class="lbl">📦 Déjà possédés</span><span class="val">' + fmt(owned) + '</span></div>';
      if (hasEnough) {
        h += '<div class="result-row"><span class="lbl">✅ Surplus</span><span class="val" style="color:var(--teal)">+' + fmt(owned - totalCW) + '</span></div>';
      } else {
        h += '<div class="result-row"><span class="lbl">⚙️ Encore nécessaire</span><span class="val" style="color:var(--orange)">' + fmt(stillNeed) + '</span></div>';
      }
    }

    if (showGem) {
      h += '<div class="result-row"><span class="lbl">💎 Total en Gemmes</span><span class="val" style="color:var(--purple)">' + fmt(gemTotal) + '</span></div>';
      if (hasOwned && !hasEnough) {
        h += '<div class="result-row"><span class="lbl">💎 Gemmes manquantes</span><span class="val" style="color:var(--purple)">' + fmt(gemStill) + '</span></div>';
      }
    }

    // Final box
    if (hasEnough) {
      h += '<div class="result-final" style="background:rgba(32,212,168,0.08);border-color:var(--teal);margin-top:12px">';
      h += '<div class="lbl">🎉 Vous avez assez !</div>';
      h += '<div class="val" style="color:var(--teal)">' + fmt(owned - totalCW) + ' ⚙️ de surplus</div>';
      h += '</div>';
    } else {
      h += '<div class="result-final" style="margin-top:12px">';
      h += '<div class="lbl">⚙️ Coût Total</div>';
      h += '<div class="val">' + fmt(totalCW) + '</div>';
      h += '</div>';
    }

    if (showGem) {
      h += '<div class="info-box" style="margin-top:10px;font-size:0.78rem">💎 ' + fmt(totalCW) + ' ⚙️ = ' + fmtK(gemTotal) + ' 💎 &nbsp;·&nbsp; taux : 1 ⚙️ = ' + GEMS_PER_CW + ' 💎</div>';
    }

    // Breakdown table
    if (bkd.length > 1) {
      h += '<div style="margin-top:20px">';
      h += '<div class="result-step-label" style="margin-bottom:8px">📋 Détail par rang</div>';
      h += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:0.82rem">';
      h += '<thead><tr style="border-bottom:1px solid var(--border)">';
      h += '<th style="text-align:left;padding:5px 4px;color:var(--text-muted);font-weight:600">Rang</th>';
      h += '<th style="text-align:right;padding:5px 4px;color:var(--text-muted);font-weight:600">⚙️ CW</th>';
      h += '<th style="text-align:right;padding:5px 4px;color:var(--text-muted);font-weight:600">' + (showGem ? '💎 Gemmes' : '% part') + '</th>';
      h += '</tr></thead><tbody>';
      bkd.forEach(function (entry) {
        var rank = entry[0], cw = entry[1];
        var gems = cw * GEMS_PER_CW;
        var pct = Math.round(cw / totalCW * 100);
        h += '<tr style="border-bottom:1px solid var(--border)">';
        h += '<td style="padding:5px 4px;color:var(--gold);font-weight:700">' + rank + '</td>';
        h += '<td style="text-align:right;padding:5px 4px;font-family:monospace">' + fmt(cw) + '</td>';
        h += '<td style="text-align:right;padding:5px 4px;font-family:monospace;color:' + (showGem ? 'var(--purple)' : 'var(--text-muted)') + '">';
        h += (showGem ? fmt(gems) : pct + '%') + '</td>';
        h += '</tr>';
      });
      h += '<tr style="border-top:2px solid var(--border)">';
      h += '<td style="padding:5px 4px;font-weight:700;color:var(--text-primary)">Total</td>';
      h += '<td style="text-align:right;padding:5px 4px;color:var(--gold);font-weight:700;font-family:monospace">' + fmt(totalCW) + '</td>';
      h += '<td style="text-align:right;padding:5px 4px;font-weight:700;font-family:monospace;color:' + (showGem ? 'var(--purple)' : 'var(--text-muted)') + '">' + (showGem ? fmt(gemTotal) : '100%') + '</td>';
      h += '</tr>';
      h += '</tbody></table></div>';
      h += '</div>';
    }

    bodyEl.innerHTML = h;
  }

  startSel.addEventListener('change', render);
  endSel.addEventListener('change', render);
  ownedIn.addEventListener('input', render);
  gemsChk.addEventListener('change', render);
  render();
})();
