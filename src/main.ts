import { activateTodo } from 'logic';
import { Editor, MarkdownView, Plugin } from 'obsidian';
// import * as l from "src/logic";

/*
	functionality:
	create commands for:
		- Active task activating task at current cursor

	? is a JSON file the best place to keep task data?
	data structure, what do operations should be prioritized.
	- finding task by ID 
	- find active task
	- adding a task by ID
	- reports
		- filter for all active tasks
	data structures
	- array: find task by ID = O(n), find active task = O(n), add task = O(1)
	- hash: find task by ID = O(1), find active task = O(n), add task = O(1)

*/



export default class TodoTrackingPlugin extends Plugin {
	onlyOneActive = true;
    public editor_handler: Editor;

	async onload() {
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCheckCallback: (check: boolean, editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// this.addRibbonIcon('up-arrow-with-tail', 'Activity Tracker Plugin', (evt: MouseEvent) => {});
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {});
		// this.registerInterval(window.setInterval(() => conole.log('setInterval'), 5 * 60 * 1000)); // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
	}

	public async activateTodo(editor: Editor) {
		activateTodo(editor, this.app);
	}

	onunload() {

	}
}

