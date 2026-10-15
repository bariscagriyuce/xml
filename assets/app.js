/* NF-e XML Analyzer — UI controller */
(function () {
  'use strict';
  var t = I18N.t;
  var $ = function (id) { return document.getElementById(id); };

  var state = {
    notes: [],                 // parsed notes (each with .xml raw text)
    byId: new Map(),
    pendingCancels: new Map(), // key -> cancel event received before its note
    selected: new Set(),
    tab: 'notes',
    sort: { key: 'date', dir: -1 },
    current: null              // note open in detail dialog
  };
  var MAX_ROWS = 3000;

  /* ---------------- storage (IndexedDB, best effort) ---------------- */
  var db = null;
  function openDb() {
    return new Promise(function (resolve) {
      try {
        var req = indexedDB.open('nfe-analyzer', 1);
        req.onupgradeneeded = function () { req.result.createObjectStore('files', { keyPath: 'id' }); };
        req.onsuccess = function () { db = req.result; resolve(); };
        req.onerror = function () { resolve(); };
      } catch (e) { resolve(); }
    });
  }
  function dbTx(mode, fn) {
    if (!db) return Promise.resolve();
    return new Promise(function (resolve) {
      try {
        var tx = db.transaction('files', mode);
        var r = fn(tx.objectStore('files'));
        tx.oncomplete = function () { resolve(r && r.result); };
        tx.onerror = tx.onabort = function () { resolve(); };
      } catch (e) { resolve(); }
    });
  }
  function dbPut(rec) { return dbTx('readwrite', function (s) { s.put(rec); }); }
  function dbAll() { return dbTx('readonly', function (s) { return s.getAll(); }); }
  function dbClear() { return dbTx('readwrite', function (s) { s.clear(); }); }

  /* ---------------- formatting ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(v) {
    return new Intl.NumberFormat(I18N.locale, { style: 'currency', currency: 'BRL' }).format(+v || 0);
  }
  function number(v, max) {
    return new Intl.NumberFormat(I18N.locale, { maximumFractionDigits: max == null ? 4 : max }).format(+v || 0);
  }
  function isoParts(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2}))?/.exec(iso || '');
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0))) : null;
  }
  function fDate(iso, withTime) {
    var d = isoParts(iso);
    if (!d) return '';
    var o = { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' };
    if (withTime && /T/.test(iso)) { o.hour = '2-digit'; o.minute = '2-digit'; o.second = '2-digit'; }
    return new Intl.DateTimeFormat(I18N.locale, o).format(d);
  }
  function fMonth(ym) {
    var d = isoParts(ym + '-01');
    return d ? new Intl.DateTimeFormat(I18N.locale, { timeZone: 'UTC', year: 'numeric', month: 'short' }).format(d) : ym;
  }
  var fmt = DANFE.fmt;
  function statusPill(n) { return '<span class="pill ' + n.status + '">' + esc(t('st_' + n.status)) + '</span>'; }
  function typePill(n) {
    return n.ide.tpNF === '0' ? '<span class="pill in">' + esc(t('entry')) + '</span>' : '<span class="pill out">' + esc(t('exit')) + '</span>';
  }
  function counts(n) { return n.status !== 'cancelled' && n.status !== 'denied'; }

  /* ---------------- ingest ---------------- */
  function applyCancel(note, c) {
    note.cancel = c;
    note.status = 'cancelled';
  }

  function ingest(name, text, persist, report) {
    var res;
    try { res = NFeParser.parse(text, name); }
    catch (e) { report.failed.push(name + ' — ' + t(e.message === 'invalidXml' ? 'err_invalidXml' : 'err_notNFe')); return; }

    if (res.kind === 'cancel') {
      if (!res.ok) { report.failed.push(name); return; }
      var target = state.byId.get(res.key);
      if (target) applyCancel(target, res); else state.pendingCancels.set(res.key, res);
      report.cancels++;
      if (persist) dbPut({ id: 'evt-' + res.key, name: name, xml: text });
      return;
    }
    var note = res.note;
    if (state.byId.has(note.id)) { report.dups++; return; }
    note.xml = text;
    var pending = state.pendingCancels.get(note.key);
    if (pending) { applyCancel(note, pending); state.pendingCancels.delete(note.key); }
    state.notes.push(note);
    state.byId.set(note.id, note);
    report.loaded++;
    if (persist) dbPut({ id: note.id, name: name, xml: text });
  }

  function newReport() { return { loaded: 0, dups: 0, cancels: 0, failed: [] }; }

  async function handleFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    busy(true, '…');
    var report = newReport();
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      try {
        if (/\.zip$/i.test(f.name) || f.type === 'application/zip') {
          var zip = await JSZip.loadAsync(f);
          var entries = Object.keys(zip.files).filter(function (k) { return !zip.files[k].dir && /\.xml$/i.test(k); });
          for (var j = 0; j < entries.length; j++) {
            ingest(entries[j].split('/').pop(), await zip.files[entries[j]].async('string'), true, report);
          }
        } else {
          ingest(f.name, await f.text(), true, report);
        }
      } catch (e) {
        report.failed.push(f.name);
      }
    }
    busy(false);
    showReport(report);
    render();
  }

  function showReport(r) {
    var parts = [];
    if (r.loaded) parts.push(esc(t('loadedMsg', { n: r.loaded })));
    if (r.cancels) parts.push(esc(t('cancelMsg', { n: r.cancels })));
    if (r.dups) parts.push(esc(t('dupMsg', { n: r.dups })));
    if (r.failed.length) parts.push(esc(t('failedMsg', { n: r.failed.length })));
    var el = $('toast');
    if (!parts.length) { el.className = 'toast'; return; }
    el.innerHTML = parts.join(' · ') + (r.failed.length ? '<ul>' + r.failed.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '');
    el.className = 'toast show';
    clearTimeout(showReport.timer);
    if (!r.failed.length) showReport.timer = setTimeout(function () { el.className = 'toast'; }, 6000);
  }

  /* ---------------- search & filters ---------------- */
  function tokens() {
    return NFeParser.norm($('q').value).split(/\s+/).filter(Boolean);
  }
  function matchTokens(hay, toks) {
    return toks.every(function (tk) {
      var stripped = tk.replace(/[.\-\/]/g, '');
      return hay.indexOf(tk) >= 0 || (stripped && hay.indexOf(stripped) >= 0);
    });
  }
  function filters() {
    return {
      from: $('fFrom').value, to: $('fTo').value,
      min: $('fMin').value === '' ? null : +$('fMin').value,
      max: $('fMax').value === '' ? null : +$('fMax').value,
      type: $('fType').value, status: $('fStatus').value, model: $('fModel').value
    };
  }
  function activeFilterCount() {
    var f = filters();
    return [f.from, f.to, f.min !== null ? 1 : '', f.max !== null ? 1 : '', f.type, f.status, f.model].filter(Boolean).length;
  }
  function filtered() {
    var toks = tokens(), field = $('qField').value, f = filters();
    var list = state.notes.filter(function (n) {
      var d = (n.ide.dhEmi || '').slice(0, 10);
      if (f.from && d < f.from) return false;
      if (f.to && d > f.to) return false;
      if (f.min !== null && n.total.vNF < f.min) return false;
      if (f.max !== null && n.total.vNF > f.max) return false;
      if (f.type && n.ide.tpNF !== f.type) return false;
      if (f.status && n.status !== f.status) return false;
      if (f.model && n.ide.mod !== f.model) return false;
      if (toks.length && !matchTokens(NFeParser.norm(n.search[field] || ''), toks)) return false;
      return true;
    });
    var k = state.sort.key, dir = state.sort.dir;
    var getters = {
      number: function (n) { return +n.ide.nNF || 0; },
      date: function (n) { return n.ide.dhEmi || ''; },
      emitter: function (n) { return (n.emit && n.emit.xNome || '').toLowerCase(); },
      recipient: function (n) { return (n.dest && n.dest.xNome || '').toLowerCase(); },
      value: function (n) { return n.total.vNF; },
      icms: function (n) { return n.total.vICMS; },
      status: function (n) { return n.status; },
      type: function (n) { return n.ide.tpNF; }
    };
    var g = getters[k] || getters.date;
    list.sort(function (a, b) { var x = g(a), y = g(b); return x < y ? -dir : x > y ? dir : 0; });
    return list;
  }
  function itemMatches(it, toks, field) {
    if (!toks.length || ['all', 'product', 'ncm', 'cfop'].indexOf(field) < 0) return true;
    var hay = field === 'ncm' ? it.NCM : field === 'cfop' ? it.CFOP : NFeParser.norm([it.cProd, it.cEAN, it.xProd, it.NCM, it.CFOP, it.CEST].join(' '));
    return matchTokens(hay, toks);
  }
  function hl(text) {
    var s = esc(text), toks = tokens().filter(function (x) { return x.length > 1; });
    if (!toks.length) return s;
    toks.forEach(function (tk) {
      var re = new RegExp('(' + tk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      s = s.replace(/(^|>)([^<]*)/g, function (m, a, b) { return a + b.replace(re, '<mark>$1</mark>'); });
    });
    return s;
  }

  /* ---------------- rendering ---------------- */
  function render() {
    var list = filtered();
    renderKpis(list);
    var fc = activeFilterCount();
    $('filterCount').hidden = !fc; $('filterCount').textContent = fc;
    $('countInfo').textContent = state.notes.length ? t('showing', { n: list.length, m: state.notes.length }) : '';
    $('selCount').hidden = !state.selected.size; $('selCount').textContent = state.selected.size;
    ['pdfSelected', 'exportCsv', 'exportItems', 'clearAll'].forEach(function (id) { $(id).disabled = !state.notes.length; });
    if (state.tab === 'notes') renderNotes(list);
    else if (state.tab === 'items') renderItems(list);
    else renderSummary(list);
  }

  function renderKpis(list) {
    var valid = list.filter(counts), sum = function (k) { return valid.reduce(function (a, n) { return a + n.total[k]; }, 0); };
    var emitters = new Set(list.map(function (n) { return n.emit && n.emit.doc; }));
    var items = list.reduce(function (a, n) { return a + n.items.length; }, 0);
    var k = [['kpiNotes', number(list.length, 0)], ['kpiTotal', money(sum('vNF'))], ['kpiICMS', money(sum('vICMS'))],
      ['kpiIPI', money(sum('vIPI'))], ['kpiItems', number(items, 0)], ['kpiEmitters', number(emitters.size, 0)]];
    $('kpis').innerHTML = k.map(function (x) {
      return '<div class="kpi"><div class="label">' + esc(t(x[0])) + '</div><div class="value" title="' + esc(x[1]) + '">' + esc(x[1]) + '</div></div>';
    }).join('');
  }

  function sortTh(key, label, cls) {
    var arrow = state.sort.key === key ? '<span class="arrow">' + (state.sort.dir > 0 ? '▲' : '▼') + '</span>' : '';
    return '<th class="sortable ' + (cls || '') + '" data-sort="' + key + '">' + esc(t(label)) + arrow + '</th>';
  }

  function renderNotes(list) {
    var v = $('view-notes');
    if (!state.notes.length) { v.innerHTML = '<div class="empty">' + esc(t('noData')) + '</div>'; return; }
    if (!list.length) { v.innerHTML = '<div class="empty">' + esc(t('noResults')) + '</div>'; return; }
    var allSel = list.every(function (n) { return state.selected.has(n.id); });
    var rows = list.slice(0, MAX_ROWS).map(function (n) {
      var e = n.emit || {}, d = n.dest || {};
      return '<tr class="clickable" data-id="' + esc(n.id) + '">' +
        '<td><input type="checkbox" class="sel" ' + (state.selected.has(n.id) ? 'checked' : '') + ' aria-label="select"></td>' +
        '<td class="num"><b>' + hl(n.ide.nNF) + '</b><span class="sub">' + esc(n.ide.serie) + ' · ' + (n.ide.mod === '65' ? 'NFC-e' : 'NF-e') + '</span></td>' +
        '<td>' + esc(fDate(n.ide.dhEmi)) + '</td>' +
        '<td class="name"><span class="main" title="' + esc(e.xNome) + '">' + hl(e.xNome) + '</span><span class="sub">' + hl(fmt.doc(e.doc)) + ' · ' + esc(e.ender && e.ender.UF) + '</span></td>' +
        '<td class="name"><span class="main" title="' + esc(d.xNome) + '">' + hl(d.xNome || '—') + '</span><span class="sub">' + hl(fmt.doc(d.doc)) + (d.ender && d.ender.UF ? ' · ' + esc(d.ender.UF) : '') + '</span></td>' +
        '<td>' + typePill(n) + '</td>' +
        '<td class="num"><b>' + esc(money(n.total.vNF)) + '</b></td>' +
        '<td class="num">' + esc(money(n.total.vICMS)) + '</td>' +
        '<td>' + statusPill(n) + (n.ide.tpAmb === '2' ? '<span class="pill hom">HOM</span>' : '') + '</td>' +
        '<td class="rowact"><button class="btn sm" data-act="pdf">' + esc(t('pdf')) + '</button> <button class="btn sm ghost" data-act="view">' + esc(t('view')) + '</button></td>' +
        '</tr>';
    }).join('');
    v.innerHTML = '<table><thead><tr><th><input type="checkbox" id="selAll" ' + (allSel ? 'checked' : '') + ' title="' + esc(t('selectAll')) + '"></th>' +
      sortTh('number', 'col_number', 'num') + sortTh('date', 'col_date') + sortTh('emitter', 'col_emitter') + sortTh('recipient', 'col_recipient') +
      sortTh('type', 'col_type') + sortTh('value', 'col_value', 'num') + sortTh('icms', 'col_icms', 'num') + sortTh('status', 'col_status') + '<th></th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderItems(list) {
    var v = $('view-items');
    if (!state.notes.length) { v.innerHTML = '<div class="empty">' + esc(t('noData')) + '</div>'; return; }
    var toks = tokens(), field = $('qField').value, rows = [], total = 0;
    list.forEach(function (n) {
      var its = n.items.filter(function (it) { return itemMatches(it, toks, field); });
      if (!its.length && toks.length && field === 'all') its = n.items; // matched via other fields
      its.forEach(function (it) { total++; if (rows.length < MAX_ROWS) rows.push([n, it]); });
    });
    if (!rows.length) { v.innerHTML = '<div class="empty">' + esc(t('noResults')) + '</div>'; return; }
    v.innerHTML = '<table><thead><tr><th>' + esc(t('col_note')) + '</th><th>' + esc(t('col_emitter')) + '</th><th>' + esc(t('i_code')) + '</th><th>' + esc(t('i_desc')) +
      '</th><th>' + esc(t('i_ncm')) + '</th><th>' + esc(t('i_cfop')) + '</th><th class="num">' + esc(t('i_qty')) + '</th><th>' + esc(t('i_unit')) +
      '</th><th class="num">' + esc(t('i_unitValue')) + '</th><th class="num">' + esc(t('i_total')) + '</th><th class="num">' + esc(t('i_icms')) + '</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var n = r[0], it = r[1];
        return '<tr class="clickable" data-id="' + esc(n.id) + '"><td class="num">' + esc(n.ide.nNF) + '<span class="sub">' + esc(fDate(n.ide.dhEmi)) + '</span></td>' +
          '<td class="name"><span class="main">' + esc(n.emit && n.emit.xNome) + '</span></td>' +
          '<td class="mono">' + hl(it.cProd) + '</td><td>' + hl(it.xProd) + '</td><td class="mono">' + hl(it.NCM) + '</td><td class="mono">' + hl(it.CFOP) + '</td>' +
          '<td class="num">' + esc(number(it.qCom)) + '</td><td>' + esc(it.uCom) + '</td><td class="num">' + esc(money(it.vUnCom)) + '</td>' +
          '<td class="num"><b>' + esc(money(it.vProd)) + '</b></td><td class="num">' + esc(money(it.vICMS)) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      (total > rows.length ? '<div class="empty">' + esc(rows.length + ' / ' + total) + '</div>' : '');
  }

  function group(list, keyFn, valFn, labelFn) {
    var m = new Map();
    list.forEach(function (x) {
      var k = keyFn(x); if (k === undefined) return;
      var g = m.get(k) || { label: labelFn(x), count: 0, value: 0 };
      g.count++; g.value += valFn(x); m.set(k, g);
    });
    return Array.from(m.entries()).map(function (e) { e[1].key = e[0]; return e[1]; });
  }
  function card(title, rows, opts) {
    opts = opts || {};
    if (!opts.keepOrder) rows.sort(function (a, b) { return b.value - a.value; });
    rows = rows.slice(0, opts.limit || 15);
    var max = rows.reduce(function (a, r) { return Math.max(a, r.value); }, 0) || 1;
    return '<div class="card"><h3>' + esc(t(title)) + '</h3><table><thead><tr><th></th><th class="num">' + esc(t('count')) + '</th><th class="num">' + esc(t('amount')) +
      '</th><th></th></tr></thead><tbody>' + rows.map(function (r) {
        return '<tr><td class="name"><span class="main" title="' + esc(r.label) + '">' + esc(r.label) + '</span></td><td class="num">' + esc(number(r.count, 0)) +
          '</td><td class="num">' + esc(money(r.value)) + '</td><td><div class="bartrack"><div class="bar" style="width:' + Math.max(2, r.value / max * 100) + '%"></div></div></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function renderSummary(list) {
    var v = $('view-summary');
    if (!state.notes.length) { v.innerHTML = '<div class="empty">' + esc(t('noData')) + '</div>'; return; }
    var valid = list.filter(counts);
    var items = [];
    valid.forEach(function (n) { n.items.forEach(function (it) { items.push(it); }); });
    var vnf = function (n) { return n.total.vNF; };
    var months = group(valid, function (n) { return (n.ide.dhEmi || '').slice(0, 7) || undefined; }, vnf, function (n) { return fMonth((n.ide.dhEmi || '').slice(0, 7)); })
      .sort(function (a, b) { return a.key < b.key ? -1 : 1; });
    v.innerHTML = '<div class="summary-grid">' +
      card('s_byEmitter', group(valid, function (n) { return n.emit && n.emit.doc; }, vnf, function (n) { return (n.emit.xNome || '') + ' (' + fmt.doc(n.emit.doc) + ')'; })) +
      card('s_byRecipient', group(valid, function (n) { return n.dest ? n.dest.doc : '-'; }, vnf, function (n) { return n.dest ? (n.dest.xNome || '') + ' (' + fmt.doc(n.dest.doc) + ')' : '—'; })) +
      card('s_byMonth', months, { keepOrder: true, limit: 60 }) +
      card('s_byUf', group(valid, function (n) { return n.emit && n.emit.ender.UF; }, vnf, function (n) { return n.emit.ender.UF || '—'; })) +
      card('s_byCfop', group(items, function (i) { return i.CFOP; }, function (i) { return i.vProd; }, function (i) { return i.CFOP; })) +
      card('s_byNcm', group(items, function (i) { return i.NCM; }, function (i) { return i.vProd; }, function (i) { return i.NCM; })) +
      '</div>';
  }

  /* ---------------- detail dialog ---------------- */
  function kv(pairs) {
    return '<dl class="kv">' + pairs.filter(function (p) { return p[1] !== '' && p[1] != null; }).map(function (p) {
      return '<div><dt>' + esc(t(p[0])) + '</dt><dd>' + (p[2] ? p[1] : esc(p[1])) + '</dd></div>';
    }).join('') + '</dl>';
  }
  function partyBox(title, p) {
    if (!p) return '<div class="box"><h4>' + esc(t(title)) + '</h4><span class="muted">—</span></div>';
    var en = p.ender || {};
    return '<div class="box"><h4>' + esc(t(title)) + '</h4>' + kv([
      ['name', p.xNome], ['tradeName', p.xFant], ['doc', fmt.doc(p.doc)], ['ie', p.IE],
      ['address', [en.xLgr, en.nro, en.xCpl, en.xBairro].filter(Boolean).join(', ')],
      ['city', [en.xMun, en.UF, fmt.cep(en.CEP)].filter(Boolean).join(' / ')],
      ['phone', fmt.fone(en.fone)], ['email', p.email], ['crt', p.CRT]
    ]) + '</div>';
  }
  function openDetail(id) {
    var n = state.byId.get(id);
    if (!n) return;
    state.current = n;
    var tt = n.total;
    $('detailTitle').innerHTML = '<h2>' + (n.ide.mod === '65' ? 'NFC-e' : 'NF-e') + ' ' + esc(n.ide.nNF) + ' / ' + esc(n.ide.serie) + ' ' + statusPill(n) +
      (n.ide.tpAmb === '2' ? '<span class="pill hom">' + esc(t('env2')) + '</span>' : '') + '</h2><div class="muted mono">' + esc(fmt.key(n.key)) + '</div>';

    var itemsHtml = '<div class="tablewrap"><table><thead><tr><th>#</th><th>' + esc(t('i_code')) + '</th><th>' + esc(t('i_desc')) + '</th><th>' + esc(t('i_ncm')) +
      '</th><th>' + esc(t('i_cst')) + '</th><th>' + esc(t('i_cfop')) + '</th><th class="num">' + esc(t('i_qty')) + '</th><th>' + esc(t('i_unit')) + '</th><th class="num">' + esc(t('i_unitValue')) +
      '</th><th class="num">' + esc(t('i_total')) + '</th><th class="num">' + esc(t('i_icms')) + '</th><th class="num">' + esc(t('i_ipi')) + '</th></tr></thead><tbody>' +
      n.items.map(function (it) {
        return '<tr><td>' + esc(it.nItem) + '</td><td class="mono">' + hl(it.cProd) + '</td><td>' + hl(it.xProd) +
          (it.infAdProd ? '<span class="sub">' + esc(it.infAdProd) + '</span>' : '') + '</td><td class="mono">' + hl(it.NCM) + '</td><td class="mono">' + esc(it.OCST) +
          '</td><td class="mono">' + hl(it.CFOP) + '</td><td class="num">' + esc(number(it.qCom)) + '</td><td>' + esc(it.uCom) + '</td><td class="num">' + esc(money(it.vUnCom)) +
          '</td><td class="num"><b>' + esc(money(it.vProd)) + '</b></td><td class="num">' + esc(money(it.vICMS)) + (it.pICMS ? '<span class="sub">' + esc(number(it.pICMS, 2)) + '%</span>' : '') +
          '</td><td class="num">' + esc(money(it.vIPI)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    var totals = [['t_vProd', tt.vProd], ['t_vFrete', tt.vFrete], ['t_vSeg', tt.vSeg], ['t_vDesc', tt.vDesc], ['t_vOutro', tt.vOutro],
      ['t_vBC', tt.vBC], ['t_vICMS', tt.vICMS], ['t_vBCST', tt.vBCST], ['t_vST', tt.vST], ['t_vIPI', tt.vIPI], ['t_vII', tt.vII],
      ['t_vPIS', tt.vPIS], ['t_vCOFINS', tt.vCOFINS], ['t_vTotTrib', tt.vTotTrib]]
      .filter(function (x) { return x[1]; }).map(function (x) { return [x[0], money(x[1])]; });
    totals.push(['t_vNF', '<b>' + esc(money(tt.vNF)) + '</b>', true]);

    var tr = n.transp, tp = tr.transporta, vol = tr.vol[0];
    var transport = kv([
      ['freightBy', t('fr' + tr.modFrete) !== 'fr' + tr.modFrete ? t('fr' + tr.modFrete) : tr.modFrete],
      ['carrier', tp ? [tp.xNome, fmt.doc(tp.doc)].filter(Boolean).join(' — ') : ''],
      ['address', tp ? [tp.xEnder, tp.xMun, tp.UF].filter(Boolean).join(', ') : ''],
      ['plate', tr.veic ? [tr.veic.placa, tr.veic.UF].filter(Boolean).join(' / ') : ''],
      ['volumes', vol ? [vol.qVol, vol.esp, vol.marca].filter(Boolean).join(' · ') : ''],
      ['grossWeight', vol && vol.pesoB ? number(vol.pesoB, 3) + ' kg' : ''],
      ['netWeight', vol && vol.pesoL ? number(vol.pesoL, 3) + ' kg' : '']
    ]);

    var billing = '';
    if (n.cobr.fat || n.cobr.dup.length) {
      billing = (n.cobr.fat ? kv([['invoice', n.cobr.fat.nFat], ['amount', money(n.cobr.fat.vLiq || n.cobr.fat.vOrig)]]) : '') +
        (n.cobr.dup.length ? '<div class="tablewrap" style="margin-top:8px"><table><thead><tr><th>' + esc(t('installment')) + '</th><th>' + esc(t('dueDate')) + '</th><th class="num">' + esc(t('amount')) +
          '</th></tr></thead><tbody>' + n.cobr.dup.map(function (d) { return '<tr><td>' + esc(d.nDup) + '</td><td>' + esc(fDate(d.dVenc)) + '</td><td class="num">' + esc(money(d.vDup)) + '</td></tr>'; }).join('') +
          '</tbody></table></div>' : '');
    }
    var payment = n.pag.length ? kv(n.pag.map(function (p) {
      var lbl = t('pay' + p.tPag); return [lbl === 'pay' + p.tPag ? (p.xPag || p.tPag) : lbl, money(p.vPag)];
    }).concat(n.vTroco ? [['change', money(n.vTroco)]] : [])) : '';

    var prot = n.prot ? kv([['protNumber', n.prot.nProt], ['receivedAt', fDate(n.prot.dhRecbto, true)], ['statusCode', n.prot.cStat], ['reason', n.prot.xMotivo]]) : '<span class="muted">' + esc(t('st_unauthorized')) + '</span>';
    if (n.cancel) prot += '<h4>' + esc(t('cancelEvent')) + '</h4>' + kv([['protNumber', n.cancel.nProt], ['receivedAt', fDate(n.cancel.dhEvento, true)], ['justification', n.cancel.xJust]]);

    var addl = [n.infAdic.infAdFisco, n.infAdic.infCpl].filter(Boolean).join('\n\n');

    $('detailBody').innerHTML =
      '<h4>' + esc(t('d_general')) + '</h4>' + kv([
        ['d_key', '<span class="mono">' + esc(fmt.key(n.key)) + '</span>', true], ['d_natOp', n.ide.natOp], ['col_type', typePill(n), true],
        ['d_emission', fDate(n.ide.dhEmi, true)], ['d_exitEntry', fDate(n.ide.dhSaiEnt, true)],
        ['d_finality', t('fin' + n.ide.finNFe) !== 'fin' + n.ide.finNFe ? t('fin' + n.ide.finNFe) : n.ide.finNFe],
        ['d_env', t('env' + n.ide.tpAmb)], ['model', n.ide.mod], ['d_version', n.version], ['d_file', n.fileName]
      ]) +
      '<div class="two" style="margin-top:14px">' + partyBox('d_emitter', n.emit) + partyBox('d_recipient', n.dest) + '</div>' +
      '<h4>' + esc(t('d_items')) + ' (' + n.items.length + ')</h4>' + itemsHtml +
      '<h4>' + esc(t('d_totals')) + '</h4>' + kv(totals) +
      '<div class="two" style="margin-top:6px"><div><h4>' + esc(t('d_transport')) + '</h4>' + transport + '</div><div><h4>' + esc(t('d_protocol')) + '</h4>' + prot + '</div></div>' +
      (billing || payment ? '<div class="two"><div>' + (billing ? '<h4>' + esc(t('d_billing')) + '</h4>' + billing : '') + '</div><div>' + (payment ? '<h4>' + esc(t('d_payment')) + '</h4>' + payment : '') + '</div></div>' : '') +
      (addl ? '<h4>' + esc(t('d_additional')) + '</h4><div class="pre">' + esc(addl) + '</div>' : '');

    var dlg = $('detail');
    if (!dlg.open) dlg.showModal();
    $('detailBody').scrollTop = 0;
  }

  /* ---------------- actions ---------------- */
  function busy(on, text) {
    $('busy').hidden = !on;
    $('busyText').textContent = text || '';
  }
  function pdf(notes) {
    if (!notes.length) { alert(t('selectFirst')); return; }
    busy(true, t('generating'));
    setTimeout(function () {
      try { DANFE.save(notes); }
      catch (e) { console.error(e); alert('PDF: ' + e.message); }
      busy(false);
    }, 30);
  }
  function download(name, content, type) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: type });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function csvNum(v) {
    var s = (+v || 0).toFixed(2);
    return I18N.lang === 'en' || I18N.lang === 'zh' ? s : s.replace('.', ',');
  }
  function csv(rows) {
    return '﻿' + rows.map(function (r) {
      return r.map(function (c) {
        c = String(c == null ? '' : c);
        return /[";\n\r]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
      }).join(';');
    }).join('\r\n');
  }
  function exportNotes() {
    var list = filtered();
    var rows = [[t('d_key'), t('model'), 'Série', t('col_number'), t('col_date'), t('d_natOp'), t('col_type'),
      t('d_emitter') + ' CNPJ', t('d_emitter'), 'UF', t('d_recipient') + ' CNPJ/CPF', t('d_recipient'), 'UF',
      t('t_vProd'), t('t_vDesc'), t('t_vFrete'), t('t_vICMS'), t('t_vST'), t('t_vIPI'), t('t_vPIS'), t('t_vCOFINS'), t('t_vNF'),
      t('col_status'), t('protNumber'), t('d_file')]];
    list.forEach(function (n) {
      var e = n.emit || { ender: {} }, d = n.dest || { ender: {} };
      rows.push([n.key, n.ide.mod, n.ide.serie, n.ide.nNF, fDate(n.ide.dhEmi, true), n.ide.natOp, n.ide.tpNF === '0' ? t('entry') : t('exit'),
        fmt.doc(e.doc), e.xNome, e.ender.UF, fmt.doc(d.doc), d.xNome, d.ender && d.ender.UF,
        csvNum(n.total.vProd), csvNum(n.total.vDesc), csvNum(n.total.vFrete), csvNum(n.total.vICMS), csvNum(n.total.vST), csvNum(n.total.vIPI),
        csvNum(n.total.vPIS), csvNum(n.total.vCOFINS), csvNum(n.total.vNF), t('st_' + n.status), n.prot ? n.prot.nProt : '', n.fileName]);
    });
    download('nfe-notas.csv', csv(rows), 'text/csv;charset=utf-8');
  }
  function exportItems() {
    var rows = [[t('d_key'), t('col_number'), t('col_date'), t('d_emitter'), '#', t('i_code'), 'EAN', t('i_desc'), t('i_ncm'), t('i_cfop'), t('i_cst'),
      t('i_unit'), t('i_qty'), t('i_unitValue'), t('i_total'), t('t_vBC'), t('i_icms'), t('i_ipi')]];
    filtered().forEach(function (n) {
      n.items.forEach(function (it) {
        rows.push([n.key, n.ide.nNF, fDate(n.ide.dhEmi), n.emit && n.emit.xNome, it.nItem, it.cProd, it.cEAN, it.xProd, it.NCM, it.CFOP, it.OCST,
          it.uCom, String(it.qCom).replace('.', I18N.lang === 'en' || I18N.lang === 'zh' ? '.' : ','), csvNum(it.vUnCom), csvNum(it.vProd), csvNum(it.vBC), csvNum(it.vICMS), csvNum(it.vIPI)]);
      });
    });
    download('nfe-itens.csv', csv(rows), 'text/csv;charset=utf-8');
  }

  /* ---------------- i18n binding ---------------- */
  function fillSelect(sel, opts) {
    var v = sel.value;
    sel.innerHTML = opts.map(function (o) { return '<option value="' + o[0] + '">' + esc(o[1]) + '</option>'; }).join('');
    sel.value = v || opts[0][0];
  }
  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) { el.title = t(el.getAttribute('data-i18n-title')); });
    document.title = t('appTitle');
    fillSelect($('qField'), ['all', 'key', 'number', 'emitter', 'recipient', 'cnpj', 'product', 'ncm', 'cfop'].map(function (k) { return [k, t('f_' + k)]; }));
    fillSelect($('fType'), [['', t('any')], ['1', t('exit')], ['0', t('entry')]]);
    fillSelect($('fStatus'), [['', t('any')]].concat(['authorized', 'cancelled', 'denied', 'unauthorized'].map(function (s) { return [s, t('st_' + s)]; })));
    $('fModel').options[0].textContent = t('any');
    $('detailClose').setAttribute('aria-label', t('close'));
    $('detailPreview').title = 'PDF preview';
  }

  /* ---------------- events ---------------- */
  function bind() {
    var sel = $('langSelect');
    sel.innerHTML = Object.keys(I18N.LANGS).map(function (k) { return '<option value="' + k + '">' + esc(I18N.LANGS[k].label) + '</option>'; }).join('');
    sel.value = I18N.lang;
    sel.addEventListener('change', function () {
      I18N.set(sel.value); applyI18n(); render();
      if ($('detail').open && state.current) openDetail(state.current.id);
    });

    var drop = $('drop'), input = $('fileInput');
    drop.addEventListener('click', function (e) { if (e.target.id !== 'browseBtn') input.click(); });
    $('browseBtn').addEventListener('click', function (e) { e.stopPropagation(); input.click(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', function () { handleFiles(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { handleFiles(e.dataTransfer.files); });
    document.addEventListener('dragover', function (e) { e.preventDefault(); });
    document.addEventListener('drop', function (e) { e.preventDefault(); if (!drop.contains(e.target)) handleFiles(e.dataTransfer.files); });

    var timer;
    $('q').addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(render, 150); });
    $('qField').addEventListener('change', render);
    ['fFrom', 'fTo', 'fMin', 'fMax', 'fType', 'fStatus', 'fModel'].forEach(function (id) { $(id).addEventListener('input', render); });
    $('filterToggle').addEventListener('click', function () { $('filters').hidden = !$('filters').hidden; });
    $('resetFilters').addEventListener('click', function () {
      ['fFrom', 'fTo', 'fMin', 'fMax', 'fType', 'fStatus', 'fModel'].forEach(function (id) { $(id).value = ''; });
      render();
    });

    document.querySelectorAll('.tab').forEach(function (b) {
      b.addEventListener('click', function () {
        state.tab = b.getAttribute('data-tab');
        document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('active', x === b); });
        ['notes', 'items', 'summary'].forEach(function (v) { $('view-' + v).hidden = v !== state.tab; });
        render();
      });
    });

    $('view-notes').addEventListener('click', function (e) {
      var th = e.target.closest('th[data-sort]');
      if (th) {
        var k = th.getAttribute('data-sort');
        state.sort = { key: k, dir: state.sort.key === k ? -state.sort.dir : (k === 'emitter' || k === 'recipient' ? 1 : -1) };
        render(); return;
      }
      if (e.target.id === 'selAll') {
        var list = filtered();
        list.forEach(function (n) { if (e.target.checked) state.selected.add(n.id); else state.selected.delete(n.id); });
        render(); return;
      }
      var tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      var id = tr.getAttribute('data-id');
      if (e.target.classList.contains('sel')) {
        if (e.target.checked) state.selected.add(id); else state.selected.delete(id);
        $('selCount').hidden = !state.selected.size; $('selCount').textContent = state.selected.size;
        return;
      }
      var act = e.target.closest('[data-act]');
      if (act && act.getAttribute('data-act') === 'pdf') { pdf([state.byId.get(id)]); return; }
      openDetail(id);
    });
    $('view-items').addEventListener('click', function (e) {
      var tr = e.target.closest('tr[data-id]');
      if (tr) openDetail(tr.getAttribute('data-id'));
    });

    $('pdfSelected').addEventListener('click', function () {
      pdf(filtered().filter(function (n) { return state.selected.has(n.id); }));
    });
    $('exportCsv').addEventListener('click', exportNotes);
    $('exportItems').addEventListener('click', exportItems);
    $('clearAll').addEventListener('click', function () {
      if (!confirm(t('confirmClear'))) return;
      state.notes = []; state.byId.clear(); state.selected.clear(); state.pendingCancels.clear();
      dbClear(); render();
    });

    $('detailClose').addEventListener('click', function () { $('detail').close(); });
    $('detail').addEventListener('click', function (e) { if (e.target === $('detail')) $('detail').close(); });
    $('detailPdf').addEventListener('click', function () { if (state.current) pdf([state.current]); });
    $('detailPreview').addEventListener('click', function () {
      if (!state.current) return;
      try { var url = DANFE.previewUrl([state.current]); if (url) window.open(url, '_blank'); }
      catch (e) { alert('PDF: ' + e.message); }
    });
    $('detailXml').addEventListener('click', function () {
      var n = state.current;
      if (n) download(n.fileName && /\.xml$/i.test(n.fileName) ? n.fileName : (n.key || 'nfe') + '.xml', n.xml, 'application/xml');
    });
  }

  /* ---------------- boot ---------------- */
  async function boot() {
    I18N.init();
    bind();
    applyI18n();
    render();
    await openDb();
    var recs = await dbAll();
    if (recs && recs.length) {
      var report = newReport();
      // notes first, then cancellation events
      recs.sort(function (a, b) { return (a.id.indexOf('evt-') === 0) - (b.id.indexOf('evt-') === 0); });
      recs.forEach(function (r) { ingest(r.name, r.xml, false, report); });
      render();
    }
  }
  boot();
})();
