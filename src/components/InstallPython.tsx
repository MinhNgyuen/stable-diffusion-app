import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { readSetting, updateSetting } from './SettingsFile';
import { pythonInstallerPath } from '../main/constants';
import { InstallationInfo } from '../main/preload';

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
): Promise<InstallationInfo> {
  callback('Starting Python installation...');

  // https://docs.python.org/3.10/using/windows.html#installing-without-ui
  const command = `${filepath} /passive PrependPath=1`;

  try {
    const { stdout } = await execAsync(command);
    updateSetting('didAppInstallPython', 'true');
    callback(`Python installed successfully: ${stdout}`);
    const pythonInstalled = await isPythonInstalled(callback);
    if (pythonInstalled) {
      return InstallationInfo.Success;
    }
    return InstallationInfo.RestartRequired;
  } catch (error) {
    const err = `Error executing Python installer: ${error}`;
    callback(err);
    throw new Error(err);
  }
}

async function checkAndInstallPython(
  callback: (message: string) => void,
): Promise<InstallationInfo> {
  try {
    const isInstalled = await isPythonInstalled(callback);
    if (!isInstalled) {
      callback('Python not installed, installing now...');
      return installPythonViaLocalBinary(pythonInstallerPath, callback);
    }
    callback('Python already installed');
    return InstallationInfo.AlreadyInstalled;
  } catch (error) {
    callback(`An error occurred while checking for Python: ${error}`);
    callback('Attempting to install Python now...');
    return installPythonViaLocalBinary(pythonInstallerPath, callback);
  }
}

async function uninstallPythonViaLocalBinary(
  filepath: string,
  callback: (message: string) => void,
): Promise<InstallationInfo> {
  callback('uninstallPythonViaLocalBinary');
  const didAppInstallPython = readSetting('didAppInstallPython');
  if (didAppInstallPython === 'false') {
    callback('Python was not installed by the app, skipping uninstall');
    return InstallationInfo.MissingDependency;
  }

  callback('Python was installed by the app, uninstalling now');

  try {
    const command = `${filepath} /uninstall PrependPath=1`;
    const { stdout } = await execAsync(command);
    updateSetting('didAppInstallPython', 'false');
    callback(`Python uninstalled successfully: ${stdout}`);
    return InstallationInfo.Success;
  } catch (error) {
    const err = `Error uninstalling Python: ${error}`;
    callback(err);
    throw new Error(err);
  }
}

export {
  checkAndInstallPython,
  isPythonInstalled,
  installPythonViaLocalBinary,
  uninstallPythonViaLocalBinary,
};
