package com.tempotune

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.os.Handler
import android.os.Looper
import kotlin.math.PI
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

class MetronomeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "MetronomeModule"

        /** Static reference for BroadcastReceiver / Widget / MediaSession access. */
        @Volatile
        var instance: MetronomeModule? = null
            private set
    }

    init {
        instance = this
        MetronomeState.init(reactContext)
    }

    override fun getName(): String = "MetronomeModule"

    // State
    @Volatile private var isPlaying = false
    @Volatile private var bpm: Double = 120.0
    @Volatile private var beatsPerMeasure: Int = 4
    private var beatDenominator: Int = 4
    @Volatile private var accentFirst: Boolean = true
    private var currentBeat: Int = 0

    // Audio render state
    private val sampleRate = 44100
    private val toneDuration = 0.05 // 50ms sine wave
    private var audioTrack: AudioTrack? = null
    private var audioThread: Thread? = null

    // Throttle for foreground service updates
    private val mainHandler = Handler(Looper.getMainLooper())
    private var pendingServiceUpdate: Runnable? = null
    private var pendingStateEmit: Runnable? = null
    private val SERVICE_THROTTLE_MS = 300L

    // Event emission
    private var hasListeners = false

    /** Expose playing state for external callers (MediaSession, etc.) */
    fun isCurrentlyPlaying(): Boolean = isPlaying

    private fun sendEvent(eventName: String, params: com.facebook.react.bridge.WritableMap?) {
        if (!hasListeners) return
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to emit event: ${e.message}")
        }
    }

    @ReactMethod
    fun addListener(@Suppress("UNUSED_PARAMETER") eventName: String) {
        hasListeners = true
    }

    @ReactMethod
    fun removeListeners(@Suppress("UNUSED_PARAMETER") count: Int) {
        hasListeners = false
    }

    @ReactMethod
    fun start(bpm: Double, beatsPerMeasure: Int, accentFirst: Boolean) {
        this.bpm = bpm
        this.beatsPerMeasure = beatsPerMeasure
        this.accentFirst = accentFirst
        this.currentBeat = 0
        this.isPlaying = true

        stopAudioThread()
        startAudioThread()

        syncState()
        MetronomeForegroundService.start(reactContext)
        emitStateChanged()
    }

    @ReactMethod
    fun stop() {
        isPlaying = false
        stopAudioThread()

        currentBeat = 0

        pendingServiceUpdate?.let { mainHandler.removeCallbacks(it) }
        pendingStateEmit?.let { mainHandler.removeCallbacks(it) }
        syncState()
        MetronomeForegroundService.stop(reactContext)
        emitStateChanged()
    }

    @ReactMethod
    fun setBpm(bpm: Double) {
        this.bpm = bpm
        if (isPlaying) {
            throttleServiceUpdate()
        }
        throttleStateEmit()
    }

    @ReactMethod
    fun setTimeSignature(beatsPerMeasure: Int) {
        this.beatsPerMeasure = beatsPerMeasure
        this.currentBeat = 0
        if (isPlaying) {
            syncState()
            MetronomeNotificationManager.update(reactContext)
            MetronomeWidgetProvider.updateAll(reactContext)
            MetronomeMediaSessionManager.updateState()
        }
    }

    // ── Public action methods (called from BroadcastReceiver, Widget, MediaSession) ──

    fun actionToggle() {
        if (isPlaying) {
            stop()
        } else {
            start(bpm, beatsPerMeasure, accentFirst)
        }
    }

    fun actionIncreaseBpm(delta: Int) {
        val newBpm = min(300.0, bpm + delta)
        this.bpm = newBpm
        syncState()
        MetronomeNotificationManager.update(reactContext)
        MetronomeWidgetProvider.updateAll(reactContext)
        MetronomeMediaSessionManager.updateState()
        emitStateChanged()
    }

    fun actionDecreaseBpm(delta: Int) {
        val newBpm = max(20.0, bpm - delta)
        this.bpm = newBpm
        syncState()
        MetronomeNotificationManager.update(reactContext)
        MetronomeWidgetProvider.updateAll(reactContext)
        MetronomeMediaSessionManager.updateState()
        emitStateChanged()
    }

    fun actionSetTimeSignature(beats: Int, denominator: Int) {
        this.beatsPerMeasure = beats
        this.beatDenominator = denominator
        this.currentBeat = 0
        syncState()
        MetronomeNotificationManager.update(reactContext)
        MetronomeWidgetProvider.updateAll(reactContext)
        MetronomeMediaSessionManager.updateState()
        emitStateChanged()
    }

    // ── Sync state to SharedPreferences / Notification / Widget / MediaSession ──

    private fun syncState() {
        MetronomeState.bpm = bpm.toInt()
        MetronomeState.beatsPerMeasure = beatsPerMeasure
        MetronomeState.beatDenominator = beatDenominator
        MetronomeState.isPlaying = isPlaying
    }

    // Audio thread: generates sine wave clicks via AudioTrack
    private fun startAudioThread() {
        val minBufSize = AudioTrack.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )

        val builder = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setSampleRate(sampleRate)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .build()
            )
            .setBufferSizeInBytes(minBufSize)
            .setTransferMode(AudioTrack.MODE_STREAM)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder.setPerformanceMode(AudioTrack.PERFORMANCE_MODE_LOW_LATENCY)
        }

        val track = builder.build()
        track.play()
        audioTrack = track

        audioThread = Thread({
            android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_URGENT_AUDIO)
            renderAudioLoop(track)
        }, "MetronomeAudioThread").apply {
            start()
        }
    }

    private fun renderAudioLoop(track: AudioTrack) {
        val chunkFrames = 256
        val buffer = ShortArray(chunkFrames)
        var sampleTime: Long = 0
        var lastEmittedBeat: Long = -1

        try {
            while (isPlaying && track.state == AudioTrack.STATE_INITIALIZED) {
                val spb = (sampleRate * 60.0 / bpm).toLong()
                val tf = (sampleRate * toneDuration).toLong()
                val bpMeasure = beatsPerMeasure
                val accent = accentFirst
                val sr = sampleRate.toDouble()

                if (spb <= 0) {
                    buffer.fill(0)
                    track.write(buffer, 0, chunkFrames)
                    sampleTime += chunkFrames
                    continue
                }

                var newBeatDetected = false
                var detectedBeatIndex = 0
                var detectedIsAccent = false

                for (i in 0 until chunkFrames) {
                    val currentSample = sampleTime + i
                    val posInBeat = currentSample % spb

                    if (posInBeat < tf) {
                        val globalBeat = currentSample / spb
                        val beatIdx = (globalBeat % bpMeasure).toInt()
                        val isAcc = accent && beatIdx == 0
                        val freq = if (isAcc) 1000.0 else 800.0
                        val t = posInBeat.toDouble() / sr

                        val fadeSamples = (sr * 0.005).toLong()
                        val envelope: Float = when {
                            posInBeat < fadeSamples -> posInBeat.toFloat() / fadeSamples.toFloat()
                            posInBeat > tf - fadeSamples -> (tf - posInBeat).toFloat() / fadeSamples.toFloat()
                            else -> 1.0f
                        }

                        val sample = (sin(2.0 * PI * freq * t) * 0.8 * envelope).toFloat()
                        buffer[i] = (sample * Short.MAX_VALUE).toInt().toShort()

                        if (posInBeat == 0L) {
                            val beatNum = currentSample / spb
                            if (beatNum > lastEmittedBeat) {
                                lastEmittedBeat = beatNum
                                newBeatDetected = true
                                detectedBeatIndex = beatIdx
                                detectedIsAccent = isAcc
                            }
                        }
                    } else {
                        buffer[i] = 0
                    }
                }

                sampleTime += chunkFrames

                // write() blocks until buffer space is available — tick emits after write
                // so the event is closer to actual playback time
                val written = track.write(buffer, 0, chunkFrames)
                if (written < 0) break

                if (newBeatDetected) {
                    val beatIdx = detectedBeatIndex
                    val isAcc = detectedIsAccent
                    currentBeat = beatIdx
                    reactContext.runOnJSQueueThread {
                        emitTick(beatIdx, isAcc)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Audio render error: ${e.message}")
        }
    }

    private fun stopAudioThread() {
        audioThread?.let { thread ->
            try {
                thread.join(500)
                if (thread.isAlive) thread.interrupt()
            } catch (_: InterruptedException) {}
        }
        audioThread = null

        audioTrack?.let { track ->
            try {
                if (track.state == AudioTrack.STATE_INITIALIZED) {
                    track.stop()
                    track.release()
                }
            } catch (_: Exception) {}
        }
        audioTrack = null
    }

    // Tick emission
    private fun emitTick(beatIndex: Int, isAccent: Boolean) {
        val params = Arguments.createMap().apply {
            putInt("beatIndex", beatIndex)
            putBoolean("isAccent", isAccent)
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }
        sendEvent("onMetronomeTick", params)
    }

    private fun emitStateChanged() {
        val params = Arguments.createMap().apply {
            putBoolean("isPlaying", isPlaying)
            putDouble("bpm", bpm)
            putInt("beatsPerMeasure", beatsPerMeasure)
        }
        sendEvent("onMetronomeStateChanged", params)
    }

    private fun throttleServiceUpdate() {
        pendingServiceUpdate?.let { mainHandler.removeCallbacks(it) }
        pendingServiceUpdate = Runnable {
            if (isPlaying) {
                syncState()
                MetronomeNotificationManager.update(reactContext)
                MetronomeWidgetProvider.updateAll(reactContext)
                MetronomeMediaSessionManager.updateState()
            }
        }.also { mainHandler.postDelayed(it, SERVICE_THROTTLE_MS) }
    }

    private fun throttleStateEmit() {
        pendingStateEmit?.let { mainHandler.removeCallbacks(it) }
        pendingStateEmit = Runnable {
            emitStateChanged()
        }.also { mainHandler.postDelayed(it, SERVICE_THROTTLE_MS) }
    }
}
