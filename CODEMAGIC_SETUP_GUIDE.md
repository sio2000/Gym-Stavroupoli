# 🚀 Οδηγός Δημιουργίας .ipa με Codemagic (ΔΩΡΕΑΝ)

Αυτός ο οδηγός θα σε βοηθήσει να φτιάξεις iOS .ipa αρχείο από Windows χρησιμοποιώντας Codemagic.

---

## 📋 ΤΙ ΘΑ ΧΡΕΙΑΣΤΕΙΣ

### 1. Apple Developer Account
- **Δωρεάν Apple ID**: Για development builds (εγκατάσταση μόνο σε δικές σου συσκευές)
- **Paid Developer Account ($99/year)**: Για TestFlight και App Store distribution

### 2. Git Repository
- GitHub, GitLab, ή Bitbucket account
- Το project σου πρέπει να είναι pushed

### 3. Codemagic Account
- Δωρεάν tier: **500 build minutes/μήνα**
- Signup: https://codemagic.io/signup

---

## 🎯 ΒΗΜΑ 1: Push το Project στο Git

### Α. Commit τα αρχεία

```bash
git add codemagic.yaml .gitignore
git commit -m "Add Codemagic configuration"
git push origin main
```

### Β. Ανέβασε και τα υπόλοιπα αρχεία (προαιρετικά)

Αν θέλεις να κάνεις commit και τα icons/images:

```bash
git add ios/App/App/Assets.xcassets/
git commit -m "Update iOS app icons"
git push origin main
```

---

## 🎯 ΒΗΜΑ 2: Δημιουργία Codemagic Account

1. Πήγαινε στο: **https://codemagic.io/**
2. Κάνε κλικ **"Sign up"**
3. Επίλεξε **"Sign up with GitHub"** (ή GitLab/Bitbucket)
4. Άδεια στο Codemagic να έχει πρόσβαση στα repositories σου
5. Επιβεβαίωση email

---

## 🎯 ΒΗΜΑ 3: Σύνδεση Repository με Codemagic

### Στο Codemagic Dashboard:

1. Κάνε κλικ **"Add application"**
2. Επίλεξε το **Git provider** (GitHub/GitLab/Bitbucket)
3. Επίλεξε το repository: **getfitskg**
4. Κάνε κλικ **"Finish"**

---

## 🎯 ΒΗΜΑ 4: Apple Developer Portal Setup

### Α. Δημιουργία App Identifier

1. Πήγαινε στο: **https://developer.apple.com/account/**
2. Κάνε login με το Apple ID σου
3. **Certificates, Identifiers & Profiles** → **Identifiers**
4. Κάνε κλικ το **"+"** κουμπί
5. Επίλεξε **"App IDs"** → Continue
6. Επίλεξε **"App"** → Continue
7. **Description**: `GetFit`
8. **Bundle ID**: `com.freegym.app` (ίδιο με το capacitor.config.ts)
9. **Capabilities**: Τσέκαρε ό,τι χρειάζεσαι (Push Notifications, etc.)
10. Κάνε κλικ **"Register"**

### Β. Δημιουργία Certificates & Provisioning Profiles

**ΚΑΛΑ ΝΕΑ!** Το Codemagic μπορεί να τα δημιουργήσει αυτόματα! Απλά χρειάζεσαι:

---

## 🎯 ΒΗΜΑ 5: App Store Connect Setup (Προαιρετικό για TestFlight)

Αν θέλεις να ανεβάσεις στο TestFlight:

1. Πήγαινε στο: **https://appstoreconnect.apple.com/**
2. **My Apps** → **"+"** → **New App**
3. **Platforms**: iOS
4. **Name**: GetFit
5. **Primary Language**: Greek
6. **Bundle ID**: Επίλεξε `com.freegym.app`
7. **SKU**: `getfit-app` (οτιδήποτε unique)
8. **User Access**: Full Access
9. Κάνε κλικ **"Create"**

---

## 🎯 ΒΗΜΑ 6: Ρύθμιση Code Signing στο Codemagic

### Α. Automatic Code Signing (ΕΥΚΟΛΟΤΕΡΟΣ ΤΡΟΠΟΣ)

1. Στο Codemagic, άνοιξε το **getfitskg** app
2. Πήγαινε στο **"iOS code signing"** tab
3. Κάνε κλικ **"Set up code signing"**
4. Επίλεξε **"Automatic code signing"**
5. Κάνε κλικ **"Connect Apple Developer Portal"**
6. **Login** με το Apple ID σου
7. **Two-factor authentication**: Βάλε τον κωδικό που θα λάβεις
8. Το Codemagic θα δημιουργήσει αυτόματα:
   - Distribution Certificate
   - Provisioning Profile
9. Κάνε κλικ **"Finish setup"**

---

## 🎯 ΒΗΜΑ 7: Ρύθμιση Build Workflow

### Στο Codemagic Dashboard:

1. Άνοιξε το **getfitskg** app
2. Κάνε κλικ **"Start your first build"**
3. Επίλεξε **"Use codemagic.yaml"**
4. **Workflow**: Επίλεξε **"ios-workflow"** (για signed build)
   - Ή **"ios-development"** (για simulator build - ΔΩΡΕΑΝ, χωρίς code signing)

### Ρύθμιση Environment Variables:

