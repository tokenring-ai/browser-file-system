import {beforeEach, describe, expect, it} from "vitest";
import BrowserFileSystemProvider from "./BrowserFileSystemProvider";
import plugin from "./plugin";

describe("Integration Tests", () => {
  let provider: BrowserFileSystemProvider;

  beforeEach(() => {
    provider = new BrowserFileSystemProvider();
  });

  describe("End-to-End File Operations", () => {
    it("should handle complete file lifecycle", async () => {
      // Create a new file
      await provider.writeFile("/test/lifecycle.txt", "Initial content");
      expect(await provider.exists("/test/lifecycle.txt")).toBe(true);
      
      // Read the file
      let content = await provider.readFile("/test/lifecycle.txt");
      expect(content).toBe("Initial content");
      
      // Modify the file
      await provider.appendFile("/test/lifecycle.txt", " - appended");
      content = await provider.readFile("/test/lifecycle.txt");
      expect(content).toBe("Initial content - appended");
      
      // Overwrite the file
      await provider.writeFile("/test/lifecycle.txt", "Completely new content");
      content = await provider.readFile("/test/lifecycle.txt");
      expect(content).toBe("Completely new content");
      
      // Rename the file
      await provider.rename("/test/lifecycle.txt", "/test/renamed.txt");
      expect(await provider.exists("/test/lifecycle.txt")).toBe(false);
      expect(await provider.exists("/test/renamed.txt")).toBe(true);
      
      // Copy the file
      await provider.copy("/test/renamed.txt", "/test/copied.txt");
      expect(await provider.exists("/test/copied.txt")).toBe(true);
      
      // Verify copied file has same content
      const originalContent = await provider.readFile("/test/renamed.txt");
      const copiedContent = await provider.readFile("/test/copied.txt");
      expect(copiedContent).toBe(originalContent);
    });

    it("should handle complex directory tree operations", async () => {
      const files = [
        "/project/src/main.ts",
        "/project/src/utils/helpers.ts",
        "/project/src/utils/validators.ts",
        "/project/tests/main.test.ts",
        "/project/package.json",
        "/project/README.md"
      ];
      
      // Create all files
      for (const file of files) {
        await provider.writeFile(file, `Content for ${file}`);
      }
      
      // Verify they exist
      for (const file of files) {
        expect(await provider.exists(file)).toBe(true);
      }
      
      // Test directory tree with different configurations
      let allFiles: string[] = [];
      for await (const file of provider.getDirectoryTree("/", { recursive: true })) {
        allFiles.push(file);
      }
      
      // Verify project files are included
      const projectFiles = allFiles.filter(f => f.startsWith("/project/"));
      expect(projectFiles.length).toBeGreaterThanOrEqual(6);
      
      // Test non-recursive traversal
      const rootFiles: string[] = [];
      for await (const file of provider.getDirectoryTree("/", { recursive: false })) {
        rootFiles.push(file);
      }
      
      // Should contain project directory
      expect(rootFiles).toContain("/project/package.json");
      expect(rootFiles).toContain("/project/README.md");
    });

    it("should handle search operations across multiple files", async () => {
      // Create test files with searchable content
      const testFiles = {
        "/search/test1.txt": "This file contains search term",
        "/search/test2.txt": "Another file with search term",
        "/search/test3.txt": "No search terms here",
        "/search/sub/test4.txt": "Subdirectory file with search term"
      };
      
      for (const [path, content] of Object.entries(testFiles)) {
        await provider.writeFile(path, content);
      }
      
      // Test basic grep
      const results = await provider.grep("search term");
      expect(results.length).toBeGreaterThanOrEqual(3);
      
      // Test with context
      const resultsWithContext = await provider.grep("search term", {
        includeContent: { linesBefore: 1, linesAfter: 1 }
      });
      
      expect(resultsWithContext.length).toBeGreaterThanOrEqual(3);
      expect(resultsWithContext[0]).toHaveProperty("content");
      
      // Test ignore filter
      const resultsFiltered = await provider.grep("search term", {
        ignoreFilter: (file) => file.includes("sub/")
      });
      
      expect(resultsFiltered.length).toBeGreaterThanOrEqual(2);
      expect(resultsFiltered.every(r => !r.file.includes("sub/"))).toBe(true);
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle complex error scenarios", async () => {
      // Test copy error scenarios
      await expect(provider.copy("/non-existent.txt", "/dest.txt")).rejects.toThrow();
      
      // Create a file first
      await provider.writeFile("/source.txt", "source content");
      await provider.writeFile("/dest.txt", "dest content");
      
      // Should fail without overwrite option
      await expect(provider.copy("/source.txt", "/dest.txt")).rejects.toThrow();
      
      // Should succeed with overwrite
      await expect(provider.copy("/source.txt", "/dest.txt", { overwrite: true })).resolves.toBe(true);
      
      // Test rename error scenarios
      await expect(provider.rename("/non-existent.txt", "/new-name.txt")).rejects.toThrow();
      
      // Create destination file to cause rename error
      await provider.writeFile("/dest.txt", "dest content");
      await expect(provider.rename("/source.txt", "/dest.txt")).rejects.toThrow();
    });

    it("should handle stat operations on various file types", async () => {
      // Test stat on existing file
      const stats = await provider.stat("/README.md");
      expect(stats.isFile).toBe(true);
      expect(stats.isDirectory).toBe(false);
      expect(stats.size).toBeGreaterThan(0);
      
      // Test stat on non-existent file
      await expect(provider.stat("/non-existent.txt")).rejects.toThrow();
    });
  });

  describe("Performance and Memory Integration", () => {
    it("should handle large number of operations efficiently", async () => {
      const startTime = Date.now();
      
      // Create many files
      for (let i = 0; i < 100; i++) {
        await provider.writeFile(`/performance/test-${i}.txt`, `Content ${i}`);
      }
      
      // Read all files
      for (let i = 0; i < 100; i++) {
        const content = await provider.readFile(`/performance/test-${i}.txt`);
        expect(content).toBe(`Content ${i}`);
      }
      
      // Copy files
      for (let i = 0; i < 100; i++) {
        await provider.copy(`/performance/test-${i}.txt`, `/performance/copy-${i}.txt`);
      }
      
      // Rename files
      for (let i = 0; i < 100; i++) {
        await provider.rename(`/performance/copy-${i}.txt`, `/performance/renamed-${i}.txt`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000);
    });

    it("should handle memory efficiently with large files", async () => {
      const largeContent = "x".repeat(10000); // 10KB file
      
      await provider.writeFile("/large.txt", largeContent);
      const readContent = await provider.readFile("/large.txt");
      
      expect(readContent.length).toBe(10000);
      
      const stats = await provider.stat("/large.txt");
      expect(stats.size).toBe(10000);
    });
  });

  describe("Plugin Integration Scenarios", () => {
    it("should work correctly with TokenRing plugin system", async () => {
      // This test simulates how the plugin would be used in a real TokenRing app
      const waitForItemByTypeSpy = vi.fn();
      const mockApp = {
        getConfigSlice: () => ({
          providers: {
            browser: { type: "browser" }
          }
        }),
        services: {
          waitForItemByType: waitForItemByTypeSpy
        }
      };
      
      // Import and test the plugin

      
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe("@tokenring-ai/browser-file-system");
      
      // Test installation
      plugin.install(mockApp,{ filesystem: {
        providers: {
          browser: { type: "browser" }
        }
      }});
      
      // Plugin should have registered the provider
      expect(waitForItemByTypeSpy).toHaveBeenCalled();
    });
  });

  describe("Cross-FileSystem Operations", () => {
    it("should handle operations across different file types", async () => {
      // Create files of different types
      await provider.writeFile("/test.json", JSON.stringify({ name: "test", value: 123 }));
      await provider.writeFile("/test.js", "const test = () => 'hello';");
      await provider.writeFile("/test.md", "# Test Document\n\nContent here.");
      await provider.writeFile("/test.txt", "Plain text content");
      
      // Verify all files
      for (const file of ["/test.json", "/test.js", "/test.md", "/test.txt"]) {
        expect(await provider.exists(file)).toBe(true);
      }
      
      // Test grep across all file types
      const results = await provider.grep("test");
      expect(results.length).toBeGreaterThanOrEqual(2);
      
      // Test glob across all file types
      const allFiles = await provider.glob("test.*");
      expect(allFiles.length).toBeGreaterThanOrEqual(4);
    });
  });
});