const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Create fixtures directory if it doesn't exist
const fixturesDir = path.join(__dirname, 'fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// Generate a test invoice PDF
const doc = new PDFDocument({ size: 'A4', margin: 50 });
const invoicePath = path.join(fixturesDir, 'invoice.pdf');
const out = fs.createWriteStream(invoicePath);

doc.pipe(out);

doc.fontSize(20).text('INVOICE', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text('Acme Corp LLC');
doc.text('123 Business Street');
doc.text('Invoice #: INV-2024-001');
doc.text('Date: 2024-03-15');
doc.moveDown();
doc.text('Bill To: John Smith');
doc.moveDown();
doc.text('Description                    Amount');
doc.text('Web Development Service       $1,200.00');
doc.text('Hosting Setup                 $150.00');
doc.moveDown();
doc.text('Subtotal:                     $1,350.00');
doc.text('Tax (8%):                     $108.00');
doc.text('Total Due:                    $1,458.00');
doc.end();

out.on('finish', () => {
  console.log('Invoice PDF generated:', invoicePath);

  // Generate a resume PDF
  const doc2 = new PDFDocument({ size: 'A4', margin: 50 });
  const resumePath = path.join(fixturesDir, 'resume.pdf');
  const out2 = fs.createWriteStream(resumePath);
  doc2.pipe(out2);

  doc2.fontSize(20).text('Jane Doe', { align: 'center' });
  doc2.fontSize(12).text('jane.doe@email.com | (555) 123-4567', { align: 'center' });
  doc2.moveDown();
  doc2.fontSize(14).text('Summary');
  doc2.fontSize(12).text('Senior software engineer with 5 years of experience in web development.');
  doc2.moveDown();
  doc2.fontSize(14).text('Skills');
  doc2.fontSize(12).text('JavaScript, TypeScript, React, Node.js, Express, Python, SQL, PostgreSQL, Docker, AWS, Git');
  doc2.moveDown();
  doc2.fontSize(14).text('Experience');
  doc2.fontSize(12).text('Senior Developer at TechCorp (2020-2024)');
  doc2.text('Developer at StartupInc (2019-2020)');
  doc2.moveDown();
  doc2.fontSize(14).text('Education');
  doc2.fontSize(12).text('Bachelor of Science in Computer Science, MIT (2015-2019)');
  doc2.end();

  out2.on('finish', () => {
    console.log('Resume PDF generated:', resumePath);
  });
});
