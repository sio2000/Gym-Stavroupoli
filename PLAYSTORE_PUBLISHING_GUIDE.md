# Οδηγός Δημοσίευσης στο Google Play Store

## Επισκόπηση
Αυτός είναι ένας ολοκληρωμένος οδηγός για να ανεβάσετε την εφαρμογή GetFit στο Google Play Store.

## Προαπαιτούμενα
- Google Play Console Developer Account ($25 εφάπαξ)
- Android Studio εγκατεστημένο
- Java Development Kit (JDK) 17

## Βήμα 1: Διόρθωση Application ID

Το Android project έχει διαφορετικό Application ID από το Capacitor config. Πρέπει να τα συγχρονίσουμε.

**Τρέχον Application ID στο build.gradle:** `com.freegym.app`
**Application ID στο capacitor.config.ts:** `com.siozostheoharis.getfit`

Θα χρησιμοποιήσουμε το `com.siozostheoharis.getfit` που είναι πιο μοναδικό.

## Βήμα 2: Δημιουργία Release Keystore

### 2.1 Δημιουργία Keystore
```bash
keytool -genkey -v -keystore getfit-release-key.keystore -alias getfit -keyalg RSA -keysize 2048 -validity 10000
```

### 2.2 Αποθήκευση κλειδιών
Δημιουργήστε το αρχείο `android/key.properties`:
```
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=getfit
storeFile=getfit-release-key.keystore
```

**⚠️ ΣΗΜΑΝΤΙΚΟ:** Μην κάνετε commit αυτά τα αρχεία! Προσθέστε τα στο .gitignore.

## Βήμα 3: Ρύθμιση Release Build

### 3.1 Ενημέρωση build.gradle
Προσθήκη signing config στο android/app/build.gradle:

```gradle
android {
    // ... existing code ...
    
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    
    buildTypes {
        release {
            // ... existing code ...
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3.2 Ενημέρωση gradle.properties
Προσθήκη στο android/gradle.properties:
```
MYAPP_RELEASE_STORE_FILE=getfit-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=getfit
MYAPP_RELEASE_STORE_PASSWORD=your_store_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

## Βήμα 4: Build Android App Bundle (AAB)

### 4.1 Build για Release
```bash
npm run build:mobile
npm run cap:sync:android
cd android
./gradlew bundleRelease
```

### 4.2 Τοποθεσία AAB
Το AAB θα βρίσκεται στο: `android/app/build/outputs/bundle/release/app-release.aab`

## Βήμα 5: Προετοιμασία Assets για Play Store

### 5.1 App Icon
- **Απαιτούμενο:** 512x512 PNG (χωρίς transparency)
- **Τοποθεσία:** assets/playstore-icon.png

### 5.2 Feature Graphic
- **Απαιτούμενο:** 1024x500 PNG
- **Χρήση:** Κεφαλίδα στο Play Store

