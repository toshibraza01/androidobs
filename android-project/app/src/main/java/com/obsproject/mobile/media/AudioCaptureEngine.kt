package com.obsproject.mobile.media

import android.annotation.SuppressLint
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioPlaybackCaptureConfiguration
import android.media.AudioRecord
import android.media.projection.MediaProjection
import android.os.Build
import com.obsproject.mobile.core.NativeBridge
import kotlinx.coroutines.*

class AudioCaptureEngine(
    private val sampleRate: Int = 48000,
    private val channelConfig: Int = AudioFormat.CHANNEL_IN_STEREO,
    private val audioFormat: Int = AudioFormat.ENCODING_PCM_16BIT,
    private val audioEncoder: AudioEncoderCore
) {
    private var micRecord: AudioRecord? = null
    private var internalRecord: AudioRecord? = null
    private var isRecording = false
    private var captureJob: Job? = null

    private external fun nativeMixTracks(
        micBuffer: ShortArray, micSamples: Int,
        sysBuffer: ShortArray, sysSamples: Int,
        outBuffer: ShortArray, outSamples: Int
    )

    @SuppressLint("MissingPermission")
    fun start(mediaProjection: MediaProjection?) {
        val bufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat) * 2

        // 1. Microphone Source
        micRecord = AudioRecord(
            android.media.MediaRecorder.AudioSource.MIC,
            sampleRate, channelConfig, audioFormat, bufferSize
        )

        // 2. Internal Audio (Android 10+ / API 29+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && mediaProjection != null) {
            val captureConfig = AudioPlaybackCaptureConfiguration.Builder(mediaProjection)
                .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
                .addMatchingUsage(AudioAttributes.USAGE_GAME)
                .addMatchingUsage(AudioAttributes.USAGE_UNKNOWN)
                .build()

            val format = AudioFormat.Builder()
                .setEncoding(audioFormat)
                .setSampleRate(sampleRate)
                .setChannelMask(channelConfig)
                .build()

            internalRecord = AudioRecord.Builder()
                .setAudioPlaybackCaptureConfig(captureConfig)
                .setAudioFormat(format)
                .setBufferSizeInBytes(bufferSize)
                .build()
        }

        micRecord?.startRecording()
        internalRecord?.startRecording()

        isRecording = true
        captureJob = CoroutineScope(Dispatchers.IO).launch {
            val chunkSize = 1024 * 2 // Stereo samples per iteration
            val micBuffer = ShortArray(chunkSize)
            val sysBuffer = ShortArray(chunkSize)
            val mixedBuffer = ShortArray(chunkSize)

            while (isActive && isRecording) {
                val micRead = micRecord?.read(micBuffer, 0, chunkSize) ?: 0
                val sysRead = internalRecord?.read(sysBuffer, 0, chunkSize) ?: 0

                // Mix in native C++ pipeline
                nativeMixTracks(
                    micBuffer, if (micRead > 0) micRead else 0,
                    sysBuffer, if (sysRead > 0) sysRead else 0,
                    mixedBuffer, chunkSize
                )

                val presentationTimeUs = System.nanoTime() / 1000L
                audioEncoder.queueInputBuffer(mixedBuffer, chunkSize, presentationTimeUs)
            }
        }
    }

    fun stop() {
        isRecording = false
        captureJob?.cancel()
        micRecord?.run {
            stop()
            release()
        }
        internalRecord?.run {
            stop()
            release()
        }
        micRecord = null
        internalRecord = null
    }
}