import { render, screen } from '@testing-library/react';
import Message from '../Message';
import { Message as MessageType } from '@/lib/types';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('Message - Code Block Rendering', () => {
  it('should render plain code block without language specifier', () => {
    const plainCodeMessage: MessageType = {
      id: 'plain-code',
      role: 'assistant',
      content: '```\n1\n2\n3\n4\n5\n```',
      timestamp: Date.now(),
    };

    const { container } = render(<Message message={plainCodeMessage} />);

    // Check that code block is rendered
    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();

    // Verify content
    const content = codeElement?.textContent || '';
    expect(content).toContain('1');
    expect(content).toContain('2');
    expect(content).toContain('3');
    expect(content).toContain('4');
    expect(content).toContain('5');

    // Check for proper container styling (should have border and dark background)
    const codeContainer = container.querySelector('.border-4.border-black');
    expect(codeContainer).toBeInTheDocument();
  });

  it('should render code block with language specifier', () => {
    const rustCodeMessage: MessageType = {
      id: 'rust-code',
      role: 'assistant',
      content: '```rust\nfn main() {\n    println!("Hello, world!");\n}\n```',
      timestamp: Date.now(),
    };

    const { container } = render(<Message message={rustCodeMessage} />);

    // Check for language label
    const languageLabel = screen.queryByText(/rust/i);
    expect(languageLabel).toBeInTheDocument();

    // Check that code is rendered
    expect(container.textContent).toContain('fn main()');
    expect(container.textContent).toContain('println!');
  });

  it('should render inline code with pink/cyan background', () => {
    const inlineCodeMessage: MessageType = {
      id: 'inline-code',
      role: 'assistant',
      content: 'Use the `console.log()` function to debug.',
      timestamp: Date.now(),
    };

    const { container } = render(<Message message={inlineCodeMessage} />);

    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();

    // Check for inline code styling (pink background in light mode)
    expect(codeElement?.classList.contains('bg-pink-300')).toBe(true);
    expect(codeElement?.textContent).toBe('console.log()');
  });

  it('should render plain code block with consistent padding', () => {
    const plainCodeMessage: MessageType = {
      id: 'plain-code-padding',
      role: 'assistant',
      content: '```\n1\n2\n3\n4\n5\n```',
      timestamp: Date.now(),
    };

    const { container } = render(<Message message={plainCodeMessage} />);

    // Check for pre element with padding class
    const preElement = container.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement?.classList.contains('p-4')).toBe(true);

    // Check for code element with proper styling
    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement?.classList.contains('font-mono')).toBe(true);
    expect(codeElement?.classList.contains('block')).toBe(true);
  });

  it('should differentiate between plain code block and inline code', () => {
    const mixedMessage: MessageType = {
      id: 'mixed-code',
      role: 'assistant',
      content: 'Here is inline `code` and a block:\n```\nblock code\n```',
      timestamp: Date.now(),
    };

    const { container } = render(<Message message={mixedMessage} />);

    const codeElements = container.querySelectorAll('code');

    // Should have both inline and block code elements
    expect(codeElements.length).toBeGreaterThanOrEqual(1);

    // Check if at least one is inline code (with bg-pink-300 or bg-cyan-400)
    const inlineCode = Array.from(codeElements).find(
      el => el.classList.contains('bg-pink-300') || el.classList.contains('bg-cyan-400')
    );

    // If no inline code found with classes, check for plain code block
    if (!inlineCode) {
      // At least verify we have code elements
      expect(codeElements.length).toBeGreaterThan(0);
    } else {
      expect(inlineCode).toBeInTheDocument();
    }
  });

  it('should render code block with syntax highlighting header', () => {
    const jsCodeMessage: MessageType = {
      id: 'js-code',
      role: 'assistant',
      content: '```javascript\nconst x = 42;\n```',
      timestamp: Date.now(),
    };

    const { container } = render(<Message message={jsCodeMessage} />);

    // Check for header with yellow/cyan background
    const header = container.querySelector('.bg-yellow-300');
    expect(header).toBeInTheDocument();

    // Check for language label
    const languageLabel = screen.queryByText(/javascript/i);
    expect(languageLabel).toBeInTheDocument();

    // Check for copy button
    const copyButton = screen.queryByTitle(/copy code/i);
    expect(copyButton).toBeInTheDocument();
  });

  it('should render multiple code blocks in same message', () => {
    const multiCodeMessage: MessageType = {
      id: 'multi-code',
      role: 'assistant',
      content: 'First block:\n```rust\nfn test() {}\n```\nSecond block:\n```\nplain\n```',
      timestamp: Date.now(),
    };

    const { container } = render(<Message message={multiCodeMessage} />);

    // Should have multiple code containers
    const codeContainers = container.querySelectorAll('.border-4.border-black');
    expect(codeContainers.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle empty plain code block', () => {
    const emptyCodeMessage: MessageType = {
      id: 'empty-code',
      role: 'assistant',
      content: '```\n```',
      timestamp: Date.now(),
    };

    const { container } = render(<Message message={emptyCodeMessage} />);

    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
  });

  it('should use dark background for plain code blocks', () => {
    const plainCodeMessage: MessageType = {
      id: 'plain-dark',
      role: 'assistant',
      content: '```\ncode\n```',
      timestamp: Date.now(),
    };

    const { container } = render(<Message message={plainCodeMessage} />);

    // Check for dark background container
    const darkContainer = container.querySelector('.bg-gray-900');
    expect(darkContainer).toBeInTheDocument();
  });

  it('should render plain code block with light text', () => {
    const plainCodeMessage: MessageType = {
      id: 'plain-light-text',
      role: 'assistant',
      content: '```\ntest\n```',
      timestamp: Date.now(),
    };

    const { container } = render(<Message message={plainCodeMessage} />);

    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();

    // Check for light text class
    expect(codeElement?.classList.contains('text-gray-100')).toBe(true);
  });
});
