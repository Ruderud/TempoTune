package com.tempotune

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * BroadcastReceiver dispatching 9 metronome actions.
 * Analogous to iOS App Intents (ToggleMetronome, IncreaseBpm, etc.)
 */
class MetronomeActionReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "MetronomeActionReceiver"

        const val ACTION_TOGGLE = "com.tempotune.ACTION_TOGGLE"
        const val ACTION_BPM_PLUS_1 = "com.tempotune.ACTION_BPM_PLUS_1"
        const val ACTION_BPM_MINUS_1 = "com.tempotune.ACTION_BPM_MINUS_1"
        const val ACTION_BPM_PLUS_10 = "com.tempotune.ACTION_BPM_PLUS_10"
        const val ACTION_BPM_MINUS_10 = "com.tempotune.ACTION_BPM_MINUS_10"
        const val ACTION_TS_2_4 = "com.tempotune.ACTION_TS_2_4"
        const val ACTION_TS_3_4 = "com.tempotune.ACTION_TS_3_4"
        const val ACTION_TS_4_4 = "com.tempotune.ACTION_TS_4_4"
        const val ACTION_TS_6_8 = "com.tempotune.ACTION_TS_6_8"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val module = MetronomeModule.instance
        if (module == null) {
            Log.w(TAG, "MetronomeModule.instance is null, ignoring action: ${intent.action}")
            return
        }

        when (intent.action) {
            ACTION_TOGGLE -> module.actionToggle()
            ACTION_BPM_PLUS_1 -> module.actionIncreaseBpm(1)
            ACTION_BPM_MINUS_1 -> module.actionDecreaseBpm(1)
            ACTION_BPM_PLUS_10 -> module.actionIncreaseBpm(10)
            ACTION_BPM_MINUS_10 -> module.actionDecreaseBpm(10)
            ACTION_TS_2_4 -> module.actionSetTimeSignature(2, 4)
            ACTION_TS_3_4 -> module.actionSetTimeSignature(3, 4)
            ACTION_TS_4_4 -> module.actionSetTimeSignature(4, 4)
            ACTION_TS_6_8 -> module.actionSetTimeSignature(6, 8)
            else -> Log.w(TAG, "Unknown action: ${intent.action}")
        }
    }
}
