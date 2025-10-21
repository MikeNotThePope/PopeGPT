import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInterface from '../ChatInterface';
import { ChatProvider } from '@/lib/ChatContext';

// Mock fetch
global.fetch = jest.fn();

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
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
    expect(screen.getByText('PopeGPT')).toBeInTheDocument();
  });

  it('should show empty state initially', () => {
    renderChatInterface();

    expect(screen.getByText(/welcome! start a conversation/i)).toBeInTheDocument();
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
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('should disable input while streaming', async () => {
    const user = userEvent.setup();

    // Mock streaming response
    const mockReadableStream = new ReadableStream({
      start(controller) {
        setTimeout(() => {
          controller.enqueue(new TextEncoder().encode('data: {"content":"Response"}\n\n'));
          controller.close();
        }, 100);
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

    // Input should be disabled while streaming
    await waitFor(() => {
      expect(input).toBeDisabled();
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
        // Sidebar should be visible
        const newChatButton = screen.getByText('New Chat');
        expect(newChatButton).toBeInTheDocument();
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
