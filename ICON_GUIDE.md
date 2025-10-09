# 🎨 Οδηγός για Εικονίδια & Logo - GetFit App

## 📱 Όνομα Εφαρμογής
✅ **Ολοκληρώθηκε!** Το όνομα της εφαρμογής είναι τώρα **"GetFit"**

## 🖼️ Εικονίδια που χρειάζονται

### 1. **App Icon (Launcher Icon)**
Το εικονίδιο που εμφανίζεται στην οθόνη του κινητού

**Τι χρειάζεσαι:**
- Ένα logo/εικόνα σε υψηλή ανάλυση (ιδανικά 1024x1024 px)
- Φόρμα: PNG με διαφανές background (προαιρετικό)
- Το logo πρέπει να είναι απλό και ευδιάκριτο σε μικρό μέγεθος

### 2. **Splash Screen**
Η εικόνα που εμφανίζεται όταν ανοίγει η εφαρμογή

**Τι χρειάζεσαι:**
- Μια εικόνα ή το logo σου (ιδανικά 2732x2732 px)
- Φόρμα: PNG
- Μπορεί να έχει background ή να είναι διαφανές

---

## 🚀 ΠΩΣ ΝΑ ΠΡΟΣΘΕΣΕΙΣ ΤΑ ΕΙΚΟΝΙΔΙΑ

### Μέθοδος 1: Online Tool (Συνιστάται) ⭐

1. **Πήγαινε στο:** https://icon.kitchen/
   
2. **Ανέβασε το logo σου:**
   - Drag & drop το αρχείο σου
   - Ρύθμισε το padding και το background
   - Επίλεξε "Android" ως platform

3. **Κατέβασε τα icons:**
   - Πάτα "Download"
   - Αποσυμπίεσε το ZIP

4. **Αντικατάστησε τα αρχεία:**
   - Αντίγραψε τους φακέλους `mipmap-*` μέσα στο:
     ```
     android/app/src/main/res/
     ```

### Μέθοδος 2: Χειροκίνητα (Προχωρημένοι)

**App Icons - Μεγέθη που χρειάζεσαι:**

```
📁 android/app/src/main/res/
├── mipmap-mdpi/ic_launcher.png          (48x48 px)
├── mipmap-hdpi/ic_launcher.png          (72x72 px)
├── mipmap-xhdpi/ic_launcher.png         (96x96 px)
├── mipmap-xxhdpi/ic_launcher.png        (144x144 px)
└── mipmap-xxxhdpi/ic_launcher.png       (192x192 px)
```

**Splash Screens - Μεγέθη που χρειάζεσαι:**

```
📁 android/app/src/main/res/
├── drawable/splash.png                   (2732x2732 px)
├── drawable-port-mdpi/splash.png         (320x480 px)
├── drawable-port-hdpi/splash.png         (480x800 px)
├── drawable-port-xhdpi/splash.png        (720x1280 px)
├── drawable-port-xxhdpi/splash.png       (1080x1920 px)
└── drawable-port-xxxhdpi/splash.png      (1440x2560 px)
```

### Μέθοδος 3: Χρήση Capacitor Assets

1. **Δημιούργησε έναν φάκελο `resources/`** στο root του project:
   ```
   resources/
   ├── icon.png           (1024x1024 px)
   └── splash.png         (2732x2732 px)
   ```

2. **Τρέξε:**
   ```bash
   npm install -g cordova-res
   cordova-res android --skip-config --copy
   ```

---

## 📋 Checklist

- [ ] Έχω ένα logo σε υψηλή ανάλυση (1024x1024 px)
- [ ] Έχω μια splash screen εικόνα (2732x2732 px)
- [ ] Έχω δημιουργήσει τα icons με icon.kitchen
- [ ] Έχω αντικαταστήσει τα αρχεία στο `android/app/src/main/res/`
- [ ] Έχω κάνει build την εφαρμογή: `cd android && .\gradlew installDebug`

---

## 🎨 Συμβουλές Design

### Για το App Icon:
- ✅ Απλό και καθαρό design
- ✅ Ευδιάκριτο σε μικρό μέγεθος
- ✅ Χρησιμοποίησε τα brand colors σου
- ❌ Μην χρησιμοποιείς πολύ μικρά γράμματα
- ❌ Μην βάζεις πολλές λεπτομέρειες

### Για το Splash Screen:
- ✅ Κεντράρισμα του logo
- ✅ Χρήση του brand background color
- ✅ Απλό και γρήγορο loading
- ❌ Μην βάζεις πολύ κείμενο
- ❌ Μην κάνεις πολύπλοκα animations

---

## 🔄 Μετά την αλλαγή των εικονιδίων

1. **Sync τα assets:**
   ```bash
   npx cap sync android
   ```

2. **Build και install:**
   ```bash
   cd android
   .\gradlew installDebug
   ```

3. **Δοκίμασε την εφαρμογή στο emulator!**

---

## 📱 Αποτέλεσμα

Μετά από αυτές τις αλλαγές, η εφαρμογή σου θα:
- ✅ Ονομάζεται **"GetFit"** παντού
- ✅ Έχει το δικό σου logo ως εικονίδιο
- ✅ Δείχνει το δικό σου splash screen
- ✅ Φαίνεται professional στο κινητό!

---

## 🆘 Χρειάζεσαι βοήθεια;

Αν θέλεις να στείλεις το logo σου:
1. Βάλ' το στον φάκελο του project
2. Τρέξε τα παραπάνω commands
3. Enjoy! 🎉

