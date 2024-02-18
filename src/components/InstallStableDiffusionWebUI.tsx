import { promises as fs } from 'fs';
import simpleGit from 'simple-git';
import { promisify } from 'util';
import { exec } from 'child_process';

import { webuiUserBatPath, sdwebuiPath } from '../main/constants';
import { InstallationInfo } from '../shared/types';

const execAsync = promisify(exec);

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
    callback('Cloning stable diffusion web ui...');
    await simpleGit().clone(
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

async function deleteStableDiffusionWebUI(
  callback: (message: string) => void,
): Promise<InstallationInfo> {
  callback('Removing stable diffusion web ui...');
  const deleteCommand = `rmdir /s /q ${sdwebuiPath}`;

  try {
    const { stdout } = await execAsync(deleteCommand);
    callback(`Stable diffusion web ui removed successfully: ${stdout}`);
    const sdInstalled = await isStableDiffusionWebUIInstalled();
    if (!sdInstalled) {
      return InstallationInfo.Success;
    }
    return InstallationInfo.Fail;
  } catch (error) {
    const err = `Error deleting stable diffusion web ui: ${error}`;
    callback(err);
    throw new Error(err);
  }
}

export {
  isStableDiffusionWebUIInstalled,
  checkAndInstallStableDiffusionWebUI,
  deleteStableDiffusionWebUI,
};
