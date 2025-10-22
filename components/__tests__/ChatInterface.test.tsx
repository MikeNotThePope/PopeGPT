import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { forwardRef } from 'react';
import userEvent from '@testing-library/user-event';
import ChatInterface from '../ChatInterface';
import { ChatProvider } from '@/lib/ChatContext';

// Mock react-virtuoso to render all items directly
jest.mock('react-virtuoso', () => {
  const React = require('react');
  return {
    Virtuoso: React.forwardRef(({ data, itemContent, components }: any, ref: any) => {
      // Provide the scrollToIndex method that MessageList expects
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

// Mock SmoothStreamingText to immediately call onAnimationComplete
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
          // Immediately trigger animation complete when streaming finishes
          if (onAnimationCompleteRef.current) {
            // Use setTimeout with 0 delay for async callback
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

describe('ChatInterface', () => {
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

  it('should render main chat interface', () => {
    renderChatInterface();

    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    expect(screen.getAllByText('PopeGPT').length).toBeGreaterThan(0);
  });

  it('should show empty state initially', () => {
    renderChatInterface();

    expect(screen.getByText(/start chatting now!/i)).toBeInTheDocument();
  });

  it('should display user message after sending', async () => {
    const user = userEvent.setup();

    // Mock successful API response
    const mockReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"content":"Hello!"}\n\n'));
        controller.close();
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    });

    renderChatInterface();

    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      const messages = screen.getAllByText('Test message');
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  it('should show error message on API failure', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    renderChatInterface();

    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Test');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/sorry, there was an error/i)).toBeInTheDocument();
    });
  });

  it('should open sidebar when menu button is clicked', async () => {
    renderChatInterface();

    // Find menu button (only visible on mobile with lg:hidden class)
    const menuButtons = screen.getAllByRole('button');
    const menuButton = menuButtons.find(btn =>
      btn.querySelector('svg') && !btn.textContent?.includes('Send')
    );

    if (menuButton) {
      fireEvent.click(menuButton);

      await waitFor(() => {
        // Sidebar should be visible - check for New Chat buttons
        const newChatButtons = screen.getAllByText('New Chat');
        expect(newChatButtons.length).toBeGreaterThan(0);
      });
    }
  });

  it('should truncate messages and resubmit when retry is clicked on a user message', async () => {
    const user = userEvent.setup();

    // Create mock streams that can be read multiple times
    const createMockStream = (content: string) => {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: {"content":"${content}"}\n\n`));
          controller.close();
        },
      });
    };

    let callCount = 0;
    (global.fetch as jest.Mock)
      .mockImplementation(() => {
        callCount++;
        const response = callCount === 1 ? 'Response 1' : 'Retry Response';
        return Promise.resolve({
          ok: true,
          body: createMockStream(response),
        });
      });

    renderChatInterface();

    // Send first message
    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Question 1');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Wait for first response
    await waitFor(() => {
      expect(screen.getByText('Response 1')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify both messages are in the UI
    expect(screen.getAllByText('Question 1').length).toBeGreaterThan(0);
    expect(screen.getByText('Response 1')).toBeInTheDocument();

    // Verify fetch was called once
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Now find and click the retry button on Question 1
    const retryButtons = screen.getAllByLabelText('Retry');
    // Buttons are for: Q1 (index 0) and R1 (index 1)
    // Click retry on Q1
    await user.click(retryButtons[0]);

    // Wait for a second fetch call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    }, { timeout: 3000 });

    // Verify the second API call had only Q1
    const secondCall = (global.fetch as jest.Mock).mock.calls[1];
    const secondCallBody = JSON.parse(secondCall[1].body);
    expect(secondCallBody.messages).toHaveLength(1);
    expect(secondCallBody.messages[0].content).toBe('Question 1');

    // CRITICAL: Verify that R1 was deleted from the UI
    await waitFor(() => {
      expect(screen.queryByText('Response 1')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Question 1 should still be there
    expect(screen.getAllByText('Question 1').length).toBeGreaterThan(0);

    // Wait for the retry response
    await waitFor(() => {
      expect(screen.getByText('Retry Response')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should regenerate response when retry is clicked on an assistant message', async () => {
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
    (global.fetch as jest.Mock)
      .mockImplementation(() => {
        callCount++;
        const response = callCount === 1 ? 'Response 1' : 'Retry Response';
        return Promise.resolve({
          ok: true,
          body: createMockStream(response),
        });
      });

    renderChatInterface();

    // Send first message
    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Question 1');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Wait for first response
    await waitFor(() => {
      expect(screen.getByText('Response 1')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify fetch was called once
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Get all retry buttons
    const retryButtons = screen.getAllByLabelText('Retry');
    // retryButtons[0] is for Q1, retryButtons[1] is for R1
    // Click retry on R1 (the assistant message)
    await user.click(retryButtons[1]);

    // Wait for the second fetch call (to regenerate the response)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    }, { timeout: 3000 });

    // Verify the second call has the previous user message
    const secondCall = (global.fetch as jest.Mock).mock.calls[1];
    const secondCallBody = JSON.parse(secondCall[1].body);
    expect(secondCallBody.messages).toHaveLength(1);
    expect(secondCallBody.messages[0].content).toBe('Question 1');

    // Original response should be deleted
    await waitFor(() => {
      expect(screen.queryByText('Response 1')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Question should still be there
    expect(screen.getAllByText('Question 1').length).toBeGreaterThan(0);

    // New response should appear
    await waitFor(() => {
      expect(screen.getByText('Retry Response')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

});
