import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createAssistantMessage, createUserMessage } from '../models/chat';
import { sendToGemini } from '../services/geminiClient';
import {
  startRecording,
  stopRecording,
  transcribeAudio,
  speakText,
} from '../services/voiceService';

const buildInitialMessages = () => [
  createAssistantMessage('Hello! Drop a question and I will ask Gemini.'),
];

export const useChatViewModel = () => {
  const [messages, setMessages] = useState(() => buildInitialMessages());
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  const apiKey = import.meta.env.VITE_API_GEMINI;
  const hasApiKey = Boolean(apiKey);

  const canSend = input.trim().length > 0 && !isSending && !isRecording;
  const canRecord = !isSending && !isRecording;

  const scrollToBottom = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, scrollToBottom]);

  const _send = useCallback(
    async (text) => {
      if (!text || isSending) return;

      if (!hasApiKey) {
        setError('Missing key in your .env file.');
        return;
      }

      const userMessage = createUserMessage(text);
      const nextMessages = [...messages, userMessage];

      setMessages(nextMessages);
      setInput('');
      setError('');
      setIsSending(true);

      try {
        const reply = await sendToGemini({ apiKey, messages: nextMessages });
        setMessages([...nextMessages, createAssistantMessage(reply)]);

        setIsSpeaking(true);
        try {
          await speakText(reply);
        } catch {
          // TTS failure is non-fatal — text response already shown
        } finally {
          setIsSpeaking(false);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to reach Gemini.';
        setError(message);
        setMessages([
          ...nextMessages,
          createAssistantMessage('Sorry, I could not reach Gemini right now.'),
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [apiKey, hasApiKey, isSending, messages],
  );

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed) _send(trimmed);
  }, [input, _send]);

  const startVoiceInput = useCallback(async () => {
    try {
      await startRecording();
      setIsRecording(true);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied.');
    }
  }, []);

  const stopVoiceInput = useCallback(async () => {
    setIsRecording(false);
    try {
      const blob = await stopRecording();
      const text = await transcribeAudio(blob);
      if (text.trim()) {
        setInput(text.trim());
        await _send(text.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice input failed.');
    }
  }, [_send]);

  const resetChat = useCallback(() => {
    setMessages(buildInitialMessages());
    setInput('');
    setError('');
  }, []);

  const status = useMemo(() => {
    if (!hasApiKey) return 'No API key!!!';
    if (isRecording) return 'Recording...';
    if (isSending) return 'Sending to Gemini';
    if (isSpeaking) return 'Speaking...';
    return 'Ready';
  }, [hasApiKey, isRecording, isSending, isSpeaking]);

  return {
    messages,
    input,
    setInput,
    isSending,
    isRecording,
    isSpeaking,
    error,
    status,
    canSend,
    canRecord,
    sendMessage,
    startVoiceInput,
    stopVoiceInput,
    resetChat,
    listRef,
    hasApiKey,
  };
};
