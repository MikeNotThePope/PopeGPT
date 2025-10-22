import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import Message from '@/components/Message';
import { Message as MessageType } from '@/lib/types';

describe('Message - Copy Functionality', () => {
  const mockWriteText = jest.fn(() => Promise.resolve());

  beforeEach(() => {
    mockWriteText.mockClear();
  });

  it('should display copy button on each message', () => {
    const message: MessageType = {
      id: '1',
      role: 'assistant',
      content: 'Test message content',
      timestamp: Date.now(),
    };

    render(<Message message={message} isDark={false} />);

    const copyButton = screen.getByLabelText('Copy message');
    expect(copyButton).toBeInTheDocument();
  });

  it('should copy message content to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();

    // Re-apply the mock after userEvent.setup()
    Object.defineProperty(navigator.clipboard, 'writeText', {
      value: mockWriteText,
      writable: true,
      configurable: true,
    });

    const message: MessageType = {
      id: '1',
      role: 'user',
      content: 'This is a test message to copy',
      timestamp: Date.now(),
    };

    render(<Message message={message} isDark={false} />);

    const copyButton = screen.getByLabelText('Copy message');
    await user.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith('This is a test message to copy');
  });

  it('should show copied state after clicking copy button', async () => {
    const user = userEvent.setup();
    const message: MessageType = {
      id: '1',
      role: 'user',
      content: 'User message',
      timestamp: Date.now(),
    };

    render(<Message message={message} isDark={false} />);

    const copyButton = screen.getByLabelText('Copy message');
    await user.click(copyButton);

    // Should show "Copied!" state
    await waitFor(() => {
      expect(screen.getByLabelText('Copied!')).toBeInTheDocument();
    });
  });

  it('should revert to copy state after 2 seconds', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });

    const message: MessageType = {
      id: '1',
      role: 'assistant',
      content: 'Test content',
      timestamp: Date.now(),
    };

    render(<Message message={message} isDark={false} />);

    const copyButton = screen.getByLabelText('Copy message');
    await user.click(copyButton);

    // Should show copied state
    expect(screen.getByLabelText('Copied!')).toBeInTheDocument();

    // Fast-forward 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Should revert to copy state
    await waitFor(() => {
      expect(screen.getByLabelText('Copy message')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('should work for both user and assistant messages', async () => {
    // Re-apply the mock right before this test
    Object.defineProperty(navigator.clipboard, 'writeText', {
      value: mockWriteText,
      writable: true,
      configurable: true,
    });

    const user = userEvent.setup();

    const userMessage: MessageType = {
      id: '1',
      role: 'user',
      content: 'User content',
      timestamp: Date.now(),
    };

    const assistantMessage: MessageType = {
      id: '2',
      role: 'assistant',
      content: 'Assistant content',
      timestamp: Date.now(),
    };

    const { rerender } = render(<Message message={userMessage} isDark={false} />);

    // Test user message
    let copyButton = screen.getByLabelText('Copy message');
    await user.click(copyButton);
    expect(mockWriteText).toHaveBeenCalledWith('User content');

    // Test assistant message
    rerender(<Message message={assistantMessage} isDark={false} />);
    copyButton = screen.getByLabelText(/Copy message|Copied!/);
    await user.click(copyButton);
    expect(mockWriteText).toHaveBeenCalledWith('Assistant content');
  });

  it('should have proper styling and accessibility', () => {
    const message: MessageType = {
      id: '1',
      role: 'assistant',
      content: 'Test',
      timestamp: Date.now(),
    };

    render(<Message message={message} isDark={false} />);

    const copyButton = screen.getByLabelText('Copy message');

    // Check button exists and is clickable
    expect(copyButton).toBeInTheDocument();
    expect(copyButton.tagName).toBe('BUTTON');

    // Check accessibility attributes
    expect(copyButton).toHaveAttribute('aria-label');
    expect(copyButton).toHaveAttribute('title');
  });

  it('should show a retry button next to copy icon for a user question', () => {
    const userMessage: MessageType = {
      id: '1',
      role: 'user',
      content: 'What is the weather today?',
      timestamp: Date.now(),
    };

    render(<Message message={userMessage} isDark={false} />);

    // Verify copy button exists
    const copyButton = screen.getByLabelText('Copy message');
    expect(copyButton).toBeInTheDocument();

    // Verify retry button exists next to copy button
    const retryButton = screen.getByLabelText(/retry/i);
    expect(retryButton).toBeInTheDocument();
    expect(retryButton.tagName).toBe('BUTTON');
  });

  it('should show a retry button next to copy icon for an AI response', () => {
    const assistantMessage: MessageType = {
      id: '2',
      role: 'assistant',
      content: 'The weather is sunny today.',
      timestamp: Date.now(),
    };

    render(<Message message={assistantMessage} isDark={false} />);

    // Verify copy button exists
    const copyButton = screen.getByLabelText('Copy message');
    expect(copyButton).toBeInTheDocument();

    // Verify retry button exists next to copy button
    const retryButton = screen.getByLabelText(/retry/i);
    expect(retryButton).toBeInTheDocument();
    expect(retryButton.tagName).toBe('BUTTON');
  });
});
