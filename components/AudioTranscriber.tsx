import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession } from '@google/genai';
import { SpeechToTextIcon } from './icons/SpeechToTextIcon';
// FIX: Import `encode` from utils for robust audio data encoding.
import { encode } from '../utils/audioUtils';

// Note: `window.aistudio` is an external object assumed to be available
// FIX: Removed `declare global` block to resolve type conflict with a global `window.aistudio` type.
// TypeScript's default DOM typings include `webkitAudioContext`.


const AudioTranscriber: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const currentInputTranscriptionRef = useRef<string>('');
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const stopRecording = useCallback(() => {
    setIsRecording(false);

    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
  }, []);

  const startRecording = async () => {
    setIsRecording(true);
    setError(null);
    setTranscription('');
    currentInputTranscriptionRef.current = '';

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support audio recording.");
      }
      
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            if (!streamRef.current || !audioContextRef.current) return;
            sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    int16[i] = inputData[i] * 32768;
                }
                // FIX: Use robust `encode` function from utils instead of `btoa` with spread operator to prevent stack overflow on large inputs.
                const base64 = encode(new Uint8Array(int16.buffer));
                const pcmBlob: Blob = { data: base64, mimeType: 'audio/pcm;rate=16000' };

                if (sessionPromiseRef.current) {
                    sessionPromiseRef.current.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                }
            };

            sourceNodeRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentInputTranscriptionRef.current += text;
              setTranscription(currentInputTranscriptionRef.current);
            }
            if (message.serverContent?.turnComplete) {
                // To finalize the transcription segment.
                // We can add logic here if needed.
            }
          },
          onerror: (e: ErrorEvent) => {
            setError('An error occurred during transcription. Please try again.');
            console.error('Transcription error:', e);
            stopRecording();
          },
          onclose: (e: CloseEvent) => {
            // Handled by stopRecording
          },
        },
        config: {
          // FIX: Add `responseModalities` as it is required for the Live API, even when only using transcription.
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
        },
      });

    } catch (err: any) {
      setError(`Failed to start recording: ${err.message}`);
      console.error(err);
      stopRecording();
    }
  };

  useEffect(() => {
    return () => {
        stopRecording();
    }
  }, [stopRecording]);

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Live Audio Transcriber</h2>
        <p className="text-gray-400">Click start and speak into your microphone.</p>
      </div>
      <div className="w-full max-w-lg">
        <div className="bg-gray-900 rounded-lg p-4 min-h-[150px] border border-gray-700">
          <p className="text-gray-200 whitespace-pre-wrap">{transcription || 'Your transcription will appear here...'}</p>
        </div>
      </div>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-6 py-3 font-bold rounded-full text-white transition-all duration-300 flex items-center gap-2 ${
          isRecording 
          ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
          : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        <SpeechToTextIcon />
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</div>}
    </div>
  );
};

export default AudioTranscriber;