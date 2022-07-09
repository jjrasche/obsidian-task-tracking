import { FileService } from "file.service";
import { Pos } from "obsidian";
import { Link, STask } from "obsidian-dataview";
import { SListItem } from "obsidian-dataview/lib/data-model/serialized/markdown";

export class ManagedTask implements STask {
	taskID?: number;
	inFocus: false;
	// STask properties
	task: true;
	status: string;
	checked: boolean;
	completed: boolean;
	fullyCompleted: boolean;
	created?: any;
	due?: any;
	completion?: any;
	symbol: string;
	link: Link;
	section: Link;
	path: string;
	line: number;
	lineCount: number;
	position: Pos;
	list: number;
	blockId?: string | undefined;
	parent?: number | undefined;
	children: SListItem[];
	outlinks: Link[];
	text: string;
	visual?: string | undefined;
	annotated?: boolean | undefined;
	tags: string[];
	subtasks: SListItem[];
	real: boolean;
	header: Link;

	constructor(stask: STask) {
		Object.keys(stask).forEach(key => (this as any)[key] = stask[key]);
		this.taskID = this.getTaskID(this.text);
		this.text = this.getTaskText(this.text);
	}
	
	public toString(): string {
		const tabs = [...Array(this.position.start.col)].reduce((acc) => acc += "\t", "");
		let ret = `${tabs}${this.symbol} [${this.status}] ${this.text?.trim()}`
		if (!!this.taskID && !isNaN(this.taskID)) {
			ret += ` id:${this.taskID}`;
		}
		return ret;
	}

	private getTaskID(line: string): number | undefined {
		const idMatch = line.match(/id:[0-9]+$/g);
		const taskID = ((idMatch ?? [""])[0].match(/[0-9]+/) ?? [])[0];
		return !!taskID ? parseInt(taskID) : undefined;
	}
	
	private getTaskText(line: string): string {
		const text = line.split("id:")[0]?.trim();
		return text;
	}
	
	async modifyTaskSourceFile(fs: FileService) {
		const file = fs.find(this.path);
		let originalContent = await fs.read(file);
		const lines = originalContent.split("\n")
		lines[this.line] = this.toString();
		const updatedContent = lines.join("\n");
		await fs.modify(this.path, updatedContent);
	}

}