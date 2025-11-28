# react-form-autosave

A zero-dependency React library for automatically persisting form state to browser storage. When users accidentally close a tab, navigate away, or experience a session timeout, their form data is automatically restored when they return.

## Why this library

The React ecosystem has several options for persisting state to browser storage, but each comes with limitations that make form persistence more difficult than it should be.

### The problem with existing solutions

**react-hook-form-persist** is tightly coupled to react-hook-form. If you use Formik, a custom form solution, or plain React state, you cannot use it. The package was last updated in 2021 and has known issues with default values overriding restored data after page refresh.

**use-local-storage-state** provides a solid useState replacement with localStorage sync, but it lacks form-specific features. There is no field exclusion for sensitive data, no debouncing to prevent excessive writes during typing, no expiration handling, no undo/redo, and no cross-tab synchronization.

**redux-persist** and **zustand persist** require you to adopt a global state management library. For a simple contact form or checkout page, adding Redux or Zustand just to persist form fields is unnecessary complexity. These solutions also add significant bundle size (Redux ecosystem is around 10KB).

**react-persist** from Jared Palmer provides basic persistence with a component-based API, but development stopped years ago. It lacks TypeScript support, has no SSR handling, and provides no utilities for testing.

**Custom hooks** are what many developers end up writing. Every tutorial shows a different approach, most with subtle bugs: missing SSR checks that cause hydration errors, no debouncing that hammers localStorage on every keystroke, no handling for storage quota errors, and no consideration for sensitive field exclusion.

### What this library provides

This library is designed specifically for form persistence with a complete feature set:

**Framework agnostic**. Works with any form approach: react-hook-form, Formik, plain controlled inputs, or any other solution. The API mirrors useState, so integration requires changing one import.

**Zero dependencies**. The core bundle is under 2KB gzipped. No runtime dependencies beyond React itself. Optional features like history and sync are separate imports that only increase bundle size if you use them.

**Form-aware features out of the box**. Debounced saves prevent excessive writes during typing. Field exclusion keeps passwords and credit card numbers out of storage. Data expiration automatically cleans up stale form data. Schema versioning with migrations handles evolving form structures.

**Built-in undo and redo**. Users can navigate through their edit history, a feature that typically requires significant custom code.

**Cross-tab synchronization**. When users have the same form open in multiple tabs, changes sync automatically using BroadcastChannel with a fallback to storage events for older browsers.

**Production ready**. Full TypeScript support with exported types. SSR compatible with Next.js, Remix, and other frameworks without hydration errors. Memory fallback when localStorage is unavailable. Testing utilities included.

**GDPR compliant by design**. The enabled option lets you disable persistence until the user consents. The clearGroup utility implements right to erasure.

### Comparison table

| Feature | react-form-autosave | react-hook-form-persist | use-local-storage-state | redux-persist |
|---------|---------------------|------------------------|------------------------|---------------|
| Framework agnostic | Yes | No (react-hook-form only) | Yes | No (Redux only) |
| Zero dependencies | Yes | No | Yes | No |
| Bundle size | <2KB | ~1KB | ~1KB | ~10KB |
| Debounced saves | Yes | No | No | No |
| Field exclusion | Yes | Yes | No | No |
| Data expiration | Yes | Yes | No | No |
| Undo/redo | Yes | No | No | No |
| Cross-tab sync | Yes | No | Yes | Requires redux-state-sync |
| Schema migrations | Yes | No | No | Yes |
| TypeScript | Yes | Partial | Yes | Yes |
| SSR support | Yes | Limited | Yes | Yes |
| Testing utilities | Yes | No | No | No |
| Actively maintained | Yes | Last update 2021 | Yes | Yes |

### When to use this library

Use react-form-autosave when you need to persist form state without adopting a global state management solution, when you want form-specific features like field exclusion and debouncing out of the box, when bundle size matters and you want to pay only for features you use, or when you need undo/redo or cross-tab sync without writing custom code.

Consider alternatives if you already use Redux and want to persist your entire store (use redux-persist), if you use react-hook-form and only need basic persistence (use react-hook-form-persist), or if you need to persist non-form state across your application (use use-local-storage-state or a state management solution with persistence).

