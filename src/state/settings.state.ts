import { Settings } from 'settings';

let _settings: Settings;

export const set = (settings: Settings) => _settings = settings;
export const get = (): Settings => _settings; 