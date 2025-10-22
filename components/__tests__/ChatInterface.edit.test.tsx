import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import ChatInterface from '../ChatInterface';
import { ChatProvider } from '@/lib/ChatContext';

// Mock react-virtuoso to render all items directly
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

// Mock SmoothStreamingText
jest.mock('../SmoothStreamingText', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      const { onAnimationComplete } = props;
      const onAnimationCompleteRef = React.useRef(onAnimationComplete);

      React.useEffect(() => {
        onAnimationCompleteRef.current = onAnimationComplete;
      }, [onAnimationComplete]);

      React.useImperativeHandle(ref, () => ({
        addChunk: jest.fn(),
        finishStreaming: () => {
          if (onAnimationCompleteRef.current) {
            setTimeout(() => onAnimationCompleteRef.current(), 0);
          }
        },
        reset: jest.fn(),
        skipToEnd: jest.fn(),
      }));

      return <div data-testid="smooth-streaming-text">{props.finalMessageContent}</div>;
    }),
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('ChatInterface - Edit Functionality', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    process.env = { ...originalEnv, NEXT_PUBLIC_USERNAME: 'Pope' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const renderChatInterface = () => {
    return render(
      <ChatProvider>
        <ChatInterface />
      </ChatProvider>
    );
  };

  it('should populate message input with original content when edit is clicked', async () => {
    const user = userEvent.setup();

    const createMockStream = (content: string) => {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: {"content":"${content}"}\n\n`));
          controller.close();
        },
      });
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: createMockStream('Response 1'),
    });

    renderChatInterface();

    // Send first message
    const input = screen.getByPlaceholderText(/type your message/i) as HTMLTextAreaElement;
    await user.type(input, 'Original question');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Response 1')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Input should be cleared after sending
    expect(input.value).toBe('');

    // Find and click the edit button on the user message
    const editButtons = screen.getAllByLabelText('Edit');
    await user.click(editButtons[0]); // Click edit on the user message

    // Input should now contain the original message
    await waitFor(() => {
      expect(input.value).toBe('Original question');
    });
  });

  it('should truncate conversation and allow resubmission after edit', async () => {
    const user = userEvent.setup();

    const createMockStream = (content: string) => {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: {"content":"${content}"}\n\n`));
          controller.close();
        },
      });
    };

    let callCount = 0;
    (global.fetch as jest.Mock).mockImplementation(() => {
      callCount++;
      const response = callCount === 1 ? 'Response 1' : 'Edited Response';
      return Promise.resolve({
        ok: true,
        body: createMockStream(response),
      });
    });

    renderChatInterface();

    // Send first message
    const input = screen.getByPlaceholderText(/type your message/i) as HTMLTextAreaElement;
    await user.type(input, 'Original question');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Response 1')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify both messages are in the UI
    expect(screen.getAllByText('Original question').length).toBeGreaterThan(0);
    expect(screen.getByText('Response 1')).toBeInTheDocument();

    // Click edit on the user message
    const editButtons = screen.getAllByLabelText('Edit');
    await user.click(editButtons[0]);

    // Response should be deleted (truncated)
    await waitFor(() => {
      expect(screen.queryByText('Response 1')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Original question should still be there
    expect(screen.getAllByText('Original question').length).toBeGreaterThan(0);

    // Input should contain the original question
    expect(input.value).toBe('Original question');

    // Edit the message
    await user.clear(input);
    await user.type(input, 'Edited question');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Wait for new response
    await waitFor(() => {
      expect(screen.getByText('Edited Response')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify the second API call
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const secondCall = (global.fetch as jest.Mock).mock.calls[1];
    const secondCallBody = JSON.parse(secondCall[1].body);
    expect(secondCallBody.messages).toHaveLength(1);
    expect(secondCallBody.messages[0].content).toBe('Edited question');
  });

  it('should focus the input field after clicking edit', async () => {
    const user = userEvent.setup();

    const createMockStream = (content: string) => {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: {"content":"${content}"}\n\n`));
          controller.close();
        },
      });
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: createMockStream('Response 1'),
    });

    renderChatInterface();

    // Send a message
    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Test question');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('Response 1')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click edit
    const editButtons = screen.getAllByLabelText('Edit');
    await user.click(editButtons[0]);

    // Input should be focused
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });
});
