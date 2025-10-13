# Οδηγός Διόρθωσης Προβλημάτων App Store Connect

## Προβλήματα που πρέπει να διορθωθούν:

### 1. ✅ Screenshot για 13-inch iPad
**Λύση:** Έχω ενημερώσει το `scripts/resizeAppStoreScreenshots.ts` για να περιλαμβάνει τις διαστάσεις iPad:
- 2048x2732 (portrait)
- 2732x2048 (landscape)

**✅ ΟΛΟΚΛΗΡΩΜΕΝΟ:** Τα screenshots έχουν δημιουργηθεί!
**Βήματα για App Store Connect:**
1. Πήγαινε στο App Store Connect → App → App Store → Screenshots
2. Ανέβασε τα screenshots από τον φάκελο `assets/appstore_screenshots/output/2048x2732/` (portrait)
3. Ανέβασε τα screenshots από τον φάκελο `assets/appstore_screenshots/output/2732x2048/` (landscape)

### 2. Content Rights Information
**Στο App Store Connect:**
1. Πήγαινε σε **App Information**
2. Στο **Content Rights Information**:
   - **Export Compliance**: Επίλεξε "No" αν το app δεν περιέχει κρυπτογράφηση
   - **Uses Encryption**: Επίλεξε "No" αν δεν χρησιμοποιείς κρυπτογράφηση

### 3. Export Compliance Information
**Στο App Store Connect:**
1. Πήγαινε σε **App Review Information**
2. Στο **Export Compliance**:
   - Επίλεξε "No" αν το app δεν περιέχει κρυπτογράφηση
   - Επίλεξε "Yes" μόνο αν χρησιμοποιείς κρυπτογράφηση (HTTPS, login κλπ)

### 4. Contact Information
**Στο App Store Connect:**
1. Πήγαινε σε **App Information**
2. Συμπλήρωσε:
   - **Contact Information**:
     - First Name: Θεοχάρης
     - Last Name: Σιόζος
     - Email: [το email σου]
     - Phone: [το τηλέφωνο σου]
   - **Review Information**:
     - First Name: Θεοχάρης
     - Last Name: Σιόζος
     - Email: [το email σου]
     - Phone: [το τηλέφωνο σου]

### 5. Primary Category
**Στο App Store Connect:**
1. Πήγαινε σε **App Information**
2. Στο **General Information**:
   - **Primary Category**: Επίλεξε "Health & Fitness" (κατάλληλο για fitness app)
   - **Secondary Category**: Προαιρετικά "Sports"

## Τρέχοντα App Settings:
- **Bundle ID**: com.siozostheoharis.getfit
- **Version**: 1.0
- **Build**: 2
- **Display Name**: GetFit

## Επόμενα Βήματα:
1. Δημιούργησε screenshots για iPad
2. Συμπλήρωσε όλες τις πληροφορίες στο App Store Connect
3. Κάνε "Add for Review" ξανά

## Σημειώσεις:
- Αν το app σου χρησιμοποιεί HTTPS ή οποιαδήποτε κρυπτογράφηση, πρέπει να επιλέξεις "Yes" στο Export Compliance
- Βεβαιώσου ότι όλα τα screenshots είναι σε υψηλή ποιότητα και δείχνουν τη λειτουργικότητα του app
- Τα Contact Information πρέπει να είναι τα πραγματικά σου στοιχεία για επικοινωνία με την Apple
