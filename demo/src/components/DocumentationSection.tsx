/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Documentation section with usage examples and API reference
 */

import React, { useState } from 'react';
import { styles } from '../styles';

type DocTab = 'quickstart' | 'options' | 'actions' | 'provider' | 'modules';

const tabs: { key: DocTab; label: string }[] = [
  { key: 'quickstart', label: 'Quick start' },
  { key: 'options', label: 'Options' },
  { key: 'actions', label: 'Actions' },
  { key: 'provider', label: 'Provider' },
  { key: 'modules', label: 'Modules' },
];

const codeBlockStyle: React.CSSProperties = {
  backgroundColor: '#f5f5f5',
  border: '1px solid #ddd',
  padding: '15px',
  fontFamily: 'monospace',
  fontSize: '13px',
  lineHeight: '1.5',
  overflowX: 'auto',
  whiteSpace: 'pre',
  marginBottom: '20px',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginBottom: '20px',
  fontSize: '13px',
};

const thStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '10px',
  textAlign: 'left',
  backgroundColor: '#f5f5f5',
  fontWeight: 'bold',
};

const tdStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '10px',
  verticalAlign: 'top',
};

function QuickStartContent() {
  return (
    <div>
      <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Installation</h3>
      <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
        Install the package using npm or yarn. The library has zero dependencies
        and only requires React 16.8 or higher as a peer dependency.
      </p>
      <div style={codeBlockStyle}>
{`npm install react-form-autosave
# or
yarn add react-form-autosave`}
      </div>

      <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Basic usage</h3>
      <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
        The useFormPersist hook works like useState but automatically persists
        the state to localStorage. Just provide a unique key and your initial state.
      </p>
      <div style={codeBlockStyle}>
{`import { useFormPersist } from 'react-form-autosave';

function ContactForm() {
  const [formData, setFormData, { clear }] = useFormPersist('contact-form', {
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit form...
    clear(); // Clear persisted data after successful submit
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <textarea
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
      />
      <button type="submit">Send</button>
    </form>
  );
}`}
      </div>

      <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>With options</h3>
      <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
        Customize the behavior by passing an options object as the third parameter.
        You can configure storage type, debounce time, field exclusion, and more.
      </p>
      <div style={codeBlockStyle}>
{`const [formData, setFormData, actions] = useFormPersist(
  'checkout-form',
  { email: '', cardNumber: '', cvv: '' },
  {
    storage: 'sessionStorage',  // Use session storage
    debounce: 1000,             // Save after 1 second of inactivity
    exclude: ['cardNumber', 'cvv'], // Never persist sensitive fields
    expiration: 30,             // Data expires after 30 minutes
  }
);`}
      </div>
    </div>
  );
}

