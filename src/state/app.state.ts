import { App, FileSystemAdapter } from "obsidian";

let _app: App;

export const set = (app: App) => _app = app;
export const get = (): App => {
    if (!_app) {
        throw new Error("App is bieng used before it is instantiated");
    }
    return _app
}; 
export const adapter = (): FileSystemAdapter => get().vault.adapter as FileSystemAdapter