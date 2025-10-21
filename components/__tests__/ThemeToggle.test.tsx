import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';

describe('ThemeToggle', () => {
  let setItemSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Remove dark class from document
    document.documentElement.classList.remove('dark');
    // Remove any existing favicon elements
    const existingFavicons = document.querySelectorAll('#favicon');
    existingFavicons.forEach((el) => el.remove());
    // Create spy on setItem
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    // Restore spy
    setItemSpy.mockRestore();
    // Clean up favicon elements
    const favicons = document.querySelectorAll('#favicon');
    favicons.forEach((el) => el.remove());
  });

  it('should render toggle switch', () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggle).toBeInTheDocument();
  });

  it('should start in light mode by default', () => {
    render(<ThemeToggle />);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should toggle to dark mode when clicked', async () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole('button', { name: /toggle theme/i });

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
    expect(setItemSpy).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should toggle back to light mode', async () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole('button', { name: /toggle theme/i });

    // Toggle to dark
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    // Toggle back to light
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
    expect(setItemSpy).toHaveBeenCalledWith('theme', 'light');
  });

  it('should display sun and moon icons', () => {
    const { container } = render(<ThemeToggle />);
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should update favicon when toggling to dark mode', async () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole('button', { name: /toggle theme/i });

    // Toggle to dark mode
    fireEvent.click(toggle);

    await waitFor(() => {
      const favicon = document.getElementById('favicon') as HTMLLinkElement;
      expect(favicon).toBeInTheDocument();
      expect(favicon?.href).toContain('/api/favicon-dark');
      expect(favicon?.rel).toBe('icon');
      expect(favicon?.type).toBe('image/svg+xml');
    });
  });

  it('should update favicon when toggling to light mode', async () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole('button', { name: /toggle theme/i });

    // Toggle to dark mode first
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    // Toggle back to light mode
    fireEvent.click(toggle);

    await waitFor(() => {
      const favicon = document.getElementById('favicon') as HTMLLinkElement;
      expect(favicon).toBeInTheDocument();
      expect(favicon?.href).toContain('/api/favicon');
      expect(favicon?.href).not.toContain('/api/favicon-dark');
      expect(favicon?.rel).toBe('icon');
      expect(favicon?.type).toBe('image/svg+xml');
    });
  });

  it('should replace old favicon element when toggling', async () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole('button', { name: /toggle theme/i });

    // Toggle to dark mode
    fireEvent.click(toggle);

    await waitFor(() => {
      const favicons = document.querySelectorAll('#favicon');
      // Should only have one favicon element
      expect(favicons.length).toBe(1);
    });

    // Toggle back to light mode
    fireEvent.click(toggle);

    await waitFor(() => {
      const favicons = document.querySelectorAll('#favicon');
      // Should still only have one favicon element
      expect(favicons.length).toBe(1);
    });
  });

  it('should handle system theme changes when no manual preference is set', async () => {
    // Mock matchMedia
    const matchMediaMock = jest.fn();
    let changeListener: ((e: MediaQueryListEvent) => void) | null = null;

    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: jest.fn((event, listener) => {
        if (event === 'change') {
          changeListener = listener;
        }
      }),
      removeEventListener: jest.fn(),
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });

    render(<ThemeToggle />);

    // Simulate system theme change to dark
    if (changeListener) {
      changeListener({ matches: true } as MediaQueryListEvent);

      await waitFor(() => {
        const favicon = document.getElementById('favicon') as HTMLLinkElement;
        expect(favicon?.href).toContain('/api/favicon-dark');
      });
    }
  });
});
