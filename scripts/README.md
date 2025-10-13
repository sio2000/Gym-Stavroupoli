# Scripts για Google Play Store

Αυτός ο φάκελος περιέχει scripts που θα σας βοηθήσουν να ανεβάσετε την εφαρμογή GetFit στο Google Play Store.

## Scripts Διαθέσιμα

### 🚀 `setup-playstore.bat`
**Κύριο script** - Εκτελεί όλα τα βήματα αυτόματα
- Δημιουργεί keystore
- Ρυθμίζει signing config
- Προετοιμάζει assets
- Κάνει build για Play Store

### 🔑 `create-release-keystore.bat`
Δημιουργεί το release keystore για υπογραφή της εφαρμογής
- Δημιουργεί `getfit-release-key.keystore`
- Δημιουργεί `key.properties`
- ⚠️ **ΣΗΜΑΝΤΙΚΟ:** Αλλάξτε τα passwords!

### ⚙️ `setup-signing-config.bat`
Ρυθμίζει το signing configuration στο `build.gradle`
- Προσθέτει signing configs
- Ενεργοποιεί minification για release

### 📝 `setup-gradle-properties.bat`
Ρυθμίζει τις ιδιότητες στο `gradle.properties`
- Προσθέτει signing properties
- ⚠️ **ΣΗΜΑΝΤΙΚΟ:** Αλλάξτε τα passwords!

### 🏗️ `build-for-playstore.bat`
Κάνει build την εφαρμογή για Play Store
- Build web assets
- Sync με Capacitor
- Δημιουργεί Android App Bundle (AAB)

### 📱 `prepare-playstore-assets.bat`
Προετοιμάζει τη δομή φακέλων για τα assets
- Δημιουργεί φακέλους για icons, screenshots, graphics
- Εμφανίζει οδηγίες για τα απαιτούμενα assets

### 📈 `update-version.bat`
Ενημερώνει την έκδοση της εφαρμογής
- Ενημερώνει `package.json`
- Ενημερώνει `build.gradle`
- Ζητάει νέο version name και code

## Πώς να Χρησιμοποιήσετε

### Για Πρώτη Φορά
1. Τρέξτε `setup-playstore.bat`
2. Ακολουθήστε τις οδηγίες
3. Αλλάξτε τα passwords στα αρχεία που δημιουργήθηκαν
4. Προετοιμάστε τα assets
5. Τρέξτε `build-for-playstore.bat`

### Για Updates
1. Τρέξτε `update-version.bat` για νέα έκδοση
2. Τρέξτε `build-for-playstore.bat` για νέο AAB
3. Ανέβασε το νέο AAB στο Play Console

## Αρχεία που Δημιουργούνται

### Keystore & Signing
- `android/getfit-release-key.keystore` - Release keystore
- `android/key.properties` - Keystore properties
- `android/gradle.properties.backup` - Backup αρχείου

### Build Outputs
- `android/app/build/outputs/bundle/release/app-release.aab` - AAB για Play Store

### Assets Structure
```
playstore-assets/
├── icons/
│   └── app-icon-512.png (απαιτούμενο)
├── graphics/
│   └── feature-graphic-1024x500.png (απαιτούμενο)
└── screenshots/
    ├── phone/ (2-8 εικόνες)
    ├── tablet-7/ (προαιρετικό)
    └── tablet-10/ (προαιρετικό)
```

## Ασφάλεια

### ⚠️ ΜΗΝ ΚΑΝΕΤΕ COMMIT:
- `*.keystore` αρχεία
- `key.properties`
- `gradle.properties` (αν περιέχει passwords)

### 🔒 Κρατήστε Ασφαλή:
- Keystore file
- Passwords
- Backup copies

## Troubleshooting

### Συχνά Προβλήματα

**"Keystore not found"**
- Εκτελέστε πρώτα `create-release-keystore.bat`

**"Build failed"**
- Ελέγξτε ότι τα passwords είναι σωστά
- Ελέγξτε ότι το Java JDK είναι εγκατεστημένο

**"AAB too large"**
- Ενεργοποιήστε "app bundle explorer" στο Play Console
- Χρησιμοποιήστε dynamic delivery

**"Signing failed"**
- Ελέγξτε το `key.properties`
- Ελέγξτε το `gradle.properties`
- Βεβαιωθείτε ότι τα passwords είναι σωστά

## Χρήσιμες Εντολές

### Manual Build (αν τα scripts αποτύχουν)
```bash
npm run build:mobile
npm run cap:sync:android
cd android
./gradlew clean
./gradlew bundleRelease
```

### Ελέγχος Έκδοσης
```bash
# Package.json
type package.json | findstr version

# Android
type android\app\build.gradle | findstr version
```

### Clean Build
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

---

**Σημείωση:** Όλα τα scripts είναι σχεδιασμένα για Windows. Για Linux/Mac, χρησιμοποιήστε τα αντίστοιχα shell scripts.
