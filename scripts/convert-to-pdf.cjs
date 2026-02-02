const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function convertToPDF() {
  const htmlPath = path.join(__dirname, '..', 'docs', 'customer-report.html');
  const pdfPath = path.join(__dirname, '..', 'docs', 'GETFIT_CUSTOMER_REPORT.pdf');
  
  // Check if HTML file exists
  if (!fs.existsSync(htmlPath)) {
    console.error('HTML file not found. Please run generate-customer-report.cjs first.');
    process.exit(1);
  }
  
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  console.log('Loading HTML file...');
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0',
    timeout: 60000
  });
  
  console.log('Generating PDF...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    }
  });
  
  await browser.close();
  
  console.log(`\nPDF generated successfully!`);
  console.log(`Output file: ${pdfPath}`);
  
  // Get file size
  const stats = fs.statSync(pdfPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`File size: ${fileSizeInMB} MB`);
}

convertToPDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
