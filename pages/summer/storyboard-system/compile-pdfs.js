const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const SYSTEM_DIR = __dirname;
const PDFS_DIR = path.join(SYSTEM_DIR, 'pdfs');
const OUTPUT_PDF = path.join(SYSTEM_DIR, 'full_storyboard.pdf');

async function compilePDFs() {
  console.log('Compiling storyboard PDFs...');

  if (!fs.existsSync(PDFS_DIR)) {
    console.log(`The directory "${PDFS_DIR}" does not exist.`);
    console.log('Please create it and place your downloaded PDFs inside.');
    return;
  }

  const files = fs.readdirSync(PDFS_DIR)
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .sort((a, b) => {
      // Basic alphabetical sort. E.g., s14-part1.pdf, s14-part2.pdf
      // Adjust if you have a specific naming convention that needs numeric sorting
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

  if (files.length === 0) {
    console.log(`No PDFs found in ${PDFS_DIR}.`);
    console.log(`Please drop your Google Slides PDF downloads into ${PDFS_DIR}.`);
    fs.writeFileSync(path.join(SYSTEM_DIR, 'pdfs-data.json'), JSON.stringify([], null, 2));
    return;
  }

  console.log(`Found ${files.length} PDFs to merge:`, files);

  // Create a new PDFDocument
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const filePath = path.join(PDFS_DIR, file);
    try {
      const pdfBytes = fs.readFileSync(filePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
      console.log(`✓ Merged ${file}`);
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  // Save the merged PDF
  const mergedPdfBytes = await mergedPdf.save();
  fs.writeFileSync(OUTPUT_PDF, mergedPdfBytes);
  
  console.log(`\n✓ Successfully merged ${files.length} PDFs into ${OUTPUT_PDF}`);

  // Save out a simple JSON of the available PDFs so the frontend index.html can link to them
  const pdfManifestPath = path.join(SYSTEM_DIR, 'pdfs-data.json');
  fs.writeFileSync(pdfManifestPath, JSON.stringify(files, null, 2));
  console.log(`✓ Generated pdfs-data.json for frontend linking`);

  console.log(`\nTo update the PDF later, just replace or add PDFs in the "pdfs" folder and run this script again!`);
}

compilePDFs().catch(console.error);
