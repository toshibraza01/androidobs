// Native OBS Core implementation for Android (arm64-v8a)
#include <jni.h>
#include <GLES3/gl3.h>
#include <GLES2/gl2ext.h>
#include <EGL/egl.h>
#include <android/native_window_jni.h>
#include <android/log.h>
#include <vector>
#include <algorithm>
#include <cmath>

#define LOG_TAG "OBS-Core"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

struct SourceLayer {
    jlong id;
    jint type;
    jint textureId;
    float x, y, width, height;
    float opacity;
    float rotation;
    jint zOrder;
    bool visible;
    float texMatrix[16];
};

static std::vector<SourceLayer> g_layers;

// Audio Mixing Kernel: 16-bit stereo PCM summer with soft-clipping limiter
extern "C" JNIEXPORT void JNICALL
Java_com_obsproject_mobile_media_AudioCaptureEngine_nativeMixTracks(
    JNIEnv* env, jobject thiz,
    jshortArray micBuffer, jint micSamples,
    jshortArray sysBuffer, jint sysSamples,
    jshortArray outBuffer, jint outSamples
) {
    jshort* mic = env->GetShortArrayElements(micBuffer, nullptr);
    jshort* sys = env->GetShortArrayElements(sysBuffer, nullptr);
    jshort* out = env->GetShortArrayElements(outBuffer, nullptr);

    for (int i = 0; i < outSamples; ++i) {
        float sampleMic = (i < micSamples) ? static_cast<float>(mic[i]) : 0.0f;
        float sampleSys = (i < sysSamples) ? static_cast<float>(sys[i]) : 0.0f;

        // Sum with 1.0 gain
        float mixed = sampleMic + sampleSys;

        // Fast hyperbolic tangent soft-knee saturation to eliminate harsh clipping
        if (mixed > 32767.0f) {
            mixed = 32767.0f * tanhf(mixed / 32767.0f);
        } else if (mixed < -32768.0f) {
            mixed = 32768.0f * tanhf(mixed / 32768.0f);
        }

        out[i] = static_cast<jshort>(mixed);
    }

    env->ReleaseShortArrayElements(micBuffer, mic, JNI_ABORT);
    env->ReleaseShortArrayElements(sysBuffer, sys, JNI_ABORT);
    env->ReleaseShortArrayElements(outBuffer, out, 0);
}

// Scene Compositor source registration
extern "C" JNIEXPORT void JNICALL
Java_com_obsproject_mobile_core_NativeBridge_nativeUpdateSource(
    JNIEnv* env, jclass clazz,
    jlong id, jint type, jint textureId,
    jfloat x, jfloat y, jfloat width, jfloat height,
    jfloat opacity, jfloat rotation, jint zOrder, jboolean visible,
    jfloatArray texMatrix
) {
    SourceLayer layer;
    layer.id = id;
    layer.type = type;
    layer.textureId = textureId;
    layer.x = x;
    layer.y = y;
    layer.width = width;
    layer.height = height;
    layer.opacity = opacity;
    layer.rotation = rotation;
    layer.zOrder = zOrder;
    layer.visible = visible;

    jfloat* matrix = env->GetFloatArrayElements(texMatrix, nullptr);
    std::copy(matrix, matrix + 16, layer.texMatrix);
    env->ReleaseFloatArrayElements(texMatrix, matrix, JNI_ABORT);

    auto it = std::find_if(g_layers.begin(), g_layers.end(), [id](const SourceLayer& l) {
        return l.id == id;
    });

    if (it != g_layers.end()) {
        *it = layer;
    } else {
        g_layers.push_back(layer);
    }

    // Sort by Z-order ascending
    std::sort(g_layers.begin(), g_layers.end(), [](const SourceLayer& a, const SourceLayer& b) {
        return a.zOrder < b.zOrder;
    });
}