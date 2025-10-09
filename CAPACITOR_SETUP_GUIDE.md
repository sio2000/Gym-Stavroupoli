# 📱 Οδηγός Ρύθμισης Capacitor για FreeGym Mobile App

## ✅ Τι Έχει Γίνει

### 1. Εγκατάσταση Capacitor
- ✅ Εγκατάσταση όλων των απαραίτητων Capacitor packages
- ✅ Αρχικοποίηση Capacitor project
- ✅ Προσθήκη Android platform
- ✅ Προσθήκη iOS platform

### 2. Διαμόρφωση
- ✅ `capacitor.config.ts` - Πλήρης ρύθμιση για WebView
- ✅ `vite.config.ts` - Ενημέρωση για mobile builds
- ✅ `src/capacitor-app.ts` - Helper functions για Capacitor
- ✅ `src/main.tsx` - Αρχικοποίηση Capacitor
- ✅ `AndroidManifest.xml` - Permissions και ρυθμίσεις
- ✅ `Info.plist` - iOS permissions και ρυθμίσεις
- ✅ `package.json` - Scripts για mobile development

### 3. Δομή Project
```
getfitskg/
├── android/              # Android native project (έτοιμο)
├── ios/                  # iOS native project (έτοιμο)
├── dist/                 # Built web app
├── src/
│   ├── capacitor-app.ts  # Capacitor initialization
│   └── main.tsx          # Updated with Capacitor init
├── capacitor.config.ts   # Capacitor configuration
└── package.json          # Updated with mobile scripts
```

---

## 🚀 Quick Start Commands

### Για Android Development:
```bash
# Άνοιγμα Android Studio
npm run cap:open:android

# Ή με μία εντολή (build + sync + open):
npm run android:build
```

### Για iOS Development (μόνο σε Mac):
```bash
# Άνοιγμα Xcode
npm run cap:open:ios

# Ή με μία εντολή (build + sync + open):
npm run ios:build
```

---

## 📋 Αναλυτικές Οδηγίες Build & Deploy

### A. Android Build

#### 1. Προετοιμασία Development Build
```bash
# Βήμα 1: Build την web εφαρμογή (χωρίς TypeScript check)
npm run build:mobile

# Βήμα 2: Sync τα files στο Android project
npm run cap:sync:android

# Βήμα 3: Άνοιγμα Android Studio
npm run cap:open:android
```

#### 2. Στο Android Studio:

**A. Development Testing:**
1. Σύνδεσε Android συσκευή με USB debugging ή ξεκίνα emulator
2. Πάτα το πράσινο κουμπί "Run" (▶)
3. Επίλεξε τη συσκευή σου
4. Η εφαρμογή θα εγκατασταθεί και θα τρέξει

**B. Production Build (APK):**
1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Περίμενε να ολοκληρωθεί το build
3. Κάνε κλικ στο "locate" για να βρεις το APK
4. Βρίσκεται στο: `android/app/build/outputs/apk/debug/app-debug.apk`

**C. Production Build (AAB για Play Store):**
1. **Build → Generate Signed Bundle / APK**
2. Επίλεξε "Android App Bundle"
3. Δημιούργησε ή επίλεξε keystore:
   ```
   Key store path: C:/Users/theoharis/freegym-keystore.jks
   Key store password: [CHOOSE STRONG PASSWORD]
   Key alias: freegym-key
   Key password: [CHOOSE STRONG PASSWORD]
   ```
   **⚠️ ΣΗΜΑΝΤΙΚΟ: Κράτησε αυτά τα passwords ασφαλή! Χωρίς αυτά δεν μπορείς να κάνεις updates!**

4. Επίλεξε "release" build type
5. Το AAB θα είναι στο: `android/app/build/outputs/bundle/release/app-release.aab`

#### 3. Upload στο Google Play Store:

