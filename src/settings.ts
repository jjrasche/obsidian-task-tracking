export const DEFAULT_SETTINGS: Settings = {
    taskDataFileName: "Data/task-tracking.json",
    onlyOneTaskActive: true
};

export interface Settings {
    taskDataFileName: string;
    onlyOneTaskActive: boolean;
}
