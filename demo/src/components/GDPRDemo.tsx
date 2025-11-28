/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * GDPR compliance demo with consent-based persistence
 */

import React, { useState } from 'react';
import { useFormPersist, AutoSaveIndicator, clearGroup } from 'react-form-autosave';
import { styles } from '../styles';

interface FormData {
  name: string;
  email: string;
  feedback: string;
}

const initialState: FormData = {
  name: '',
  email: '',
  feedback: '',
};

export function GDPRDemo() {
  // Consent state (in real app, would be from user preferences)
  const [hasConsent, setHasConsent] = useState(false);

  const [formData, setFormData, actions] = useFormPersist<FormData>(
    'gdpr-form',
    initialState,
    {
      // Key feature: persistence is disabled without consent
      enabled: hasConsent,
      debug: true,
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConsentChange = (consent: boolean) => {
    setHasConsent(consent);
    if (!consent) {
      // Clear stored data when consent is revoked
      actions.clear();
    }
  };

  const handleDeleteAllData = () => {
    // GDPR right to erasure
    const cleared = clearGroup('');
    alert(`Deleted all persisted form data (${cleared} items)`);
  };

  return (
    <div style={styles.demoSection}>
      <h2 style={styles.demoTitle}>GDPR Compliance Demo</h2>
      <p style={styles.demoDescription}>
        This demo shows how to implement GDPR-compliant form persistence using
        the <code style={styles.code}>enabled</code> option. Data is only saved
        when the user has given consent.
      </p>

      {/* Consent Banner */}
      <div
        style={{
          ...styles.alert,
          backgroundColor: hasConsent ? '#f0fff0' : '#fff0f0',
          border: `2px solid ${hasConsent ? '#000' : '#666'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={hasConsent}
              onChange={(e) => handleConsentChange(e.target.checked)}
            />
            <strong>I consent to save my form data locally</strong>
          </label>
        </div>
        <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          {hasConsent
            ? 'Your form data is being saved to localStorage and will persist across sessions.'
            : 'Form data will NOT be saved. If you close the page, your progress will be lost.'}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          alert('Form submitted!');
          actions.clear();
        }}
      >
        <div style={styles.formGroup}>
          <label style={styles.label}>Name</label>
          <input
            style={styles.input}
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Feedback</label>
          <textarea
            style={styles.textarea}
            name="feedback"
            value={formData.feedback}
            onChange={handleChange}
            placeholder="Your feedback..."
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
            onClick={handleDeleteAllData}
          >
            Delete All My Data (GDPR)
          </button>
        </div>
      </form>

      <div style={styles.statusBar}>
        {hasConsent ? (
          <AutoSaveIndicator lastSaved={actions.lastSaved} />
        ) : (
          <span style={{ color: '#666' }}>
            <span
              style={{
                ...styles.statusDot,
                ...styles.statusUnsaved,
              }}
            />
            Auto-save disabled (no consent)
          </span>
        )}
        <div>
          {hasConsent && actions.isPersisted && (
            <span style={styles.code}>Data saved in localStorage</span>
          )}
          {!hasConsent && (
            <span style={styles.code}>Persistence: DISABLED</span>
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
        <strong>GDPR Compliance Features:</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>
            <code style={styles.code}>enabled: false</code> - No data saved
            without consent
          </li>
          <li>
            <code style={styles.code}>clear()</code> - Delete stored data when
            consent is revoked
          </li>
          <li>
            <code style={styles.code}>clearGroup()</code> - Bulk delete for
            right to erasure
          </li>
          <li>
            <code style={styles.code}>exclude</code> - Exclude sensitive fields
            from storage
          </li>
          <li>
            <code style={styles.code}>expiration</code> - Auto-delete after time
            period
          </li>
        </ul>
      </div>
    </div>
  );
}
