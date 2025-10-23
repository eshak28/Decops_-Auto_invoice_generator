const express = require('express');
const path = require('path');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
  return formatter.format(amount);
}

function sanitizeFileName(name) {
  return String(name || '')
    .replace(/[^a-z0-9\-_.]+/gi, '_')
    .replace(/_+/g, '_')
    .slice(0, 64) || 'invoice';
}

function validatePayload(body) {
  const errors = [];
  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  const itemsRaw = Array.isArray(body.items) ? body.items : [];

  if (!customerName) errors.push('customerName is required');
  if (!itemsRaw.length) errors.push('items must contain at least one item');

  const items = itemsRaw
    .map((item, index) => {
      const description = typeof item.description === 'string' ? item.description.trim() : '';
      const amount = Number(item.amount);
      if (!description || !isFinite(amount) || amount <= 0) {
        errors.push(`items[${index}] must have description and positive amount`);
        return null;
      }
      return { description, amount };
    })
    .filter(Boolean);

  const invoiceNumber = typeof body.invoiceNumber === 'string' ? body.invoiceNumber.trim() : '';
  const dateIso = typeof body.date === 'string' ? body.date : undefined;
  const currency = typeof body.currency === 'string' ? body.currency : 'USD';
  const locale = typeof body.locale === 'string' ? body.locale : 'en-US';

  return { errors, data: { customerName, items, invoiceNumber, dateIso, currency, locale } };
}