function OptionsContent() {
  return (
    <div>
      <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Configuration options</h3>
      <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
        The useFormPersist hook accepts an options object that allows you to customize
        every aspect of the persistence behavior. All options are optional and have
        sensible defaults.
      </p>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Option</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Default</th>
            <th style={thStyle}>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}><code>storage</code></td>
            <td style={tdStyle}><code>'localStorage' | 'sessionStorage' | 'memory' | StorageAdapter</code></td>
            <td style={tdStyle}><code>'localStorage'</code></td>
            <td style={tdStyle}>Storage backend to use. Can be a custom adapter.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>debounce</code></td>
            <td style={tdStyle}><code>number</code></td>
            <td style={tdStyle}><code>500</code></td>
            <td style={tdStyle}>Milliseconds to wait before saving after a change.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>throttle</code></td>
            <td style={tdStyle}><code>number</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Throttle interval in milliseconds (in addition to debounce).</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>exclude</code></td>
            <td style={tdStyle}><code>(keyof T)[]</code></td>
            <td style={tdStyle}><code>[]</code></td>
            <td style={tdStyle}>Field names to exclude from persistence.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>expiration</code></td>
            <td style={tdStyle}><code>number</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Expiration time in minutes after which data is discarded.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>version</code></td>
            <td style={tdStyle}><code>number</code></td>
            <td style={tdStyle}><code>1</code></td>
            <td style={tdStyle}>Schema version for migrations.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>migrate</code></td>
            <td style={tdStyle}><code>(oldData, oldVersion) =&gt; T</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Migration function for updating data from older schema versions.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>merge</code></td>
            <td style={tdStyle}><code>'shallow' | 'deep' | 'prefer-stored' | 'prefer-initial' | MergeFn</code></td>
            <td style={tdStyle}><code>'shallow'</code></td>
            <td style={tdStyle}>Strategy to merge stored data with initial state.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>validate</code></td>
            <td style={tdStyle}><code>(data: T) =&gt; boolean</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Validation function. Return false to prevent saving.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>beforePersist</code></td>
            <td style={tdStyle}><code>(data: T) =&gt; T</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Transform data before persisting.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>enabled</code></td>
            <td style={tdStyle}><code>boolean</code></td>
            <td style={tdStyle}><code>true</code></td>
            <td style={tdStyle}>Enable or disable persistence (useful for GDPR).</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>keyPrefix</code></td>
            <td style={tdStyle}><code>string</code></td>
            <td style={tdStyle}><code>'rfp:'</code></td>
            <td style={tdStyle}>Prefix for storage keys.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>history</code></td>
            <td style={tdStyle}><code>boolean | HistoryOptions</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Enable undo/redo functionality. Set maxHistory in options.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>sync</code></td>
            <td style={tdStyle}><code>boolean | SyncOptions</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Enable cross-tab synchronization.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>compress</code></td>
            <td style={tdStyle}><code>boolean | CompressionOptions</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Enable compression for large data.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>onRestore</code></td>
            <td style={tdStyle}><code>(data: T) =&gt; void</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Callback when data is restored from storage.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>onError</code></td>
            <td style={tdStyle}><code>(error: PersistErrorInfo) =&gt; void</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Error handler for persistence operations.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>onStorageFull</code></td>
            <td style={tdStyle}><code>(error: PersistErrorInfo) =&gt; void</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Callback specifically for storage quota errors.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>warnSize</code></td>
            <td style={tdStyle}><code>number</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Warn when storage size exceeds this threshold (bytes).</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>debug</code></td>
            <td style={tdStyle}><code>boolean</code></td>
            <td style={tdStyle}><code>false</code></td>
            <td style={tdStyle}>Enable console logging for debugging.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>transform</code></td>
            <td style={tdStyle}><code>TransformOptions&lt;T&gt;</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Custom serialize/deserialize functions for encryption.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>partition</code></td>
            <td style={tdStyle}><code>boolean | PartitionOptions</code></td>
            <td style={tdStyle}><code>undefined</code></td>
            <td style={tdStyle}>Enable partitioning for large data sets.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>persistMode</code></td>
            <td style={tdStyle}><code>'full' | 'dirty'</code></td>
            <td style={tdStyle}><code>'full'</code></td>
            <td style={tdStyle}>Save entire state or only changed fields.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ActionsContent() {
  return (
    <div>
      <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Available actions</h3>
      <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
        The third element returned by useFormPersist is an object containing
        actions and properties to control persistence behavior programmatically.
      </p>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Property/Method</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}><code>clear</code></td>
            <td style={tdStyle}><code>() =&gt; void</code></td>
            <td style={tdStyle}>Remove persisted data from storage.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>reset</code></td>
            <td style={tdStyle}><code>() =&gt; void</code></td>
            <td style={tdStyle}>Reset state to initial value and clear storage.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>forceSave</code></td>
            <td style={tdStyle}><code>() =&gt; void</code></td>
            <td style={tdStyle}>Force immediate save (bypasses debounce).</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>revert</code></td>
            <td style={tdStyle}><code>() =&gt; void</code></td>
            <td style={tdStyle}>Revert to the last saved state.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>pause</code></td>
            <td style={tdStyle}><code>() =&gt; void</code></td>
            <td style={tdStyle}>Pause automatic persistence.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>resume</code></td>
            <td style={tdStyle}><code>() =&gt; void</code></td>
            <td style={tdStyle}>Resume automatic persistence.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>withClear</code></td>
            <td style={tdStyle}><code>(handler) =&gt; handler</code></td>
            <td style={tdStyle}>Wrapper that clears storage after handler succeeds.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>getPersistedValue</code></td>
            <td style={tdStyle}><code>() =&gt; T | null</code></td>
            <td style={tdStyle}>Get persisted value without triggering restore.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>isPersisted</code></td>
            <td style={tdStyle}><code>boolean</code></td>
            <td style={tdStyle}>Whether data exists in storage.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>isRestored</code></td>
            <td style={tdStyle}><code>boolean</code></td>
            <td style={tdStyle}>Whether data was restored on mount.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>isDirty</code></td>
            <td style={tdStyle}><code>boolean</code></td>
            <td style={tdStyle}>Whether current state differs from initial.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>isPaused</code></td>
            <td style={tdStyle}><code>boolean</code></td>
            <td style={tdStyle}>Whether persistence is paused.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>lastSaved</code></td>
            <td style={tdStyle}><code>number | null</code></td>
            <td style={tdStyle}>Timestamp of last successful save.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>size</code></td>
            <td style={tdStyle}><code>number</code></td>
            <td style={tdStyle}>Size of persisted data in bytes.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>undo</code></td>
            <td style={tdStyle}><code>() =&gt; void</code></td>
            <td style={tdStyle}>Undo last change (requires history option).</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>redo</code></td>
            <td style={tdStyle}><code>() =&gt; void</code></td>
            <td style={tdStyle}>Redo last undone change (requires history option).</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>canUndo</code></td>
            <td style={tdStyle}><code>boolean</code></td>
            <td style={tdStyle}>Whether undo is available.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>canRedo</code></td>
            <td style={tdStyle}><code>boolean</code></td>
            <td style={tdStyle}>Whether redo is available.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>historyIndex</code></td>
            <td style={tdStyle}><code>number</code></td>
            <td style={tdStyle}>Current position in history.</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>historyLength</code></td>
            <td style={tdStyle}><code>number</code></td>
            <td style={tdStyle}>Total states in history.</td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ fontSize: '16px', marginBottom: '15px', marginTop: '30px' }}>Usage example</h3>
      <div style={codeBlockStyle}>
{`const [formData, setFormData, actions] = useFormPersist('my-form', initialData);

// Clear on successful submit
const handleSubmit = actions.withClear(async () => {
  await submitForm(formData);
});

// Or manually clear
const handleManualSubmit = async () => {
  await submitForm(formData);
  actions.clear();
};

// Force save before navigation
const handleNavigate = () => {
  actions.forceSave();
  navigate('/next-page');
};

// Show save status
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
      </div>
    </div>
  );
}

function ProviderContent() {
  return (
    <div>
      <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>FormPersistProvider</h3>
      <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
        The FormPersistProvider component allows you to set default options for all
        useFormPersist hooks in your application. It also provides access to a
        registry of all active forms and their states.
      </p>

      <div style={codeBlockStyle}>
{`import { FormPersistProvider } from 'react-form-autosave';

function App() {
  return (
    <FormPersistProvider
      defaults={{
        debounce: 1000,
        storage: 'sessionStorage',
        debug: process.env.NODE_ENV === 'development',
      }}
    >
      <YourApplication />
    </FormPersistProvider>
  );
}`}
      </div>

      <h3 style={{ fontSize: '16px', marginBottom: '15px', marginTop: '30px' }}>useFormRegistry</h3>
      <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
        Access the registry of all active forms to build admin panels, debug tools,
        or coordinate form states across your application.
      </p>

      <div style={codeBlockStyle}>
{`import { useFormRegistry } from 'react-form-autosave';

function FormDebugPanel() {
  const registry = useFormRegistry();

  return (
    <div>
      <h3>Active forms: {Object.keys(registry).length}</h3>
      {Object.entries(registry).map(([key, entry]) => (
        <div key={key}>
          <strong>{key}</strong>
          <pre>{JSON.stringify(entry.data, null, 2)}</pre>
          <button onClick={entry.clear}>Clear</button>
        </div>
      ))}
    </div>
  );
}`}
      </div>

      <h3 style={{ fontSize: '16px', marginBottom: '15px', marginTop: '30px' }}>AutoSaveIndicator</h3>
      <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
        A ready-to-use component that displays the current save status for a form.
      </p>

      <div style={codeBlockStyle}>
{`import { useFormPersist, AutoSaveIndicator } from 'react-form-autosave';

function MyForm() {
  const [formData, setFormData, actions] = useFormPersist('my-form', initialData);

  return (
    <form>
      {/* form fields */}
      <AutoSaveIndicator
        lastSaved={actions.lastSaved}
        savedText="All changes saved"
        savingText="Saving..."
        notSavedText="Not saved"
      />
    </form>
  );
}`}
      </div>
    </div>
  );
}

function ModulesContent() {
  return (
    <div>
      <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Optional modules</h3>
      <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
        The library provides optional modules that can be imported separately.
        This allows for tree-shaking so you only include what you need.
      </p>

      <h4 style={{ fontSize: '14px', marginBottom: '10px', marginTop: '25px' }}>History (undo/redo)</h4>
      <div style={codeBlockStyle}>
{`import { useHistory } from 'react-form-autosave/history';

function FormWithHistory() {
  const [formData, setFormData] = useFormPersist('my-form', initialData);
  const { undo, redo, canUndo, canRedo, history, position } = useHistory(
    formData,
    setFormData,
    { maxSize: 50 }
  );

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
      <span>History: {position + 1} / {history.length}</span>
    </div>
  );
}`}
      </div>

      <h4 style={{ fontSize: '14px', marginBottom: '10px', marginTop: '25px' }}>Sync (cross-tab)</h4>
      <div style={codeBlockStyle}>
{`import { useSync } from 'react-form-autosave/sync';

