import { exec } from 'child_process';

const getGpuInfo = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    exec('wmic path win32_VideoController get name', (error, stdout) => {
      if (error) {
        reject(new Error(`exec error: ${error}`));
        return;
      }

      const gpuNames = stdout
        .split('\r\r\n')
        .filter((line, index) => line && index > 0)
        .map((gpuName) => gpuName.trim());

      resolve(gpuNames);
    });
  });
};

export default getGpuInfo;
