# @tokenring-ai/browser-file-system

A browser-based file system provider that implements the `FileSystemProvider` interface using in-memory mock data. This package provides a lightweight, browser-friendly file system abstraction for environments where direct access to the file system is not available, making it ideal for demos, tests, and web-based interfaces like web terminals.

## Overview

The `BrowserFileSystemProvider` implements the complete `FileSystemProvider` interface and provides a comprehensive set of file system operations that work entirely in memory. It ships with a built-in mock file system containing sample files, allowing for immediate exploration without external setup.

## Features

- In-memory file system operations for browser environments
- Full read/write capabilities with file existence checking
- Directory traversal with recursive and non-recursive options
- File copy and rename operations with overwrite support
- Content search (grep) with context line support
- File statistics (size, timestamps, metadata)
- TokenRing plugin integration for automatic service registration
- Comprehensive error handling with descriptive messages
- Support for ignore filters in directory traversal, glob, and search
- Path normalization for consistent path handling
- Comprehensive test coverage with unit and integration tests

## Installation

```bash
bun install @tokenring-ai/browser-file-system
```

## Package Structure

```
pkg/browser-file-system/
├── BrowserFileSystemProvider.ts      # Main provider implementation
├── BrowserFileSystemProvider.test.ts # Unit tests for provider
├── integration.test.ts               # Integration tests
├── index.ts                          # Module exports
├── plugin.ts                         # TokenRing plugin integration
├── package.json                      # Package configuration
├── vitest.config.ts                  # Test configuration
├── LICENSE                           # License information
└── README.md                         # This file
```

## Core Components

### BrowserFileSystemProvider

The main class that implements the complete `FileSystemProvider` interface:

```typescript
import { BrowserFileSystemProvider } from "@tokenring-ai/browser-file-system";

const fileSystem = new BrowserFileSystemProvider();
```

### Mock File System Structure

The provider includes built-in mock files for testing and demonstration:

```typescript
const mockFileSystem: Record<string, { content: string }> = {
  "/README.md": {
    content: "# Mock File System\n\nThis is a sample README file.",
  },
  "/src/index.js": { content: 'console.log("Hello from mock index.js");' },
  "/src/components/Button.jsx": {
    content:
      "const Button = () => <button>Click Me</button>\nexport default Button;",
  },
  "/package.json": {
    content: '{ "name": "mock-project", "version": "1.0.0" }',
  },
};
```

## Usage Examples

### Basic File System Operations

```typescript
import { BrowserFileSystemProvider } from "@tokenring-ai/browser-file-system";

const fs = new BrowserFileSystemProvider();

// Read a file
const readmeContent = await fs.readFile("/README.md");
console.log(readmeContent.toString("utf-8"));

// Check if file exists
const hasPackageJson = await fs.exists("/package.json"); // true

// Write a new file
await fs.writeFile("/src/utils.js", "export const helper = () => 'Hello';");

// Append to existing file
await fs.appendFile("/README.md", "\n## Updated content\n");

// Get directory tree
console.log("Files in mock system:");
for await (const filePath of fs.getDirectoryTree("/", { recursive: true })) {
  console.log(filePath);
}
```

### Advanced Operations

```typescript
// Copy file with overwrite
await fs.copy("/src/index.js", "/src/main.js", { overwrite: true });

// Rename file
await fs.rename("/src/main.js", "/src/app.js");

// Search file contents with context
const searchResults = await fs.grep("console", {
  includeContent: { linesBefore: 1, linesAfter: 1 }
});

// Get file statistics
const stats = await fs.stat("/README.md");
console.log(`File size: ${stats.size} bytes`);

// Using glob (pattern is ignored; only ignoreFilter is applied)
const files = await fs.glob("**/*.js", {
  ignoreFilter: (path) => path.includes('test')
});
console.log(files); // Returns all non-test files

// Directory traversal with ignore filter
const nonTestFiles: string[] = [];
for await (const filePath of fs.getDirectoryTree("/", {
  recursive: true,
  ig: (path) => path.includes('.test.')
})) {
  nonTestFiles.push(filePath);
}
```

### Error Handling

