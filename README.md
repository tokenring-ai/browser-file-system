# @tokenring-ai/browser-file-system

A browser-based file system provider that implements the `FileSystemProvider` interface using in-memory mock data. This package provides a lightweight, browser-friendly file system abstraction for environments where direct access to the file system is not available, making it ideal for demos, tests, and UIs like web terminals.

## Overview

The `BrowserFileSystemProvider` extends the base `FileSystemProvider` interface and provides a comprehensive set of file system operations that work entirely in memory. It ships with a built-in mock file system containing sample files, allowing for immediate exploration without external setup.

## Installation

```bash
npm install @tokenring-ai/browser-file-system
```

## Package Structure

```
pkg/browser-file-system/
├── BrowserFileSystemProvider.ts  # Main provider implementation
├── index.ts                      # Module exports
├── plugin.ts                     # TokenRing plugin integration
├── package.json                  # Package configuration
├── vitest.config.ts             # Test configuration
└── README.md                    # This file
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
    content: "const Button = () => <button>Click Me</button>;\nexport default Button;",
  },
  "/package.json": {
    content: '{ "name": "mock-project", "version": "1.0.0" }',
  },
};
```

## Implemented Methods

### File Operations

- **`readFile(filePath: string): Promise<string>`**
  - Reads file content from the in-memory file system
  - Returns the file content as a string
  - Throws error if file doesn't exist

- **`writeFile(filePath: string, content: string | Buffer): Promise<boolean>`**
  - Writes content to the in-memory file system
  - Creates or updates files in the mock file system
  - Always succeeds (returns true)

- **`appendFile(filePath: string, content: string | Buffer): Promise<boolean>`**
  - Appends content to existing files
  - Creates file if it doesn't exist
  - Returns true on success

- **`deleteFile(filePath: string): Promise<never>`**
  - Not implemented (read-only aspects for now)
  - Logs warning and rejects with error

### Directory Operations

- **`getDirectoryTree(path?: string, params?): AsyncGenerator<string, void, unknown>`**
  - Yields file paths from the directory tree
  - Supports recursive and non-recursive traversal
  - Respects ignore filter functions
  - Normalizes paths for consistent handling

- **`createDirectory(path: string, options?): Promise<boolean>`**
  - No-op implementation (always returns true)
  - Directory creation not applicable to in-memory system

### File System Utilities

- **`exists(filePath: string): Promise<boolean>`**
  - Checks if a file exists in the mock file system
  - Returns true if file exists, false otherwise

- **`copy(source: string, destination: string, options?): Promise<boolean>`**
  - Copies files within the in-memory file system
  - Supports overwrite option
  - Throws error if destination exists and overwrite not specified

- **`rename(oldPath: string, newPath: string): Promise<boolean>`**
  - Moves/renames files within the in-memory file system
  - Throws error if new path already exists

- **`stat(filePath: string): Promise<StatLike>`**
  - Returns file statistics including size and timestamps
  - Provides file metadata in standardized format

### Advanced Operations

- **`glob(pattern: string, options?): Promise<string[]>`**
  - Returns files matching glob patterns
  - Supports ignore filters
  - Matches against all files in mock file system

- **`grep(searchString: string, options?): Promise<GrepResult[]>`**
  - Searches file contents for text patterns
  - Supports context lines (before/after)
  - Returns detailed match information

- **`watch(dir: string, options?): Promise<any>`**
  - Not implemented
  - Logs warning and returns null

- **`executeCommand(command: string | string[], options?): Promise<ExecuteCommandResult>`**
  - Not implemented
  - Returns error indicating command execution not supported

## Usage Examples

### Basic File System Operations

```typescript
import { BrowserFileSystemProvider } from "@tokenring-ai/browser-file-system";

const fs = new BrowserFileSystemProvider();

// Read a file
const readmeContent = await fs.readFile("/README.md");
console.log(readmeContent);

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

// Search file contents
const searchResults = await fs.grep("console", {
  includeContent: { linesBefore: 1, linesAfter: 1 }
});

// Get file statistics
const stats = await fs.stat("/README.md");
console.log(`File size: ${stats.size} bytes`);
```

## TokenRing Plugin Integration

The package includes a TokenRing plugin for automatic service registration:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import BrowserFileSystemPlugin from "@tokenring-ai/browser-file-system/plugin";

// In your TokenRing application setup
const app = new TokenRingApp();

// The plugin automatically registers with the FileSystemService
// when filesystem configuration includes browser providers
```

### Plugin Configuration

The plugin integrates with the TokenRing configuration system:

```typescript
// Example configuration in your app
const filesystemConfig = {
  providers: {
    browser: {
      type: "browser"
    }
  }
};
```

## Configuration

The plugin automatically integrates with TokenRing's configuration system through the `FileSystemConfigSchema`. The browser file system provider is registered when the configuration specifies a `browser` type provider.

## Dependencies

- **@tokenring-ai/app**: Application framework and plugin system
- **@tokenring-ai/filesystem**: Base file system provider interface

## Limitations

- **In-Memory Only**: No persistence across page reloads
- **Browser Environment**: Designed for browser environments only
- **Partial API**: Some advanced methods log warnings or throw errors
- **Mock Data**: Limited to predefined mock files and directories
- **No Command Execution**: `executeCommand` not supported in browser environment
- **No File Watching**: `watch` functionality not implemented

## Error Handling

The provider implements comprehensive error handling:

- **File Not Found**: Throws descriptive errors when files don't exist
- **Path Conflicts**: Validates copy and rename operations
- **Invalid Operations**: Logs warnings for unsupported operations
- **Path Normalization**: Automatically normalizes paths for consistency

## Development

### Testing

```bash
# Run tests
npm test

# Linting
npm run eslint
```

### Build

The package uses TypeScript and is built as part of the TokenRing monorepo workspace system.

## Version History

- **0.2.0**: Current version with complete provider interface implementation
- Complete TokenRing plugin integration
- Enhanced error handling and path normalization

## License

MIT

## Related Packages

- **@tokenring-ai/filesystem**: Base file system provider interface
- **@tokenring-ai/local-filesystem**: Local file system implementation
- **@tokenring-ai/app**: TokenRing application framework