/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Simple form demo - basic usage example
 */

import React from 'react';
import { useFormPersist, AutoSaveIndicator } from 'react-form-autosave';
import { styles } from '../styles';

interface FormData {
  name: string;
  email: string;
  message: string;
}

const initialState: FormData = {
  name: '',
  email: '',
  message: '',
};

export function SimpleFormDemo() {
  const [formData, setFormData, actions] = useFormPersist<FormData>(
    'simple-form',
    initialState,
    {
      debounce: 500,
      onRestore: (data) => console.log('Restored:', data),
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = actions.withClear(async () => {
    alert(`Submitted!\n\nName: ${formData.name}\nEmail: ${formData.email}`);
    return true;
  });

  return (
    <div style={styles.demoSection}>
      <h2 style={styles.demoTitle}>Simple Contact Form</h2>
      <p style={styles.demoDescription}>
        Type in the fields below and close/refresh the page. Your data will be
        restored automatically. The form auto-saves 500ms after you stop typing.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="name">
            Name
          </label>
          <input
            style={styles.input}
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="email">
            Email
          </label>
          <input
            style={styles.input}
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="message">
            Message
          </label>
          <textarea
            style={styles.textarea}
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Enter your message"
          />
        </div>

        <div style={styles.buttonGroup}>
          <button
            type="submit"
            style={{ ...styles.button, ...styles.buttonPrimary }}
          >
            Submit
          </button>
          <button
            type="button"
            style={styles.button}
            onClick={actions.clear}
          >
            Clear Saved Data
          </button>
          <button
            type="button"
            style={styles.button}
            onClick={actions.reset}
          >
            Reset Form
          </button>
        </div>
      </form>

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
    </div>
  );
}
