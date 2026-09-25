package com.obsproject.mobile.media

import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import kotlinx.coroutines.*
import java.nio.ByteBuffer

class AudioEncoderCore(
    private val sampleRate: Int = 48000,
    private val channelCount: Int = 2,
    private val bitrate: Int = 128 * 1000,
    private val onEncodedFrame: (ByteBuffer, MediaCodec.BufferInfo) -> Unit
) {
    private var mediaCodec: MediaCodec? = null
    private var isEncoding = false
    private var drainJob: Job? = null

    fun start() {
        val format = MediaFormat.createAudioFormat(MediaFormat.MIMETYPE_AUDIO_AAC, sampleRate, channelCount).apply {
            setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
            setInteger(MediaFormat.KEY_BIT_RATE, bitrate)
            setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, 16384)
        }

        mediaCodec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_AUDIO_AAC).apply {
            configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            start()
        }

        isEncoding = true
        drainJob = CoroutineScope(Dispatchers.IO).launch {
            drain()
        }
    }

    fun queueInputBuffer(pcmData: ShortArray, size: Int, presentationTimeUs: Long) {
        val codec = mediaCodec ?: return
        if (!isEncoding) return

        val inputIndex = codec.dequeueInputBuffer(10000)
        if (inputIndex >= 0) {
            val inputBuffer = codec.getInputBuffer(inputIndex) ?: return
            inputBuffer.clear()
            val byteBuffer = ByteBuffer.allocate(size * 2).order(java.nio.ByteOrder.LITTLE_ENDIAN)
            for (i in 0 until size) {
                byteBuffer.putShort(pcmData[i])
            }
            byteBuffer.flip()
            inputBuffer.put(byteBuffer)
            codec.queueInputBuffer(inputIndex, 0, size * 2, presentationTimeUs, 0)
        }
    }

    private fun drain() {
        val bufferInfo = MediaCodec.BufferInfo()
        val codec = mediaCodec ?: return

        while (isEncoding) {
            val outputIndex = codec.dequeueOutputBuffer(bufferInfo, 10000)
            when {
                outputIndex >= 0 -> {
                    val outputBuffer = codec.getOutputBuffer(outputIndex)
                    if (outputBuffer != null && bufferInfo.size > 0) {
                        outputBuffer.position(bufferInfo.offset)
                        outputBuffer.limit(bufferInfo.offset + bufferInfo.size)
                        onEncodedFrame(outputBuffer, bufferInfo)
                    }
                    codec.releaseOutputBuffer(outputIndex, false)
                }
                outputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                    // Audio specific config (ASC) sent to FLV multiplexer
                }
            }
        }
    }

    fun stop() {
        isEncoding = false
        drainJob?.cancel()
        mediaCodec?.run {
            stop()
            release()
        }
        mediaCodec = null
    }
}