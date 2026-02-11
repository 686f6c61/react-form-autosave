/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Main demo application showcasing various use cases
 */

import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { FormPersistProvider } from 'react-form-autosave';
import './app.css';

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

const demoComponents: Record<DemoType, React.LazyExoticComponent<() => JSX.Element>> = {
  simple: lazy(async () => ({ default: (await import('./components/SimpleFormDemo')).SimpleFormDemo })),
  wizard: lazy(async () => ({ default: (await import('./components/WizardDemo')).WizardDemo })),
  checkout: lazy(async () => ({ default: (await import('./components/CheckoutDemo')).CheckoutDemo })),
  gdpr: lazy(async () => ({ default: (await import('./components/GDPRDemo')).GDPRDemo })),
  undo: lazy(async () => ({ default: (await import('./components/UndoRedoDemo')).UndoRedoDemo })),
  sync: lazy(async () => ({ default: (await import('./components/TabSyncDemo')).TabSyncDemo })),
  expiration: lazy(async () => ({ default: (await import('./components/ExpirationDemo')).ExpirationDemo })),
  migration: lazy(async () => ({ default: (await import('./components/MigrationDemo')).MigrationDemo })),
  indicator: lazy(async () => ({ default: (await import('./components/AutoSaveIndicatorDemo')).AutoSaveIndicatorDemo })),
  features: lazy(async () => ({ default: (await import('./components/FeaturesSection')).FeaturesSection })),
  docs: lazy(async () => ({ default: (await import('./components/DocumentationSection')).DocumentationSection })),
};

const DEMO_QUERY_PARAM = 'demo';

function isDemoType(value: string | null): value is DemoType {
  return demos.some((demo) => demo.key === value);
}

function readDemoFromLocation(): DemoType {
  if (typeof window === 'undefined') {
    return 'simple';
  }

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get(DEMO_QUERY_PARAM);
  if (isDemoType(fromQuery)) {
    return fromQuery;
  }

  const fromHash = window.location.hash.replace('#', '');
  if (isDemoType(fromHash)) {
    return fromHash;
  }

  return 'simple';
}

function writeDemoToLocation(demo: DemoType): void {
  if (typeof window === 'undefined') {
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set(DEMO_QUERY_PARAM, demo);
  window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
}

export default function App() {
  const [activeDemo, setActiveDemo] = useState<DemoType>(() => readDemoFromLocation());

  useEffect(() => {
    writeDemoToLocation(activeDemo);
  }, [activeDemo]);

  useEffect(() => {
    const handlePopState = () => {
      setActiveDemo(readDemoFromLocation());
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const ActiveDemo = useMemo(() => demoComponents[activeDemo], [activeDemo]);
  const currentVersion = __LIB_VERSION__;

  return (
    <FormPersistProvider
      defaults={{
        debug: import.meta.env.DEV,
        debounce: 500,
      }}
    >
      <div className="demo-shell">
        <header className="hero">
          <p className="hero-badge">v{currentVersion} · React form persistence toolkit</p>
          <h1 className="hero-title">Persist React forms without boilerplate</h1>
          <p className="hero-subtitle">
            Autosave, restore, expiration, undo/redo, tab sync, migrations, and consent-based
            persistence in one library. Explore demos and copy production-ready patterns.
          </p>

          <div className="hero-actions">
            <a
              className="hero-action hero-action-primary"
              href="https://www.npmjs.com/package/react-form-autosave"
              target="_blank"
              rel="noopener noreferrer"
            >
              Install from npm
            </a>
            <a
              className="hero-action"
              href="https://github.com/686f6c61/react-form-autosave"
              target="_blank"
              rel="noopener noreferrer"
            >
              View source
            </a>
            <button
              type="button"
              className="hero-action"
              onClick={() => setActiveDemo('simple')}
            >
              Try live demos
            </button>
            <button
              type="button"
              className="hero-action"
              onClick={() => setActiveDemo('docs')}
            >
              Open docs
            </button>
          </div>

          <div className="hero-install">
            <code>npm install react-form-autosave</code>
          </div>

          <div className="hero-highlights">
            <span className="hero-chip">Framework agnostic</span>
            <span className="hero-chip">Undo/redo + history</span>
            <span className="hero-chip">Cross-tab sync</span>
            <span className="hero-chip">Partition + dirty mode</span>
            <span className="hero-chip">Tree-shakeable modules</span>
          </div>
        </header>

        <nav className="demo-nav" aria-label="Demo navigation">
          {demos.map((demo) => (
            <button
              type="button"
              key={demo.key}
              className={`demo-nav-button ${activeDemo === demo.key ? 'active' : ''}`}
              onClick={() => setActiveDemo(demo.key)}
              aria-pressed={activeDemo === demo.key}
              aria-current={activeDemo === demo.key ? 'page' : undefined}
            >
              {demo.label}
            </button>
          ))}
        </nav>

        <main id="demo-main" className="demo-main">
          <Suspense fallback={<div className="demo-fallback">Loading demo...</div>}>
            <ActiveDemo />
          </Suspense>
        </main>

        <footer className="demo-footer">
          <p style={{ marginBottom: '10px' }}>
            <a
              href="https://github.com/686f6c61/react-form-autosave"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            {' | '}
            <a
              href="https://www.npmjs.com/package/react-form-autosave"
              target="_blank"
              rel="noopener noreferrer"
            >
              npm
            </a>
            {' | '}
            <span>v{currentVersion}</span>
          </p>
          <p style={{ fontSize: '12px' }}>
            Created by{' '}
            <a
              href="https://github.com/686f6c61"
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
