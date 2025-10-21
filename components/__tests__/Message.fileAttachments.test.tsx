import { render, screen } from '@testing-library/react';
import Message from '../Message';
import { Message as MessageType } from '@/lib/types';

describe('Message - File Attachments', () => {
  const baseMessage: MessageType = {
    id: '1',
    role: 'user',
    content: 'Test message',
    timestamp: Date.now(),
  };

  it('should render message without attachments normally', () => {
    render(<Message message={baseMessage} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should display image attachment with preview', () => {
    const messageWithImage: MessageType = {
      ...baseMessage,
      content: 'Check this out',
      attachments: [
        {
          id: '1',
          name: 'screenshot.png',
          type: 'image/png',
          size: 1024,
          data: 'data:image/png;base64,mockdata',
        },
      ],
    };

    render(<Message message={messageWithImage} />);

    const img = screen.getByAltText('screenshot.png');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;base64,mockdata');
    expect(screen.getByText('screenshot.png')).toBeInTheDocument();
  });

  it('should display multiple image attachments', () => {
    const messageWithImages: MessageType = {
      ...baseMessage,
      content: 'Multiple images',
      attachments: [
        {
          id: '1',
          name: 'image1.jpg',
          type: 'image/jpeg',
          size: 1024,
          data: 'data:image/jpeg;base64,data1',
        },
        {
          id: '2',
          name: 'image2.png',
          type: 'image/png',
          size: 2048,
          data: 'data:image/png;base64,data2',
        },
      ],
    };

    render(<Message message={messageWithImages} />);

    expect(screen.getByAltText('image1.jpg')).toBeInTheDocument();
    expect(screen.getByAltText('image2.png')).toBeInTheDocument();
  });

  it('should display non-image file as download link', () => {
    const messageWithPDF: MessageType = {
      ...baseMessage,
      content: 'Here is the report',
      attachments: [
        {
          id: '1',
          name: 'report.pdf',
          type: 'application/pdf',
          size: 10240,
          data: 'data:application/pdf;base64,mockdata',
        },
      ],
    };

    render(<Message message={messageWithPDF} />);

    const link = screen.getByText('report.pdf').closest('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'data:application/pdf;base64,mockdata');
    expect(link).toHaveAttribute('download', 'report.pdf');
    expect(screen.getByText('10.0 KB')).toBeInTheDocument();
  });

  it('should display mixed image and non-image attachments', () => {
    const messageWithMixed: MessageType = {
      ...baseMessage,
      content: 'Files attached',
      attachments: [
        {
          id: '1',
          name: 'screenshot.png',
          type: 'image/png',
          size: 1024,
          data: 'data:image/png;base64,imagedata',
        },
        {
          id: '2',
          name: 'data.csv',
          type: 'text/csv',
          size: 2048,
          data: 'data:text/csv;base64,csvdata',
        },
      ],
    };

    render(<Message message={messageWithMixed} />);

    // Check image is displayed
    expect(screen.getByAltText('screenshot.png')).toBeInTheDocument();

    // Check CSV is a download link
    const csvLink = screen.getByText('data.csv').closest('a');
    expect(csvLink).toHaveAttribute('download', 'data.csv');
  });

  it('should format file sizes correctly', () => {
    const testCases = [
      { size: 500, expected: '500 B' },
      { size: 1024, expected: '1.0 KB' },
      { size: 1536, expected: '1.5 KB' },
      { size: 1048576, expected: '1.0 MB' },
      { size: 5242880, expected: '5.0 MB' },
    ];

    testCases.forEach(({ size, expected }) => {
      const { unmount } = render(
        <Message
          message={{
            ...baseMessage,
            attachments: [
              {
                id: '1',
                name: 'test.txt',
                type: 'text/plain',
                size,
                data: 'data:text/plain;base64,data',
              },
            ],
          }}
        />
      );

      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('should display attachments for assistant messages', () => {
    const assistantMessage: MessageType = {
      id: '2',
      role: 'assistant',
      content: 'Here is the diagram',
      timestamp: Date.now(),
      attachments: [
        {
          id: '1',
          name: 'diagram.png',
          type: 'image/png',
          size: 2048,
          data: 'data:image/png;base64,diagramdata',
        },
      ],
    };

    render(<Message message={assistantMessage} />);

    expect(screen.getByAltText('diagram.png')).toBeInTheDocument();
    expect(screen.getByText('Here is the diagram')).toBeInTheDocument();
  });

  it('should handle message with attachments but no text content', () => {
    const messageNoText: MessageType = {
      ...baseMessage,
      content: '',
      attachments: [
        {
          id: '1',
          name: 'image.jpg',
          type: 'image/jpeg',
          size: 1024,
          data: 'data:image/jpeg;base64,data',
        },
      ],
    };

    render(<Message message={messageNoText} />);

    expect(screen.getByAltText('image.jpg')).toBeInTheDocument();
  });

  it('should handle various image formats', () => {
    const imageFormats = [
      { type: 'image/png', name: 'test.png' },
      { type: 'image/jpeg', name: 'test.jpg' },
      { type: 'image/gif', name: 'test.gif' },
      { type: 'image/webp', name: 'test.webp' },
      { type: 'image/svg+xml', name: 'test.svg' },
    ];

    imageFormats.forEach((format) => {
      const { unmount } = render(
        <Message
          message={{
            ...baseMessage,
            attachments: [
              {
                id: '1',
                name: format.name,
                type: format.type,
                size: 1024,
                data: `data:${format.type};base64,data`,
              },
            ],
          }}
        />
      );

      const img = screen.getByAltText(format.name);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', `data:${format.type};base64,data`);
      unmount();
    });
  });

  it('should handle various document formats as download links', () => {
    const documentFormats = [
      { type: 'application/pdf', name: 'document.pdf' },
      { type: 'text/plain', name: 'notes.txt' },
      { type: 'text/csv', name: 'data.csv' },
      { type: 'application/json', name: 'config.json' },
      { type: 'application/zip', name: 'archive.zip' },
    ];

    documentFormats.forEach((format) => {
      const { unmount } = render(
        <Message
          message={{
            ...baseMessage,
            attachments: [
              {
                id: '1',
                name: format.name,
                type: format.type,
                size: 1024,
                data: `data:${format.type};base64,data`,
              },
            ],
          }}
        />
      );

      const link = screen.getByText(format.name).closest('a');
      expect(link).toHaveAttribute('download', format.name);
      expect(link).toHaveAttribute('href', `data:${format.type};base64,data`);
      unmount();
    });
  });

  it('should show download icon for non-image files', () => {
    const messageWithDoc: MessageType = {
      ...baseMessage,
      attachments: [
        {
          id: '1',
          name: 'document.pdf',
          type: 'application/pdf',
          size: 1024,
          data: 'data:application/pdf;base64,data',
        },
      ],
    };

    const { container } = render(<Message message={messageWithDoc} />);

    // Check for download icon (HiDownload renders as svg)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should maintain message text and attachments layout', () => {
    const message: MessageType = {
      ...baseMessage,
      content: 'Please review these files',
      attachments: [
        {
          id: '1',
          name: 'report.pdf',
          type: 'application/pdf',
          size: 1024,
          data: 'data:application/pdf;base64,data',
        },
      ],
    };

    const { container } = render(<Message message={message} />);

    // Attachments should appear before the message content
    const messageBox = container.querySelector('.max-w-\\[80\\%\\]');
    expect(messageBox).toBeInTheDocument();

    // Both attachment and text should be present
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('Please review these files')).toBeInTheDocument();
  });

  it('should apply correct styles for user messages with attachments', () => {
    const userMessage: MessageType = {
      ...baseMessage,
      role: 'user',
      attachments: [
        {
          id: '1',
          name: 'image.png',
          type: 'image/png',
          size: 1024,
          data: 'data:image/png;base64,data',
        },
      ],
    };

    const { container } = render(<Message message={userMessage} />);

    const messageBox = container.querySelector('.bg-blue-400');
    expect(messageBox).toBeInTheDocument();
  });

  it('should apply correct styles for assistant messages with attachments', () => {
    const assistantMessage: MessageType = {
      id: '2',
      role: 'assistant',
      content: 'Analysis complete',
      timestamp: Date.now(),
      attachments: [
        {
          id: '1',
          name: 'chart.png',
          type: 'image/png',
          size: 1024,
          data: 'data:image/png;base64,data',
        },
      ],
    };

    const { container } = render(<Message message={assistantMessage} isDark={false} />);

    const messageBox = container.querySelector('.bg-white');
    expect(messageBox).toBeInTheDocument();
  });
});
