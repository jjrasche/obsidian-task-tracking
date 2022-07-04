import { Editor, MarkdownView } from "obsidian";


export enum TaskModification {
	AddTaskID,
	MarkComplete
}

export class TaskLine {
	fullLine: string;
	isTask: boolean;
	prefix?: string;
	taskID?: number;
	text?: string;

	constructor(private editor: Editor) {
		this.fullLine = this.getCurrentLine(editor);
		const prefixMatch = this.fullLine.match(/^\t*- \[.{1}\]\s/g); // begins with "- [ ] "
		this.isTask = !!prefixMatch;
		if (!prefixMatch) {
			return;
		}
		if (prefixMatch.length > 1) {
			throw new Error("found more than 1 task on this line");
		}
		this.prefix = prefixMatch[0].trimEnd();
		this.taskID = this.getTaskID(this.fullLine);
		this.text = this.getTaskText(this.fullLine);
		if (!!this.text) {
			this.text = this.text.trim();
		}
	}
	
	public toString(): string {
		return `${this.prefix}${isNaN(this.taskID ?? 0) ? "" : " " + this.taskID} ${this.text?.trim()}`;
	}

    private getCurrentLine(editor: Editor): string {
        return editor.getLine(editor.getCursor().line);
    }

	private getTaskID(line: string): number {
		const startTaskMatch = line.match(/^\t*- \[.{1}\]\s[0-9]+/g);
		const taskID = ((startTaskMatch ?? [""])[0].match(/[0-9]+/) ?? [])[0];
		return parseInt(taskID);
	}
	
	private getTaskText(line: string): string {
		const startTaskMatch = line.split(/^\t*- \[.{1}\]\s[0-9]*/g);
		return startTaskMatch[1];
	}

    async modifyTask(mod: TaskModification) {
        if (mod === TaskModification.AddTaskID) {
            this.taskID = (new Date()).getTime();			
        } else if (mod === TaskModification.MarkComplete) {
            this.prefix = "- [C]";
        }
        await this.replaceCurrentTask();
    }

    private async replaceCurrentTask() {
        const line = this.editor.getCursor().line;
        this.editor.setLine(line, this.toString());
        await app.workspace.getActiveViewOfType(MarkdownView)?.save()
    } 
}