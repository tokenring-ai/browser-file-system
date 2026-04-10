import type {TokenRingPlugin} from "@tokenring-ai/app";
import {FileSystemService} from "@tokenring-ai/filesystem";
import BrowserFileSystemProvider from "./BrowserFileSystemProvider.ts";
import packageJSON from "./package.json" with {type: "json"};

export default {
  name: packageJSON.name,
  displayName: "Browser File System",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app) {
    app.services.waitForItemByType(FileSystemService, (fileSystemService) => {
      fileSystemService.registerFileSystemProvider(
        "browser",
        new BrowserFileSystemProvider(),
      );
    });
  },
} satisfies TokenRingPlugin;
