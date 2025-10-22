import { render, screen, waitFor } from '@testing-library/react';
import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import ChatInterface from '../ChatInterface';
import { ChatProvider } from '@/lib/ChatContext';

// This test validates that the input remains disabled until the streaming animation
// completes, not just when data reception completes.

// Store reference to onAnimationComplete callback so we can control when it's called
let capturedOnAnimationComplete: (() => void) | null = null;

// Mock react-virtuoso
jest.mock('react-virtuoso', () => {
  const React = require('react');
  return {
    Virtuoso: React.forwardRef(({ data, itemContent, components }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        scrollToIndex: jest.fn(),
      }));

      return (
        <div>
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

// Mock SmoothStreamingText - CRITICALLY, don't call onAnimationComplete automatically
jest.mock('../SmoothStreamingText', () => {
  const React = require('react');

  return React.forwardRef((props: any, ref: any) => {
    const { onAnimationComplete, finalMessageContent } = props;
    const callbackRef = React.useRef(onAnimationComplete);

    // Update the ref when callback changes
    React.useEffect(() => {
      callbackRef.current = onAnimationComplete;
      // Capture the latest callback
      capturedOnAnimationComplete = onAnimationComplete;
    }, [onAnimationComplete]);

    React.useImperativeHandle(ref, () => ({
      addChunk: jest.fn(),
      // IMPORTANT: finishStreaming does NOT call onAnimationComplete
      // This simulates a real scenario where animation takes time
      finishStreaming: jest.fn(),
      reset: jest.fn(),
      skipToEnd: jest.fn(),
    }));

    return <div data-testid="smooth-streaming-text">{finalMessageContent}</div>;
  });
});

// Mock fetch
global.fetch = jest.fn();

describe('ChatInterface - Streaming Animation Timing', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    capturedOnAnimationComplete = null;
    process.env = { ...originalEnv, NEXT_PUBLIC_USERNAME: 'Pope' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should keep input disabled until streaming animation completes, not just when data reception completes', async () => {
    const user = userEvent.setup();

    // Mock streaming response that completes quickly
    const mockReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"content":"Hello"}\n\n'));
        controller.enqueue(new TextEncoder().encode('data: {"content":" there!"}\n\n'));
        controller.close();
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    });

    render(
      <ChatProvider>
        <ChatInterface />
      </ChatProvider>
    );

    const input = screen.getByPlaceholderText(/type your message/i) as HTMLTextAreaElement;
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Initial state: input should be enabled
    expect(input).not.toBeDisabled();

    // Send a message
    await user.type(input, 'Test message');
    await user.click(sendButton);

    // Input should be disabled immediately when sending starts
    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    // Wait for the user message to appear (there will be multiple matches - sidebar + message)
    await waitFor(() => {
      expect(screen.getAllByText('Test message').length).toBeGreaterThan(0);
    });

    // Wait for data streaming to complete (the stream is very short)
    // Give enough time for the ReadableStream to close and process
    await new Promise(resolve => setTimeout(resolve, 200));

    // CRITICAL ASSERTION #1: Input should STILL be disabled
    // Even though data reception is complete, the animation hasn't finished
    // (because we haven't called onAnimationComplete yet)
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();

    // Verify we captured the callback
    expect(capturedOnAnimationComplete).not.toBeNull();

    // Now manually trigger the animation completion
    // This simulates what happens when the typewriter animation finishes
    if (capturedOnAnimationComplete) {
      await act(async () => {
        capturedOnAnimationComplete();
      });
    }

    // Give React time to process the state update
    await new Promise(resolve => setTimeout(resolve, 100));

    // CRITICAL ASSERTION #2: NOW input should be re-enabled
    // Only after animation completes should the input be available
    await waitFor(() => {
      const freshInput = screen.getByPlaceholderText(/type your message/i) as HTMLTextAreaElement;
      expect(freshInput).not.toBeDisabled();
    }, { timeout: 3000 });

    // Verify user can type again
    const freshInput = screen.getByPlaceholderText(/type your message/i) as HTMLTextAreaElement;
    await user.type(freshInput, 'Follow-up');
    expect(freshInput.value).toBe('Follow-up');

    // Now that there's text, the send button should also be enabled
    const freshButton = screen.getByRole('button', { name: /send/i });
    expect(freshButton).not.toBeDisabled();
  });
});
