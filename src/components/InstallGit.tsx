import { spawn } from 'child_process';
import sudo from 'sudo-prompt';
import { gitInstallerPath } from '../main/constants';
import { readSetting, updateSetting } from './SettingsFile';

const uninstallGitViaLocalBinary = (callback: (message: string) => void) => {
  return new Promise(
    (resolve: (msg: string) => void, reject: (err: Error) => void) => {
      callback('uninstallGitViaLocalBinary');
      const didAppInstallGit = readSetting('didAppInstallGit');
      if (didAppInstallGit === 'false') {
        callback(
          'Git was not installed by Stable diffusion app, skipping uninstall',
        );
        resolve('skip Git uninstall');
        return;
      }
      callback('Git was installed by Stable diffusion app, uninstalling now');
      const command = '"C:\\Program Files\\Git\\unins000.exe" /SILENT';

      sudo.exec(
        // https://docs.Git.org/3.10/using/windows.html#installing-without-ui
        command,
        (error, stdout, stderr) => {
          if (error) {
            callback(`Error uninstalling Git: ${error}, ${stderr}`);
            reject(new Error('error Git uninstall'));
            return;
          }
          updateSetting('didAppInstallGit', 'false');
          callback(`Git uninstalled successfully ${stdout}`);
          resolve('successful Git uninstall');
        },
      );
    },
  );
};

const installGitViaLocalBinary = (
  filepath: string,
  callback: (message: string) => void,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    callback('Installing git');
    sudo.exec(
      // jrsoftware.org/ishelp/index.php?topic=setupcmdline
      `${filepath} /SILENT /LOG`,
      (error, stdout, stderr) => {
        if (error) {
          callback(`Error executing Git installer: ${error}, ${stderr}`);
          reject(error);
          return;
        }
        updateSetting('didAppInstallGit', 'true');
        callback(`Git installed successfully: ${stdout}`);
        resolve(`Git installed successfully: ${stdout}`);
      },
    );
  });
};

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
): Promise<void> => {
  try {
    const isInstalled = await isGitInstalled(callback);
    if (!isInstalled) {
      await installGitViaLocalBinary(gitInstallerPath, callback);
    } else {
      callback('Git already installed');
    }
  } catch (error) {
    callback(`An error occurred while checking for Git: ${error}`);
    callback('Git not installed, installing now...');
    await installGitViaLocalBinary(gitInstallerPath, callback);
  }
};

export { checkAndInstallGit, uninstallGitViaLocalBinary };
