/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, IpcMainEvent } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { ExecException, exec, spawn } from 'child_process';
import { simpleGit } from 'simple-git';
import sudo from 'sudo-prompt';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { Channel } from 'diagnostics_channel';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const checkAndInstallChocolatey = async (
  callback: (message: string) => void,
) => {
  const chocoCheckCommand = 'choco --version';
  const chocoInstallCommand =
    "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))";

  callback('Checking if Chocolatey is installed');
  exec(chocoCheckCommand, (error: ExecException | null) => {
    if (error) {
      console.error(`Chocolatey is not installed. Installing Chocolatey...`);
      callback(`Chocolatey is not installed. Installing Chocolatey...`);
      exec(
        chocoInstallCommand,
        (execError: ExecException | null, execStdout: string) => {
          if (error) {
            console.error(`exec error: ${execError}`);
            callback(`exec error: ${execError}`);
            return;
          }
          console.log(`Chocolatey installed successfully: ${execStdout}`);
          callback(`Chocolatey installed successfully: ${execStdout}`);
        },
      );
    } else {
      console.log(`Chocolatey is already installed.`);
      callback(`Chocolatey is already installed.`);
    }
  });
};

const installPython = async (callback: (message: string) => void) => {
  const requiredVersion = '3.10.6';
  const pythonInstallCommand = `choco install python --version=${requiredVersion} --allow-downgrade -force`;

  sudo.exec(
    pythonInstallCommand,
    {
      name: 'Your App Name',
      icns: 'assets/icon.icns', // (optional) path to .icns file
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error(
          `Python installation process exited with error: ${error}`,
        );
        callback(`Python installation process exited with error: ${error}`);
        return;
      }

      if (stderr) {
        console.error(`Python installation process stderr: ${stderr}`);
        callback(`Python installation process stderr: ${stderr}`);
        return;
      }

      console.log('Python installed successfully', stdout);
      callback(`Python installed successfully ${stdout}`);
    },
  );
};

const checkAndInstallPython = async (callback: (message: string) => void) => {
  const requiredVersion = '3.10.6';
  const pythonCheckCommand = 'py';
  const pythonCheckArgs = ['-3.10', '--version'];

  const checkProcess = spawn(pythonCheckCommand, pythonCheckArgs, {
    stdio: 'pipe',
  });

  checkProcess.stdout.on('data', async (data) => {
    const versionString = data.toString().trim();
    if (versionString.includes(requiredVersion)) {
      console.log(`Python ${requiredVersion} found`);
      callback(`Python ${requiredVersion} found`);
    } else {
      console.log(`Python ${requiredVersion} not found`);
      callback(`Python ${requiredVersion} not found`);
      await installPython(callback);
    }
  });

  checkProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    callback(`stderr: ${data}`);
  });

  checkProcess.on('error', (error) => {
    console.error(`Failed to start subprocess: ${error}`);
    callback(`Failed to start subprocess: ${error}`);
  });
};

const cloneStableDiffusionWebUI = async (
  callback: (message: string) => void,
) => {
  try {
    await simpleGit().clone(
      'https://github.com/AUTOMATIC1111/stable-diffusion-webui',
    );
    console.log('Installed stable diffusion web ui');
    callback('Installed stable diffusion web ui');
  } catch (error) {
    console.error('Failed to clone stable diffusion web ui:', error);
    callback(`Failed to clone stable diffusion web ui: ${error}`);
  }
};

// const uninstallChocolatey = () => {
//   const chocolateyUninstallCommand = 'choco uninstall chocolatey';
//   exec('choco --version', (chocoError) => {
//     if (!chocoError) {
//       console.log('attempting to uninstall choco');
//       // If Chocolatey is installed, uninstall it
//       exec(chocolateyUninstallCommand, (chocoUninstallError) => {
//         if (chocoUninstallError) {
//           console.error(
//             `Error uninstalling Chocolatey: ${chocoUninstallError}`,
//           );
//         } else {
//           console.log('Chocolatey uninstalled successfully');
//         }
//       });
//     } else {
//       console.log('Choco error', chocoError);
//     }
//   });
// };

const deleteStableDiffusionWebUI = () => {
  const deleteCommand = 'rmdir /s /q stable-diffusion-webui';
  sudo.exec(
    deleteCommand,
    {
      name: 'Your App Name',
      icns: 'assets/icon.icns', // (optional) path to .icns file
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error removing stable diffusion web ui: ${error}`);
        return;
      }

      if (stderr) {
        console.error(`Stderr removing stable diffusion web ui: ${stderr}`);
        return;
      }

      console.log(stdout);
    },
  );
};

const clearEnvironment = () => {
  console.log('starting Clear Environment');
  // uninstallChocolatey());
  deleteStableDiffusionWebUI();
  console.log('completed clear environment');
};

const sendUpdates = (event: IpcMainEvent, channel: string, message: string) => {
  event.reply(channel, message);
};

function launchStableDiffusionWebUI() {
  const cmd = spawn(
    'cmd.exe',
    [
      '/c',
      'start',
      'cmd.exe',
      '/k',
      'chdir ./stable-diffusion-webui && py -3.10 -m venv venv && .\\venv\\Scripts\\activate && webui-user.bat',
    ],
    {
      detached: true,
    },
  );

  cmd.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on('install-stable-diffusion', async (event) => {
  await checkAndInstallChocolatey((message: string) =>
    sendUpdates(event, 'execution-messages', message),
  );
  await cloneStableDiffusionWebUI((message: string) =>
    sendUpdates(event, 'execution-messages', message),
  );
  await checkAndInstallPython((message: string) =>
    sendUpdates(event, 'execution-messages', message),
  );
  event.reply(
    'install-stable-diffusion-reply',
    'message received, starting installation now',
  );
});

ipcMain.on('clear-environment', async (event) => {
  console.log('attempting to clear environment');
  clearEnvironment();
  event.reply(
    'clear-environment-reply',
    'received message to clear environment',
  );
});

ipcMain.on('launch-stable-diffusion', async () => {
  launchStableDiffusionWebUI();
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
