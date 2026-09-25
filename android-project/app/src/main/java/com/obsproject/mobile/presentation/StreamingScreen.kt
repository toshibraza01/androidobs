package com.obsproject.mobile.presentation

import android.view.SurfaceHolder
import android.view.SurfaceView
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StreamingScreen(
    isStreaming: Boolean,
    micVolume: Float,
    sysVolume: Float,
    onStartStream: (android.view.Surface) -> Unit,
    onStopStream: () -> Unit,
    onMicVolumeChange: (Float) -> Unit,
    onSysVolumeChange: (Float) -> Unit,
    onSourceTransformChange: (x: Float, y: Float) -> Unit
) {
    var previewSurface by remember { mutableStateOf<android.view.Surface?>(null) }
    var showMixerSheet by remember { mutableStateOf(false) }

    // PIP Source Coordinates State
    var pipOffsetX by remember { mutableFloatStateOf(100f) }
    var pipOffsetY by remember { mutableFloatStateOf(100f) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("OBS Mobile", fontSize = 18.sp, fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF111111),
                    titleContentColor = Color.White
                ),
                actions = {
                    if (isStreaming) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(end = 12.dp)
                        ) {
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Color.Red))
                            Spacer(Modifier.width(6.dp))
                            Text("LIVE", color = Color.Red, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            )
        },
        bottomBar = {
            Surface(color = Color(0xFF141414)) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { showMixerSheet = true },
                        modifier = Modifier.background(Color(0xFF222222), RoundedCornerShape(8.dp))
                    ) {
                        Icon(Icons.Default.GraphicEq, contentDescription = "Audio Mixer", tint = Color.White)
                    }

                    Button(
                        onClick = {
                            if (isStreaming) onStopStream()
                            else previewSurface?.let { onStartStream(it) }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isStreaming) Color(0xFFCC0000) else Color(0xFF00AA44)
                        ),
                        modifier = Modifier.height(48.dp).weight(1f).padding(horizontal = 16.dp)
                    ) {
                        Text(
                            if (isStreaming) "END STREAM" else "GO LIVE",
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }

                    IconButton(
                        onClick = { /* Open Scene/Source Settings */ },
                        modifier = Modifier.background(Color(0xFF222222), RoundedCornerShape(8.dp))
                    ) {
                        Icon(Icons.Default.Layers, contentDescription = "Scenes", tint = Color.White)
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color.Black)
        ) {
            // 1. OpenGL Composite Preview SurfaceView
            AndroidView(
                factory = { ctx ->
                    SurfaceView(ctx).apply {
                        holder.addCallback(object : SurfaceHolder.Callback {
                            override fun surfaceCreated(holder: SurfaceHolder) {
                                previewSurface = holder.surface
                            }
                            override fun surfaceChanged(holder: SurfaceHolder, format: Int, w: Int, h: Int) {}
                            override fun surfaceDestroyed(holder: SurfaceHolder) {
                                previewSurface = null
                            }
                        })
                    }
                },
                modifier = Modifier.fillMaxSize()
            )

            // 2. Interactive Gesture Draggable Box (Picture-in-Picture manipulation)
            Box(
                modifier = Modifier
                    .offset { IntOffset(pipOffsetX.roundToInt(), pipOffsetY.roundToInt()) }
                    .size(160.dp, 90.dp)
                    .background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                    .pointerInput(Unit) {
                        detectDragGestures { change, dragAmount ->
                            change.consume()
                            pipOffsetX += dragAmount.x
                            pipOffsetY += dragAmount.y
                            onSourceTransformChange(pipOffsetX, pipOffsetY)
                        }
                    }
            ) {
                Text(
                    "PIP Source (Drag)",
                    color = Color.White,
                    fontSize = 10.sp,
                    modifier = Modifier.align(Alignment.Center)
                )
            }
        }

        // Bottom Sheet: Audio Mixer
        if (showMixerSheet) {
            ModalBottomSheet(
                onDismissRequest = { showMixerSheet = false },
                containerColor = Color(0xFF1E1E1E)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text("Audio Mixer", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(16.dp))

                    Text("Microphone Gain: ${(micVolume * 100).toInt()}%", color = Color.Gray, fontSize = 12.sp)
                    Slider(
                        value = micVolume,
                        onValueChange = onMicVolumeChange,
                        valueRange = 0f..1.5f,
                        colors = SliderDefaults.colors(thumbColor = Color.White, activeTrackColor = Color(0xFF4A90E2))
                    )

                    Spacer(Modifier.height(12.dp))

                    Text("Internal Audio Gain: ${(sysVolume * 100).toInt()}%", color = Color.Gray, fontSize = 12.sp)
                    Slider(
                        value = sysVolume,
                        onValueChange = onSysVolumeChange,
                        valueRange = 0f..1.5f,
                        colors = SliderDefaults.colors(thumbColor = Color.White, activeTrackColor = Color(0xFF4A90E2))
                    )
                }
            }
        }
    }
}