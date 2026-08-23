/* ================================================================
   shared.js — Compound Interest Calculator (all rate pages)
   Each rate page sets window.RATE_CONFIG before this file loads.

   Formula (generalized from Ankur.java):
     a * Math.pow(1 + Rate/100, c) * (1 + d / 100)
     c = floor(b / 12)   — complete years
     d = b % 12          — remaining months
     b = calculated from date difference + rounding rule

   Display rules (Ankur.java):
     principal : Math.floor()
     interest  : Math.ceil()
     amount    : Math.ceil()
     totals    : integer sums
================================================================ */

(function () {
  'use strict';

  /* ── Rate Registry (used for nav on every page) ──────────────── */
  var ALL_RATES = [
    { rate: 1,    label: '1%',    file: 'rate-1.html',   accent: '#38bdf8', rgb: '56,189,248'  },
    { rate: 1.75, label: '1.75%', file: 'rate-175.html', accent: '#10d9a0', rgb: '16,217,160'  },
    { rate: 2,    label: '2%',    file: 'rate-2.html',   accent: '#a78bfa', rgb: '167,139,250' },
    { rate: 2.5,  label: '2.5%',  file: 'rate-25.html',  accent: '#00e6c8', rgb: '0,230,200'   },
    { rate: 3,    label: '3%',    file: 'rate-3.html',   accent: '#f59e0b', rgb: '245,158,11'  },
    { rate: 5,    label: '5%',    file: 'rate-5.html',   accent: '#f43f5e', rgb: '244,63,94'   }
  ];

  var C = window.RATE_CONFIG;  /* page-specific config */
  var entries = [];

  /* ── Apply CSS theme variables ─────────────────────────────── */
  function applyTheme() {
    var r = document.documentElement;
    r.style.setProperty('--accent',        C.accent);
    r.style.setProperty('--accent-dim',    'rgba(' + C.rgb + ',0.15)');
    r.style.setProperty('--accent-glow',   'rgba(' + C.rgb + ',0.35)');
    r.style.setProperty('--border-focus',  'rgba(' + C.rgb + ',0.55)');
    r.style.setProperty('--bg-glow',       'rgba(' + C.rgb + ',0.06)');
    r.style.setProperty('--shadow-glow',   '0 0 24px rgba(' + C.rgb + ',0.18)');
    r.style.setProperty('--row-hover',     'rgba(' + C.rgb + ',0.06)');
  }

  /* ── Build navigation bar ──────────────────────────────────── */
  function buildNav() {
    var nav = document.getElementById('main-nav');
    if (!nav) return;

    var links = ALL_RATES.map(function (r) {
      var active = (r.rate === C.rate);
      return (
        '<a href="' + r.file + '" class="nav-link' + (active ? ' active' : '') + '">' +
          r.label +
        '</a>'
      );
    }).join('');

    nav.innerHTML =
      '<div class="nav-inner">' +
        '<a href="index.html" class="nav-brand">' +
          '<span class="brand-icon">&#128201;</span>' +
          '<span>Compound<span class="brand-accent">Calc</span></span>' +
        '</a>' +
        '<div class="nav-divider"></div>' +
        '<div class="nav-links">' + links + '</div>' +
      '</div>';
  }

  /* ── Populate dynamic text labels ──────────────────────────── */
  function fillLabels() {
    document.title = C.label + ' Compound Interest Calculator';
    setText('lbl-badge',    C.label);
    setText('lbl-h1',       C.label + ' Annual Rate Calculator');
    setText('lbl-subtitle',
      'Compound interest at ' + C.label + ' per year · ' +
      'Formula: a \u00d7 (1\u202f+\u202f' + C.rate + '/100)\u1d9c \u00d7 (1\u202f+\u202fd/100)'
    );
    setText('lbl-formula',
      'Amount = a \u00d7 (1\u202f+\u202f' + C.rate + '/100)\u1d9c \u00d7 (1\u202f+\u202fd/100)'
    );
  }

  /* ── Helpers ────────────────────────────────────────────────── */
  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function todayLocal() {
    var t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }

  function toInputValue(d) {
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  function parseInputDate(val) {
    var p = val.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function fmtDate(d) {
    var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + M[d.getMonth()] + ' ' + d.getFullYear();
  }

  function fmtNum(n) {
    return n.toLocaleString('en-IN');
  }

  /* ── Date → Months with rounding rule ──────────────────────── */
  /*
    Steps:
    1. Count whole months between startDate and endDate.
    2. Advance startDate by those months and count leftover days.
    3. Rounding rule:
         leftover 1-2 days → round down (ignore)
         leftover 3+ days  → round up (+1 month)
  */
  function calcMonths(startDate, endDate) {
    var sy = startDate.getFullYear(), sm = startDate.getMonth(), sd = startDate.getDate();
    var ny = endDate.getFullYear(),   nm = endDate.getMonth();

    var totalM = (ny - sy) * 12 + (nm - sm);

    /* leftover days after advancing startDate by totalM months */
    var advDate = new Date(sy, sm + totalM, sd);
    var rawDays = Math.floor((endDate - advDate) / 86400000);

    var roundedUp = (rawDays >= 3);
    if (roundedUp) totalM++;

    /* display values (pre-rounding raw diff) */
    var preTotalM = roundedUp ? totalM - 1 : totalM;
    var rawYears  = Math.floor(preTotalM / 12);
    var rawMonths = preTotalM % 12;

    return { b: totalM, rawYears: rawYears, rawMonths: rawMonths, rawDays: rawDays, roundedUp: roundedUp };
  }

  /* ── Formula (generalized Ankur.java) ──────────────────────── */
  function calculate(a, b) {
    var c = Math.floor(b / 12);                            /* complete years  */
    var d = b % 12;                                        /* remaining months */
    var amount   = a * Math.pow(1 + C.rate / 100, c) * (1 + d / 100);
    var interest = amount - a;
    return { amount: amount, interest: interest };
  }

  /* Java display rules */
  function dP(n) { return Math.floor(n); }
  function dI(n) { return Math.ceil(n);  }
  function dA(n) { return Math.ceil(n);  }

  /* ── DOM refs (set during init) ─────────────────────────────── */
  var inpPrincipal, inpStartDate, inpCurrentDate, datePreview;
  var alertError, alertMsg, alertInfo;

  /* ── Live date preview ──────────────────────────────────────── */
  function updatePreview() {
    if (!inpStartDate || !inpCurrentDate || !datePreview) return;
    var sv = inpStartDate.value;
    var ev = inpCurrentDate.value;
    if (!sv || !ev) { datePreview.classList.remove('show'); return; }

    var sd = parseInputDate(sv);
    var ed = parseInputDate(ev);
    if (sd >= ed) { datePreview.classList.remove('show'); return; }

    var info = calcMonths(sd, ed);

    setText('dp-start',  fmtDate(sd));
    setText('dp-end',    fmtDate(ed));
    setText('dp-months', info.b + ' months');

    /* raw diff string */
    var parts = [];
    if (info.rawYears  > 0) parts.push(info.rawYears  + (info.rawYears  === 1 ? ' yr'   : ' yrs'));
    if (info.rawMonths > 0) parts.push(info.rawMonths + (info.rawMonths === 1 ? ' month': ' months'));
    if (info.rawDays   > 0) parts.push(info.rawDays   + (info.rawDays   === 1 ? ' day'  : ' days'));

    var rawEl  = document.getElementById('dp-raw');
    var descEl = document.getElementById('dp-desc');
    var pillEl = document.getElementById('dp-pill');
    if (rawEl) rawEl.innerHTML = '<strong>' + (parts.join(', ') || '0 days') + '</strong>';

    if (descEl && pillEl) {
      if (info.roundedUp) {
        descEl.innerHTML = 'Days &ge; 3 &rarr; rounded <span class="hi">up</span> to ' + info.b + ' months (b)';
        pillEl.textContent = '\u2191 Rounded up (+1 month)';
        pillEl.className   = 'rounding-badge up';
      } else {
        descEl.innerHTML = 'Days &le; 2 &rarr; leftover days <span class="hi">ignored</span>, using ' + info.b + ' months (b)';
        pillEl.textContent = '\u2193 Rounded down (days ignored)';
        pillEl.className   = 'rounding-badge down';
      }
    }

    datePreview.classList.add('show');
  }

  /* ── Alert helpers ──────────────────────────────────────────── */
  function clearAlerts() {
    if (alertError) alertError.classList.remove('show');
    if (alertInfo)  alertInfo.classList.remove('show');
  }
  function showError(msg, focusEl) {
    if (alertMsg)   alertMsg.textContent = msg;
    if (alertError) alertError.classList.add('show');
    if (alertInfo)  alertInfo.classList.remove('show');
    if (focusEl)    focusEl.focus();
  }

  /* ── Add entry ──────────────────────────────────────────────── */
  function addEntry() {
    clearAlerts();

    var rawA = inpPrincipal ? inpPrincipal.value.trim() : '';
    var sv   = inpStartDate   ? inpStartDate.value   : '';
    var ev   = inpCurrentDate ? inpCurrentDate.value : '';

    if (!rawA) { showError('Please enter a Principal amount.', inpPrincipal); return; }
    if (!sv)   { showError('Please select a Start Date.',      inpStartDate);  return; }

    var a = parseFloat(rawA);
    if (isNaN(a) || a < 0) { showError('Principal must be a non-negative number.', inpPrincipal); return; }

    /* Java loop-exit: principal == 0 */
    if (a === 0) {
      if (alertInfo) alertInfo.classList.add('show');
      inpPrincipal.value = '';
      if (inpStartDate) inpStartDate.value = '';
      if (datePreview)  datePreview.classList.remove('show');
      inpPrincipal.focus();
      return;
    }

    var sd = parseInputDate(sv);
    var ed = ev ? parseInputDate(ev) : todayLocal();

    if (sd >= ed) { showError('Start Date must be before Current Date.', inpStartDate); return; }

    var info = calcMonths(sd, ed);
    if (info.b <= 0) { showError('Difference must be at least 1 month.', inpStartDate); return; }

    var result = calculate(a, info.b);
    entries.push({ principal: a, interest: result.interest, months: info.b, amount: result.amount });

    renderTable();
    updateSummary();

    inpPrincipal.value = '';
    if (inpStartDate) inpStartDate.value = '';
    if (datePreview)  datePreview.classList.remove('show');
    inpPrincipal.focus();
  }

  /* ── Render table rows ──────────────────────────────────────── */
  function renderTable() {
    var tableSection = document.getElementById('table-section');
    var summaryRow   = document.getElementById('summary-row');
    var tableBody    = document.getElementById('table-body');
    var badge        = document.getElementById('entry-badge');

    if (tableSection) tableSection.classList.add('show');
    if (summaryRow)   summaryRow.classList.add('show');
    if (!tableBody)   return;

    tableBody.innerHTML = '';
    entries.forEach(function (e, i) {
      var tr = document.createElement('tr');
      tr.className = 'anim';
      tr.innerHTML =
        '<td>' + (i + 1) + '</td>' +
        '<td class="td-p">' + fmtNum(dP(e.principal)) + '</td>' +
        '<td class="td-m">' + e.months + '</td>' +
        '<td class="td-i">' + fmtNum(dI(e.interest))  + '</td>' +
        '<td class="td-a">' + fmtNum(dA(e.amount))    + '</td>';
      tableBody.appendChild(tr);
    });

    if (badge) badge.textContent = entries.length === 1 ? '1 entry' : entries.length + ' entries';
  }

  /* ── Update summary chips and footer totals ─────────────────── */
  function updateSummary() {
    var totP = entries.reduce(function (s, e) { return s + dP(e.principal); }, 0);
    var totM = entries.reduce(function (s, e) { return s + e.months;        }, 0);
    var totI = entries.reduce(function (s, e) { return s + dI(e.interest);  }, 0);
    var totA = entries.reduce(function (s, e) { return s + dA(e.amount);    }, 0);

    setText('chip-p', fmtNum(totP));
    setText('chip-m', totM);
    setText('chip-i', fmtNum(totI));
    setText('chip-a', fmtNum(totA));
    setText('tf-p', fmtNum(totP));
    setText('tf-m', totM);
    setText('tf-i', fmtNum(totI));
    setText('tf-a', fmtNum(totA));
  }

  /* ── Reset all entries ──────────────────────────────────────── */
  function resetAll() {
    entries.length = 0;
    var tableSection = document.getElementById('table-section');
    var summaryRow   = document.getElementById('summary-row');
    var tableBody    = document.getElementById('table-body');
    if (tableSection) tableSection.classList.remove('show');
    if (summaryRow)   summaryRow.classList.remove('show');
    if (tableBody)    tableBody.innerHTML = '';
    if (datePreview)  datePreview.classList.remove('show');
    clearAlerts();
    updateSummary();
    if (inpPrincipal) { inpPrincipal.value = ''; inpPrincipal.focus(); }
    if (inpStartDate) inpStartDate.value = '';
  }

  /* ── Initialise on DOM ready ────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme();
    buildNav();
    fillLabels();

    inpPrincipal   = document.getElementById('inp-principal');
    inpStartDate   = document.getElementById('inp-start-date');
    inpCurrentDate = document.getElementById('inp-current-date');
    datePreview    = document.getElementById('date-preview');
    alertError     = document.getElementById('alert-error');
    alertMsg       = document.getElementById('alert-msg');
    alertInfo      = document.getElementById('alert-info');

    /* Auto-fill current date */
    if (inpCurrentDate) inpCurrentDate.value = toInputValue(todayLocal());

    /* Cap start date to today */
    if (inpStartDate) {
      inpStartDate.setAttribute('max', toInputValue(todayLocal()));
      inpStartDate.addEventListener('change', updatePreview);
    }
    if (inpCurrentDate) inpCurrentDate.addEventListener('change', updatePreview);

    var btnAdd   = document.getElementById('btn-add');
    var btnReset = document.getElementById('btn-reset');
    if (btnAdd)   btnAdd.addEventListener('click', addEntry);
    if (btnReset) btnReset.addEventListener('click', resetAll);

    if (inpPrincipal) {
      inpPrincipal.addEventListener('keydown', function (e) { if (e.key === 'Enter') addEntry(); });
      inpPrincipal.focus();
    }

    updateSummary();
  });

})();
