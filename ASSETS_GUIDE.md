# 🎨 Οδηγός Assets (Icons & Splash Screens)

## 📋 Τι Χρειάζεσαι

### 1. App Icon
- **Μέγεθος:** 1024x1024 pixels
- **Φόρμα:** Τετράγωνο (χωρίς στρογγυλεμένες γωνίες)
- **Format:** PNG
- **Background:** Χωρίς διαφάνεια (solid background)
- **Περιεχόμενο:** Το logo του FreeGym κεντραρισμένο

### 2. Splash Screen
- **Μέγεθος:** 2732x2732 pixels (το μεγαλύτερο iPad Pro)
- **Format:** PNG
- **Background:** Solid color (π.χ. #ffffff ή το brand color σου)
- **Περιεχόμενο:** Το logo κεντραρισμένο σε safe zone (1200x1200 στο κέντρο)

---

## 🚀 Γρήγορος Τρόπος (Αυτόματο)

### Βήμα 1: Εγκατάσταση του capacitor-assets

```bash
npm install @capacitor/assets --save-dev
```

### Βήμα 2: Δημιούργησε τον φάκελο resources

```bash
mkdir resources
```

### Βήμα 3: Πρόσθεσε τα source images

Βάλε δύο αρχεία στον φάκελο `resources/`:

1. **icon.png** (1024x1024) - Το app icon σου
2. **splash.png** (2732x2732) - Το splash screen σου

### Βήμα 4: Generate όλα τα sizes αυτόματα

```bash
npx capacitor-assets generate
```

Αυτό θα δημιουργήσει αυτόματα:
- ✅ Όλα τα Android icon sizes (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- ✅ Όλα τα iOS icon sizes
- ✅ Android splash screens
- ✅ iOS launch screens
- ✅ Adaptive icons για Android

### Βήμα 5: Sync τα projects

```bash
npm run cap:sync
```

**Τέλος! Όλα τα icons και splash screens είναι έτοιμα!** 🎉

---

## 🎨 Χειροκίνητος Τρόπος (Advanced)

Αν θέλεις πλήρη έλεγχο, μπορείς να τα προσθέσεις χειροκίνητα:

### Android Icons

Δημιούργησε τα παρακάτω sizes και βάλτα στους αντίστοιχους φακέλους:

```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png (48x48)
│   └── ic_launcher_round.png (48x48)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72)
│   └── ic_launcher_round.png (72x72)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96x96)
│   └── ic_launcher_round.png (96x96)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144x144)
│   └── ic_launcher_round.png (144x144)
└── mipmap-xxxhdpi/
    ├── ic_launcher.png (192x192)
    └── ic_launcher_round.png (192x192)
```

### Android Splash Screen

```
android/app/src/main/res/drawable/
└── splash.png (2732x2732 ή background color)
```

Ενημέρωσε το `android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
    <item name="android:background">@drawable/splash</item>
</style>
```

### iOS Icons

1. Άνοιξε το Xcode:
   ```bash
   npm run cap:open:ios
   ```

2. Πήγαινε στο: **App → Assets.xcassets → AppIcon**

3. Σύρε το 1024x1024 icon στο "App Store iOS" slot

4. Το Xcode θα δημιουργήσει αυτόματα όλα τα sizes

### iOS Splash Screen

1. Στο Xcode: **App → Assets.xcassets → Splash**

2. Σύρε το splash image (2732x2732)

3. Ενημέρωσε το `ios/App/App/Base.lproj/LaunchScreen.storyboard` αν χρειάζεται

---

## 🎨 Design Tips

### App Icon:
- ✅ **Απλό και καθαρό** - Πρέπει να είναι αναγνωρίσιμο ακόμα και σε μικρό μέγεθος
- ✅ **Υψηλή αντίθεση** - Ξεχωρίζει στο home screen
- ✅ **Χωρίς κείμενο** - Ή ελάχιστο κείμενο (μόνο αν είναι μέρος του logo)
- ✅ **Safe zone** - Κράτα το σημαντικό περιεχόμενο στο 80% του κέντρου
- ❌ **Όχι διαφάνεια** - Χρησιμοποίησε solid background
- ❌ **Όχι στρογγυλεμένες γωνίες** - Το iOS τις προσθέτει αυτόματα

### Splash Screen:
- ✅ **Κεντραρισμένο logo** - Φαίνεται καλά σε όλα τα devices
- ✅ **Safe zone 1200x1200** - Το logo μέσα σε αυτή την περιοχή
- ✅ **Solid background** - Το ίδιο χρώμα με το app
- ✅ **Γρήγορο loading** - Κράτα το απλό
- ❌ **Όχι πολλά στοιχεία** - Μόνο logo και background

---

## 🛠️ Χρήσιμα Tools

### Online Generators:
- [App Icon Generator](https://appicon.co/) - Generate iOS & Android icons
- [MakeAppIcon](https://makeappicon.com/) - Free icon generator
- [Apetools](https://apetools.webprofusion.com/app/#/tools/imagegorilla) - Batch image resizer

### Design Tools:
- [Figma](https://www.figma.com/) - Free design tool
- [Canva](https://www.canva.com/) - Easy logo creator
- [Adobe Express](https://www.adobe.com/express/) - Quick designs

### Icon Resources:
- [Flaticon](https://www.flaticon.com/) - Free icons
- [Noun Project](https://thenounproject.com/) - Icons for everything
- [Icons8](https://icons8.com/) - Free icons & illustrations

---

## 📐 Exact Sizes Reference

### Android (mipmap):
| Density | Size | Folder |
|---------|------|--------|
| MDPI | 48x48 | mipmap-mdpi |
| HDPI | 72x72 | mipmap-hdpi |
| XHDPI | 96x96 | mipmap-xhdpi |
| XXHDPI | 144x144 | mipmap-xxhdpi |
| XXXHDPI | 192x192 | mipmap-xxxhdpi |

### iOS (AppIcon.appiconset):
| Size | Purpose |
|------|---------|
| 1024x1024 | App Store |
| 180x180 | iPhone @3x |
| 120x120 | iPhone @2x |
| 167x167 | iPad Pro @2x |
| 152x152 | iPad @2x |
| 76x76 | iPad @1x |

### Splash Screens:
| Platform | Size | Notes |
|----------|------|-------|
| Universal | 2732x2732 | Safe zone: 1200x1200 center |
| Android | 2732x2732 | Scales to all devices |
| iOS | 2732x2732 | Works on all devices |

---

## ✅ Checklist

Πριν κάνεις build, σιγουρέψου ότι:

- [ ] Έχεις source icon.png (1024x1024)
- [ ] Έχεις source splash.png (2732x2732)
- [ ] Έχεις τρέξει `npx capacitor-assets generate`
- [ ] Έχεις κάνει `npm run cap:sync`
- [ ] Δοκίμασες το app σε simulator/emulator
- [ ] Τα icons φαίνονται καλά στο home screen
- [ ] Το splash screen φαίνεται σωστά στο launch

---

## 🎯 Παράδειγμα Workflow

```bash
# 1. Φτιάξε τα source images
# - resources/icon.png (1024x1024)
# - resources/splash.png (2732x2732)

# 2. Εγκατάσταση του tool
npm install @capacitor/assets --save-dev

# 3. Generate όλα τα sizes
npx capacitor-assets generate

# 4. Sync
npm run cap:sync

# 5. Test
npm run cap:open:android
npm run cap:open:ios  # Mac only

# 6. Verify
# - Δες το icon στο home screen
# - Δες το splash screen κατά το launch
```

---

## 🆘 Troubleshooting

### "Icons not changing"
```bash
# Clean build
npm run cap:sync
# Android Studio: Build → Clean Project → Rebuild
# Xcode: Product → Clean Build Folder
```

### "Splash screen showing white"
- Έλεγξε αν το splash.png υπάρχει
- Έλεγξε το backgroundColor στο capacitor.config.ts
- Κάνε clean build

### "Icon looks pixelated"
- Χρησιμοποίησε υψηλής ανάλυσης source (1024x1024)
- Σιγουρέψου ότι είναι PNG, όχι JPG
- Τρέξε ξανά το generate command

---

## 📱 Testing Checklist

### Android:
- [ ] Test σε phone (διάφορα sizes)
- [ ] Test σε tablet
- [ ] Icon looks good on home screen
- [ ] Splash shows correctly
- [ ] Rotation works (portrait/landscape)

### iOS:
- [ ] Test σε iPhone (διάφορα μοντέλα)
- [ ] Test σε iPad
- [ ] Icon looks good on home screen
- [ ] Launch screen shows correctly
- [ ] Rotation works

---

## 🎁 Bonus: Brand Colors

Αν θέλεις να κάνεις match το splash screen με το brand:

### Στο capacitor.config.ts:
```typescript
plugins: {
  SplashScreen: {
    backgroundColor: "#YOUR_HEX_COLOR", // π.χ. "#1E40AF"
    launchShowDuration: 2000,
    launchAutoHide: true,
  }
}
```

### Στο AndroidManifest.xml:
```xml
<meta-data
    android:name="android.max_aspect"
    android:value="2.1" />
```

---

Τώρα έχεις όλα όσα χρειάζεσαι για να δημιουργήσεις όμορφα icons και splash screens! 🎨✨