```typescript
import { BrowserFileSystemProvider } from "@tokenring-ai/browser-file-system";

const fs = new BrowserFileSystemProvider();

// Handle copy errors
try {
  await fs.copy("/source.txt", "/dest.txt"); // Throws if dest exists
} catch (error) {
  console.error("Copy failed:", error.message);
  // Use overwrite option to force copy
  await fs.copy("/source.txt", "/dest.txt", { overwrite: true });
}

// Handle non-existent files
const content = await fs.readFile("/non-existent.txt");
if (content === null) {
  console.log("File does not exist");
}

// Note: copy and rename return true for non-existent source files (mock behavior)
const copyResult = await fs.copy("/non-existent.txt", "/dest.txt");
console.log(copyResult); // true (mock behavior)
```

## Provider API

### BrowserFileSystemProvider Methods

The provider implements the `FileSystemProvider` interface from `@tokenring-ai/filesystem`:

#### getDirectoryTree

Returns an async generator that yields file paths in a directory tree.

```typescript
async *getDirectoryTree(
  path: string = "/",
  params?: {
    ig?: (path: string) => boolean;
    recursive?: boolean;
  }
): AsyncGenerator<string, void, unknown>
```

- **path**: Directory path to list (default: "/")
- **params.recursive**: Whether to include subdirectories (default: true)
- **params.ig**: Optional ignore filter function
- **Returns**: Async generator yielding file paths

#### createDirectory

Creates a directory (no-op in mock implementation).

```typescript
async createDirectory(
  path: string,
  options?: { recursive?: boolean }
): Promise<boolean>
```

- **Returns**: Always returns `true`

#### readFile

Reads file content from the file system.

```typescript
async readFile(filePath: string): Promise<Buffer | null>
```

- **Returns**: File content as Buffer or `null` if file doesn't exist

#### writeFile

Writes content to a file.

```typescript
async writeFile(
  filePath: string,
  content: string | Buffer
): Promise<boolean>
```

- **Returns**: Always returns `true`

#### appendFile

Appends content to an existing file or creates the file if it doesn't exist.

```typescript
async appendFile(
  filePath: string,
  content: string | Buffer
): Promise<boolean>
```

- **Returns**: Always returns `true`

#### deleteFile

Deletes a file from the file system.

```typescript
async deleteFile(filePath: string): Promise<boolean>
```

- **Returns**: Always returns `true` (even for non-existent files)

#### exists

Checks if a file exists in the file system.

```typescript
async exists(filePath: string): Promise<boolean>
```

- **Returns**: `true` if file exists, `false` otherwise

#### copy

Copies a file from source to destination.

```typescript
async copy(
  source: string,
  destination: string,
  options?: { overwrite?: boolean }
): Promise<boolean>
```

- **options.overwrite**: Whether to overwrite destination if it exists (default: false)
- **Returns**: `true`
- **Throws**: Error if destination exists and overwrite is false
- **Note**: Returns `true` for non-existent source files (mock behavior)

#### rename

Renames or moves a file.

```typescript
async rename(
  oldPath: string,
  newPath: string
): Promise<boolean>
```

- **Returns**: `true`
- **Throws**: Error if destination exists
- **Note**: Returns `true` for non-existent source files (mock behavior)

#### stat

Gets file statistics.

```typescript
async stat(filePath: string): Promise<StatLike>
```

- **Returns**: File statistics object with properties:
  - `exists`: boolean
  - `path`: string
  - `absolutePath`: string (if exists)
  - `isFile`: boolean (if exists)
  - `isDirectory`: boolean (if exists)
  - `isSymbolicLink`: boolean (always false)
  - `size`: number (if exists)
  - `created`, `modified`, `accessed`: Date (if exists)

#### glob

Matches files using a glob pattern.

```typescript
async glob(
  pattern: string,
  options?: {
    ignoreFilter?: (path: string) => boolean;
  }
): Promise<string[]>
```

- **pattern**: Glob pattern (currently ignored, only ignoreFilter is applied)
- **options.ignoreFilter**: Optional filter function
- **Returns**: Array of matching file paths

#### watch

Watches for file changes (not implemented).

```typescript
async watch(
  dir: string,
  options?: any
): Promise<any>
```

- **Returns**: `null`
- **Note**: Logs a warning as this functionality is not implemented

#### grep

Searches file contents for matching strings.

```typescript
async grep(
  searchString: string | string[],
  options?: {
    ignoreFilter?: (path: string) => boolean;
    includeContent?: {
      linesBefore?: number;
      linesAfter?: number;
    };
  }
): Promise<GrepResult[]>
```