function createInvoicePdf(doc, data) {
  const {
    customerName,
    items,
    invoiceNumber,
    dateIso,
    currency,
    locale,
  } = data;

  const company = {
    name: 'Auto Invoice Generator Co.',
    addressLine1: '123 Business Road',
    addressLine2: 'Metropolis, Country',
    email: 'support@example.com',
    website: 'www.example.com',
  };

  const margin = 50;
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Header background
  doc.rect(0, 0, pageWidth, 90).fill('#0d47a1');

  // Company header text
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold');
  doc.text(company.name, margin, 25, { align: 'left' });
  doc.fontSize(10).font('Helvetica');
  doc.text(`${company.addressLine1}`, margin, 55);
  doc.text(`${company.addressLine2}`, margin, 70);

  // Invoice meta
  const displayDate = dateIso ? new Date(dateIso) : new Date();
  const dateStr = displayDate.toLocaleDateString(locale || 'en-US');
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('INVOICE', pageWidth - margin - 200, 25, { width: 200, align: 'right' });
  doc.font('Helvetica').fontSize(10);
  doc.text(`Invoice #: ${invoiceNumber || 'N/A'}`, pageWidth - margin - 200, 45, { width: 200, align: 'right' });
  doc.text(`Date: ${dateStr}`, pageWidth - margin - 200, 60, { width: 200, align: 'right' });

  // Reset fill color for body
  doc.fillColor('#000000');

  let cursorY = 110;

  // Customer info
  doc.font('Helvetica-Bold').fontSize(12).text('Bill To:', margin, cursorY);
  doc.font('Helvetica').fontSize(12).text(customerName, margin + 70, cursorY);

  cursorY += 30;

  // Items table header background
  const tableLeftX = margin;
  const tableRightX = pageWidth - margin;
  const tableWidth = tableRightX - tableLeftX;
  const descriptionWidth = Math.floor(tableWidth * 0.65);
  const amountWidth = tableWidth - descriptionWidth;

  doc.rect(tableLeftX, cursorY, tableWidth, 26).fill('#f1f5f9');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11);
  doc.text('Description', tableLeftX + 8, cursorY + 8, { width: descriptionWidth - 16, align: 'left' });
  doc.text('Amount', tableLeftX + descriptionWidth + 8, cursorY + 8, { width: amountWidth - 16, align: 'right' });

  // Divider line under header
  doc.fillColor('#000000');
  cursorY += 26;
  doc.moveTo(tableLeftX, cursorY).lineTo(tableRightX, cursorY).strokeColor('#cbd5e1').lineWidth(1).stroke();

  // Table rows
  const rowHeight = 24;
  doc.font('Helvetica').fontSize(10).fillColor('#111827');

  function ensureSpaceForRow() {
    const bottomMargin = 120; // keep space for totals/footer
    if (cursorY + rowHeight > pageHeight - bottomMargin) {
      doc.addPage();
      // Redraw table header on new page
      cursorY = margin;
      doc.rect(tableLeftX, cursorY, tableWidth, 26).fill('#f1f5f9');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11);
      doc.text('Description', tableLeftX + 8, cursorY + 8, { width: descriptionWidth - 16, align: 'left' });
      doc.text('Amount', tableLeftX + descriptionWidth + 8, cursorY + 8, { width: amountWidth - 16, align: 'right' });
      doc.fillColor('#000000');
      cursorY += 26;
      doc.moveTo(tableLeftX, cursorY).lineTo(tableRightX, cursorY).strokeColor('#cbd5e1').lineWidth(1).stroke();
    }
  }

  let subtotal = 0;
  items.forEach((item) => {
    ensureSpaceForRow();
    const { description, amount } = item;
    subtotal += amount;

    const rowY = cursorY + 6;
    doc.fillColor('#111827').font('Helvetica').fontSize(10);
    doc.text(description, tableLeftX + 8, rowY, {
      width: descriptionWidth - 16,
      align: 'left',
    });
    doc.text(formatCurrency(amount, currency, locale), tableLeftX + descriptionWidth + 8, rowY, {
      width: amountWidth - 16,
      align: 'right',
    });

    cursorY += rowHeight;
    doc.moveTo(tableLeftX, cursorY).lineTo(tableRightX, cursorY).strokeColor('#eef2f7').lineWidth(1).stroke();
  });

  // Totals
  const taxRate = 0.18;
  const tax = +(subtotal * taxRate).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const totalsX = tableLeftX + descriptionWidth + 8;
  const labelX = totalsX - 140;
  cursorY += 16;

  doc.font('Helvetica').fontSize(11).fillColor('#111827');
  doc.text('Subtotal', labelX, cursorY, { width: 120, align: 'right' });
  doc.text(formatCurrency(subtotal, currency, locale), totalsX, cursorY, { width: amountWidth - 16, align: 'right' });
  cursorY += 18;

  doc.text('Tax (18%)', labelX, cursorY, { width: 120, align: 'right' });
  doc.text(formatCurrency(tax, currency, locale), totalsX, cursorY, { width: amountWidth - 16, align: 'right' });
  cursorY += 18;

  doc.font('Helvetica-Bold').fontSize(12);
  doc.text('Total', labelX, cursorY, { width: 120, align: 'right' });
  doc.text(formatCurrency(total, currency, locale), totalsX, cursorY, { width: amountWidth - 16, align: 'right' });

  // Footer
  const footerY = pageHeight - 70;
  doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).strokeColor('#e5e7eb').lineWidth(1).stroke();
  doc.font('Helvetica').fontSize(9).fillColor('#6b7280');
  doc.text('Payment is due upon receipt.', margin, footerY + 10, { width: pageWidth - 2 * margin, align: 'left' });
  doc.text(`${company.website}  |  ${company.email}`, margin, footerY + 24, { width: pageWidth - 2 * margin, align: 'right' });
}

app.post('/generate', (req, res) => {
  const { errors, data } = validatePayload(req.body || {});
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const fileBase = sanitizeFileName(data.invoiceNumber || `${Date.now()}`);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${fileBase}.pdf"`);

  doc.on('error', (err) => {
    console.error('PDF generation error:', err);
    if (!res.headersSent) {
      res.status(500).end('Failed to generate PDF');
    } else {
      try { res.end(); } catch (_) {}
    }
  });

  doc.pipe(res);
  createInvoicePdf(doc, data);
  doc.end();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
