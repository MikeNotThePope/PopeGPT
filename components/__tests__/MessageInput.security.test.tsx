import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from '../MessageInput';
import { MAX_FILE_SIZE, MAX_ATTACHMENTS, MAX_MESSAGE_LENGTH } from '@/lib/constants';

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
    setTimeout(() => {
      this.result = `data:${file.type};base64,mockbase64data`;
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
}

(global as any).FileReader = MockFileReader;

describe('MessageInput - Security Features', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
  });

  describe('File Size Limits', () => {
    it('should reject files exceeding MAX_FILE_SIZE', async () => {
      render(<MessageInput onSend={mockOnSend} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const oversizedFile = createMockFile('large-file.pdf', MAX_FILE_SIZE + 1, 'application/pdf');

      fireEvent.change(fileInput, {
        target: { files: [oversizedFile] },
      });

      await waitFor(() => {
        expect(screen.getByText(/exceeds.*MB limit/i)).toBeInTheDocument();
        expect(screen.queryByText('large-file.pdf')).not.toBeInTheDocument();
      });
    });

    it('should accept files within MAX_FILE_SIZE', async () => {
      render(<MessageInput onSend={mockOnSend} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('valid-file.pdf', MAX_FILE_SIZE - 1000, 'application/pdf');

      fireEvent.change(fileInput, {
        target: { files: [validFile] },
      });

      await waitFor(() => {
        expect(screen.getByText('valid-file.pdf')).toBeInTheDocument();
        expect(screen.queryByText(/exceeds.*MB limit/i)).not.toBeInTheDocument();
      });
    });

    it('should accept files exactly at MAX_FILE_SIZE', async () => {
      render(<MessageInput onSend={mockOnSend} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const exactFile = createMockFile('exact-size.pdf', MAX_FILE_SIZE, 'application/pdf');

      fireEvent.change(fileInput, {
        target: { files: [exactFile] },
      });

      await waitFor(() => {
        expect(screen.getByText('exact-size.pdf')).toBeInTheDocument();
        expect(screen.queryByText(/exceeds.*MB limit/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('File Type Restrictions', () => {
    it('should reject disallowed file types', async () => {
      render(<MessageInput onSend={mockOnSend} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = createMockFile('executable.exe', 1024, 'application/x-msdownload');

      fireEvent.change(fileInput, {
        target: { files: [invalidFile] },
      });

      await waitFor(() => {
        expect(screen.getByText(/File type.*not allowed/i)).toBeInTheDocument();
        expect(screen.queryByText('executable.exe')).not.toBeInTheDocument();
      });
    });

    it('should accept allowed image types', async () => {
      render(<MessageInput onSend={mockOnSend} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = createMockFile('image.png', 1024, 'image/png');

      fireEvent.change(fileInput, {
        target: { files: [imageFile] },
      });

      await waitFor(() => {
        expect(screen.getByText('image.png')).toBeInTheDocument();
        expect(screen.queryByText(/not allowed/i)).not.toBeInTheDocument();
      });
    });

    it('should accept allowed document types', async () => {
      render(<MessageInput onSend={mockOnSend} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const pdfFile = createMockFile('document.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, {
        target: { files: [pdfFile] },
      });

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
        expect(screen.queryByText(/not allowed/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Attachment Count Limits', () => {
    it('should reject files when MAX_ATTACHMENTS limit is reached', async () => {
      render(<MessageInput onSend={mockOnSend} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Add MAX_ATTACHMENTS files
      const files = Array.from({ length: MAX_ATTACHMENTS }, (_, i) =>
        createMockFile(`file${i}.png`, 1024, 'image/png')
      );

      fireEvent.change(fileInput, { target: { files } });

      await waitFor(() => {
        expect(screen.getByText('file0.png')).toBeInTheDocument();
      });

      // Try to add one more file
      const extraFile = createMockFile('extra.png', 1024, 'image/png');
      fireEvent.change(fileInput, { target: { files: [extraFile] } });

      await waitFor(() => {
        expect(screen.getByText(`Maximum ${MAX_ATTACHMENTS} files allowed`)).toBeInTheDocument();
        expect(screen.queryByText('extra.png')).not.toBeInTheDocument();
      });
    });

    it('should disable attachment button when MAX_ATTACHMENTS is reached', async () => {
      render(<MessageInput onSend={mockOnSend} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const attachButton = screen.getByTitle('Attach files');

      expect(attachButton).not.toBeDisabled();

      // Add MAX_ATTACHMENTS files
      const files = Array.from({ length: MAX_ATTACHMENTS }, (_, i) =>
        createMockFile(`file${i}.png`, 1024, 'image/png')
      );

      fireEvent.change(fileInput, { target: { files } });

      await waitFor(() => {
        expect(screen.getByText('file0.png')).toBeInTheDocument();
      });

      // Check button is disabled
      const disabledButton = screen.getByTitle(`Maximum ${MAX_ATTACHMENTS} files`);
      expect(disabledButton).toBeDisabled();
    });

    it('should allow adding files when under MAX_ATTACHMENTS limit', async () => {
      render(<MessageInput onSend={mockOnSend} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Add MAX_ATTACHMENTS - 1 files
      const files = Array.from({ length: MAX_ATTACHMENTS - 1 }, (_, i) =>
        createMockFile(`file${i}.png`, 1024, 'image/png')
      );

      fireEvent.change(fileInput, { target: { files } });

      await waitFor(() => {
        expect(screen.getByText('file0.png')).toBeInTheDocument();
      });

      // Should still allow one more
      const oneMoreFile = createMockFile('last.png', 1024, 'image/png');
      fireEvent.change(fileInput, { target: { files: [oneMoreFile] } });

      await waitFor(() => {
        expect(screen.getByText('last.png')).toBeInTheDocument();
      });
    });
  });

  describe('Message Length Validation', () => {
    it('should reject messages exceeding MAX_MESSAGE_LENGTH', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i) as HTMLTextAreaElement;
      const longMessage = 'a'.repeat(MAX_MESSAGE_LENGTH + 1);

      // Use fireEvent.change instead of user.type for large text (much faster)
      fireEvent.change(textarea, { target: { value: longMessage } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(`Message exceeds ${MAX_MESSAGE_LENGTH} character limit`)).toBeInTheDocument();
        expect(mockOnSend).not.toHaveBeenCalled();
      });
    });

    it('should accept messages at MAX_MESSAGE_LENGTH', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i) as HTMLTextAreaElement;
      const maxMessage = 'a'.repeat(MAX_MESSAGE_LENGTH);

      // Use fireEvent.change instead of user.type for large text (much faster)
      fireEvent.change(textarea, { target: { value: maxMessage } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith(maxMessage, undefined);
        expect(screen.queryByText(/exceeds.*character limit/i)).not.toBeInTheDocument();
      });
    });

    it('should accept messages under MAX_MESSAGE_LENGTH', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const normalMessage = 'This is a normal message';

      await user.type(textarea, normalMessage);

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith(normalMessage, undefined);
        expect(screen.queryByText(/exceeds.*character limit/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Message Display', () => {
    it('should clear error when valid file is uploaded after error', async () => {
      render(<MessageInput onSend={mockOnSend} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // First, upload oversized file
      const oversizedFile = createMockFile('large.pdf', MAX_FILE_SIZE + 1, 'application/pdf');
      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

      await waitFor(() => {
        expect(screen.getByText(/exceeds.*MB limit/i)).toBeInTheDocument();
      });

      // Then upload valid file
      const validFile = createMockFile('valid.pdf', 1024, 'application/pdf');
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(screen.getByText('valid.pdf')).toBeInTheDocument();
        expect(screen.queryByText(/exceeds.*MB limit/i)).not.toBeInTheDocument();
      });
    });

    it('should clear error when message is sent successfully', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText(/type your message/i) as HTMLTextAreaElement;
      const longMessage = 'a'.repeat(MAX_MESSAGE_LENGTH + 1);

      // Try to send long message using fireEvent for speed
      fireEvent.change(textarea, { target: { value: longMessage } });
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/character limit/i)).toBeInTheDocument();
      });

      // Clear textarea and send valid message
      fireEvent.change(textarea, { target: { value: 'Valid message' } });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Valid message', undefined);
        expect(screen.queryByText(/character limit/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('File Input Accept Attribute', () => {
    it('should have correct accept attribute for allowed file types', () => {
      render(<MessageInput onSend={mockOnSend} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const acceptAttr = fileInput.getAttribute('accept');

      expect(acceptAttr).toContain('image/jpeg');
      expect(acceptAttr).toContain('image/png');
      expect(acceptAttr).toContain('application/pdf');
      expect(acceptAttr).toContain('text/plain');
    });
  });
});