- **searchString**: Search string(s)
- **options.ignoreFilter**: Optional filter function
- **options.includeContent.linesBefore**: Number of lines before match (default: 0)
- **options.includeContent.linesAfter**: Number of lines after match (default: 0)
- **Returns**: Array of search results with properties:
  - `file`: string
  - `line`: number
  - `match`: string
  - `matchedString`: string
  - `content`: string | null

## Plugin Configuration

### Configuration Schema

The plugin configuration uses the `FileSystemConfigSchema` from `@tokenring-ai/filesystem`:

```typescript
import { FileSystemConfigSchema } from "@tokenring-ai/filesystem/schema";
import { z } from "zod";

const packageConfigSchema = z.object({
  filesystem: FileSystemConfigSchema
});

// Example configuration
const config = {
  filesystem: {
    providers: {
      browser: {
        type: "browser"
      }
    }
  }
};
```

### Plugin Registration

The plugin automatically registers the `BrowserFileSystemProvider` as a file system provider with the FileSystemService when configured with `type: "browser"`:

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import browserFileSystem from "@tokenring-ai/browser-file-system";

const app = new TokenRingApp();

// Register the browser file system plugin
app.registerPlugin(browserFileSystem, {
  filesystem: {
    providers: {
      browser: {
        type: "browser"
      }
    }
  }
});

// Access the file system service
app.services.waitForItemByType(
  FileSystemService,
  async (fileSystemService) => {
    const fs = fileSystemService.getFileSystem("browser");
    const content = await fs.readFile("/README.md");
    console.log(content?.toString("utf-8"));
  }
);
```

## Services

### FileSystemService Integration

This package integrates with the `FileSystemService` from `@tokenring-ai/filesystem`. The provider is automatically registered when the plugin is loaded with the appropriate configuration.

## State Management

The BrowserFileSystemProvider maintains state entirely in memory using a JavaScript object:

```typescript
// Internal state structure
const mockFileSystem: Record<string, { content: string }> = {
  "/README.md": { content: "# Mock File System..." },
  "/src/index.js": { content: 'console.log("Hello");' },
  // ... more files
};
```

**Important Notes:**

- State is **not persisted** across page reloads
- All operations are **in-memory only**
- State is lost when the provider instance is destroyed
- No background processes or file watchers
- Changes made programmatically are immediately reflected in the mock file system

## Limitations

- **In-Memory Only**: No persistence across page reloads
- **Browser Environment**: Designed for browser environments only
- **Mock Data**: Limited to predefined mock files and directories (can be extended programmatically)
- **No File Watching**: `watch` functionality not implemented
- **Partial API**: Some advanced features log warnings for unsupported operations
- **No Symbolic Links**: `isSymbolicLink` always returns `false`
- **Fixed Timestamps**: `created`, `modified`, and `accessed` timestamps are simulated
- **Glob Pattern Ignored**: The glob pattern parameter is currently ignored; only the ignoreFilter is applied

## Error Handling

The provider implements comprehensive error handling:

- **File Not Found**: Returns `null` for missing files in `readFile`
- **Path Conflicts**: Validates copy and rename operations, throwing errors for conflicts
- **Invalid Operations**: Logs warnings for unsupported operations
- **Path Normalization**: Automatically normalizes paths for consistency

### Error Types

The provider may throw the following errors:

- `Error` - Path conflicts during copy/rename operations (when destination exists without overwrite option)
- `Error` - General errors for file operations

## Testing

```bash
# Run all tests
bun test

# Run tests with coverage
bun test:coverage

# Run tests in watch mode
bun test:watch

# Run specific test file
bun test BrowserFileSystemProvider.test.ts

# Run integration tests
bun test integration.test.ts
```

### Test Coverage

The package includes comprehensive unit and integration tests covering:

- **Basic File Operations**: Read, write, append, delete operations
- **Directory Operations**: Tree traversal with recursive and non-recursive modes
- **File Utilities**: Copy, rename, stat, exists operations
- **Advanced Operations**: Glob patterns, grep with context, ignore filters
- **Error Handling**: Conflict detection, path validation
- **Performance**: Large file handling and batch operations
- **Integration**: Plugin registration and service integration

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Core application framework and plugin system
- `@tokenring-ai/filesystem` (0.2.0) - File system service and provider interface
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `vitest` (^4.0.18) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## License

MIT License - see LICENSE file for details.

Copyright (c) 2025 Mark Dierolf
