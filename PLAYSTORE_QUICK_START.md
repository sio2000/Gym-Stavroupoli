# 🚀 Γρήγορη Έναρξη - Google Play Store

## Σε 5 Απλά Βήματα

### 1️⃣ Τρέξτε το Setup Script
```bash
scripts\setup-playstore.bat
```

### 2️⃣ Αλλάξτε τα Passwords
Επεξεργαστείτε τα αρχεία:
- `android/key.properties`
- `android/gradle.properties`

### 3️⃣ Προετοιμάστε Assets
Τοποθετήστε στο φάκελο `playstore-assets/`:
- **App Icon:** 512x512 PNG
- **Feature Graphic:** 1024x500 PNG  
- **Screenshots:** 2-8 εικόνες (16:9 ratio)

### 4️⃣ Build για Play Store
```bash
scripts\build-for-playstore.bat
```

### 5️⃣ Ανεβάστε στο Play Console
- Πηγαίνετε στο [Google Play Console](https://play.google.com/console)
- Δημιουργήστε νέα εφαρμογή
- Ανεβάστε το AAB από `android/app/build/outputs/bundle/release/`

---

## 📋 Checklist

- [ ] Google Play Console Developer Account ($25)
- [ ] Keystore δημιουργημένο
- [ ] Passwords αλλάχθηκαν
- [ ] Assets προετοιμασμένα
- [ ] AAB δημιουργημένο
- [ ] Upload στο Play Console
- [ ] Review process

---

## 📚 Περισσότερες Πληροφορίες

- **Πλήρης Οδηγός:** `PLAYSTORE_PUBLISHING_GUIDE.md`
- **Checklist:** `PLAYSTORE_CHECKLIST.md`
- **Scripts Help:** `scripts/README.md`

---

**⏱️ Χρόνος:** 2-4 ώρες setup + 1-3 ημέρες review