### 5.3 Screenshots
**Απαιτούμενα:**
- 2-8 screenshots per device type
- **Phone:** 16:9 ή 9:16 aspect ratio, min 320px height
- **Tablet (7"):** 16:10 ή 10:16 aspect ratio, min 320px height
- **Tablet (10"):** 16:10 ή 10:16 aspect ratio, min 320px height

### 5.4 App Description
```
GetFit - Σύστημα Διαχείρισης Γυμναστηρίου

Η GetFit είναι μια σύγχρονη εφαρμογή διαχείρισης γυμναστηρίου που σας βοηθά να οργανώσετε τις προπονήσεις σας, να διαχειρίζεστε τη συνδρομή σας και να παρακολουθείτε την πρόοδό σας.

Χαρακτηριστικά:
• Διαχείριση συμμετοχής σε προπονήσεις
• QR Code σύστημα εισόδου
• Ημερολόγιο προπονήσεων
• Διαχείριση συνδρομών
• Σύστημα απουσιών
• Και πολλά άλλα...

Κατεβάστε τώρα και αρχίστε την πορεία σας προς μια υγιέστερη ζωή!
```

## Βήμα 6: Google Play Console Setup

### 6.1 Δημιουργία Εφαρμογής
1. Συνδεθείτε στο [Google Play Console](https://play.google.com/console)
2. Κάντε κλικ "Δημιουργία εφαρμογής"
3. Επιλέξτε "Εφαρμογή" ή "Παιχνίδι"
4. Συμπληρώστε:
   - **Όνομα εφαρμογής:** GetFit
   - **Γλώσσα προεπιλογής:** Ελληνικά
   - **Εφαρμογή ή παιχνίδι:** Εφαρμογή
   - **Δωρεάν ή πληρωμένη:** Δωρεάν

### 6.2 App Details
**Βασικές πληροφορίες:**
- **Όνομα εφαρμογής:** GetFit
- **Σύντομη περιγραφή:** Σύστημα Διαχείρισης Γυμναστηρίου
- **Πλήρης περιγραφή:** (χρησιμοποιήστε το από το Βήμα 5.4)

**Εικόνες:**
- App icon: 512x512
- Feature graphic: 1024x500
- Screenshots: 2-8 per device type

### 6.3 Content Rating
Απαντήστε τις ερωτήσεις για το content rating (πιθανότατα "Everyone").

### 6.4 App Access
- **App access:** Public
- **Ads:** No (αν δεν έχετε διαφημίσεις)

### 6.5 Target Audience
- **Age range:** 13+
- **Primary audience:** Adults

### 6.6 Data Safety
Συμπληρώστε τις πληροφορίες για τα δεδομένα που συλλέγει η εφαρμογή:
- **Personal info:** Email address, name (για λογαριασμό)
- **App activity:** App interactions (για λειτουργικότητα)
- **Device or other IDs:** Device ID (για analytics)

## Βήμα 7: Upload AAB

### 7.1 Production Track
1. Στο Play Console, πηγαίνετε στο "Production"
2. Κάντε κλικ "Δημιουργία νέας έκδοσης"
3. Upload το `app-release.aab`
4. Συμπληρώστε "Release notes"

### 7.2 Review Process
- **Χρόνος αναμονής:** 1-3 ημέρες (συνήθως)
- **Status updates:** Θα λαμβάνετε email notifications

## Βήμα 8: Επιπλέον Ρυθμίσεις

### 8.1 App Signing
Το Play Console θα χειριστεί το app signing για εσάς (συνιστάται).

### 8.2 Testing
- **Internal testing:** Για να δοκιμάσετε πριν την δημοσίευση
- **Closed testing:** Για beta testers
- **Open testing:** Για public beta

## Βήμα 9: Pricing & Distribution

### 9.1 Pricing
- **Free app:** Επιλέξτε "Free"
- **Paid app:** Ορίστε τιμή

### 9.2 Countries/Regions
Επιλέξτε τις χώρες όπου θέλετε να είναι διαθέσιμη η εφαρμογή.

## Βήμα 10: Publish

1. Βεβαιωθείτε ότι όλα τα τμήματα είναι συμπληρωμένα (πράσινο)
2. Κάντε κλικ "Send for review"
3. Περιμένετε την έγκριση από την Google

## Troubleshooting

### Συχνά Προβλήματα

**1. Upload Error - AAB too large**
- Επιλέξτε το "Enable app bundle explorer" στο Play Console
- Χρησιμοποιήστε "Dynamic delivery"

**2. App not compatible**
- Ελέγξτε το `minSdkVersion` στο build.gradle
- Βεβαιωθείτε ότι είναι συμβατό με τους στόχους σας

**3. Signing Issues**
- Βεβαιωθείτε ότι το keystore είναι σωστά ρυθμισμένο
- Ελέγξτε ότι τα passwords είναι σωστά

**4. Content Policy Violations**
- Διαβάστε προσεκτικά τις [Content Policies](https://support.google.com/googleplay/android-developer/answer/9859348)
- Βεβαιωθείτε ότι η εφαρμογή δεν παραβιάζει κανέναν κανόνα

## Επόμενα Βήματα

Μετά την επιτυχή δημοσίευση:

1. **Analytics Setup:** Προσθέστε Google Analytics
2. **Crash Reporting:** Χρησιμοποιήστε Firebase Crashlytics
3. **Updates:** Ενημερώστε την εφαρμογή τακτικά
4. **Reviews:** Παρακολουθήστε και απαντήστε σε reviews

## Χρήσιμα Links

- [Google Play Console](https://play.google.com/console)
- [App Bundle Format](https://developer.android.com/guide/app-bundle)
- [Play Store Listing Guidelines](https://support.google.com/googleplay/android-developer/answer/9859348)
- [Content Policy](https://support.google.com/googleplay/android-developer/answer/9859348)

---

**Σημείωση:** Αυτός ο οδηγός είναι συγκεκριμένος για την εφαρμογή GetFit. Κάποιες ρυθμίσεις μπορεί να χρειαστούν προσαρμογή ανάλογα με τις ανάγκες σας.
