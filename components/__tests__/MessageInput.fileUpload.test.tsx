import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from '../MessageInput';

// Helper to create mock files
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock FileReader
class MockFileReader {
  onload: ((event: any) => void) | null = null;
  result: string | null = null;

  readAsDataURL(file: File) {
    // Simulate async file reading
    setTimeout(() => {
      this.result = `data:${file.type};base64,mockbase64data`;
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
}

(global as any).FileReader = MockFileReader;

describe('MessageInput - File Upload', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
  });

  it('should render file attachment button', () => {
    render(<MessageInput onSend={mockOnSend} />);

    const attachButton = screen.getByTitle('Attach files');
    expect(attachButton).toBeInTheDocument();
  });

  it('should open file dialog when attachment button is clicked', () => {
    render(<MessageInput onSend={mockOnSend} />);

    const attachButton = screen.getByTitle('Attach files');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    expect(fileInput).toBeInTheDocument();
    expect(fileInput.className).toContain('hidden'); // Hidden input via Tailwind

    // Spy on click method
    const clickSpy = jest.spyOn(fileInput, 'click');

    fireEvent.click(attachButton);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should display preview for selected image file', async () => {
    render(<MessageInput onSend={mockOnSend} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('test-image.png', 1024, 'image/png');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
      expect(screen.getByText('1.0 KB')).toBeInTheDocument();
    });
  });

  it('should display preview for non-image file', async () => {
    render(<MessageInput onSend={mockOnSend} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('document.pdf', 2048000, 'application/pdf');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    });
  });

  it('should handle multiple file uploads', async () => {
    render(<MessageInput onSend={mockOnSend} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile1 = createMockFile('image1.jpg', 1024, 'image/jpeg');
    const mockFile2 = createMockFile('image2.png', 2048, 'image/png');

    fireEvent.change(fileInput, {
      target: { files: [mockFile1, mockFile2] },
    });

    await waitFor(() => {
      expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      expect(screen.getByText('image2.png')).toBeInTheDocument();
    });
  });

  it('should remove file when remove button is clicked', async () => {
    render(<MessageInput onSend={mockOnSend} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('test-image.png', 1024, 'image/png');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
    });

    const removeButton = screen.getByTitle('Remove file');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('test-image.png')).not.toBeInTheDocument();
    });
  });

  it('should send message with file attachments', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={mockOnSend} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('test-image.png', 1024, 'image/png');

    // Add file
    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
    });

    // Type message
    const textarea = screen.getByPlaceholderText(/type your message/i);
    await user.type(textarea, 'Check out this image!');

    // Send
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith(
        'Check out this image!',
        expect.arrayContaining([
          expect.objectContaining({
            name: 'test-image.png',
            type: 'image/png',
            size: 1024,
            data: expect.stringContaining('data:image/png;base64'),
          }),
        ])
      );
    });
  });

  it('should allow sending files without text message', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={mockOnSend} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('test-image.png', 1024, 'image/png');

    // Add file
    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
    });

    // Send without typing message
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith(
        '',
        expect.arrayContaining([
          expect.objectContaining({
            name: 'test-image.png',
          }),
        ])
      );
    });
  });

  it('should clear attachments after sending', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={mockOnSend} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('test-image.png', 1024, 'image/png');

    // Add file
    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
    });

    // Send
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.queryByText('test-image.png')).not.toBeInTheDocument();
    });
  });

  it('should enable send button when file is attached even without text', async () => {
    render(<MessageInput onSend={mockOnSend} />);

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('test-image.png', 1024, 'image/png');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(sendButton).not.toBeDisabled();
    });
  });

  it('should disable file attachment button when disabled prop is true', () => {
    render(<MessageInput onSend={mockOnSend} disabled={true} />);

    const attachButton = screen.getByTitle('Attach files');
    expect(attachButton).toBeDisabled();
  });

  it('should disable remove button when disabled prop is true', async () => {
    const { rerender } = render(<MessageInput onSend={mockOnSend} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('test-image.png', 1024, 'image/png');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
    });

    // Now disable the component
    rerender(<MessageInput onSend={mockOnSend} disabled={true} />);

    const removeButton = screen.getByTitle('Remove file');
    expect(removeButton).toBeDisabled();
  });

  it('should format file sizes correctly', async () => {
    render(<MessageInput onSend={mockOnSend} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Test bytes
    const smallFile = createMockFile('small.txt', 500, 'text/plain');
    fireEvent.change(fileInput, { target: { files: [smallFile] } });
    await waitFor(() => {
      expect(screen.getByText('500 B')).toBeInTheDocument();
    });

    // Remove file
    fireEvent.click(screen.getByTitle('Remove file'));

    // Test KB
    const mediumFile = createMockFile('medium.txt', 5120, 'text/plain');
    fireEvent.change(fileInput, { target: { files: [mediumFile] } });
    await waitFor(() => {
      expect(screen.getByText('5.0 KB')).toBeInTheDocument();
    });

    // Remove file
    fireEvent.click(screen.getByTitle('Remove file'));

    // Test MB
    const largeFile = createMockFile('large.pdf', 5242880, 'application/pdf');
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    await waitFor(() => {
      expect(screen.getByText('5.0 MB')).toBeInTheDocument();
    });
  });

  it('should display image thumbnail for image files', async () => {
    render(<MessageInput onSend={mockOnSend} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('test-image.png', 1024, 'image/png');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      const img = screen.getByAltText('test-image.png');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', expect.stringContaining('data:image/png'));
    });
  });

  it('should not display image thumbnail for non-image files', async () => {
    render(<MessageInput onSend={mockOnSend} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('document.pdf', 1024, 'application/pdf');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.queryByAltText('document.pdf')).not.toBeInTheDocument();
    });
  });
});
