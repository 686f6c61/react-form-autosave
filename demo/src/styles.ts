/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Shared styles for demo components (black and white theme)
 */

import { CSSProperties } from 'react';

export const styles: Record<string, CSSProperties> = {
  // Layout
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    borderBottom: '3px solid #000',
    paddingBottom: '20px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
  },
  nav: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '30px',
    justifyContent: 'center',
  },
  navButton: {
    padding: '10px 20px',
    border: '2px solid #000',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  navButtonActive: {
    backgroundColor: '#000',
    color: '#fff',
  },

  // Demo section
  demoSection: {
    border: '2px solid #000',
    padding: '30px',
    marginBottom: '20px',
  },
  demoTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
    borderBottom: '1px solid #000',
    paddingBottom: '10px',
  },
  demoDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
  },

  // Form elements
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #000',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '2px solid #000',
    fontSize: '14px',
    fontFamily: 'inherit',
    minHeight: '100px',
    resize: 'vertical',
    backgroundColor: '#fff',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '2px solid #000',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  checkbox: {
    marginRight: '10px',
    transform: 'scale(1.2)',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },

  // Buttons
  button: {
    padding: '12px 24px',
    border: '2px solid #000',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  buttonPrimary: {
    backgroundColor: '#000',
    color: '#fff',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },

  // Status indicators
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #000',
    marginTop: '20px',
    fontSize: '12px',
  },
  statusDot: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginRight: '8px',
  },
  statusSaved: {
    backgroundColor: '#000',
  },
  statusUnsaved: {
    backgroundColor: '#ccc',
  },

  // Wizard
  wizardSteps: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '30px',
  },
  wizardStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  wizardStepNumber: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '2px solid #000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  wizardStepActive: {
    backgroundColor: '#000',
    color: '#fff',
  },
  wizardStepCompleted: {
    backgroundColor: '#000',
    color: '#fff',
  },

  // Grid
  row: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  col: {
    flex: 1,
  },

  // Misc
  code: {
    backgroundColor: '#f0f0f0',
    padding: '2px 6px',
    border: '1px solid #ddd',
    fontFamily: 'inherit',
    fontSize: '12px',
  },
  previewBox: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #000',
    padding: '15px',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: '200px',
    overflow: 'auto',
  },
  alert: {
    padding: '15px',
    border: '2px solid #000',
    marginBottom: '20px',
  },
  alertInfo: {
    backgroundColor: '#f0f0f0',
  },
};
