import express from 'express';
import cors from 'cors';
import PDFDocument from 'pdfkit';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function generateInvoice(doc, data) {
  const { customerName, items, invoiceNumber, date } = data;

  doc.rect(0, 0, doc.page.width, 120).fill('#2563eb');

  doc.fontSize(32).fillColor('#ffffff').text('PRODUCT INVOICE', 50, 40);
  doc.fontSize(12).text('Professional Services', 50, 80);

  doc.fontSize(10)
    .fillColor('#e0e7ff')
    .text('Business Street', 400, 45, { align: 'right', width: 150 })
    .text('Telangana, Hyderabad - 16', 400, 60, { align: 'right', width: 150 })
    .text('Phone: +91 7535926573', 400, 75, { align: 'right', width: 150 })
    .text('Email: info@company.com', 400, 90, { align: 'right', width: 150 });

  doc.fillColor('#000000');
  doc.fontSize(12).text('BILL TO:', 50, 150);
  doc.fontSize(14).font('Helvetica-Bold').text(customerName, 50, 170);
  doc.font('Helvetica');

  doc.fontSize(10).text(`Invoice #: ${invoiceNumber}`, 400, 150, { align: 'right', width: 150 });
  doc.text(`Date: ${date}`, 400, 165, { align: 'right', width: 150 });

  const tableTop = 230;
  const itemCodeX = 50;
  const descriptionX = 150;
  const quantityX = 320;
  const priceX = 380;
  const amountX = 470;

  doc.rect(50, tableTop, 545, 25).fill('#475569');

  doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff');
  doc.text('Item', itemCodeX + 5, tableTop + 7, { continued: false });
  doc.text('Description', descriptionX + 5, tableTop + 7, { continued: false });
  doc.text('Qty', quantityX + 5, tableTop + 7, { continued: false });
  doc.text('Price', priceX + 5, tableTop + 7, { continued: false });
  doc.text('Amount', amountX + 5, tableTop + 7, { continued: false });

  let yPosition = tableTop + 35;
  let subtotal = 0;

  items.forEach((item, index) => {
    const amount = item.quantity * item.price;
    subtotal += amount;

    if (index % 2 === 0) {
      doc.rect(50, yPosition - 5, 545, 25).fillAndStroke('#f8fafc', '#e2e8f0');
    }

    doc.font('Helvetica').fontSize(10).fillColor('#000000');
    doc.text(item.name, itemCodeX + 5, yPosition, { width: 90, continued: false });
    doc.text(item.description || '-', descriptionX + 5, yPosition, { width: 150, continued: false });
    doc.text(item.quantity.toString(), quantityX + 5, yPosition, { width: 40, continued: false });
    doc.text(`Rs. ${item.price.toFixed(2)}`, priceX + 5, yPosition, { width: 80, align: 'right', continued: false });
    doc.text(`Rs. ${amount.toFixed(2)}`, amountX + 5, yPosition, { width: 115, align: 'right', continued: false });

    yPosition += 30;
  });

  const summaryTop = yPosition + 20;
  const labelX = 380;
  const valueX = 470;

  doc.font('Helvetica').fontSize(11).fillColor('#000000');
  doc.text('Subtotal:', labelX, summaryTop, { width: 80, continued: false });
  doc.text(`Rs. ${subtotal.toFixed(2)}`, valueX, summaryTop, { width: 115, align: 'right', continued: false });

  const tax = subtotal * 0.18;
  doc.text('Tax (18%):', labelX, summaryTop + 20, { width: 80, continued: false });
  doc.text(`Rs. ${tax.toFixed(2)}`, valueX, summaryTop + 20, { width: 115, align: 'right', continued: false });

  doc.strokeColor('#2563eb').lineWidth(2);
  doc.moveTo(380, summaryTop + 45).lineTo(595, summaryTop + 45).stroke();

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000');
  doc.text('Total:', labelX, summaryTop + 50, { width: 80, continued: false });
  doc.text(`Rs. ${(subtotal + tax).toFixed(2)}`, valueX, summaryTop + 50, { width: 115, align: 'right', continued: false });

  doc.font('Helvetica').fontSize(9);
  const footerY = doc.page.height - 80;
  doc.fillColor('#64748b');
  doc.text('Thank you for your business!', 50, footerY, { align: 'center', width: 512 });
  doc.text('Payment is due within 30 days. Please make checks payable to Professional Services.', 50, footerY + 15, {
    align: 'center',
    width: 512,
  });
  doc.text('For questions about this invoice, contact us at billing@company.com', 50, footerY + 30, {
    align: 'center',
    width: 512,
  });
}

app.post('/generate', (req, res) => {
  try {
    const { customerName, items } = req.body;

    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer name and items are required' });
    }

    const invoiceNumber = `INV-${Date.now()}`;
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceNumber}.pdf`);

    doc.pipe(res);

    generateInvoice(doc, {
      customerName,
      items,
      invoiceNumber,
      date,
    });

    doc.end();
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

app.listen(PORT, () => {
  console.log(`Invoice API server running on http://localhost:${PORT}`);
});
