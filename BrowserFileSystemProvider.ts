import type {FileSystemProvider, GlobOptions, GrepOptions, GrepResult, StatLike, WatchOptions} from "@tokenring-ai/filesystem/FileSystemProvider";

// Simplified in-memory file structure - key is absolute path, value is { content }
const mockFileSystem: Record<string, { content: string }> = {
	"/README.md": {
		content: "# Mock File System\n\nThis is a sample README file.",
	},
	"/src/index.js": { content: 'console.log("Hello from mock index.js");' },
	"/src/components/Button.jsx": {
		content:
			"const Button = () => <button>Click Me</button>;\nexport default Button;",
	},
	"/package.json": {
		content: '{ "name": "mock-project", "version": "1.0.0" }',
	},
};

export default class BrowserFileSystemProvider implements FileSystemProvider {
  * getDirectoryTree(
		path: string = "/",
		params: any = {},
  ): Generator<string, void, unknown> {
		const { ig, recursive = true } = params || {};

		// Normalize the path - ensure it starts with '/' and doesn't end with '/' unless it's root
		const normalizedPath =
			path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}`;

		// Get all files that match the directory path
		const matchingFiles = Object.keys(mockFileSystem).filter((filePath) => {
			// For root path, include all files
			if (normalizedPath === "/") {
				return true;
			}

			// For specific directories, check if file is within that directory
			if (recursive) {
				return filePath.startsWith(normalizedPath + "/");
			} else {
				// Non-recursive: only direct children
				const relativePath = filePath.substring(normalizedPath.length + 1);
				return relativePath && !relativePath.includes("/");
			}
		});

		// Apply ignore filter if provided
		for (const filePath of matchingFiles) {
			const relativePath =
				normalizedPath === "/"
					? filePath.substring(1)
					: filePath.substring(normalizedPath.length + 1);

			// Skip if ignore filter rejects this path
      if (ig?.(relativePath)) {
				continue;
			}

			yield filePath;
		}
	}

  createDirectory(
    _path: string,
    _options?: { recursive?: boolean },
  ): boolean {
		//noop
		return true;
	}

  readFile(filePath: string): Buffer | null {
		if (mockFileSystem[filePath]) {
			return Buffer.from(mockFileSystem[filePath].content || "");
		}
    return null;
	}

  writeFile(
		filePath: string,
		content: string | Buffer,
  ): boolean {
		mockFileSystem[filePath] = { content: content.toString("utf-8") };
		return true;
	}

  appendFile(
    filePath: string,
    content: string | Buffer,
  ): boolean {
		const contentStr = content.toString("utf-8");

		// If file doesn't exist, create it with the content
		if (!mockFileSystem[filePath]) {
			mockFileSystem[filePath] = { content: contentStr };
		} else {
			// If file exists, append the content
			mockFileSystem[filePath] = {
        content: (mockFileSystem[filePath].content || "") + contentStr,
			};
		}
		return true;
	}

  deleteFile(filePath: string): boolean {
    if (mockFileSystem[filePath]) {
      delete mockFileSystem[filePath];
      return true;
    }
    return true;
	}

  exists(filePath: string): boolean {
    return !!mockFileSystem[filePath];
	}

  copy(
		source: string,
		destination: string,
		options: { overwrite?: boolean } = {},
  ): boolean {
		console.warn(
			`BrowserFileSystemService: copy called from ${source} to ${destination}. This is a mock implementation.`,
		);

		if (!mockFileSystem[source]) {
      // Return true for non-existent source (mock behavior)
      return true;
		}

		if (mockFileSystem[destination] && !options.overwrite) {
			throw new Error(
				`Destination file already exists: ${destination}. Use overwrite option to replace.`,
			);
		}

		// Copy the file content
		mockFileSystem[destination] = {
			content: mockFileSystem[source].content,
		};

		console.log(`Mock copy: ${source} copied to ${destination} in memory.`);
    return true;
	}

  rename(oldPath: string, newPath: string): boolean {
		console.warn(
			`BrowserFileSystemService: rename called from ${oldPath} to ${newPath}. This is a mock implementation.`,
		);

		if (!mockFileSystem[oldPath]) {
      // Return true for non-existent source (mock behavior)
      return true;
		}

		if (mockFileSystem[newPath]) {
			throw new Error(`Destination file already exists: ${newPath}`);
		}

		// Move the file content
		mockFileSystem[newPath] = {
			content: mockFileSystem[oldPath].content,
		};

		// Remove the old file
		delete mockFileSystem[oldPath];

		console.log(`Mock rename: ${oldPath} renamed to ${newPath} in memory.`);
    return true;
	}

  stat(filePath: string): StatLike {
		if (!mockFileSystem[filePath]) {
      return {
        exists: false,
        path: filePath,
      };
		}

		const content = mockFileSystem[filePath].content;
		return {
      exists: true,
			path: filePath,
			absolutePath: filePath,
			isFile: true,
			isDirectory: false,
			isSymbolicLink: false,
			size: content.length,
			created: new Date(),
			modified: new Date(),
			accessed: new Date(),
		};
	}

  glob(_pattern: string, options?: GlobOptions): string[] {
		const { ignoreFilter } = options || {};
		const allFiles = Object.keys(mockFileSystem);
    return allFiles.filter((file) => !ignoreFilter?.(file));
	}

  watch(_dir: string, _options?: WatchOptions) {
    throw new Error("BrowserFileSystemProvider: watch not implemented");
	}

  grep(
		searchString: string | string[],
		options?: GrepOptions,
  ): GrepResult[] {
		const search = Array.isArray(searchString) ? searchString[0] : searchString;
		const { ignoreFilter, includeContent } = options || {};
		const { linesBefore = 0, linesAfter = 0 } = includeContent || {};
		const results: GrepResult[] = [];

		for (const [file, { content }] of Object.entries(mockFileSystem)) {
      if (ignoreFilter?.(file)) continue;

			const lines = content.split("\n");
			for (let i = 0; i < lines.length; i++) {
				if (lines[i].includes(search)) {
					const start = Math.max(0, i - linesBefore);
					const end = Math.min(lines.length - 1, i + linesAfter);
          const contextContent =
            linesBefore > 0 || linesAfter > 0
              ? lines.slice(start, end + 1).join("\n")
              : null;

					results.push({
						file,
						line: i + 1,
						match: lines[i],
						matchedString: search,
						content: contextContent,
					});
				}
			}
		}

		return results;
	}
}
