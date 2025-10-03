import { FileSystemService } from "@tokenring-ai/filesystem";

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

export default class BrowserFileSystem extends FileSystemService {
	constructor(options: any = {}) {
		super(options);
		// Set name to "FileSystemService" for generic lookup by commands
		// if they search for FileSystemService by name instead of type.
		this.name = "FileSystemService" as any;
	}

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

	async getFile(filePath: string): Promise<string> {
		if (mockFileSystem[filePath]) {
			return Promise.resolve(mockFileSystem[filePath].content || "");
		}
		throw new Error(`File not found: ${filePath}`);
	}

	async writeFile(
		filePath: string,
		content: string | Buffer,
	): Promise<boolean> {
		console.warn(
			`BrowserFileSystemService: writeFile called for ${filePath}. This is a mock implementation.`,
		);
		const contentStr = Buffer.isBuffer(content)
			? content.toString("utf-8")
			: content;
		if (mockFileSystem[filePath]) {
			mockFileSystem[filePath].content = contentStr;
			console.log(`Mock writeFile: ${filePath} updated in memory.`);
			return Promise.resolve(true);
		}
		// Create new file if it doesn't exist
		mockFileSystem[filePath] = { content: contentStr };
		console.log(`Mock writeFile: ${filePath} created in memory.`);
		return Promise.resolve(true);
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
}