function SyncedForm() {
  const [formData, setFormData] = useFormPersist('shared-form', initialData);
  const { isLeader, connectedTabs } = useSync('shared-form', formData, setFormData, {
    strategy: 'last-write-wins',
    throttle: 100,
  });

  return (
    <div>
      <span>{isLeader ? 'Leader tab' : 'Follower tab'}</span>
      <span>Connected tabs: {connectedTabs}</span>
    </div>
  );
}`}
      </div>

      <h4 style={{ fontSize: '14px', marginBottom: '10px', marginTop: '25px' }}>DevTools</h4>
      <div style={codeBlockStyle}>
{`import { FormPersistDevTools } from 'react-form-autosave/devtools';

function App() {
  return (
    <FormPersistProvider>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <FormPersistDevTools position="bottom-right" />
      )}
    </FormPersistProvider>
  );
}`}
      </div>

      <h4 style={{ fontSize: '14px', marginBottom: '10px', marginTop: '25px' }}>Testing utilities</h4>
      <div style={codeBlockStyle}>
{`import {
  createMockStorage,
  seedPersistedData,
  getPersistedData,
  clearTestStorage,
  waitForPersist,
  createTestWrapper,
  simulateStorageFull,
  simulateCorruptedData,
} from 'react-form-autosave/testing';

