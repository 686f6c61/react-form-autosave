/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Demo: Schema Migration
 * Shows how to handle form schema changes with version migrations
 */

import React, { useState } from 'react';
import { useFormPersist } from 'react-form-autosave';
import { styles } from '../styles';

// Current schema (version 2)
interface UserProfileV2 {
  fullName: string; // V2: Combined first + last name
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    country: string;
    postalCode: string; // V2: Added in version 2
  };
  preferences: {
    newsletter: boolean;
    notifications: boolean;
    theme: 'light' | 'dark'; // V2: Added in version 2
  };
}

// Old schema (version 1) - for reference
interface UserProfileV1 {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    country: string;
  };
  preferences: {
    newsletter: boolean;
    notifications: boolean;
  };
}

const initialProfile: UserProfileV2 = {
  fullName: '',
  email: '',
  phone: '',
  address: {
    street: '',
    city: '',
    country: '',
    postalCode: '',
  },
  preferences: {
    newsletter: false,
    notifications: true,
    theme: 'light',
  },
};

// Migration function to convert v1 data to v2 format
function migrateProfile(oldData: unknown, oldVersion: number): UserProfileV2 {
  if (oldVersion === 1) {
    const v1Data = oldData as UserProfileV1;
    return {
      // Combine firstName and lastName into fullName
      fullName: `${v1Data.firstName || ''} ${v1Data.lastName || ''}`.trim(),
      email: v1Data.email || '',
      phone: v1Data.phone || '',
      address: {
        street: v1Data.address?.street || '',
        city: v1Data.address?.city || '',
        country: v1Data.address?.country || '',
        postalCode: '', // New field, default to empty
      },
      preferences: {
        newsletter: v1Data.preferences?.newsletter || false,
        notifications: v1Data.preferences?.notifications || true,
        theme: 'light', // New field, default to light
      },
    };
  }

  // Unknown version, return as-is (or could throw error)
  return oldData as UserProfileV2;
}

