export const DEFAULT_SETTINGS: Settings = {
    taskDataFileName: ".obsidian/plugins/obsidian-activity-tracking/data.json",
    logFileName: ".obsidian/plugins/obsidian-activity-tracking/log.txt",
    onlyOneTaskActive: true,
    alwaysIncludeTagsInView: ["break/game", "break/watch", "break/news", "kids", "chore/dishes", "chore/laundry", "chore/cleanup", "myProj/taskTrack"]//["break", "comm", "plan/work" ]
};

export interface Settings {
    taskDataFileName: string;
    logFileName: string;
    onlyOneTaskActive: boolean;
    alwaysIncludeTagsInView: string[]; // this allows access to common (long running) tasks that is mobile friendly
}
