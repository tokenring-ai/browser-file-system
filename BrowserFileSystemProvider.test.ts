import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import BrowserFileSystemProvider from "./BrowserFileSystemProvider";

// Mock the console methods to suppress warnings during tests
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeEach(() => {
  console.warn = vi.fn();
  console.log = vi.fn();
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

describe("BrowserFileSystemProvider", () => {
  let provider: BrowserFileSystemProvider;

  beforeEach(() => {
    provider = new BrowserFileSystemProvider();
  });

  describe("Constructor and Initialization", () => {
    it("should initialize with mock file system", () => {
      expect(provider).toBeDefined();
    });
  });

  describe("File Operations", () => {
    describe("readFile", () => {
      it("should read existing files from mock file system", async () => {
        const content = await provider.readFile("/README.md");
        expect(content).toBe("# Mock File System\n\nThis is a sample README file.");
      });

      it("should read JavaScript file", async () => {
        const content = await provider.readFile("/src/index.js");
        expect(content).toBe('console.log("Hello from mock index.js");');
      });

      it("should read JSON file", async () => {
        const content = await provider.readFile("/package.json");
        expect(content).toBe('{ "name": "mock-project", "version": "1.0.0" }');
      });

      it("should throw error for non-existent file", async () => {
        await expect(provider.readFile("/non-existent.txt")).rejects.toThrow(
          "File not found: /non-existent.txt"
        );
      });
    });

    describe("writeFile", () => {
      it("should write new file successfully", async () => {
        const result = await provider.writeFile("/test/new-file.txt", "Test content");
        expect(result).toBe(true);
        
        const content = await provider.readFile("/test/new-file.txt");
        expect(content).toBe("Test content");
      });

      it("should overwrite existing file", async () => {
        const originalContent = await provider.readFile("/README.md");
        const newContent = "# Updated content";
        
        await provider.writeFile("/README.md", newContent);
        const updatedContent = await provider.readFile("/README.md");
        
        expect(updatedContent).toBe(newContent);
        expect(updatedContent).not.toBe(originalContent);
      });

      it("should handle Buffer content", async () => {
        const bufferContent = Buffer.from("Buffer content");
        const result = await provider.writeFile("/test/buffer.txt", bufferContent);
        
        expect(result).toBe(true);
        const content = await provider.readFile("/test/buffer.txt");
        expect(content).toBe("Buffer content");
      });
    });

    describe("appendFile", () => {
      it("should append to existing file", async () => {
        await provider.appendFile("/README.md", "\n## Added content");
        
        const content = await provider.readFile("/README.md");
        expect(content).toContain("## Added content");
      });

      it("should create file if it doesn't exist", async () => {
        await provider.appendFile("/new-file.txt", "New content");
        
        const content = await provider.readFile("/new-file.txt");
        expect(content).toBe("New content");
      });

      it("should handle Buffer content in append", async () => {
        await provider.appendFile("/test/buffer.txt", Buffer.from(" appended"));
        
        const content = await provider.readFile("/test/buffer.txt");
        expect(content).toContain("appended");
      });
    });

    describe("deleteFile", () => {
      it("should reject with error", async () => {
        await expect(provider.deleteFile("/test.txt")).rejects.toThrow(
          "deleteFile not implemented in mock."
        );
      });
    });
  });

  describe("Directory Operations", () => {
    describe("getDirectoryTree", () => {
      it("should return all files when given root path", async () => {
        const files: string[] = [];
        for await (const filePath of provider.getDirectoryTree("/")) {
          files.push(filePath);
        }
        
        expect(files).toContain("/README.md");
        expect(files).toContain("/src/index.js");
        expect(files).toContain("/src/components/Button.jsx");
        expect(files).toContain("/package.json");
      });

      it("should support non-recursive traversal", async () => {
        const files: string[] = [];
        for await (const filePath of provider.getDirectoryTree("/", { recursive: false })) {
          files.push(filePath);
        }
        
        // Should only return direct children of root
        expect(files).toContain("/README.md");
        expect(files).toContain("/src/index.js");
        expect(files).toContain("/src/components/Button.jsx");
        expect(files).toContain("/package.json");
      });

      it("should support ignore filter", async () => {
        const files: string[] = [];
        const ignoreFilter = (path: string) => path.includes(".jsx");
        
        for await (const filePath of provider.getDirectoryTree("/", { 
          ig: ignoreFilter,
          recursive: true 
        })) {
          files.push(filePath);
        }
        
        expect(files).not.toContain("/src/components/Button.jsx");
        expect(files).toContain("/src/index.js");
      });

      it("should handle different path formats", async () => {
        // Test with trailing slash
        let files: string[] = [];
        for await (const filePath of provider.getDirectoryTree("/src/")) {
          files.push(filePath);
        }
        
        expect(files).toContain("/src/index.js");
        expect(files).toContain("/src/components/Button.jsx");
      });
    });

    describe("createDirectory", () => {
      it("should always return true (noop implementation)", async () => {
        const result = await provider.createDirectory("/new/dir");
        expect(result).toBe(true);
      });

      it("should handle recursive option", async () => {
        const result = await provider.createDirectory("/deeply/nested/dir", { recursive: true });
        expect(result).toBe(true);
      });
    });
  });

  describe("File System Utilities", () => {
    describe("exists", () => {
      it("should return true for existing files", async () => {
        const exists = await provider.exists("/README.md");
        expect(exists).toBe(true);
      });

      it("should return false for non-existent files", async () => {
        const exists = await provider.exists("/non-existent.txt");
        expect(exists).toBe(false);
      });
    });

    describe("copy", () => {
      it("should copy file successfully", async () => {
        const result = await provider.copy("/README.md", "/copy-of-readme.md");
        expect(result).toBe(true);
        
        const originalContent = await provider.readFile("/README.md");
        const copiedContent = await provider.readFile("/copy-of-readme.md");
        expect(copiedContent).toBe(originalContent);
      });

      it("should throw error when source doesn't exist", async () => {
        await expect(
          provider.copy("/non-existent.txt", "/destination.txt")
        ).rejects.toThrow("Source file not found: /non-existent.txt");
      });

      it("should throw error when destination exists without overwrite option", async () => {
        await expect(
          provider.copy("/README.md", "/src/index.js")
        ).rejects.toThrow(
          "Destination file already exists: /src/index.js. Use overwrite option to replace."
        );
      });

      it("should overwrite existing file with overwrite option", async () => {
        await provider.writeFile("/src/sample.js", "Sample content");
        await provider.copy("/src/sample.js", "/src/index.js", { overwrite: true });
        
        const content = await provider.readFile("/src/index.js");
        expect(content).toBe("Sample content");
      });
    });

    describe("rename", () => {
      it("should rename file successfully", async () => {
        await provider.writeFile("/temp-readme.md", "Test content");
        const result = await provider.rename("/temp-readme.md", "/renamed-readme.md");
        
        expect(result).toBe(true);
        
        // Old file should not exist
        await expect(provider.readFile("/temp-readme.md")).rejects.toThrow();
        
        // New file should exist
        const content = await provider.readFile("/renamed-readme.md");
        expect(content).toBe("Test content");
      });

      it("should throw error when source doesn't exist", async () => {
        await expect(
          provider.rename("/non-existent.txt", "/destination.txt")
        ).rejects.toThrow("Source file not found: /non-existent.txt");
      });

      it("should throw error when destination exists", async () => {
        await expect(
          provider.rename("/README.md", "/src/index.js")
        ).rejects.toThrow("Destination file already exists: /src/index.js");
      });
    });

    describe("stat", () => {
      it("should return file statistics", async () => {
        const stats = await provider.stat("/README.md");
        
        expect(stats.path).toBe("/README.md");
        expect(stats.absolutePath).toBe("/README.md");
        expect(stats.isFile).toBe(true);
        expect(stats.isDirectory).toBe(false);
        expect(stats.isSymbolicLink).toBe(false);
        expect(stats.size).toBeGreaterThan(0);
        expect(stats.created).toBeInstanceOf(Date);
        expect(stats.modified).toBeInstanceOf(Date);
        expect(stats.accessed).toBeInstanceOf(Date);
      });

      it("should throw error for non-existent file", async () => {
        await expect(provider.stat("/non-existent.txt")).rejects.toThrow(
          "Path /non-existent.txt does not exist"
        );
      });
    });
  });

  describe("Advanced Operations", () => {
    describe("glob", () => {
      it("should return all files when no options", async () => {
        const files = await provider.glob("*");
        expect(files).toContain("/README.md");
        expect(files).toContain("/src/index.js");
        expect(files).toContain("/src/components/Button.jsx");
        expect(files).toContain("/package.json");
      });

      it("should support ignore filter", async () => {
        const files = await provider.glob("*", {
          ignoreFilter: (file) => file.includes(".jsx")
        });
        
        expect(files).not.toContain("/src/components/Button.jsx");
        expect(files).toContain("/src/index.js");
      });
    });

    describe("watch", () => {
      it("should return null and log warning", async () => {
        const result = await provider.watch("/test");
        expect(result).toBeNull();
      });
    });

    describe("executeCommand", () => {
      it("should return error result for unsupported command execution", async () => {
        const result = await provider.executeCommand("ls");
        
        expect(result.ok).toBe(false);
        expect(result.stdout).toBe("");
        expect(result.stderr).toBe("Command execution not supported in browser");
        expect(result.exitCode).toBe(1);
        expect(result.error).toBe("Not implemented");
      });

      it("should handle array command", async () => {
        const result = await provider.executeCommand(["ls", "-la"]);
        expect(result.ok).toBe(false);
        expect(result.error).toBe("Not implemented");
      });
    });

    describe("grep", () => {
      it("should find text in files", async () => {
        await provider.writeFile("/src/index.js", "\nconsole.log('Hello from grep');");
        const results = await provider.grep("console");
        
        expect(results.length).toBeGreaterThan(0);
        const consoleResult = results.find(r => r.file.includes("index.js"));
        expect(consoleResult).toBeDefined();
        expect(consoleResult?.matchedString).toBe("console");
      });

      it("should support array search string", async () => {
        const results = await provider.grep(["console"]);
        expect(results.length).toBeGreaterThan(0);
      });

      it("should support ignore filter", async () => {
        const results = await provider.grep("console", {
          ignoreFilter: (file) => file.includes(".jsx")
        });
        
        const jsxResults = results.filter(r => r.file.includes(".jsx"));
        expect(jsxResults.length).toBe(0);
      });

      it("should support context lines", async () => {
        const results = await provider.grep("console", {
          includeContent: { linesBefore: 1, linesAfter: 1 }
        });
        
        expect(results[0]).toHaveProperty("content");
        expect(results[0].content).toContain("console");
      });

      it("should return empty array when no matches found", async () => {
        const results = await provider.grep("non-existent-text");
        expect(results).toEqual([]);
      });
    });
  });

  describe("Mock File System Data", () => {
    it("should contain expected mock files", async () => {
      const mockFiles = [
        "/README.md",
        "/src/index.js",
        "/src/components/Button.jsx",
        "/package.json"
      ];
      
      for (const file of mockFiles) {
        const exists = await provider.exists(file);
        expect(exists).toBe(true);
      }
    });

    it("should have correct content in mock files", async () => {
      const packageContent = await provider.readFile("/package.json");
      const parsed = JSON.parse(packageContent);
      expect(parsed.name).toBe("mock-project");
      expect(parsed.version).toBe("1.0.0");
    });
  });
});