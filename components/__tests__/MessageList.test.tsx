import { render, screen } from '@testing-library/react';
import MessageList from '../MessageList';
import { Message as MessageType } from '@/lib/types';

// Mock react-virtuoso to render all items directly
jest.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent, components }: any) => {
    return (
      <div>
        {components?.Header && <components.Header />}
        {data.map((item: any, index: number) => (
          <div key={index}>{itemContent(index, item)}</div>
        ))}
        {components?.Footer && <components.Footer />}
      </div>
    );
  },
}));

describe('MessageList', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NEXT_PUBLIC_USERNAME: 'Pope' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

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
