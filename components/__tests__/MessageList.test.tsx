import { render, screen } from '@testing-library/react';
import { forwardRef } from 'react';
import MessageList from '../MessageList';
import { Message as MessageType } from '@/lib/types';

// Mock react-virtuoso to render all items directly
jest.mock('react-virtuoso', () => {
  const React = require('react');
  return {
    Virtuoso: React.forwardRef(({ data, itemContent, components, alignToBottom }: any, ref: any) => {
      // Provide the scrollToIndex method that MessageList expects
      React.useImperativeHandle(ref, () => ({
        scrollToIndex: jest.fn(),
      }));

      return (
        <div data-testid="virtuoso-container" data-align-to-bottom={alignToBottom !== undefined ? 'true' : 'false'}>
          {components?.Header && <components.Header />}
          {data.map((item: any, index: number) => (
            <div key={index}>{itemContent(index, item)}</div>
          ))}
          {components?.Footer && <components.Footer />}
        </div>
      );
    }),
  };
});

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

  it('should be top-aligned, not bottom-aligned', () => {
    render(<MessageList messages={messages} isStreaming={false} />);

    const container = screen.getByTestId('virtuoso-container');

    // The alignToBottom prop should NOT be present on the Virtuoso component
    // If it's present, data-align-to-bottom will be 'true'
    // We want it to be 'false' (meaning alignToBottom prop is not set)
    expect(container).toHaveAttribute('data-align-to-bottom', 'false');
  });
});
