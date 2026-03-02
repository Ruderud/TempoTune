package com.tempotune

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

class MetronomeForegroundService : Service() {

    companion object {
        private const val TAG = "MetronomeFgService"
        private const val CHANNEL_ID = "metronome_channel"
        private const val NOTIFICATION_ID = 1001
        private const val ACTION_STOP = "com.tempotune.ACTION_STOP_METRONOME"

        fun start(context: Context, bpm: Int, timeSignature: String) {
            val intent = Intent(context, MetronomeForegroundService::class.java).apply {
                putExtra("bpm", bpm)
                putExtra("timeSignature", timeSignature)
                putExtra("isPlaying", true)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun update(context: Context, bpm: Int, timeSignature: String, isPlaying: Boolean) {
            val intent = Intent(context, MetronomeForegroundService::class.java).apply {
                putExtra("bpm", bpm)
                putExtra("timeSignature", timeSignature)
                putExtra("isPlaying", isPlaying)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, MetronomeForegroundService::class.java))
        }
    }

    private var currentBpm = 120
    private var currentTimeSignature = "4/4"

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }

        currentBpm = intent?.getIntExtra("bpm", 120) ?: 120
        currentTimeSignature = intent?.getStringExtra("timeSignature") ?: "4/4"
        val isPlaying = intent?.getBooleanExtra("isPlaying", true) ?: true

        val notification = buildNotification(currentBpm, currentTimeSignature, isPlaying)
        startForeground(NOTIFICATION_ID, notification)

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        stopForeground(STOP_FOREGROUND_REMOVE)
    }

    private fun createNotificationChannel() {
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
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(bpm: Int, timeSignature: String, isPlaying: Boolean): Notification {
        // Tap notification opens app
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val contentPendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Stop action
        val stopIntent = Intent(this, MetronomeForegroundService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val statusText = if (isPlaying) "Playing" else "Paused"

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("♩ $bpm BPM · $timeSignature")
            .setContentText("Metronome $statusText")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setOngoing(true)
            .setSilent(true)
            .setContentIntent(contentPendingIntent)
            .addAction(
                android.R.drawable.ic_media_pause,
                "Stop",
                stopPendingIntent
            )
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }
}
