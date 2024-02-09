import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import icon from '../../assets/icon.svg';
import './App.css';
import { InstallationStatus } from '../main/preload';

function Hello() {
  const [gpuInfo, setGpuInfo] = useState<string[]>([]);
  const [installationMessages, setInstallationMessages] = useState<string>('');
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

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
        const dependencyStatus = data as InstallationStatus;
        const status =
          dependencyStatus.git &&
          dependencyStatus.python &&
          dependencyStatus.sdwebui;
        setGpuInfo(dependencyStatus.gpu);
        setIsInstalled(status);
      },
    );

    const unsubscribeInstall = window.electron.ipcRenderer.on(
      'install-stable-diffusion-reply',
      (message) => {
        console.log(message);
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
      (message) => {
        console.log(message);
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
  const openWaitlistLink = () => {
    window.open(
      'https://docs.google.com/forms/d/e/1FAIpQLSfZjT1wTsmwqEgqI3uXN-U5dgoGA5r93f77KTfnGxB4B5L5Dw/viewform',
      '_blank',
    );
  };

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

      {isInstalled ? (
        <div className="button-group">
          <button
            type="button"
            onClick={handleLaunchStableDiffusion}
            disabled={isInstalling}
          >
            Launch Stable Diffusion
          </button>
          <button
            type="button"
            onClick={handleClearEnvironment}
            disabled={isInstalling}
          >
            Clear environment
          </button>
          <button
            type="button"
            onClick={handleViewAppData}
            disabled={isInstalling}
          >
            View app data
          </button>
          <div className="installation-messages">
            <textarea readOnly value={installationMessages} />
          </div>
        </div>
      ) : (
        <button
          className="button-group"
          type="button"
          onClick={handleInstallStableDiffusion}
          disabled={isInstalling}
        >
          Install Stable Diffusion
        </button>
      )}

      <div>
        <h3>GPUs detected</h3>

        <ul>
          {gpuInfo.map((gpu, index) => (
            <li
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  height: '10px',
                  width: '10px',
                  borderRadius: '50%',
                  marginRight: '10px',
                  backgroundColor: gpu.toLowerCase().includes('nvidia')
                    ? 'green'
                    : 'red',
                }}
              />
              {gpu}
            </li>
          ))}
        </ul>
        {hasNvidia && (
          <div>
            <p>No Nvidia GPUs were detected.</p>
            <p>
              Stable diffusion app only supports Windows computers with Nvidia
              gpus. We are working towards supporting more gpu types. Sign up
              for the{' '}
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={openWaitlistLink}
                onKeyDown={openWaitlistLink}
                role="button"
                tabIndex={0}
              >
                waitlist
              </span>{' '}
              so we know which gpu has the most demand!
            </p>
          </div>
        )}
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
