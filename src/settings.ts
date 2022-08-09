export const DEFAULT_SETTINGS: Settings = {
    taskDataFileName: "Data/task-tracking.md", // needed to change this to .md as .json files in this folder were not being watched by obsidian sync for some reason
    onlyOneTaskActive: true,
    alwaysIncludeTagsInView: ["break", "comm", "plan/work"]
};

export interface Settings {
    taskDataFileName: string;
    onlyOneTaskActive: boolean;
    alwaysIncludeTagsInView: string[]; // this allows access to common (long running) tasks that is mobile friendly
}
