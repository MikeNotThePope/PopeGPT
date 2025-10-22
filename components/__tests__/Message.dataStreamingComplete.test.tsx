import { render } from '@testing-library/react';
import { act } from 'react';
import Message from '@/components/Message';
import { Message as MessageType } from '@/lib/types';

// Mock the SmoothStreamingText component to track finishStreaming calls
const mockFinishStreaming = jest.fn();
const mockAddChunk = jest.fn();
const mockReset = jest.fn();

jest.mock('@/components/SmoothStreamingText', () => {
  const { forwardRef, useImperativeHandle } = require('react');

  return forwardRef((props: any, ref: any) => {
    useImperativeHandle(ref, () => ({
      addChunk: mockAddChunk,
      finishStreaming: mockFinishStreaming,
      reset: mockReset,
      skipToEnd: jest.fn(),
    }));

    return <div data-testid="smooth-streaming-text">Mocked SmoothStreamingText</div>;
  });
});

describe('Message - Data Streaming Completion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call finishStreaming when isDataStreaming becomes false but isStreaming stays true', async () => {
    const initialMessage: MessageType = {
      id: '1',
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // Start with empty content and data streaming active
    const { rerender } = render(
      <Message
        message={initialMessage}
        isStreaming={true}
        isDataStreaming={true}
        isDark={false}
      />
    );

    // Verify streaming started
    expect(mockReset).toHaveBeenCalled();

    // Update with content during streaming
    const updatedMessage: MessageType = {
      ...initialMessage,
      content: 'Test response',
    };

    await act(async () => {
      rerender(
        <Message
          message={updatedMessage}
          isStreaming={true}
          isDataStreaming={true}
          isDark={false}
        />
      );
    });

    // Verify content was added
    expect(mockAddChunk).toHaveBeenCalled();

    // Clear mocks to check only new calls
    jest.clearAllMocks();

    // Simulate data streaming complete but animation still running
    // isDataStreaming becomes false, but isStreaming stays true
    await act(async () => {
      rerender(
        <Message
          message={updatedMessage}
          isStreaming={true}       // Still true (because isStreaming || isAnimating)
          isDataStreaming={false}  // False (data complete)
          isDark={false}
        />
      );
    });

    // CRITICAL ASSERTION: finishStreaming should be called
    // This tells SmoothStreamingText to complete the animation
    expect(mockFinishStreaming).toHaveBeenCalledTimes(1);
  });

  it('should NOT call finishStreaming if both isStreaming and isDataStreaming are true', async () => {
    const message: MessageType = {
      id: '1',
      role: 'assistant',
      content: 'Test response',
      timestamp: Date.now(),
    };

    const { rerender } = render(
      <Message
        message={message}
        isStreaming={true}
        isDataStreaming={true}
        isDark={false}
      />
    );

    jest.clearAllMocks();

    // Update content while still streaming
    await act(async () => {
      rerender(
        <Message
          message={{ ...message, content: 'Test response updated' }}
          isStreaming={true}
          isDataStreaming={true}
          isDark={false}
        />
      );
    });

    // Should NOT call finishStreaming yet
    expect(mockFinishStreaming).not.toHaveBeenCalled();
  });
});
