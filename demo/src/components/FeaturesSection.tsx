/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Features section showcasing library capabilities
 */

import React from 'react';
import { styles } from '../styles';

interface Feature {
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    title: 'Zero dependencies',
    description: 'Only React as a peer dependency. No bloat, no conflicts, minimal bundle size under 2KB gzipped.',
  },
  {
    title: 'useState-like API',
    description: 'Drop-in replacement for useState. Just change the import and add a storage key.',
  },
  {
    title: 'TypeScript support',
    description: 'Full type definitions included. Autocomplete and type checking work out of the box.',
  },
  {
    title: 'SSR compatible',
    description: 'Works with Next.js, Remix, and other SSR frameworks. No hydration errors.',
  },
  {
    title: 'Multiple storage backends',
    description: 'localStorage, sessionStorage, or custom adapters. Memory fallback for incognito mode.',
  },
  {
    title: 'Debounced saves',
    description: 'Configurable debounce prevents excessive writes during rapid typing.',
  },
  {
    title: 'Field exclusion',
    description: 'Exclude sensitive fields like passwords and credit cards from persistence.',
  },
  {
    title: 'Data expiration',
    description: 'Set expiration time in minutes. Stale data is automatically discarded.',
  },
  {
    title: 'Schema versioning',
    description: 'Version your data schema and provide migration functions for seamless updates.',
  },
  {
    title: 'Undo and redo',
    description: 'Built-in history management with configurable stack size.',
  },
  {
    title: 'Cross-tab sync',
    description: 'Real-time synchronization between browser tabs using BroadcastChannel.',
  },
  {
    title: 'GDPR ready',
    description: 'Enable/disable persistence based on user consent. Clear all data on demand.',
  },
  {
    title: 'Validation',
    description: 'Validate data before persisting. Skip saves that do not pass validation.',
  },
  {
    title: 'Compression',
    description: 'Optional compression for large data to stay within storage limits.',
  },
  {
    title: 'DevTools',
    description: 'Development panel to inspect, copy, and clear persisted forms.',
  },
  {
    title: 'Testing utilities',
    description: 'Mock storage, seed data, and helper functions for testing.',
  },
];

export function FeaturesSection() {
  return (
    <div style={styles.demoSection}>
      <h2 style={styles.demoTitle}>Features</h2>
      <p style={styles.demoDescription}>
        A comprehensive list of all features included in react-form-autosave.
        Each feature is designed to solve real-world problems when persisting
        form state in browser storage.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '15px',
          marginTop: '20px',
        }}
      >
        {features.map((feature, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #000',
              padding: '15px',
              backgroundColor: '#fff',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px',
                borderBottom: '1px solid #eee',
                paddingBottom: '8px',
              }}
            >
              {feature.title}
            </h3>
            <p style={{ fontSize: '12px', color: '#444', lineHeight: '1.5' }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
