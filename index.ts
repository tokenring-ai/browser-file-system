import TokenRingApp, {TokenRingPlugin} from "@tokenring-ai/app";
import {
	FileSystemConfigSchema,
	FileSystemService,
} from "@tokenring-ai/filesystem";
import FileSystemProvider from "@tokenring-ai/filesystem/FileSystemProvider";
import packageJSON from "./package.json" with { type: "json" };
import BrowserFileSystemProvider from "./BrowserFileSystemProvider.ts";

export { default as BrowserFileSystemProvider } from "./BrowserFileSystemProvider.ts";

export default {
	name: packageJSON.name,
	version: packageJSON.version,
	description: packageJSON.description,
	install(app: TokenRingApp) {
		const filesystemConfig = app.getConfigSlice(
			"filesystem",
			FileSystemConfigSchema,
		);

		if (filesystemConfig) {
			app.services
				.waitForItemByType(FileSystemService)
				.then((fileSystemService) => {
					for (const name in filesystemConfig.providers) {
						const provider = filesystemConfig.providers[name];
						if (provider.type === "browser") {
							fileSystemService.registerFileSystemProvider(
								name,
                //TODO: BrowserFileSystemProvider is not a complete FileSystemProvider, we do this to supress type errors
								new BrowserFileSystemProvider() as any as FileSystemProvider,
							);
						}
					}
				});
		}
	},
} as TokenRingPlugin;