1. Πήγαινε στο [Google Play Console](https://play.google.com/console)
2. Δημιούργησε νέα εφαρμογή ή επίλεξε την υπάρχουσα
3. **Production → Create new release**
4. Upload το `app-release.aab`
5. Συμπλήρωσε:
   - App name: FreeGym
   - Short description
   - Full description
   - Screenshots (τουλάχιστον 2)
   - Feature graphic (1024x500)
   - App icon (512x512)
6. Συμπλήρωσε τα Privacy Policy, Categories κλπ
7. Submit for review

---

### B. iOS Build (μόνο σε Mac με Xcode)

#### 1. Προετοιμασία Development Build
```bash
# Βήμα 1: Build την web εφαρμογή
npm run build:mobile

# Βήμα 2: Sync τα files στο iOS project
npm run cap:sync:ios

# Βήμα 3: Άνοιγμα Xcode
npm run cap:open:ios
```

#### 2. Στο Xcode:

**A. Initial Setup:**
1. Επίλεξε το "App" target στο project navigator
2. **General tab:**
   - Display Name: FreeGym
   - Bundle Identifier: com.freegym.app (μην το αλλάξεις!)
   - Version: 1.0.0
   - Build: 1
   - Deployment Target: iOS 13.0 ή νεότερο

3. **Signing & Capabilities:**
   - Team: Επίλεξε το Apple Developer team σου
   - Automatically manage signing: ✅ Enabled
   - Provisioning Profile: Xcode Managed Profile

**B. Development Testing:**
1. Σύνδεσε iPhone/iPad ή επίλεξε simulator
2. Επίλεξε τη συσκευή από το dropdown
3. Πάτα το Run button (▶)
4. Η εφαρμογή θα εγκατασταθεί και θα τρέξει

**C. Production Build (για App Store):**
1. **Product → Archive**
2. Περίμενε να ολοκληρωθεί το archive
3. Στο Organizer window που θα ανοίξει:
   - Επίλεξε το πιο πρόσφατο archive
   - Πάτα "Distribute App"
   - Επίλεξε "App Store Connect"
   - Πάτα "Upload"
   - Sign in με το Apple ID σου
   - Περίμενε να ολοκληρωθεί το upload

#### 3. Upload στο Apple App Store:

1. Πήγαινε στο [App Store Connect](https://appstoreconnect.apple.com)
2. **My Apps → + → New App**
3. Συμπλήρωσε:
   - Platform: iOS
   - Name: FreeGym
   - Primary Language: Greek
   - Bundle ID: com.freegym.app
   - SKU: freegym-ios-001

4. **App Information:**
   - Privacy Policy URL
   - Category: Health & Fitness
   - Subtitle
   - Description (στα Ελληνικά)

5. **Version Information:**
   - Version: 1.0.0
   - Copyright: © 2024 FreeGym
   - Screenshots (για όλα τα μεγέθη):
     - iPhone 6.7" (1290 x 2796)
     - iPhone 6.5" (1242 x 2688)
     - iPad Pro (2048 x 2732)

6. **Build:**
   - Επίλεξε το build που έκανες upload από Xcode

7. **Submit for Review**

---

## 🎨 Icons & Splash Screens

### Τι Χρειάζεσαι:

#### Android:
- **App Icon**: 1024x1024 PNG (χωρίς διαφάνεια)
- **Adaptive Icon**: 
  - Foreground: 1024x1024 PNG (με διαφάνεια)
  - Background: 1024x1024 PNG ή χρώμα

#### iOS:
- **App Icon**: 1024x1024 PNG (χωρίς διαφάνεια, γωνίες 90°)

#### Splash Screen:
- 2732x2732 PNG (κεντραρισμένο το λογότυπο)

### Πώς να τα Προσθέσεις:

#### Android:
1. Βάλε τα icons στο: `android/app/src/main/res/`
   - `mipmap-mdpi/ic_launcher.png` (48x48)
   - `mipmap-hdpi/ic_launcher.png` (72x72)
   - `mipmap-xhdpi/ic_launcher.png` (96x96)
   - `mipmap-xxhdpi/ic_launcher.png` (144x144)
   - `mipmap-xxxhdpi/ic_launcher.png` (192x192)

2. Splash screen: `android/app/src/main/res/drawable/splash.png`

#### iOS:
1. Στο Xcode:
   - **Assets.xcassets → AppIcon**
   - Σύρε το 1024x1024 icon

2. Splash screen:
   - **Assets.xcassets → Splash**
   - Σύρε το splash image

#### Εναλλακτικά (Εύκολο):
Χρησιμοποίησε το [@capacitor/assets](https://github.com/ionic-team/capacitor-assets):

```bash
npm install @capacitor/assets --save-dev

# Βάλε τα assets στο resources/
resources/
├── icon.png (1024x1024)
└── splash.png (2732x2732)

# Generate όλα τα sizes αυτόματα
npx capacitor-assets generate
```

---

## 🔄 Workflow Development

### Για Web Development (όπως πριν):
```bash
npm run dev
# Άνοιξε http://localhost:5173
```

### Για Mobile Development με Live Reload:

#### Option 1: Device Testing με Network
```bash
# 1. Βρες το local IP σου (ipconfig στα Windows)
# π.χ. 192.168.1.100

# 2. Άνοιξε capacitor.config.ts και πρόσθεσε:
server: {
  url: 'http://192.168.1.100:5173',
  cleartext: true
}

# 3. Τρέξε
npm run dev

# 4. Σε άλλο terminal:
npm run cap:sync
npm run cap:open:android  # ή ios

# Τώρα η εφαρμογή θα φορτώνει από το dev server
# Κάθε αλλαγή στον κώδικα θα φαίνεται αυτόματα!
```

#### Option 2: Build για κάθε αλλαγή
```bash
# Κάθε φορά που κάνεις αλλαγή:
npm run mobile:prepare
# Και κάνε rebuild από Android Studio/Xcode
```

### Production Workflow:
```bash
# 1. Σβήσε το server.url από capacitor.config.ts
# 2. Build
npm run build:mobile

# 3. Sync
npm run cap:sync

# 4. Open IDE και κάνε release build
npm run cap:open:android  # ή ios
```

---

## 🛠️ Debugging & Troubleshooting

### Android Debugging:

1. **Chrome DevTools:**
   - Σύνδεσε Android συσκευή
   - Άνοιξε Chrome και πήγαινε στο `chrome://inspect`
   - Επίλεξε τη συσκευή σου
   - Κάνε κλικ στο "inspect" για να ανοίξει το DevTools

2. **Logcat στο Android Studio:**
   - View → Tool Windows → Logcat
   - Filter: "Capacitor" ή "Chromium"

3. **Enable WebView Debugging:**
   - Ήδη ενεργοποιημένο στο `capacitor.config.ts`
   - `webContentsDebuggingEnabled: true`

### iOS Debugging (Safari):

1. **Safari Web Inspector:**
   - Σύνδεσε iPhone/iPad
   - Safari → Develop → [Your Device] → [App]
   - Ανοίγει το Web Inspector

2. **Xcode Console:**
   - View → Debug Area → Show Debug Area
   - Βλέπεις logs και console output

### Common Issues:

#### "cleartext HTTP traffic not permitted"
- ✅ Ήδη fixed στο AndroidManifest.xml
- `android:usesCleartextTraffic="true"`

#### "White screen on app open"
- Έλεγξε αν το `dist/` folder έχει files
- Τρέξε `npm run build:mobile && npm run cap:sync`

#### "Plugin not working"
- Αν προσθέσεις νέο plugin, τρέξε:
```bash
npm install [plugin-name]
npx cap sync
```

#### Changes not showing
- Τρέξε πάντα `npm run cap:sync` μετά από build
- Κάνε clean build στο Android Studio/Xcode

---

## 📦 Προτεινόμενα Plugins (Optional)

Αν χρειαστείς επιπλέον λειτουργικότητα:

```bash
# Camera
npm install @capacitor/camera
npx cap sync

# Geolocation
npm install @capacitor/geolocation
npx cap sync

# Push Notifications
npm install @capacitor/push-notifications
npx cap sync

# Storage
npm install @capacitor/preferences
npx cap sync

# Network Information
npm install @capacitor/network
npx cap sync
```

---

## 🎯 Checklist πριν το Release

### Android:
- [ ] Δοκιμή σε πραγματική συσκευή
- [ ] Δοκιμή σε tablet
- [ ] Δοκιμή σε διαφορετικές εκδόσεις Android (min API 22)
- [ ] Custom app icon (όλα τα sizes)
- [ ] Custom splash screen
- [ ] Signed AAB με keystore
- [ ] Version code αυξημένο
- [ ] Screenshots έτοιμα για Play Store
- [ ] Privacy Policy URL

### iOS:
- [ ] Δοκιμή σε πραγματική συσκευή iPhone
- [ ] Δοκιμή σε iPad
- [ ] Custom app icon (1024x1024)
- [ ] Custom splash screen
- [ ] All screenshots sizes
- [ ] Version & Build number ορθά
- [ ] Privacy Policy URL
- [ ] Terms of Service (αν χρειάζεται)

---

## 📱 App Store Requirements

### Google Play Store:
- Minimum API Level: 22 (Android 5.1)
- Target API Level: 34 (Android 14) - **Υποχρεωτικό!**
- App Bundle (.aab) format
- 64-bit support
- Privacy Policy URL (υποχρεωτικό)

### Apple App Store:
- Minimum iOS: 13.0
- Privacy Policy URL (υποχρεωτικό)
- App Store screenshots (όλα τα sizes)
- Apple Developer Account ($99/year)

---

## 🔐 Keystore & Certificates (ΚΡΑΤΑRE ΑΣΦΑΛΗ!)

### Android Keystore:
```bash
# Δημιούργησε keystore (μία φορά μόνο):
keytool -genkey -v -keystore freegym-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias freegym-key

# Thens save the passwords safely!
# Δημιούργησε αρχείο: android/key.properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=freegym-key
storeFile=../freegym-keystore.jks
```

**⚠️ ΠΡΟΣΟΧΗ:** Αν χάσεις το keystore, **ΔΕΝ** μπορείς να κάνεις updates στην εφαρμογή!

### iOS Certificates:
- Managed αυτόματα από Xcode
- Χρειάζεσαι Apple Developer Account

---

## 🎉 Συγχαρητήρια!

Η εφαρμογή σου είναι έτοιμη για mobile! 🚀

### Επόμενα Βήματα:
1. Πρόσθεσε custom icons & splash screens
2. Δοκίμασε σε πραγματικές συσκευές
3. Κάνε signed builds
4. Upload στα stores

### Useful Links:
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Studio Download](https://developer.android.com/studio)
- [Xcode Download](https://developer.apple.com/xcode/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)

---

## 📞 Support

Αν χρειαστείς βοήθεια:
- [Capacitor Community Discord](https://ionic.link/discord)
- [Stack Overflow - Capacitor](https://stackoverflow.com/questions/tagged/capacitor)
- [Capacitor GitHub Issues](https://github.com/ionic-team/capacitor/issues)

