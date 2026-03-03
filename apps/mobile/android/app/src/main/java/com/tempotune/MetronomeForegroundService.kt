package com.tempotune

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder

/**
 * Thin foreground service shell.
 * Delegates notification building to MetronomeNotificationManager
 * and media session to MetronomeMediaSessionManager.
 */
class MetronomeForegroundService : Service() {

    companion object {
        private const val TAG = "MetronomeFgService"

        fun start(context: Context) {
            val intent = Intent(context, MetronomeForegroundService::class.java)
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

    override fun onCreate() {
        super.onCreate()
        MetronomeState.init(this)
        MetronomeNotificationManager.createChannel(this)
        MetronomeMediaSessionManager.init(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = MetronomeNotificationManager.build(this)
        startForeground(MetronomeNotificationManager.NOTIFICATION_ID, notification)
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        MetronomeMediaSessionManager.release()
        stopForeground(STOP_FOREGROUND_REMOVE)
    }
}
