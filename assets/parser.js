/* NF-e / NFC-e XML parser (layout 3.10 / 4.00). Namespace-agnostic. */
(function (global) {
  'use strict';

  function kids(el, name) {
    if (!el) return [];
    var out = [];
    for (var i = 0; i < el.children.length; i++) {
      if (el.children[i].localName === name) out.push(el.children[i]);
    }
    return out;
  }
  function child(el, path) {
    var parts = path.split('/');
    var cur = el;
    for (var i = 0; i < parts.length && cur; i++) cur = kids(cur, parts[i])[0] || null;
    return cur;
  }
  function txt(el, path) {
    var c = path ? child(el, path) : el;
    return c ? (c.textContent || '').trim() : '';
  }
  function num(el, path) {
    var v = parseFloat(txt(el, path));
    return isNaN(v) ? 0 : v;
  }
  function deep(doc, name) {
    var list = doc.getElementsByTagNameNS('*', name);
    return list.length ? list[0] : null;
  }
  function firstChildEl(el) {
    return el && el.children.length ? el.children[0] : null;
  }

  function address(el) {
    if (!el) return {};
    return {
      xLgr: txt(el, 'xLgr'), nro: txt(el, 'nro'), xCpl: txt(el, 'xCpl'),
      xBairro: txt(el, 'xBairro'), cMun: txt(el, 'cMun'), xMun: txt(el, 'xMun'),
      UF: txt(el, 'UF'), CEP: txt(el, 'CEP'), xPais: txt(el, 'xPais'), fone: txt(el, 'fone')
    };
  }

  function party(el, endName) {
    if (!el) return null;
    return {
      doc: txt(el, 'CNPJ') || txt(el, 'CPF') || txt(el, 'idEstrangeiro'),
      docType: txt(el, 'CNPJ') ? 'CNPJ' : (txt(el, 'CPF') ? 'CPF' : (txt(el, 'idEstrangeiro') ? 'EXT' : '')),
      xNome: txt(el, 'xNome'), xFant: txt(el, 'xFant'),
      ender: address(child(el, endName)),
      IE: txt(el, 'IE'), IEST: txt(el, 'IEST'), IM: txt(el, 'IM'),
      CRT: txt(el, 'CRT'), email: txt(el, 'email'), indIEDest: txt(el, 'indIEDest')
    };
  }

  function parseItem(det) {
    var prod = child(det, 'prod');
    var imp = child(det, 'imposto');
    var icmsGroup = firstChildEl(child(imp, 'ICMS'));
    var ipiTrib = child(imp, 'IPI/IPITrib');
    var pis = firstChildEl(child(imp, 'PIS'));
    var cofins = firstChildEl(child(imp, 'COFINS'));
    var orig = txt(icmsGroup, 'orig');
    var cst = txt(icmsGroup, 'CST') || txt(icmsGroup, 'CSOSN');
    return {
      nItem: det.getAttribute('nItem') || '',
      cProd: txt(prod, 'cProd'), cEAN: txt(prod, 'cEAN'), xProd: txt(prod, 'xProd'),
      NCM: txt(prod, 'NCM'), CEST: txt(prod, 'CEST'), CFOP: txt(prod, 'CFOP'),
      uCom: txt(prod, 'uCom'), qCom: num(prod, 'qCom'), vUnCom: num(prod, 'vUnCom'),
      vProd: num(prod, 'vProd'), vDesc: num(prod, 'vDesc'), vFrete: num(prod, 'vFrete'),
      orig: orig, CST: cst, OCST: orig + cst,
      vBC: num(icmsGroup, 'vBC'), pICMS: num(icmsGroup, 'pICMS'), vICMS: num(icmsGroup, 'vICMS'),
      vBCST: num(icmsGroup, 'vBCST'), vICMSST: num(icmsGroup, 'vICMSST'),
      pIPI: num(ipiTrib, 'pIPI'), vIPI: num(ipiTrib, 'vIPI'),
      vPIS: num(pis, 'vPIS'), vCOFINS: num(cofins, 'vCOFINS'),
      vTotTrib: num(imp, 'vTotTrib'),
      infAdProd: txt(det, 'infAdProd')
    };
  }

  function statusFromCode(cStat, hasProt) {
    if (!hasProt) return 'unauthorized';
    var c = parseInt(cStat, 10);
    if (c === 100 || c === 150) return 'authorized';
    if (c === 101 || c === 135 || c === 151 || c === 155) return 'cancelled';
    if (c === 110 || c === 301 || c === 302 || c === 303) return 'denied';
    return 'other';
  }

  /* Returns {kind:'nfe', note} | {kind:'cancel', key, ...} ; throws Error('notNFe' | 'invalidXml') */
  function parse(xmlText, fileName) {
    var doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('invalidXml');

    var infNFe = deep(doc, 'infNFe');
    if (!infNFe) {
      var infEvento = deep(doc, 'infEvento');
      if (infEvento && txt(infEvento, 'tpEvento') === '110111') {
        var retInf = deep(doc, 'retEvento');
        var retCStat = retInf ? txt(child(retInf, 'infEvento'), 'cStat') : '135';
        return {
          kind: 'cancel', key: txt(infEvento, 'chNFe'),
          nProt: txt(infEvento, 'detEvento/nProt'), xJust: txt(infEvento, 'detEvento/xJust'),
          dhEvento: txt(infEvento, 'dhEvento'), ok: retCStat === '135' || retCStat === '155' || !retInf
        };
      }
      throw new Error('notNFe');
    }

    var ide = child(infNFe, 'ide');
    var tot = child(infNFe, 'total/ICMSTot');
    var transp = child(infNFe, 'transp');
    var transporta = child(transp, 'transporta');
    var veic = child(transp, 'veicTransp');
    var cobr = child(infNFe, 'cobr');
    var fat = child(cobr, 'fat');
    var infAdic = child(infNFe, 'infAdic');
    var infProt = deep(doc, 'infProt');
    var supl = deep(doc, 'infNFeSupl');

    var key = (infNFe.getAttribute('Id') || '').replace(/^NFe/, '');
    if (!key && infProt) key = txt(infProt, 'chNFe');

    var dhEmi = txt(ide, 'dhEmi') || txt(ide, 'dEmi');
    var dhSaiEnt = txt(ide, 'dhSaiEnt') || (txt(ide, 'dSaiEnt') ? txt(ide, 'dSaiEnt') + (txt(ide, 'hSaiEnt') ? 'T' + txt(ide, 'hSaiEnt') : '') : '');

    var items = kids(infNFe, 'det').map(parseItem);
    var cStat = infProt ? txt(infProt, 'cStat') : '';

    var note = {
      id: key || (fileName + '#' + Date.now()),
      fileName: fileName,
      key: key,
      version: infNFe.getAttribute('versao') || '',
      ide: {
        cUF: txt(ide, 'cUF'), cNF: txt(ide, 'cNF'), natOp: txt(ide, 'natOp'),
        mod: txt(ide, 'mod'), serie: txt(ide, 'serie'), nNF: txt(ide, 'nNF'),
        dhEmi: dhEmi, dhSaiEnt: dhSaiEnt, tpNF: txt(ide, 'tpNF'), idDest: txt(ide, 'idDest'),
        tpImp: txt(ide, 'tpImp'), tpEmis: txt(ide, 'tpEmis'), tpAmb: txt(ide, 'tpAmb'),
        finNFe: txt(ide, 'finNFe'), indFinal: txt(ide, 'indFinal'), indPres: txt(ide, 'indPres'),
        dhCont: txt(ide, 'dhCont'), xJust: txt(ide, 'xJust')
      },
      emit: party(child(infNFe, 'emit'), 'enderEmit'),
      dest: party(child(infNFe, 'dest'), 'enderDest'),
      items: items,
      total: {
        vBC: num(tot, 'vBC'), vICMS: num(tot, 'vICMS'), vICMSDeson: num(tot, 'vICMSDeson'),
        vFCP: num(tot, 'vFCP'), vBCST: num(tot, 'vBCST'), vST: num(tot, 'vST'),
        vFCPST: num(tot, 'vFCPST'), vProd: num(tot, 'vProd'), vFrete: num(tot, 'vFrete'),
        vSeg: num(tot, 'vSeg'), vDesc: num(tot, 'vDesc'), vII: num(tot, 'vII'),
        vIPI: num(tot, 'vIPI'), vPIS: num(tot, 'vPIS'), vCOFINS: num(tot, 'vCOFINS'),
        vOutro: num(tot, 'vOutro'), vNF: num(tot, 'vNF'), vTotTrib: num(tot, 'vTotTrib'),
        vFCPUFDest: num(tot, 'vFCPUFDest'), vICMSUFDest: num(tot, 'vICMSUFDest'), vICMSUFRemet: num(tot, 'vICMSUFRemet')
      },
      transp: {
        modFrete: txt(transp, 'modFrete'),
        transporta: transporta ? {
          doc: txt(transporta, 'CNPJ') || txt(transporta, 'CPF'), xNome: txt(transporta, 'xNome'),
          IE: txt(transporta, 'IE'), xEnder: txt(transporta, 'xEnder'), xMun: txt(transporta, 'xMun'), UF: txt(transporta, 'UF')
        } : null,
        veic: veic ? { placa: txt(veic, 'placa'), UF: txt(veic, 'UF'), RNTC: txt(veic, 'RNTC') } : null,
        vol: kids(transp, 'vol').map(function (v) {
          return { qVol: txt(v, 'qVol'), esp: txt(v, 'esp'), marca: txt(v, 'marca'), nVol: txt(v, 'nVol'), pesoL: num(v, 'pesoL'), pesoB: num(v, 'pesoB') };
        })
      },
      cobr: {
        fat: fat ? { nFat: txt(fat, 'nFat'), vOrig: num(fat, 'vOrig'), vDesc: num(fat, 'vDesc'), vLiq: num(fat, 'vLiq') } : null,
        dup: kids(cobr, 'dup').map(function (d) { return { nDup: txt(d, 'nDup'), dVenc: txt(d, 'dVenc'), vDup: num(d, 'vDup') }; })
      },
      pag: (function () {
        var list = [];
        kids(infNFe, 'pag').forEach(function (p) {
          var dets = kids(p, 'detPag');
          if (dets.length) dets.forEach(function (d) { list.push({ tPag: txt(d, 'tPag'), vPag: num(d, 'vPag'), xPag: txt(d, 'xPag') }); });
          else if (txt(p, 'tPag')) list.push({ tPag: txt(p, 'tPag'), vPag: num(p, 'vPag'), xPag: '' });
        });
        return list;
      })(),
      vTroco: num(child(infNFe, 'pag'), 'vTroco'),
      infAdic: { infAdFisco: txt(infAdic, 'infAdFisco'), infCpl: txt(infAdic, 'infCpl') },
      prot: infProt ? {
        nProt: txt(infProt, 'nProt'), dhRecbto: txt(infProt, 'dhRecbto'),
        cStat: cStat, xMotivo: txt(infProt, 'xMotivo'), verAplic: txt(infProt, 'verAplic')
      } : null,
      supl: supl ? { qrCode: txt(supl, 'qrCode'), urlChave: txt(supl, 'urlChave') } : null,
      status: statusFromCode(cStat, !!infProt),
      cancel: null
    };
    note.search = buildSearch(note);
    return { kind: 'nfe', note: note };
  }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function buildSearch(n) {
    var e = n.emit || {}, d = n.dest || {};
    var products = n.items.map(function (i) { return [i.cProd, i.cEAN, i.xProd, i.NCM, i.CFOP, i.CEST].join(' '); }).join(' ');
    return {
      key: n.key,
      number: n.ide.nNF + ' ' + n.ide.serie,
      emitter: norm([e.xNome, e.xFant, e.doc, e.IE, e.ender && e.ender.xMun, e.ender && e.ender.UF].join(' ')),
      recipient: norm([d.xNome, d.doc, d.IE, d.email, d.ender && d.ender.xMun, d.ender && d.ender.UF].join(' ')),
      cnpj: [e.doc, d.doc, n.transp.transporta && n.transp.transporta.doc].join(' '),
      product: norm(products),
      ncm: n.items.map(function (i) { return i.NCM; }).join(' '),
      cfop: n.items.map(function (i) { return i.CFOP; }).join(' '),
      all: norm([n.key, n.ide.nNF, n.ide.serie, n.ide.natOp, e.xNome, e.xFant, e.doc, d.xNome, d.doc,
        e.ender && e.ender.xMun, d.ender && d.ender.xMun, products, n.infAdic.infCpl, n.infAdic.infAdFisco,
        n.prot && n.prot.nProt, n.fileName, n.transp.transporta && n.transp.transporta.xNome].join(' '))
    };
  }

  global.NFeParser = { parse: parse, norm: norm };
})(window);
