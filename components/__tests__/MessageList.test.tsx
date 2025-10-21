import { render, screen } from '@testing-library/react';
import MessageList from '../MessageList';
import { Message as MessageType } from '@/lib/types';

describe('MessageList', () => {
  const messages: MessageType[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello!',
      timestamp: Date.now(),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hi there!',
      timestamp: Date.now(),
    },
  ];

  it('should render empty state when no messages', () => {
    render(<MessageList messages={[]} isStreaming={false} />);

    expect(screen.getByText('PopeGPT')).toBeInTheDocument();
    expect(screen.getByText(/start chatting now!/i)).toBeInTheDocument();
  });

  it('should render all messages', () => {
    render(<MessageList messages={messages} isStreaming={false} />);

    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should handle empty message list without crashing', () => {
    expect(() => {
      render(<MessageList messages={[]} isStreaming={false} />);
    }).not.toThrow();
  });
});
