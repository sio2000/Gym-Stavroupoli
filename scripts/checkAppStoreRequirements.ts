import path from 'path';
import fs from 'fs';

const OUTPUT_BASE = path.resolve('assets/appstore_screenshots/output');

// Απαραίτητες διαστάσεις για App Store
const REQUIRED_SIZES = [
  // iPhone screenshots
  { width: 1284, height: 2778, name: '1284x2778', device: 'iPhone 14 Pro' },
  { width: 2778, height: 1284, name: '2778x1284', device: 'iPhone 14 Pro landscape' },
  { width: 1242, height: 2688, name: '1242x2688', device: 'iPhone 11 Pro Max' },
  { width: 2688, height: 1242, name: '2688x1242', device: 'iPhone 11 Pro Max landscape' },
  // iPad screenshots (13-inch iPad Pro) - ΑΠΑΡΑΙΤΗΤΑ
  { width: 2048, height: 2732, name: '2048x2732', device: '13-inch iPad Pro portrait', required: true },
  { width: 2732, height: 2048, name: '2732x2048', device: '13-inch iPad Pro landscape', required: true },
];

function checkScreenshots() {
  console.log('🔍 Έλεγχος απαραίτητων screenshots για App Store...\n');
  
  let allGood = true;
  
  for (const size of REQUIRED_SIZES) {
    const dirPath = path.join(OUTPUT_BASE, size.name);
    const status = fs.existsSync(dirPath) ? '✅' : '❌';
    const required = size.required ? ' (ΑΠΑΡΑΙΤΗΤΟ)' : '';
    
    console.log(`${status} ${size.device} (${size.name})${required}`);
    
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.jpg'));
      console.log(`   📁 Βρέθηκαν ${files.length} screenshots`);
      
      if (size.required && files.length === 0) {
        console.log(`   ⚠️  ΧΡΕΙΑΖΕΣΑΙ τουλάχιστον 1 screenshot για ${size.device}`);
        allGood = false;
      }
    } else {
      console.log(`   📁 Φάκελος δεν υπάρχει`);
      if (size.required) {
        allGood = false;
      }
    }
    console.log('');
  }
  
  if (allGood) {
    console.log('🎉 Όλα τα απαραίτητα screenshots είναι διαθέσιμα!');
    console.log('✅ Μπορείς να προχωρήσεις με την υποβολή στο App Store Connect.');
  } else {
    console.log('⚠️  Χρειάζονται επιπλέον screenshots για την υποβολή.');
    console.log('💡 Τρέξε: npm run screenshots:resize');
  }
  
  return allGood;
}

function checkExportCompliance() {
  console.log('\n🔍 Έλεγχος export compliance...');
  
  const infoPlistPath = path.resolve('ios/App/App/Info.plist');
  
  if (!fs.existsSync(infoPlistPath)) {
    console.log('❌ Info.plist δεν βρέθηκε');
    return false;
  }
  
  const content = fs.readFileSync(infoPlistPath, 'utf-8');
  
  if (content.includes('ITSAppUsesNonExemptEncryption')) {
    console.log('✅ Export compliance information βρέθηκε στο Info.plist');
    return true;
  } else {
    console.log('❌ Export compliance information λείπει από το Info.plist');
    return false;
  }
}

async function main() {
  console.log('🚀 Έλεγχος App Store Requirements\n');
  
  const screenshotsOk = checkScreenshots();
  const complianceOk = checkExportCompliance();
  
  console.log('\n📋 Σύνοψη:');
  console.log(`Screenshots: ${screenshotsOk ? '✅' : '❌'}`);
  console.log(`Export Compliance: ${complianceOk ? '✅' : '❌'}`);
  
  if (screenshotsOk && complianceOk) {
    console.log('\n🎉 Η εφαρμογή σου είναι έτοιμη για υποβολή στο App Store!');
    console.log('\n📝 Επόμενα βήματα:');
    console.log('1. Upload τα screenshots στο App Store Connect');
    console.log('2. Απάντησε στις ερωτήσεις export compliance στο App Store Connect');
    console.log('3. Υποβάλε την εφαρμογή για review');
  } else {
    console.log('\n⚠️  Χρειάζονται επιπλέον ενέργειες πριν την υποβολή.');
  }
}

main().catch(console.error);
