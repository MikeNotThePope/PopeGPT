import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import Message from '@/components/Message';
import { Message as MessageType } from '@/lib/types';
import { ChatProvider, useChatContext } from '@/lib/ChatContext';

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

  it('should truncate all following messages when retry is clicked on a user question', async () => {
    const user = userEvent.setup();

    // Component to test the retry functionality with ChatContext
    function TestComponent() {
      const { addMessage, getCurrentConversation, truncateMessagesAfter } = useChatContext();

      React.useEffect(() => {
        // Build conversation: Q1, R1, Q2, R2, Q3, R3
        addMessage('Question 1', 'user');
        addMessage('Response 1', 'assistant');
        addMessage('Question 2', 'user');
        addMessage('Response 2', 'assistant');
        addMessage('Question 3', 'user');
        addMessage('Response 3', 'assistant');
      }, [addMessage]);

      const conversation = getCurrentConversation();
      const messages = conversation?.messages || [];

      // Find Q2 (index 2)
      const q2Message = messages[2];

      const handleRetry = (messageId: string) => {
        truncateMessagesAfter(messageId);
      };

      return (
        <div>
          {q2Message && (
            <Message
              message={q2Message}
              isDark={false}
              onRetry={handleRetry}
            />
          )}
          <div data-testid="message-count">{messages.length}</div>
          <div data-testid="messages-json">{JSON.stringify(messages.map(m => m.content))}</div>
        </div>
      );
    }

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Initially should have 6 messages: Q1, R1, Q2, R2, Q3, R3
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('6');
    });

    // Verify we have all 6 messages
    const messagesJson = screen.getByTestId('messages-json');
    expect(messagesJson).toHaveTextContent('Question 1');
    expect(messagesJson).toHaveTextContent('Response 1');
    expect(messagesJson).toHaveTextContent('Question 2');
    expect(messagesJson).toHaveTextContent('Response 2');
    expect(messagesJson).toHaveTextContent('Question 3');
    expect(messagesJson).toHaveTextContent('Response 3');

    // Click retry on Q2
    const retryButton = screen.getByLabelText(/retry/i);
    await user.click(retryButton);

    // After retry on Q2, should truncate to [Q1, R1, Q2]
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('3');
    });

    // Verify only Q1, R1, Q2 remain
    const updatedMessagesJson = screen.getByTestId('messages-json');
    expect(updatedMessagesJson).toHaveTextContent('Question 1');
    expect(updatedMessagesJson).toHaveTextContent('Response 1');
    expect(updatedMessagesJson).toHaveTextContent('Question 2');
    expect(updatedMessagesJson).not.toHaveTextContent('Response 2');
    expect(updatedMessagesJson).not.toHaveTextContent('Question 3');
    expect(updatedMessagesJson).not.toHaveTextContent('Response 3');
  });

  it('should call handleSendMessage with original content when retry is clicked on a user question', async () => {
    const user = userEvent.setup();
    const mockHandleSendMessage = jest.fn();

    function TestComponent() {
      const { addMessage, getCurrentConversation, truncateMessagesAfter } = useChatContext();

      React.useEffect(() => {
        // Build conversation: Q1, R1, Q2, R2
        addMessage('Question 1', 'user');
        addMessage('Response 1', 'assistant');
        addMessage('Question 2', 'user');
        addMessage('Response 2', 'assistant');
      }, [addMessage]);

      const conversation = getCurrentConversation();
      const messages = conversation?.messages || [];
      const q2Message = messages[2]; // Question 2

      const handleRetry = (messageId: string) => {
        truncateMessagesAfter(messageId);
        // Find the message that was clicked
        const messageToRetry = messages.find(m => m.id === messageId);
        if (messageToRetry && messageToRetry.role === 'user') {
          // Simulate re-submission
          mockHandleSendMessage(messageToRetry.content, messageToRetry.attachments);
        }
      };

      return (
        <div>
          {q2Message && (
            <Message
              message={q2Message}
              isDark={false}
              onRetry={handleRetry}
            />
          )}
          <div data-testid="message-count">{messages.length}</div>
        </div>
      );
    }

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Wait for initial 4 messages
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('4');
    });

    // Click retry on Q2
    const retryButton = screen.getByLabelText(/retry/i);
    await user.click(retryButton);

    // Verify truncation happened (should have 3 messages: Q1, R1, Q2)
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('3');
    });

    // Verify handleSendMessage was called with the original question content
    expect(mockHandleSendMessage).toHaveBeenCalledTimes(1);
    expect(mockHandleSendMessage).toHaveBeenCalledWith('Question 2', undefined);
  });

  it('should show an edit button on user questions to the right of the retry button', () => {
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

    // Verify retry button exists
    const retryButton = screen.getByLabelText(/retry/i);
    expect(retryButton).toBeInTheDocument();

    // Verify edit button exists
    const editButton = screen.getByLabelText(/edit/i);
    expect(editButton).toBeInTheDocument();
    expect(editButton.tagName).toBe('BUTTON');

    // Verify button order: copy, retry, then edit (from left to right)
    const actionButtons = screen.getAllByRole('button').filter(btn =>
      btn.getAttribute('aria-label')?.match(/copy message|retry|edit/i)
    );

    expect(actionButtons.length).toBe(3);
    expect(actionButtons[0].getAttribute('aria-label')).toMatch(/copy message/i);
    expect(actionButtons[1].getAttribute('aria-label')).toMatch(/retry/i);
    expect(actionButtons[2].getAttribute('aria-label')).toMatch(/edit/i);
  });

  it('should NOT show an edit button on assistant messages', () => {
    const assistantMessage: MessageType = {
      id: '2',
      role: 'assistant',
      content: 'The weather is sunny today.',
      timestamp: Date.now(),
    };

    render(<Message message={assistantMessage} isDark={false} />);

    // Verify copy and retry buttons exist
    const copyButton = screen.getByLabelText('Copy message');
    expect(copyButton).toBeInTheDocument();

    const retryButton = screen.getByLabelText(/retry/i);
    expect(retryButton).toBeInTheDocument();

    // Verify edit button does NOT exist
    const editButton = screen.queryByLabelText(/edit/i);
    expect(editButton).not.toBeInTheDocument();

    // Verify only 2 action buttons (copy and retry)
    const actionButtons = screen.getAllByRole('button').filter(btn =>
      btn.getAttribute('aria-label')?.match(/copy message|retry|edit/i)
    );
    expect(actionButtons.length).toBe(2);
  });
});
