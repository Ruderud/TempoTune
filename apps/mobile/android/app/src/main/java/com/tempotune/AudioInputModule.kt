package com.tempotune

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.net.HttpURLConnection
import java.net.URL
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.abs
import kotlin.math.log2
import kotlin.math.roundToInt
import kotlin.math.sqrt

class AudioInputModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "AudioInputModule"
        private const val SAMPLE_RATE = 44100
        private const val BUFFER_SIZE = 2048
        private const val YIN_THRESHOLD = 0.15f
        private const val YIN_PROBABILITY_THRESHOLD = 0.1f
        private const val REFERENCE_FREQUENCY = 440.0
        private const val RHYTHM_RMS_THRESHOLD = 0.02f
        private const val RHYTHM_FLUX_THRESHOLD_MULTIPLIER = 1.5f
        private const val RHYTHM_REFRACTORY_MS = 80.0
        private const val RHYTHM_ADAPTIVE_WINDOW = 10
    }

    private val noteNames = arrayOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")

    private var audioRecord: AudioRecord? = null
    private var recordThread: Thread? = null
    @Volatile private var isCapturing = false
    private var detectionSequence: Long = 0
    private var hasListeners = false
    private var selectedDeviceId: Int? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    @Volatile private var enablePitchDetection = true
    @Volatile private var enableRhythmDetection = false
    @Volatile private var qaSampleSource: QaSampleSource? = null
    private var lastRhythmOnsetAtMs = 0.0
    private var fluxHistory = ArrayDeque<Float>()
    private var previousEnergy: FloatArray? = null

    private data class QaSampleSource(val url: String, val loop: Boolean)
    private data class WavSample(
        val sampleRate: Int,
        val channelCount: Int,
        val samples: FloatArray,
    )

    private val deviceCallback = object : AudioDeviceCallback() {
        override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>) {
            emitRouteChanged()
        }
        override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>) {
            emitRouteChanged()
        }
    }

    override fun getName(): String = "AudioInputModule"

    override fun initialize() {
        super.initialize()
        val audioManager = reactContext.getSystemService(AudioManager::class.java)
        audioManager?.registerAudioDeviceCallback(deviceCallback, mainHandler)
    }

    override fun invalidate() {
        val audioManager = reactContext.getSystemService(AudioManager::class.java)
        audioManager?.unregisterAudioDeviceCallback(deviceCallback)
        stopCapture()
        super.invalidate()
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
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

    // MARK: - Device Enumeration

    @ReactMethod
    fun listInputDevices() {
        val audioManager = reactContext.getSystemService(AudioManager::class.java) ?: return
        val devices = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)
        val result = Arguments.createMap()
        val devicesArray = Arguments.createArray()

        for (device in devices) {
            devicesArray.pushMap(deviceInfoToMap(device))
        }

        result.putArray("devices", devicesArray)
        sendEvent("onAudioInputDevicesResponse", result)
    }

    @ReactMethod
    fun getSelectedInputDevice() {
        val result = Arguments.createMap()
        val audioManager = reactContext.getSystemService(AudioManager::class.java)
        val devices = audioManager?.getDevices(AudioManager.GET_DEVICES_INPUTS)
        val selected = selectedDeviceId?.let { id ->
            devices?.firstOrNull { it.id == id }
        }

        if (selected != null) {
            result.putMap("device", deviceInfoToMap(selected))
        } else {
            result.putNull("device")
        }

        sendEvent("onSelectedAudioInputDeviceResponse", result)
    }

    @ReactMethod
    fun selectInputDevice(deviceId: String) {
        selectedDeviceId = deviceId.toIntOrNull()
    }

    @ReactMethod
    fun configureAnalyzers(config: ReadableMap) {
        enablePitchDetection = if (config.hasKey("enablePitch")) config.getBoolean("enablePitch") else enablePitchDetection
        enableRhythmDetection = if (config.hasKey("enableRhythm")) config.getBoolean("enableRhythm") else enableRhythmDetection
        if (!enableRhythmDetection) {
            resetRhythmDetector()
        }
    }

    @ReactMethod
    fun setQaSampleSource(config: ReadableMap) {
        val url = config.getString("url")?.trim()
        if (url.isNullOrEmpty()) {
            qaSampleSource = null
            return
        }
        val loop = if (config.hasKey("loop")) config.getBoolean("loop") else true
        qaSampleSource = QaSampleSource(url = url, loop = loop)
    }

    @ReactMethod
    fun clearQaSampleSource() {
        qaSampleSource = null
    }

    // MARK: - Capture

    @ReactMethod
    fun startCapture(config: ReadableMap) {
        if (isCapturing) return

        emitStateChanged("starting")

        enablePitchDetection = if (config.hasKey("enablePitch")) config.getBoolean("enablePitch") else true
        enableRhythmDetection = if (config.hasKey("enableRhythm")) config.getBoolean("enableRhythm") else false
        resetRhythmDetector()

        qaSampleSource?.let { sampleSource ->
            startQaSampleCapture(sampleSource)
            return
        }

        if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            emitStateChanged("error", errorMessage = "Microphone permission not granted")
            return
        }

        // Apply deviceId from config if provided
        if (config.hasKey("deviceId")) {
            val configDeviceId = config.getString("deviceId")
            if (configDeviceId != null && configDeviceId != "default") {
                selectedDeviceId = configDeviceId.toIntOrNull()
            }
        }

        val minBufferSize = AudioRecord.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_FLOAT
        )

        try {
            val record = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_FLOAT,
                maxOf(minBufferSize, BUFFER_SIZE * 4)
            )

            if (record.state != AudioRecord.STATE_INITIALIZED) {
                emitStateChanged("error", errorMessage = "Failed to initialize AudioRecord")
                return
            }

            // Set preferred device if selected
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                selectedDeviceId?.let { id ->
                    val audioManager = reactContext.getSystemService(AudioManager::class.java)
                    val device = audioManager?.getDevices(AudioManager.GET_DEVICES_INPUTS)
                        ?.firstOrNull { it.id == id }
                    if (device != null) {
                        record.setPreferredDevice(device)
                    }
                }
            }

            record.startRecording()
            audioRecord = record
            isCapturing = true

            val monotonicMs = SystemClock.elapsedRealtime().toDouble()
            emitStateChanged("running", extra = mapOf(
                "sampleRate" to SAMPLE_RATE,
                "channelCount" to 1,
                "startedAtMonotonicMs" to monotonicMs,
            ))

            recordThread = Thread({
                    processAudioLoop(record)
                }, "AudioInputThread").apply {
                priority = Thread.MAX_PRIORITY
                start()
            }
        } catch (e: Exception) {
            emitStateChanged("error", errorMessage = e.message ?: "Failed to start capture")
        }
    }

    @ReactMethod
    fun stopCapture() {
        if (!isCapturing) return
        isCapturing = false

        recordThread?.let { thread ->
            try {
                thread.join(500)
                if (thread.isAlive) thread.interrupt()
            } catch (_: InterruptedException) {}
        }
        recordThread = null

        audioRecord?.let { record ->
            try {
                record.stop()
                record.release()
            } catch (_: Exception) {}
        }
        audioRecord = null
        resetRhythmDetector()

        emitStateChanged("idle")
    }

    // MARK: - Audio Processing

    private fun processAudioLoop(record: AudioRecord) {
        val buffer = FloatArray(BUFFER_SIZE)

        try {
            while (isCapturing && record.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                val read = record.read(buffer, 0, BUFFER_SIZE, AudioRecord.READ_BLOCKING)
                if (read <= 0 || read < BUFFER_SIZE) continue

                processDetectionFrame(buffer)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Audio processing error: ${e.message}")
        }
    }

    private fun startQaSampleCapture(sampleSource: QaSampleSource) {
        isCapturing = true
        recordThread = Thread({
            try {
                val sample = loadWavSample(sampleSource.url)
                val monotonicMs = SystemClock.elapsedRealtime().toDouble()

                emitStateChanged("running", extra = mapOf(
                    "deviceId" to "qa-sample",
                    "sampleRate" to sample.sampleRate,
                    "channelCount" to sample.channelCount,
                    "startedAtMonotonicMs" to monotonicMs,
                ))

                processQaSampleLoop(sample, sampleSource.loop)
            } catch (e: Exception) {
                Log.e(TAG, "QA sample capture error: ${e.message}", e)
                emitStateChanged("error", errorMessage = e.message ?: "Failed to load QA sample")
                isCapturing = false
            }
        }, "AudioInputQaSampleThread").apply {
            priority = Thread.MAX_PRIORITY
            start()
        }
    }

    private fun processQaSampleLoop(sample: WavSample, loop: Boolean) {
        val frameDurationNanos =
            ((BUFFER_SIZE.toDouble() / sample.sampleRate.toDouble()) * 1_000_000_000.0).toLong()
        val buffer = FloatArray(BUFFER_SIZE)
        var cursor = 0
        var nextFrameAtNanos = SystemClock.elapsedRealtimeNanos()

        while (isCapturing) {
            if (cursor >= sample.samples.size) {
                if (loop) {
                    cursor = 0
                    resetRhythmDetector()
                }
            }

            buffer.fill(0f)
            val remaining = sample.samples.size - cursor
            val copyLength = minOf(BUFFER_SIZE, remaining)
            if (copyLength > 0) {
                System.arraycopy(sample.samples, cursor, buffer, 0, copyLength)
                cursor += copyLength
            }

            processDetectionFrame(buffer)

            nextFrameAtNanos += frameDurationNanos
            sleepUntil(nextFrameAtNanos)
        }
    }

    private fun processDetectionFrame(buffer: FloatArray) {
        if (enablePitchDetection) {
            val result = yinDetect(buffer)
            if (result != null) {
                emitPitchDetected(result)
            }
        }

        if (enableRhythmDetection) {
            detectRhythmHit(buffer)
        }
    }

    private fun emitPitchDetected(result: PitchResult) {
        val monotonicMs = SystemClock.elapsedRealtime().toDouble()
        detectionSequence++

        val note = frequencyToNote(result.frequency)

        val params = Arguments.createMap().apply {
            putDouble("frequency", result.frequency)
            putDouble("confidence", result.probability)
            putString("name", note.name)
            putInt("octave", note.octave)
            putInt("cents", note.cents)
            putDouble("detectedAtMonotonicMs", monotonicMs)
            putDouble("debugSeq", detectionSequence.toDouble())
            putString("debugSource", "native")
        }

        reactContext.runOnJSQueueThread {
            sendEvent("onPitchDetected", params)
        }
    }

    private fun sleepUntil(targetNanos: Long) {
        val remaining = targetNanos - SystemClock.elapsedRealtimeNanos()
        if (remaining <= 0) return
        try {
            Thread.sleep(remaining / 1_000_000L, (remaining % 1_000_000L).toInt())
        } catch (_: InterruptedException) {
            Thread.currentThread().interrupt()
        }
    }

    // MARK: - Helpers

    private fun loadWavSample(urlString: String): WavSample {
        val connection = (URL(urlString).openConnection() as HttpURLConnection).apply {
            connectTimeout = 5_000
            readTimeout = 10_000
            requestMethod = "GET"
        }

        connection.connect()
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException("Failed to download QA sample: HTTP ${connection.responseCode}")
        }

        val bytes = connection.inputStream.use { it.readBytes() }
        connection.disconnect()
        return parseWav(bytes)
    }

    private fun parseWav(bytes: ByteArray): WavSample {
        if (bytes.size < 44) {
            throw IllegalArgumentException("QA sample is too small to be a WAV file")
        }
        if (String(bytes, 0, 4) != "RIFF" || String(bytes, 8, 4) != "WAVE") {
            throw IllegalArgumentException("QA sample must be a RIFF/WAVE file")
        }

        var fmtOffset = -1
        var fmtSize = 0
        var dataOffset = -1
        var dataSize = 0
        var offset = 12

        while (offset + 8 <= bytes.size) {
            val chunkId = String(bytes, offset, 4)
            val chunkSize = readIntLe(bytes, offset + 4)
            val chunkDataOffset = offset + 8
            when (chunkId) {
                "fmt " -> {
                    fmtOffset = chunkDataOffset
                    fmtSize = chunkSize
                }
                "data" -> {
                    dataOffset = chunkDataOffset
                    dataSize = chunkSize
                }
            }

            val paddedChunkSize = chunkSize + (chunkSize and 1)
            offset = chunkDataOffset + paddedChunkSize
        }

        if (fmtOffset < 0 || dataOffset < 0 || fmtSize < 16) {
            throw IllegalArgumentException("QA sample is missing fmt/data WAV chunks")
        }

        val audioFormat = readShortLe(bytes, fmtOffset).toInt() and 0xFFFF
        val channelCount = readShortLe(bytes, fmtOffset + 2).toInt() and 0xFFFF
        val sampleRate = readIntLe(bytes, fmtOffset + 4)
        val bitsPerSample = readShortLe(bytes, fmtOffset + 14).toInt() and 0xFFFF

        if (audioFormat != 1 || bitsPerSample != 16) {
            throw IllegalArgumentException("QA sample must be 16-bit PCM WAV")
        }
        if (channelCount <= 0) {
            throw IllegalArgumentException("QA sample channel count is invalid")
        }

        val frameCount = dataSize / (channelCount * 2)
        val samples = FloatArray(frameCount)
        var sampleOffset = dataOffset
        for (frame in 0 until frameCount) {
            var mixed = 0f
            for (channel in 0 until channelCount) {
                val raw = readShortLe(bytes, sampleOffset)
                mixed += raw / 32768f
                sampleOffset += 2
            }
            samples[frame] = mixed / channelCount.toFloat()
        }

        return WavSample(
            sampleRate = sampleRate,
            channelCount = 1,
            samples = samples,
        )
    }

    private fun readShortLe(bytes: ByteArray, offset: Int): Short {
        return ByteBuffer.wrap(bytes, offset, 2)
            .order(ByteOrder.LITTLE_ENDIAN)
            .short
    }

    private fun readIntLe(bytes: ByteArray, offset: Int): Int {
        return ByteBuffer.wrap(bytes, offset, 4)
            .order(ByteOrder.LITTLE_ENDIAN)
            .int
    }

    private fun deviceInfoToMap(device: AudioDeviceInfo): WritableMap {
        return Arguments.createMap().apply {
            putString("id", device.id.toString())
            putString("label", device.productName?.toString() ?: "Unknown")
            putString("transport", classifyTransport(device.type))
            putString("platformKind", device.type.toString())
            putInt("channelCount", maxOf(device.channelCounts.firstOrNull() ?: 1, 1))
            putArray("sampleRates", Arguments.createArray().apply {
                device.sampleRates.forEach { pushInt(it) }
                if (device.sampleRates.isEmpty()) {
                    pushInt(44100)
                    pushInt(48000)
                }
            })
            putBoolean("isDefault", false)
            putBoolean("isAvailable", true)
        }
    }

    private fun classifyTransport(type: Int): String {
        return when (type) {
            AudioDeviceInfo.TYPE_USB_DEVICE, AudioDeviceInfo.TYPE_USB_HEADSET -> "usb"
            AudioDeviceInfo.TYPE_BLUETOOTH_A2DP, AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> "bluetooth"
            AudioDeviceInfo.TYPE_WIRED_HEADSET, AudioDeviceInfo.TYPE_WIRED_HEADPHONES -> "wired"
            AudioDeviceInfo.TYPE_BUILTIN_MIC -> "built-in"
            else -> "unknown"
        }
    }

    private fun emitStateChanged(status: String, errorMessage: String? = null, extra: Map<String, Any>? = null) {
        val params = Arguments.createMap().apply {
            putString("status", status)
            putString("timestampSource", "monotonic")
            errorMessage?.let { putString("errorMessage", it) }
            extra?.forEach { (k, v) ->
                when (v) {
                    is Int -> putInt(k, v)
                    is Double -> putDouble(k, v)
                    is String -> putString(k, v)
                    is Boolean -> putBoolean(k, v)
                }
            }
        }
        sendEvent("onAudioInputStateChanged", params)
    }

    private fun emitRouteChanged() {
        val audioManager = reactContext.getSystemService(AudioManager::class.java) ?: return
        val devices = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)
        val result = Arguments.createMap()
        val devicesArray = Arguments.createArray()
        for (device in devices) {
            devicesArray.pushMap(deviceInfoToMap(device))
        }
        result.putArray("devices", devicesArray)
        sendEvent("onAudioInputRouteChanged", result)
    }

    private fun detectRhythmHit(buffer: FloatArray) {
        val onsetAtMs = detectOnset(buffer) ?: return
        val metronome = MetronomeModule.instance ?: return
        if (!metronome.isCurrentlyPlaying()) return

        val bpm = metronome.currentBpm()
        val lastBeatAtMs = metronome.currentBeatAtMonotonicMs()
        if (bpm <= 0.0 || lastBeatAtMs <= 0.0) return

        val beatIntervalMs = 60000.0 / bpm
        val nearestBeatAtMs =
            lastBeatAtMs + kotlin.math.round((onsetAtMs - lastBeatAtMs) / beatIntervalMs) * beatIntervalMs
        val offsetMs = onsetAtMs - nearestBeatAtMs
        val absOffsetMs = abs(offsetMs)
        val status = when {
            absOffsetMs <= 50.0 -> "on-time"
            offsetMs < 0 -> "early"
            else -> "late"
        }
        val confidence = maxOf(0.0, 1.0 - absOffsetMs / 200.0)

        val params = Arguments.createMap().apply {
            putDouble("detectedAtMonotonicMs", onsetAtMs)
            putDouble("nearestBeatAtMonotonicMs", nearestBeatAtMs)
            putDouble("offsetMs", offsetMs)
            putString("status", status)
            putDouble("confidence", confidence)
            putString("source", "unknown")
        }

        reactContext.runOnJSQueueThread {
            sendEvent("onRhythmHitDetected", params)
        }
    }

    private fun detectOnset(buffer: FloatArray): Double? {
        val nowMs = SystemClock.elapsedRealtime().toDouble()
        if (nowMs - lastRhythmOnsetAtMs < RHYTHM_REFRACTORY_MS) {
            return null
        }

        val rms = computeRms(buffer)
        if (rms < RHYTHM_RMS_THRESHOLD) {
            return null
        }

        val energy = computeEnergy(buffer)
        val flux = computeEnergyFlux(energy)
        fluxHistory.addLast(flux)
        while (fluxHistory.size > RHYTHM_ADAPTIVE_WINDOW) {
            fluxHistory.removeFirst()
        }

        var fluxSum = 0f
        for (value in fluxHistory) {
            fluxSum += value
        }
        val meanFlux = if (fluxHistory.isEmpty()) 0f else fluxSum / fluxHistory.size.toFloat()
        val threshold = meanFlux * RHYTHM_FLUX_THRESHOLD_MULTIPLIER
        previousEnergy = energy

        if (flux > threshold && flux > 0f) {
            lastRhythmOnsetAtMs = nowMs
            return nowMs
        }

        return null
    }

    private fun resetRhythmDetector() {
        lastRhythmOnsetAtMs = 0.0
        fluxHistory.clear()
        previousEnergy = null
    }

    private fun computeRms(buffer: FloatArray): Float {
        var sum = 0f
        for (sample in buffer) {
            sum += sample * sample
        }
        return sqrt(sum / buffer.size)
    }

    private fun computeEnergy(buffer: FloatArray): FloatArray {
        val step = 4
        val len = buffer.size / step
        val energy = FloatArray(len)
        for (i in 0 until len) {
            val base = i * step
            var value = 0f
            for (j in 0 until step) {
                val sample = buffer[base + j]
                value += sample * sample
            }
            energy[i] = value
        }
        return energy
    }

    private fun computeEnergyFlux(currentEnergy: FloatArray): Float {
        val previous = previousEnergy ?: return 0f
        if (previous.size != currentEnergy.size) {
            return 0f
        }

        var flux = 0f
        for (i in currentEnergy.indices) {
            val diff = currentEnergy[i] - previous[i]
            if (diff > 0f) {
                flux += diff
            }
        }
        return flux
    }

    // MARK: - YIN Pitch Detection

    private data class PitchResult(val frequency: Double, val probability: Double)
    private data class NoteInfo(val name: String, val octave: Int, val cents: Int)

    private fun yinDetect(audioData: FloatArray): PitchResult? {
        val halfBuffer = audioData.size / 2
        val yinBuffer = FloatArray(halfBuffer)

        for (tau in 0 until halfBuffer) {
            for (i in 0 until halfBuffer) {
                val delta = audioData[i] - audioData[i + tau]
                yinBuffer[tau] += delta * delta
            }
        }

        yinBuffer[0] = 1f
        var runningSum = 0f
        for (tau in 1 until halfBuffer) {
            runningSum += yinBuffer[tau]
            yinBuffer[tau] = (yinBuffer[tau] * tau) / runningSum
        }

        var tauEstimate = -1
        for (tau in 2 until halfBuffer) {
            if (yinBuffer[tau] < YIN_THRESHOLD) {
                var t = tau
                while (t + 1 < halfBuffer && yinBuffer[t + 1] < yinBuffer[t]) {
                    t++
                }
                tauEstimate = t
                break
            }
        }

        if (tauEstimate == -1) return null

        val betterTau: Double = if (tauEstimate > 0 && tauEstimate < halfBuffer - 1) {
            val s0 = yinBuffer[tauEstimate - 1].toDouble()
            val s1 = yinBuffer[tauEstimate].toDouble()
            val s2 = yinBuffer[tauEstimate + 1].toDouble()
            val adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0))
            tauEstimate.toDouble() + adjustment
        } else {
            tauEstimate.toDouble()
        }

        val frequency = SAMPLE_RATE.toDouble() / betterTau
        val probability = 1.0 - yinBuffer[tauEstimate].toDouble()

        if (probability < YIN_PROBABILITY_THRESHOLD) return null
        if (frequency < 20 || frequency > 5000) return null

        return PitchResult(frequency, probability)
    }

    private fun frequencyToNote(frequency: Double): NoteInfo {
        val semitones = 12.0 * log2(frequency / REFERENCE_FREQUENCY)
        val roundedSemitones = semitones.roundToInt()
        val cents = ((semitones - roundedSemitones) * 100).roundToInt()

        val midiNote = 69 + roundedSemitones
        val octave = midiNote / 12 - 1
        val noteIndex = ((midiNote % 12) + 12) % 12
        val name = noteNames[noteIndex]

        return NoteInfo(name, octave, cents)
    }
}
