/**
 * react-form-autosave demo
 * @version 0.2.0
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Dedicated documentation zone with practical guides.
 */

import { DocumentationSection } from './DocumentationSection';
import { styles } from '../styles';
import type { CSSProperties } from 'react';

type PlaygroundDemo = 'simple' | 'sync' | 'migration' | 'gdpr' | 'features';

interface DocsZoneProps {
  onTryDemo: (demo: PlaygroundDemo) => void;
}

const codeBlockStyle: CSSProperties = {
  backgroundColor: '#f5f7fa',
  border: '1px solid #d0d5dd',
  padding: '14px',
  borderRadius: '8px',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '12px',
  lineHeight: '1.5',
  overflowX: 'auto',
  whiteSpace: 'pre',
  marginTop: '10px',
  marginBottom: '20px',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '12px',
};

const thStyle: CSSProperties = {
  border: '1px solid #000',
  padding: '10px',
  textAlign: 'left',
  fontSize: '12px',
  backgroundColor: '#f8fafc',
};

const tdStyle: CSSProperties = {
  border: '1px solid #d0d5dd',
  padding: '10px',
  fontSize: '12px',
  verticalAlign: 'top',
};

export function DocsZone({ onTryDemo }: DocsZoneProps) {
  return (
    <div>
      <div style={{ ...styles.alert, ...styles.alertInfo }}>
        <strong>Documentation Home</strong>
        <p style={{ marginTop: '8px', marginBottom: '12px' }}>
          This section is designed to be shared directly at <code style={styles.code}>/docs</code>.
          Use the buttons below for quick jumps to interactive demos.
        </p>
        <div style={styles.buttonGroup}>
          <button type="button" style={styles.button} onClick={() => onTryDemo('simple')}>
            Try basic form
          </button>
          <button type="button" style={styles.button} onClick={() => onTryDemo('sync')}>
            Try tab sync
          </button>
          <button type="button" style={styles.button} onClick={() => onTryDemo('migration')}>
            Try migration
          </button>
          <button type="button" style={styles.button} onClick={() => onTryDemo('gdpr')}>
            Try GDPR flow
          </button>
        </div>
      </div>

      <DocumentationSection />

      <section style={styles.demoSection}>
        <h2 style={styles.demoTitle}>Production Recipes</h2>
        <p style={styles.demoDescription}>
          Common patterns you can copy into real products.
        </p>

        <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>
          1. Clear draft only after successful submit
        </h3>
        <div style={codeBlockStyle}>
{`const [formData, setFormData, actions] = useFormPersist('checkout', initialState);

const submit = actions.withClear(async () => {
  await api.checkout(formData); // clear() runs only after this resolves
});`}
        </div>

        <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>
          2. Clear a full flow by key group (wizard/logout)
        </h3>
        <div style={codeBlockStyle}>
{`import { clearGroup } from 'react-form-autosave';

const clearedCount = clearGroup('wizard');
console.log('Removed keys:', clearedCount);`}
        </div>

        <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>
          3. Keep storage small with dirty mode + partition
        </h3>
        <div style={codeBlockStyle}>
{`useFormPersist('profile', initialState, {
  persistMode: 'dirty',
  partition: { enabled: true, maxSize: 50_000 },
  warnSize: 120_000,
});`}
        </div>
      </section>

      <section style={styles.demoSection}>
        <h2 style={styles.demoTitle}>Troubleshooting</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Symptom</th>
              <th style={thStyle}>Likely Cause</th>
              <th style={thStyle}>Fix</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>Data is not restored on refresh</td>
              <td style={tdStyle}>Different key, keyPrefix, or storage backend between runs</td>
              <td style={tdStyle}>Use stable keys and keep storage/keyPrefix configuration consistent</td>
            </tr>
            <tr>
              <td style={tdStyle}>Default values overwrite restored values</td>
              <td style={tdStyle}>Merging strategy not aligned with form schema</td>
              <td style={tdStyle}>Use <code style={styles.code}>merge: 'deep'</code> or custom merge function</td>
            </tr>
            <tr>
              <td style={tdStyle}>Sync conflicts across tabs</td>
              <td style={tdStyle}>Concurrent edits in multiple tabs</td>
              <td style={tdStyle}>Start with <code style={styles.code}>strategy: 'latest-wins'</code>; add <code style={styles.code}>conflictResolver</code> for merge logic</td>
            </tr>
            <tr>
              <td style={tdStyle}>No persistence in private browsing</td>
              <td style={tdStyle}>Storage is blocked by browser/privacy settings</td>
              <td style={tdStyle}>Show user notice and fallback to <code style={styles.code}>storage: 'memory'</code></td>
            </tr>
            <tr>
              <td style={tdStyle}>Hydration mismatch in SSR apps</td>
              <td style={tdStyle}>Reading browser APIs manually during server render</td>
              <td style={tdStyle}>Let <code style={styles.code}>useFormPersist</code> handle SSR, avoid direct localStorage access in server path</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={styles.demoSection}>
        <h2 style={styles.demoTitle}>Security and Compliance Checklist</h2>
        <ul style={{ paddingLeft: '18px', lineHeight: '1.6', fontSize: '14px' }}>
          <li>Exclude sensitive fields (<code style={styles.code}>exclude</code>) such as card data, passwords, tokens.</li>
          <li>Gate persistence behind consent using <code style={styles.code}>enabled</code> for GDPR/consent workflows.</li>
          <li>Set <code style={styles.code}>expiration</code> for temporary forms so stale data is auto-removed.</li>
          <li>Use <code style={styles.code}>version</code> + <code style={styles.code}>migrate</code> before schema changes hit production.</li>
          <li>Use <code style={styles.code}>onError</code> / <code style={styles.code}>onStorageFull</code> to monitor failures.</li>
        </ul>
      </section>
    </div>
  );
}
