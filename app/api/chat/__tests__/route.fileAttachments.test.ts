import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock fetch
global.fetch = jest.fn();

describe('Chat API Route - File Attachments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENROUTER_API_KEY = 'test-api-key';
  });

  it('should handle messages without attachments', async () => {
    const mockReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'));
        controller.close();
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    });

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.messages[0]).toEqual({
      role: 'user',
      content: 'Hello',
    });
  });

  it('should transform image attachments to multimodal content', async () => {
    const mockReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Nice image!"}}]}\n\n'));
        controller.close();
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    });

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'What do you see in this image?',
            attachments: [
              {
                id: '1',
                name: 'test-image.png',
                type: 'image/png',
                size: 1024,
                data: 'data:image/png;base64,mockbase64data',
              },
            ],
          },
        ],
      }),
    });

    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    // Verify message has content array with text and image_url
    expect(body.messages[0].content).toEqual([
      {
        type: 'text',
        text: 'What do you see in this image?',
      },
      {
        type: 'image_url',
        image_url: {
          url: 'data:image/png;base64,mockbase64data',
        },
      },
    ]);
  });

  it('should handle multiple image attachments', async () => {
    const mockReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Multiple images"}}]}\n\n'));
        controller.close();
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    });

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Compare these images',
            attachments: [
              {
                id: '1',
                name: 'image1.jpg',
                type: 'image/jpeg',
                size: 1024,
                data: 'data:image/jpeg;base64,mockdata1',
              },
              {
                id: '2',
                name: 'image2.png',
                type: 'image/png',
                size: 2048,
                data: 'data:image/png;base64,mockdata2',
              },
            ],
          },
        ],
      }),
    });

    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.messages[0].content).toHaveLength(3); // text + 2 images
    expect(body.messages[0].content[0].type).toBe('text');
    expect(body.messages[0].content[1].type).toBe('image_url');
    expect(body.messages[0].content[2].type).toBe('image_url');
  });

  it('should handle non-image attachments as text descriptions', async () => {
    const mockReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Got file"}}]}\n\n'));
        controller.close();
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    });

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Review this document',
            attachments: [
              {
                id: '1',
                name: 'document.pdf',
                type: 'application/pdf',
                size: 10240,
                data: 'data:application/pdf;base64,mockpdfdata',
              },
            ],
          },
        ],
      }),
    });

    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.messages[0].content).toEqual([
      {
        type: 'text',
        text: 'Review this document',
      },
      {
        type: 'text',
        text: '[Attached file: document.pdf (application/pdf, 10.0 KB)]',
      },
    ]);
  });

  it('should handle message with only file attachments (no text)', async () => {
    const mockReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Analyzing"}}]}\n\n'));
        controller.close();
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    });

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: '',
            attachments: [
              {
                id: '1',
                name: 'image.jpg',
                type: 'image/jpeg',
                size: 1024,
                data: 'data:image/jpeg;base64,mockdata',
              },
            ],
          },
        ],
      }),
    });

    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    // Should only have image, no empty text block
    expect(body.messages[0].content).toEqual([
      {
        type: 'image_url',
        image_url: {
          url: 'data:image/jpeg;base64,mockdata',
        },
      },
    ]);
  });

  it('should handle mixed image and non-image attachments', async () => {
    const mockReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Mixed files"}}]}\n\n'));
        controller.close();
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    });

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Check these files',
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
                name: 'report.pdf',
                type: 'application/pdf',
                size: 5120,
                data: 'data:application/pdf;base64,pdfdata',
              },
              {
                id: '3',
                name: 'chart.jpg',
                type: 'image/jpeg',
                size: 2048,
                data: 'data:image/jpeg;base64,chartdata',
              },
            ],
          },
        ],
      }),
    });

    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.messages[0].content).toHaveLength(4); // text + 2 images + 1 pdf description
    expect(body.messages[0].content[0]).toEqual({
      type: 'text',
      text: 'Check these files',
    });
    expect(body.messages[0].content[1]).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/png;base64,imagedata' },
    });
    expect(body.messages[0].content[2]).toEqual({
      type: 'text',
      text: '[Attached file: report.pdf (application/pdf, 5.0 KB)]',
    });
    expect(body.messages[0].content[3]).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/jpeg;base64,chartdata' },
    });
  });

  it('should preserve assistant messages without attachments', async () => {
    const mockReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Response"}}]}\n\n'));
        controller.close();
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    });

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          {
            role: 'user',
            content: 'Look at this',
            attachments: [
              {
                id: '1',
                name: 'image.png',
                type: 'image/png',
                size: 1024,
                data: 'data:image/png;base64,data',
              },
            ],
          },
        ],
      }),
    });

    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    // First message (user) - simple string
    expect(body.messages[0]).toEqual({
      role: 'user',
      content: 'Hello',
    });

    // Second message (assistant) - simple string
    expect(body.messages[1]).toEqual({
      role: 'assistant',
      content: 'Hi there!',
    });

    // Third message (user with attachment) - content array
    expect(body.messages[2].content).toEqual([
      { type: 'text', text: 'Look at this' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,data' } },
    ]);
  });

  it('should handle various image types correctly', async () => {
    const mockReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"OK"}}]}\n\n'));
        controller.close();
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    });

    const imageTypes = [
      { type: 'image/png', name: 'test.png' },
      { type: 'image/jpeg', name: 'test.jpg' },
      { type: 'image/gif', name: 'test.gif' },
      { type: 'image/webp', name: 'test.webp' },
    ];

    for (const imageType of imageTypes) {
      jest.clearAllMocks();

      const req = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Test image',
              attachments: [
                {
                  id: '1',
                  name: imageType.name,
                  type: imageType.type,
                  size: 1024,
                  data: `data:${imageType.type};base64,mockdata`,
                },
              ],
            },
          ],
        }),
      });

      await POST(req);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.messages[0].content[1]).toEqual({
        type: 'image_url',
        image_url: { url: `data:${imageType.type};base64,mockdata` },
      });
    }
  });
});
