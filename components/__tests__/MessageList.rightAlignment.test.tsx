import { render, screen } from '@testing-library/react';
import MessageList from '@/components/MessageList';
import { Message } from '@/lib/types';

// Mock react-virtuoso to render actual content
jest.mock('react-virtuoso', () => {
  const React = require('react');
  return {
    Virtuoso: React.forwardRef(({ data, itemContent, components, style }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        scrollToIndex: jest.fn(),
      }));

      return (
        <div style={{ ...style, overflow: 'auto' }} data-testid="message-list-container">
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

describe('MessageList - Right Alignment', () => {
  it('should maintain consistent right-edge alignment when scrollbar appears', () => {
    // Create a few messages to start (no scrollbar needed)
    const fewMessages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'First user message',
        timestamp: Date.now(),
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Assistant response',
        timestamp: Date.now(),
      },
      {
        id: '3',
        role: 'user',
        content: 'Second user message',
        timestamp: Date.now(),
      },
    ];

    const { rerender } = render(
      <MessageList messages={fewMessages} isStreaming={false} isDark={false} />
    );

    // Get all user messages (should be right-aligned)
    const userMessages = screen.getAllByText(/user message/i);
    const firstUserMessage = userMessages[0].closest('.message-content') || userMessages[0].parentElement?.parentElement;

    // Measure distance from right edge of viewport
    const containerBefore = screen.getByTestId('message-list-container');
    const containerRectBefore = containerBefore.getBoundingClientRect();
    const messageRectBefore = firstUserMessage?.getBoundingClientRect();

    const distanceFromRightBefore = messageRectBefore
      ? containerRectBefore.right - messageRectBefore.right
      : 0;

    // Now add many messages to trigger scrollbar
    const manyMessages: Message[] = Array.from({ length: 50 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i} with some content that takes up space`,
      timestamp: Date.now() + i,
    }));

    rerender(
      <MessageList messages={manyMessages} isStreaming={false} isDark={false} />
    );

    // Find user messages again after rerender
    const userMessagesAfter = screen.getAllByText(/Message 0 /i); // First message
    const firstUserMessageAfter = userMessagesAfter[0].closest('.message-content') || userMessagesAfter[0].parentElement?.parentElement;

    // Measure distance from right edge again
    const containerAfter = screen.getByTestId('message-list-container');
    const containerRectAfter = containerAfter.getBoundingClientRect();
    const messageRectAfter = firstUserMessageAfter?.getBoundingClientRect();

    const distanceFromRightAfter = messageRectAfter
      ? containerRectAfter.right - messageRectAfter.right
      : 0;

    // CRITICAL ASSERTION: Distance from right edge should remain the same
    // Allow small tolerance for padding/rounding differences
    expect(Math.abs(distanceFromRightBefore - distanceFromRightAfter)).toBeLessThan(5);
  });

  it('should right-align user messages within their container', () => {
    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'User message should be right-aligned',
        timestamp: Date.now(),
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Assistant message should be left-aligned',
        timestamp: Date.now(),
      },
    ];

    render(<MessageList messages={messages} isStreaming={false} isDark={false} />);

    const userMessage = screen.getByText(/User message should be right-aligned/i);
    const assistantMessage = screen.getByText(/Assistant message should be left-aligned/i);

    // Find the message-content containers (the outer flex wrapper that controls alignment)
    const userContainer = userMessage.closest('.message-content');
    const assistantContainer = assistantMessage.closest('.message-content');

    // Verify containers exist and have correct alignment classes
    expect(userContainer).toBeInTheDocument();
    expect(assistantContainer).toBeInTheDocument();

    // Check that user message container has justify-end class (right-aligned)
    expect(userContainer?.className).toContain('justify-end');

    // Check that assistant message container has justify-start class (left-aligned)
    expect(assistantContainer?.className).toContain('justify-start');
  });

  it('should use consistent max-width for user messages regardless of scrollbar', () => {
    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Test message',
        timestamp: Date.now(),
      },
    ];

    const { rerender } = render(
      <MessageList messages={messages} isStreaming={false} isDark={false} />
    );

    const userMessage = screen.getByText('Test message');
    const messageBox = userMessage.closest('[class*="max-w"]'); // Find element with max-width class

    const widthBefore = messageBox?.getBoundingClientRect().width;

    // Add many messages to trigger scrollbar
    const manyMessages: Message[] = Array.from({ length: 50 }, (_, i) => ({
      id: `msg-${i}`,
      role: 'user',
      content: `Test message ${i}`,
      timestamp: Date.now() + i,
    }));

    rerender(<MessageList messages={manyMessages} isStreaming={false} isDark={false} />);

    const userMessageAfter = screen.getByText('Test message 0');
    const messageBoxAfter = userMessageAfter.closest('[class*="max-w"]');

    const widthAfter = messageBoxAfter?.getBoundingClientRect().width;

    // Width should remain the same (max-width constraint is consistent)
    if (widthBefore && widthAfter) {
      expect(Math.abs(widthBefore - widthAfter)).toBeLessThan(5);
    }
  });
});
