import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SmoothStreamingText, { SmoothStreamingTextRef } from '../SmoothStreamingText';
import { createRef } from 'react';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock useSmoothStreaming hook
jest.mock('@/lib/useSmoothStreaming', () => ({
  useSmoothStreaming: jest.fn(({ onUpdate, onComplete }) => ({
    addChunk: jest.fn((chunk: string) => {
      // Simulate immediate update
      onUpdate?.(chunk);
    }),
    finishStreaming: jest.fn(() => {
      // Simulate completion
      onComplete?.();
    }),
    reset: jest.fn(() => {
      onUpdate?.('');
    }),
    skipToEnd: jest.fn(() => {
      onComplete?.();
    }),
  })),
}));

describe('SmoothStreamingText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render streaming text in plain text mode initially', () => {
    const ref = createRef<SmoothStreamingTextRef>();
    const { container } = render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent="Hello, world!"
      />
    );

    // Should have plain text div during streaming
    const textDiv = container.querySelector('.whitespace-pre-wrap');
    expect(textDiv).toBeInTheDocument();
  });

  it('should switch to markdown rendering after streaming completes', () => {
    const ref = createRef<SmoothStreamingTextRef>();
    const { rerender } = render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent="**Bold text**"
      />
    );

    // Complete streaming
    act(() => {
      ref.current?.finishStreaming();
    });

    // Force re-render to see markdown
    rerender(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent="**Bold text**"
      />
    );

    // Should now render markdown with prose classes
    const proseDiv = document.querySelector('.prose');
    expect(proseDiv).toBeInTheDocument();
  });

  it('should render code blocks with syntax highlighting after streaming', () => {
    const ref = createRef<SmoothStreamingTextRef>();
    const codeContent = '```javascript\nconst hello = "world";\n```';

    const { rerender } = render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent={codeContent}
      />
    );

    // Complete streaming
    act(() => {
      ref.current?.finishStreaming();
    });

    // Force re-render
    rerender(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent={codeContent}
      />
    );

    // Should render code block with language label
    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByText(/const hello/)).toBeInTheDocument();
  });

  it('should render copy button for code blocks', () => {
    const ref = createRef<SmoothStreamingTextRef>();
    const codeContent = '```python\nprint("hello")\n```';

    const { rerender } = render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent={codeContent}
      />
    );

    // Complete streaming
    act(() => {
      ref.current?.finishStreaming();
    });

    // Force re-render
    rerender(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent={codeContent}
      />
    );

    // Should have copy button
    const copyButton = screen.getByTitle('Copy code');
    expect(copyButton).toBeInTheDocument();
  });

  it('should copy code to clipboard when copy button is clicked', async () => {
    const ref = createRef<SmoothStreamingTextRef>();
    const codeContent = '```javascript\nconst test = 123;\n```';

    const { rerender } = render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent={codeContent}
      />
    );

    // Complete streaming
    act(() => {
      ref.current?.finishStreaming();
    });

    // Force re-render
    rerender(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent={codeContent}
      />
    );

    // Click copy button
    const copyButton = screen.getByTitle('Copy code');
    fireEvent.click(copyButton);

    // Should call clipboard API
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const test = 123;');

    // Should show checkmark icon temporarily
    await waitFor(() => {
      expect(screen.getByTitle('Copy code')).toBeInTheDocument();
    });
  });

  it('should render inline code with custom styling', () => {
    const ref = createRef<SmoothStreamingTextRef>();
    const content = 'Use the `console.log()` function';

    const { rerender } = render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent={content}
      />
    );

    // Complete streaming
    act(() => {
      ref.current?.finishStreaming();
    });

    // Force re-render
    rerender(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent={content}
      />
    );

    // Should render inline code
    const inlineCode = screen.getByText('console.log()');
    expect(inlineCode).toBeInTheDocument();
    expect(inlineCode.tagName).toBe('CODE');
  });

  it('should apply dark mode styles when isDark is true', () => {
    const ref = createRef<SmoothStreamingTextRef>();
    const codeContent = '```javascript\nconst x = 1;\n```';

    const { rerender, container } = render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent={codeContent}
        isDark={true}
      />
    );

    // Complete streaming
    act(() => {
      ref.current?.finishStreaming();
    });

    // Force re-render
    rerender(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent={codeContent}
        isDark={true}
      />
    );

    // Check for dark mode classes
    const proseDiv = container.querySelector('.dark\\:prose-invert');
    expect(proseDiv).toBeInTheDocument();
  });

  it('should call onContentChange callback when content updates', () => {
    const onContentChange = jest.fn();
    const ref = createRef<SmoothStreamingTextRef>();

    render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent="Hello"
        onContentChange={onContentChange}
      />
    );

    // Add chunk should trigger onContentChange
    act(() => {
      ref.current?.addChunk('Hello');
    });

    // Should have called the callback
    expect(onContentChange).toHaveBeenCalled();
  });

  it('should expose addChunk method via ref', () => {
    const ref = createRef<SmoothStreamingTextRef>();

    render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent="Test"
      />
    );

    expect(ref.current?.addChunk).toBeDefined();
    expect(typeof ref.current?.addChunk).toBe('function');
  });

  it('should expose finishStreaming method via ref', () => {
    const ref = createRef<SmoothStreamingTextRef>();

    render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent="Test"
      />
    );

    expect(ref.current?.finishStreaming).toBeDefined();
    expect(typeof ref.current?.finishStreaming).toBe('function');
  });

  it('should expose reset method via ref', () => {
    const ref = createRef<SmoothStreamingTextRef>();

    render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent="Test"
      />
    );

    expect(ref.current?.reset).toBeDefined();
    expect(typeof ref.current?.reset).toBe('function');
  });

  it('should expose skipToEnd method via ref', () => {
    const ref = createRef<SmoothStreamingTextRef>();

    render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent="Test"
      />
    );

    expect(ref.current?.skipToEnd).toBeDefined();
    expect(typeof ref.current?.skipToEnd).toBe('function');
  });

  it('should reset streaming state when reset is called', () => {
    const ref = createRef<SmoothStreamingTextRef>();
    const { rerender } = render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent="First message"
      />
    );

    // Complete streaming
    act(() => {
      ref.current?.finishStreaming();
    });

    // Force re-render to markdown mode
    rerender(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent="First message"
      />
    );

    // Should be in markdown mode
    expect(document.querySelector('.prose')).toBeInTheDocument();

    // Reset
    act(() => {
      ref.current?.reset();
    });

    // Force re-render
    rerender(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent="Second message"
      />
    );

    // Should be back in plain text mode
    const textDiv = document.querySelector('.whitespace-pre-wrap');
    expect(textDiv).toBeInTheDocument();
  });

  it('should use custom charsPerSecond if provided', () => {
    const useSmoothStreaming = require('@/lib/useSmoothStreaming').useSmoothStreaming;
    const ref = createRef<SmoothStreamingTextRef>();

    render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent="Test"
        charsPerSecond={120}
      />
    );

    // Check that useSmoothStreaming was called with the custom value
    expect(useSmoothStreaming).toHaveBeenCalledWith(
      expect.objectContaining({
        charsPerSecond: 120,
      })
    );
  });

  it('should use default charsPerSecond of 1 if not provided', () => {
    const useSmoothStreaming = require('@/lib/useSmoothStreaming').useSmoothStreaming;
    const ref = createRef<SmoothStreamingTextRef>();

    render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent="Test"
      />
    );

    // Check that useSmoothStreaming was called with the default value
    expect(useSmoothStreaming).toHaveBeenCalledWith(
      expect.objectContaining({
        charsPerSecond: 50,
      })
    );
  });

  it('should render markdown formatting correctly', () => {
    const ref = createRef<SmoothStreamingTextRef>();
    const content = '**Bold** and *italic* text';

    const { rerender } = render(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent={content}
      />
    );

    // Complete streaming
    act(() => {
      ref.current?.finishStreaming();
    });

    // Force re-render
    rerender(
      <SmoothStreamingText
        ref={ref}
        messageId="msg-1"
        finalMessageContent={content}
      />
    );

    // Should render bold and italic
    expect(screen.getByText('Bold').tagName).toBe('STRONG');
    expect(screen.getByText('italic').tagName).toBe('EM');
  });
});