## Table of contents

- [Why this library](#why-this-library)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Core concepts](#core-concepts)
- [API reference](#api-reference)
- [Configuration options](#configuration-options)
- [Actions and methods](#actions-and-methods)
- [Advanced usage](#advanced-usage)
- [Testing](#testing)
- [Browser support](#browser-support)
- [Test coverage](#test-coverage)
- [License](#license)

## Installation

Install the package using your preferred package manager:

```bash
npm install react-form-autosave
```

```bash
yarn add react-form-autosave
```

```bash
pnpm add react-form-autosave
```

The library requires React 16.8 or higher as a peer dependency.

## Quick start

The simplest way to use this library is to replace your existing `useState` call with `useFormPersist`. The hook accepts a unique key to identify the form in storage, followed by the initial state:

```tsx
import { useFormPersist } from 'react-form-autosave';

function ContactForm() {
  const [formData, setFormData, { clear }] = useFormPersist('contact-form', {
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitToServer(formData);
    clear(); // Remove persisted data after successful submission
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={formData.name} onChange={handleChange} />
      <input name="email" value={formData.email} onChange={handleChange} />
      <textarea name="message" value={formData.message} onChange={handleChange} />
      <button type="submit">Send</button>
    </form>
  );
}
```

With this minimal setup, form data is automatically saved to localStorage 500 milliseconds after the user stops typing. When the user returns to the page, their previous input is restored automatically.

## Core concepts

### How persistence works

The library wraps your form state and automatically synchronizes it with browser storage. Each state change triggers a debounced save operation, preventing excessive writes during rapid typing. The persisted data includes metadata such as timestamps and schema versions to handle expiration and migration scenarios.

### Storage key structure

All keys are prefixed with `rfp:` by default to avoid collisions with other localStorage data. A form with key `contact-form` is stored as `rfp:contact-form`. You can customize this prefix globally through the provider or per-hook through options.

### Server-side rendering compatibility

The library detects server-side rendering environments and skips all storage operations on the server. Hydration occurs correctly on the client, and the hook returns the initial state during SSR without errors.

## API reference

### useFormPersist hook

The primary export of this library. It provides a useState-like interface with automatic persistence.

```typescript
function useFormPersist<T>(
  key: string,
  initialState: T,
  options?: FormPersistOptions<T>
): [T, Dispatch<SetStateAction<T>>, FormPersistActions<T>]
```

The first parameter is a unique string identifier for this form. Choose a key that is descriptive and unlikely to conflict with other forms in your application. The second parameter is the initial state, identical to what you would pass to useState. The optional third parameter configures persistence behavior.

The hook returns a tuple of three elements. The first is the current state, which may be restored from storage on mount. The second is a setter function that works exactly like the setter from useState, accepting either a new value or an updater function. The third is an actions object containing methods and properties to control persistence behavior.

### useFormPersistObject hook

An alternative version that returns an object instead of a tuple, useful when you only need specific properties:

```typescript
const { state, setState, clear, undo, redo } = useFormPersistObject('my-form', initialState);
```

### FormPersistProvider component

A context provider for setting default options that apply to all hooks within its tree:

```tsx
import { FormPersistProvider } from 'react-form-autosave';

function App() {
  return (
    <FormPersistProvider
      defaults={{
        debounce: 1000,
        storage: 'sessionStorage',
        debug: process.env.NODE_ENV === 'development',
      }}
    >
      <YourApplication />
    </FormPersistProvider>
  );
}
```

Options passed directly to individual hooks override these defaults.

### AutoSaveIndicator component

A presentational component that displays the current save status:

```tsx
import { useFormPersist, AutoSaveIndicator } from 'react-form-autosave';

function Form() {
  const [data, setData, { lastSaved }] = useFormPersist('form', initialState);

  return (
    <form>
      <AutoSaveIndicator
        lastSaved={lastSaved}
        savedText="Saved"
        savingText="Saving..."
        notSavedText="Not saved"
        showTimestamp={true}
        style={{ padding: '8px' }}
        className="save-indicator"
      />
      {/* form fields */}
    </form>
  );
}
```

The component accepts the following props:

| Prop | Type | Description |
|------|------|-------------|
| `lastSaved` | `number \| null` | Timestamp of last save (required) |
| `isSaving` | `boolean` | Whether currently saving |
| `savedText` | `string` | Text to show when saved (default: "Saved") |
| `savingText` | `string` | Text to show while saving (default: "Saving...") |
| `notSavedText` | `string` | Text to show when not saved (default: "Not saved") |
| `showTimestamp` | `boolean` | Show the time of last save |
| `className` | `string` | Custom CSS class |
| `style` | `CSSProperties` | Custom inline styles |

## Configuration options

All options are optional and have sensible defaults.

### Storage options

The `storage` option determines where data is persisted. The default value is `localStorage`. You can set it to `sessionStorage` if you want data to be cleared when the browser tab is closed. Setting it to `memory` uses an in-memory store that does not persist across page reloads, useful for testing or special cases. You can also pass a custom storage adapter object implementing `getItem`, `setItem`, and `removeItem` methods.

```typescript
// Use sessionStorage instead of localStorage
useFormPersist('form', initialState, { storage: 'sessionStorage' });

// Use a custom storage adapter
const customStorage = {
  getItem: (key) => myDatabase.get(key),
  setItem: (key, value) => myDatabase.set(key, value),
  removeItem: (key) => myDatabase.delete(key),
};
useFormPersist('form', initialState, { storage: customStorage });
```

The `keyPrefix` option changes the prefix added to all storage keys. The default is `rfp:`.

### Timing options

The `debounce` option sets the delay in milliseconds before saving after the last state change. The default is 500 milliseconds. Lower values provide more frequent saves but increase storage writes. Higher values reduce writes but increase the risk of data loss if the user closes the tab quickly after typing.

```typescript
useFormPersist('form', initialState, { debounce: 1000 }); // Wait 1 second
```

The `throttle` option sets a minimum interval between saves, regardless of debounce. This is useful for forms with continuous updates where you want periodic saves even during active editing.

The `expiration` option sets a time in minutes after which persisted data is considered stale and discarded. When the hook mounts and finds expired data, it uses the initial state instead and removes the expired data from storage.

```typescript
useFormPersist('form', initialState, { expiration: 60 }); // Expire after 1 hour
```

### Data handling options

The `exclude` option accepts an array of field names that should never be persisted. This is essential for sensitive data like passwords, credit card numbers, or security codes. Excluded fields are stripped from the data before saving but remain in the component state.

```typescript
useFormPersist('checkout', initialState, {
  exclude: ['cardNumber', 'cvv', 'password'],
});
```

The `validate` option accepts a function that receives the data before saving. If the function returns false, the save operation is skipped. This allows you to implement custom validation logic to prevent saving invalid or incomplete data.

```typescript
useFormPersist('form', initialState, {
  validate: (data) => data.email.includes('@'),
});
```

The `beforePersist` option accepts a function that transforms data before saving. The transformed data is what gets persisted, while the original data remains in component state.

```typescript
useFormPersist('form', initialState, {
  beforePersist: (data) => ({
    ...data,
    lastModified: Date.now(),
  }),
});
```

The `merge` option controls how restored data is combined with the initial state when they differ. This is important when your initial state changes between versions of your application. Available strategies are:

- `shallow`: Spreads restored data over initial state at the top level only. This is the default.
- `deep`: Recursively merges nested objects, preserving new fields added to initial state.
- `prefer-stored`: Uses restored data entirely, falling back to initial state only for missing keys.
- `prefer-initial`: Uses initial state, filling in from restored data only where initial values are empty.

You can also pass a custom merge function:

```typescript
useFormPersist('form', initialState, {
  merge: (stored, initial) => ({
    ...initial,
    ...stored,
    version: initial.version, // Always use current version
  }),
});
```

### Schema versioning

The `version` option assigns a version number to your data schema. When you change the structure of your form data, increment this number. The default is 1.

The `migrate` option accepts a function that converts data from older versions to the current version. It receives the old data and its version number, and should return data compatible with the current schema.

```typescript
useFormPersist('form', initialState, {
  version: 2,
  migrate: (oldData, oldVersion) => {
    if (oldVersion === 1) {
      // Version 1 had separate firstName and lastName
      // Version 2 combines them into fullName
      return {
        ...oldData,
        fullName: `${oldData.firstName} ${oldData.lastName}`,
      };
    }
    return oldData;
  },
});
```

### Feature toggles

The `enabled` option controls whether persistence is active. When set to false, the hook behaves like a regular useState with no storage operations. This is useful for implementing GDPR-compliant consent flows where you only persist data after the user has given permission.

```typescript
const [hasConsent, setHasConsent] = useState(false);

const [formData, setFormData, actions] = useFormPersist('form', initialState, {
  enabled: hasConsent,
});
```

The `history` option enables undo and redo functionality. When enabled, the hook tracks state changes and allows navigating through previous states. You can pass a boolean or an object with a `maxHistory` property to limit memory usage.

```typescript
useFormPersist('form', initialState, {
  history: { enabled: true, maxHistory: 50 },
});
```

The `sync` option enables cross-tab synchronization. When enabled, changes made in one browser tab are automatically reflected in other tabs viewing the same form. You can pass a boolean or an object with additional configuration.

```typescript
useFormPersist('form', initialState, {
  sync: {
    enabled: true,
    strategy: 'latest-wins',
    onSync: (data, source) => console.log('Synced from', source),
  },
});
```

The `compress` option enables compression for large data. This can help stay within browser storage limits when persisting substantial amounts of data.

The `debug` option enables console logging of persistence operations, useful during development.

### Transform options

The `transform` option allows you to provide custom serialization and deserialization functions. This is useful for encrypting data before storage or applying custom encoding.

```typescript
useFormPersist('form', initialState, {
  transform: {
    serialize: (data) => encrypt(JSON.stringify(data)),
    deserialize: (str) => JSON.parse(decrypt(str)),
  },
});
```

### Partition options

The `partition` option enables splitting large data across multiple storage keys. This helps work around browser storage limits for large forms.

```typescript
useFormPersist('large-form', initialState, {
  partition: {
    enabled: true,
    maxSize: 50000, // 50KB per partition
  },
});
```

### Persist mode

The `persistMode` option controls how data is saved. The default `full` mode saves the entire state on each change. The `dirty` mode only saves fields that have changed from the initial state, reducing storage usage.

```typescript
useFormPersist('form', initialState, {
  persistMode: 'dirty', // Only save changed fields
});
```

### Callback options

The `onRestore` callback is invoked when data is successfully restored from storage on mount. It receives the restored data as its argument.

```typescript
useFormPersist('form', initialState, {
  onRestore: (data) => {
    console.log('Restored form data:', data);
    analytics.track('form_restored');
  },
});
```

The `onError` callback is invoked when a persistence error occurs, such as corrupted data or storage access issues. It receives an error info object with type, message, and key properties.

The `onStorageFull` callback is specifically invoked when a quota exceeded error occurs. This allows you to handle storage limits gracefully, perhaps by clearing old data or notifying the user.

## Actions and methods

The third element returned by the hook is an actions object containing the following properties and methods.

### State information

The `isPersisted` property is a boolean indicating whether data currently exists in storage for this form.

The `isRestored` property is a boolean indicating whether data was restored from storage when the hook mounted.

The `lastSaved` property contains the timestamp of the last successful save operation, or null if no save has occurred.

The `isDirty` property is a boolean indicating whether the current state differs from the initial state.

The `size` property contains the approximate size in bytes of the persisted data.

### Persistence control

The `clear` method removes all persisted data for this form from storage. The current state is not affected.

```typescript
const handleSubmitSuccess = () => {
  actions.clear();
};
```

The `reset` method sets the state back to the initial value and clears persisted data. This is equivalent to calling `setState(initialState)` followed by `clear()`.

The `forceSave` method triggers an immediate save operation, bypassing the debounce delay. Use this when you need to ensure data is saved before a navigation or other operation.

```typescript
const handleBeforeNavigate = () => {
  actions.forceSave();
};
```

The `pause` method temporarily stops automatic persistence. State changes will not be saved until `resume` is called.

The `resume` method resumes automatic persistence after it was paused.

The `isPaused` property indicates whether persistence is currently paused.

### History navigation

These methods are only functional when the `history` option is enabled.

The `undo` method reverts the state to the previous value in history.

The `redo` method moves forward in history to a previously undone state.

The `canUndo` property indicates whether there is a previous state to undo to.

The `canRedo` property indicates whether there is a forward state to redo to.

The `historyIndex` property indicates the current position in the history stack.

The `historyLength` property indicates the total number of states in the history stack.

### Utility methods

The `revert` method restores the state to the last persisted value, discarding any unsaved changes.

The `getPersistedValue` method returns the currently persisted data without triggering a restore or affecting component state. Returns null if no data is persisted.

The `withClear` method wraps a handler function to automatically clear persisted data after successful execution. This is useful for form submission handlers.

```typescript
const handleSubmit = actions.withClear(async () => {
  await api.submitForm(formData);
});
```

## Advanced usage

### Multi-step forms and wizards

For forms split across multiple steps or pages, persist each step independently with related keys. Use the `clearGroup` utility to clear all related data at once.

```typescript
import { useFormPersist, clearGroup } from 'react-form-autosave';

function WizardStep1() {
  const [data, setData] = useFormPersist('wizard:step1', step1Initial);
  // ...
}

function WizardStep2() {
  const [data, setData] = useFormPersist('wizard:step2', step2Initial);
  // ...
}

function WizardComplete() {
  const handleComplete = () => {
    // Clear all wizard steps at once
    const clearedCount = clearGroup('wizard');
    console.log(`Cleared ${clearedCount} form(s)`);
  };
  // ...
}
```

### GDPR compliance

To comply with data protection regulations, only enable persistence after obtaining user consent. When consent is revoked, clear all stored data.

```typescript
function ConsentAwareForm() {
  const [consent, setConsent] = useState(loadConsentFromCookie());

  const [formData, setFormData, actions] = useFormPersist('form', initialState, {
    enabled: consent,
  });

  const handleRevokeConsent = () => {
    actions.clear();
    setConsent(false);
    saveConsentToCookie(false);
  };

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (!e.target.checked) actions.clear();
          }}
        />
        Save my progress locally
      </label>
      {/* form fields */}
    </div>
  );
}
```

The `clearGroup` function with an empty prefix clears all data stored by this library, implementing the right to erasure.

### Cross-tab synchronization

When users have the same form open in multiple tabs, enable sync to keep them in sync. The default strategy is `latest-wins`, where the most recent change overwrites others.

```typescript
const [formData, setFormData] = useFormPersist('shared-doc', initialState, {
  sync: {
    enabled: true,
    strategy: 'latest-wins',
    onSync: (data, source) => {
      // source is 'broadcast' or 'storage'
      showNotification('Form updated from another tab');
    },
  },
});
```

For more complex scenarios, provide a custom conflict resolver:

```typescript
sync: {
  enabled: true,
  conflictResolver: (local, remote) => {
    // Merge arrays, prefer remote for other fields
    return {
      ...remote,
      tags: [...new Set([...local.tags, ...remote.tags])],
    };
  },
}
```

### Undo and redo

Enable history tracking to let users undo their changes:

```typescript
function Editor() {
  const [content, setContent, actions] = useFormPersist('editor', { text: '' }, {
    history: { enabled: true, maxHistory: 100 },
  });

  return (
    <div>
      <div>
        <button onClick={actions.undo} disabled={!actions.canUndo}>
          Undo
        </button>
        <button onClick={actions.redo} disabled={!actions.canRedo}>
          Redo
        </button>
        <span>
          Change {actions.historyIndex + 1} of {actions.historyLength}
        </span>
      </div>
      <textarea
        value={content.text}
        onChange={(e) => setContent({ text: e.target.value })}
      />
    </div>
  );
}
```

### Custom storage backends

Implement the storage adapter interface to persist data anywhere:

```typescript
interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}
```

Example with IndexedDB wrapper:

```typescript
const indexedDBStorage = {
  async getItem(key) {
    const db = await openDB();
    return db.get('forms', key);
  },
  async setItem(key, value) {
    const db = await openDB();
    await db.put('forms', value, key);
  },
  async removeItem(key) {
    const db = await openDB();
    await db.delete('forms', key);
  },
};

useFormPersist('form', initialState, { storage: indexedDBStorage });
```

### Development tools

During development, use the DevTools component to inspect persisted forms:

```tsx
import { FormPersistDevTools } from 'react-form-autosave/devtools';

function App() {
  return (
    <>
      <YourApplication />
      {process.env.NODE_ENV === 'development' && (
        <FormPersistDevTools position="bottom-right" defaultOpen={false} />
      )}
    </>
  );
}
```

The DevTools panel shows all persisted forms, their current data, timestamps, and provides actions to inspect, copy, or clear individual forms.

## Testing

The library exports testing utilities to simplify testing forms that use persistence.

```typescript
import {
  createMockStorage,
  seedPersistedData,
  getPersistedData,
  clearTestStorage,
  waitForPersist,
  createTestWrapper,
  simulateStorageFull,
  simulateCorruptedData,
} from 'react-form-autosave/testing';
```

### Setting up tests

Clear test storage before each test to ensure isolation:

```typescript
beforeEach(() => {
  clearTestStorage();
});
```

### Testing restoration

Pre-populate storage to test that forms correctly restore data:

```typescript
it('should restore persisted data on mount', () => {
  seedPersistedData('my-form', { name: 'John', email: 'john@test.com' });

  const { result } = renderHook(() =>
    useFormPersist('my-form', { name: '', email: '' })
  );

  expect(result.current[0].name).toBe('John');
  expect(result.current[2].isRestored).toBe(true);
});
```

### Testing persistence

Wait for the debounce delay before asserting on persisted data:

```typescript
it('should persist changes after debounce', async () => {
  const { result } = renderHook(() =>
    useFormPersist('my-form', { name: '' }, { debounce: 100 })
  );

  act(() => {
    result.current[1]({ name: 'Jane' });
  });

  await waitForPersist(150);

  expect(getPersistedData('my-form')).toEqual({ name: 'Jane' });
});
```

### Using mock storage

For more control, use a mock storage adapter:

```typescript
it('should call storage methods', () => {
  const mockStorage = createMockStorage();

  renderHook(() =>
    useFormPersist('form', { value: '' }, { storage: mockStorage, debounce: 0 })
  );

  expect(mockStorage.getItem).toHaveBeenCalledWith('rfp:form');
});
```

## Tree-shaking

The library is designed for optimal tree-shaking. The core functionality is under 2KB gzipped. Optional features are available as separate imports:

```typescript
// Core (always needed)
import { useFormPersist } from 'react-form-autosave';

// Optional modules
import { useHistory } from 'react-form-autosave/history';
import { useSync } from 'react-form-autosave/sync';
import { FormPersistDevTools } from 'react-form-autosave/devtools';
import { createMockStorage } from 'react-form-autosave/testing';
```

If you only use the basic persistence features, the additional modules are not included in your bundle.

## Browser support

The library works in all modern browsers that support localStorage and sessionStorage. This includes Chrome 80 and later, Firefox 75 and later, Safari 13 and later, and Edge 80 and later. For cross-tab synchronization, the BroadcastChannel API is used where available, with a fallback to storage events for broader compatibility.

In environments where storage is unavailable, such as some privacy-focused browser configurations or when storage quota is exceeded, the library falls back to in-memory storage and continues to function without persistence.

## Test coverage

The library maintains 100% test coverage across all metrics. The test suite includes 392 tests covering all functionality.

| Metric | Coverage |
|--------|----------|
| Statements | 100% |
| Branches | 100% |
| Functions | 100% |
| Lines | 100% |

Run the test suite with:

```bash
npm test
```

Generate a coverage report with:

```bash
npm test -- --coverage
```

## License

MIT License. See the LICENSE file for details.

## Links

- Demo: https://react-form-autosave.onrender.com
- Repository: https://github.com/686f6c61/react-form-autosave
- Issues: https://github.com/686f6c61/react-form-autosave/issues
- npm: https://www.npmjs.com/package/react-form-autosave
