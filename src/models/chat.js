export const MessageRole = {
  User: 'user',
  Assistant: 'assistant',
  System: 'system',
};

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createMessage = (role, content) => ({
  id: createId(),
  role,
  content,
  createdAt: new Date().toISOString(),
});

export const createUserMessage = (content) =>
  createMessage(MessageRole.User, content);

export const createAssistantMessage = (content) =>
  createMessage(MessageRole.Assistant, content);

export const createSystemMessage = (content) =>
  createMessage(MessageRole.System, content);
