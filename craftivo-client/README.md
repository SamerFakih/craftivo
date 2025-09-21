# CraftivoClient

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## CI Installation & Dependency Notes

We pin all Angular framework packages to the exact patch `20.2.4` (except `@angular/ssr` currently `20.2.1`) to avoid peer resolution drift in CI. If you add Angular packages, keep versions aligned to prevent `ERESOLVE` conflicts (e.g. mismatched `@angular/compiler` vs `@angular/compiler-cli`).

### npm ci EPERM (Windows / OneDrive)

If you encounter an error similar to:

```
EPERM: operation not permitted, unlink ... @msgpackr-extract-win32-x64\node.napi.node
```

This is usually a transient Windows file lock (often due to OneDrive or AV scanning). A preinstall cleanup script removes the native addon directory before `npm ci` prunes and reinstalls.

Run a clean install locally (robust wrapper avoids file lock issues):

```
npm run ci:install
```

The wrapper script will:

1. Rename existing `node_modules` to release locks.
2. Delete the renamed folder with retries.
3. Execute `npm ci`.

If you prefer the direct route you can still run:

```
npm run cleanup && npm ci
```

If the problem persists:

- Close editors / watchers holding file handles.
- Pause OneDrive sync temporarily.
- Manually remove `node_modules` and retry.

### Adding new dependencies

After adding or updating dependencies run:

```
npm install
npm test
```

Commit both `package.json` and `package-lock.json` so CI’s `npm ci` uses the same resolution.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
