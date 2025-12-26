import {TokenRingPlugin} from "@tokenring-ai/app";
import {FileSystemConfigSchema, FileSystemService,} from "@tokenring-ai/filesystem";
import {z} from "zod";
import BrowserFileSystemProvider from "./BrowserFileSystemProvider.ts";
import packageJSON from "./package.json" with {type: "json"};

const packageConfigSchema = z.object({
  filesystem: FileSystemConfigSchema
});

export default {
	name: packageJSON.name,
	version: packageJSON.version,
	description: packageJSON.description,
  install(app, config) {
    if (config.filesystem) {
			app.services
				.waitForItemByType(FileSystemService, (fileSystemService) => {
          for (const name in config.filesystem.providers) {
            const provider = config.filesystem.providers[name];
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
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
