import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import icon from '../../assets/icon.svg';
import './App.css';
import { DependencyStatus } from '../main/preload';
import GPUWarningDrawer from '../components/WarningDrawer';
import GPUWarning from '../components/GpuWarning';

function Hello() {
  const [gpuInfo, setGpuInfo] = useState<string[]>([]);
  const [installationMessages, setInstallationMessages] = useState<string>('');
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [hasClearableData, setHasClearableData] = useState<boolean>(false);

  const getConfiguration = () => {
    window.electron.ipcRenderer.sendMessage('get-configuration');
  };

  const beginExecution = () => {
    setInstallationMessages('');
    setIsInstalling(true);
  };

  const completeExecution = () => {
    setIsInstalling(false);
  };

  const handleInstallStableDiffusion = () => {
    beginExecution();
    window.electron.ipcRenderer.sendMessage('install-stable-diffusion');
  };

  const handleLaunchStableDiffusion = () => {
    setInstallationMessages('');
    window.electron.ipcRenderer.sendMessage('launch-stable-diffusion');
  };

  const handleClearEnvironment = () => {
    setInstallationMessages('');
    window.electron.ipcRenderer.sendMessage('clear-environment');
  };

  const handleViewAppData = () => {
    setInstallationMessages('');
    window.electron.ipcRenderer.sendMessage('view-app-data');
  };

  useEffect(() => {
    const unsubscribeCheck = window.electron.ipcRenderer.on(
      'get-configuration-reply',
      (data) => {
        const dependencyStatus = data as DependencyStatus;
        const status =
          dependencyStatus.git &&
          dependencyStatus.python &&
          dependencyStatus.sdwebui;
        setGpuInfo(dependencyStatus.gpu);
        const clearable =
          (dependencyStatus.didAppInstallGit && dependencyStatus.git) ||
          (dependencyStatus.didAppInstallPython && dependencyStatus.python) ||
          dependencyStatus.sdwebui;
        setHasClearableData(clearable);
        setIsInstalled(status);
      },
    );

    const unsubscribeInstall = window.electron.ipcRenderer.on(
      'install-stable-diffusion-reply',
      () => {
        completeExecution();
        getConfiguration();
      },
    );

    const unsubscribeProgress = window.electron.ipcRenderer.on(
      'execution-messages',
      (message) => {
        setInstallationMessages(
          (prevMessages: string) => `${prevMessages}\n${message}`,
        );
      },
    );

    const unsubscribeClearEnvironment = window.electron.ipcRenderer.on(
      'clear-environment-reply',
      () => {
        getConfiguration();
      },
    );

    getConfiguration();

    return () => {
      unsubscribeCheck();
      unsubscribeInstall();
      unsubscribeProgress();
      unsubscribeClearEnvironment();
    };
  }, []);

  const hasNvidia = gpuInfo.some((gpu) => gpu.toLowerCase().includes('nvidia'));

  return (
    <div className="component-container">
      <div className="Hello">
        <img
          width="200"
          alt="icon"
          src={icon}
          className={isInstalling ? 'spin' : ''}
        />
      </div>
      <h1 className="app-title">Stable diffusion app</h1>
      <div className="button-group">
        {isInstalled ? (
          <div>
            <button
              type="button"
              onClick={handleLaunchStableDiffusion}
              disabled={isInstalling}
            >
              Launch Stable Diffusion
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleInstallStableDiffusion}
            disabled={isInstalling}
          >
            Install Stable Diffusion
          </button>
        )}
        {hasClearableData && (
          <>
            <button
              type="button"
              onClick={handleClearEnvironment}
              disabled={isInstalling}
            >
              Clear data
            </button>
            <button
              type="button"
              onClick={handleViewAppData}
              disabled={isInstalling}
            >
              View data
            </button>
          </>
        )}
      </div>

      <div className="installation-messages">
        <textarea readOnly value={installationMessages} />
      </div>
      <br />
      <div>
        {!hasNvidia &&
          (isInstalled ? (
            <GPUWarningDrawer anchor="bottom" gpus={gpuInfo} />
          ) : (
            <div>
              <br />
              <GPUWarning gpus={gpuInfo} />
            </div>
          ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
