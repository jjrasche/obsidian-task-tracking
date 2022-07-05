import { App, TFile } from "obsidian";

export class FileService {
	constructor(private app: App) {}

	find(fileName: string): TFile {
		const f = this.app.vault.getFiles().find((f: TFile) => f.path.toLowerCase().contains(fileName.replace("\\", "/").toLowerCase()));
		if (!f) {
			throw Error(`file ${fileName} not found.`);
		}
		return f;
	}
	
	async tryDelete(app: App, file: TFile): Promise<boolean> {
		try {
			await app.vault.delete(file);
			return true;
		} catch (e) {
			return false;
		}
	}
	
	async createOrFind(fileName: string): Promise<TFile> {
		try {
			return await this.app.vault.create(fileName, "");
		} catch(e) {
			return this.find(fileName);
		}
	}
	
	async read(file: TFile): Promise<string> {
		return this.app.vault.read(file);
	}
	
	async modify(fileName: string, file_content: string = "") {
		const f = this.find(fileName);
		if (f && f instanceof TFile) {
			await this.app.vault.modify(f, file_content);
		}
	}
}