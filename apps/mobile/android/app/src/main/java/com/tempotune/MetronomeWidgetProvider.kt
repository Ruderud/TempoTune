package com.tempotune

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

/**
 * AppWidgetProvider for home screen widget.
 * Analogous to iOS Widget Extension.
 */
class MetronomeWidgetProvider : AppWidgetProvider() {

    companion object {
        /** Force-update all widget instances from anywhere. */
        fun updateAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, MetronomeWidgetProvider::class.java))
            if (ids.isNotEmpty()) {
                val intent = Intent(context, MetronomeWidgetProvider::class.java).apply {
                    action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                }
                context.sendBroadcast(intent)
            }
        }
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        MetronomeState.init(context)
        for (widgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId)
        }
    }

    private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
        val bpm = MetronomeState.bpm
        val playing = MetronomeState.isPlaying
        val beatsPerMeasure = MetronomeState.beatsPerMeasure
        val beatDenominator = MetronomeState.beatDenominator

        val views = RemoteViews(context.packageName, R.layout.widget_metronome).apply {
            setTextViewText(R.id.text_bpm, "$bpm")

            // Play/Pause — dark icon on white capsule
            setImageViewResource(R.id.btn_toggle, if (playing) R.drawable.ic_pause_dark else R.drawable.ic_play_dark)
            setOnClickPendingIntent(R.id.btn_toggle, actionPendingIntent(context, MetronomeActionReceiver.ACTION_TOGGLE, 200))

            // BPM buttons
            setOnClickPendingIntent(R.id.btn_bpm_minus_10, actionPendingIntent(context, MetronomeActionReceiver.ACTION_BPM_MINUS_10, 201))
            setOnClickPendingIntent(R.id.btn_bpm_minus_1, actionPendingIntent(context, MetronomeActionReceiver.ACTION_BPM_MINUS_1, 202))
            setOnClickPendingIntent(R.id.btn_bpm_plus_1, actionPendingIntent(context, MetronomeActionReceiver.ACTION_BPM_PLUS_1, 203))
            setOnClickPendingIntent(R.id.btn_bpm_plus_10, actionPendingIntent(context, MetronomeActionReceiver.ACTION_BPM_PLUS_10, 204))

            // Time signature pills
            setOnClickPendingIntent(R.id.btn_ts_2_4, actionPendingIntent(context, MetronomeActionReceiver.ACTION_TS_2_4, 205))
            setOnClickPendingIntent(R.id.btn_ts_3_4, actionPendingIntent(context, MetronomeActionReceiver.ACTION_TS_3_4, 206))
            setOnClickPendingIntent(R.id.btn_ts_4_4, actionPendingIntent(context, MetronomeActionReceiver.ACTION_TS_4_4, 207))
            setOnClickPendingIntent(R.id.btn_ts_6_8, actionPendingIntent(context, MetronomeActionReceiver.ACTION_TS_6_8, 208))

            // Highlight selected time signature
            highlightSelectedTimeSig(this, beatsPerMeasure, beatDenominator)
        }

        manager.updateAppWidget(widgetId, views)
    }

    private fun highlightSelectedTimeSig(views: RemoteViews, beats: Int, denom: Int) {
        val allIds = listOf(R.id.btn_ts_2_4, R.id.btn_ts_3_4, R.id.btn_ts_4_4, R.id.btn_ts_6_8)
        for (id in allIds) {
            views.setInt(id, "setBackgroundResource", R.drawable.bg_pill_subtle)
            views.setTextColor(id, 0xFFFFFFFF.toInt())
        }

        val selectedId = when {
            beats == 2 && denom == 4 -> R.id.btn_ts_2_4
            beats == 3 && denom == 4 -> R.id.btn_ts_3_4
            beats == 4 && denom == 4 -> R.id.btn_ts_4_4
            beats == 6 && denom == 8 -> R.id.btn_ts_6_8
            else -> null
        }
        selectedId?.let {
            views.setInt(it, "setBackgroundResource", R.drawable.bg_pill_selected)
            views.setTextColor(it, 0xFFFFFFFF.toInt())
        }
    }

    private fun actionPendingIntent(context: Context, action: String, requestCode: Int): PendingIntent {
        val intent = Intent(context, MetronomeActionReceiver::class.java).apply {
            this.action = action
        }
        return PendingIntent.getBroadcast(
            context, requestCode, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
