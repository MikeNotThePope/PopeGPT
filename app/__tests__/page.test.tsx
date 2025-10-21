import { render, screen } from '@testing-library/react';
import Home from '../page';

// Mock ChatInterface component
jest.mock('@/components/ChatInterface', () => {
  return function MockChatInterface() {
    return <div data-testid="chat-interface">Chat Interface</div>;
  };
});

describe('Home Page', () => {
  it('should render the ChatInterface component', () => {
    render(<Home />);

    const chatInterface = screen.getByTestId('chat-interface');
    expect(chatInterface).toBeInTheDocument();
  });

  it('should render without errors', () => {
    const { container } = render(<Home />);
    expect(container).toBeTruthy();
  });

  it('should render ChatInterface as the only child', () => {
    const { container } = render(<Home />);

    // Should only have one child element (ChatInterface)
    expect(container.firstChild?.childNodes.length).toBe(1);
  });
});
