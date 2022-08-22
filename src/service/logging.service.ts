import * as settings from 'state/settings.state';
import * as file from 'service/file.service';

export const toConsoleAndFile = async (message: string) => {
	console.log(message);
	await file.append(settings.get().logFileName, `i\t${message}\n`);
}

export const errorToConsoleAndFile = async (message: string, shouldThrow = false) => {
	console.error(message);
	await file.append(settings.get().logFileName, `e\t${message}\n`);
	if (shouldThrow) {
		throw new Error(message);
	}
}