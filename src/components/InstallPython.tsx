import { spawn } from 'child_process';
import sudo from 'sudo-prompt';
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

const installPythonViaLocalBinary = (
  filepath: string,
  callback: (message: string) => void,
) => {
  callback('installPythonViaLocalBinary');
  sudo.exec(
    // https://docs.python.org/3.10/using/windows.html#installing-without-ui
    `${filepath} /passive PrependPath=1`,
    (error, stdout, stderr) => {
      if (error) {
        callback(`Error executing Python installer: ${error}, ${stderr}`);
        return;
      }
      updateSetting('didAppInstallPython', 'true');
      callback(`Python installed successfully: ${stdout}`);
    },
  );
};

const checkAndInstallPython = async (callback: (message: string) => void) => {
  return isPythonInstalled(callback)
    .then((isInstalled) => {
      if (!isInstalled) {
        callback('Python not installed, installing now...');
        installPythonViaLocalBinary(pythonInstallerPath, callback);
      } else {
        callback('Python already installed');
      }
    })
    .catch((error) => {
      callback(`An error occurred while checking for Python: ${error}`);
      callback('Python not installed, installing now...');
      installPythonViaLocalBinary(pythonInstallerPath, callback);
    });
};

const uninstallPythonViaLocalBinary = (
  filepath: string,
  callback: (message: string) => void,
) => {
  return new Promise(
    (resolve: (msg: string) => void, reject: (msg: Error) => void) => {
      callback('uninstallPythonViaLocalBinary');
      const didAppInstallPython = readSetting('didAppInstallPython');
      if (didAppInstallPython === 'false') {
        callback(
          'Python was not installed by Stable diffusion app, skipping uninstall',
        );
        resolve('skip Python uninstall');
        return;
      }
      callback(
        'Python was installed by Stable diffusion app, uninstalling now',
      );
      sudo.exec(
        // https://docs.python.org/3.10/using/windows.html#installing-without-ui
        `${filepath} /uninstall PrependPath=1`,
        (error, stdout, stderr) => {
          if (error) {
            callback(`Error uninstalling Python: ${error}, ${stderr}`);
            reject(new Error('error Python uninstall'));
            return;
          }
          updateSetting('didAppInstallPython', 'false');
          callback(`Python uninstalled successfully ${stdout}`);
          resolve('successful Python uninstall');
        },
      );
    },
  );
};

const uninstallPythonAndGit = (
  pythonFilePath: string,
  callback: (message: string) => void,
) => {
  callback('uninstallPythonAndGit');
  const didAppInstallPython = readSetting('didAppInstallPython');
  const didAppInstallGit = readSetting('didAppInstallGit');
  const uninstallPythonCommand = `start /wait ${pythonFilePath} /uninstall PrependPath=1`;
  const uninstallGitCommand = `start /wait ${pythonFilePath} /uninstall PrependPath=1`;
  if (didAppInstallPython === 'true' && didAppInstallGit === 'true') {
    callback(
      'Python and Git were installed by Stable diffusion app, uninstalling now',
    );
    sudo.exec(
      // https://docs.python.org/3.10/using/windows.html#installing-without-ui
      `${uninstallPythonCommand} && ${uninstallGitCommand}`,
      (error, stdout, stderr) => {
        if (error) {
          callback(`Error uninstalling Python and Git: ${error}, ${stderr}`);
          return;
        }
        updateSetting('didAppInstallPython', 'false');
        updateSetting('didAppInstallGit', 'false');
        callback(`Python and Git uninstalled successfully ${stdout}`);
      },
    );
  } else {
    if (didAppInstallPython === 'false') {
      callback(
        'Python was not installed by Stable diffusion app, skipping uninstall',
      );
    } else {
      callback(
        'Python was installed by Stable diffusion app, uninstalling now',
      );
      sudo.exec(
        // https://docs.python.org/3.10/using/windows.html#installing-without-ui
        uninstallGitCommand,
        (error, stdout, stderr) => {
          if (error) {
            callback(`Error uninstalling Python: ${error}, ${stderr}`);
            return;
          }
          updateSetting('didAppInstallPython', 'false');
          callback(`Python uninstalled successfully ${stdout}`);
        },
      );
    }
    if (didAppInstallGit === 'false') {
      callback(
        'Git was not installed by Stable diffusion app, skipping uninstall',
      );
    } else {
      callback('Git was installed by Stable diffusion app, uninstalling now');
      const command = '"C:\\Program Files\\Git\\unins000.exe" /SILENT';

      sudo.exec(
        // https://docs.Git.org/3.10/using/windows.html#installing-without-ui
        command,
        (error, stdout, stderr) => {
          if (error) {
            callback(`Error uninstalling Git: ${error}, ${stderr}`);
            return;
          }
          updateSetting('didAppInstallGit', 'false');
          callback(`Git uninstalled successfully ${stdout}`);
        },
      );
    }
  }
};

export {
  checkAndInstallPython,
  isPythonInstalled,
  installPythonViaLocalBinary,
  uninstallPythonViaLocalBinary,
  uninstallPythonAndGit,
};
