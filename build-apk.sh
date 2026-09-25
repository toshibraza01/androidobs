#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "          OBS Mobile - Automated APK Build Script         "
echo "=========================================================="

# Check for Java 17+
if ! command -v java &> /dev/null; then
    echo "❌ Error: Java (JDK 17+) is required but not installed."
    echo "   Please install OpenJDK 17: https://adoptium.net/"
    exit 1
fi

JAVA_VER=$(java -version 2>&1 | head -n 1)
echo "✓ Java detected: $JAVA_VER"

# Check for ANDROID_HOME or ANDROID_SDK_ROOT
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "⚠️ Warning: ANDROID_HOME environment variable not set."
    if [ -d "$HOME/Library/Android/sdk" ]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
        echo "✓ Auto-detected macOS Android SDK: $ANDROID_HOME"
    elif [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
        echo "✓ Auto-detected Linux Android SDK: $ANDROID_HOME"
    else
        echo "❌ Android SDK not found. Please install Android Studio or SDK command line tools."
        exit 1
    fi
fi

# Build Debug and Release APK
echo "→ Building OBS Mobile APK with Gradle..."
chmod +x ./gradlew 2>/dev/null || true

if [ -f "./gradlew" ]; then
    ./gradlew assembleDebug --stacktrace
else
    echo "→ Running gradle assembleDebug..."
    gradle assembleDebug --stacktrace
fi

if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo ""
    echo "=========================================================="
    echo "🎉 SUCCESS: APK BUILT SUCCESSFULLY!"
    echo "📁 Output Location: app/build/outputs/apk/debug/app-debug.apk"
    echo "📲 Install to connected Android device via ADB:"
    echo "   adb install -r app/build/outputs/apk/debug/app-debug.apk"
    echo "=========================================================="
else
    echo "Build completed. Check app/build/outputs/apk/ for generated artifacts."
fi
