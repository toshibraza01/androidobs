package com.obsproject.mobile.capture

import android.content.Context
import android.graphics.SurfaceTexture
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.projection.MediaProjection
import android.opengl.GLES11Ext
import android.opengl.GLES30
import android.view.Surface
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.obsproject.mobile.core.NativeBridge

class CaptureSourceManager(private val context: Context) {

    private var cameraSurfaceTexture: SurfaceTexture? = null
    private var cameraSurface: Surface? = null
    private var cameraTextureId: Int = -1

    private var screenSurfaceTexture: SurfaceTexture? = null
    private var screenSurface: Surface? = null
    private var screenVirtualDisplay: VirtualDisplay? = null
    private var screenTextureId: Int = -1

    private val cameraMatrix = FloatArray(16)
    private val screenMatrix = FloatArray(16)

    fun createOesTexture(): Int {
        val textures = IntArray(1)
        GLES30.glGenTextures(1, textures, 0)
        val texId = textures[0]
        GLES30.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, texId)
        GLES30.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES30.GL_TEXTURE_MIN_FILTER, GLES30.GL_LINEAR)
        GLES30.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES30.GL_TEXTURE_MAG_FILTER, GLES30.GL_LINEAR)
        GLES30.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES30.GL_TEXTURE_WRAP_S, GLES30.GL_CLAMP_TO_EDGE)
        GLES30.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES30.GL_TEXTURE_WRAP_T, GLES30.GL_CLAMP_TO_EDGE)
        return texId
    }

    fun startCameraCapture(
        lifecycleOwner: LifecycleOwner,
        lensFacing: Int = CameraSelector.LENS_FACING_BACK,
        onFrameAvailable: () -> Unit
    ) {
        cameraTextureId = createOesTexture()
        cameraSurfaceTexture = SurfaceTexture(cameraTextureId).apply {
            setDefaultBufferSize(1920, 1080)
            setOnFrameAvailableListener {
                updateTexImage()
                getTransformMatrix(cameraMatrix)
                NativeBridge.nativeUpdateSource(
                    id = 1, type = 0, textureId = cameraTextureId,
                    x = 0f, y = 0f, width = 1920f, height = 1080f,
                    opacity = 1f, rotation = 0f, zOrder = 1, visible = true,
                    texMatrix = cameraMatrix
                )
                onFrameAvailable()
            }
        }
        cameraSurface = Surface(cameraSurfaceTexture)

        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build()
            preview.setSurfaceProvider { request ->
                cameraSurface?.let { request.provideSurface(it, ContextCompat.getMainExecutor(context)) {} }
            }

            val selector = CameraSelector.Builder().requireLensFacing(lensFacing).build()
            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(lifecycleOwner, selector, preview)
        }, ContextCompat.getMainExecutor(context))
    }

    fun startScreenCapture(
        mediaProjection: MediaProjection,
        width: Int = 1920,
        height: Int = 1080,
        densityDpi: Int = 400,
        onFrameAvailable: () -> Unit
    ) {
        screenTextureId = createOesTexture()
        screenSurfaceTexture = SurfaceTexture(screenTextureId).apply {
            setDefaultBufferSize(width, height)
            setOnFrameAvailableListener {
                updateTexImage()
                getTransformMatrix(screenMatrix)
                NativeBridge.nativeUpdateSource(
                    id = 2, type = 0, textureId = screenTextureId,
                    x = 1200f, y = 600f, width = 640f, height = 360f, // Pip overlay default
                    opacity = 1f, rotation = 0f, zOrder = 2, visible = true,
                    texMatrix = screenMatrix
                )
                onFrameAvailable()
            }
        }
        screenSurface = Surface(screenSurfaceTexture)

        screenVirtualDisplay = mediaProjection.createVirtualDisplay(
            "OBS_VirtualDisplay",
            width, height, densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            screenSurface, null, null
        )
    }

    fun release() {
        screenVirtualDisplay?.release()
        cameraSurface?.release()
        cameraSurfaceTexture?.release()
        screenSurface?.release()
        screenSurfaceTexture?.release()
    }
}