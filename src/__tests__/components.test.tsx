/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for components (FormPersistProvider, AutoSaveIndicator)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  FormPersistProvider,
  useFormPersistContext,
  useFormRegistry,
} from '../components/FormPersistProvider';
import { AutoSaveIndicator } from '../components/AutoSaveIndicator';

// Helper component to test context
function ContextConsumer() {
  const context = useFormPersistContext();
  return <div data-testid="context">{JSON.stringify(context)}</div>;
}

// Helper component to test registry
function RegistryConsumer() {
  const registry = useFormRegistry();
  return (
    <div>
      <button onClick={() => registry.register('test', { data: {} } as any)}>
        Register
      </button>
      <button onClick={() => registry.unregister('test')}>Unregister</button>
      <div data-testid="count">{registry.getAll().size}</div>
    </div>
  );
}

describe('FormPersistProvider', () => {
  it('should render children', () => {
    render(
      <FormPersistProvider>
        <div data-testid="child">Child</div>
      </FormPersistProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should provide default options', () => {
    render(
      <FormPersistProvider defaults={{ debounce: 1000, debug: true }}>
        <ContextConsumer />
      </FormPersistProvider>
    );

    const context = JSON.parse(screen.getByTestId('context').textContent!);
    expect(context.debounce).toBe(1000);
    expect(context.debug).toBe(true);
  });

  it('should provide empty defaults when none specified', () => {
    render(
      <FormPersistProvider>
        <ContextConsumer />
      </FormPersistProvider>
    );

    const context = JSON.parse(screen.getByTestId('context').textContent!);
    expect(context).toEqual({});
  });

  it('should provide registry methods', () => {
    render(
      <FormPersistProvider>
        <RegistryConsumer />
      </FormPersistProvider>
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});

describe('useFormPersistContext', () => {
  it('should return empty object without provider', () => {
    render(<ContextConsumer />);

    const context = JSON.parse(screen.getByTestId('context').textContent!);
    expect(context).toEqual({});
  });
});

describe('useFormRegistry', () => {
  it('should return default methods without provider', () => {
    render(<RegistryConsumer />);

    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});

describe('AutoSaveIndicator', () => {
  it('should render not saved state', () => {
    render(<AutoSaveIndicator lastSaved={null} />);

    expect(screen.getByText('Not saved')).toBeInTheDocument();
  });

  it('should render saving state', () => {
    render(<AutoSaveIndicator lastSaved={null} isSaving={true} />);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should render saved state', () => {
    const lastSaved = Date.now();
    render(<AutoSaveIndicator lastSaved={lastSaved} />);

    expect(screen.getByText(/Saved/)).toBeInTheDocument();
  });

  it('should show just now for recent saves', () => {
    const lastSaved = Date.now();
    render(<AutoSaveIndicator lastSaved={lastSaved} />);

    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });

  it('should show seconds ago', () => {
    const lastSaved = Date.now() - 30 * 1000;
    render(<AutoSaveIndicator lastSaved={lastSaved} />);

    expect(screen.getByText(/seconds ago/)).toBeInTheDocument();
  });

  it('should show 1 minute ago', () => {
    const lastSaved = Date.now() - 60 * 1000;
    render(<AutoSaveIndicator lastSaved={lastSaved} />);

    expect(screen.getByText(/1 minute ago/)).toBeInTheDocument();
  });

  it('should show minutes ago', () => {
    const lastSaved = Date.now() - 5 * 60 * 1000;
    render(<AutoSaveIndicator lastSaved={lastSaved} />);

    expect(screen.getByText(/minutes ago/)).toBeInTheDocument();
  });

  it('should show 1 hour ago', () => {
    const lastSaved = Date.now() - 60 * 60 * 1000;
    render(<AutoSaveIndicator lastSaved={lastSaved} />);

    expect(screen.getByText(/1 hour ago/)).toBeInTheDocument();
  });

  it('should show hours ago', () => {
    const lastSaved = Date.now() - 3 * 60 * 60 * 1000;
    render(<AutoSaveIndicator lastSaved={lastSaved} />);

    expect(screen.getByText(/hours ago/)).toBeInTheDocument();
  });

  it('should show date for old saves', () => {
    const lastSaved = Date.now() - 48 * 60 * 60 * 1000;
    render(<AutoSaveIndicator lastSaved={lastSaved} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should use custom text props', () => {
    render(
      <AutoSaveIndicator
        lastSaved={null}
        isSaving={true}
        savingText="Guardando..."
        savedText="Guardado"
        notSavedText="Sin guardar"
      />
    );

    expect(screen.getByText('Guardando...')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <AutoSaveIndicator
        lastSaved={Date.now()}
        className="custom-class"
      />
    );

    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });

  it('should apply custom style', () => {
    render(
      <AutoSaveIndicator
        lastSaved={Date.now()}
        style={{ color: 'red' }}
      />
    );

    expect(screen.getByRole('status')).toHaveStyle({ color: 'red' });
  });

  it('should have accessible role and aria-live', () => {
    render(<AutoSaveIndicator lastSaved={Date.now()} />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });
});
