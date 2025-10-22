import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import Message from '@/components/Message';
import { Message as MessageType } from '@/lib/types';
import { ChatProvider, useChatContext } from '@/lib/ChatContext';

describe('Message - Edit Functionality', () => {
  it('should call onEdit callback when edit button is clicked on a user message', async () => {
    const user = userEvent.setup();
    const mockOnEdit = jest.fn();

    const userMessage: MessageType = {
      id: '1',
      role: 'user',
      content: 'What is the weather today?',
      timestamp: Date.now(),
    };

    render(<Message message={userMessage} isDark={false} onEdit={mockOnEdit} />);

    const editButton = screen.getByLabelText(/edit/i);
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith('1');
  });

  it('should truncate messages after the edited message when edit is clicked', async () => {
    const user = userEvent.setup();

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
      const q1Message = messages[0]; // Question 1

      const handleEdit = (messageId: string) => {
        truncateMessagesAfter(messageId);
      };

      return (
        <div>
          {q1Message && (
            <Message
              message={q1Message}
              isDark={false}
              onEdit={handleEdit}
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

    // Initially should have 4 messages: Q1, R1, Q2, R2
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('4');
    });

    // Verify we have all 4 messages
    const messagesJson = screen.getByTestId('messages-json');
    expect(messagesJson).toHaveTextContent('Question 1');
    expect(messagesJson).toHaveTextContent('Response 1');
    expect(messagesJson).toHaveTextContent('Question 2');
    expect(messagesJson).toHaveTextContent('Response 2');

    // Click edit on Q1
    const editButton = screen.getByLabelText(/edit/i);
    await user.click(editButton);

    // After edit on Q1, should truncate to [Q1]
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('1');
    });

    // Verify only Q1 remains
    const updatedMessagesJson = screen.getByTestId('messages-json');
    expect(updatedMessagesJson).toHaveTextContent('Question 1');
    expect(updatedMessagesJson).not.toHaveTextContent('Response 1');
    expect(updatedMessagesJson).not.toHaveTextContent('Question 2');
    expect(updatedMessagesJson).not.toHaveTextContent('Response 2');
  });

  it('should provide the original message content to allow editing', async () => {
    const user = userEvent.setup();
    const mockGetMessageContent = jest.fn();

    function TestComponent() {
      const { addMessage, getCurrentConversation, truncateMessagesAfter } = useChatContext();

      React.useEffect(() => {
        // Build conversation: Q1, R1
        addMessage('What is the weather?', 'user');
        addMessage('It is sunny.', 'assistant');
      }, [addMessage]);

      const conversation = getCurrentConversation();
      const messages = conversation?.messages || [];
      const q1Message = messages[0];

      const handleEdit = (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (message) {
          // Store the original content for editing
          mockGetMessageContent(message.content);
          truncateMessagesAfter(messageId);
        }
      };

      return (
        <div>
          {q1Message && (
            <Message
              message={q1Message}
              isDark={false}
              onEdit={handleEdit}
            />
          )}
        </div>
      );
    }

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Wait for messages to be added
    await waitFor(() => {
      expect(screen.getByLabelText(/edit/i)).toBeInTheDocument();
    });

    // Click edit
    const editButton = screen.getByLabelText(/edit/i);
    await user.click(editButton);

    // Verify the original content was retrieved
    expect(mockGetMessageContent).toHaveBeenCalledTimes(1);
    expect(mockGetMessageContent).toHaveBeenCalledWith('What is the weather?');
  });

  it('should handle edit on a message in the middle of the conversation', async () => {
    const user = userEvent.setup();

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
      const q2Message = messages[2]; // Question 2 (index 2)

      const handleEdit = (messageId: string) => {
        truncateMessagesAfter(messageId);
      };

      return (
        <div>
          {q2Message && (
            <Message
              message={q2Message}
              isDark={false}
              onEdit={handleEdit}
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

    // Initially should have 6 messages
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('6');
    });

    // Click edit on Q2
    const editButton = screen.getByLabelText(/edit/i);
    await user.click(editButton);

    // After edit on Q2, should truncate to [Q1, R1, Q2]
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('3');
    });

    // Verify Q1, R1, Q2 remain, but R2, Q3, R3 are gone
    const updatedMessagesJson = screen.getByTestId('messages-json');
    expect(updatedMessagesJson).toHaveTextContent('Question 1');
    expect(updatedMessagesJson).toHaveTextContent('Response 1');
    expect(updatedMessagesJson).toHaveTextContent('Question 2');
    expect(updatedMessagesJson).not.toHaveTextContent('Response 2');
    expect(updatedMessagesJson).not.toHaveTextContent('Question 3');
    expect(updatedMessagesJson).not.toHaveTextContent('Response 3');
  });

  it('should not have an edit button on assistant messages', () => {
    const mockOnEdit = jest.fn();

    const assistantMessage: MessageType = {
      id: '2',
      role: 'assistant',
      content: 'The weather is sunny today.',
      timestamp: Date.now(),
    };

    render(<Message message={assistantMessage} isDark={false} onEdit={mockOnEdit} />);

    // Edit button should not exist
    const editButton = screen.queryByLabelText(/edit/i);
    expect(editButton).not.toBeInTheDocument();
  });
});
