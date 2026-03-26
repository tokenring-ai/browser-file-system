# @tokenring-ai/browser-file-system

**IMPORTANT**: This is a **mock implementation** designed for browser environments, testing, and demonstration purposes. All operations are performed in-memory with no persistence across page reloads.

A browser-based file system provider that implements the `FileSystemProvider` interface using in-memory mock data. This package provides a lightweight, browser-friendly file system abstraction for environments where direct access to the file system is not available, making it ideal for demos, tests, and web-based interfaces like web terminals.

## Overview

The `BrowserFileSystemProvider` implements the complete `FileSystemProvider` interface from `@tokenring-ai/filesystem` and provides a comprehensive set of file system operations that work entirely in memory. It ships with a built-in mock file system containing sample files, allowing for immediate exploration without external setup.

**Key Characteristics:**
- **In-Memory Only**: No persistence across page reloads or provider destruction
- **Mock Behavior**: Gracefully handles edge cases (non-existent files in copy/rename) for testing
- **Browser-Optimized**: Designed for browser environments where direct file system access is unavailable
- **Plugin-Ready**: Integrates seamlessly with TokenRing's plugin system for automatic service registration

## Features

- **In-Memory File System**: Complete file system operations that work entirely in memory, perfect for browser environments
- **Full CRUD Operations**: Read, write, append, and delete files with proper content handling (string and Buffer support)
- **Directory Traversal**: Async generator-based tree traversal with recursive and non-recursive modes
- **File Operations**: Copy and rename files with overwrite protection and conflict detection
- **Content Search**: Grep functionality with context line support (lines before/after matches)
- **File Statistics**: Detailed file metadata including size, timestamps, and type information
- **Path Management**: Automatic path normalization for consistent handling across operations
- **Ignore Filters**: Support for custom ignore filters in directory traversal, glob, and search operations
- **TokenRing Integration**: Plugin-based service registration with automatic FileServiceProvider integration
- **Comprehensive Error Handling**: Descriptive error messages for conflicts and invalid operations
- **Mock Behavior**: Graceful handling of non-existent files in copy/rename operations (returns true without error)
- **Test Coverage**: Extensive unit and integration tests with vitest

## Installation

```bash
bun install @tokenring-ai/browser-file-system
```

## Module Exports

The package uses ES modules (`"type": "module"`) and exports the following:

```typescript
// Main provider export
export { default as BrowserFileSystemProvider } from "./BrowserFileSystemProvider.ts";

// Package entry point
export { default } from "./plugin.ts"; // TokenRing plugin
```

**Note:** All exports use `.ts` extensions for direct TypeScript imports in the monorepo.

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

The provider implements the `FileSystemProvider` interface from `@tokenring-ai/filesystem`.

### BrowserFileSystemProvider Methods

#### getDirectoryTree

Returns an async generator that yields file paths in a directory tree.

```typescript
async *getDirectoryTree(
  path: string = "/",
  params: any = {}
): AsyncGenerator<string, void, unknown>
```

**Parameters:**
- `path`: Directory path to list (default: `"/"`)
- `params.recursive`: Whether to include subdirectories (default: `true`)
- `params.ig`: Optional ignore filter function `(path: string) => boolean`

**Returns:** Async generator yielding file paths

**Example:**
```typescript
for await (const filePath of fs.getDirectoryTree("/src", { recursive: true })) {
  console.log(filePath);
}
```

#### createDirectory

Creates a directory (no-op in mock implementation).

```typescript
async createDirectory(
  path: string,
  options?: { recursive?: boolean }
): Promise<boolean>
```

**Parameters:**
- `path`: Directory path to create
- `options.recursive`: Whether to create parent directories (default: `false`)

**Returns:** Always returns `true`

**Example:**
```typescript
await fs.createDirectory("/new/dir", { recursive: true });
```

#### readFile

Reads file content from the file system.

```typescript
async readFile(filePath: string): Promise<Buffer | null>
```

**Parameters:**
- `filePath`: Path to the file to read

**Returns:** File content as Buffer or `null` if file doesn't exist

**Example:**
```typescript
const content = await fs.readFile("/README.md");
if (content) {
  console.log(content.toString("utf-8"));
}
```

