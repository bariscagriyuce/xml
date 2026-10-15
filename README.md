# NF-e XML Analyzer

A web-based tool for analyzing Brazilian electronic invoice XML files — NF-e (model 55) and NFC-e (model 65).
Load XMLs in bulk, see totals and details, search across everything, and print the official DANFE as PDF.

Interface languages: English, Português (Brasil), 中文, Türkçe.

## Installation

Nothing runs on the server — no PHP, no database. Upload these files and folders to any folder on your web hosting
(e.g. `public_html/nfe/`) via FTP or your hosting file manager:

```
index.html
assets/   (app.js, danfe.js, i18n.js, parser.js, style.css)
vendor/   (jsPDF, JSZip, qrcode-generator — bundled, no CDN or internet access needed)
```

The `samples/` folder contains test XMLs; uploading it is optional.

To try it locally, serve the folder with any static web server, for example:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Features

- **Bulk upload:** drag and drop multiple `.xml` files or `.zip` archives.
  Cancellation event XMLs (`procEventoNFe`, event 110111) are matched to their invoice automatically and mark it as cancelled.
- **Overview cards:** invoice count, total value, ICMS, IPI, item lines and number of issuers.
  Cancelled and denied invoices are excluded from the monetary totals.
- **Search:** in all fields or in one specific field — access key, number, issuer, recipient, CNPJ/CPF, product, NCM or CFOP.
  Accent-insensitive; formatted CNPJs such as `12.345.678/0001-95` are matched too.
- **Filters:** date range, value range, inbound/outbound, status and model (55/65).
- **Tabs:**
  - *Invoices* — sortable list
  - *Items* — every product line across all invoices
  - *Summary* — breakdown by issuer, recipient, month, state (UF), CFOP and NCM
- **Detail view:** general data, issuer and recipient, items, taxes, transport, installments, payments and authorization protocol.
  The original XML can be downloaded from here.
- **DANFE PDF:**
  - NF-e: standard A4 DANFE with receipt stub, Code 128 barcode of the access key, multi-page item list and page numbering (FOLHA x/y)
  - NFC-e: 80 mm DANFE NFC-e receipt with QR code
  - Multiple selected invoices are combined into one PDF
  - Watermarks for cancelled, homologation (test environment) and unauthorized invoices
- **CSV export** of invoices and items (Excel-compatible, `;` separated).
- **Languages:** switch from the top-right selector; the choice is remembered.

## Privacy

All files are processed in the user's browser only — nothing is sent to the server.
Loaded XMLs are kept in the browser's IndexedDB, so they survive a page reload until "Clear all" is used.

## Notes

DANFE is a legal document in Brazil, so the PDF labels are always printed in Portuguese; the selected language only affects the interface.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Page layout |
| `assets/parser.js` | NF-e / NFC-e / cancellation event XML parser (layout 3.10 and 4.00) |
| `assets/danfe.js` | DANFE and DANFE NFC-e PDF generator |
| `assets/i18n.js` | Translations |
| `assets/app.js` | UI: upload, search, filters, tables, detail view, export |
| `assets/style.css` | Styles (light and dark mode) |
| `vendor/` | Third-party libraries: jsPDF 2.5.1, JSZip 3.10.1, qrcode-generator 1.4.4 |
| `samples/` | Sample XMLs with fictitious data |
