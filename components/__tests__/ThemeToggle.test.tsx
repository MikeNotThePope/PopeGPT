import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Remove dark class from document
    document.documentElement.classList.remove('dark');
  });

  it('should render toggle switch', async () => {
    render(<ThemeToggle />);

    await waitFor(() => {
      const toggle = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggle).toBeInTheDocument();
    });
  });

  it('should start in light mode by default', async () => {
    render(<ThemeToggle />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  it('should toggle to dark mode when clicked', async () => {
    render(<ThemeToggle />);

    await waitFor(() => {
      const toggle = screen.getByRole('button', { name: /toggle theme/i });
      fireEvent.click(toggle);
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should toggle back to light mode', async () => {
    render(<ThemeToggle />);

    await waitFor(async () => {
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
        expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
      });
    });
  });

  it('should display sun and moon icons', async () => {
    const { container } = render(<ThemeToggle />);

    await waitFor(() => {
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