describe('MyForm', () => {
  beforeEach(() => {
    clearTestStorage();
  });

  it('restores saved data', () => {
    seedPersistedData('my-form', { name: 'Test' });
    render(<MyForm />);
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
  });

  it('persists data after debounce', async () => {
    const { result } = renderHook(() => useFormPersist('form', { name: '' }));
    act(() => result.current[1]({ name: 'Jane' }));
    await waitForPersist();
    expect(getPersistedData('form')).toEqual({ name: 'Jane' });
  });

  it('works with mock storage', () => {
    const mockStorage = createMockStorage();
    render(<MyForm storage={mockStorage} />);
    expect(mockStorage.getItem).toHaveBeenCalled();
  });
});`}
      </div>
    </div>
  );
}

export function DocumentationSection() {
  const [activeTab, setActiveTab] = useState<DocTab>('quickstart');

  return (
    <div style={styles.demoSection}>
      <h2 style={styles.demoTitle}>Documentation</h2>
      <p style={styles.demoDescription}>
        Complete guide to using react-form-autosave in your projects.
        Select a section below to learn about installation, configuration,
        and advanced features.
      </p>

      <div
        style={{
          display: 'flex',
          gap: '5px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              border: '1px solid #000',
              backgroundColor: activeTab === tab.key ? '#000' : '#fff',
              color: activeTab === tab.key ? '#fff' : '#000',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        style={{
          border: '1px solid #000',
          padding: '20px',
          backgroundColor: '#fff',
        }}
      >
        {activeTab === 'quickstart' && <QuickStartContent />}
        {activeTab === 'options' && <OptionsContent />}
        {activeTab === 'actions' && <ActionsContent />}
        {activeTab === 'provider' && <ProviderContent />}
        {activeTab === 'modules' && <ModulesContent />}
      </div>
    </div>
  );
}
