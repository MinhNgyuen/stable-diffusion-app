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
  cloneStableDiffusionWebUI,
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

const clearEnvironment = async (callback: (message: string) => void) => {
  console.log('starting Clear Environment');
  // uninstallChocolatey());
  const res: string[] = [];
  const errs: Error[] = [];
  await deleteStableDiffusionWebUI(callback)
    .then((msg: string) => {
      res.push(msg);
    })
    .catch((err: Error) => {
      errs.push(err);
    });
  await uninstallPythonViaLocalBinary(pythonInstallerPath, callback)
    .then((msg: InstallationInfo) => {
      res.push(msg);
    })
    .catch((err: Error) => {
      errs.push(err);
    });
  await uninstallGitViaLocalBinary(callback)
    .then((msg: string) => {
      res.push(msg);
    })
    .catch((err: Error) => {
      errs.push(err);
    });
  callback(res.join('\n'));
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
  await checkAndInstallGit((message: string) => {
    sendUpdates(event, 'execution-messages', message);
  });
  await checkAndInstallPython((message: string) =>
    sendUpdates(event, 'execution-messages', message),
  );
  await cloneStableDiffusionWebUI((message: string) =>
    sendUpdates(event, 'execution-messages', message),
  );
  event.reply('install-stable-diffusion-reply', 'Installation complete');
});

ipcMain.on('get-configuration', async (event) => {
  const gitInstalled = await isGitInstalled((message: string) => {
    sendUpdates(event, 'execution-messages', message);
  });
  const didAppInstallGit = readSetting('didAppInstallGit');
  const pythonInstalled = await isPythonInstalled((message: string) =>
    sendUpdates(event, 'execution-messages', message),
  );
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

  event.reply('get-configuration-reply', status);
});

ipcMain.on('launch-stable-diffusion', async () => {
  launchStableDiffusionWebUI();
});

ipcMain.on('clear-environment', async (event) => {
  await clearEnvironment((message: string) => {
    sendUpdates(event, 'execution-messages', message);
  });
  event.reply(
    'clear-environment-reply',
    'received message to clear environment',
  );
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
