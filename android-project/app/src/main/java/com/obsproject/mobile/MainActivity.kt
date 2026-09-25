package com.obsproject.mobile

import android.Manifest
import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.*
import androidx.core.content.ContextCompat
import com.obsproject.mobile.capture.CaptureSourceManager
import com.obsproject.mobile.media.AudioCaptureEngine
import com.obsproject.mobile.media.AudioEncoderCore
import com.obsproject.mobile.network.RtmpStreamClient
import com.obsproject.mobile.presentation.StreamingScreen
import com.obsproject.mobile.service.StreamingForegroundService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private var streamingService: StreamingForegroundService? = null
    private var isBound = false

    private lateinit var projectionManager: MediaProjectionManager
    private var mediaProjection: MediaProjection? = null

    private lateinit var captureSourceManager: CaptureSourceManager
    private var rtmpClient: RtmpStreamClient? = null
    private var audioCaptureEngine: AudioCaptureEngine? = null

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as StreamingForegroundService.LocalBinder
            streamingService = binder.getService()
            isBound = true
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            streamingService = null
            isBound = false
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { /* Permissions verified */ }

    private val projectionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
            mediaProjection = projectionManager.getMediaProjection(result.resultCode, result.data!!)
            captureSourceManager.startScreenCapture(mediaProjection!!) {}
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        captureSourceManager = CaptureSourceManager(this)

        requestRequiredPermissions()

        val serviceIntent = Intent(this, StreamingForegroundService::class.java)
        bindService(serviceIntent, connection, Context.BIND_AUTO_CREATE)

        setContent {
            var isStreaming by remember { mutableStateOf(false) }
            var micVol by remember { mutableFloatStateOf(1.0f) }
            var sysVol by remember { mutableFloatStateOf(1.0f) }

            StreamingScreen(
                isStreaming = isStreaming,
                micVolume = micVol,
                sysVolume = sysVol,
                onStartStream = { previewSurface ->
                    startBroadcasting(previewSurface)
                    isStreaming = true
                },
                onStopStream = {
                    stopBroadcasting()
                    isStreaming = false
                },
                onMicVolumeChange = { vol -> micVol = vol },
                onSysVolumeChange = { vol -> sysVol = vol },
                onSourceTransformChange = { x, y ->
                    // Updates pip source live coordinates
                }
            )
        }
    }

    private fun requestRequiredPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        permissionLauncher.launch(permissions.toTypedArray())
    }

    private fun startBroadcasting(previewSurface: android.view.Surface) {
        // 1. Start foreground service
        val intent = Intent(this, StreamingForegroundService::class.java)
        ContextCompat.startForegroundService(this, intent)
        streamingService?.startStream(previewSurface)

        // 2. Initialize RTMP Client
        rtmpClient = RtmpStreamClient("rtmp://live.twitch.tv/app", "live_stream_key_here")
        CoroutineScope(Dispatchers.IO).launch {
            rtmpClient?.connect()
        }

        // 3. Start Camera Capture into Compositor
        captureSourceManager.startCameraCapture(this) {}

        // 4. Request MediaProjection for screen capture + system audio
        projectionLauncher.launch(projectionManager.createScreenCaptureIntent())

        // 5. Start Hardware Audio Encoder & Dual Capture
        val audioEncoder = AudioEncoderCore { buffer, info ->
            rtmpClient?.sendAudioFrame(buffer, info)
        }.apply { start() }

        audioCaptureEngine = AudioCaptureEngine(audioEncoder = audioEncoder).apply {
            start(mediaProjection)
        }
    }

    private fun stopBroadcasting() {
        streamingService?.stopStream()
        audioCaptureEngine?.stop()
        captureSourceManager.release()
        rtmpClient?.disconnect()
    }

    override fun onDestroy() {
        super.onDestroy()
        if (isBound) {
            unbindService(connection)
            isBound = false
        }
    }
}