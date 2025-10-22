import { render, renderHook, act } from '@testing-library/react';
import { ChatProvider, useChatContext } from '../ChatContext';

describe('ChatContext', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useChatContext());
    }).toThrow('useChatContext must be used within a ChatProvider');

    spy.mockRestore();
  });

  it('should initialize with a new conversation', () => {
    const { result } = renderHook(() => useChatContext(), {
      wrapper: ChatProvider,
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.currentConversationId).toBe(result.current.conversations[0].id);
    expect(result.current.conversations[0].title).toBe('New Chat');
    expect(result.current.conversations[0].messages).toEqual([]);
  });

  it('should only create one conversation on initialization (no duplicates)', () => {
    // This test verifies the fix for duplicate conversations
    // that could occur in React Strict Mode
    const { result, rerender } = renderHook(() => useChatContext(), {
      wrapper: ChatProvider,
    });

    // Force a re-render to simulate potential double-mounting
    rerender();

    // Should still only have 1 conversation
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].title).toBe('New Chat');
  });

  it('should add a user message', () => {
    const { result } = renderHook(() => useChatContext(), {
      wrapper: ChatProvider,
    });

    act(() => {
      result.current.addMessage('Hello', 'user');
    });

    const currentConv = result.current.getCurrentConversation();
    expect(currentConv?.messages).toHaveLength(1);
    expect(currentConv?.messages[0].content).toBe('Hello');
    expect(currentConv?.messages[0].role).toBe('user');
  });

  it('should auto-generate conversation title from first user message', () => {
    const { result } = renderHook(() => useChatContext(), {
      wrapper: ChatProvider,
    });

    act(() => {
      result.current.addMessage('What is the weather today?', 'user');
    });

    const currentConv = result.current.getCurrentConversation();
    expect(currentConv?.title).toBe('What is the weather today?');
  });

  it('should truncate long conversation titles', () => {
    const { result } = renderHook(() => useChatContext(), {
      wrapper: ChatProvider,
    });

    const longMessage = 'This is a very long message that should be truncated to 30 characters';

    act(() => {
      result.current.addMessage(longMessage, 'user');
    });

    const currentConv = result.current.getCurrentConversation();
    expect(currentConv?.title).toBe('This is a very long message th...');
  });

  it('should add an assistant message', () => {
    const { result } = renderHook(() => useChatContext(), {
      wrapper: ChatProvider,
    });

    act(() => {
      result.current.addMessage('AI response', 'assistant');
    });

    const currentConv = result.current.getCurrentConversation();
    expect(currentConv?.messages).toHaveLength(1);
    expect(currentConv?.messages[0].role).toBe('assistant');
  });

  it('should update last message', () => {
    const { result } = renderHook(() => useChatContext(), {
      wrapper: ChatProvider,
    });

    act(() => {
      result.current.addMessage('Initial response', 'assistant');
    });

    act(() => {
      result.current.updateLastMessage('Updated response');
    });

    const currentConv = result.current.getCurrentConversation();
    expect(currentConv?.messages[0].content).toBe('Updated response');
  });

  it('should create a new conversation', async () => {
    const { result } = renderHook(() => useChatContext(), {
      wrapper: ChatProvider,
    });

    const initialConvId = result.current.currentConversationId;

    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    act(() => {
      result.current.createNewConversation();
    });

    expect(result.current.conversations).toHaveLength(2);
    expect(result.current.currentConversationId).not.toBe(initialConvId);
  });

  it('should switch conversations', async () => {
    const { result } = renderHook(() => useChatContext(), {
      wrapper: ChatProvider,
    });

    act(() => {
      result.current.addMessage('Message in first chat', 'user');
    });

    const firstConvId = result.current.currentConversationId;

    // Add delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    act(() => {
      result.current.createNewConversation();
    });

    const secondConvId = result.current.currentConversationId;

    act(() => {
      result.current.switchConversation(firstConvId!);
    });

    expect(result.current.currentConversationId).toBe(firstConvId);

    const currentConv = result.current.getCurrentConversation();
    expect(currentConv).toBeDefined();
    expect(currentConv?.messages).toHaveLength(1);
    expect(currentConv?.messages[0].content).toBe('Message in first chat');
  });

  it('should manage streaming state', () => {
    const { result } = renderHook(() => useChatContext(), {
      wrapper: ChatProvider,
    });

    expect(result.current.isStreaming).toBe(false);

    act(() => {
      result.current.setIsStreaming(true);
    });

    expect(result.current.isStreaming).toBe(true);

    act(() => {
      result.current.setIsStreaming(false);
    });

    expect(result.current.isStreaming).toBe(false);
  });

  it('should truncate messages after a specific message', () => {
    const { result } = renderHook(() => useChatContext(), {
      wrapper: ChatProvider,
    });

    // Build conversation: Q1, R1, Q2, R2, Q3, R3
    let q2MessageId: string;
    act(() => {
      result.current.addMessage('Question 1', 'user');
      result.current.addMessage('Response 1', 'assistant');
      result.current.addMessage('Question 2', 'user');
      result.current.addMessage('Response 2', 'assistant');
      result.current.addMessage('Question 3', 'user');
      result.current.addMessage('Response 3', 'assistant');
    });

    const conversation = result.current.getCurrentConversation();
    expect(conversation?.messages).toHaveLength(6);

    // Get Q2's message ID (index 2)
    q2MessageId = conversation!.messages[2].id;

    // Truncate after Q2
    act(() => {
      result.current.truncateMessagesAfter(q2MessageId);
    });

    // Should now only have [Q1, R1, Q2]
    const updatedConversation = result.current.getCurrentConversation();
    expect(updatedConversation?.messages).toHaveLength(3);
    expect(updatedConversation?.messages[0].content).toBe('Question 1');
    expect(updatedConversation?.messages[1].content).toBe('Response 1');
    expect(updatedConversation?.messages[2].content).toBe('Question 2');
  });
});
