package com.tempotune

import android.content.Context
import android.content.SharedPreferences

/**
 * SharedPreferences-backed singleton for metronome state.
 * Analogous to iOS MetronomeSharedState + UserDefaults.
 */
object MetronomeState {

    private const val PREFS_NAME = "metronome_state"
    private const val KEY_BPM = "bpm"
    private const val KEY_BEATS_PER_MEASURE = "beatsPerMeasure"
    private const val KEY_BEAT_DENOMINATOR = "beatDenominator"
    private const val KEY_IS_PLAYING = "isPlaying"

    private var prefs: SharedPreferences? = null

    fun init(context: Context) {
        if (prefs == null) {
            prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
    }

    var bpm: Int
        get() = prefs?.getInt(KEY_BPM, 120) ?: 120
        set(value) { prefs?.edit()?.putInt(KEY_BPM, value)?.apply() }

    var beatsPerMeasure: Int
        get() = prefs?.getInt(KEY_BEATS_PER_MEASURE, 4) ?: 4
        set(value) { prefs?.edit()?.putInt(KEY_BEATS_PER_MEASURE, value)?.apply() }

    var beatDenominator: Int
        get() = prefs?.getInt(KEY_BEAT_DENOMINATOR, 4) ?: 4
        set(value) { prefs?.edit()?.putInt(KEY_BEAT_DENOMINATOR, value)?.apply() }

    var isPlaying: Boolean
        get() = prefs?.getBoolean(KEY_IS_PLAYING, false) ?: false
        set(value) { prefs?.edit()?.putBoolean(KEY_IS_PLAYING, value)?.apply() }

    val timeSignature: String
        get() = "$beatsPerMeasure/$beatDenominator"
}
