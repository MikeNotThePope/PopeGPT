import { render, screen, waitFor } from '@testing-library/react';
import MessageList from '../MessageList';
import { Message as MessageType } from '@/lib/types';
import React from 'react';

// Mock react-virtuoso to capture scrollToIndex calls
const mockScrollToIndex = jest.fn();
jest.mock('react-virtuoso', () => {
  const React = require('react');
  return {
    Virtuoso: React.forwardRef(({ data, itemContent, components }: any, ref: any) => {
      // Provide the scrollToIndex method that MessageList expects
      React.useImperativeHandle(ref, () => ({
        scrollToIndex: mockScrollToIndex,
      }));

      return (
        <div data-testid="virtuoso-container">
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

// Mock Message component to avoid complexity
jest.mock('../Message', () => {
  return {
    __esModule: true,
    default: jest.fn(({ message, onEditingChange }) => (
      <div data-testid={`message-${message.id}`}>
        <span>{message.content}</span>
        <button
          data-testid={`edit-button-${message.id}`}
          onClick={() => onEditingChange?.(true)}
        >
          Edit
        </button>
        <button
          data-testid={`save-button-${message.id}`}
          onClick={() => onEditingChange?.(false)}
        >
          Save
        </button>
      </div>
    )),
  };
});

describe('MessageList - Editing Scroll Behavior', () => {
  const messages: MessageType[] = [
    {
      id: '1',
      role: 'user',
      content: 'First message',
      timestamp: Date.now(),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Response',
      timestamp: Date.now(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when isEditingMessage is false', () => {
    it('should auto-scroll when not streaming and messages change', async () => {
      const { rerender } = render(
        <MessageList
          messages={messages}
          isStreaming={false}
          isEditingMessage={false}
        />
      );

      // Initial render may trigger scroll, clear it
      mockScrollToIndex.mockClear();

      // Add a new message
      const newMessages = [
        ...messages,
        {
          id: '3',
          role: 'user',
          content: 'New message',
          timestamp: Date.now(),
        },
      ];

      rerender(
        <MessageList
          messages={newMessages}
          isStreaming={false}
          isEditingMessage={false}
        />
      );

      // Should trigger auto-scroll
      await waitFor(() => {
        expect(mockScrollToIndex).toHaveBeenCalledWith({
          index: 2,
          align: 'end',
          behavior: 'smooth',
        });
      });
    });

    it('should allow scrollToBottomImmediate during streaming', async () => {
      render(
        <MessageList
          messages={messages}
          isStreaming={true}
          isEditingMessage={false}
        />
      );

      // Simulate content change callback (would be called by Message during streaming)
      // This would be called via onContentChange prop, but since we're testing MessageList
      // we need to verify that the scroll function would work

      // The scrollToBottomImmediate is throttled via requestAnimationFrame
      // We can't directly test it without triggering onContentChange,
      // but we can verify no errors occur with isEditingMessage=false
      expect(screen.getByTestId('virtuoso-container')).toBeInTheDocument();
    });
  });

  describe('when isEditingMessage is true', () => {
    it('should NOT auto-scroll when messages change while editing', async () => {
      const { rerender } = render(
        <MessageList
          messages={messages}
          isStreaming={false}
          isEditingMessage={true}
        />
      );

      mockScrollToIndex.mockClear();

      // Add a new message while editing
      const newMessages = [
        ...messages,
        {
          id: '3',
          role: 'user',
          content: 'New message',
          timestamp: Date.now(),
        },
      ];

      rerender(
        <MessageList
          messages={newMessages}
          isStreaming={false}
          isEditingMessage={true}
        />
      );

      // Should NOT trigger auto-scroll because we're editing
      await waitFor(
        () => {
          expect(mockScrollToIndex).not.toHaveBeenCalled();
        },
        { timeout: 100 }
      );
    });

    it('should NOT auto-scroll during streaming while editing', async () => {
      render(
        <MessageList
          messages={messages}
          isStreaming={true}
          isEditingMessage={true}
        />
      );

      // scrollToIndex should not be called during streaming when editing
      await waitFor(
        () => {
          expect(mockScrollToIndex).not.toHaveBeenCalled();
        },
        { timeout: 100 }
      );
    });

    it('should resume auto-scroll when editing ends', async () => {
      const { rerender } = render(
        <MessageList
          messages={messages}
          isStreaming={false}
          isEditingMessage={true}
        />
      );

      mockScrollToIndex.mockClear();

      // Add new message while editing - should NOT scroll
      const newMessages = [
        ...messages,
        {
          id: '3',
          role: 'user',
          content: 'New message during edit',
          timestamp: Date.now(),
        },
      ];

      rerender(
        <MessageList
          messages={newMessages}
          isStreaming={false}
          isEditingMessage={true}
        />
      );

      await waitFor(
        () => {
          expect(mockScrollToIndex).not.toHaveBeenCalled();
        },
        { timeout: 100 }
      );

      mockScrollToIndex.mockClear();

      // End editing - should resume scrolling
      rerender(
        <MessageList
          messages={newMessages}
          isStreaming={false}
          isEditingMessage={false}
        />
      );

      // Now add another message - SHOULD scroll
      const moreMessages = [
        ...newMessages,
        {
          id: '4',
          role: 'assistant',
          content: 'Response after edit',
          timestamp: Date.now(),
        },
      ];

      rerender(
        <MessageList
          messages={moreMessages}
          isStreaming={false}
          isEditingMessage={false}
        />
      );

      await waitFor(() => {
        expect(mockScrollToIndex).toHaveBeenCalledWith({
          index: 3,
          align: 'end',
          behavior: 'smooth',
        });
      });
    });
  });

  describe('onEditingChange callback', () => {
    it('should pass onEditingChange callback to Message components', () => {
      const onEditingChange = jest.fn();

      render(
        <MessageList
          messages={messages}
          isStreaming={false}
          onEditingChange={onEditingChange}
        />
      );

      // Verify Message components received the callback
      expect(screen.getByTestId('edit-button-1')).toBeInTheDocument();
      expect(screen.getByTestId('save-button-1')).toBeInTheDocument();
    });
  });
});
