package com.tempotune

import android.content.Context
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat

/**
 * MediaSessionCompat for hardware/Bluetooth/lock screen transport controls.
 * Allows play/pause via headset buttons, car Bluetooth, etc.
 */
object MetronomeMediaSessionManager {

    private const val TAG = "MetronomeMediaSession"
    private var mediaSession: MediaSessionCompat? = null

    fun init(context: Context) {
        if (mediaSession != null) return

        mediaSession = MediaSessionCompat(context, TAG).apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    MetronomeModule.instance?.actionToggle()
                }

                override fun onPause() {
                    MetronomeModule.instance?.actionToggle()
                }

                override fun onStop() {
                    MetronomeModule.instance?.let { module ->
                        if (module.isCurrentlyPlaying()) {
                            module.actionToggle()
                        }
                    }
                }

                override fun onSkipToNext() {
                    MetronomeModule.instance?.actionIncreaseBpm(1)
                }

                override fun onSkipToPrevious() {
                    MetronomeModule.instance?.actionDecreaseBpm(1)
                }
            })
            isActive = true
        }
    }

    fun updateState() {
        val session = mediaSession ?: return
        val playing = MetronomeState.isPlaying
        val bpm = MetronomeState.bpm

        val state = PlaybackStateCompat.Builder()
            .setActions(
                PlaybackStateCompat.ACTION_PLAY or
                PlaybackStateCompat.ACTION_PAUSE or
                PlaybackStateCompat.ACTION_PLAY_PAUSE or
                PlaybackStateCompat.ACTION_STOP or
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
            )
            .setState(
                if (playing) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED,
                PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN,
                1.0f
            )
            .build()

        session.setPlaybackState(state)

        val metadata = MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, "$bpm BPM")
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, "TempoTune · ${MetronomeState.timeSignature}")
            .build()

        session.setMetadata(metadata)
    }

    fun getSessionToken(): MediaSessionCompat.Token? = mediaSession?.sessionToken

    fun release() {
        mediaSession?.isActive = false
        mediaSession?.release()
        mediaSession = null
    }
}
