/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Checkout form demo with sensitive field exclusion
 */

import React from 'react';
import { useFormPersist, AutoSaveIndicator } from 'react-form-autosave';
import { styles } from '../styles';

interface CheckoutData {
  // Shipping info (persisted)
  fullName: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  // Payment info (excluded from persistence)
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
}

const initialState: CheckoutData = {
  fullName: '',
  address: '',
  city: '',
  zipCode: '',
  country: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
};

export function CheckoutDemo() {
  const [formData, setFormData, actions] = useFormPersist<CheckoutData>(
    'checkout-form',
    initialState,
    {
      // Exclude sensitive payment fields
      exclude: ['cardNumber', 'cardExpiry', 'cardCvc'],
      expiration: 60, // Expire after 1 hour
      debounce: 300,
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.withClear(async () => {
      alert('Order placed successfully!');
    })();
  };

  return (
    <div style={styles.demoSection}>
      <h2 style={styles.demoTitle}>Checkout Form</h2>
      <p style={styles.demoDescription}>
        Shipping info is auto-saved, but payment details (card number, expiry,
        CVC) are excluded using the <code style={styles.code}>exclude</code>{' '}
        option. Data expires after 1 hour.
      </p>

      <div style={{ ...styles.alert, ...styles.alertInfo }}>
        <strong>Security Note:</strong> Card details are never saved to
        localStorage. Try filling the form, refreshing, and notice only
        shipping info is restored.
      </div>

      <form onSubmit={handleSubmit}>
        {/* Shipping Section */}
        <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
          Shipping Information
        </h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Full Name</label>
          <input
            style={styles.input}
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Address</label>
          <input
            style={styles.input}
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Main St"
          />
        </div>

        <div style={styles.row}>
          <div style={styles.col}>
            <label style={styles.label}>City</label>
            <input
              style={styles.input}
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="New York"
            />
          </div>
          <div style={styles.col}>
            <label style={styles.label}>ZIP Code</label>
            <input
              style={styles.input}
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="10001"
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Country</label>
          <select
            style={styles.select}
            name="country"
            value={formData.country}
            onChange={handleChange}
          >
            <option value="">Select country</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="UK">United Kingdom</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
          </select>
        </div>

        {/* Payment Section */}
        <h3 style={{ marginBottom: '15px', marginTop: '30px', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
          Payment Information{' '}
          <span style={{ fontWeight: 'normal', fontSize: '12px', color: '#666' }}>
            (not saved)
          </span>
        </h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Card Number</label>
          <input
            style={styles.input}
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            placeholder="4242 4242 4242 4242"
            maxLength={19}
          />
        </div>

        <div style={styles.row}>
          <div style={styles.col}>
            <label style={styles.label}>Expiry</label>
            <input
              style={styles.input}
              name="cardExpiry"
              value={formData.cardExpiry}
              onChange={handleChange}
              placeholder="MM/YY"
              maxLength={5}
            />
          </div>
          <div style={styles.col}>
            <label style={styles.label}>CVC</label>
            <input
              style={styles.input}
              name="cardCvc"
              value={formData.cardCvc}
              onChange={handleChange}
              placeholder="123"
              maxLength={4}
              type="password"
            />
          </div>
        </div>

        <div style={{ ...styles.buttonGroup, marginTop: '20px' }}>
          <button
            type="submit"
            style={{ ...styles.button, ...styles.buttonPrimary }}
          >
            Place Order
          </button>
          <button
            type="button"
            style={styles.button}
            onClick={actions.clear}
          >
            Clear Saved Data
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
