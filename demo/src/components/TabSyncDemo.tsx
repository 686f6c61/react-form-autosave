/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tab synchronization demo
 */

import React from 'react';
import { useFormPersist, AutoSaveIndicator } from 'react-form-autosave';
import { styles } from '../styles';

interface FormData {
  note: string;
  priority: string;
  tags: string;
}

const initialState: FormData = {
  note: '',
  priority: 'medium',
  tags: '',
};

export function TabSyncDemo() {
  const [formData, setFormData, actions] = useFormPersist<FormData>(
    'tab-sync-form',
    initialState,
    {
      sync: {
        enabled: true,
        strategy: 'latest-wins',
        onSync: (data, source) => {
          console.log(`Synced from ${source}:`, data);
        },
      },
      debounce: 300,
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div style={styles.demoSection}>
      <h2 style={styles.demoTitle}>Tab Synchronization Demo</h2>
      <p style={styles.demoDescription}>
        Open this page in multiple tabs. Changes made in one tab will
        automatically sync to other tabs in real-time using BroadcastChannel
        and storage events.
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
        <span>
          <strong>Try it:</strong> Open a new tab and type in either one
        </span>
        <button
          style={{ ...styles.button, ...styles.buttonPrimary }}
          onClick={openNewTab}
        >
          Open New Tab
        </button>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Shared Note</label>
        <textarea
          style={styles.textarea}
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="Type here and watch it sync to other tabs..."
        />
      </div>

      <div style={styles.row}>
        <div style={styles.col}>
          <label style={styles.label}>Priority</label>
          <select
            style={styles.select}
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div style={styles.col}>
          <label style={styles.label}>Tags (comma-separated)</label>
          <input
            style={styles.input}
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="work, important, todo"
          />
        </div>
      </div>

      <div style={styles.buttonGroup}>
        <button style={styles.button} onClick={actions.clear}>
          Clear Data
        </button>
        <button style={styles.button} onClick={actions.forceSave}>
          Force Sync
        </button>
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
        <pre style={styles.previewBox}>{JSON.stringify(formData, null, 2)}</pre>
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <strong>Sync Strategies:</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>
            <code style={styles.code}>latest-wins</code> - Most recent change
            overwrites (default)
          </li>
          <li>
            <code style={styles.code}>merge</code> - Attempt to merge changes
          </li>
          <li>
            <code style={styles.code}>ask-user</code> - Prompt user to resolve
            conflicts
          </li>
          <li>
            <code style={styles.code}>conflictResolver</code> - Custom function
            for complex merging
          </li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <strong>How it works:</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Uses BroadcastChannel API for real-time sync (modern browsers)</li>
          <li>Falls back to storage events for older browsers</li>
          <li>
            <code style={styles.code}>onSync</code> callback when changes arrive
          </li>
          <li>Configurable conflict resolution strategies</li>
        </ul>
      </div>
    </div>
  );
}
