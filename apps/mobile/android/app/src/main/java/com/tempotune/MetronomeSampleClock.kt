package com.tempotune

import kotlin.math.roundToLong

/**
 * Keeps metronome beat boundaries on an absolute fractional-sample timeline.
 * Rounding each deadline bounds quantization to half a sample instead of
 * discarding the fractional interval on every beat.
 */
internal class MetronomeSampleClock(startSample: Long = 0) {
    private var exactBeatSample = startSample.toDouble()

    val currentBeatSample: Long
        get() = exactBeatSample.roundToLong()

    fun nextBeatSample(samplesPerBeat: Double): Long =
        (exactBeatSample + samplesPerBeat).roundToLong()

    fun advance(samplesPerBeat: Double): Long {
        exactBeatSample += samplesPerBeat
        return currentBeatSample
    }
}
