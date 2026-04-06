import {TokenRingPlugin} from "@tokenring-ai/app";
import {FileSystemService} from "@tokenring-ai/filesystem";
import {z} from "zod";
import BrowserFileSystemProvider from "./BrowserFileSystemProvider.ts";
import packageJSON from "./package.json" with {type: "json"};

const packageConfigSchema = z.object({
  browserFilesystem: z.object({}).prefault({}),
});

export default {
  name: packageJSON.name,
  displayName: "Browser File System",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.services.waitForItemByType(FileSystemService, fileSystemService => {
      fileSystemService.registerFileSystemProvider("browser", new BrowserFileSystemProvider());
    });
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
