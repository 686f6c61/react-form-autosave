/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Main demo application showcasing various use cases
 */

import React, { useState } from 'react';
import { FormPersistProvider } from 'react-form-autosave';
import { SimpleFormDemo } from './components/SimpleFormDemo';
import { WizardDemo } from './components/WizardDemo';
import { CheckoutDemo } from './components/CheckoutDemo';
import { GDPRDemo } from './components/GDPRDemo';
import { UndoRedoDemo } from './components/UndoRedoDemo';
import { TabSyncDemo } from './components/TabSyncDemo';
import { ExpirationDemo } from './components/ExpirationDemo';
import { MigrationDemo } from './components/MigrationDemo';
import { AutoSaveIndicatorDemo } from './components/AutoSaveIndicatorDemo';
import { FeaturesSection } from './components/FeaturesSection';
import { DocumentationSection } from './components/DocumentationSection';
import { styles } from './styles';

type DemoType = 'simple' | 'wizard' | 'checkout' | 'gdpr' | 'undo' | 'sync' | 'expiration' | 'migration' | 'indicator' | 'features' | 'docs';

const demos: { key: DemoType; label: string; isInfo?: boolean }[] = [
  { key: 'simple', label: 'Simple Form' },
  { key: 'wizard', label: 'Multi-Step Wizard' },
  { key: 'checkout', label: 'Checkout Form' },
  { key: 'gdpr', label: 'GDPR Consent' },
  { key: 'undo', label: 'Undo/Redo' },
  { key: 'sync', label: 'Tab Sync' },
  { key: 'expiration', label: 'Expiration' },
  { key: 'migration', label: 'Migration' },
  { key: 'indicator', label: 'Save Indicator' },
  { key: 'features', label: 'Features', isInfo: true },
  { key: 'docs', label: 'Documentation', isInfo: true },
];

export default function App() {
  const [activeDemo, setActiveDemo] = useState<DemoType>('simple');

  return (
    <FormPersistProvider
      defaults={{
        debug: true,
        debounce: 500,
      }}
    >
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <h1 style={styles.title}>react-form-autosave</h1>
          <p style={styles.subtitle}>
            Zero-dependency React library for auto-saving form state
          </p>
        </header>

        {/* Navigation */}
        <nav style={styles.nav}>
          {demos.map((demo) => (
            <button
              key={demo.key}
              style={{
                ...styles.navButton,
                ...(demo.isInfo ? {
                  backgroundColor: activeDemo === demo.key ? '#000' : '#333',
                  color: '#fff',
                  borderColor: '#000',
                } : {}),
                ...(activeDemo === demo.key && !demo.isInfo ? styles.navButtonActive : {}),
              }}
              onClick={() => setActiveDemo(demo.key)}
            >
              {demo.label}
            </button>
          ))}
        </nav>

        {/* Demo Content */}
        <main>
          {activeDemo === 'simple' && <SimpleFormDemo />}
          {activeDemo === 'wizard' && <WizardDemo />}
          {activeDemo === 'checkout' && <CheckoutDemo />}
          {activeDemo === 'gdpr' && <GDPRDemo />}
          {activeDemo === 'undo' && <UndoRedoDemo />}
          {activeDemo === 'sync' && <TabSyncDemo />}
          {activeDemo === 'expiration' && <ExpirationDemo />}
          {activeDemo === 'migration' && <MigrationDemo />}
          {activeDemo === 'indicator' && <AutoSaveIndicatorDemo />}
          {activeDemo === 'features' && <FeaturesSection />}
          {activeDemo === 'docs' && <DocumentationSection />}
        </main>

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '40px', color: '#666', fontSize: '14px' }}>
          <p style={{ marginBottom: '10px' }}>
            <a
              href="https://github.com/686f6c61/react-form-autosave"
              style={{ color: '#000', fontWeight: 'bold' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            {' | '}
            <a
              href="https://www.npmjs.com/package/react-form-autosave"
              style={{ color: '#000', fontWeight: 'bold' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              npm
            </a>
            {' | '}
            <span>v0.1.2</span>
          </p>
          <p style={{ fontSize: '12px' }}>
            Created by{' '}
            <a
              href="https://github.com/686f6c61"
              style={{ color: '#000' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              686f6c61
            </a>
            {' | MIT License'}
          </p>
        </footer>
      </div>
    </FormPersistProvider>
  );
}
