/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for devtools/FormPersistDevTools.tsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormPersistDevTools } from '../devtools/FormPersistDevTools';
import { DEFAULT_KEY_PREFIX } from '../core/constants';

describe('FormPersistDevTools', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render the panel', () => {
    render(<FormPersistDevTools />);

    expect(screen.getByText('Form Persist DevTools')).toBeInTheDocument();
  });

  it('should be closed by default', () => {
    render(<FormPersistDevTools />);

    expect(screen.queryByText('No persisted forms found.')).not.toBeInTheDocument();
  });

  it('should open when defaultOpen is true', () => {
    render(<FormPersistDevTools defaultOpen={true} />);

    expect(screen.getByText('No persisted forms found.')).toBeInTheDocument();
  });

  it('should toggle open/close on header click', () => {
    render(<FormPersistDevTools />);

    // Click to open
    fireEvent.click(screen.getByText('Form Persist DevTools'));
    expect(screen.getByText('No persisted forms found.')).toBeInTheDocument();

    // Click to close
    fireEvent.click(screen.getByText('Form Persist DevTools'));
    expect(screen.queryByText('No persisted forms found.')).not.toBeInTheDocument();
  });

  it('should show persisted forms', () => {
    const data = {
      data: { name: 'John' },
      timestamp: Date.now(),
      version: 1,
    };
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}testForm`, JSON.stringify(data));

    render(<FormPersistDevTools defaultOpen={true} />);

    expect(screen.getByText('testForm')).toBeInTheDocument();
    expect(screen.getByText(/v1/)).toBeInTheDocument();
  });

  it('should expand form details on click', () => {
    const data = {
      data: { name: 'John' },
      timestamp: Date.now(),
      version: 1,
    };
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}testForm`, JSON.stringify(data));

    render(<FormPersistDevTools defaultOpen={true} />);

    fireEvent.click(screen.getByText('testForm'));

    expect(screen.getByText(/"name"/)).toBeInTheDocument();
  });

  it('should clear individual form', () => {
    const data = {
      data: { name: 'John' },
      timestamp: Date.now(),
      version: 1,
    };
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}testForm`, JSON.stringify(data));

    render(<FormPersistDevTools defaultOpen={true} />);

    // Expand form first
    fireEvent.click(screen.getByText('testForm'));

    // Find and click clear button for this form
    const clearButton = screen.getByRole('button', { name: 'Clear' });
    fireEvent.click(clearButton);

    jest.advanceTimersByTime(2000);

    expect(localStorage.getItem(`${DEFAULT_KEY_PREFIX}testForm`)).toBeNull();
  });

  it('should clear all forms', () => {
    const data = {
      data: { name: 'John' },
      timestamp: Date.now(),
      version: 1,
    };
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}form1`, JSON.stringify(data));
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}form2`, JSON.stringify(data));

    // Mock window.confirm
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<FormPersistDevTools defaultOpen={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(localStorage.getItem(`${DEFAULT_KEY_PREFIX}form1`)).toBeNull();
    expect(localStorage.getItem(`${DEFAULT_KEY_PREFIX}form2`)).toBeNull();

    confirmSpy.mockRestore();
  });

  it('should not clear all forms if cancelled', () => {
    const data = {
      data: { name: 'John' },
      timestamp: Date.now(),
      version: 1,
    };
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}form1`, JSON.stringify(data));

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<FormPersistDevTools defaultOpen={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));

    expect(localStorage.getItem(`${DEFAULT_KEY_PREFIX}form1`)).not.toBeNull();

    confirmSpy.mockRestore();
  });

  it('should refresh data', () => {
    render(<FormPersistDevTools defaultOpen={true} />);

    expect(screen.getByText('No persisted forms found.')).toBeInTheDocument();

    // Add data after render
    const data = {
      data: { name: 'John' },
      timestamp: Date.now(),
      version: 1,
    };
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}newForm`, JSON.stringify(data));

    // Click refresh
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(screen.getByText('newForm')).toBeInTheDocument();
  });

  it('should export data', () => {
    const data = {
      data: { name: 'John' },
      timestamp: Date.now(),
      version: 1,
    };
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}testForm`, JSON.stringify(data));

    // Mock URL methods globally
    const mockCreateObjectURL = jest.fn().mockReturnValue('blob:url');
    const mockRevokeObjectURL = jest.fn();
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = mockCreateObjectURL;
    URL.revokeObjectURL = mockRevokeObjectURL;

    const mockAnchor = { href: '', download: '', click: jest.fn() };
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return mockAnchor as any;
      }
      return originalCreateElement(tagName);
    });

    render(<FormPersistDevTools defaultOpen={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockAnchor.click).toHaveBeenCalled();

    // Restore mocks
    createElementSpy.mockRestore();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('should copy form data to clipboard', async () => {
    const data = {
      data: { name: 'John' },
      timestamp: Date.now(),
      version: 1,
    };
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}testForm`, JSON.stringify(data));

    // Mock clipboard
    const writeTextSpy = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextSpy },
    });

    render(<FormPersistDevTools defaultOpen={true} />);

    // Expand form
    fireEvent.click(screen.getByText('testForm'));

    // Click copy
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeTextSpy).toHaveBeenCalled();
  });

  it('should apply custom position', () => {
    render(<FormPersistDevTools defaultOpen={true} position="top-left" />);

    const panel = screen.getByText('Form Persist DevTools').parentElement!.parentElement!;
    expect(panel).toHaveStyle({ top: '10px', left: '10px' });
  });

  it('should apply custom className', () => {
    render(<FormPersistDevTools defaultOpen={true} className="custom-class" />);

    const panel = screen.getByText('Form Persist DevTools').parentElement!.parentElement!;
    expect(panel).toHaveClass('custom-class');
  });

  it('should apply filter function', () => {
    const data = {
      data: { name: 'John' },
      timestamp: Date.now(),
      version: 1,
    };
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}include`, JSON.stringify(data));
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}exclude`, JSON.stringify(data));

    render(
      <FormPersistDevTools
        defaultOpen={true}
        filter={(key) => key.includes('include')}
      />
    );

    expect(screen.getByText('include')).toBeInTheDocument();
    expect(screen.queryByText('exclude')).not.toBeInTheDocument();
  });

  it('should handle invalid JSON in storage', () => {
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}invalid`, 'not json');

    render(<FormPersistDevTools defaultOpen={true} />);

    // Should not crash and should show the form with raw data
    expect(screen.getByText('invalid')).toBeInTheDocument();
  });

  it('should show form count', () => {
    const data = { data: {}, timestamp: Date.now(), version: 1 };
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}form1`, JSON.stringify(data));
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}form2`, JSON.stringify(data));

    render(<FormPersistDevTools defaultOpen={true} />);

    expect(screen.getByText('2 form(s)')).toBeInTheDocument();
  });

  it('should format size correctly', () => {
    const largeData = { data: { content: 'x'.repeat(2000) }, timestamp: Date.now(), version: 1 };
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}large`, JSON.stringify(largeData));

    render(<FormPersistDevTools defaultOpen={true} />);

    // Expand to see size
    fireEvent.click(screen.getByText('large'));

    // Should show KB format
    expect(screen.getByText(/KB/)).toBeInTheDocument();
  });

  it('should auto-refresh when open', async () => {
    const { rerender } = render(<FormPersistDevTools defaultOpen={true} />);

    expect(screen.getByText('No persisted forms found.')).toBeInTheDocument();

    const data = { data: { name: 'John' }, timestamp: Date.now(), version: 1 };
    localStorage.setItem(`${DEFAULT_KEY_PREFIX}autoRefresh`, JSON.stringify(data));

    // Advance timer for auto-refresh (2000ms interval)
    jest.advanceTimersByTime(2100);

    // Rerender to pick up changes
    rerender(<FormPersistDevTools defaultOpen={true} />);

    // The component should have refreshed and found the new form
    expect(screen.queryByText('No persisted forms found.')).not.toBeInTheDocument();
  });

  it('should handle different positions', () => {
    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;

    positions.forEach((position) => {
      const { unmount } = render(
        <FormPersistDevTools defaultOpen={true} position={position} />
      );

      const panel = screen.getByText('Form Persist DevTools').parentElement!.parentElement!;

      if (position.includes('top')) {
        expect(panel).toHaveStyle({ top: '10px' });
      }
      if (position.includes('bottom')) {
        expect(panel).toHaveStyle({ bottom: '10px' });
      }
      if (position.includes('left')) {
        expect(panel).toHaveStyle({ left: '10px' });
      }
      if (position.includes('right')) {
        expect(panel).toHaveStyle({ right: '10px' });
      }

      unmount();
    });
  });
});