export function MigrationDemo() {
  const [profile, setProfile, actions] = useFormPersist<UserProfileV2>(
    'demo-profile-migration',
    initialProfile,
    {
      version: 2,
      migrate: migrateProfile,
      merge: 'deep', // Deep merge to preserve nested structure
      onRestore: (data) => {
        console.log('Profile restored with migration:', data);
      },
    }
  );

  const [showV1Simulator, setShowV1Simulator] = useState(false);

  // Simulate saving V1 data to localStorage (for testing migration)
  const simulateV1Data = () => {
    const v1Data: UserProfileV1 = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 555-0123',
      address: {
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
      },
      preferences: {
        newsletter: true,
        notifications: true,
      },
    };

    // Save as version 1 format
    const wrapped = {
      data: v1Data,
      timestamp: Date.now(),
      version: 1,
    };

    localStorage.setItem('rfp:demo-profile-migration', JSON.stringify(wrapped));
    alert('V1 data saved! Refresh the page to see migration in action.');
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setProfile((prev) => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      }
      if (keys.length === 2) {
        const [parent, child] = keys;
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof UserProfileV2] as Record<string, unknown>),
            [child]: value,
          },
        };
      }
      return prev;
    });
  };

  return (
    <div style={styles.demoSection}>
      <h2 style={styles.demoTitle}>Schema Migration</h2>
      <p style={styles.demoDescription}>
        When your form schema evolves, the <code style={styles.code}>version</code> and{' '}
        <code style={styles.code}>migrate</code> options help convert old data to the new format.
        This ensures users don't lose their saved data when you update your forms.
      </p>

      {/* V1 Simulator */}
      <div style={{ ...styles.alert, ...styles.alertInfo, marginBottom: '20px' }}>
        <strong>Test Migration:</strong>
        <p style={{ margin: '10px 0', fontSize: '13px' }}>
          Click the button below to simulate old V1 data in localStorage, then refresh the page
          to see how the migration function converts it to V2 format.
        </p>
        <button
          style={{ ...styles.button, marginTop: '10px' }}
          onClick={simulateV1Data}
        >
          Simulate V1 Data
        </button>
        <button
          style={{ ...styles.button, marginLeft: '10px', marginTop: '10px' }}
          onClick={() => setShowV1Simulator(!showV1Simulator)}
        >
          {showV1Simulator ? 'Hide' : 'Show'} Schema Comparison
        </button>
      </div>

      {/* Schema Comparison */}
      {showV1Simulator && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1, padding: '15px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
            <h4 style={{ marginBottom: '10px', color: '#666' }}>V1 Schema (Old)</h4>
            <pre style={{ fontSize: '11px', margin: 0 }}>
{`{
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  address: {
    street, city, country
  },
  preferences: {
    newsletter, notifications
  }
}`}
            </pre>
          </div>
          <div style={{ flex: 1, padding: '15px', border: '1px solid #000', backgroundColor: '#fff' }}>
            <h4 style={{ marginBottom: '10px' }}>V2 Schema (Current)</h4>
            <pre style={{ fontSize: '11px', margin: 0 }}>
{`{
  fullName: string, // Combined!
  email: string,
  phone: string,
  address: {
    street, city, country,
    postalCode // New!
  },
  preferences: {
    newsletter, notifications,
    theme // New!
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div style={styles.row}>
        <div style={styles.col}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              style={styles.input}
              value={profile.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="John Doe"
            />
          </div>
        </div>
        <div style={styles.col}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              value={profile.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john@example.com"
            />
          </div>
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Phone</label>
        <input
          type="tel"
          style={styles.input}
          value={profile.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="+1 555-0123"
        />
      </div>

      <h4 style={{ fontSize: '14px', marginTop: '20px', marginBottom: '15px' }}>Address</h4>
      <div style={styles.formGroup}>
        <label style={styles.label}>Street</label>
        <input
          type="text"
          style={styles.input}
          value={profile.address.street}
          onChange={(e) => handleInputChange('address.street', e.target.value)}
          placeholder="123 Main St"
        />
      </div>

      <div style={styles.row}>
        <div style={styles.col}>
          <div style={styles.formGroup}>
            <label style={styles.label}>City</label>
            <input
              type="text"
              style={styles.input}
              value={profile.address.city}
              onChange={(e) => handleInputChange('address.city', e.target.value)}
              placeholder="New York"
            />
          </div>
        </div>
        <div style={styles.col}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Postal Code (V2 field)</label>
            <input
              type="text"
              style={{ ...styles.input, borderColor: '#007bff' }}
              value={profile.address.postalCode}
              onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
              placeholder="10001"
            />
          </div>
        </div>
        <div style={styles.col}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Country</label>
            <input
              type="text"
              style={styles.input}
              value={profile.address.country}
              onChange={(e) => handleInputChange('address.country', e.target.value)}
              placeholder="USA"
            />
          </div>
        </div>
      </div>

      <h4 style={{ fontSize: '14px', marginTop: '20px', marginBottom: '15px' }}>Preferences</h4>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            style={styles.checkbox}
            checked={profile.preferences.newsletter}
            onChange={(e) => handleInputChange('preferences.newsletter', e.target.checked)}
          />
          Subscribe to newsletter
        </label>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            style={styles.checkbox}
            checked={profile.preferences.notifications}
            onChange={(e) => handleInputChange('preferences.notifications', e.target.checked)}
          />
          Enable notifications
        </label>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Theme (V2 field)</label>
        <select
          style={{ ...styles.select, borderColor: '#007bff', maxWidth: '200px' }}
          value={profile.preferences.theme}
          onChange={(e) => handleInputChange('preferences.theme', e.target.value)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {/* Actions */}
      <div style={styles.buttonGroup}>
        <button
          style={{ ...styles.button, ...styles.buttonPrimary }}
          onClick={() => {
            alert('Profile saved!');
            actions.forceSave();
          }}
        >
          Save Profile
        </button>
        <button style={styles.button} onClick={() => actions.reset()}>
          Reset
        </button>
        <button style={styles.button} onClick={() => actions.clear()}>
          Clear Storage
        </button>
      </div>

      {/* Status */}
      <div style={styles.statusBar}>
        <span>Schema Version: 2</span>
        <span>
          {actions.isRestored ? 'Data restored (possibly migrated)' : 'No restored data'}
        </span>
      </div>

      {/* Code Example */}
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Migration Code:</h4>
        <pre style={styles.previewBox}>
{`// Migration function
function migrateProfile(oldData, oldVersion) {
  if (oldVersion === 1) {
    return {
      // Combine firstName + lastName into fullName
      fullName: \`\${oldData.firstName} \${oldData.lastName}\`.trim(),
      email: oldData.email,
      phone: oldData.phone,
      address: {
        ...oldData.address,
        postalCode: '', // New field with default
      },
      preferences: {
        ...oldData.preferences,
        theme: 'light', // New field with default
      },
    };
  }
  return oldData;
}

// Usage
const [profile, setProfile] = useFormPersist('profile', initialData, {
  version: 2,
  migrate: migrateProfile,
  merge: 'deep',
});`}
        </pre>
      </div>
    </div>
  );
}