#### writeFile

Writes content to a file.

```typescript
async writeFile(
  filePath: string,
  content: string | Buffer
): Promise<boolean>
```

**Parameters:**
- `filePath`: Path to the file to write
- `content`: Content to write (string or Buffer)

**Returns:** Always returns `true`

**Example:**
```typescript
await fs.writeFile("/test.txt", "Hello, World!");
await fs.writeFile("/binary.bin", Buffer.from([0x00, 0x01, 0x02]));
```

#### appendFile

Appends content to an existing file or creates the file if it doesn't exist.

```typescript
async appendFile(
  filePath: string,
  content: string | Buffer
): Promise<boolean>
```

**Parameters:**
- `filePath`: Path to the file to append to
- `content`: Content to append (string or Buffer)

**Returns:** Always returns `true`

**Example:**
```typescript
await fs.appendFile("/log.txt", "New log entry\n");
```

#### deleteFile

Deletes a file from the file system.

```typescript
async deleteFile(filePath: string): Promise<boolean>
```

**Parameters:**
- `filePath`: Path to the file to delete

**Returns:** Always returns `true` (even for non-existent files)

**Example:**
```typescript
await fs.deleteFile("/temp.txt");
```

#### exists

Checks if a file exists in the file system.

```typescript
async exists(filePath: string): Promise<boolean>
```

**Parameters:**
- `filePath`: Path to check

**Returns:** `true` if file exists, `false` otherwise

**Example:**
```typescript
if (await fs.exists("/README.md")) {
  console.log("File exists!");
}
```

#### copy

Copies a file from source to destination.

```typescript
async copy(
  source: string,
  destination: string,
  options?: { overwrite?: boolean }
): Promise<boolean>
```

**Parameters:**
- `source`: Source file path
- `destination`: Destination file path
- `options.overwrite`: Whether to overwrite destination if it exists (default: `false`)

**Returns:** `true` - Always returns true

**Throws:** Error if destination exists and overwrite is `false`

**Mock Behavior:** Returns `true` even for non-existent source files without throwing an error. This is intentional mock behavior for testing purposes.

**Example:**
```typescript
// Copy without overwrite (throws if destination exists)
try {
  await fs.copy("/src/file.txt", "/dest/file.txt");
} catch (error) {
  console.error(error.message); // "Destination file already exists..."
}

// Copy with overwrite
await fs.copy("/src/file.txt", "/dest/file.txt", { overwrite: true });

// Copy non-existent source (mock behavior - returns true)
const result = await fs.copy("/non-existent.txt", "/dest.txt");
console.log(result); // true (no error thrown)
```

#### rename

Renames or moves a file.

```typescript
async rename(
  oldPath: string,
  newPath: string
): Promise<boolean>
```

**Parameters:**
- `oldPath`: Current file path
- `newPath`: New file path

**Returns:** `true` - Always returns true

**Throws:** Error if destination file already exists

**Mock Behavior:** Returns `true` even for non-existent source files without throwing an error. This is intentional mock behavior for testing purposes.

**Example:**
```typescript
// Rename existing file
await fs.rename("/old-name.txt", "/new-name.txt");

// Rename with existing destination (throws error)
try {
  await fs.rename("/source.txt", "/existing.txt");
} catch (error) {
  console.error(error.message); // "Destination file already exists..."
}

// Rename non-existent source (mock behavior - returns true)
const result = await fs.rename("/non-existent.txt", "/new.txt");
console.log(result); // true (no error thrown)
```

#### stat

Gets file statistics.

```typescript
async stat(filePath: string): Promise<StatLike>
```

**Parameters:**
- `filePath`: Path to the file

**Returns:** File statistics object with properties:
- `exists`: boolean
- `path`: string
- `absolutePath`: string (if exists)
- `isFile`: boolean (if exists)
- `isDirectory`: boolean (if exists)
- `isSymbolicLink`: boolean (always false)
- `size`: number (if exists)
- `created`, `modified`, `accessed`: Date (if exists)

**Example:**
```typescript
const stats = await fs.stat("/README.md");
if (stats.exists) {
  console.log(`Size: ${stats.size} bytes`);
  console.log(`Modified: ${stats.modified}`);
}
```

