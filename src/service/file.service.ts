import { TFile } from "obsidian";
import * as app from 'state/app.state';


export const find = (fileName: string, attempt = false): TFile => {
	const f = app.get().vault.getFiles().find((f: TFile) => f.path.contains(fileName));
	if (!attempt && !f) {
		throw Error(`file ${fileName} not found.`);
	}
	return f as TFile;
}

export const tryDelete = async(file: TFile): Promise<boolean> => {
	try {
		await app.get().vault.delete(file);
		return true;
	} catch (e) {
		return false;
	}
}

export const createOrFind = async(fileName: string): Promise<TFile> => {
	try {
		// why does this think the file is already created?
		// Object.keys(app.get().vault.fileMap).map(key => app.get().vault.fileMap[key]).filter(f => f.deleted === true)

		return await app.get().vault.create(fileName, "");
	} catch(e) {
		return find(fileName);
	}
}

export const read = async(file: TFile): Promise<string> => {
	return app.get().vault.read(file);
}

export const readByPath = async(path: string): Promise<string> => {
	const file = find(path);
	return app.get().vault.read(file);
}

export const write = async(fileName: string, file_content: string = "") => {
	const f = find(fileName);
	if (f && f instanceof TFile) {
		await app.get().vault.modify(f, file_content);
	}
}

// // import { readFileSync, writeFileSync } from "node:fs";
// import fs from 'fs'
// import * as app from 'state/app.state';

// // todo: consider going async
// export const read = (fileName: string): string => {
// 	// const path = fs.realpathSync();
// 	console.log(__dirname); 
// 	console.log(__filename); 
// 	console.log(app.get().vault.getRoot())
// 	return fs.readFileSync(`./${fileName}`, 'utf-8');
// }

// export const save = (fileName: string, fileContent: string) => {
// 	fs.writeFileSync(fileName, fileContent);
// }

// export const remove = (fileName: string) => {
// 	fs.rmSync(fileName);
// }


// // export const find = (fileName: string, fileContent: string) => {
// // 	fs.find(fileName, fileContent);
// // }