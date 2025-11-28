/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Context provider for global configuration and form registry
 * Allows setting default options that all useFormPersist hooks inherit
 */

import React, { createContext, useContext, useMemo, useCallback, useRef } from 'react';
import type {
  FormPersistOptions,
  FormPersistRegistryEntry,
} from '../core/types';

/**
 * Context for form persist configuration
 */
const FormPersistContext = createContext<Partial<FormPersistOptions<unknown>>>({});

/**
 * Context for form registry (used by DevTools)
 */
/* istanbul ignore next -- @preserve Default context value */
const FormRegistryContext = createContext<{
  register: (key: string, entry: FormPersistRegistryEntry) => void;
  unregister: (key: string) => void;
  getAll: () => Map<string, FormPersistRegistryEntry>;
}>({
  register: () => {},
  unregister: () => {},
  getAll: () => new Map(),
});

/**
 * Props for FormPersistProvider
 */
export interface FormPersistProviderProps {
  /** Default options for all useFormPersist hooks */
  defaults?: Partial<FormPersistOptions<unknown>>;
  /** Child components */
  children: React.ReactNode;
}

/**
 * Provider component for global configuration
 *
 * @example
 * ```tsx
 * // Set global defaults
 * <FormPersistProvider
 *   defaults={{
 *     debounce: 1000,
 *     storage: 'sessionStorage',
 *     keyPrefix: 'myapp:',
 *     debug: process.env.NODE_ENV === 'development',
 *   }}
 * >
 *   <App />
 * </FormPersistProvider>
 *
 * // All useFormPersist hooks inside will inherit these defaults
 * const [state, setState] = useFormPersist('form', initialState);
 * // Uses sessionStorage, 1000ms debounce, 'myapp:form' key
 * ```
 */
export function FormPersistProvider({
  defaults = {},
  children,
}: FormPersistProviderProps): JSX.Element {
  // Registry for tracking all form instances
  const registryRef = useRef<Map<string, FormPersistRegistryEntry>>(new Map());

  /* istanbul ignore next -- @preserve Registry functions used by consuming apps */
  const register = useCallback((key: string, entry: FormPersistRegistryEntry) => {
    registryRef.current.set(key, entry);
  }, []);

  /* istanbul ignore next -- @preserve Registry functions used by consuming apps */
  const unregister = useCallback((key: string) => {
    registryRef.current.delete(key);
  }, []);

  /* istanbul ignore next -- @preserve Registry function used by DevTools */
  const getAll = useCallback(() => {
    return new Map(registryRef.current);
  }, []);

  const registryValue = useMemo(
    () => ({ register, unregister, getAll }),
    [register, unregister, getAll]
  );

  return (
    <FormPersistContext.Provider value={defaults}>
      <FormRegistryContext.Provider value={registryValue}>
        {children}
      </FormRegistryContext.Provider>
    </FormPersistContext.Provider>
  );
}

/**
 * Hook to access global defaults
 * Used internally by useFormPersist
 *
 * @returns Partial options from provider
 */
export function useFormPersistContext(): Partial<FormPersistOptions<unknown>> {
  return useContext(FormPersistContext);
}

/**
 * Hook to access the form registry
 * Used by DevTools to list all registered forms
 *
 * @returns Registry methods
 */
export function useFormRegistry() {
  return useContext(FormRegistryContext);
}
