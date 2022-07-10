import { ItemView, MarkdownRenderChild, WorkspaceLeaf } from "obsidian";
import { DataviewApi, getAPI, STask } from "obsidian-dataview";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { createRoot } from 'react-dom/client';

import { TaskTrackingReactView } from "./component/task-tracking-view";


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
		const root = createRoot(this.containerEl.children[1]!);
		root.render(React.createElement(TaskTrackingReactView));   // war story: https://stackoverflow.com/a/41897800/2109446
	}

	protected async onClose(): Promise<void> {
		ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
	}
}