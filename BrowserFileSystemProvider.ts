import FileSystemProvider, {
	StatLike,
	GlobOptions,
	WatchOptions,
	ExecuteCommandOptions,
	ExecuteCommandResult,
	GrepOptions,
	GrepResult,
} from "@tokenring-ai/filesystem/FileSystemProvider";

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
	async *getDirectoryTree(
		path: string = "/",
		params: any = {},
	): AsyncGenerator<string, void, unknown> {
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
			if (ig && ig(relativePath)) {
				continue;
			}

			yield filePath;
		}
	}
  async createDirectory(path: string, options?: { recursive?: boolean }): Promise<boolean> {
    //noop
    return true;
  }


  async readFile(filePath: string): Promise<string> {
		if (mockFileSystem[filePath]) {
			return Promise.resolve(mockFileSystem[filePath].content || "");
		}
		throw new Error(`File not found: ${filePath}`);
	}
  async writeFile(
    filePath: string,
    content: string | Buffer,
  ): Promise<boolean> {
    mockFileSystem[filePath] = { content: content.toString("utf-8") };
    return true;
  }

  async appendFile(filePath: string, content: string | Buffer): Promise<boolean> {
    mockFileSystem[filePath] = {
      content: (mockFileSystem[filePath].content ?? "") + content.toString("utf-8")
    };
    return true;
  }

	async deleteFile(filePath: string): Promise<never> {
		console.warn(
			"BrowserFileSystemService: deleteFile is not implemented (read-only aspects for now).",
		);
		return Promise.reject(new Error("deleteFile not implemented in mock."));
	}

	async exists(filePath: string): Promise<boolean> {
		return Promise.resolve(!!mockFileSystem[filePath]);
	}

	async copy(
		source: string,
		destination: string,
		options: { overwrite?: boolean } = {},
	): Promise<boolean> {
		console.warn(
			`BrowserFileSystemService: copy called from ${source} to ${destination}. This is a mock implementation.`,
		);

		if (!mockFileSystem[source]) {
			throw new Error(`Source file not found: ${source}`);
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
		return Promise.resolve(true);
	}

	async rename(oldPath: string, newPath: string): Promise<boolean> {
		console.warn(
			`BrowserFileSystemService: rename called from ${oldPath} to ${newPath}. This is a mock implementation.`,
		);

		if (!mockFileSystem[oldPath]) {
			throw new Error(`Source file not found: ${oldPath}`);
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
		return Promise.resolve(true);
	}

	async stat(filePath: string): Promise<StatLike> {
		if (!mockFileSystem[filePath]) {
			throw new Error(`Path ${filePath} does not exist`);
		}
		const content = mockFileSystem[filePath].content;
		return {
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

	async glob(pattern: string, options?: GlobOptions): Promise<string[]> {
		const { ignoreFilter } = options || {};
		const allFiles = Object.keys(mockFileSystem);
		return allFiles.filter(file => !ignoreFilter || !ignoreFilter(file));
	}

	async watch(dir: string, options?: WatchOptions): Promise<any> {
		console.warn("BrowserFileSystemProvider: watch not implemented");
		return Promise.resolve(null);
	}

	async executeCommand(
		command: string | string[],
		options?: ExecuteCommandOptions,
	): Promise<ExecuteCommandResult> {
		console.warn("BrowserFileSystemProvider: executeCommand not implemented");
		return {
			ok: false,
			stdout: "",
			stderr: "Command execution not supported in browser",
			exitCode: 1,
			error: "Not implemented",
		};
	}

	async grep(
		searchString: string | string[],
		options?: GrepOptions,
	): Promise<GrepResult[]> {
		const search = Array.isArray(searchString) ? searchString[0] : searchString;
		const { ignoreFilter, includeContent } = options || {};
		const { linesBefore = 0, linesAfter = 0 } = includeContent || {};
		const results: GrepResult[] = [];

		for (const [file, { content }] of Object.entries(mockFileSystem)) {
			if (ignoreFilter && ignoreFilter(file)) continue;

			const lines = content.split("\n");
			for (let i = 0; i < lines.length; i++) {
				if (lines[i].includes(search)) {
					const start = Math.max(0, i - linesBefore);
					const end = Math.min(lines.length - 1, i + linesAfter);
					const contextContent = linesBefore > 0 || linesAfter > 0
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
