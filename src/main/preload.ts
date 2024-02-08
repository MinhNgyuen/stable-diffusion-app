// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels =
  | 'ipc-example'
  | 'install-stable-diffusion'
  | 'install-stable-diffusion-reply'
  | 'clear-environment'
  | 'clear-environment-reply'
  | 'launch-stable-diffusion'
  | 'execution-messages'
  | 'view-app-data'
  | 'view-app-data-reply'
  | 'check-installation'
  | 'check-installation-reply';

export type InstallationStatus = {
  git: boolean;
  python: boolean;
  sdwebui: boolean;
};

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
