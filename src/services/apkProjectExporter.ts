import JSZip from 'jszip';
import { ANDROID_FILES } from '../data/androidSourceCode';

export async function generateAndroidStudioProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // 1. Root Build Files
  zip.file(
    'build.gradle.kts',
    `// Top-level build file for OBS Mobile
plugins {
    id("com.android.application") version "8.2.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
    id("kotlin-kapt") version "1.9.22" apply false
}
`
  );

  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "OBSMobile"
include(":app")
`
  );

  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`
  );

  zip.file(
    'gradle/wrapper/gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  // 2. App Module Build File
  zip.file(
    'app/build.gradle.kts',
    `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
}

android {
    namespace = "com.obsproject.mobile"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.obsproject.mobile"
        minSdk = 29
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a", "x86_64")
        }

        externalNativeBuild {
            cmake {
                cppFlags += "-std=c++17"
                arguments += "-DANDROID_STL=c++_shared"
            }
        }
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
        debug {
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.02.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")

    val cameraxVersion = "1.3.1"
    implementation("androidx.camera:camera-core:$cameraxVersion")
    implementation("androidx.camera:camera-camera2:$cameraxVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraxVersion")

    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    kapt("androidx.room:room-compiler:$roomVersion")

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
}
`
  );

  // 3. AndroidManifest.xml
  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.obsproject.mobile">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <uses-feature android:name="android.hardware.camera" android:required="true" />
    <uses-feature android:glEsVersion="0x00030000" android:required="true" />

    <application
        android:allowBackup="true"
        android:label="OBS Mobile"
        android:supportsRtl="true"
        android:theme="@style/Theme.OBSMobile">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.StreamingForegroundService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="mediaProjection|camera|microphone" />

    </application>
</manifest>
`
  );

  // 4. Resources
  zip.file(
    'app/src/main/res/values/strings.xml',
    `<resources>
    <string name="app_name">OBS Mobile</string>
</resources>
`
  );

  zip.file(
    'app/src/main/res/values/styles.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.OBSMobile" parent="android:Theme.Material.NoActionBar">
        <item name="android:statusBarColor">#111111</item>
        <item name="android:navigationBarColor">#141414</item>
        <item name="android:windowBackground">#000000</item>
    </style>
</resources>
`
  );

  // 5. Native C++ & CMake
  zip.file(
    'app/src/main/cpp/CMakeLists.txt',
    `cmake_minimum_required(VERSION 3.22.1)
project("obs-core")

add_library(
    obs-core
    SHARED
    obs-core.cpp
)

find_library(log-lib log)
find_library(gles3-lib GLESv3)
find_library(egl-lib EGL)
find_library(android-lib android)

target_link_libraries(
    obs-core
    \${log-lib}
    \${gles3-lib}
    \${egl-lib}
    \${android-lib}
)
`
  );

  // Add all Kotlin & C++ source files
  for (const f of ANDROID_FILES) {
    zip.file(f.path, f.code);
  }

  // 6. StreamingForegroundService.kt
  zip.file(
    'app/src/main/java/com/obsproject/mobile/service/StreamingForegroundService.kt',
    `package com.obsproject.mobile.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.view.Surface
import androidx.core.app.NotificationCompat

class StreamingForegroundService : Service() {

    private val binder = LocalBinder()
    private val CHANNEL_ID = "OBS_Streaming_Service_Channel"
    private val NOTIFICATION_ID = 101

    inner class LocalBinder : Binder() {
        fun getService(): StreamingForegroundService = this@StreamingForegroundService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
        return START_STICKY
    }

    fun startStream(previewSurface: Surface) {
        // Keeps CPU awake and EGL pipeline active
    }

    fun stopStream() {
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("OBS Mobile is Broadcasting")
            .setContentText("OpenGL Compositor & RTMP Hardware Pipeline Active")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "OBS Mobile Live Broadcast",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }
}
`
  );

  // 7. NativeBridge.kt
  zip.file(
    'app/src/main/java/com/obsproject/mobile/core/NativeBridge.kt',
    `package com.obsproject.mobile.core

object NativeBridge {
    init {
        System.loadLibrary("obs-core")
    }

    @JvmStatic
    external fun nativeUpdateSource(
        id: Long,
        type: Int,
        textureId: Int,
        x: Float,
        y: Float,
        width: Float,
        height: Float,
        opacity: Float,
        rotation: Float,
        zOrder: Int,
        visible: Boolean,
        texMatrix: FloatArray
    )
}
`
  );

  // 8. Build Scripts
  zip.file(
    'build-apk.sh',
    `#!/usr/bin/env bash
set -e
echo "Building OBS Mobile APK with Gradle..."
chmod +x ./gradlew 2>/dev/null || true
if [ -f "./gradlew" ]; then
    ./gradlew assembleDebug --stacktrace
else
    gradle assembleDebug --stacktrace
fi
echo "✓ APK build completed: app/build/outputs/apk/debug/app-debug.apk"
`
  );

  zip.file(
    '.github/workflows/build-apk.yml',
    `name: Build Android APK
on: [push, pull_request, workflow_dispatch]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - uses: android-actions/setup-android@v3
      - name: Build Debug APK
        run: |
          chmod +x ./gradlew || true
          ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: OBS-Mobile-Debug-APK
          path: app/build/outputs/apk/debug/app-debug.apk
`
  );

  zip.file(
    'README.md',
    `# OBS Mobile Android Studio Project

## Prerequisites
- Android Studio Hedgehog (2023.1.1) or newer
- JDK 17
- Android SDK 34 & NDK 26.1+

## How to Build APK
### In Android Studio
1. Open this unzipped folder in **Android Studio**.
2. Wait for Gradle sync to complete.
3. Select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Locate the generated APK in \`app/build/outputs/apk/debug/app-debug.apk\`.

### From Terminal
\`\`\`bash
chmod +x gradlew
./gradlew assembleDebug
\`\`\`

### Install to Phone via ADB
\`\`\`bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
\`\`\`
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
