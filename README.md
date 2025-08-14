# @token-ring/browser-file-system

A lightweight, browser-friendly mock implementation of `FileSystemService` that operates entirely in memory. This package is useful for demos, tests, and UIs (like the web terminal) where direct access to a real file system is not available.

It exposes a small, opinionated subset of file system operations and ships with a built-in in-memory file map so you can explore directory trees and read files without any external setup.

## What this package offers

- BrowserFileSystemService
  - Extends `@token-ring/filesystem`'s `FileSystemService`.
  - Provides read-only-ish behavior with a few mocked write operations.
  - Works with the Token Ring registry and other packages that consume a `FileSystemService`.

### Implemented methods (mocked)

- `async *getDirectoryTree(path = "/", { ig, recursive = true })`
  - Yields file paths from the in-memory map, honoring `recursive` and optional ignore filter `ig(path) => boolean`.
- `async getFile(filePath)`
  - Returns the file content from memory or throws if missing.
- `async writeFile(filePath, content)`
  - Updates existing entries in memory and logs a warning. Throws if the path does not already exist. Intended for demo only.
- `async deleteFile(filePath)`
  - Not implemented; rejects with an error (read-only for now).
- `async exists(filePath)`
  - Returns true if the path exists in the in-memory map.
- `async copy(source, destination, { overwrite } = {})`
  - Copies content in memory; throws if destination exists and `overwrite` is not set.
- `async rename(oldPath, newPath)`
  - Moves an entry within the in-memory map; throws if conflicts occur.

Note: Methods such as `glob`, `watch`, `stat`, `createDirectory`, `executeCommand`, `grep`, etc., are not implemented in this mock service.

## Installation

This package is part of the Token Ring monorepo and is typically consumed via workspaces.

- Name: `@token-ring/browser-file-system`
- Version: `0.1.0`
- Peer packages commonly used alongside:
  - `@token-ring/filesystem`
  - `@token-ring/registry`

## Exports

```ts
import { BrowserFileSystemService, name, description, version } from "@token-ring/browser-file-system";
```

## Usage

Register the service in a `ServiceRegistry` so other parts of the system that require a `FileSystemService` can find it.

```ts
import { ServiceRegistry } from "@token-ring/registry";
import { BrowserFileSystemService } from "@token-ring/browser-file-system";

const registry = new ServiceRegistry();
await registry.start();

// Register the mock file system
const fs = new BrowserFileSystemService();
await registry.services.addServices(fs);

// Directory tree (root)
for await (const p of fs.getDirectoryTree("/", { recursive: true })) {
  console.log(p);
}

// Read a file that exists in the built-in map
const readme = await fs.getFile("/README.md");
console.log(readme);

// Update existing file content (mock write)
await fs.writeFile("/README.md", "# Updated in-memory README\n");

// Copy and rename within the in-memory map
await fs.copy("/package.json", "/package.copy.json", { overwrite: true });
await fs.rename("/src/index.js", "/src/main.js");
```

### Built-in mock files

The service ships with a small in-memory map containing paths like:

- `/README.md`
- `/src/index.js`
- `/src/components/Button.jsx`
- `/package.json`

These are intended for quick exploration and UI demos.

## Notes and limitations

- In-memory only: No persistence across reloads. Intended for demos/tests.
- Partial API: Many advanced methods on `FileSystemService` are intentionally unimplemented.
- Write semantics: `writeFile` updates only existing paths and logs a warning; `deleteFile` rejects.
- Paths are absolute: The mock normalizes input and uses absolute-style paths ("/") internally.

## File map

- pkg/browser-file-system/index.js
- pkg/browser-file-system/BrowserFileSystem.ts
- pkg/browser-file-system/package.json
- pkg/browser-file-system/README.md (this file)

## License

MIT
