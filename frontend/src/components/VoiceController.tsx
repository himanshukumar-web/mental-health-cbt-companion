"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface VoiceControllerProps {
  onTranscript: (text: string) => void;
  lastAssistantMessage?: string;
  isStreaming?: boolean;
  compact?: boolean;
}

// Global declaration for Web Speech API
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [key: number]: {
    transcript: string;
  };
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [key: number]: SpeechRecognitionResult;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export default function VoiceController({
  onTranscript,
  lastAssistantMessage,
  isStreaming,
  compact = false,
}: VoiceControllerProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [language, setLanguage] = useState("en-US");
  const [speechSupported, setSpeechSupported] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const timer = setTimeout(() => setSpeechSupported(true), 0);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      return () => clearTimeout(timer);
    }
  }, [language, onTranscript]);

  // Handle Text-To-Speech for assistant messages
  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !autoSpeak || !text) return;

    window.speechSynthesis.cancel(); // Stop ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Pick a natural female/calm voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith(language.slice(0, 2)) && (v.name.includes("Female") || v.name.includes("Google") || v.name.includes("Natural")));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [autoSpeak, language]);

  // Automatically read assistant response when streaming completes
  useEffect(() => {
    if (!isStreaming && lastAssistantMessage) {
      speakText(lastAssistantMessage);
    }
  }, [isStreaming, lastAssistantMessage, speakText]);

  const toggleListening = async () => {
    if (!speechSupported) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        alert("Microphone permission was denied. Please allow microphone access in browser settings.");
      }
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Voice Waveform Animation when active */}
      {(isListening || isSpeaking) && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 6px" }}>
          {[12, 22, 16, 26, 14].map((h, i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: isSpeaking ? h * 0.8 : h,
                borderRadius: 2,
                background: isListening ? "#ef4444" : "#22c55e",
                animation: "pulse 0.8s ease-in-out infinite alternate",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Language Selector */}
      {!compact && (
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            padding: "6px 8px",
            borderRadius: 8,
            background: "var(--bg-secondary)",
            border: "0.5px solid var(--border-secondary)",
            color: "var(--text-secondary)",
            fontSize: 11,
            outline: "none",
          }}
        >
          <option value="en-US">🇺🇸 EN</option>
          <option value="hi-IN">🇮🇳 HI</option>
          <option value="es-ES">🇪🇸 ES</option>
          <option value="fr-FR">🇫🇷 FR</option>
          <option value="de-DE">🇩🇪 DE</option>
        </select>
      )}

      {/* Auto TTS Toggle */}
      {!compact && (
        <button
          onClick={() => setAutoSpeak(!autoSpeak)}
          title={autoSpeak ? "AI Voice Auto-Speak ON" : "AI Voice Auto-Speak OFF"}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            background: autoSpeak ? "rgba(34,197,94,0.12)" : "var(--bg-secondary)",
            border: autoSpeak ? "0.5px solid rgba(34,197,94,0.3)" : "0.5px solid var(--border-secondary)",
            color: autoSpeak ? "#22c55e" : "var(--text-tertiary)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {autoSpeak ? "🔊" : "🔇"}
        </button>
      )}

      {/* Stop Speaking Button if currently speaking */}
      {isSpeaking && (
        <button
          onClick={stopSpeaking}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.12)",
            border: "0.5px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ⏹ Stop Voice
        </button>
      )}

      {/* Microphone Toggle Button */}
      <button
        onClick={toggleListening}
        title={isListening ? "Stop listening" : "Start voice dictation"}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: isListening
            ? "linear-gradient(135deg, #ef4444, #dc2626)"
            : "var(--bg-secondary)",
          border: isListening ? "none" : "0.5px solid var(--border-secondary)",
          color: isListening ? "white" : "var(--text-primary)",
          fontSize: 16,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isListening ? "0 0 16px rgba(239,68,68,0.4)" : "none",
          transition: "all 0.2s",
        }}
      >
        {isListening ? "🎙" : "🎤"}
      </button>
    </div>
  );
}
