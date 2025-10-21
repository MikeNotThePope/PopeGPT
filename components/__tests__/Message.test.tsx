import { render, screen, fireEvent } from '@testing-library/react';
import Message from '../Message';
import { Message as MessageType } from '@/lib/types';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('Message', () => {
  const userMessage: MessageType = {
    id: '1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: Date.now(),
  };

  const assistantMessage: MessageType = {
    id: '2',
    role: 'assistant',
    content: 'I am doing well, thank you!',
    timestamp: Date.now(),
  };

  const assistantMessageWithCode: MessageType = {
    id: '3',
    role: 'assistant',
    content: '```javascript\nconst hello = "world";\nconsole.log(hello);\n```',
    timestamp: Date.now(),
  };

  it('should render user message', () => {
    render(<Message message={userMessage} />);

    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
  });

  it('should render assistant message', () => {
    render(<Message message={assistantMessage} />);

    expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument();
  });

  it('should style user messages differently', () => {
    const { container } = render(<Message message={userMessage} />);

    const messageDiv = container.querySelector('.bg-blue-600');
    expect(messageDiv).toBeInTheDocument();
  });

  it('should style assistant messages differently', () => {
    const { container } = render(<Message message={assistantMessage} />);

    const messageDiv = container.querySelector('.bg-gray-100');
    expect(messageDiv).toBeInTheDocument();
  });

  it('should render code blocks with syntax highlighting', () => {
    const { container } = render(<Message message={assistantMessageWithCode} />);

    // Check for code element
    const codeElements = container.querySelectorAll('code');
    expect(codeElements.length).toBeGreaterThan(0);
  });

  it('should show copy button for code blocks', () => {
    render(<Message message={assistantMessageWithCode} />);

    // The copy button should be in the document
    const copyButtons = screen.queryAllByTitle(/copy code/i);
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it('should copy code to clipboard when copy button is clicked', async () => {
    render(<Message message={assistantMessageWithCode} />);

    const copyButton = screen.getAllByTitle(/copy code/i)[0];
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'const hello = "world";\nconsole.log(hello);'
    );
  });

  it('should render markdown formatting', () => {
    const markdownMessage: MessageType = {
      id: '4',
      role: 'assistant',
      content: '**Bold text** and *italic text*',
      timestamp: Date.now(),
    };

    const { container } = render(<Message message={markdownMessage} />);

    const strong = container.querySelector('strong');
    const em = container.querySelector('em');

    expect(strong).toBeInTheDocument();
    expect(em).toBeInTheDocument();
  });

  it('should render inline code', () => {
    const inlineCodeMessage: MessageType = {
      id: '5',
      role: 'assistant',
      content: 'Use the `console.log()` function',
      timestamp: Date.now(),
    };

    const { container } = render(<Message message={inlineCodeMessage} />);

    const code = container.querySelector('code');
    expect(code).toBeInTheDocument();
    expect(code).toHaveTextContent('console.log()');
  });
});
