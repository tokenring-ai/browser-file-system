import { AgentTeam, TokenRingPackage } from "@tokenring-ai/agent";
import {
	FileSystemConfigSchema,
	FileSystemService,
} from "@tokenring-ai/filesystem";
import packageJSON from "./package.json" with { type: "json" };
import BrowserFileSystemProvider from "./BrowserFileSystemProvider.ts";

export { default as BrowserFileSystemProvider } from "./BrowserFileSystemProvider.ts";

export const packageInfo: TokenRingPackage = {
	name: packageJSON.name,
	version: packageJSON.version,
	description: packageJSON.description,
	install(agentTeam: AgentTeam) {
		const filesystemConfig = agentTeam.getConfigSlice(
			"filesystem",
			FileSystemConfigSchema,
		);

		if (filesystemConfig) {
			agentTeam.services
				.waitForItemByType(FileSystemService)
				.then((fileSystemService) => {
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
};
