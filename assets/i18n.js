/* UI translations: English, Brazilian Portuguese, Chinese (Simplified), Turkish */
(function (global) {
  'use strict';

  var LANGS = {
    en: { label: 'English', locale: 'en-US' },
    'pt-BR': { label: 'Português (Brasil)', locale: 'pt-BR' },
    zh: { label: '中文', locale: 'zh-CN' },
    tr: { label: 'Türkçe', locale: 'tr-TR' }
  };

  var T = {
    en: {
      appTitle: 'NF-e XML Analyzer',
      appSubtitle: 'Batch details, search and DANFE PDF for Brazilian electronic invoices',
      dropTitle: 'Drop NF-e / NFC-e XML files here',
      dropHint: 'Multiple .xml files or .zip archives. Cancellation event XMLs are matched automatically.',
      browse: 'Choose files',
      privacy: 'Files are processed only in your browser. Nothing is uploaded to the server.',
      language: 'Language',
      tabNotes: 'Invoices', tabItems: 'Items', tabSummary: 'Summary',
      kpiNotes: 'Invoices', kpiTotal: 'Total value', kpiICMS: 'Total ICMS', kpiIPI: 'Total IPI', kpiItems: 'Item lines', kpiEmitters: 'Issuers',
      searchPlaceholder: 'Search: key, number, CNPJ, company, product, NCM…',
      searchIn: 'Search in',
      f_all: 'All fields', f_key: 'Access key', f_number: 'Number / series', f_emitter: 'Issuer', f_recipient: 'Recipient',
      f_cnpj: 'CNPJ / CPF', f_product: 'Product', f_ncm: 'NCM', f_cfop: 'CFOP',
      filters: 'Filters', dateFrom: 'Date from', dateTo: 'Date to', minValue: 'Min. value', maxValue: 'Max. value',
      type: 'Type', any: 'All', entry: 'Inbound', exit: 'Outbound', status: 'Status', model: 'Model',
      st_authorized: 'Authorized', st_cancelled: 'Cancelled', st_denied: 'Denied', st_unauthorized: 'No protocol', st_other: 'Other',
      resetFilters: 'Reset',
      exportCsv: 'Export invoices (CSV)', exportItemsCsv: 'Export items (CSV)', pdfSelected: 'DANFE PDF of selected', clearAll: 'Clear all',
      confirmClear: 'Remove all loaded invoices?',
      col_number: 'Number', col_date: 'Issue date', col_emitter: 'Issuer', col_recipient: 'Recipient', col_type: 'Type',
      col_value: 'Total', col_icms: 'ICMS', col_status: 'Status', col_actions: '', col_model: 'Mod.', col_note: 'Invoice',
      view: 'Details', pdf: 'PDF', xml: 'XML',
      noData: 'No invoices loaded yet.', noResults: 'No invoices match your search.',
      showing: '{n} of {m} invoices', selected: '{n} selected',
      loadedMsg: '{n} invoice(s) loaded', failedMsg: '{n} file(s) could not be read', dupMsg: '{n} duplicate(s) skipped', cancelMsg: '{n} cancellation event(s) applied',
      err_notNFe: 'not an NF-e XML', err_invalidXml: 'invalid XML',
      generating: 'Generating PDF…', selectFirst: 'Select at least one invoice.',
      d_general: 'General', d_emitter: 'Issuer', d_recipient: 'Recipient', d_items: 'Products / services', d_totals: 'Totals',
      d_transport: 'Transport', d_billing: 'Billing', d_payment: 'Payment', d_additional: 'Additional information', d_protocol: 'Authorization',
      d_key: 'Access key', d_natOp: 'Nature of operation', d_emission: 'Issued at', d_exitEntry: 'Exit / entry', d_finality: 'Purpose',
      d_env: 'Environment', env1: 'Production', env2: 'Homologation (test)', d_version: 'Layout version', d_file: 'File',
      fin1: 'Normal', fin2: 'Complementary', fin3: 'Adjustment', fin4: 'Return',
      name: 'Name', tradeName: 'Trade name', doc: 'CNPJ / CPF', ie: 'State reg. (IE)', address: 'Address', city: 'City', phone: 'Phone', email: 'E-mail', crt: 'Tax regime (CRT)',
      i_code: 'Code', i_desc: 'Description', i_ncm: 'NCM', i_cfop: 'CFOP', i_unit: 'Unit', i_qty: 'Qty', i_unitValue: 'Unit price', i_total: 'Total', i_icms: 'ICMS', i_ipi: 'IPI', i_cst: 'CST',
      t_vBC: 'ICMS base', t_vICMS: 'ICMS', t_vBCST: 'ICMS ST base', t_vST: 'ICMS ST', t_vProd: 'Products', t_vFrete: 'Freight', t_vSeg: 'Insurance',
      t_vDesc: 'Discount', t_vIPI: 'IPI', t_vPIS: 'PIS', t_vCOFINS: 'COFINS', t_vOutro: 'Other expenses', t_vNF: 'Invoice total', t_vTotTrib: 'Approx. taxes', t_vII: 'Import tax',
      freightBy: 'Freight paid by', carrier: 'Carrier', plate: 'Vehicle plate', volumes: 'Volumes', species: 'Species', grossWeight: 'Gross weight', netWeight: 'Net weight', qty: 'Quantity',
      fr0: 'Issuer (CIF)', fr1: 'Recipient (FOB)', fr2: 'Third party', fr3: 'Own transport – sender', fr4: 'Own transport – recipient', fr9: 'No freight',
      invoice: 'Invoice', installment: 'Installment', dueDate: 'Due date', amount: 'Amount', payMethod: 'Method', change: 'Change',
      protNumber: 'Protocol', receivedAt: 'Received at', statusCode: 'Status code', reason: 'Message', cancelEvent: 'Cancellation event', justification: 'Justification',
      s_byEmitter: 'By issuer', s_byRecipient: 'By recipient', s_byMonth: 'By month', s_byCfop: 'By CFOP (item values)', s_byUf: 'By issuer state (UF)', s_byNcm: 'By NCM (item values)',
      count: 'Count', share: 'Share',
      close: 'Close', selectAll: 'Select all',
      pay01: 'Cash', pay02: 'Check', pay03: 'Credit card', pay04: 'Debit card', pay05: 'Store credit', pay10: 'Food voucher', pay11: 'Meal voucher',
      pay12: 'Gift voucher', pay13: 'Fuel voucher', pay14: 'Trade bill', pay15: 'Bank slip (boleto)', pay16: 'Bank deposit', pay17: 'PIX',
      pay18: 'Transfer / wallet', pay19: 'Loyalty / cashback', pay90: 'No payment', pay99: 'Other'
    },

    'pt-BR': {
      appTitle: 'Analisador de XML NF-e',
      appSubtitle: 'Detalhes em lote, pesquisa e DANFE em PDF para notas fiscais eletrônicas',
      dropTitle: 'Solte aqui os arquivos XML de NF-e / NFC-e',
      dropHint: 'Vários arquivos .xml ou .zip. XMLs de evento de cancelamento são vinculados automaticamente.',
      browse: 'Escolher arquivos',
      privacy: 'Os arquivos são processados apenas no seu navegador. Nada é enviado ao servidor.',
      language: 'Idioma',
      tabNotes: 'Notas', tabItems: 'Itens', tabSummary: 'Resumo',
      kpiNotes: 'Notas', kpiTotal: 'Valor total', kpiICMS: 'ICMS total', kpiIPI: 'IPI total', kpiItems: 'Itens', kpiEmitters: 'Emitentes',
      searchPlaceholder: 'Pesquisar: chave, número, CNPJ, empresa, produto, NCM…',
      searchIn: 'Pesquisar em',
      f_all: 'Todos os campos', f_key: 'Chave de acesso', f_number: 'Número / série', f_emitter: 'Emitente', f_recipient: 'Destinatário',
      f_cnpj: 'CNPJ / CPF', f_product: 'Produto', f_ncm: 'NCM', f_cfop: 'CFOP',
      filters: 'Filtros', dateFrom: 'Data inicial', dateTo: 'Data final', minValue: 'Valor mín.', maxValue: 'Valor máx.',
      type: 'Tipo', any: 'Todos', entry: 'Entrada', exit: 'Saída', status: 'Situação', model: 'Modelo',
      st_authorized: 'Autorizada', st_cancelled: 'Cancelada', st_denied: 'Denegada', st_unauthorized: 'Sem protocolo', st_other: 'Outra',
      resetFilters: 'Limpar',
      exportCsv: 'Exportar notas (CSV)', exportItemsCsv: 'Exportar itens (CSV)', pdfSelected: 'DANFE PDF das selecionadas', clearAll: 'Limpar tudo',
      confirmClear: 'Remover todas as notas carregadas?',
      col_number: 'Número', col_date: 'Emissão', col_emitter: 'Emitente', col_recipient: 'Destinatário', col_type: 'Tipo',
      col_value: 'Valor total', col_icms: 'ICMS', col_status: 'Situação', col_actions: '', col_model: 'Mod.', col_note: 'Nota',
      view: 'Detalhes', pdf: 'PDF', xml: 'XML',
      noData: 'Nenhuma nota carregada ainda.', noResults: 'Nenhuma nota corresponde à pesquisa.',
      showing: '{n} de {m} notas', selected: '{n} selecionada(s)',
      loadedMsg: '{n} nota(s) carregada(s)', failedMsg: '{n} arquivo(s) não puderam ser lidos', dupMsg: '{n} duplicada(s) ignorada(s)', cancelMsg: '{n} evento(s) de cancelamento aplicado(s)',
      err_notNFe: 'não é um XML de NF-e', err_invalidXml: 'XML inválido',
      generating: 'Gerando PDF…', selectFirst: 'Selecione pelo menos uma nota.',
      d_general: 'Dados gerais', d_emitter: 'Emitente', d_recipient: 'Destinatário', d_items: 'Produtos / serviços', d_totals: 'Totais',
      d_transport: 'Transporte', d_billing: 'Cobrança', d_payment: 'Pagamento', d_additional: 'Informações adicionais', d_protocol: 'Autorização',
      d_key: 'Chave de acesso', d_natOp: 'Natureza da operação', d_emission: 'Data de emissão', d_exitEntry: 'Saída / entrada', d_finality: 'Finalidade',
      d_env: 'Ambiente', env1: 'Produção', env2: 'Homologação', d_version: 'Versão do leiaute', d_file: 'Arquivo',
      fin1: 'Normal', fin2: 'Complementar', fin3: 'Ajuste', fin4: 'Devolução',
      name: 'Razão social', tradeName: 'Nome fantasia', doc: 'CNPJ / CPF', ie: 'Inscrição estadual', address: 'Endereço', city: 'Município', phone: 'Telefone', email: 'E-mail', crt: 'Regime tributário (CRT)',
      i_code: 'Código', i_desc: 'Descrição', i_ncm: 'NCM', i_cfop: 'CFOP', i_unit: 'Un.', i_qty: 'Qtd.', i_unitValue: 'Valor unit.', i_total: 'Valor total', i_icms: 'ICMS', i_ipi: 'IPI', i_cst: 'CST',
      t_vBC: 'Base de cálculo ICMS', t_vICMS: 'Valor do ICMS', t_vBCST: 'Base ICMS ST', t_vST: 'Valor ICMS ST', t_vProd: 'Total dos produtos', t_vFrete: 'Frete', t_vSeg: 'Seguro',
      t_vDesc: 'Desconto', t_vIPI: 'IPI', t_vPIS: 'PIS', t_vCOFINS: 'COFINS', t_vOutro: 'Outras despesas', t_vNF: 'Valor total da nota', t_vTotTrib: 'Tributos aprox.', t_vII: 'Imposto de importação',
      freightBy: 'Modalidade do frete', carrier: 'Transportador', plate: 'Placa', volumes: 'Volumes', species: 'Espécie', grossWeight: 'Peso bruto', netWeight: 'Peso líquido', qty: 'Quantidade',
      fr0: 'Emitente (CIF)', fr1: 'Destinatário (FOB)', fr2: 'Terceiros', fr3: 'Próprio – remetente', fr4: 'Próprio – destinatário', fr9: 'Sem frete',
      invoice: 'Fatura', installment: 'Duplicata', dueDate: 'Vencimento', amount: 'Valor', payMethod: 'Forma', change: 'Troco',
      protNumber: 'Protocolo', receivedAt: 'Recebido em', statusCode: 'Código de status', reason: 'Motivo', cancelEvent: 'Evento de cancelamento', justification: 'Justificativa',
      s_byEmitter: 'Por emitente', s_byRecipient: 'Por destinatário', s_byMonth: 'Por mês', s_byCfop: 'Por CFOP (valor dos itens)', s_byUf: 'Por UF do emitente', s_byNcm: 'Por NCM (valor dos itens)',
      count: 'Qtd.', share: 'Participação',
      close: 'Fechar', selectAll: 'Selecionar todas',
      pay01: 'Dinheiro', pay02: 'Cheque', pay03: 'Cartão de crédito', pay04: 'Cartão de débito', pay05: 'Crédito loja', pay10: 'Vale alimentação', pay11: 'Vale refeição',
      pay12: 'Vale presente', pay13: 'Vale combustível', pay14: 'Duplicata mercantil', pay15: 'Boleto bancário', pay16: 'Depósito bancário', pay17: 'PIX',
      pay18: 'Transferência / carteira digital', pay19: 'Fidelidade / cashback', pay90: 'Sem pagamento', pay99: 'Outros'
    },

    zh: {
      appTitle: 'NF-e XML 分析器',
      appSubtitle: '巴西电子发票的批量详情、搜索与 DANFE PDF 生成',
      dropTitle: '将 NF-e / NFC-e XML 文件拖放到此处',
      dropHint: '支持多个 .xml 文件或 .zip 压缩包。作废事件 XML 将自动匹配。',
      browse: '选择文件',
      privacy: '文件仅在您的浏览器中处理，不会上传到服务器。',
      language: '语言',
      tabNotes: '发票', tabItems: '商品明细', tabSummary: '汇总',
      kpiNotes: '发票数', kpiTotal: '总金额', kpiICMS: 'ICMS 合计', kpiIPI: 'IPI 合计', kpiItems: '明细行数', kpiEmitters: '开票方',
      searchPlaceholder: '搜索：访问密钥、号码、CNPJ、公司、商品、NCM…',
      searchIn: '搜索范围',
      f_all: '全部字段', f_key: '访问密钥', f_number: '号码 / 系列', f_emitter: '开票方', f_recipient: '收票方',
      f_cnpj: 'CNPJ / CPF', f_product: '商品', f_ncm: 'NCM', f_cfop: 'CFOP',
      filters: '筛选', dateFrom: '开始日期', dateTo: '结束日期', minValue: '最小金额', maxValue: '最大金额',
      type: '类型', any: '全部', entry: '进项', exit: '销项', status: '状态', model: '模型',
      st_authorized: '已授权', st_cancelled: '已作废', st_denied: '已拒绝', st_unauthorized: '无授权协议', st_other: '其他',
      resetFilters: '重置',
      exportCsv: '导出发票 (CSV)', exportItemsCsv: '导出明细 (CSV)', pdfSelected: '所选发票 DANFE PDF', clearAll: '全部清除',
      confirmClear: '确定移除所有已加载的发票？',
      col_number: '号码', col_date: '开票日期', col_emitter: '开票方', col_recipient: '收票方', col_type: '类型',
      col_value: '总金额', col_icms: 'ICMS', col_status: '状态', col_actions: '', col_model: '模型', col_note: '发票',
      view: '详情', pdf: 'PDF', xml: 'XML',
      noData: '尚未加载任何发票。', noResults: '没有符合搜索条件的发票。',
      showing: '{m} 张中的 {n} 张', selected: '已选 {n} 张',
      loadedMsg: '已加载 {n} 张发票', failedMsg: '{n} 个文件无法读取', dupMsg: '已跳过 {n} 个重复项', cancelMsg: '已应用 {n} 个作废事件',
      err_notNFe: '不是 NF-e XML', err_invalidXml: '无效的 XML',
      generating: '正在生成 PDF…', selectFirst: '请至少选择一张发票。',
      d_general: '基本信息', d_emitter: '开票方', d_recipient: '收票方', d_items: '商品 / 服务', d_totals: '合计',
      d_transport: '运输', d_billing: '账单', d_payment: '付款', d_additional: '附加信息', d_protocol: '授权',
      d_key: '访问密钥', d_natOp: '业务性质', d_emission: '开票时间', d_exitEntry: '出库 / 入库', d_finality: '用途',
      d_env: '环境', env1: '生产环境', env2: '测试环境', d_version: '版本', d_file: '文件',
      fin1: '正常', fin2: '补充', fin3: '调整', fin4: '退货',
      name: '名称', tradeName: '商号', doc: 'CNPJ / CPF', ie: '州注册号 (IE)', address: '地址', city: '城市', phone: '电话', email: '电子邮件', crt: '税制 (CRT)',
      i_code: '编码', i_desc: '描述', i_ncm: 'NCM', i_cfop: 'CFOP', i_unit: '单位', i_qty: '数量', i_unitValue: '单价', i_total: '金额', i_icms: 'ICMS', i_ipi: 'IPI', i_cst: 'CST',
      t_vBC: 'ICMS 计税基数', t_vICMS: 'ICMS', t_vBCST: 'ICMS ST 计税基数', t_vST: 'ICMS ST', t_vProd: '商品合计', t_vFrete: '运费', t_vSeg: '保险费',
      t_vDesc: '折扣', t_vIPI: 'IPI', t_vPIS: 'PIS', t_vCOFINS: 'COFINS', t_vOutro: '其他费用', t_vNF: '发票总额', t_vTotTrib: '税额（约）', t_vII: '进口税',
      freightBy: '运费承担方', carrier: '承运人', plate: '车牌', volumes: '包裹', species: '种类', grossWeight: '毛重', netWeight: '净重', qty: '数量',
      fr0: '开票方 (CIF)', fr1: '收票方 (FOB)', fr2: '第三方', fr3: '自运 – 发货方', fr4: '自运 – 收货方', fr9: '无运费',
      invoice: '发票', installment: '分期', dueDate: '到期日', amount: '金额', payMethod: '方式', change: '找零',
      protNumber: '协议号', receivedAt: '接收时间', statusCode: '状态码', reason: '说明', cancelEvent: '作废事件', justification: '理由',
      s_byEmitter: '按开票方', s_byRecipient: '按收票方', s_byMonth: '按月份', s_byCfop: '按 CFOP（明细金额）', s_byUf: '按开票方州 (UF)', s_byNcm: '按 NCM（明细金额）',
      count: '数量', share: '占比',
      close: '关闭', selectAll: '全选',
      pay01: '现金', pay02: '支票', pay03: '信用卡', pay04: '借记卡', pay05: '商店信用', pay10: '食品券', pay11: '餐券',
      pay12: '礼品券', pay13: '燃油券', pay14: '商业票据', pay15: '银行票据 (boleto)', pay16: '银行存款', pay17: 'PIX',
      pay18: '转账 / 电子钱包', pay19: '积分 / 返现', pay90: '无付款', pay99: '其他'
    },

    tr: {
      appTitle: 'NF-e XML Analiz Aracı',
      appSubtitle: 'Brezilya e-faturaları için toplu detay, arama ve DANFE PDF',
      dropTitle: 'NF-e / NFC-e XML dosyalarını buraya bırakın',
      dropHint: 'Birden fazla .xml dosyası veya .zip arşivi. İptal olayı XML\'leri otomatik eşleştirilir.',
      browse: 'Dosya seç',
      privacy: 'Dosyalar yalnızca tarayıcınızda işlenir. Sunucuya hiçbir şey yüklenmez.',
      language: 'Dil',
      tabNotes: 'Faturalar', tabItems: 'Kalemler', tabSummary: 'Özet',
      kpiNotes: 'Fatura', kpiTotal: 'Toplam tutar', kpiICMS: 'Toplam ICMS', kpiIPI: 'Toplam IPI', kpiItems: 'Kalem satırı', kpiEmitters: 'Düzenleyen',
      searchPlaceholder: 'Ara: erişim anahtarı, numara, CNPJ, firma, ürün, NCM…',
      searchIn: 'Arama alanı',
      f_all: 'Tüm alanlar', f_key: 'Erişim anahtarı', f_number: 'Numara / seri', f_emitter: 'Düzenleyen', f_recipient: 'Alıcı',
      f_cnpj: 'CNPJ / CPF', f_product: 'Ürün', f_ncm: 'NCM', f_cfop: 'CFOP',
      filters: 'Filtreler', dateFrom: 'Başlangıç tarihi', dateTo: 'Bitiş tarihi', minValue: 'Min. tutar', maxValue: 'Maks. tutar',
      type: 'Tür', any: 'Tümü', entry: 'Giriş', exit: 'Çıkış', status: 'Durum', model: 'Model',
      st_authorized: 'Onaylı', st_cancelled: 'İptal', st_denied: 'Reddedildi', st_unauthorized: 'Protokolsüz', st_other: 'Diğer',
      resetFilters: 'Sıfırla',
      exportCsv: 'Faturaları dışa aktar (CSV)', exportItemsCsv: 'Kalemleri dışa aktar (CSV)', pdfSelected: 'Seçilenlerin DANFE PDF\'i', clearAll: 'Tümünü temizle',
      confirmClear: 'Yüklenen tüm faturalar kaldırılsın mı?',
      col_number: 'Numara', col_date: 'Düzenleme tarihi', col_emitter: 'Düzenleyen', col_recipient: 'Alıcı', col_type: 'Tür',
      col_value: 'Toplam', col_icms: 'ICMS', col_status: 'Durum', col_actions: '', col_model: 'Mod.', col_note: 'Fatura',
      view: 'Detay', pdf: 'PDF', xml: 'XML',
      noData: 'Henüz fatura yüklenmedi.', noResults: 'Aramanızla eşleşen fatura yok.',
      showing: '{m} faturadan {n} tanesi', selected: '{n} seçili',
      loadedMsg: '{n} fatura yüklendi', failedMsg: '{n} dosya okunamadı', dupMsg: '{n} mükerrer dosya atlandı', cancelMsg: '{n} iptal olayı uygulandı',
      err_notNFe: 'NF-e XML\'i değil', err_invalidXml: 'geçersiz XML',
      generating: 'PDF oluşturuluyor…', selectFirst: 'En az bir fatura seçin.',
      d_general: 'Genel bilgiler', d_emitter: 'Düzenleyen', d_recipient: 'Alıcı', d_items: 'Ürünler / hizmetler', d_totals: 'Toplamlar',
      d_transport: 'Taşıma', d_billing: 'Tahsilat', d_payment: 'Ödeme', d_additional: 'Ek bilgiler', d_protocol: 'Onay',
      d_key: 'Erişim anahtarı', d_natOp: 'İşlem niteliği', d_emission: 'Düzenleme zamanı', d_exitEntry: 'Çıkış / giriş', d_finality: 'Amaç',
      d_env: 'Ortam', env1: 'Üretim', env2: 'Test (homologasyon)', d_version: 'Şema sürümü', d_file: 'Dosya',
      fin1: 'Normal', fin2: 'Tamamlayıcı', fin3: 'Düzeltme', fin4: 'İade',
      name: 'Unvan', tradeName: 'Ticari ad', doc: 'CNPJ / CPF', ie: 'Eyalet sicil no (IE)', address: 'Adres', city: 'Şehir', phone: 'Telefon', email: 'E-posta', crt: 'Vergi rejimi (CRT)',
      i_code: 'Kod', i_desc: 'Açıklama', i_ncm: 'NCM', i_cfop: 'CFOP', i_unit: 'Birim', i_qty: 'Miktar', i_unitValue: 'Birim fiyat', i_total: 'Tutar', i_icms: 'ICMS', i_ipi: 'IPI', i_cst: 'CST',
      t_vBC: 'ICMS matrahı', t_vICMS: 'ICMS', t_vBCST: 'ICMS ST matrahı', t_vST: 'ICMS ST', t_vProd: 'Ürün toplamı', t_vFrete: 'Navlun', t_vSeg: 'Sigorta',
      t_vDesc: 'İndirim', t_vIPI: 'IPI', t_vPIS: 'PIS', t_vCOFINS: 'COFINS', t_vOutro: 'Diğer giderler', t_vNF: 'Fatura toplamı', t_vTotTrib: 'Yaklaşık vergiler', t_vII: 'İthalat vergisi',
      freightBy: 'Navlunu ödeyen', carrier: 'Taşıyıcı', plate: 'Araç plakası', volumes: 'Koliler', species: 'Tür', grossWeight: 'Brüt ağırlık', netWeight: 'Net ağırlık', qty: 'Adet',
      fr0: 'Düzenleyen (CIF)', fr1: 'Alıcı (FOB)', fr2: 'Üçüncü taraf', fr3: 'Kendi aracı – gönderen', fr4: 'Kendi aracı – alıcı', fr9: 'Navlun yok',
      invoice: 'Fatura', installment: 'Taksit', dueDate: 'Vade', amount: 'Tutar', payMethod: 'Yöntem', change: 'Para üstü',
      protNumber: 'Protokol', receivedAt: 'Alınma zamanı', statusCode: 'Durum kodu', reason: 'Mesaj', cancelEvent: 'İptal olayı', justification: 'Gerekçe',
      s_byEmitter: 'Düzenleyene göre', s_byRecipient: 'Alıcıya göre', s_byMonth: 'Aya göre', s_byCfop: 'CFOP\'a göre (kalem tutarı)', s_byUf: 'Düzenleyen eyaletine göre (UF)', s_byNcm: 'NCM\'e göre (kalem tutarı)',
      count: 'Adet', share: 'Pay',
      close: 'Kapat', selectAll: 'Tümünü seç',
      pay01: 'Nakit', pay02: 'Çek', pay03: 'Kredi kartı', pay04: 'Banka kartı', pay05: 'Mağaza kredisi', pay10: 'Gıda kuponu', pay11: 'Yemek kuponu',
      pay12: 'Hediye çeki', pay13: 'Yakıt kuponu', pay14: 'Ticari senet', pay15: 'Banka ödeme belgesi (boleto)', pay16: 'Banka havalesi', pay17: 'PIX',
      pay18: 'Transfer / dijital cüzdan', pay19: 'Sadakat / cashback', pay90: 'Ödeme yok', pay99: 'Diğer'
    }
  };

  var current = 'pt-BR';

  function detect() {
    var saved = null;
    try { saved = localStorage.getItem('nfe-lang'); } catch (e) {}
    if (saved && T[saved]) return saved;
    var nav = (navigator.language || 'en').toLowerCase();
    if (nav.indexOf('pt') === 0) return 'pt-BR';
    if (nav.indexOf('zh') === 0) return 'zh';
    if (nav.indexOf('tr') === 0) return 'tr';
    return 'en';
  }

  function t(key, vars) {
    var s = (T[current] && T[current][key]) || T.en[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }

  global.I18N = {
    LANGS: LANGS,
    t: t,
    get lang() { return current; },
    get locale() { return LANGS[current].locale; },
    set: function (l) {
      if (!T[l]) return;
      current = l;
      try { localStorage.setItem('nfe-lang', l); } catch (e) {}
      document.documentElement.lang = LANGS[l].locale;
    },
    init: function () { this.set(detect()); }
  };
})(window);
