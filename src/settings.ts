export const DEFAULT_SETTINGS: Settings = {
    taskDataFileName: ".obsidian/plugins/obsidian-activity-tracking/data.json",
    onlyOneTaskActive: true,
    alwaysIncludeTagsInView: ["break", "comm", "plan/work"]
};

export interface Settings {
    taskDataFileName: string;
    onlyOneTaskActive: boolean;
    alwaysIncludeTagsInView: string[]; // this allows access to common (long running) tasks that is mobile friendly
}
