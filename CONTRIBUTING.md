# Contributing to react-form-autosave

First off, thank you for considering contributing to react-form-autosave!

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Build the library:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
  core/          # Types, constants
  storage/       # Storage adapters
  middleware/    # Debounce, transform, merge, validate
  hooks/         # Main useFormPersist hook
  components/    # Provider, AutoSaveIndicator
  history/       # Undo/redo (tree-shakeable)
  sync/          # Tab sync (tree-shakeable)
  devtools/      # DevTools (tree-shakeable)
  testing/       # Test utilities
  __tests__/     # Test files
demo/            # Demo application
```

## Guidelines

### Code Style

- Use TypeScript for all source files
- Follow the existing code style
- Add JSDoc comments for public APIs
- Keep the bundle size minimal

### Commits

We follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Add/update tests as needed
4. Ensure all tests pass
5. Update documentation if needed
6. Submit a PR with a clear description

## Running the Demo

```bash
cd demo
npm install
npm run dev
```

## Questions?

Open an issue on GitHub.
