import TokenRingApp, {TokenRingPlugin} from "@tokenring-ai/app";
import {
	FileSystemConfigSchema,
	FileSystemService,
} from "@tokenring-ai/filesystem";
import packageJSON from "./package.json" with { type: "json" };
import BrowserFileSystemProvider from "./BrowserFileSystemProvider.ts";


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
				.waitForItemByType(FileSystemService, (fileSystemService) => {
					for (const name in filesystemConfig.providers) {
						const provider = filesystemConfig.providers[name];
						if (provider.type === "browser") {
							fileSystemService.registerFileSystemProvider(
								name,
								new BrowserFileSystemProvider(),
							);
						}
					}
				});
		}
	},
} satisfies TokenRingPlugin;