1. **Settings** → **Environment variables**
2. Πρόσθεσε (αν χρησιμοποιείς ios-workflow):
   - `APP_STORE_APP_ID`: Το ID από App Store Connect (βρες το στο General → App Information)
   - Email για notifications

---

## 🎯 ΒΗΜΑ 8: Έναρξη Build

### Α. Για Development Build (ΔΩΡΕΑΝ - χωρίς code signing):

1. Επίλεξε **"ios-development"** workflow
2. Κάνε κλικ **"Start new build"**
3. Επίλεξε το **branch**: `main`
4. Κάνε κλικ **"Start build"**

⏱️ **Χρόνος**: ~10-15 λεπτά

### Β. Για Production Build (με code signing):

1. Επίλεξε **"ios-workflow"** workflow
2. Κάνε κλικ **"Start new build"**
3. Επίλεξε το **branch**: `main`
4. Κάνε κλικ **"Start build"**

⏱️ **Χρόνος**: ~15-25 λεπτά

---

## 🎯 ΒΗΜΑ 9: Λήψη του .ipa Αρχείου

### Μετά την επιτυχή build:

1. Κάνε κλικ στο **build**
2. Πήγαινε στο **"Artifacts"** tab
3. **Download το .ipa αρχείο**!
4. Θα το βρεις και στο email σου (αν ενεργοποίησες email notifications)

---

## 📱 ΒΗΜΑ 10: Εγκατάσταση στο iPhone

### Α. Μέσω TestFlight (αν ανέβασες στο App Store Connect):

1. Κατέβασε το **TestFlight** app από το App Store
2. Θα λάβεις email πρόσκλησης
3. Κάνε κλικ στο link και εγκατάστασε

### Β. Μέσω Direct Installation (development build):

**Χρησιμοποίησε το Diawi.com**:

1. Πήγαινε στο: **https://www.diawi.com/**
2. **Upload** το .ipa αρχείο
3. **Περίμενε** το upload (~2-5 λεπτά)
4. **Αντίγραψε** το link που θα σου δώσει
5. **Άνοιξε το link στο Safari** του iPhone
6. Κάνε κλικ **"Install"**
7. **Settings** → **General** → **VPN & Device Management**
8. **Trust** το developer certificate
9. Τώρα μπορείς να ανοίξεις το app!

---

## 💡 ΣΥΜΒΟΥΛΕΣ ΓΙΑ ΔΩΡΕΑΝ ΧΡΗΣΗ

### Οικονομία Build Minutes:

1. **Χρησιμοποίησε ios-development** για testing (πιο γρήγορο, λιγότερα minutes)
2. **Χρησιμοποίησε ios-workflow** μόνο όταν θέλεις final build
3. **Μην κάνεις rebuild** για κάθε μικρή αλλαγή - δοκίμασε πρώτα web version
4. **Ρύθμισε caching** για npm dependencies (ήδη στο config)

### Δωρεάν Tier Όρια:

- ✅ **500 minutes/μήνα**
- ✅ **Unlimited builds** (μέχρι να τελειώσουν τα minutes)
- ✅ **1 concurrent build**
- ✅ **M1 Mac instances**

### Πόσα builds χωράνε στα 500 minutes:

- **Development builds**: ~30-40 builds (~12-15 min/build)
- **Production builds**: ~20-25 builds (~20-25 min/build)

---

## 🔧 ΑΝΤΙΜΕΤΩΠΙΣΗ ΠΡΟΒΛΗΜΑΤΩΝ

### Build Fails με "Code Signing Error":

**Λύση**:
1. Ξανακάνε το code signing setup
2. Βεβαιώσου ότι το Bundle ID είναι σωστό
3. Τσέκαρε ότι έχεις valid Apple Developer account

### Build Fails με "Node/npm Error":

**Λύση**:
1. Βεβαιώσου ότι το `package.json` είναι valid
2. Τσέκαρε ότι όλα τα dependencies υπάρχουν
3. Δοκίμασε local: `npm ci && npm run build:mobile`

### Build Fails με "Xcode Error":

**Λύση**:
1. Τσέκαρε τα logs στο Codemagic
2. Βεβαιώσου ότι το iOS project είναι synced: `npx cap sync ios`
3. Τσέκαρε το `Info.plist` για λάθη

### .ipa δεν εγκαθίσταται στο iPhone:

**Λύση**:
1. **Development build**: Πρέπει να έχει το UDID της συσκευής σου registered
2. **Distribution build**: Χρησιμοποίησε TestFlight ή Ad Hoc provisioning
3. Βεβαιώσου ότι trust το certificate: Settings → General → VPN & Device Management

---

## 🎉 ΤΕΛΟΣ!

Τώρα έχεις:
- ✅ Configured Codemagic για iOS builds
- ✅ Δωρεάν .ipa generation
- ✅ Αυτόματο build pipeline
- ✅ Δυνατότητα testing στο iPhone

### Επόμενες Φορές:

Απλά κάνε:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Και το Codemagic θα κάνει **αυτόματα build** (αν ενεργοποιήσεις automatic builds)!

---

## 🔗 Χρήσιμα Links

- **Codemagic Docs**: https://docs.codemagic.io/
- **Apple Developer**: https://developer.apple.com/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **Diawi (για direct install)**: https://www.diawi.com/
- **TestFlight**: https://testflight.apple.com/

---

**Καλή επιτυχία με το GetFit app! 🎯💪**

