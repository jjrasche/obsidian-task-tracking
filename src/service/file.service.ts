import { TFile } from "obsidian";
import * as app from 'state/app.state';


/*
 war story: non deterministically, the vault.getFiles() method would not find my test files. 
 I dug into the code and got to about this point `return [2, this.fsPromises.readFile(t, "utf8")]` trying to understand
	why the root.children did not contain the test files. 
	Chose to switch to adapter, but still need to get the TFile somehow
*/
export const find = (fileName: string, attempt = false): TFile => {
	const f = app.get().vault.getFiles().find((f: TFile) => f.path.contains(fileName));
	if (!attempt && !f) {
		throw Error(`file ${fileName} not found.`);  
	}
	return f as TFile;
}

export const remove = async(path: string): Promise<boolean> => {
	try {
		await app.adapter().remove(path);
		return true;
	} catch (e) {
		return false;
	}
}

export const read = async(path: string): Promise<string> => {
	return await app.adapter().read(path);
}

export const write = async(path: string, content: string = ""): Promise<void> => {
	await app.adapter().write(path, content); 
}

export const append = async(path: string, content: string = ""): Promise<void> => {
	await app.adapter().append(path, content); 
}