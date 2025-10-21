import { render, screen } from '@testing-library/react';
import RootLayout, { metadata } from '../layout';

// Mock ChatProvider
jest.mock('@/lib/ChatContext', () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chat-provider">{children}</div>
  ),
}));

// Mock Next.js font
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}));

describe('RootLayout', () => {
  it('should render children wrapped in ChatProvider', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Child</div>
      </RootLayout>
    );

    const chatProvider = screen.getByTestId('chat-provider');
    const child = screen.getByTestId('test-child');

    expect(chatProvider).toBeInTheDocument();
    expect(child).toBeInTheDocument();
  });

  it('should apply Inter font className to body', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    const body = container.querySelector('body');
    expect(body).toHaveClass('inter-font');
  });

  it('should set lang attribute on html element', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    const html = container.querySelector('html');
    expect(html).toHaveAttribute('lang', 'en');
  });

  it('should have html element', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    const html = container.querySelector('html');
    expect(html).toBeInTheDocument();
  });

  it('should include dark mode initialization script', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    const script = container.querySelector('script');
    expect(script).toBeInTheDocument();

    if (script) {
      const scriptContent = script.innerHTML;
      expect(scriptContent).toContain('localStorage.getItem');
      expect(scriptContent).toContain('theme');
      expect(scriptContent).toContain('dark');
    }
  });

  it('should render head element', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    const head = container.querySelector('head');
    expect(head).toBeInTheDocument();
  });

  it('should wrap children in proper HTML structure', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="content">Content</div>
      </RootLayout>
    );

    const html = container.querySelector('html');
    const body = html?.querySelector('body');
    const chatProvider = body?.querySelector('[data-testid="chat-provider"]');
    const content = chatProvider?.querySelector('[data-testid="content"]');

    expect(html).toBeInTheDocument();
    expect(body).toBeInTheDocument();
    expect(chatProvider).toBeInTheDocument();
    expect(content).toBeInTheDocument();
  });
});

describe('Layout Metadata', () => {
  it('should have correct title format', () => {
    const username = process.env.NEXT_PUBLIC_USERNAME || 'Pope';
    expect(metadata.title).toBe(`${username}GPT - AI Chat Interface`);
  });

  it('should have correct description', () => {
    expect(metadata.description).toBe(
      'A beautiful AI chat interface powered by Claude 3 Haiku'
    );
  });

  it('should be a valid Metadata object', () => {
    expect(metadata).toBeDefined();
    expect(typeof metadata).toBe('object');
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
  });
});
