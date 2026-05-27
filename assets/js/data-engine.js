// @ts-check
'use strict';

/** @type {Map<string, {data: any[][], filtered: any[][], sc: number, sd: number}>} */
var _tables = new Map();

function toggleAcc(id) {
  var item = document.getElementById('acc-' + id);
  if (item) item.classList.toggle('open');
}

function initTable(id, data) {
  _tables.set(id, { data: data, filtered: data.slice(), sc: -1, sd: 1 });
  _renderTable(id);
}

function _renderTable(id) {
  var s = _tables.get(id); if (!s) return;
  var tbl = document.getElementById('tbl-' + id); if (!tbl) return;
  var tbody = tbl.querySelector('tbody'); if (!tbody) return;
  var heads = Array.from(tbl.querySelectorAll('thead th'));
  var colR = heads.map(function(th) { return th.classList.contains('r'); });

  tbody.innerHTML = s.filtered.map(function(r) {
    var evol = typeof r[0] === 'string' && /^evol/i.test(String(r[0]));
    var cells = r.map(function(v, i) {
      var cls = colR[i] ? ' class="r"' : '';
      return '<td' + cls + '>' + (v != null ? v : '—') + '</td>';
    }).join('');
    return '<tr' + (evol ? ' class="evol"' : '') + '>' + cells + '</tr>';
  }).join('');

  tbody.querySelectorAll('tr:not(.evol) td:first-child').forEach(function(td) {
    td.classList.add('hi');
  });

  var cnt = document.getElementById('cnt-' + id);
  if (cnt) {
    var total = s.data.length, shown = s.filtered.length;
    cnt.textContent = shown === total ? total + ' rows' : shown + ' / ' + total + ' rows';
  }
}

function sortTable(id, col) {
  var s = _tables.get(id); if (!s) return;
  if (s.sc === col) { s.sd *= -1; } else { s.sc = col; s.sd = 1; }
  var sd = s.sd;
  s.filtered.sort(function(a, b) {
    var av = a[col] != null ? a[col] : '';
    var bv = b[col] != null ? b[col] : '';
    var an = parseFloat(String(av).replace(/[^\d.\-]/g, ''));
    var bn = parseFloat(String(bv).replace(/[^\d.\-]/g, ''));
    return ((!isNaN(an) && !isNaN(bn)) ? an - bn : String(av).localeCompare(String(bv))) * sd;
  });
  var tbl = document.getElementById('tbl-' + id);
  if (tbl) tbl.querySelectorAll('thead th').forEach(function(th, i) {
    th.removeAttribute('data-sort');
    if (i === col) th.setAttribute('data-sort', s.sd === 1 ? 'asc' : 'desc');
  });
  _renderTable(id);
}

function filterTable(id, q) {
  var s = _tables.get(id); if (!s) return;
  var lq = q.trim().toLowerCase();
  s.filtered = lq
    ? s.data.filter(function(r) {
        return r.some(function(c) { return String(c != null ? c : '').toLowerCase().indexOf(lq) >= 0; });
      })
    : s.data.slice();
  _renderTable(id);
}

function wireControls() {
  document.querySelectorAll('.toolbar input[data-tbl]').forEach(function(inp) {
    var el = inp;
    el.addEventListener('input', function() { filterTable(el.dataset.tbl || '', el.value); });
  });
  document.querySelectorAll('table.dt thead th[data-col]').forEach(function(th) {
    var el = th;
    el.addEventListener('click', function() {
      var tbl = el.closest('table');
      sortTable(tbl ? tbl.id.replace('tbl-', '') : '', +(el.dataset.col || 0));
    });
  });
  document.querySelectorAll('.acc-head[data-acc]').forEach(function(btn) {
    var el = btn;
    el.addEventListener('click', function() { toggleAcc(el.dataset.acc || ''); });
  });
}
