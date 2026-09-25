package com.obsproject.mobile.core

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
