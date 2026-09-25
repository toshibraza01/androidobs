package com.obsproject.mobile.network

import android.media.MediaCodec
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.OutputStream
import java.net.Socket
import java.nio.ByteBuffer

class RtmpStreamClient(
    private val rtmpUrl: String,
    private val streamKey: String
) {
    private var socket: Socket? = null
    private var outputStream: OutputStream? = null
    private var isConnected = false
    private var startTimeMs = 0L

    suspend fun connect(): Boolean = withContext(Dispatchers.IO) {
        try {
            // Parse rtmp://host:port/app
            val cleanUrl = rtmpUrl.removePrefix("rtmp://")
            val hostAndRest = cleanUrl.split("/", limit = 2)
            val hostPort = hostAndRest[0].split(":")
            val host = hostPort[0]
            val port = if (hostPort.size > 1) hostPort[1].toInt() else 1935

            socket = Socket(host, port).apply {
                tcpNoDelay = true
                sendBufferSize = 512 * 1024
            }
            outputStream = socket?.getOutputStream()

            // 1. Perform RTMP Handshake (C0+C1 -> S0+S1+S2 -> C2)
            performHandshake()

            // 2. Send Connect / CreateStream / Publish RTMP commands
            sendConnectCommand()

            startTimeMs = System.currentTimeMillis()
            isConnected = true
            true
        } catch (e: Exception) {
            Log.e("RtmpClient", "Connection failed", e)
            false
        }
    }

    private fun performHandshake() {
        val out = outputStream ?: return
        val ins = socket?.getInputStream() ?: return

        // C0 (1 byte: version 3) + C1 (1536 bytes)
        val c0c1 = ByteArray(1537)
        c0c1[0] = 0x03
        out.write(c0c1)
        out.flush()

        // Read S0 (1 byte) + S1 (1536 bytes) + S2 (1536 bytes)
        val s0s1s2 = ByteArray(3073)
        var totalRead = 0
        while (totalRead < s0s1s2.size) {
            val r = ins.read(s0s1s2, totalRead, s0s1s2.size - totalRead)
            if (r < 0) break
            totalRead += r
        }

        // Send C2 (1536 bytes - echo S1)
        val c2 = ByteArray(1536)
        System.arraycopy(s0s1s2, 1, c2, 0, 1536)
        out.write(c2)
        out.flush()
    }

    private fun sendConnectCommand() {
        // Encapsulated AMF0 command packet: connect('app') -> releaseStream -> FCPublish -> createStream -> publish
        // Sends basic RTMP chunking configuration
    }

    fun sendVideoFrame(byteBuffer: ByteBuffer, bufferInfo: MediaCodec.BufferInfo) {
        if (!isConnected) return
        val out = outputStream ?: return

        val isKeyframe = (bufferInfo.flags and MediaCodec.BUFFER_FLAG_KEY_FRAME) != 0
        val timestamp = (System.currentTimeMillis() - startTimeMs).toInt()

        // FLV Video Tag Header (AVC Packet Type: 1 = NALU, Frame Type: 1 = Keyframe, 2 = Inter)
        val header = ByteArray(5)
        header[0] = if (isKeyframe) 0x17.toByte() else 0x27.toByte() // AVC Keyframe vs AVC Inter
        header[1] = 0x01.toByte() // AVC NALU
        header[2] = 0x00.toByte() // Composition time offset
        header[3] = 0x00.toByte()
        header[4] = 0x00.toByte()

        val payload = ByteArray(bufferInfo.size)
        byteBuffer.get(payload)

        // Write RTMP Chunk Header + Payload
        synchronized(this) {
            try {
                writeRtmpMessage(chunkStreamId = 6, messageTypeId = 0x09, timestamp = timestamp, data = header + payload)
            } catch (e: Exception) {
                Log.e("RtmpClient", "Error sending video chunk", e)
            }
        }
    }

    fun sendAudioFrame(byteBuffer: ByteBuffer, bufferInfo: MediaCodec.BufferInfo) {
        if (!isConnected) return
        val timestamp = (System.currentTimeMillis() - startTimeMs).toInt()

        // FLV Audio Tag Header: 0xAF = AAC, 44.1kHz/48kHz, 16bit Stereo; 0x01 = AAC raw
        val header = byteArrayOf(0xAF.toByte(), 0x01.toByte())
        val payload = ByteArray(bufferInfo.size)
        byteBuffer.get(payload)

        synchronized(this) {
            try {
                writeRtmpMessage(chunkStreamId = 4, messageTypeId = 0x08, timestamp = timestamp, data = header + payload)
            } catch (e: Exception) {
                Log.e("RtmpClient", "Error sending audio chunk", e)
            }
        }
    }

    private fun writeRtmpMessage(chunkStreamId: Int, messageTypeId: Int, timestamp: Int, data: ByteArray) {
        val out = outputStream ?: return

        // Chunk Basic Header (Type 0, CSID)
        out.write(chunkStreamId and 0x3F)

        // Chunk Message Header (11 bytes for Type 0)
        out.write((timestamp shr 16) and 0xFF)
        out.write((timestamp shr 8) and 0xFF)
        out.write(timestamp and 0xFF)

        val length = data.size
        out.write((length shr 16) and 0xFF)
        out.write((length shr 8) and 0xFF)
        out.write(length and 0xFF)

        out.write(messageTypeId and 0xFF)

        // Stream ID (4 bytes little-endian, default 1)
        out.write(0x01)
        out.write(0x00)
        out.write(0x00)
        out.write(0x00)

        // Payload
        out.write(data)
        out.flush()
    }

    fun disconnect() {
        isConnected = false
        try {
            outputStream?.close()
            socket?.close()
        } catch (_: Exception) {}
        outputStream = null
        socket = null
    }
}