import { readFileSync, writeFileSync } from "node:fs";

export class FileService {
	constructor() {}

	find(fileName: string, attempt = false): string {
		return readFileSync("C:\\Users\\rasche_j\\Documents\\everything\\Data\\task-tracking.json", 'utf-8');
	}

	save(fileName: string, fileContent: string) {
		writeFileSync("C:\\Users\\rasche_j\\Documents\\everything\\Data\\task-tracking.json", fileContent);
	}
}