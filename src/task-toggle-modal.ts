import { StatusWord } from "model/status";
import { Task } from "model/task.model";
import { SuggestModal } from "obsidian";
import { updateTaskFromClick } from "service/modify-task.service";
import { get } from "state/tasks.state";

export class TaskToggleModal extends SuggestModal<Task> {
	// Returns all available suggestions.
	async getSuggestions(query: string): Promise<Task[]> {
		const tasks = (await get())
			.sort((a,b) => {
				if (!!b.lastActive && !!a.lastActive) {
					return b.lastActive.getTime() - a.lastActive.getTime();
				}
				return 0;
			});
		return (await get()).filter((task) =>
			task.text.toLowerCase().includes(query.toLowerCase())
		);
	}

	// Renders each suggestion item.
	renderSuggestion(task: Task, el: HTMLElement) {
		el.createEl("div", { text: `${task.text} (${StatusWord[task.status?? 2]}) - ${task.timeSpent}` });
	}

	// Perform action on the selected suggestion.
	onChooseSuggestion(task: Task, evt: MouseEvent | KeyboardEvent) {
		updateTaskFromClick(task.id);
	}
}