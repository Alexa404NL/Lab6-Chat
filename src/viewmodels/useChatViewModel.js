import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createAssistantMessage,
  createUserMessage,
} from '../models/chat';
import { sendToGemini } from '../services/geminiClient';

const buildInitialMessages = () => [
  createAssistantMessage('Hello! Drop a question and I will ask Gemini.'),
];

export const useChatViewModel = () => {
  const [messages, setMessages] = useState(() => buildInitialMessages());
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  const apiKey = import.meta.env.VITE_API_GEMINI;

  const hasApiKey = Boolean(apiKey);
  const canSend = input.trim().length > 0 && !isSending;

  const scrollToBottom = useCallback(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    list.scrollTop = list.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) {
      return;
    }

    if (!hasApiKey) {
      setError('Missing key in your .env file.');
      return;
    }

    const userMessage = createUserMessage(trimmed);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsSending(true);

    try {
      const reply = await sendToGemini({
        apiKey,
        messages: nextMessages,
      });

      setMessages([...nextMessages, createAssistantMessage(reply)]);
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
  }, [apiKey, hasApiKey, input, isSending, messages]);

  const resetChat = useCallback(() => {
    setMessages(buildInitialMessages());
    setInput('');
    setError('');
  }, []);

  const status = useMemo(() => {
    if (!hasApiKey) {
      return 'No API key!!!';
    }

    if (isSending) {
      return 'Sending to Gemini';
    }

    return 'Ready';
  }, [hasApiKey, isSending]);

  return {
    messages,
    input,
    setInput,
    isSending,
    error,
    status,
    canSend,
    sendMessage,
    resetChat,
    listRef,
    hasApiKey,
  };
};
