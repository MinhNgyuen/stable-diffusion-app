import * as fs from 'fs';
import { settingsPath } from '../main/constants';

type Settings = {
  [key: string]: string;
};

const updateSetting = (key: string, val: string) => {
  let settings: Settings = {};

  // Read the existing settings file if it exists
  if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  }

  // Update the settings with the new installation status
  settings[key] = val;
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
};

const readSetting = (key: string) => {
  let settings: Settings = {};

  // Read the existing settings file if it exists
  if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  }

  // Update the settings with the new installation status
  return settings[key];
};

export { updateSetting, readSetting };
