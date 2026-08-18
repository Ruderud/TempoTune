package com.tempotune

import kotlin.math.abs
import kotlin.math.floor
import org.junit.Assert.assertTrue
import org.junit.Test

class MetronomeSampleClockTest {
    @Test
    fun `awkward bpm stays within half a sample after six hours`() {
        val sampleRate = 44_100.0
        val bpm = 123.0
        val exactSamplesPerBeat = sampleRate * 60.0 / bpm
        val beatCount = (bpm * 60.0 * 6.0).toInt()
        val clock = MetronomeSampleClock()

        var maxSampleError = 0.0
        repeat(beatCount) { beatIndex ->
            val deadline = clock.currentBeatSample
            val ideal = beatIndex * exactSamplesPerBeat
            maxSampleError = maxOf(maxSampleError, abs(deadline - ideal))
            clock.advance(exactSamplesPerBeat)
        }

        assertTrue("sample error was $maxSampleError", maxSampleError <= 0.5)
    }

    @Test
    fun `regression guard catches the previous integer interval drift`() {
        val sampleRate = 44_100.0
        val bpm = 123.0
        val exactSamplesPerBeat = sampleRate * 60.0 / bpm
        val beatCount = (bpm * 60.0 * 6.0).toInt()
        val legacyDeadline = beatCount * floor(exactSamplesPerBeat)
        val idealDeadline = beatCount * exactSamplesPerBeat
        val legacyDriftMs = abs(legacyDeadline - idealDeadline) / sampleRate * 1_000.0

        assertTrue("legacy drift should be observable, got $legacyDriftMs ms", legacyDriftMs > 100.0)
    }
}
