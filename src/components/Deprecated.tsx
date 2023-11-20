import * as fs from 'fs';
import path from 'path';
import axios from 'axios';
import https from 'https';
import { exec } from 'child_process';
import sudo from 'sudo-prompt';
import { userDataPath } from '../main/constants';

const downloadFile = (url: string, dest: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err.message);
      });
  });
};

const downloadFileAxios = (url: string, dest: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axios({
      method: 'GET',
      url,
      responseType: 'stream',
    })
      .then((response) => {
        const writer = fs.createWriteStream(dest);
        response.data.pipe(writer);
        writer.on('finish', () => {
          writer.close();
          resolve();
        });
        writer.on('error', (error) => {
          reject(error);
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const isChocolateyInstalled = (
  callback: (message: string) => void,
): Promise<boolean> => {
  return new Promise((resolve) => {
    const chocoCheckCommand = 'choco --version';

    exec(chocoCheckCommand, (error) => {
      if (error) {
        console.log(`Chocolatey is not installed: ${error}`);
        callback(`Chocolatey is not installed: ${error}`);
        resolve(false);
      } else {
        console.log('Chocolatey is already installed');
        callback('Chocolatey is already installed');
        resolve(true);
      }
    });
  });
};

const installChocolatey = (
  callback: (message: string) => void,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(userDataPath, 'install-choco.ps1');
    const chocoInstallScript = `
      Set-ExecutionPolicy Bypass -Scope Process -Force;
      [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;
      iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    `;
    const chocoInstallCommand = `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`;

    // Write the PowerShell script to a file
    fs.writeFileSync(scriptPath, chocoInstallScript);

    sudo.exec(
      chocoInstallCommand,
      { name: 'Your Application Name' },
      (sudoError, sudoStdout) => {
        if (sudoError) {
          console.error(`exec error: ${sudoError}`);
          callback(`exec error: ${sudoError}`);
          reject(sudoError);
          return;
        }
        console.log(`Chocolatey installed successfully: ${sudoStdout}`);
        callback(`Chocolatey installed successfully: ${sudoStdout}`);
        resolve();

        try {
          fs.unlinkSync(scriptPath);
          console.log('Installation script deleted successfully.');
        } catch (deleteError) {
          console.error('Error deleting installation script:', deleteError);
        }
      },
    );
  });
};

// const checkAndInstallChocolatey = (
//   callback: (message: string) => void,
// ): Promise<void> => {
//   return new Promise((resolve, reject) => {
//     isChocolateyInstalled(callback)
//       .then((isInstalled) => {
//         if (!isInstalled) {
//           console.log('Starting Chocolatey installation...');
//           installChocolatey(callback)
//             .then(() => {
//               console.log('Chocolatey installation completed');
//               resolve();
//             })
//             .catch((error) => {
//               console.error('Error installing Chocolatey:', error);
//               reject(error);
//             });
//         } else {
//           console.log(
//             'No need to install Chocolatey, it is already installed.',
//           );
//           resolve();
//         }
//       })
//       .catch((error) => {
//         console.error('Error checking Chocolatey installation:', error);
//         reject(error);
//       });
//   });
// };

// const checkAndInstallChocolatey = (
//   callback: (message: string) => void,
// ): Promise<void> => {
//   return new Promise((resolve, reject) => {
//     const chocoCheckCommand = 'choco --version';
//     const scriptPath = path.join(userDataPath, 'install-choco.ps1');
//     const chocoInstallScript = `
//       Set-ExecutionPolicy Bypass -Scope Process -Force;
//       [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;
//       iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
//     `;

//     // Write the PowerShell script to a file
//     fs.writeFileSync(scriptPath, chocoInstallScript);

//     callback('Checking if Chocolatey is installed');
//     exec(chocoCheckCommand, (error, stdout) => {
//       if (error) {
//         console.error(`Chocolatey is not installed. Installing Chocolatey...`);
//         callback(`Chocolatey is not installed. Installing Chocolatey...`);
//         const chocoInstallCommand = `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`;

//         sudo.exec(
//           chocoInstallCommand,
//           { name: 'Your Application Name' },
//           (sudoError, sudoStdout) => {
//             if (sudoError) {
//               console.error(`exec error: ${sudoError}`);
//               callback(`exec error: ${sudoError}`);
//               reject(sudoError);
//               return;
//             }
//             console.log(`Chocolatey installed successfully: ${sudoStdout}`);
//             callback(`Chocolatey installed successfully: ${sudoStdout}`);
//             resolve();

//             try {
//               fs.unlinkSync(scriptPath);
//               console.log('Installation script deleted successfully.');
//             } catch (deleteError) {
//               console.error('Error deleting installation script:', deleteError);
//             }
//           },
//         );
//       } else {
//         console.log(`Chocolatey is already installed: ${stdout}`);
//         callback(`Chocolatey is already installed.`);
//         resolve();
//       }
//     });
//   });
// };

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

export {
  downloadFile,
  downloadFileAxios,
  isChocolateyInstalled,
  installChocolatey,
  // checkAndInstallChocolatey,
  // uninstallChocolatey,
};
