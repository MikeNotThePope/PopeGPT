import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';

describe('ThemeToggle', () => {
  let setItemSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Remove dark class from document
    document.documentElement.classList.remove('dark');
    // Create spy on setItem
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    // Restore spy
    setItemSpy.mockRestore();
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
});
