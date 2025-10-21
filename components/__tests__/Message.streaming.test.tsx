import { render, waitFor } from '@testing-library/react';
import { act } from 'react';
import Message from '@/components/Message';
import { Message as MessageType } from '@/lib/types';

// Mock the SmoothStreamingText component to track what chunks it receives
const mockAddChunk = jest.fn();
const mockFinishStreaming = jest.fn();
const mockReset = jest.fn();
const mockSkipToEnd = jest.fn();

jest.mock('@/components/SmoothStreamingText', () => {
  const { forwardRef, useImperativeHandle } = require('react');

  return forwardRef((props: any, ref: any) => {
    useImperativeHandle(ref, () => ({
      addChunk: mockAddChunk,
      finishStreaming: mockFinishStreaming,
      reset: mockReset,
      skipToEnd: mockSkipToEnd,
    }));

    return <div data-testid="smooth-streaming-text">Mocked SmoothStreamingText</div>;
  });
});

describe('Message Streaming', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should add full initial content when streaming starts', async () => {
    const message: MessageType = {
      id: '1',
      role: 'assistant',
      content: 'Hello, I am an AI assistant.',
      timestamp: Date.now(),
    };

    const { rerender } = render(
      <Message message={message} isStreaming={true} isDark={false} />
    );

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(mockAddChunk).toHaveBeenCalledTimes(1);
      expect(mockAddChunk).toHaveBeenCalledWith('Hello, I am an AI assistant.');
    });
  });

  test('should add delta when content updates during streaming', async () => {
    const message: MessageType = {
      id: '1',
      role: 'assistant',
      content: 'Hello',
      timestamp: Date.now(),
    };

    const { rerender } = render(
      <Message message={message} isStreaming={true} isDark={false} />
    );

    // Wait for initial content to be added
    await waitFor(() => {
      expect(mockAddChunk).toHaveBeenCalledWith('Hello');
    });

    jest.clearAllMocks();

    // Update with more content
    const updatedMessage: MessageType = {
      ...message,
      content: 'Hello, I am an AI assistant.',
    };

    rerender(
      <Message message={updatedMessage} isStreaming={true} isDark={false} />
    );

    await waitFor(() => {
      expect(mockReset).not.toHaveBeenCalled(); // Should not reset on updates
      expect(mockAddChunk).toHaveBeenCalledTimes(1);
      expect(mockAddChunk).toHaveBeenCalledWith(', I am an AI assistant.');
    });
  });

  test('should preserve prefix when streaming content arrives', async () => {
    // This test reproduces the bug: content with a prefix
    const message: MessageType = {
      id: '1',
      role: 'assistant',
      content: "That's great! Cheese is delicious.",
      timestamp: Date.now(),
    };

    const { rerender } = render(
      <Message message={message} isStreaming={true} isDark={false} />
    );

    await waitFor(() => {
      expect(mockAddChunk).toHaveBeenCalledWith("That's great! Cheese is delicious.");
    });

    jest.clearAllMocks();

    // More content arrives
    const updatedMessage: MessageType = {
      ...message,
      content: "That's great! Cheese is delicious. What's your favorite type?",
    };

    rerender(
      <Message message={updatedMessage} isStreaming={true} isDark={false} />
    );

    await waitFor(() => {
      // Should only add the new part, not the whole thing
      expect(mockAddChunk).toHaveBeenCalledWith(" What's your favorite type?");
      // Should NOT have reset and re-added everything
      expect(mockReset).not.toHaveBeenCalled();
    });
  });

  test('should call finishStreaming when streaming completes', async () => {
    const message: MessageType = {
      id: '1',
      role: 'assistant',
      content: 'Hello, I am an AI assistant.',
      timestamp: Date.now(),
    };

    const { rerender } = render(
      <Message message={message} isStreaming={true} isDark={false} />
    );

    await waitFor(() => {
      expect(mockAddChunk).toHaveBeenCalled();
    });

    jest.clearAllMocks();

    // Streaming completes
    rerender(
      <Message message={message} isStreaming={false} isDark={false} />
    );

    await waitFor(() => {
      expect(mockFinishStreaming).toHaveBeenCalledTimes(1);
    });
  });

  test('should not process user messages with smooth streaming', () => {
    const message: MessageType = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: Date.now(),
    };

    render(
      <Message message={message} isStreaming={true} isDark={false} />
    );

    // Should not call any smooth streaming methods for user messages
    expect(mockReset).not.toHaveBeenCalled();
    expect(mockAddChunk).not.toHaveBeenCalled();
    expect(mockFinishStreaming).not.toHaveBeenCalled();
  });

  test('should handle empty initial content', async () => {
    const message: MessageType = {
      id: '1',
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    const { rerender } = render(
      <Message message={message} isStreaming={true} isDark={false} />
    );

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledTimes(1);
      // Should not call addChunk with empty string
      expect(mockAddChunk).not.toHaveBeenCalled();
    });

    jest.clearAllMocks();

    // Content arrives
    const updatedMessage: MessageType = {
      ...message,
      content: 'Hello',
    };

    rerender(
      <Message message={updatedMessage} isStreaming={true} isDark={false} />
    );

    await waitFor(() => {
      expect(mockAddChunk).toHaveBeenCalledTimes(1);
      expect(mockAddChunk).toHaveBeenCalledWith('Hello');
    });
  });

  test('should handle the real-world streaming scenario with prefix', async () => {
    // Simulate the real bug scenario:
    // 1. Message created with initial chunk
    const message: MessageType = {
      id: '1',
      role: 'assistant',
      content: "Okay, I understand you like cheese",
      timestamp: Date.now(),
    };

    const { rerender } = render(
      <Message message={message} isStreaming={true} isDark={false} />
    );

    // Verify initial content is added
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(mockAddChunk).toHaveBeenCalledTimes(1);
      expect(mockAddChunk).toHaveBeenCalledWith("Okay, I understand you like cheese");
    });

    jest.clearAllMocks();

    // 2. More content arrives (delta)
    rerender(
      <Message
        message={{...message, content: "Okay, I understand you like cheese in general"}}
        isStreaming={true}
        isDark={false}
      />
    );

    await waitFor(() => {
      expect(mockAddChunk).toHaveBeenCalledTimes(1);
      expect(mockAddChunk).toHaveBeenCalledWith(" in general");
      expect(mockReset).not.toHaveBeenCalled();
    });

    jest.clearAllMocks();

    // 3. Even more content
    rerender(
      <Message
        message={{...message, content: "Okay, I understand you like cheese in general. Some popular types include:"}}
        isStreaming={true}
        isDark={false}
      />
    );

    await waitFor(() => {
      expect(mockAddChunk).toHaveBeenCalledTimes(1);
      expect(mockAddChunk).toHaveBeenCalledWith(". Some popular types include:");
      expect(mockReset).not.toHaveBeenCalled();
    });

    // Verify total chunks added (should be 3 total: initial + 2 deltas)
    const allCalls = [
      "Okay, I understand you like cheese",
      " in general",
      ". Some popular types include:"
    ];

    // If we concatenate all chunks, we should get the final content
    const concatenated = allCalls.join('');
    expect(concatenated).toBe("Okay, I understand you like cheese in general. Some popular types include:");
  });
});
