'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { supabase } from '@/utils/supabase/client';
import { Alert, AlertDescription } from './ui/alert';

interface VoiceRecorderProps {
  onUploadComplete?: (fileUrl: string) => void;
}

export function VoiceRecorder({ onUploadComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('无法访问麦克风。请确保已授予麦克风权限。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all media tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

      // Clear recording timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      // Handle recording complete
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await uploadRecording(audioBlob);
      };
    }
  };

  const uploadRecording = async (audioBlob: Blob) => {
    try {
      setIsUploading(true);
      setError(null);

      // Create a unique filename
      const fileName = `recording-${Date.now()}.wav`;
      const file = new File([audioBlob], fileName, { type: 'audio/wav' });

      // Upload to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from('voice-recordings')
        .upload(`public/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('voice-recordings')
        .getPublicUrl(data.path);

      // Notify parent component
      if (onUploadComplete && publicUrl) {
        onUploadComplete(publicUrl);
      }

      return publicUrl;
    } catch (err) {
      console.error('Failed to upload recording:', err);
      setError('录音上传失败，请重试。');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Format recording time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center space-x-4">
        {!isRecording && !isUploading ? (
          <Button
            onClick={startRecording}
            size="lg"
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <circle cx="12" cy="12" r="10" />
            </svg>
            开始录音
          </Button>
        ) : isRecording ? (
          <Button
            onClick={stopRecording}
            size="lg"
            variant="destructive"
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <rect width="16" height="16" x="4" y="4" rx="2" ry="2" />
            </svg>
            停止录音
          </Button>
        ) : (
          <Button disabled size="lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 animate-spin">
              <circle cx="12" cy="12" r="10" strokeDasharray="18 18" strokeDashoffset="0" />
            </svg>
            上传中...
          </Button>
        )}
      </div>

      {isRecording && (
        <div className="text-center text-xl font-mono">
          {formatTime(recordingTime)}
        </div>
      )}

      {!isRecording && recordingTime > 0 && !isUploading && (
        <div className="text-center text-sm text-muted-foreground">
          上次录音时长: {formatTime(recordingTime)}
        </div>
      )}
    </div>
  );
}