#### glob

Matches files using a glob pattern. **Note**: The pattern parameter is currently ignored; only the ignoreFilter is applied.

```typescript
async glob(
  pattern: string,
  options?: {
    ignoreFilter?: (path: string) => boolean;
  }
): Promise<string[]>
```

**Parameters:**
- `pattern`: Glob pattern (currently ignored in mock implementation; returns all files)
- `options.ignoreFilter`: Optional filter function to exclude files

**Returns:** Array of all file paths in the mock file system, filtered by ignoreFilter if provided

**Example:**
```typescript
// Get all files (pattern is ignored, returns all mock files)
const allFiles = await fs.glob("*");
// Returns: ["/README.md", "/src/index.js", "/src/components/Button.jsx", "/package.json"]

// Filter out test files
const sourceFiles = await fs.glob("*", {
  ignoreFilter: (path) => path.includes(".test.")
});
// Returns files that don't match the ignore filter
```

#### watch

Watches for file changes (not implemented).

```typescript
async watch(
  dir: string,
  options?: any
): Promise<any>
```

**Parameters:**
- `dir`: Directory to watch
- `options`: Watch options

**Returns:** `null`

**Note:** Logs a warning as this functionality is not implemented

**Example:**
```typescript
const watcher = await fs.watch("/src"); // Returns null, logs warning
```

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

**Parameters:**
- `searchString`: Search string(s) - uses first element if array
- `options.ignoreFilter`: Optional filter function
- `options.includeContent.linesBefore`: Number of lines before match (default: `0`)
- `options.includeContent.linesAfter`: Number of lines after match (default: `0`)

**Returns:** Array of search results with properties:
- `file`: string - File path
- `line`: number - Line number (1-indexed)
- `match`: string - The matching line
- `matchedString`: string - The search string that matched
- `content`: string | null - Context content if requested

**Example:**
```typescript
// Basic search
const results = await fs.grep("console");
for (const result of results) {
  console.log(`${result.file}:${result.line}: ${result.match}`);
}

// Search with context
const withContext = await fs.grep("console", {
  includeContent: { linesBefore: 1, linesAfter: 1 }
});
for (const result of withContext) {
  console.log(`\n--- ${result.file}:${result.line} ---`);
  console.log(result.content);
}

// Search with ignore filter
const filtered = await fs.grep("import", {
  ignoreFilter: (path) => path.includes("node_modules")
});
```

## Plugin Configuration

### Configuration Schema

The plugin uses `FileSystemConfigSchema` from `@tokenring-ai/filesystem` for configuration validation:

```typescript
import { FileSystemConfigSchema } from "@tokenring-ai/filesystem/schema";
import { z } from "zod";

const packageConfigSchema = z.object({
  filesystem: FileSystemConfigSchema
});
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

The plugin registers the browser file system provider with the name specified in the configuration:

```typescript
// Plugin registration logic
if (provider.type === "browser") {
  fileSystemService.registerFileSystemProvider(
    name, // e.g., "browser"
    new BrowserFileSystemProvider()
  );
}
```

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
- **Mock Behavior for Copy/Rename**: Returns `true` for non-existent source files

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

### Error Examples

```typescript
// Copy error - destination exists
try {
  await fs.copy("/source.txt", "/existing.txt");
} catch (error) {
  console.error(error.message);
  // "Destination file already exists: /existing.txt. Use overwrite option to replace."
}

// Rename error - destination exists
try {
  await fs.rename("/source.txt", "/existing.txt");
} catch (error) {
  console.error(error.message);
  // "Destination file already exists: /existing.txt"
}
```

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

### Test Files

- `BrowserFileSystemProvider.test.ts` - Unit tests for provider methods
- `integration.test.ts` - End-to-end integration tests

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Core application framework and plugin system
- `@tokenring-ai/filesystem` (0.2.0) - File system service and provider interface
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `vitest` (^4.1.1) - Testing framework
- `typescript` (^6.0.2) - TypeScript compiler

## License

MIT License - see LICENSE file for details.

Copyright (c) 2025 Mark Dierolf
