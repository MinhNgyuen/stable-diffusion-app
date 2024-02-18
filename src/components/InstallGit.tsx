import { exec, spawn } from 'child_process';
import { promisify } from 'util';

import { gitInstallerPath } from '../main/constants';
import { readSetting, updateSetting } from './SettingsFile';
import { InstallationInfo } from '../shared/types';

const execAsync = promisify(exec);

async function uninstallGitViaLocalBinary(
  callback: (message: string) => void,
): Promise<InstallationInfo> {
  callback('uninstallGitViaLocalBinary');
  const didAppInstallGit = readSetting('didAppInstallGit');
  if (didAppInstallGit === 'false') {
    callback('Git was not installed by the app, skipping uninstall');
    return InstallationInfo.MissingDependency;
  }

  callback('Git was installed by the app, uninstalling now');

  try {
    // https://docs.Git.org/3.10/using/windows.html#installing-without-ui
    const command = '"C:\\Program Files\\Git\\unins000.exe" /SILENT';
    const { stdout } = await execAsync(command);
    updateSetting('didAppInstallGit', 'false');
    callback(`Git uninstalled successfully: ${stdout}`);
    return InstallationInfo.Success;
  } catch (error) {
    const err = `Error uninstalling Git: ${error}`;
    callback(err);
    throw new Error(err);
  }
}

async function installGitViaLocalBinary(
  filepath: string,
  callback: (message: string) => void,
): Promise<InstallationInfo> {
  callback('Starting Git installation...');

  // jrsoftware.org/ishelp/index.php?topic=setupcmdline
  const command = `${filepath} /SILENT /LOG`;

  try {
    const { stdout } = await execAsync(command);
    updateSetting('didAppInstallGit', 'true');
    callback(`Git installed successfully: ${stdout}`);
    const gitInstalled = await isGitInstalled(callback);
    if (gitInstalled) {
      return InstallationInfo.Success;
    }
    return InstallationInfo.RestartRequired;
  } catch (error) {
    const err = `Error executing Git installer: ${error}`;
    callback(err);
    throw new Error(err);
  }
}

const isGitInstalled = (
  callback: (message: string) => void,
): Promise<boolean> => {
  return new Promise((resolve) => {
    const gitCommand = 'git';
    const gitVersionCheckArgs = ['--version'];

    const checkProcess = spawn(gitCommand, gitVersionCheckArgs, {
      stdio: 'pipe',
    });

    checkProcess.stdout.on('data', (data) => {
      const versionString = data.toString().trim();
      callback(`Git version found: ${versionString}`);
      resolve(true);
    });

    checkProcess.stderr.on('data', (data) => {
      callback(`Git not found: ${data}`);
      resolve(false);
    });

    checkProcess.on('error', (error) => {
      callback(`Failed to start subprocess: ${error}`);
      resolve(false);
    });
  });
};

const checkAndInstallGit = async (
  callback: (message: string) => void,
): Promise<InstallationInfo> => {
  try {
    const isInstalled = await isGitInstalled(callback);
    if (!isInstalled) {
      return installGitViaLocalBinary(gitInstallerPath, callback);
    } else {
      callback('Git already installed');
      return InstallationInfo.AlreadyInstalled;
    }
  } catch (error) {
    callback(`An error occurred while checking for Git: ${error}`);
    callback('Git not installed, installing now...');
    return installGitViaLocalBinary(gitInstallerPath, callback);
  }
};

export { checkAndInstallGit, isGitInstalled, uninstallGitViaLocalBinary };
