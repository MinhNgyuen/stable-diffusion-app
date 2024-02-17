import { app } from 'electron';
import path from 'path';

export const isDevelopment = process.env.NODE_ENV !== 'production';
export const userDataPath = app.getPath('userData');
export const settingsPath = isDevelopment
  ? path.join(userDataPath, 'dev-settings.json')
  : path.join(userDataPath, 'settings.json');
export const sdwebuiPath = path.join(userDataPath, 'stable-diffusion-webui');

export const extrasPath = isDevelopment
  ? path.join(app.getAppPath(), 'assets')
  : path.join(process.resourcesPath, 'assets');
export const pythonInstallerPath = path.join(
  extrasPath,
  'python-3.10.6-amd64.exe',
);
export const gitInstallerPath = path.join(
  extrasPath,
  'Git-2.42.0.2-64-bit.exe',
);
export const logPath = path.join(userDataPath, 'logs');
