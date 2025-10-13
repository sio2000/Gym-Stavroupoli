@echo off
echo Διόρθωση build.gradle για Release Build...

REM Δημιουργία backup
copy "android\app\build.gradle" "android\app\build.gradle.backup"

echo.
echo Δημιουργία νέου build.gradle με signing config...

REM Δημιουργούμε το νέο build.gradle
(
echo apply plugin: 'com.android.application'
echo.
echo android {
echo     namespace "com.siozostheoharis.getfit"
echo     compileSdk rootProject.ext.compileSdkVersion
echo     defaultConfig {
echo         applicationId "com.siozostheoharis.getfit"
echo         minSdkVersion rootProject.ext.minSdkVersion
echo         targetSdkVersion rootProject.ext.targetSdkVersion
echo         versionCode 1
echo         versionName "1.0"
echo         testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
echo         aaptOptions {
echo              // Files and dirs to omit from the packaged assets dir, modified to accommodate modern web apps.
echo              // Default: https://android.googlesource.com/platform/frameworks/base/+/282e181b58cf72b6ca770dc7ca5f91f135444502/tools/aapt/AaptAssets.cpp#61
echo             ignoreAssetsPattern '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~'
echo         }
echo     }
echo     signingConfigs {
echo         release {
echo             if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
echo                 storeFile file(MYAPP_RELEASE_STORE_FILE)
echo                 storePassword MYAPP_RELEASE_STORE_PASSWORD
echo                 keyAlias MYAPP_RELEASE_KEY_ALIAS
echo                 keyPassword MYAPP_RELEASE_KEY_PASSWORD
echo             }
echo         }
echo     }
echo     buildTypes {
echo         release {
echo             signingConfig signingConfigs.release
echo             minifyEnabled true
echo             proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
echo         }
echo     }
echo     compileOptions {
echo         sourceCompatibility JavaVersion.VERSION_17
echo         targetCompatibility JavaVersion.VERSION_17
echo     }
echo }
echo.
echo repositories {
echo     flatDir{
echo         dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs'
echo     }
echo }
echo.
echo dependencies {
echo     implementation fileTree(include: ['*.jar'], dir: 'libs')
echo     implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
echo     implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
echo     implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
echo     implementation project(':capacitor-android')
echo     testImplementation "junit:junit:$junitVersion"
echo     androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
echo     androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
echo     implementation project(':capacitor-cordova-android-plugins')
echo }
echo.
echo apply from: 'capacitor.build.gradle'
echo.
echo try {
echo     def servicesJSON = file('google-services.json'^)
echo     if (servicesJSON.text^) {
echo         apply plugin: 'com.google.gms.google-services'
echo     }
echo } catch(Exception e^) {
echo     logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work"^)
echo }
) > "android\app\build.gradle"

echo.
echo ✅ build.gradle ενημερώθηκε επιτυχώς!
echo.
echo Το backup βρίσκεται στο: android\app\build.gradle.backup

pause
