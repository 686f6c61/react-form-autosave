/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Component to display auto-save status
 * Shows when form data was last saved or if currently saving
 */

import React, { useMemo } from 'react';
import type { AutoSaveIndicatorProps } from '../core/types';

/**
 * Format relative time (e.g., "2 minutes ago")
 *
 * @param timestamp - Timestamp to format
 * @returns Formatted relative time string
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 5) {
    return 'just now';
  }
  if (seconds < 60) {
    return `${seconds} seconds ago`;
  }
  if (minutes === 1) {
    return '1 minute ago';
  }
  if (minutes < 60) {
    return `${minutes} minutes ago`;
  }
  if (hours === 1) {
    return '1 hour ago';
  }
  if (hours < 24) {
    return `${hours} hours ago`;
  }

  return new Date(timestamp).toLocaleString();
}

/**
 * Default styles for the indicator (minimal, can be overridden)
 */
const defaultStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#666',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ccc',
  },
  dotSaving: {
    backgroundColor: '#f59e0b',
    animation: 'pulse 1s infinite',
  },
  dotSaved: {
    backgroundColor: '#10b981',
  },
};

/**
 * AutoSaveIndicator component
 *
 * Displays the current save status with a colored indicator dot and text.
 * Minimal styling by default, easily customizable via className and style props.
 *
 * @example
 * ```tsx
 * const [formData, setFormData, { lastSaved }] = useFormPersist('myForm', {});
 *
 * return (
 *   <form>
 *     <AutoSaveIndicator lastSaved={lastSaved} />
 *     {/* form fields *\/}
 *   </form>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // With custom styling
 * <AutoSaveIndicator
 *   lastSaved={lastSaved}
 *   isSaving={isSaving}
 *   savingText="Guardando..."
 *   savedText="Guardado"
 *   className="my-indicator"
 *   style={{ color: 'blue' }}
 * />
 * ```
 */
export function AutoSaveIndicator({
  lastSaved,
  isSaving = false,
  savingText = 'Saving...',
  savedText = 'Saved',
  notSavedText = 'Not saved',
  showTimestamp = true,
  className,
  style,
}: AutoSaveIndicatorProps): JSX.Element {
  const statusText = useMemo(() => {
    if (isSaving) {
      return savingText;
    }
    if (lastSaved) {
      if (showTimestamp) {
        return `${savedText} ${formatRelativeTime(lastSaved)}`;
      }
      return savedText;
    }
    return notSavedText;
  }, [isSaving, lastSaved, savingText, savedText, notSavedText, showTimestamp]);

  const dotStyle = useMemo((): React.CSSProperties => {
    if (isSaving) {
      return { ...defaultStyles.dot, ...defaultStyles.dotSaving };
    }
    if (lastSaved) {
      return { ...defaultStyles.dot, ...defaultStyles.dotSaved };
    }
    return defaultStyles.dot;
  }, [isSaving, lastSaved]);

  return (
    <div
      className={className}
      style={{ ...defaultStyles.container, ...style }}
      role="status"
      aria-live="polite"
    >
      <span style={dotStyle} aria-hidden="true" />
      <span>{statusText}</span>
    </div>
  );
}
