import { promises as fs } from 'fs';
import simpleGit from 'simple-git';
import sudo from 'sudo-prompt';
import { webuiUserBatPath, sdwebuiPath } from '../main/constants';
import { InstallationInfo } from '../shared/types';

const isStableDiffusionWebUIInstalled = async (): Promise<boolean> => {
  try {
    await fs.access(webuiUserBatPath);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

async function cloneStableDiffusionWebUI(
  callback: (message: string) => void,
): Promise<InstallationInfo> {
  try {
    simpleGit().clone(
      'https://github.com/AUTOMATIC1111/stable-diffusion-webui',
      sdwebuiPath,
    );
    const sdInstalled = await isStableDiffusionWebUIInstalled();
    if (sdInstalled) {
      callback('Installed stable diffusion web ui');
      return InstallationInfo.Success;
    }
    callback('Failed to install stable diffusion web ui');
    return InstallationInfo.Fail;
  } catch (error) {
    const err = `Failed to install stable diffusion web ui: ${error}`;
    callback(err);
    throw new Error(err);
  }
}

async function checkAndInstallStableDiffusionWebUI(
  callback: (message: string) => void,
): Promise<InstallationInfo> {
  try {
    const isInstalled = await isStableDiffusionWebUIInstalled();
    if (!isInstalled) {
      callback('StableDiffusionWebUI not installed, installing now...');
      return cloneStableDiffusionWebUI(callback);
    }
    callback('StableDiffusionWebUI already installed');
    return InstallationInfo.AlreadyCompleted;
  } catch (error) {
    callback(
      `An error occurred while checking for StableDiffusionWebUI: ${error}`,
    );
    callback('Attempting to install StableDiffusionWebUI now...');
    return cloneStableDiffusionWebUI(callback);
  }
}

const deleteStableDiffusionWebUI = (callback: (message: string) => void) => {
  return new Promise(
    (resolve: (msg: string) => void, reject: (err: Error) => void) => {
      const deleteCommand = `rmdir /s /q ${sdwebuiPath}`;
      sudo.exec(
        deleteCommand,
        {
          name: 'Stable diffusion app',
          icns: 'assets/icon.icns', // (optional) path to .icns file
        },
        (error, stdout, stderr) => {
          if (error) {
            callback(`Error removing stable diffusion web ui: ${error}`);
            reject(
              new Error(`Error removing stable diffusion web ui: ${error}`),
            );
            return;
          }
          if (stderr) {
            callback(`Stderr removing stable diffusion web ui: ${stderr}`);
            reject(
              new Error(`Stderr removing stable diffusion web ui: ${stderr}`),
            );
            return;
          }
          callback(`Stable diffusion web ui removed successfully ${stdout}`);
          resolve(`Stable diffusion web ui removed successfully ${stdout}`);
        },
      );
    },
  );
};

export {
  isStableDiffusionWebUIInstalled,
  checkAndInstallStableDiffusionWebUI,
  deleteStableDiffusionWebUI,
};
