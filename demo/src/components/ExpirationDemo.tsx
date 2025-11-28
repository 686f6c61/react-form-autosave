/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Demo: Data Expiration
 * Shows how persisted data automatically expires after a set time
 */

import React, { useState, useEffect } from 'react';
import { useFormPersist } from 'react-form-autosave';
import { styles } from '../styles';

interface CartItem {
  name: string;
  quantity: number;
  price: number;
}

interface CartData {
  items: CartItem[];
  promoCode: string;
  notes: string;
}

const initialCart: CartData = {
  items: [
    { name: 'Product A', quantity: 1, price: 29.99 },
    { name: 'Product B', quantity: 2, price: 15.99 },
  ],
  promoCode: '',
  notes: '',
};

export function ExpirationDemo() {
  // Data expires after 1 minute for demo purposes
  // In production, you might use 30 (30 minutes) or 60 (1 hour)
  const [cartData, setCartData, actions] = useFormPersist<CartData>(
    'demo-cart-expiration',
    initialCart,
    {
      expiration: 1, // 1 minute expiration
      onRestore: (data) => {
        console.log('Cart restored from storage:', data);
      },
    }
  );

  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Calculate and display time remaining until expiration
  useEffect(() => {
    const updateTimeRemaining = () => {
      if (actions.lastSaved) {
        const expiresAt = actions.lastSaved + (1 * 60 * 1000); // 1 minute
        const remaining = expiresAt - Date.now();

        if (remaining > 0) {
          const seconds = Math.ceil(remaining / 1000);
          setTimeRemaining(`${seconds}s`);
        } else {
          setTimeRemaining('Expired');
        }
      } else {
        setTimeRemaining('Not saved yet');
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [actions.lastSaved]);

  const updateQuantity = (index: number, delta: number) => {
    setCartData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      ),
    }));
  };

  const total = cartData.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div style={styles.demoSection}>
      <h2 style={styles.demoTitle}>Data Expiration</h2>
      <p style={styles.demoDescription}>
        This demo shows a shopping cart that automatically expires after 1 minute.
        The <code style={styles.code}>expiration</code> option sets the TTL in minutes.
        When data expires, the form resets to its initial state on next visit.
      </p>

      <div style={{ ...styles.alert, ...styles.alertInfo, marginBottom: '20px' }}>
        <strong>Time until expiration:</strong> {timeRemaining}
        <br />
        <small>
          Try modifying the cart, then wait 1 minute and refresh the page.
          The cart will reset to its initial state.
        </small>
      </div>

      {/* Cart Items */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Shopping Cart</h3>
        {cartData.items.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px',
              border: '1px solid #ddd',
              marginBottom: '10px',
            }}
          >
            <div>
              <strong>{item.name}</strong>
              <br />
              <small>${item.price.toFixed(2)} each</small>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                style={{ ...styles.button, padding: '5px 10px' }}
                onClick={() => updateQuantity(index, -1)}
              >
                -
              </button>
              <span style={{ minWidth: '30px', textAlign: 'center' }}>
                {item.quantity}
              </span>
              <button
                style={{ ...styles.button, padding: '5px 10px' }}
                onClick={() => updateQuantity(index, 1)}
              >
                +
              </button>
              <span style={{ minWidth: '70px', textAlign: 'right' }}>
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Promo Code</label>
        <input
          type="text"
          style={styles.input}
          value={cartData.promoCode}
          onChange={(e) =>
            setCartData((prev) => ({ ...prev, promoCode: e.target.value }))
          }
          placeholder="Enter promo code..."
        />
      </div>

      {/* Notes */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Order Notes</label>
        <textarea
          style={styles.textarea}
          value={cartData.notes}
          onChange={(e) =>
            setCartData((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Special instructions..."
        />
      </div>

      {/* Total */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          border: '2px solid #000',
          marginBottom: '20px',
        }}
      >
        <strong style={{ fontSize: '18px' }}>Total:</strong>
        <strong style={{ fontSize: '18px' }}>${total.toFixed(2)}</strong>
      </div>

      {/* Actions */}
      <div style={styles.buttonGroup}>
        <button
          style={{ ...styles.button, ...styles.buttonPrimary }}
          onClick={() => {
            alert('Order placed! Cart will be cleared.');
            actions.clear();
          }}
        >
          Place Order
        </button>
        <button style={styles.button} onClick={() => actions.reset()}>
          Reset Cart
        </button>
        <button style={styles.button} onClick={() => actions.forceSave()}>
          Save Now
        </button>
      </div>

      {/* Status */}
      <div style={styles.statusBar}>
        <span>
          <span
            style={{
              ...styles.statusDot,
              ...(actions.isPersisted ? styles.statusSaved : styles.statusUnsaved),
            }}
          />
          {actions.isPersisted ? 'Saved' : 'Not saved'}
        </span>
        <span>
          {actions.lastSaved
            ? `Last saved: ${new Date(actions.lastSaved).toLocaleTimeString()}`
            : 'Never saved'}
        </span>
      </div>

      {/* Code Example */}
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Code Example:</h4>
        <pre style={styles.previewBox}>
{`const [cartData, setCartData, actions] = useFormPersist(
  'shopping-cart',
  initialCart,
  {
    expiration: 30, // Expires after 30 minutes
    onRestore: (data) => {
      console.log('Cart restored:', data);
    },
  }
);`}
        </pre>
      </div>
    </div>
  );
}
