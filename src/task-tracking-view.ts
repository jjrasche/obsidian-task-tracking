import { App, ItemView, MarkdownRenderChild, WorkspaceLeaf } from "obsidian";
import { DataviewApi, getAPI, STask } from "obsidian-dataview";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { createRoot, Root } from 'react-dom/client';

import{ TaskTableView } from "./component/task-tracking-view";
import * as settings from 'state/settings.state';
import * as app from 'state/app.state';


export const VIEW_ID = "task-tracking-view";

const tableHTML = `\`\`\`dataviewjs
dv.table(['a', 'b', 'c'], dv.pages().file.tasks.values.map(t => [t.text, t.link.path, t.completed]))
\`\`\``;

export class TaskTrackingView extends ItemView {
	private reactComponent: React.ReactElement;

	dv: DataviewApi;
	root: Root;

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

	// war story: https://stackoverflow.com/a/41897800/2109446
	async onOpen() {
		this.root = createRoot(this.containerEl.children[1]!);
		this.root.render(React.createElement(TaskTableView, {view: this}));
		// listen to all tasks 
	}

	protected async onClose(): Promise<void> {
		this.root.unmount();
	}
}