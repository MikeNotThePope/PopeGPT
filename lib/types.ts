export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 data URL
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: FileAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface ChatContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  addMessage: (content: string, role: 'user' | 'assistant', attachments?: FileAttachment[]) => void;
  updateLastMessage: (content: string) => void;
  createNewConversation: () => void;
  switchConversation: (id: string) => void;
  getCurrentConversation: () => Conversation | null;
  isStreaming: boolean;
  setIsStreaming: (value: boolean) => void;
  truncateMessagesAfter: (messageId: string) => void;
  removeMessagesFrom: (messageId: string) => void;
}
