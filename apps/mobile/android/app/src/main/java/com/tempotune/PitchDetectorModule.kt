package com.tempotune

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlin.math.log2
import kotlin.math.roundToInt

class PitchDetectorModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "PitchDetectorModule"
        private const val SAMPLE_RATE = 44100
        private const val BUFFER_SIZE = 2048
        private const val YIN_THRESHOLD = 0.15f
        private const val YIN_PROBABILITY_THRESHOLD = 0.1f
        private const val REFERENCE_FREQUENCY = 440.0
    }

    private val noteNames = arrayOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")

    private var audioRecord: AudioRecord? = null
    private var recordThread: Thread? = null
    @Volatile private var isListening = false
    private var detectionSequence: Long = 0
    private var hasListeners = false

    override fun getName(): String = "PitchDetectorModule"

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
    fun startListening() {
        if (isListening) return

        // Check permission
        if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            val params = Arguments.createMap().apply {
                putString("message", "Microphone permission not granted")
            }
            sendEvent("onPitchError", params)
            return
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
                val params = Arguments.createMap().apply {
                    putString("message", "Failed to initialize AudioRecord")
                }
                sendEvent("onPitchError", params)
                return
            }

            record.startRecording()
            audioRecord = record
            isListening = true

            recordThread = Thread({
                processAudioLoop(record)
            }, "PitchDetectorThread").apply {
                priority = Thread.MAX_PRIORITY
                start()
            }
        } catch (e: Exception) {
            val params = Arguments.createMap().apply {
                putString("message", e.message ?: "Failed to start audio recording")
            }
            sendEvent("onPitchError", params)
        }
    }

    @ReactMethod
    fun stopListening() {
        if (!isListening) return
        isListening = false

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
    }

    private fun processAudioLoop(record: AudioRecord) {
        val buffer = FloatArray(BUFFER_SIZE)

        try {
            while (isListening && record.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                val read = record.read(buffer, 0, BUFFER_SIZE, AudioRecord.READ_BLOCKING)
                if (read <= 0) continue
                if (read < BUFFER_SIZE) continue

                val result = yinDetect(buffer) ?: continue
                val detectedAtMs = System.currentTimeMillis()
                detectionSequence++

                val note = frequencyToNote(result.frequency)

                val params = Arguments.createMap().apply {
                    putDouble("frequency", result.frequency)
                    putDouble("probability", result.probability)
                    putDouble("confidence", result.probability)
                    putString("name", note.name)
                    putInt("octave", note.octave)
                    putInt("cents", note.cents)
                    putDouble("detectedAtMs", detectedAtMs.toDouble())
                    putDouble("debugSeq", detectionSequence.toDouble())
                    putString("debugSource", "native")
                }

                reactContext.runOnJSQueueThread {
                    sendEvent("onPitchDetected", params)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Audio processing error: ${e.message}")
        }
    }

    // YIN Pitch Detection Algorithm
    private data class PitchResult(val frequency: Double, val probability: Double)
    private data class NoteInfo(val name: String, val octave: Int, val cents: Int)

    private fun yinDetect(audioData: FloatArray): PitchResult? {
        val halfBuffer = audioData.size / 2
        val yinBuffer = FloatArray(halfBuffer)

        // Step 1: Difference function
        for (tau in 0 until halfBuffer) {
            for (i in 0 until halfBuffer) {
                val delta = audioData[i] - audioData[i + tau]
                yinBuffer[tau] += delta * delta
            }
        }

        // Step 2: Cumulative mean normalized difference
        yinBuffer[0] = 1f
        var runningSum = 0f
        for (tau in 1 until halfBuffer) {
            runningSum += yinBuffer[tau]
            yinBuffer[tau] = (yinBuffer[tau] * tau) / runningSum
        }

        // Step 3: Absolute threshold
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

        // Step 4: Parabolic interpolation
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
