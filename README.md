# @tokenring-ai/browser-file-system

A browser-based file system provider that implements the `FileSystemProvider` interface using in-memory mock data. This package provides a lightweight, browser-friendly file system abstraction for environments where direct access to the file system is not available, making it ideal for demos, tests, and web-based interfaces like web terminals.

## Overview

The `BrowserFileSystemProvider` implements the complete `FileSystemProvider` interface and provides a comprehensive set of file system operations that work entirely in memory. It ships with a built-in mock file system containing sample files, allowing for immediate exploration without external setup.

## Features

- In-memory file system operations for browser environments
- Full read/write capabilities with file existence checking
- Directory traversal with recursive and non-recursive options
- File copy and rename operations
- Content search with context line support
- File statistics (size, timestamps)
- TokenRing plugin integration for automatic service registration
- Comprehensive error handling with descriptive messages
- Support for ignore filters in directory traversal and search
- Path normalization for consistent path handling

## Installation

```bash
npm install @tokenring-ai/browser-file-system
```

## Package Structure

```
pkg/browser-file-system/
├── BrowserFileSystemProvider.ts  # Main provider implementation
├── BrowserFileSystemProvider.test.ts # Unit tests for provider
├── integration.test.ts           # Integration tests
├── index.ts                      # Module exports
├── plugin.ts                     # TokenRing plugin integration
├── package.json                  # Package configuration
├── vitest.config.ts              # Test configuration
├── LICENSE                       # License information
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

// Using glob (pattern parameter is ignored; only ignoreFilter is applied)
const files = await fs.glob("**/*.js", {
  ignoreFilter: (path) => path.includes('test')
});
console(files); // Returns all non-test files
```

### Plugin Configuration

The plugin integrates with the TokenRing configuration system and FileSystemService:

```typescript
// Example configuration in your TokenRing app
const filesystemConfig = {
  filesystem: {
    providers: {
      browser: {
        type: "browser"
      }
    }
  }
};
```

The plugin registers the `BrowserFileSystemProvider` as a file system provider with the FileSystemService when configured with `type: "browser"`.

## Services

### FileSystemService Integration

This package integrates with the `FileSystemService` from `@tokenring-ai/filesystem`. The provider is automatically registered when the plugin is loaded with the appropriate configuration.

### Provider Methods

All methods return `Promise<boolean>` or specific return types defined in the FileSystemProvider interface:

- **getDirectoryTree** - Async generator for directory traversal
- **createDirectory** - Creates a directory (no-op in mock)
- **readFile** - Reads file content
- **writeFile** - Writes file content
- **appendFile** - Appends content to file
- **deleteFile** - Deletes a file
- **exists** - Checks if file exists
- **copy** - Copies file with overwrite option
- **rename** - Renames/moves a file
- **stat** - Gets file statistics
- **glob** - Matches files with ignore filter
- **watch** - Watches for file changes (not implemented)
- **grep** - Searches file contents with context

## Configuration

### Plugin Configuration Schema

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

### Provider Configuration

The provider configuration is handled through the FileSystemService's provider configuration. When registering, the provider type must be set to `"browser"`:

```typescript
fileSystemService.registerFileSystemProvider(
  "browser",
  new BrowserFileSystemProvider()
);
```

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

## Testing

```bash
# Run tests
bun test

# Run tests with coverage
bun test:coverage

# Run tests in watch mode
bun test:watch

# Run tests with specific test file
bun test BrowserFileSystemProvider.test.ts
```

## Dependencies

This package depends on:

- `@tokenring-ai/app` - Core application framework and plugin system
- `@tokenring-ai/filesystem` - File system service and provider interface

## License

MIT License - see [LICENSE](./LICENSE) file for details.
