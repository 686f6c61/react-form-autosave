/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Demo: AutoSaveIndicator Component
 * Shows different ways to display save status to users
 */

import React, { useState, useEffect } from 'react';
import { useFormPersist, AutoSaveIndicator } from 'react-form-autosave';
import { styles } from '../styles';

interface ArticleData {
  title: string;
  content: string;
  tags: string;
  category: string;
}

const initialArticle: ArticleData = {
  title: '',
  content: '',
  tags: '',
  category: 'general',
};

type IndicatorStyle = 'minimal' | 'detailed' | 'toast' | 'custom';

export function AutoSaveIndicatorDemo() {
  const [article, setArticle, actions] = useFormPersist<ArticleData>(
    'demo-article-indicator',
    initialArticle,
    {
      debounce: 1500, // 1.5 second debounce to see the "saving" state
    }
  );

  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>('minimal');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Show toast notification when saved
  useEffect(() => {
    if (actions.lastSaved && indicatorStyle === 'toast') {
      setToastMessage('Changes saved automatically');
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [actions.lastSaved, indicatorStyle]);

  const handleChange = (field: keyof ArticleData, value: string) => {
    setArticle((prev) => ({ ...prev, [field]: value }));
  };

  // Custom indicator component
  const CustomIndicator = () => {
    const getStatus = () => {
      if (actions.isDirty && !actions.isPersisted) {
        return { icon: '✏️', text: 'Editing...', color: '#666' };
      }
      if (actions.isPersisted) {
        return { icon: '✓', text: 'All changes saved', color: '#28a745' };
      }
      return { icon: '○', text: 'Start typing to save', color: '#999' };
    };

    const status = getStatus();

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '20px',
          fontSize: '13px',
          color: status.color,
        }}
      >
        <span style={{ fontSize: '16px' }}>{status.icon}</span>
        <span>{status.text}</span>
        {actions.lastSaved && (
          <span style={{ color: '#999', fontSize: '11px' }}>
            · {new Date(actions.lastSaved).toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  };

  // Toast notification component
  const ToastNotification = () => {
    if (!showToast) return null;

    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 24px',
          backgroundColor: '#000',
          color: '#fff',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease',
        }}
      >
        ✓ {toastMessage}
      </div>
    );
  };

  return (
    <div style={styles.demoSection}>
      <h2 style={styles.demoTitle}>AutoSave Indicator</h2>
      <p style={styles.demoDescription}>
        The <code style={styles.code}>AutoSaveIndicator</code> component and the actions
        object provide multiple ways to show save status to users. Choose the style
        that fits your application's design.
      </p>

      {/* Style Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={styles.label}>Indicator Style:</label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {(['minimal', 'detailed', 'toast', 'custom'] as IndicatorStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => setIndicatorStyle(style)}
              style={{
                ...styles.button,
                ...(indicatorStyle === style ? styles.buttonPrimary : {}),
              }}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Current Indicator */}
      <div
        style={{
          padding: '15px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          marginBottom: '20px',
        }}
      >
        <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
          Current indicator style: <strong>{indicatorStyle}</strong>
        </div>

        {indicatorStyle === 'minimal' && (
          <AutoSaveIndicator
            lastSaved={actions.lastSaved}
            savedText="Saved"
            savingText="Saving..."
            notSavedText="Not saved"
          />
        )}

        {indicatorStyle === 'detailed' && (
          <AutoSaveIndicator
            lastSaved={actions.lastSaved}
            savedText="All changes saved"
            savingText="Saving your changes..."
            notSavedText="Changes not saved"
            showTimestamp={true}
            style={{
              padding: '10px 15px',
              backgroundColor: '#fff',
              border: '2px solid #000',
            }}
          />
        )}

        {indicatorStyle === 'toast' && (
          <div style={{ color: '#666' }}>
            Toast notifications appear in the bottom-right corner when changes are saved.
            <br />
            <small>Start typing to see it in action.</small>
          </div>
        )}

        {indicatorStyle === 'custom' && <CustomIndicator />}
      </div>

      {/* Article Editor Form */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Article Editor</h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Title</label>
          <input
            type="text"
            style={styles.input}
            value={article.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Enter article title..."
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Content</label>
          <textarea
            style={{ ...styles.textarea, minHeight: '150px' }}
            value={article.content}
            onChange={(e) => handleChange('content', e.target.value)}
            placeholder="Write your article content here..."
          />
        </div>

        <div style={styles.row}>
          <div style={styles.col}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tags (comma-separated)</label>
              <input
                type="text"
                style={styles.input}
                value={article.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                placeholder="react, javascript, tutorial"
              />
            </div>
          </div>
          <div style={styles.col}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select
                style={styles.select}
                value={article.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                <option value="general">General</option>
                <option value="tutorial">Tutorial</option>
                <option value="news">News</option>
                <option value="opinion">Opinion</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={styles.buttonGroup}>
        <button
          style={{ ...styles.button, ...styles.buttonPrimary }}
          onClick={() => {
            actions.forceSave();
            if (indicatorStyle === 'toast') {
              setToastMessage('Draft saved!');
              setShowToast(true);
              setTimeout(() => setShowToast(false), 2000);
            }
          }}
        >
          Save Now
        </button>
        <button style={styles.button} onClick={() => actions.reset()}>
          Reset
        </button>
        <button style={styles.button} onClick={() => actions.clear()}>
          Clear Draft
        </button>
      </div>

      {/* Status Details */}
      <div style={styles.statusBar}>
        <div>
          <span>isPersisted: {actions.isPersisted ? 'true' : 'false'}</span>
          <span style={{ margin: '0 10px' }}>|</span>
          <span>isDirty: {actions.isDirty ? 'true' : 'false'}</span>
          <span style={{ margin: '0 10px' }}>|</span>
          <span>size: {actions.size} bytes</span>
        </div>
        <span>
          {actions.lastSaved
            ? `Last: ${new Date(actions.lastSaved).toLocaleTimeString()}`
            : 'Never saved'}
        </span>
      </div>

      {/* Code Examples */}
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Usage Examples:</h4>

        <div style={{ marginBottom: '15px' }}>
          <strong style={{ fontSize: '12px' }}>Built-in Component:</strong>
          <pre style={{ ...styles.previewBox, marginTop: '5px' }}>
{`import { AutoSaveIndicator } from 'react-form-autosave';

<AutoSaveIndicator
  lastSaved={actions.lastSaved}
  savedText="All changes saved"
  savingText="Saving..."
  notSavedText="Not saved"
  showTimestamp={true}
/>`}
          </pre>
        </div>

        <div>
          <strong style={{ fontSize: '12px' }}>Custom Implementation:</strong>
          <pre style={{ ...styles.previewBox, marginTop: '5px' }}>
{`// Using actions object for custom UI
const [data, setData, actions] = useFormPersist('key', initialData);

return (
  <div>
    {actions.isDirty && <span>Unsaved changes</span>}
    {actions.isPersisted && <span>✓ Saved</span>}
    {actions.lastSaved && (
      <span>Last saved: {new Date(actions.lastSaved).toLocaleTimeString()}</span>
    )}
    <span>Size: {actions.size} bytes</span>
  </div>
);`}
          </pre>
        </div>
      </div>

      {/* Toast Component */}
      <ToastNotification />

      {/* CSS for animation */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
