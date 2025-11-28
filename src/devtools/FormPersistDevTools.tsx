/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * DevTools panel component for development and debugging
 * Displays all persisted forms, their state, and provides actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { FormPersistDevToolsProps } from '../core/types';
import { DEFAULT_KEY_PREFIX } from '../core/constants';
import { isSSR } from '../storage';

/**
 * Styles for DevTools panel (black and white, minimal)
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    zIndex: 99999,
    fontFamily: 'monospace',
    fontSize: '12px',
    backgroundColor: '#fff',
    color: '#000',
    border: '2px solid #000',
    borderRadius: '4px',
    boxShadow: '4px 4px 0 #000',
    maxWidth: '400px',
    maxHeight: '500px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '2px solid #000',
    backgroundColor: '#000',
    color: '#fff',
    cursor: 'pointer',
  },
  title: {
    fontWeight: 'bold',
    fontSize: '14px',
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0 4px',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  },
  emptyState: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
  },
  formItem: {
    border: '1px solid #000',
    marginBottom: '8px',
    borderRadius: '2px',
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid #000',
    cursor: 'pointer',
  },
  formKey: {
    fontWeight: 'bold',
    wordBreak: 'break-all',
  },
  formMeta: {
    fontSize: '10px',
    color: '#666',
  },
  formBody: {
    padding: '8px',
  },
  dataPreview: {
    backgroundColor: '#f9f9f9',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '2px',
    maxHeight: '150px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    fontSize: '10px',
  },
  actions: {
    display: 'flex',
    gap: '4px',
    marginTop: '8px',
  },
  button: {
    padding: '4px 8px',
    border: '1px solid #000',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '10px',
    borderRadius: '2px',
  },
  buttonDanger: {
    backgroundColor: '#000',
    color: '#fff',
  },
  footer: {
    borderTop: '2px solid #000',
    padding: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
  },
};

/**
 * Position styles
 */
const positionStyles: Record<string, React.CSSProperties> = {
  'top-left': { top: '10px', left: '10px' },
  'top-right': { top: '10px', right: '10px' },
  'bottom-left': { bottom: '10px', left: '10px' },
  'bottom-right': { bottom: '10px', right: '10px' },
};

/**
 * Stored form data structure
 */
interface StoredForm {
  key: string;
  data: unknown;
  timestamp: number;
  version: number;
  size: number;
}

/**
 * FormPersistDevTools component
 *
 * Development panel showing all persisted forms with inspection and actions.
 *
 * @example
 * ```tsx
 * // Add to your app in development
 * {process.env.NODE_ENV === 'development' && (
 *   <FormPersistDevTools position="bottom-right" />
 * )}
 * ```
 */
export function FormPersistDevTools({
  position = 'bottom-right',
  defaultOpen = false,
  filter,
  className,
}: FormPersistDevToolsProps): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [forms, setForms] = useState<StoredForm[]>([]);
  const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set());

  // Scan localStorage for persisted forms
  /* istanbul ignore next -- @preserve DevTools scanning logic */
  const scanStorage = useCallback(() => {
    if (isSSR()) return;

    const foundForms: StoredForm[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // Filter by prefix
        if (!key.startsWith(DEFAULT_KEY_PREFIX)) continue;

        // Apply custom filter
        if (filter && !filter(key)) continue;

        const value = localStorage.getItem(key);
        if (!value) continue;

        try {
          const parsed = JSON.parse(value);
          foundForms.push({
            key,
            data: parsed.data || parsed,
            timestamp: parsed.timestamp || 0,
            version: parsed.version || 1,
            size: value.length,
          });
        } catch {
          // Invalid JSON
          foundForms.push({
            key,
            data: value,
            timestamp: 0,
            version: 0,
            size: value.length,
          });
        }
      }
    } catch {
      // Storage access error
    }

    setForms(foundForms.sort((a, b) => b.timestamp - a.timestamp));
  }, [filter]);

  // Scan on mount and when panel opens
  useEffect(() => {
    if (isOpen) {
      scanStorage();
    }
  }, [isOpen, scanStorage]);

  // Auto-refresh
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(scanStorage, 2000);
    return () => clearInterval(interval);
  }, [isOpen, scanStorage]);

  // Clear a specific form
  const clearForm = useCallback((key: string) => {
    try {
      localStorage.removeItem(key);
      scanStorage();
    } catch {
      // Error clearing
    }
  }, [scanStorage]);

  // Clear all forms
  const clearAll = useCallback(() => {
    if (!confirm('Clear all persisted form data?')) return;

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(DEFAULT_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      scanStorage();
    } catch {
      // Error clearing
    }
  }, [scanStorage]);

  // Export all forms
  const exportAll = useCallback(() => {
    const exportData = forms.reduce(
      (acc, form) => {
        acc[form.key] = form.data;
        return acc;
      },
      {} as Record<string, unknown>
    );

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-persist-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [forms]);

  // Toggle form expansion
  /* istanbul ignore next -- @preserve Toggle expansion UI logic */
  const toggleExpand = useCallback((key: string) => {
    setExpandedForms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Format size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    /* istanbul ignore next -- @preserve MB format rarely used in tests */
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format time
  const formatTime = (timestamp: number): string => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleTimeString();
  };

  // Don't render on server
  /* istanbul ignore if -- @preserve SSR check */
  if (isSSR()) return null;

  return (
    <div
      className={className}
      style={{
        ...styles.container,
        ...positionStyles[position],
      }}
    >
      {/* Header */}
      <div style={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <span style={styles.title}>Form Persist DevTools</span>
        <button style={styles.toggleButton}>
          {isOpen ? '−' : '+'}
        </button>
      </div>

      {/* Content */}
      {isOpen && (
        <>
          <div style={styles.content}>
            {forms.length === 0 ? (
              <div style={styles.emptyState}>
                No persisted forms found.
              </div>
            ) : (
              forms.map((form) => (
                <div key={form.key} style={styles.formItem}>
                  <div
                    style={styles.formHeader}
                    onClick={() => toggleExpand(form.key)}
                  >
                    <div>
                      <div style={styles.formKey}>
                        {form.key.replace(DEFAULT_KEY_PREFIX, '')}
                      </div>
                      <div style={styles.formMeta}>
                        v{form.version} | {formatSize(form.size)} | {formatTime(form.timestamp)}
                      </div>
                    </div>
                    <span>{expandedForms.has(form.key) ? '▼' : '▶'}</span>
                  </div>

                  {expandedForms.has(form.key) && (
                    <div style={styles.formBody}>
                      <pre style={styles.dataPreview}>
                        {JSON.stringify(form.data, null, 2)}
                      </pre>
                      <div style={styles.actions}>
                        <button
                          style={styles.button}
                          onClick={() => {
                            navigator.clipboard.writeText(
                              JSON.stringify(form.data, null, 2)
                            );
                          }}
                        >
                          Copy
                        </button>
                        <button
                          style={{ ...styles.button, ...styles.buttonDanger }}
                          onClick={() => clearForm(form.key)}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <span>{forms.length} form(s)</span>
            <div style={styles.actions}>
              <button style={styles.button} onClick={exportAll}>
                Export
              </button>
              <button style={styles.button} onClick={scanStorage}>
                Refresh
              </button>
              <button
                style={{ ...styles.button, ...styles.buttonDanger }}
                onClick={clearAll}
              >
                Clear All
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
