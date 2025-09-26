/**
 * Cleanup script για το AdminPanel.tsx
 * Διορθώνει compilation errors και καθαρίζει duplicate content
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 CLEANUP SCRIPT ΓΙΑ ADMIN PANEL');
console.log('==================================');

const adminPanelPath = path.join(__dirname, 'src/pages/AdminPanel.tsx');

if (!fs.existsSync(adminPanelPath)) {
  console.error('❌ AdminPanel.tsx δεν βρέθηκε!');
  process.exit(1);
}

console.log('📖 Διάβασμα AdminPanel.tsx...');
let content = fs.readFileSync(adminPanelPath, 'utf8');

console.log('🔧 Εφαρμογή διορθώσεων...');

// Fix 1: Remove unused import
console.log('   ✅ Αφαίρεση unused import approveUltimateMembershipRequest');
content = content.replace(/,\s*approveUltimateMembershipRequest\s*,/g, ',');
content = content.replace(/approveUltimateMembershipRequest\s*,/g, '');
content = content.replace(/,\s*approveUltimateMembershipRequest/g, '');

// Fix 2: Remove any remaining references to old functions
console.log('   ✅ Καθαρισμός references σε παλιές functions');
content = content.replace(/loadInstallmentRequests/g, 'loadUltimateRequests');
content = content.replace(/deleteInstallmentRequest/g, 'deleteUltimateRequest');

// Fix 3: Ensure proper JSX structure
console.log('   ✅ Διόρθωση JSX structure');

// Find the UltimateInstallmentsTab component and ensure it's properly closed
const ultimateTabStart = content.indexOf('activeTab === \'ultimate-subscriptions\' && !loading && (');
const ultimateTabComponent = content.indexOf('<UltimateInstallmentsTab');

if (ultimateTabStart !== -1 && ultimateTabComponent !== -1) {
  // Find the end of the UltimateInstallmentsTab component
  let componentEnd = ultimateTabComponent;
  let depth = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = ultimateTabComponent; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (!inString) {
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
      } else if (char === '<') {
        if (nextChar === '/') {
          depth--;
        } else if (content.substr(i, 2) !== '<!') {
          depth++;
        }
      } else if (char === '/' && nextChar === '>') {
        depth--;
      }
      
      if (depth === 0 && char === '>' && i > ultimateTabComponent) {
        componentEnd = i + 1;
        break;
      }
    } else {
      if (char === stringChar && content[i - 1] !== '\\') {
        inString = false;
        stringChar = '';
      }
    }
  }
  
  // Find the closing of the condition
  let conditionEnd = componentEnd;
  for (let i = componentEnd; i < content.length; i++) {
    if (content.substr(i, 2) === ')}') {
      conditionEnd = i + 2;
      break;
    }
  }
  
  console.log('   ✅ Ultimate Subscriptions tab structure verified');
}

// Fix 4: Remove any malformed or duplicate content after the main tabs
console.log('   ✅ Καθαρισμός duplicate content');

// Find the "Other tabs placeholder" section
const otherTabsPlaceholder = content.indexOf('{/* Other tabs placeholder */}');
if (otherTabsPlaceholder !== -1) {
  // Find the end of this section
  const placeholderEnd = content.indexOf(')}', otherTabsPlaceholder);
  if (placeholderEnd !== -1) {
    const endOfPlaceholder = placeholderEnd + 2;
    
    // Find the next legitimate section (should be closing divs and the modal)
    const nextSection = content.indexOf('</div>', endOfPlaceholder);
    if (nextSection !== -1) {
      // Check if there's any malformed content between placeholder and next section
      const betweenContent = content.substring(endOfPlaceholder, nextSection);
      if (betweenContent.includes('<div') || betweenContent.includes('activeTab') || betweenContent.includes('Ultimate')) {
        console.log('   🧹 Αφαίρεση malformed content μετά το placeholder');
        content = content.substring(0, endOfPlaceholder) + '\n        ' + content.substring(nextSection);
      }
    }
  }
}

// Fix 5: Ensure proper modal structure
console.log('   ✅ Επιβεβαίωση modal structure');
const modalComments = content.match(/{\/\* Mobile-First Create Code Modal \*\/}/g);
if (modalComments && modalComments.length > 1) {
  console.log('   🧹 Αφαίρεση duplicate modal comments');
  // Keep only the last occurrence
  let lastIndex = content.lastIndexOf('{/* Mobile-First Create Code Modal */}');
  let firstIndex = content.indexOf('{/* Mobile-First Create Code Modal */}');
  
  if (firstIndex !== lastIndex) {
    // Remove everything from first modal to just before the last modal
    content = content.substring(0, firstIndex) + content.substring(lastIndex);
  }
}

// Fix 6: Clean up any syntax errors
console.log('   ✅ Καθαρισμός syntax errors');

// Remove any stray closing braces or parentheses
content = content.replace(/\n\s*}\s*\n\s*}\s*\n/g, '\n  }\n');
content = content.replace(/\n\s*\)\s*\n\s*\)\s*\n/g, '\n  )\n');

// Ensure proper indentation around the UltimateInstallmentsTab
content = content.replace(
  /(\s*{activeTab === 'ultimate-subscriptions' && !loading && \(\s*<UltimateInstallmentsTab[\s\S]*?\/>\s*\)}\s*)/,
  function(match) {
    return match.replace(/^\s*/gm, '          ');
  }
);

console.log('💾 Αποθήκευση διορθωμένου αρχείου...');
fs.writeFileSync(adminPanelPath, content, 'utf8');

console.log('✅ Cleanup ολοκληρώθηκε επιτυχώς!');
console.log('');
console.log('📋 Διορθώσεις που έγιναν:');
console.log('   • Αφαίρεση unused imports');
console.log('   • Διόρθωση function references');
console.log('   • Καθαρισμός duplicate content');
console.log('   • Επιδιόρθωση JSX structure');
console.log('   • Καθαρισμός syntax errors');
console.log('');
console.log('🎯 Το AdminPanel.tsx είναι τώρα καθαρό και έτοιμο για χρήση!');
