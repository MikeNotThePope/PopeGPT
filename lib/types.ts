export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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
  addMessage: (content: string, role: 'user' | 'assistant') => void;
  updateLastMessage: (content: string) => void;
  createNewConversation: () => void;
  switchConversation: (id: string) => void;
  getCurrentConversation: () => Conversation | null;
  isStreaming: boolean;
  setIsStreaming: (value: boolean) => void;
}
