import fs from 'fs';
import path from 'path';

const PROJECT_FILE = path.resolve('ios/App/App.xcodeproj/project.pbxproj');

interface VersionInfo {
  marketingVersion: string;
  currentProjectVersion: string;
}

function getCurrentVersions(): VersionInfo {
  const content = fs.readFileSync(PROJECT_FILE, 'utf-8');
  
  const marketingMatch = content.match(/MARKETING_VERSION = ([^;]+);/);
  const currentMatch = content.match(/CURRENT_PROJECT_VERSION = ([^;]+);/);
  
  return {
    marketingVersion: marketingMatch ? marketingMatch[1].trim() : 'Unknown',
    currentProjectVersion: currentMatch ? currentMatch[1].trim() : 'Unknown'
  };
}

function updateBuildVersion(newVersion: string): void {
  const content = fs.readFileSync(PROJECT_FILE, 'utf-8');
  const updatedContent = content.replace(
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${newVersion};`
  );
  
  fs.writeFileSync(PROJECT_FILE, updatedContent);
  console.log(`✅ Build version ενημερώθηκε σε: ${newVersion}`);
}

function updateMarketingVersion(newVersion: string): void {
  const content = fs.readFileSync(PROJECT_FILE, 'utf-8');
  const updatedContent = content.replace(
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${newVersion};`
  );
  
  fs.writeFileSync(PROJECT_FILE, updatedContent);
  console.log(`✅ Marketing version ενημερώθηκε σε: ${newVersion}`);
}

function bumpBuildVersion(): void {
  const versions = getCurrentVersions();
  const currentBuild = parseInt(versions.currentProjectVersion);
  const newBuild = currentBuild + 1;
  
  updateBuildVersion(newBuild.toString());
  console.log(`📈 Build version αυξήθηκε από ${currentBuild} σε ${newBuild}`);
}

function bumpMarketingVersion(): void {
  const versions = getCurrentVersions();
  const currentMarketing = versions.marketingVersion;
  
  // Απλή λογική για patch version bump (1.0 -> 1.1, 1.1 -> 1.2, κλπ)
  const parts = currentMarketing.split('.');
  if (parts.length >= 2) {
    const minor = parseInt(parts[1]) + 1;
    const newMarketing = `${parts[0]}.${minor}`;
    updateMarketingVersion(newMarketing);
    console.log(`📈 Marketing version αυξήθηκε από ${currentMarketing} σε ${newMarketing}`);
  } else {
    console.log('❌ Δεν μπόρεσα να αναλύσω την τρέχουσα marketing version');
  }
}

function showVersions(): void {
  const versions = getCurrentVersions();
  console.log('\n📱 Τρέχουσες εκδόσεις εφαρμογής:');
  console.log(`   Marketing Version (User-facing): ${versions.marketingVersion}`);
  console.log(`   Build Version (App Store): ${versions.currentProjectVersion}`);
  console.log('');
}

function showHelp(): void {
  console.log('\n🛠️  Version Manager - Διαχείριση εκδόσεων εφαρμογής\n');
  console.log('Χρήση:');
  console.log('  npm run version:show     - Εμφάνιση τρέχουσων εκδόσεων');
  console.log('  npm run version:bump     - Αύξηση build version (για νέο App Store build)');
  console.log('  npm run version:patch    - Αύξηση marketing version (για νέο release)');
  console.log('');
  console.log('Σημειώσεις:');
  console.log('  - Marketing Version: Η έκδοση που βλέπουν οι χρήστες (π.χ. 1.0, 1.1)');
  console.log('  - Build Version: Η έκδοση που χρησιμοποιεί το App Store (π.χ. 1, 2, 3)');
  console.log('  - Χρειάζεσαι νέο build version για κάθε upload στο App Store Connect');
  console.log('  - Χρειάζεσαι νέο marketing version για κάθε νέο release που δημοσιεύεις');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'show':
      showVersions();
      break;
      
    case 'bump':
      console.log('🚀 Αύξηση build version...');
      bumpBuildVersion();
      showVersions();
      break;
      
    case 'patch':
      console.log('🚀 Αύξηση marketing version...');
      bumpMarketingVersion();
      showVersions();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.log('❌ Άγνωστη εντολή. Χρησιμοποίησε "help" για οδηγίες.');
      showHelp();
      break;
  }
}

main().catch(console.error);
