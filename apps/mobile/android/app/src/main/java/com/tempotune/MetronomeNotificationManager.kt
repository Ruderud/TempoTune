package com.tempotune

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat

/**
 * Builds custom RemoteViews notifications for the metronome.
 * Analogous to iOS MetronomeLiveActivity.swift.
 */
object MetronomeNotificationManager {

    const val CHANNEL_ID = "metronome_channel"
    const val NOTIFICATION_ID = 1001

    fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Metronome",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Metronome playback notification"
                setShowBadge(false)
                setSound(null, null)
            }
            val manager = context.getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    fun build(context: Context): Notification {
        val bpm = MetronomeState.bpm
        val timeSig = MetronomeState.timeSignature
        val playing = MetronomeState.isPlaying
        val beatsPerMeasure = MetronomeState.beatsPerMeasure
        val beatDenominator = MetronomeState.beatDenominator

        // Collapsed view
        val collapsed = RemoteViews(context.packageName, R.layout.notification_metronome_collapsed).apply {
            setTextViewText(R.id.text_bpm, "$bpm BPM")
            setTextViewText(R.id.text_time_sig, timeSig)
            setImageViewResource(R.id.btn_toggle, if (playing) R.drawable.ic_pause else R.drawable.ic_play)
            setOnClickPendingIntent(R.id.btn_toggle, actionPendingIntent(context, MetronomeActionReceiver.ACTION_TOGGLE, 100))
        }

        // Expanded view
        val expanded = RemoteViews(context.packageName, R.layout.notification_metronome_expanded).apply {
            setTextViewText(R.id.text_bpm, "$bpm")

            // Play/Pause — dark icon on white capsule bg
            setImageViewResource(R.id.btn_toggle, if (playing) R.drawable.ic_pause_dark else R.drawable.ic_play_dark)
            setOnClickPendingIntent(R.id.btn_toggle, actionPendingIntent(context, MetronomeActionReceiver.ACTION_TOGGLE, 100))

            // BPM buttons
            setOnClickPendingIntent(R.id.btn_bpm_minus_10, actionPendingIntent(context, MetronomeActionReceiver.ACTION_BPM_MINUS_10, 101))
            setOnClickPendingIntent(R.id.btn_bpm_minus_1, actionPendingIntent(context, MetronomeActionReceiver.ACTION_BPM_MINUS_1, 102))
            setOnClickPendingIntent(R.id.btn_bpm_plus_1, actionPendingIntent(context, MetronomeActionReceiver.ACTION_BPM_PLUS_1, 103))
            setOnClickPendingIntent(R.id.btn_bpm_plus_10, actionPendingIntent(context, MetronomeActionReceiver.ACTION_BPM_PLUS_10, 104))

            // Time signature pills
            setOnClickPendingIntent(R.id.btn_ts_2_4, actionPendingIntent(context, MetronomeActionReceiver.ACTION_TS_2_4, 105))
            setOnClickPendingIntent(R.id.btn_ts_3_4, actionPendingIntent(context, MetronomeActionReceiver.ACTION_TS_3_4, 106))
            setOnClickPendingIntent(R.id.btn_ts_4_4, actionPendingIntent(context, MetronomeActionReceiver.ACTION_TS_4_4, 107))
            setOnClickPendingIntent(R.id.btn_ts_6_8, actionPendingIntent(context, MetronomeActionReceiver.ACTION_TS_6_8, 108))

            // Highlight selected time signature pill
            highlightSelectedTimeSig(this, beatsPerMeasure, beatDenominator)
        }

        // Tap opens app
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val contentPendingIntent = PendingIntent.getActivity(
            context, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setCustomContentView(collapsed)
            .setCustomBigContentView(expanded)
            .setStyle(NotificationCompat.DecoratedCustomViewStyle())
            .setOngoing(true)
            .setSilent(true)
            .setContentIntent(contentPendingIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    fun update(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, build(context))
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
