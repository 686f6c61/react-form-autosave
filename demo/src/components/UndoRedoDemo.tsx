/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Undo/Redo demo with history feature
 */

import React from 'react';
import { useFormPersist, AutoSaveIndicator } from 'react-form-autosave';
import { styles } from '../styles';

interface FormData {
  title: string;
  content: string;
}

const initialState: FormData = {
  title: '',
  content: '',
};

export function UndoRedoDemo() {
  const [formData, setFormData, actions] = useFormPersist<FormData>(
    'undo-redo-form',
    initialState,
    {
      history: {
        enabled: true,
        maxHistory: 20,
      },
      debounce: 300,
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div style={styles.demoSection}>
      <h2 style={styles.demoTitle}>Undo/Redo Demo</h2>
      <p style={styles.demoDescription}>
        Type in the editor below. Each change is tracked in history. Use the
        Undo/Redo buttons or keyboard shortcuts to navigate through your changes.
      </p>

      <div
        style={{
          ...styles.alert,
          ...styles.alertInfo,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <strong>History:</strong> {actions.historyIndex + 1} /{' '}
          {actions.historyLength}
        </div>
        <div style={styles.buttonGroup}>
          <button
            style={{
              ...styles.button,
              opacity: actions.canUndo ? 1 : 0.5,
            }}
            onClick={actions.undo}
            disabled={!actions.canUndo}
          >
            Undo
          </button>
          <button
            style={{
              ...styles.button,
              opacity: actions.canRedo ? 1 : 0.5,
            }}
            onClick={actions.redo}
            disabled={!actions.canRedo}
          >
            Redo
          </button>
          <button style={styles.button} onClick={actions.revert}>
            Revert to Saved
          </button>
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Document Title</label>
        <input
          style={styles.input}
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter document title"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Content</label>
        <textarea
          style={{ ...styles.textarea, minHeight: '200px' }}
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Start writing your content..."
        />
      </div>

      <div style={styles.buttonGroup}>
        <button
          style={{ ...styles.button, ...styles.buttonPrimary }}
          onClick={actions.forceSave}
        >
          Force Save Now
        </button>
        <button style={styles.button} onClick={actions.reset}>
          Reset All
        </button>
        {actions.isPaused ? (
          <button style={styles.button} onClick={actions.resume}>
            Resume Auto-save
          </button>
        ) : (
          <button style={styles.button} onClick={actions.pause}>
            Pause Auto-save
          </button>
        )}
      </div>

      <div style={styles.statusBar}>
        <AutoSaveIndicator lastSaved={actions.lastSaved} />
        <div>
          {actions.isPersisted && (
            <span style={styles.code}>Data saved in localStorage</span>
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <strong>Current State:</strong>
        <pre style={styles.previewBox}>
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <strong>Available Actions:</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>
            <code style={styles.code}>undo()</code> / <code style={styles.code}>redo()</code> - Navigate history
          </li>
          <li>
            <code style={styles.code}>canUndo</code> / <code style={styles.code}>canRedo</code> - Check availability
          </li>
          <li>
            <code style={styles.code}>historyIndex</code> / <code style={styles.code}>historyLength</code> - Current position
          </li>
          <li>
            <code style={styles.code}>revert()</code> - Go back to last saved state
          </li>
          <li>
            <code style={styles.code}>pause()</code> / <code style={styles.code}>resume()</code> - Control auto-save
          </li>
          <li>
            <code style={styles.code}>forceSave()</code> - Save immediately (skip debounce)
          </li>
        </ul>
      </div>
    </div>
  );
}
