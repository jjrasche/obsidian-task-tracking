export const DEFAULT_SETTINGS: Settings = {
    taskDataFileName: ".\.obsidian\task-tracking.json",
    onlyOneTaskActive: true
};

export interface Settings {
    taskDataFileName: string;
    onlyOneTaskActive: boolean;
}
