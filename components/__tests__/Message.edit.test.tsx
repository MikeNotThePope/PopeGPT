import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import Message from '@/components/Message';
import { Message as MessageType } from '@/lib/types';
import { ChatProvider, useChatContext } from '@/lib/ChatContext';

describe('Message - Edit Functionality', () => {
  it('should show inline editor when edit button is clicked and call onEdit when saved', async () => {
    const user = userEvent.setup();
    const mockOnEdit = jest.fn();

    const userMessage: MessageType = {
      id: '1',
      role: 'user',
      content: 'What is the weather today?',
      timestamp: Date.now(),
    };

    render(<Message message={userMessage} isDark={false} onEdit={mockOnEdit} />);

    // Click edit button
    const editButton = screen.getByLabelText(/edit/i);
    await user.click(editButton);

    // Should show inline textarea with current content
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe('What is the weather today?');

    // Edit the content
    await user.clear(textarea);
    await user.type(textarea, 'What is the temperature?');

    // Click save
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should call onEdit with messageId and new content
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith('1', 'What is the temperature?');
  });

  it('should truncate messages after the edited message when save is clicked', async () => {
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

      const handleEdit = (messageId: string, newContent: string) => {
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

    // Should show inline editor
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();

    // Messages should still be 4 (not truncated yet)
    expect(screen.getByTestId('message-count')).toHaveTextContent('4');

    // Edit and save
    await user.clear(textarea);
    await user.type(textarea, 'Edited Question 1');
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // After save, should truncate to [Q1]
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

  it('should populate the inline editor with the original message content', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const { addMessage, getCurrentConversation } = useChatContext();

      React.useEffect(() => {
        // Build conversation: Q1, R1
        addMessage('What is the weather?', 'user');
        addMessage('It is sunny.', 'assistant');
      }, [addMessage]);

      const conversation = getCurrentConversation();
      const messages = conversation?.messages || [];
      const q1Message = messages[0];

      const handleEdit = (messageId: string, newContent: string) => {
        // Mock handler
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

    // Verify the inline textarea is populated with original content
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe('What is the weather?');
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

      const handleEdit = (messageId: string, newContent: string) => {
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

    // Should show inline editor
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();

    // Messages should still be 6 (not truncated yet)
    expect(screen.getByTestId('message-count')).toHaveTextContent('6');

    // Edit and save
    await user.clear(textarea);
    await user.type(textarea, 'Edited Question 2');
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // After save on Q2, should truncate to [Q1, R1, Q2]
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
