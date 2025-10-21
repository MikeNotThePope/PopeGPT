import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';
import { Conversation } from '@/lib/types';

describe('Sidebar', () => {
  const mockConversations: Conversation[] = [
    {
      id: '1',
      title: 'First Chat',
      messages: [],
      createdAt: Date.now(),
    },
    {
      id: '2',
      title: 'Second Chat',
      messages: [],
      createdAt: Date.now(),
    },
  ];

  const mockProps = {
    conversations: mockConversations,
    currentConversationId: '1',
    onNewChat: jest.fn(),
    onSelectConversation: jest.fn(),
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render sidebar with conversations', () => {
    render(<Sidebar {...mockProps} />);

    expect(screen.getByText('PopeGPT')).toBeInTheDocument();
    expect(screen.getByText('First Chat')).toBeInTheDocument();
    expect(screen.getByText('Second Chat')).toBeInTheDocument();
  });

  it('should render New Chat button', () => {
    render(<Sidebar {...mockProps} />);

    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  it('should call onNewChat when New Chat button is clicked', () => {
    render(<Sidebar {...mockProps} />);

    const newChatButton = screen.getByText('New Chat');
    fireEvent.click(newChatButton);

    expect(mockProps.onNewChat).toHaveBeenCalledTimes(1);
  });

  it('should call onSelectConversation when a conversation is clicked', () => {
    render(<Sidebar {...mockProps} />);

    const conversation = screen.getByText('Second Chat');
    fireEvent.click(conversation);

    expect(mockProps.onSelectConversation).toHaveBeenCalledWith('2');
  });

  it('should highlight current conversation', () => {
    const { container } = render(<Sidebar {...mockProps} />);

    const currentConv = screen.getByText('First Chat').closest('button');
    expect(currentConv).toHaveClass('bg-yellow-300');
  });

  it('should call onClose when a conversation is selected on mobile', () => {
    render(<Sidebar {...mockProps} />);

    const conversation = screen.getByText('First Chat');
    fireEvent.click(conversation);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should render close button on mobile', () => {
    render(<Sidebar {...mockProps} />);

    // Close button is visible on mobile (lg:hidden class)
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn =>
      btn.querySelector('svg') && btn.className.includes('lg:hidden')
    );

    expect(closeButton).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<Sidebar {...mockProps} />);

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn =>
      btn.querySelector('svg') && btn.className.includes('lg:hidden')
    );

    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockProps.onClose).toHaveBeenCalled();
    }
  });

  it('should show overlay when open on mobile', () => {
    const { container } = render(<Sidebar {...mockProps} />);

    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
  });

  it('should not show overlay when closed', () => {
    const { container } = render(<Sidebar {...mockProps} isOpen={false} />);

    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).not.toBeInTheDocument();
  });

  it('should render theme toggle', () => {
    render(<Sidebar {...mockProps} />);

    const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeToggle).toBeInTheDocument();
  });

  it('should display "Powered by Claude 3 Haiku" text', () => {
    render(<Sidebar {...mockProps} />);

    expect(screen.getByText(/powered by claude 3 haiku/i)).toBeInTheDocument();
  });
});
