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

  it('should handle streaming state', async () => {
    const user = userEvent.setup();

    // Mock streaming response
    const mockReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"content":"Response"}\n\n'));
        controller.close();
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    });

    renderChatInterface();

    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Test');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    // Wait for the response to be processed
    await waitFor(() => {
      // Input should be enabled after streaming completes
      expect(input).not.toBeDisabled();
    }, { timeout: 3000 });
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

  it('should auto-focus input after AI responds', async () => {
    const user = userEvent.setup();

    const mockReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"content":"Response"}\n\n'));
        controller.close();
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    });

    renderChatInterface();

    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Test');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    // Wait for streaming to complete
    await waitFor(() => {
      expect(input).not.toBeDisabled();
    }, { timeout: 2000 });

    // Input should be focused
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });
});
