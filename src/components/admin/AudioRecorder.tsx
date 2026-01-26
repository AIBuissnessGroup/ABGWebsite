'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  MicrophoneIcon, 
  StopIcon, 
  PlayIcon, 
  PauseIcon,
  TrashIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneSolidIcon } from '@heroicons/react/24/solid';

interface AudioRecorderProps {
  applicationId: string;
  phase: string;
  existingAudioUrl?: string;
  onAudioUploaded: (url: string) => void;
  onAudioRemoved: () => void;
  disabled?: boolean;
}

export default function AudioRecorder({
  applicationId,
  phase,
  existingAudioUrl,
  onAudioUploaded,
  onAudioRemoved,
  disabled = false,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Update audioUrl when existingAudioUrl changes
  useEffect(() => {
    if (existingAudioUrl && existingAudioUrl !== audioUrl) {
      setAudioUrl(existingAudioUrl);
      setAudioBlob(null); // Clear any local blob
    }
  }, [existingAudioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Failed to access microphone. Please allow microphone access.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  }, [isRecording, isPaused]);

  const playAudio = useCallback(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const deleteRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setPlaybackTime(0);
    setDuration(0);
    setRecordingTime(0);
    onAudioRemoved();
  }, [onAudioRemoved]);

  const uploadAudio = useCallback(async () => {
    if (!audioBlob) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('applicationId', applicationId);
      formData.append('phase', phase);
      
      const response = await fetch('/api/admin/recruitment/audio-upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload audio');
      }
      
      const data = await response.json();
      setAudioUrl(data.url);
      setAudioBlob(null); // Clear the blob since it's now uploaded
      onAudioUploaded(data.url);
      
    } catch (err: any) {
      console.error('Error uploading audio:', err);
      setError(err.message || 'Failed to upload audio');
    } finally {
      setIsUploading(false);
    }
  }, [audioBlob, applicationId, phase, onAudioUploaded]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setPlaybackTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setPlaybackTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlaybackTime(time);
    }
  }, []);

  // Check if this is an uploaded audio (from server) vs local recording
  const isUploadedAudio = audioUrl && !audioBlob && !audioUrl.startsWith('blob:');
  const hasLocalRecording = audioBlob !== null;

  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <div className="flex items-center gap-2 mb-3">
        <MicrophoneSolidIcon className="w-5 h-5 text-red-500" />
        <span className="text-sm font-medium text-gray-700">Interview Recording</span>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* Recording state */}
      {isRecording && (
        <div className="mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-sm font-mono text-gray-700">
                {formatTime(recordingTime)}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {isPaused ? 'Paused' : 'Recording...'}
            </span>
          </div>
        </div>
      )}

      {/* Playback controls */}
      {audioUrl && !isRecording && (
        <div className="mb-3">
          <div className="flex items-center gap-3 mb-2">
            <button
              type="button"
              onClick={isPlaying ? pauseAudio : playAudio}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              disabled={disabled}
            >
              {isPlaying ? (
                <PauseIcon className="w-5 h-5" />
              ) : (
                <PlayIcon className="w-5 h-5" />
              )}
            </button>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={playbackTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={disabled}
              />
            </div>
            <span className="text-xs font-mono text-gray-500 w-20 text-right">
              {formatTime(playbackTime)} / {formatTime(duration)}
            </span>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {isUploadedAudio ? (
              <span className="text-green-600">✓ Saved</span>
            ) : hasLocalRecording ? (
              <span className="text-amber-600">Not saved - click Upload to save</span>
            ) : null}
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {!isRecording && !audioUrl && (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MicrophoneIcon className="w-4 h-4" />
            Start Recording
          </button>
        )}

        {isRecording && (
          <>
            <button
              type="button"
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              {isPaused ? (
                <>
                  <PlayIcon className="w-4 h-4" />
                  Resume
                </>
              ) : (
                <>
                  <PauseIcon className="w-4 h-4" />
                  Pause
                </>
              )}
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <StopIcon className="w-4 h-4" />
              Stop
            </button>
          </>
        )}

        {audioUrl && !isRecording && (
          <>
            {/* Upload button - only show if there's a local recording not yet uploaded */}
            {hasLocalRecording && (
              <button
                type="button"
                onClick={uploadAudio}
                disabled={isUploading || disabled}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            )}
            
            {/* New Recording button */}
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <MicrophoneIcon className="w-4 h-4" />
              New Recording
            </button>
            
            {/* Delete button */}
            <button
              type="button"
              onClick={deleteRecording}
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Record the interview directly in your browser. Audio is saved with your review.
      </p>
    </div>
  );
}
