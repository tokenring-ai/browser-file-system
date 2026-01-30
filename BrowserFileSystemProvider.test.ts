import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
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
        expect(content).not.toBeNull();
        expect(Buffer.isBuffer(content)).toBe(true);
        expect(content.toString()).toBe("# Mock File System\n\nThis is a sample README file.");
      });

      it("should read JavaScript file", async () => {
        const content = await provider.readFile("/src/index.js");
        expect(content).not.toBeNull();
        expect(Buffer.isBuffer(content)).toBe(true);
        expect(content.toString()).toBe('console.log("Hello from mock index.js");');
      });

      it("should read JSON file", async () => {
        const content = await provider.readFile("/package.json");
        expect(content).not.toBeNull();
        expect(Buffer.isBuffer(content)).toBe(true);
        expect(content.toString()).toBe('{ "name": "mock-project", "version": "1.0.0" }');
      });

      it("should return null for non-existent file", async () => {
        const content = await provider.readFile("/non-existent.txt");
        expect(content).toBeNull();
      });
    });

    describe("writeFile", () => {
      it("should write new file successfully", async () => {
        const result = await provider.writeFile("/test/new-file.txt", "Test content");
        expect(result).toBe(true);
        
        const content = await provider.readFile("/test/new-file.txt");
        expect(content).not.toBeNull();
        expect(Buffer.isBuffer(content)).toBe(true);
        expect(content.toString()).toBe("Test content");
      });

      it("should overwrite existing file", async () => {
        const originalContent = await provider.readFile("/README.md");
        const newContent = "# Updated content";
        
        await provider.writeFile("/README.md", newContent);
        const updatedContent = await provider.readFile("/README.md");

        expect(updatedContent).not.toBeNull();
        expect(Buffer.isBuffer(updatedContent)).toBe(true);
        expect(updatedContent.toString()).toBe(newContent);
        expect(updatedContent.toString()).not.toBe(originalContent.toString());
      });

      it("should handle Buffer content", async () => {
        const bufferContent = Buffer.from("Buffer content");
        const result = await provider.writeFile("/test/buffer.txt", bufferContent);
        
        expect(result).toBe(true);
        const content = await provider.readFile("/test/buffer.txt");
        expect(content).not.toBeNull();
        expect(Buffer.isBuffer(content)).toBe(true);
        expect(content.toString()).toBe("Buffer content");
      });
    });

    describe("appendFile", () => {
      it("should append to existing file", async () => {
        await provider.appendFile("/README.md", "\n## Added content");
        
        const content = await provider.readFile("/README.md");
        expect(content).not.toBeNull();
        expect(Buffer.isBuffer(content)).toBe(true);
        expect(content.toString()).toContain("## Added content");
      });

      it("should create file if it doesn't exist", async () => {
        await provider.appendFile("/new-file.txt", "New content");
        
        const content = await provider.readFile("/new-file.txt");
        expect(content).not.toBeNull();
        expect(Buffer.isBuffer(content)).toBe(true);
        expect(content.toString()).toBe("New content");
      });

      it("should handle Buffer content in append", async () => {
        await provider.appendFile("/test/buffer.txt", Buffer.from(" appended"));
        
        const content = await provider.readFile("/test/buffer.txt");
        expect(content).not.toBeNull();
        expect(Buffer.isBuffer(content)).toBe(true);
        expect(content.toString()).toContain("appended");
      });
    });

    describe("deleteFile", () => {
      it("should return true for successful deletion", async () => {
        // First create a file
        await provider.writeFile("/test.txt", "Test content");

        // Then delete it
        const result = await provider.deleteFile("/test.txt");
        expect(result).toBe(true);

        // Verify it's gone
        const exists = await provider.exists("/test.txt");
        expect(exists).toBe(false);
      });

      it("should return true for non-existent file", async () => {
        const result = await provider.deleteFile("/non-existent.txt");
        expect(result).toBe(true);
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

        expect(Buffer.isBuffer(originalContent)).toBe(true);
        expect(Buffer.isBuffer(copiedContent)).toBe(true);
        expect(copiedContent.toString()).toBe(originalContent.toString());
      });

      it("should return true when source doesn't exist", async () => {
        const result = await provider.copy("/non-existent.txt", "/destination.txt");
        expect(result).toBe(true);
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
        const result = await provider.copy("/src/sample.js", "/src/index.js", {overwrite: true});

        expect(result).toBe(true);
        const content = await provider.readFile("/src/index.js");
        expect(Buffer.isBuffer(content)).toBe(true);
        expect(content.toString()).toBe("Sample content");
      });
    });

    describe("rename", () => {
      it("should rename file successfully", async () => {
        await provider.writeFile("/temp-readme.md", "Test content");
        const result = await provider.rename("/temp-readme.md", "/renamed-readme.md");
        
        expect(result).toBe(true);
        
        // Old file should not exist
        const exists = await provider.exists("/temp-readme.md");
        expect(exists).toBe(false);
        
        // New file should exist
        const content = await provider.readFile("/renamed-readme.md");
        expect(content).not.toBeNull();
        expect(Buffer.isBuffer(content)).toBe(true);
        expect(content.toString()).toBe("Test content");
      });

      it("should return true when source doesn't exist", async () => {
        const result = await provider.rename("/non-existent.txt", "/destination.txt");
        expect(result).toBe(true);
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
        expect(stats.exists).toBe(true);
        expect(stats.isFile).toBe(true);
        expect(stats.isDirectory).toBe(false);
        expect(stats.isSymbolicLink).toBe(false);
        expect(stats.size).toBeGreaterThan(0);
        expect(stats.created).toBeInstanceOf(Date);
        expect(stats.modified).toBeInstanceOf(Date);
        expect(stats.accessed).toBeInstanceOf(Date);
      });

      it("should return exists: false for non-existent file", async () => {
        const stats = await provider.stat("/non-existent.txt");

        expect(stats.path).toBe("/non-existent.txt");
        expect(stats.exists).toBe(false);
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
      const parsed = JSON.parse(packageContent.toString());
      expect(parsed.name).toBe("mock-project");
      expect(parsed.version).toBe("1.0.0");
    });
  });
});
