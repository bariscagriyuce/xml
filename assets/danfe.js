/* DANFE (NF-e model 55, A4 portrait) and DANFE NFC-e (model 65, 80 mm receipt) generator.
   Labels follow the Brazilian "Manual de Orientação do Contribuinte" and are always in Portuguese,
   since DANFE is a legal document. Requires jsPDF (window.jspdf) and qrcode-generator (window.qrcode). */
(function (global) {
  'use strict';

  /* ---------- Code 128 (set C) for the 44-digit access key ---------- */
  var C128 = ['212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
    '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
    '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
    '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
    '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
    '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
    '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
    '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
    '114131', '311141', '411131', '211412', '211214', '211232', '2331112'];

  function code128c(digits) {
    digits = String(digits).replace(/\D/g, '');
    if (digits.length % 2) digits = '0' + digits;
    var codes = [105], sum = 105;
    for (var i = 0; i < digits.length; i += 2) {
      var v = parseInt(digits.substr(i, 2), 10);
      codes.push(v);
      sum += v * (i / 2 + 1);
    }
    codes.push(sum % 103, 106);
    return codes.map(function (c) { return C128[c]; }).join('');
  }

  function drawBarcode(doc, digits, x, y, w, h) {
    var pat = code128c(digits), total = 0, i;
    for (i = 0; i < pat.length; i++) total += +pat[i];
    var m = w / total, cx = x;
    for (i = 0; i < pat.length; i++) {
      var bw = +pat[i] * m;
      if (i % 2 === 0) doc.rect(cx, y, bw, h, 'F');
      cx += bw;
    }
  }

  function drawQR(doc, data, x, y, size) {
    if (!global.qrcode || !data) return;
    var qr = global.qrcode(0, 'M');
    qr.addData(data);
    qr.make();
    var n = qr.getModuleCount(), s = size / n;
    for (var r = 0; r < n; r++) {
      var c = 0;
      while (c < n) {
        if (qr.isDark(r, c)) {
          var start = c;
          while (c < n && qr.isDark(r, c)) c++;
          doc.rect(x + start * s, y + r * s, (c - start) * s + 0.01, s + 0.01, 'F');
        } else c++;
      }
    }
  }

  /* ---------- formatting (pt-BR) ---------- */
  function S(s) {
    return String(s == null ? '' : s)
      .replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/…/g, '...').replace(/[\r\t]/g, ' ').replace(/[^\n\x20-\xFF]/g, '?');
  }
  function dec(v, d) {
    return (+v || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function money(v) { return dec(v, 2); }
  function fDoc(d) {
    var raw = String(d || '');
    if (/[^\d]/.test(raw)) return raw;
    if (raw.length === 14) return raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    if (raw.length === 11) return raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    return raw;
  }
  function fDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }
  function fTime(iso) {
    var m = /T(\d{2}:\d{2}:\d{2})/.exec(iso || '');
    return m ? m[1] : '';
  }
  function fNum(n) {
    var s = String(n || '').padStart(9, '0');
    return s.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3');
  }
  function fKey(k) { return String(k || '').replace(/(\d{4})(?=\d)/g, '$1 '); }
  function fCEP(c) { c = String(c || ''); return c.length === 8 ? c.slice(0, 5) + '-' + c.slice(5) : c; }
  function fFone(f) {
    f = String(f || '').replace(/\D/g, '');
    if (f.length === 10) return '(' + f.slice(0, 2) + ') ' + f.slice(2, 6) + '-' + f.slice(6);
    if (f.length === 11) return '(' + f.slice(0, 2) + ') ' + f.slice(2, 7) + '-' + f.slice(7);
    return f;
  }
  function street(e) {
    if (!e) return '';
    return [e.xLgr, e.nro].filter(Boolean).join(', ') + (e.xCpl ? ' - ' + e.xCpl : '');
  }

  var FRETE = { '0': '0-POR CONTA DO EMITENTE', '1': '1-POR CONTA DO DESTINATÁRIO', '2': '2-POR CONTA DE TERCEIROS',
    '3': '3-PRÓPRIO POR CONTA DO REMETENTE', '4': '4-PRÓPRIO POR CONTA DO DESTINATÁRIO', '9': '9-SEM OCORRÊNCIA DE TRANSPORTE' };
  var TPAG = { '01': 'Dinheiro', '02': 'Cheque', '03': 'Cartão de Crédito', '04': 'Cartão de Débito', '05': 'Crédito Loja',
    '10': 'Vale Alimentação', '11': 'Vale Refeição', '12': 'Vale Presente', '13': 'Vale Combustível', '14': 'Duplicata Mercantil',
    '15': 'Boleto Bancário', '16': 'Depósito Bancário', '17': 'PIX', '18': 'Transferência bancária / Carteira Digital',
    '19': 'Programa de fidelidade', '90': 'Sem pagamento', '99': 'Outros' };

  /* ---------- drawing primitives ---------- */
  function font(doc, size, bold) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
  }
  function fitText(doc, str, maxW) {
    str = S(str);
    if (doc.getTextWidth(str) <= maxW) return str;
    while (str.length > 1 && doc.getTextWidth(str + '...') > maxW) str = str.slice(0, -1);
    return str + '...';
  }
  /* text that shrinks its font to fit maxW (down to minSize), then truncates */
  function shrinkText(doc, str, x, y, maxW, size, opts) {
    str = S(str);
    var s = size;
    font(doc, s, opts && opts.bold);
    while (s > (opts && opts.min || 4) && doc.getTextWidth(str) > maxW) { s -= 0.25; font(doc, s, opts && opts.bold); }
    doc.text(fitText(doc, str, maxW), x, y, { align: (opts && opts.align) || 'left', baseline: (opts && opts.baseline) || 'alphabetic' });
  }
  function field(doc, x, y, w, h, label, value, o) {
    o = o || {};
    doc.rect(x, y, w, h);
    font(doc, 5, false);
    doc.text(fitText(doc, label, w - 1.2), x + 0.7, y + 0.6, { baseline: 'top' });
    if (value === undefined || value === null || value === '') return;
    var align = o.align || 'left';
    var tx = align === 'right' ? x + w - 0.8 : align === 'center' ? x + w / 2 : x + 0.8;
    shrinkText(doc, value, tx, y + h - 1.1, w - 1.6, o.size || 7.5, { align: align, bold: o.bold, min: 5 });
  }
  function section(doc, x, y, title) {
    font(doc, 6, true);
    doc.text(S(title), x, y + 2.3);
    return y + 3;
  }
  function watermark(doc, pageW, pageH, lines, color) {
    if (!lines.length) return;
    doc.saveGraphicsState();
    if (doc.GState) doc.setGState(new doc.GState({ opacity: 0.18 }));
    doc.setTextColor(color[0], color[1], color[2]);
    font(doc, pageW > 100 ? 46 : 15, true);
    var cx = pageW / 2, cy = pageH / 2;
    lines.forEach(function (l, i) {
      doc.text(S(l), cx, cy + (i - (lines.length - 1) / 2) * (pageW > 100 ? 18 : 9), { align: 'center', angle: pageW > 100 ? 35 : 0 });
    });
    doc.restoreGraphicsState();
    doc.setTextColor(0, 0, 0);
  }
  function watermarkLines(n) {
    if (n.status === 'cancelled') return { lines: ['NF-e CANCELADA'], color: [200, 0, 0] };
    if (n.ide.tpAmb === '2') return { lines: ['SEM VALOR FISCAL'], color: [120, 120, 120] };
    if (n.status === 'unauthorized') return { lines: ['SEM AUTORIZAÇÃO', 'DE USO'], color: [120, 120, 120] };
    if (n.status === 'denied') return { lines: ['USO DENEGADO'], color: [200, 0, 0] };
    return { lines: [], color: [0, 0, 0] };
  }

  /* ---------- DANFE NF-e (model 55) ---------- */
  var X = 7, W = 196, PH = 297, BOTTOM = 291;

  var COLS = [
    { t: 'CÓDIGO PRODUTO', w: 15, a: 'left' },
    { t: 'DESCRIÇÃO DO PRODUTO / SERVIÇO', w: 51, a: 'left' },
    { t: 'NCM/SH', w: 12, a: 'center' },
    { t: 'O/CST', w: 9, a: 'center' },
    { t: 'CFOP', w: 8, a: 'center' },
    { t: 'UN', w: 8, a: 'center' },
    { t: 'QUANT.', w: 13, a: 'right' },
    { t: 'VALOR UNIT.', w: 14, a: 'right' },
    { t: 'VALOR TOTAL', w: 14, a: 'right' },
    { t: 'B.CÁLC. ICMS', w: 13, a: 'right' },
    { t: 'VALOR ICMS', w: 12, a: 'right' },
    { t: 'VALOR IPI', w: 11, a: 'right' },
    { t: 'ALÍQ. ICMS', w: 8, a: 'right' },
    { t: 'ALÍQ. IPI', w: 8, a: 'right' }
  ];
  var ITEM_FS = 5.6, ITEM_LH = 2.3;

  function itemCells(it) {
    var desc = it.xProd + (it.infAdProd ? ' - ' + it.infAdProd : '');
    return [it.cProd, desc, it.NCM, it.OCST, it.CFOP, it.uCom, dec(it.qCom, 4), dec(it.vUnCom, 4), money(it.vProd),
      money(it.vBC), money(it.vICMS), money(it.vIPI), dec(it.pICMS, 2), dec(it.pIPI, 2)];
  }

  function canhoto(doc, n, y) {
    var e = n.emit || {}, d = n.dest || {};
    doc.rect(X, y, 160, 8.5);
    font(doc, 5.6, false);
    var txt = 'RECEBEMOS DE ' + (e.xNome || '').toUpperCase() + ' OS PRODUTOS E/OU SERVIÇOS CONSTANTES DA NOTA FISCAL ELETRÔNICA INDICADA AO LADO. ' +
      'EMISSÃO: ' + fDate(n.ide.dhEmi) + ' VALOR TOTAL: R$ ' + money(n.total.vNF) + ' DESTINATÁRIO: ' + (d.xNome || '') +
      (d.ender && d.ender.xLgr ? ' - ' + street(d.ender) + ' ' + (d.ender.xBairro || '') + ' ' + (d.ender.xMun || '') + '-' + (d.ender.UF || '') : '');
    var lines = doc.splitTextToSize(S(txt), 158).slice(0, 3);
    doc.text(lines, X + 1, y + 1, { baseline: 'top', lineHeightFactor: 1.15 });
    field(doc, X, y + 8.5, 40, 8.5, 'DATA DE RECEBIMENTO', '');
    field(doc, X + 40, y + 8.5, 120, 8.5, 'IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR', '');
    doc.rect(X + 160, y, 36, 17);
    font(doc, 11, true);
    doc.text('NF-e', X + 178, y + 5.5, { align: 'center' });
    font(doc, 8, true);
    doc.text('Nº ' + fNum(n.ide.nNF), X + 178, y + 10.5, { align: 'center' });
    doc.text('SÉRIE ' + String(n.ide.serie).padStart(3, '0'), X + 178, y + 14.5, { align: 'center' });
    doc.setLineDashPattern([1, 1], 0);
    doc.line(X, y + 19, X + W, y + 19);
    doc.setLineDashPattern([], 0);
    return y + 21;
  }

  function header(doc, n, y, folhas) {
    var e = n.emit || {}, en = e.ender || {};
    var H = 36;
    // issuer identification
    doc.rect(X, y, 80, H);
    font(doc, 5, false);
    doc.text('IDENTIFICAÇÃO DO EMITENTE', X + 0.7, y + 0.6, { baseline: 'top' });
    font(doc, 9, true);
    var nameLines = doc.splitTextToSize(S(e.xNome), 76).slice(0, 3);
    var ty = y + 5;
    doc.text(nameLines, X + 40, ty, { align: 'center', baseline: 'top' });
    ty += nameLines.length * 3.8 + 1;
    font(doc, 6.8, false);
    var addr = [street(en), [en.xBairro, fCEP(en.CEP)].filter(Boolean).join(' - '),
      [en.xMun, en.UF].filter(Boolean).join(' - '), en.fone ? 'Fone: ' + fFone(en.fone) : ''].filter(Boolean);
    addr.forEach(function (l) {
      doc.splitTextToSize(S(l), 76).slice(0, 2).forEach(function (ll) {
        if (ty < y + H - 2.5) { doc.text(ll, X + 40, ty, { align: 'center', baseline: 'top' }); ty += 2.9; }
      });
    });

    // DANFE box
    var dx = X + 80;
    doc.rect(dx, y, 33, H);
    font(doc, 12, true);
    doc.text('DANFE', dx + 16.5, y + 5.5, { align: 'center' });
    font(doc, 6.3, false);
    doc.text(['Documento Auxiliar da', 'Nota Fiscal Eletrônica'], dx + 16.5, y + 8, { align: 'center', baseline: 'top' });
    font(doc, 6.5, false);
    doc.text('0 - ENTRADA', dx + 2, y + 17);
    doc.text('1 - SAÍDA', dx + 2, y + 20);
    doc.rect(dx + 24, y + 14.5, 6, 6);
    font(doc, 10, true);
    doc.text(String(n.ide.tpNF || ''), dx + 27, y + 19.2, { align: 'center' });
    font(doc, 8, true);
    doc.text('Nº ' + fNum(n.ide.nNF), dx + 16.5, y + 25.5, { align: 'center' });
    doc.text('SÉRIE ' + String(n.ide.serie).padStart(3, '0'), dx + 16.5, y + 29, { align: 'center' });
    folhas.push({ page: doc.internal.getCurrentPageInfo().pageNumber, x: dx + 16.5, y: y + 32.8 });

    // barcode + access key
    var bx = X + 113, bw = 83;
    doc.rect(bx, y, bw, 13);
    if (n.key && n.key.length === 44) drawBarcode(doc, n.key, bx + 3, y + 1.5, bw - 6, 10);
    field(doc, bx, y + 13, bw, 8, 'CHAVE DE ACESSO', fKey(n.key), { align: 'center', bold: true, size: 7.6 });
    doc.rect(bx, y + 21, bw, H - 21);
    font(doc, 7, false);
    doc.text(doc.splitTextToSize('Consulta de autenticidade no portal nacional da NF-e www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora', bw - 6),
      bx + bw / 2, y + 25, { align: 'center', baseline: 'top' });
    y += H;

    var prot = n.prot ? n.prot.nProt + ' - ' + fDate(n.prot.dhRecbto) + ' ' + fTime(n.prot.dhRecbto) : '';
    field(doc, X, y, 113, 7, 'NATUREZA DA OPERAÇÃO', n.ide.natOp);
    field(doc, X + 113, y, 83, 7, 'PROTOCOLO DE AUTORIZAÇÃO DE USO', prot, { align: 'center' });
    y += 7;
    field(doc, X, y, 65, 7, 'INSCRIÇÃO ESTADUAL', e.IE);
    field(doc, X + 65, y, 65, 7, 'INSCRIÇÃO ESTADUAL DO SUBST. TRIBUT.', e.IEST);
    field(doc, X + 130, y, 66, 7, 'CNPJ / CPF', fDoc(e.doc));
    return y + 7;
  }

  function destBlock(doc, n, y) {
    var d = n.dest || { ender: {} }, en = d.ender || {};
    y = section(doc, X, y, 'DESTINATÁRIO / REMETENTE');
    field(doc, X, y, 118, 7, 'NOME / RAZÃO SOCIAL', d.xNome);
    field(doc, X + 118, y, 44, 7, 'CNPJ / CPF', fDoc(d.doc), { align: 'center' });
    field(doc, X + 162, y, 34, 7, 'DATA DA EMISSÃO', fDate(n.ide.dhEmi), { align: 'center' });
    y += 7;
    field(doc, X, y, 92, 7, 'ENDEREÇO', street(en));
    field(doc, X + 92, y, 46, 7, 'BAIRRO / DISTRITO', en.xBairro);
    field(doc, X + 138, y, 24, 7, 'CEP', fCEP(en.CEP), { align: 'center' });
    field(doc, X + 162, y, 34, 7, 'DATA DA SAÍDA/ENTRADA', fDate(n.ide.dhSaiEnt), { align: 'center' });
    y += 7;
    field(doc, X, y, 72, 7, 'MUNICÍPIO', en.xMun);
    field(doc, X + 72, y, 36, 7, 'FONE / FAX', fFone(en.fone), { align: 'center' });
    field(doc, X + 108, y, 10, 7, 'UF', en.UF, { align: 'center' });
    field(doc, X + 118, y, 44, 7, 'INSCRIÇÃO ESTADUAL', d.IE, { align: 'center' });
    field(doc, X + 162, y, 34, 7, 'HORA DA SAÍDA/ENTRADA', fTime(n.ide.dhSaiEnt), { align: 'center' });
    return y + 7;
  }

  function billingBlock(doc, n, y) {
    var dups = n.cobr.dup || [];
    if (!dups.length && !n.cobr.fat && !n.pag.length) return y;
    y = section(doc, X, y, 'FATURA / DUPLICATA');
    if (dups.length) {
      var perRow = 6, cw = W / perRow, rows = Math.ceil(dups.length / perRow);
      var h = rows * 8 + 1;
      doc.rect(X, y, W, h);
      dups.forEach(function (d, i) {
        var cx = X + (i % perRow) * cw + 1.5, cy = y + Math.floor(i / perRow) * 8 + 1;
        font(doc, 5.8, false);
        doc.text(['Num.: ' + S(d.nDup), 'Venc.: ' + fDate(d.dVenc), 'Valor: R$ ' + money(d.vDup)], cx, cy, { baseline: 'top', lineHeightFactor: 1.25 });
      });
      return y + h;
    }
    var parts = [];
    if (n.cobr.fat) parts.push('Fatura ' + S(n.cobr.fat.nFat) + ' - Valor original: R$ ' + money(n.cobr.fat.vOrig) + ' - Valor líquido: R$ ' + money(n.cobr.fat.vLiq));
    n.pag.forEach(function (p) { parts.push((TPAG[p.tPag] || p.xPag || p.tPag) + ': R$ ' + money(p.vPag)); });
    doc.rect(X, y, W, 6);
    font(doc, 6.5, false);
    doc.text(fitText(doc, parts.join('   |   '), W - 3), X + 1.5, y + 4);
    return y + 6;
  }

  function taxBlock(doc, n, y) {
    var t = n.total, cw = W / 6;
    y = section(doc, X, y, 'CÁLCULO DO IMPOSTO');
    var r1 = [['BASE DE CÁLC. DO ICMS', t.vBC], ['VALOR DO ICMS', t.vICMS], ['BASE DE CÁLC. ICMS S.T.', t.vBCST],
      ['VALOR DO ICMS SUBST.', t.vST], ['V. APROX. DOS TRIBUTOS', t.vTotTrib], ['VALOR TOTAL DOS PRODUTOS', t.vProd]];
    var r2 = [['VALOR DO FRETE', t.vFrete], ['VALOR DO SEGURO', t.vSeg], ['DESCONTO', t.vDesc],
      ['OUTRAS DESPESAS', t.vOutro], ['VALOR TOTAL DO IPI', t.vIPI], ['VALOR TOTAL DA NOTA', t.vNF]];
    r1.forEach(function (c, i) { field(doc, X + i * cw, y, cw, 7, c[0], money(c[1]), { align: 'right' }); });
    y += 7;
    r2.forEach(function (c, i) { field(doc, X + i * cw, y, cw, 7, c[0], money(c[1]), { align: 'right', bold: i === 5 }); });
    return y + 7;
  }

  function transportBlock(doc, n, y) {
    var tr = n.transp, tp = tr.transporta || {}, v = tr.veic || {}, cw = W / 6;
    y = section(doc, X, y, 'TRANSPORTADOR / VOLUMES TRANSPORTADOS');
    field(doc, X, y, 62, 7, 'NOME / RAZÃO SOCIAL', tp.xNome);
    field(doc, X + 62, y, 32, 7, 'FRETE POR CONTA', FRETE[tr.modFrete] || tr.modFrete, { size: 6 });
    field(doc, X + 94, y, 22, 7, 'CÓDIGO ANTT', v.RNTC, { align: 'center' });
    field(doc, X + 116, y, 22, 7, 'PLACA DO VEÍCULO', v.placa, { align: 'center' });
    field(doc, X + 138, y, 10, 7, 'UF', v.UF, { align: 'center' });
    field(doc, X + 148, y, 48, 7, 'CNPJ / CPF', fDoc(tp.doc), { align: 'center' });
    y += 7;
    field(doc, X, y, 94, 7, 'ENDEREÇO', tp.xEnder);
    field(doc, X + 94, y, 54, 7, 'MUNICÍPIO', tp.xMun);
    field(doc, X + 148, y, 10, 7, 'UF', tp.UF, { align: 'center' });
    field(doc, X + 158, y, 38, 7, 'INSCRIÇÃO ESTADUAL', tp.IE, { align: 'center' });
    y += 7;
    var vols = tr.vol || [], q = 0, pb = 0, pl = 0;
    vols.forEach(function (o) { q += parseFloat(o.qVol) || 0; pb += o.pesoB; pl += o.pesoL; });
    var f = vols[0] || {};
    field(doc, X, y, cw, 7, 'QUANTIDADE', vols.length ? dec(q, 0) : '', { align: 'right' });
    field(doc, X + cw, y, cw, 7, 'ESPÉCIE', f.esp);
    field(doc, X + 2 * cw, y, cw, 7, 'MARCA', f.marca);
    field(doc, X + 3 * cw, y, cw, 7, 'NUMERAÇÃO', f.nVol);
    field(doc, X + 4 * cw, y, cw, 7, 'PESO BRUTO', vols.length ? dec(pb, 3) : '', { align: 'right' });
    field(doc, X + 5 * cw, y, cw, 7, 'PESO LÍQUIDO', vols.length ? dec(pl, 3) : '', { align: 'right' });
    return y + 7;
  }

  function tableHeader(doc, y) {
    y = section(doc, X, y, 'DADOS DOS PRODUTOS / SERVIÇOS');
    var cx = X, h = 6;
    COLS.forEach(function (c) {
      doc.rect(cx, y, c.w, h);
      font(doc, 4.8, false);
      var lines = doc.splitTextToSize(c.t, c.w - 0.8);
      doc.text(lines, cx + c.w / 2, y + h / 2 - (lines.length - 1) * 0.9, { align: 'center', baseline: 'middle' });
      cx += c.w;
    });
    return y + h;
  }

  function closeTable(doc, top, bottom) {
    doc.rect(X, top, W, bottom - top);
    var cx = X;
    for (var i = 0; i < COLS.length - 1; i++) { cx += COLS[i].w; doc.line(cx, top, cx, bottom); }
  }

  function itemRow(doc, it) {
    font(doc, ITEM_FS, false);
    var cells = itemCells(it);
    var codeLines = doc.splitTextToSize(S(cells[0]), COLS[0].w - 1);
    var descLines = doc.splitTextToSize(S(cells[1]), COLS[1].w - 1);
    var lines = Math.max(codeLines.length, descLines.length, 1);
    return { cells: cells, codeLines: codeLines, descLines: descLines, h: lines * ITEM_LH + 1.2 };
  }

  function drawItemRow(doc, row, y) {
    var cx = X;
    COLS.forEach(function (c, i) {
      font(doc, ITEM_FS, false);
      if (i === 0 || i === 1) {
        doc.text(i === 0 ? row.codeLines : row.descLines, cx + 0.5, y + 0.7, { baseline: 'top', lineHeightFactor: 1.17 });
      } else {
        var tx = c.a === 'right' ? cx + c.w - 0.5 : cx + c.w / 2;
        shrinkText(doc, row.cells[i], tx, y + 0.7, c.w - 1, ITEM_FS, { align: c.a, baseline: 'top', min: 3.8 });
      }
      cx += c.w;
    });
    doc.setDrawColor(190);
    doc.line(X, y + row.h, X + W, y + row.h);
    doc.setDrawColor(0);
  }

  function additionalBlock(doc, n, y, h) {
    y = section(doc, X, y, 'DADOS ADICIONAIS');
    doc.rect(X, y, 130, h);
    doc.rect(X + 130, y, 66, h);
    font(doc, 5, false);
    doc.text('INFORMAÇÕES COMPLEMENTARES', X + 0.7, y + 0.6, { baseline: 'top' });
    doc.text('RESERVADO AO FISCO', X + 130.7, y + 0.6, { baseline: 'top' });
    var parts = [];
    if (n.ide.tpAmb === '2') parts.push('NF-E EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL.');
    if (n.cancel) parts.push('NF-E CANCELADA - PROTOCOLO ' + n.cancel.nProt + (n.cancel.xJust ? ' - ' + n.cancel.xJust : ''));
    if (n.infAdic.infAdFisco) parts.push('Inf. fisco: ' + n.infAdic.infAdFisco);
    if (n.infAdic.infCpl) parts.push('Inf. contribuinte: ' + n.infAdic.infCpl);
    font(doc, 6, false);
    var lines = doc.splitTextToSize(S(parts.join(' ').replace(/\s*;\s*/g, '; ')), 127);
    var max = Math.floor((h - 3) / 2.5);
    if (lines.length > max) { lines = lines.slice(0, max); lines[max - 1] = lines[max - 1].slice(0, -3) + '...'; }
    doc.text(lines, X + 1, y + 3, { baseline: 'top', lineHeightFactor: 1.2 });
  }

  function renderNFe(doc, n) {
    var folhas = [];
    var startPage = doc.internal.getCurrentPageInfo().pageNumber;
    var addH = 28, addTop = BOTTOM - addH - 3;

    var y = canhoto(doc, n, 5);
    y = header(doc, n, y, folhas);
    y = destBlock(doc, n, y);
    y = billingBlock(doc, n, y);
    y = taxBlock(doc, n, y);
    y = transportBlock(doc, n, y);
    var tableTop = y + 3;
    y = tableHeader(doc, y);
    var limit = addTop - 1;

    var rows = n.items.map(function (it) { return itemRow(doc, it); });
    rows.forEach(function (row) {
      if (y + row.h > limit) {
        closeTable(doc, tableTop, limit);
        if (limit === addTop - 1) additionalBlock(doc, n, addTop, addH);
        doc.addPage('a4', 'p');
        y = header(doc, n, 5, folhas);
        y = tableHeader(doc, y + 1);
        tableTop = y - 6;
        limit = BOTTOM;
      }
      drawItemRow(doc, row, y);
      y += row.h;
    });
    closeTable(doc, tableTop, limit);
    if (limit === addTop - 1) additionalBlock(doc, n, addTop, addH);

    var endPage = doc.internal.getCurrentPageInfo().pageNumber;
    var total = endPage - startPage + 1;
    var wm = watermarkLines(n);
    for (var p = startPage; p <= endPage; p++) {
      doc.setPage(p);
      watermark(doc, 210, PH, wm.lines, wm.color);
    }
    folhas.forEach(function (f, i) {
      doc.setPage(f.page);
      font(doc, 7.5, true);
      doc.text('FOLHA ' + (i + 1) + '/' + total, f.x, f.y, { align: 'center' });
    });
    doc.setPage(endPage);
  }

  /* ---------- DANFE NFC-e (model 65, 80 mm) ---------- */
  var RW = 80, RM = 4, RCW = RW - 2 * RM;

  function renderNFCe(doc, n) {
    var e = n.emit || {}, en = e.ender || {}, y = 4, cx = RW / 2;
    function center(str, size, bold) {
      font(doc, size, bold);
      var l = doc.splitTextToSize(S(str), RCW);
      doc.text(l, cx, y, { align: 'center', baseline: 'top' });
      y += l.length * size * 0.42 + 0.6;
    }
    function lr(left, right, size, bold) {
      font(doc, size, bold);
      doc.text(S(left), RM, y, { baseline: 'top' });
      doc.text(S(right), RW - RM, y, { align: 'right', baseline: 'top' });
      y += size * 0.42 + 0.8;
    }
    function rule() { doc.setLineDashPattern([0.6, 0.6], 0); doc.line(RM, y, RW - RM, y); doc.setLineDashPattern([], 0); y += 1.5; }

    center(e.xNome, 7.5, true);
    center('CNPJ: ' + fDoc(e.doc) + (e.IE ? '   IE: ' + e.IE : ''), 6.2);
    center([street(en), en.xBairro, en.xMun, en.UF].filter(Boolean).join(', '), 6.2);
    rule();
    center('Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica', 6.8, true);
    if (n.ide.tpAmb === '2') center('EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL', 6.5, true);
    if (n.status === 'cancelled') center('NFC-e CANCELADA', 8, true);
    rule();

    font(doc, 5.6, true);
    doc.text('CÓDIGO  DESCRIÇÃO', RM, y, { baseline: 'top' });
    doc.text('QTDE  UN  VL UNIT  VL TOTAL', RW - RM, y, { align: 'right', baseline: 'top' });
    y += 3;
    n.items.forEach(function (it) {
      font(doc, 5.8, false);
      var l = doc.splitTextToSize(S(it.cProd + '  ' + it.xProd), RCW);
      doc.text(l, RM, y, { baseline: 'top' });
      y += l.length * 2.45;
      doc.text(dec(it.qCom, 3) + ' ' + S(it.uCom) + ' x ' + money(it.vUnCom) + '   ' + money(it.vProd), RW - RM, y, { align: 'right', baseline: 'top' });
      y += 3;
    });
    rule();
    lr('Qtd. total de itens', String(n.items.length), 6.5);
    lr('Valor total R$', money(n.total.vProd), 6.5);
    if (n.total.vDesc) lr('Descontos R$', money(n.total.vDesc), 6.5);
    if (n.total.vFrete) lr('Frete R$', money(n.total.vFrete), 6.5);
    if (n.total.vOutro) lr('Outras despesas R$', money(n.total.vOutro), 6.5);
    lr('Valor a pagar R$', money(n.total.vNF), 7.5, true);
    lr('FORMA DE PAGAMENTO', 'VALOR PAGO R$', 6, true);
    n.pag.forEach(function (p) { lr(TPAG[p.tPag] || p.xPag || p.tPag, money(p.vPag), 6.3); });
    if (n.vTroco) lr('Troco R$', money(n.vTroco), 6.3);
    rule();
    center('Consulte pela Chave de Acesso em', 6.3, true);
    if (n.supl && n.supl.urlChave) center(n.supl.urlChave, 6);
    center(fKey(n.key), 6.3);
    rule();
    var d = n.dest;
    center(d && d.doc ? 'CONSUMIDOR - ' + (d.docType === 'CPF' ? 'CPF' : 'CNPJ') + ' ' + fDoc(d.doc) + (d.xNome ? ' - ' + d.xNome : '') : 'CONSUMIDOR NÃO IDENTIFICADO', 6.3, true);
    rule();
    center('NFC-e nº ' + fNum(n.ide.nNF) + '  Série ' + String(n.ide.serie).padStart(3, '0') + '  ' + fDate(n.ide.dhEmi) + ' ' + fTime(n.ide.dhEmi), 6.5, true);
    if (n.prot) {
      center('Protocolo de autorização: ' + n.prot.nProt, 6.3);
      center('Data de autorização: ' + fDate(n.prot.dhRecbto) + ' ' + fTime(n.prot.dhRecbto), 6.3);
    }
    if (n.supl && n.supl.qrCode) {
      y += 1;
      drawQR(doc, n.supl.qrCode, cx - 17, y, 34);
      y += 36;
    }
    if (n.total.vTotTrib) center('Tributos Totais Incidentes (Lei Federal 12.741/2012): R$ ' + money(n.total.vTotTrib), 6);
    if (n.infAdic.infCpl) center(n.infAdic.infCpl, 5.8);
    return y + 4;
  }

  /* ---------- public API ---------- */
  function build(notes) {
    var JsPDF = global.jspdf && global.jspdf.jsPDF;
    if (!JsPDF) throw new Error('jsPDF not loaded');
    var doc = null;
    notes.forEach(function (n) {
      if (n.ide.mod === '65') {
        var probe = new JsPDF({ unit: 'mm', format: [RW, 3000] });
        var h = Math.max(renderNFCe(probe, n), 60);
        if (!doc) doc = new JsPDF({ unit: 'mm', format: [RW, h], compress: true });
        else doc.addPage([RW, h], 'p');
        doc.setLineWidth(0.2);
        renderNFCe(doc, n);
        var wm = watermarkLines(n);
        watermark(doc, RW, h, wm.lines, wm.color);
      } else {
        if (!doc) doc = new JsPDF({ unit: 'mm', format: 'a4', compress: true });
        else doc.addPage('a4', 'p');
        doc.setLineWidth(0.2);
        renderNFe(doc, n);
      }
    });
    if (doc) doc.setProperties({ title: notes.length === 1 ? 'DANFE ' + notes[0].key : 'DANFE (' + notes.length + ')', creator: 'NF-e XML Analyzer' });
    return doc;
  }

  function save(notes, fileName) {
    var doc = build(notes);
    if (!doc) return;
    doc.save(fileName || (notes.length === 1 ? 'DANFE-' + (notes[0].key || notes[0].ide.nNF) + '.pdf' : 'DANFE-lote.pdf'));
  }

  function previewUrl(notes) {
    var doc = build(notes);
    return doc ? doc.output('bloburl') : null;
  }

  global.DANFE = { build: build, save: save, previewUrl: previewUrl, fmt: { doc: fDoc, key: fKey, cep: fCEP, fone: fFone, num: fNum } };
})(window);
