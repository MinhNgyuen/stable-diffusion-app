import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { readSetting, updateSetting } from './SettingsFile';
import { pythonInstallerPath } from '../main/constants';

const isPythonInstalled = (
  callback: (message: string) => void,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const requiredVersion = '3.10.6';
    const pythonCheckCommand = 'py';
    const pythonCheckArgs = ['-3.10', '--version'];

    const checkProcess = spawn(pythonCheckCommand, pythonCheckArgs, {
      stdio: 'pipe',
    });

    checkProcess.stdout.on('data', (data) => {
      const versionString = data.toString().trim();
      if (versionString.includes(requiredVersion)) {
        callback(`Python ${requiredVersion} found`);
        resolve(true);
      } else {
        callback(`Python ${requiredVersion} not found`);
        resolve(false);
      }
    });

    checkProcess.stderr.on('data', (data) => {
      callback(`Python ${requiredVersion} not found: ${data}`);
      resolve(false);
    });

    checkProcess.on('error', (error) => {
      callback(`Failed to start subprocess: ${error}`);
      reject(error);
    });
  });
};

const execAsync = promisify(exec);

async function installPythonViaLocalBinary(
  filepath: string,
  callback: (message: string) => void,
): Promise<void> {
  callback('Starting Python installation...');

  // https://docs.python.org/3.10/using/windows.html#installing-without-ui
  const command = `${filepath} /passive PrependPath=1`;

  try {
    const { stdout } = await execAsync(command);
    updateSetting('didAppInstallPython', 'true');
    callback(`Python installed successfully: ${stdout}`);
  } catch (error) {
    callback(`Error executing Python installer: ${error}`);
  }
}

async function checkAndInstallPython(
  callback: (message: string) => void,
): Promise<void> {
  try {
    const isInstalled = await isPythonInstalled(callback);
    if (!isInstalled) {
      callback('Python not installed, installing now...');
      await installPythonViaLocalBinary(pythonInstallerPath, callback);
    } else {
      callback('Python already installed');
    }
  } catch (error) {
    callback(`An error occurred while checking for Python: ${error}`);
    callback('Attempting to install Python now...');
    await installPythonViaLocalBinary(pythonInstallerPath, callback).catch(
      (err) => callback(`Failed to install Python: ${err}`),
    );
  }
}

async function uninstallPythonViaLocalBinary(
  filepath: string,
  callback: (message: string) => void,
): Promise<string> {
  callback('uninstallPythonViaLocalBinary');
  const didAppInstallPython = readSetting('didAppInstallPython');
  if (didAppInstallPython === 'false') {
    callback('Python was not installed by the app, skipping uninstall');
    return 'skip Python uninstall';
  }

  callback('Python was installed by the app, uninstalling now');

  try {
    const command = `${filepath} /uninstall PrependPath=1`;
    const { stdout } = await execAsync(command);
    updateSetting('didAppInstallPython', 'false');
    callback(`Python uninstalled successfully: ${stdout}`);
    return 'successful Python uninstall';
  } catch (error) {
    callback(`Error uninstalling Python: ${error}`);
    throw new Error('error Python uninstall');
  }
}

export {
  checkAndInstallPython,
  isPythonInstalled,
  installPythonViaLocalBinary,
  uninstallPythonViaLocalBinary,
};
