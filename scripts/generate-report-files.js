/**
 * Script to generate PDF and DOCX versions of the test report
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, '..', 'docs', 'PILATES_TEST_REPORT.html');
const pdfPath = path.join(__dirname, '..', 'docs', 'PILATES_TEST_REPORT.pdf');
const docxPath = path.join(__dirname, '..', 'docs', 'PILATES_TEST_REPORT.docx');

async function generatePDF() {
    console.log('📄 Generating PDF...');
    
    const browser = await puppeteer.launch({
        headless: 'new'
    });
    
    const page = await browser.newPage();
    
    // Read HTML file
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    // Set content
    await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
    });
    
    // Generate PDF
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
    
    console.log(`✅ PDF created: ${pdfPath}`);
}

async function generateDOCX() {
    console.log('📝 Generating DOCX...');
    
    try {
        // Dynamic import for html-docx-js
        const htmlDocx = await import('html-docx-js');
        
        // Read HTML file
        let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        
        // Convert to DOCX
        const docxBuffer = htmlDocx.default.asBlob(htmlContent);
        
        // Convert Blob to Buffer
        const arrayBuffer = await docxBuffer.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Write file
        fs.writeFileSync(docxPath, buffer);
        
        console.log(`✅ DOCX created: ${docxPath}`);
    } catch (error) {
        console.log('⚠️ html-docx-js failed, creating alternative RTF...');
        await generateRTF();
    }
}

async function generateRTF() {
    // Create RTF as fallback (can be opened by Word)
    const rtfPath = path.join(__dirname, '..', 'docs', 'PILATES_TEST_REPORT.rtf');
    
    // Read HTML and convert basic elements to RTF
    let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    // Simple RTF header
    let rtf = '{\\rtf1\\ansi\\deff0\n';
    rtf += '{\\fonttbl{\\f0 Arial;}}\n';
    rtf += '\\f0\\fs24\n';
    
    // Strip HTML tags and keep text (basic conversion)
    let text = htmlContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<h1[^>]*>/gi, '\\par\\b\\fs36 ')
        .replace(/<\/h1>/gi, '\\b0\\fs24\\par\\par ')
        .replace(/<h2[^>]*>/gi, '\\par\\b\\fs28 ')
        .replace(/<\/h2>/gi, '\\b0\\fs24\\par\\par ')
        .replace(/<h3[^>]*>/gi, '\\par\\b\\fs24 ')
        .replace(/<\/h3>/gi, '\\b0\\par ')
        .replace(/<p[^>]*>/gi, '\\par ')
        .replace(/<\/p>/gi, '\\par ')
        .replace(/<br\s*\/?>/gi, '\\line ')
        .replace(/<li[^>]*>/gi, '\\par • ')
        .replace(/<\/li>/gi, '')
        .replace(/<strong>/gi, '\\b ')
        .replace(/<\/strong>/gi, '\\b0 ')
        .replace(/<em>/gi, '\\i ')
        .replace(/<\/em>/gi, '\\i0 ')
        .replace(/<td[^>]*>/gi, ' | ')
        .replace(/<\/td>/gi, '')
        .replace(/<tr[^>]*>/gi, '\\par ')
        .replace(/<\/tr>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/✅/g, '[OK]')
        .replace(/❌/g, '[X]')
        .replace(/\n\s*\n/g, '\\par\\par ')
        .trim();
    
    rtf += text;
    rtf += '\n}';
    
    fs.writeFileSync(rtfPath, rtf);
    console.log(`✅ RTF created (can be opened by Word): ${rtfPath}`);
}

async function main() {
    console.log('🚀 Starting report generation...\n');
    
    if (!fs.existsSync(htmlPath)) {
        console.error('❌ HTML file not found:', htmlPath);
        process.exit(1);
    }
    
    try {
        await generatePDF();
    } catch (error) {
        console.error('❌ PDF generation failed:', error.message);
    }
    
    try {
        await generateDOCX();
    } catch (error) {
        console.error('❌ DOCX generation failed:', error.message);
        console.log('Creating RTF alternative...');
        await generateRTF();
    }
    
    console.log('\n🎉 Report generation complete!');
    console.log('\nFiles created in docs/ folder:');
    console.log('  - PILATES_TEST_REPORT.pdf');
    console.log('  - PILATES_TEST_REPORT.docx (or .rtf)');
}

main().catch(console.error);
