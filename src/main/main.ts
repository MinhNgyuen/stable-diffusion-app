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
import { spawn } from 'child_process';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import {
  checkAndInstallPython,
  isPythonInstalled,
  uninstallPythonViaLocalBinary,
} from '../components/InstallPython';
import {
  checkAndInstallGit,
  isGitInstalled,
  uninstallGitViaLocalBinary,
} from '../components/InstallGit';
import {
  checkAndInstallStableDiffusionWebUI,
  deleteStableDiffusionWebUI,
  isStableDiffusionWebUIInstalled,
} from '../components/InstallStableDiffusionWebUI';
import { pythonInstallerPath, sdwebuiPath } from './constants';
import { InstallationInfo, DependencyStatus } from '../shared/types';
import getGpuInfo from '../components/GetGpu';
import { readSetting } from '../components/SettingsFile';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const sendUpdates = (event: IpcMainEvent, channel: string, message: string) => {
  event.reply(channel, message);
};

const processInstallationInfo = (
  gitInstallInfo: InstallationInfo,
  pythonInstallInfo: InstallationInfo,
  sdInstallInfo: InstallationInfo,
  callback: (message: string) => void,
): InstallationInfo => {
  if (
    gitInstallInfo === InstallationInfo.RestartRequired ||
    pythonInstallInfo === InstallationInfo.RestartRequired ||
    sdInstallInfo === InstallationInfo.RestartRequired
  ) {
    app.relaunch();
    app.exit(0);
    return InstallationInfo.RestartRequired;
  }
  if (
    gitInstallInfo === InstallationInfo.Fail ||
    gitInstallInfo === InstallationInfo.MissingDependency ||
    pythonInstallInfo === InstallationInfo.Fail ||
    pythonInstallInfo === InstallationInfo.MissingDependency ||
    sdInstallInfo === InstallationInfo.Fail ||
    sdInstallInfo === InstallationInfo.MissingDependency
  ) {
    return InstallationInfo.Fail;
  }
  if (
    (gitInstallInfo === InstallationInfo.Success ||
      gitInstallInfo === InstallationInfo.AlreadyCompleted) &&
    (pythonInstallInfo === InstallationInfo.Success ||
      pythonInstallInfo === InstallationInfo.AlreadyCompleted) &&
    (sdInstallInfo === InstallationInfo.Success ||
      sdInstallInfo === InstallationInfo.AlreadyCompleted)
  ) {
    return InstallationInfo.Success;
  }
  const message = `Unusual installation status -> git: ${gitInstallInfo}, python: ${pythonInstallInfo}, sdwebui: ${sdInstallInfo}`;
  callback(message);
  return InstallationInfo.Success;
};

const clearEnvironment = async (
  callback: (message: string) => void,
): Promise<InstallationInfo> => {
  console.log('starting Clear Environment');
  const res: string[] = [];
  const errs: Error[] = [];
  const sdUninstallInfo = await deleteStableDiffusionWebUI(callback).catch(
    (err: Error) => {
      errs.push(err);
      return InstallationInfo.Fail;
    },
  );
  const gitUninstallInfo = await uninstallGitViaLocalBinary(callback).catch(
    (err: Error) => {
      errs.push(err);
      return InstallationInfo.Fail;
    },
  );
  const pythonUninstallInfo = await uninstallPythonViaLocalBinary(
    pythonInstallerPath,
    callback,
  ).catch((err: Error) => {
    errs.push(err);
    return InstallationInfo.Fail;
  });
  callback(res.join('\n'));
  return processInstallationInfo(
    gitUninstallInfo,
    pythonUninstallInfo,
    sdUninstallInfo,
    callback,
  );
};

const openUserDataInExplorer = () => {
  shell
    .openPath(sdwebuiPath)
    .then((err) => {
      if (err) {
        console.error('Failed to open file explorer:', err);
      }
    })
    .catch((error) => {
      console.error(
        'An error occurred while opening the file explorer:',
        error,
      );
    });
};

function launchStableDiffusionWebUI() {
  const cmd = spawn(
    'cmd.exe',
    [
      '/c',
      'start',
      'cmd.exe',
      '/k',
      `chdir ${sdwebuiPath} && py -3.10 -m venv venv && .\\venv\\Scripts\\activate && webui-user.bat`,
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
  const gitInstallInfo = await checkAndInstallGit((message: string) => {
    sendUpdates(event, 'execution-messages', message);
  });
  const pythonInstallInfo = await checkAndInstallPython((message: string) =>
    sendUpdates(event, 'execution-messages', message),
  );
  const sdInstallInfo = await checkAndInstallStableDiffusionWebUI(
    (message: string) => sendUpdates(event, 'execution-messages', message),
  );
  const processedInfo = processInstallationInfo(
    gitInstallInfo,
    pythonInstallInfo,
    sdInstallInfo,
    (message: string) => sendUpdates(event, 'execution-messages', message),
  );

  event.reply('install-stable-diffusion-reply', processedInfo);
});

ipcMain.on('get-configuration', async (event) => {
  const gitInstalled = await isGitInstalled(() => {});
  const didAppInstallGit = readSetting('didAppInstallGit');
  const pythonInstalled = await isPythonInstalled(() => {});
  const didAppInstallPython = readSetting('didAppInstallPython');
  const repoCloned = await isStableDiffusionWebUIInstalled();

  const gpuInfo = await getGpuInfo();

  const status: DependencyStatus = {
    git: gitInstalled,
    python: pythonInstalled,
    sdwebui: repoCloned,
    gpu: gpuInfo,
    didAppInstallGit: didAppInstallGit === 'true',
    didAppInstallPython: didAppInstallPython === 'true',
  };

  sendUpdates(
    event,
    'execution-messages',
    `Git is installed: ${gitInstalled}\nPython is installed: ${pythonInstalled}\nStable Diffusion WebUI is installed: ${repoCloned}\nGPUs detected: ${gpuInfo}`,
  );

  event.reply('get-configuration-reply', status);
});

ipcMain.on('launch-stable-diffusion', async () => {
  launchStableDiffusionWebUI();
});

ipcMain.on('clear-environment', async (event) => {
  const uninstallInfo = await clearEnvironment((message: string) => {
    sendUpdates(event, 'execution-messages', message);
  });
  event.reply('clear-environment-reply', uninstallInfo);
});

ipcMain.on('view-app-data', async (event) => {
  console.log('launching file explorer window');
  openUserDataInExplorer();
  event.reply('view-app-data', 'received message to view app data');
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
    show: true,
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
