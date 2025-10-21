import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from '../MessageInput';

describe('MessageInput', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
  });

  it('should render textarea and send button', () => {
    render(<MessageInput onSend={mockOnSend} />);

    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should update input value when typing', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/type your message/i);
    await user.type(textarea, 'Hello world');

    expect(textarea).toHaveValue('Hello world');
  });

  it('should call onSend when send button is clicked', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(textarea, 'Test message');
    await user.click(sendButton);

    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  it('should clear input after sending', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(textarea, 'Test message');
    await user.click(sendButton);

    expect(textarea).toHaveValue('');
  });

  it('should call onSend when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/type your message/i);

    await user.type(textarea, 'Test message{Enter}');

    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  it('should not send when Shift+Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/type your message/i);

    await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

    expect(mockOnSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Line 1\nLine 2');
  });

  it('should disable send button when input is empty', () => {
    render(<MessageInput onSend={mockOnSend} />);

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should disable send button when input is only whitespace', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(textarea, '   ');

    expect(sendButton).toBeDisabled();
  });

  it('should disable textarea and button when disabled prop is true', () => {
    render(<MessageInput onSend={mockOnSend} disabled={true} />);

    const textarea = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button');

    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('should show "Sending..." when disabled', () => {
    render(<MessageInput onSend={mockOnSend} disabled={true} />);

    expect(screen.getByText(/sending/i)).toBeInTheDocument();
  });

  it('should auto-focus when enabled after being disabled', () => {
    const { rerender } = render(<MessageInput onSend={mockOnSend} disabled={true} />);

    const textarea = screen.getByPlaceholderText(/type your message/i);

    rerender(<MessageInput onSend={mockOnSend} disabled={false} />);

    waitFor(() => {
      expect(textarea).toHaveFocus();
    });
  });
});
