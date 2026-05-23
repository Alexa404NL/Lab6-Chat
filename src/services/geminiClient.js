const MODEL_NAME = 'gemini-3.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

const mapRole = (role) => {
  if (role === 'assistant') {
    return 'model';
  }

  return 'user';
};

const toGeminiContents = (messages) =>
  messages.map((message) => ({
    role: mapRole(message.role),
    parts: [{ text: message.content }],
  }));

export const sendToGemini = async ({ apiKey, messages }) => {
  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: toGeminiContents(messages),
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((part) => part.text ?? '').join('')
    : '';

  if (!text) {
    throw new Error('Gemini response was empty.');
  }

  return text;
};
