/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Multi-step wizard demo with step-by-step persistence
 */

import React, { useState } from 'react';
import { useFormPersist, clearGroup, AutoSaveIndicator } from 'react-form-autosave';
import { styles } from '../styles';

interface Step1Data {
  firstName: string;
  lastName: string;
  email: string;
}

interface Step2Data {
  company: string;
  role: string;
  experience: string;
}

interface Step3Data {
  interests: string[];
  newsletter: boolean;
  comments: string;
}

const step1Initial: Step1Data = { firstName: '', lastName: '', email: '' };
const step2Initial: Step2Data = { company: '', role: '', experience: '' };
const step3Initial: Step3Data = { interests: [], newsletter: false, comments: '' };

export function WizardDemo() {
  const [currentStep, setCurrentStep] = useState(1);

  const [step1Data, setStep1Data, step1Actions] = useFormPersist<Step1Data>(
    'wizard:step1',
    step1Initial
  );

  const [step2Data, setStep2Data, step2Actions] = useFormPersist<Step2Data>(
    'wizard:step2',
    step2Initial
  );

  const [step3Data, setStep3Data, step3Actions] = useFormPersist<Step3Data>(
    'wizard:step3',
    step3Initial
  );

  const handleClearAll = () => {
    const cleared = clearGroup('wizard');
    alert(`Cleared ${cleared} saved form(s)`);
    step1Actions.reset();
    step2Actions.reset();
    step3Actions.reset();
    setCurrentStep(1);
  };

  const handleSubmit = () => {
    alert(
      `Wizard completed!\n\n` +
        `Step 1: ${JSON.stringify(step1Data)}\n` +
        `Step 2: ${JSON.stringify(step2Data)}\n` +
        `Step 3: ${JSON.stringify(step3Data)}`
    );
    handleClearAll();
  };

  const renderStepIndicator = () => (
    <div style={styles.wizardSteps}>
      {[1, 2, 3].map((step) => (
        <div key={step} style={styles.wizardStep}>
          <div
            style={{
              ...styles.wizardStepNumber,
              ...(currentStep >= step ? styles.wizardStepActive : {}),
            }}
          >
            {step}
          </div>
          <span>
            {step === 1 && 'Personal'}
            {step === 2 && 'Professional'}
            {step === 3 && 'Preferences'}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={styles.demoSection}>
      <h2 style={styles.demoTitle}>Multi-Step Wizard</h2>
      <p style={styles.demoDescription}>
        Each step saves independently. Close the page mid-wizard and come back -
        your progress is preserved. Use clearGroup() to clear all wizard data.
      </p>

      {renderStepIndicator()}

      {/* Step 1 */}
      {currentStep === 1 && (
        <div>
          <div style={styles.formGroup}>
            <label style={styles.label}>First Name</label>
            <input
              style={styles.input}
              value={step1Data.firstName}
              onChange={(e) =>
                setStep1Data({ ...step1Data, firstName: e.target.value })
              }
              placeholder="John"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Last Name</label>
            <input
              style={styles.input}
              value={step1Data.lastName}
              onChange={(e) =>
                setStep1Data({ ...step1Data, lastName: e.target.value })
              }
              placeholder="Doe"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={step1Data.email}
              onChange={(e) =>
                setStep1Data({ ...step1Data, email: e.target.value })
              }
              placeholder="john@example.com"
            />
          </div>
        </div>
      )}

      {/* Step 2 */}
      {currentStep === 2 && (
        <div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Company</label>
            <input
              style={styles.input}
              value={step2Data.company}
              onChange={(e) =>
                setStep2Data({ ...step2Data, company: e.target.value })
              }
              placeholder="Acme Inc."
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Role</label>
            <select
              style={styles.select}
              value={step2Data.role}
              onChange={(e) =>
                setStep2Data({ ...step2Data, role: e.target.value })
              }
            >
              <option value="">Select a role</option>
              <option value="developer">Developer</option>
              <option value="designer">Designer</option>
              <option value="manager">Manager</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Years of Experience</label>
            <input
              style={styles.input}
              value={step2Data.experience}
              onChange={(e) =>
                setStep2Data({ ...step2Data, experience: e.target.value })
              }
              placeholder="5"
            />
          </div>
        </div>
      )}

      {/* Step 3 */}
      {currentStep === 3 && (
        <div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Interests</label>
            {['React', 'TypeScript', 'Node.js', 'GraphQL'].map((interest) => (
              <label key={interest} style={{ ...styles.checkboxLabel, marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={step3Data.interests.includes(interest)}
                  onChange={(e) => {
                    const newInterests = e.target.checked
                      ? [...step3Data.interests, interest]
                      : step3Data.interests.filter((i) => i !== interest);
                    setStep3Data({ ...step3Data, interests: newInterests });
                  }}
                />
                {interest}
              </label>
            ))}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={step3Data.newsletter}
                onChange={(e) =>
                  setStep3Data({ ...step3Data, newsletter: e.target.checked })
                }
              />
              Subscribe to newsletter
            </label>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Additional Comments</label>
            <textarea
              style={styles.textarea}
              value={step3Data.comments}
              onChange={(e) =>
                setStep3Data({ ...step3Data, comments: e.target.value })
              }
              placeholder="Any additional comments..."
            />
          </div>
        </div>
      )}

      <div style={{ ...styles.buttonGroup, marginTop: '20px' }}>
        {currentStep > 1 && (
          <button
            style={styles.button}
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            Previous
          </button>
        )}
        {currentStep < 3 ? (
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={() => setCurrentStep((s) => s + 1)}
          >
            Next
          </button>
        ) : (
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={handleSubmit}
          >
            Complete
          </button>
        )}
        <button style={styles.button} onClick={handleClearAll}>
          Clear All Progress
        </button>
      </div>

      <div style={styles.statusBar}>
        <AutoSaveIndicator
          lastSaved={
            currentStep === 1 ? step1Actions.lastSaved :
            currentStep === 2 ? step2Actions.lastSaved :
            step3Actions.lastSaved
          }
        />
        <div>
          {(step1Actions.isPersisted || step2Actions.isPersisted || step3Actions.isPersisted) && (
            <span style={styles.code}>Data saved in localStorage</span>
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <strong>Current State (Step {currentStep}):</strong>
        <pre style={styles.previewBox}>
          {JSON.stringify(
            currentStep === 1 ? step1Data :
            currentStep === 2 ? step2Data :
            step3Data,
            null, 2
          )}
        </pre>
      </div>
    </div>
  );
}
