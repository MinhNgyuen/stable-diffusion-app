import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import icon from '../../assets/icon.svg';
import './App.css';

function Hello() {
  const [installationMessages, setInstallationMessages] = useState<string>('');
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

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
    const unsubscribeInstall = window.electron.ipcRenderer.on(
      'install-stable-diffusion-reply',
      (message) => {
        console.log(message);
        console.log('Installation complete STOP SPINNING');
        completeExecution();
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
      },
    );

    return () => {
      unsubscribeInstall();
      unsubscribeProgress();
      unsubscribeClearEnvironment();
    };
  }, []);

  return (
    <div>
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
        <button
          type="button"
          onClick={handleInstallStableDiffusion}
          disabled={isInstalling}
        >
          Install Stable Diffusion
        </button>
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
      </div>
      <div className="installation-messages">
        <textarea
          readOnly
          value={installationMessages}
          style={{ width: '100%', height: '100px', marginTop: '20px' }}
        />
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
