import { ItemView, WorkspaceLeaf } from "obsidian";
import { DataviewApi, getAPI, STask } from "obsidian-dataview";

export const VIEW_ID = "task-tracking-view";

const tableHTML = `\`\`\`dataviewjs
dv.table(['a', 'b', 'c'], dv.pages().file.tasks.values.map(t => [t.text, t.link.path, t.completed]))
\`\`\``;

export class TaskTrackingView extends ItemView {
  dv: DataviewApi;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  onload(): void {

  }

  onunload(): void {
  }

  getViewType() {
    return VIEW_ID;
  }

  getDisplayText() {
    return "Task Tracking View";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "AAHGHA real monsters!" });
    const divElement = container.createEl("div");
    const dv = getAPI(this.app) as DataviewApi;
    await dv.executeJs(tableHTML, divElement, this, "Untitled 4.md");
    // container.createEl("div", { text: tablHTML })
  }
}