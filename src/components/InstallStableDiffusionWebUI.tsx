import { promises as fs } from 'fs';
import simpleGit from 'simple-git';
import sudo from 'sudo-prompt';
import { sdwebuiPath } from '../main/constants';

const isStableDiffusionWebUIInstalled = async (): Promise<boolean> => {
  try {
    await fs.access(sdwebuiPath);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

const cloneStableDiffusionWebUI = async (
  callback: (message: string) => void,
) => {
  return new Promise((resolve, reject) => {
    try {
      simpleGit().clone(
        'https://github.com/AUTOMATIC1111/stable-diffusion-webui',
        sdwebuiPath,
      );
      console.log('Installed stable diffusion web ui');
      callback('Installed stable diffusion web ui');
      resolve('Installed stable diffusion web ui');
    } catch (error) {
      console.error('Failed to clone stable diffusion web ui:', error);
      callback(`Failed to clone stable diffusion web ui: ${error}`);
      reject(new Error(`Failed to clone stable diffusion web ui: ${error}`));
    }
  });
};

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
  cloneStableDiffusionWebUI,
  deleteStableDiffusionWebUI,
};
