export enum InstallationInfo {
  Success = 'Successfully installed',
  MissingDependency = 'Missing dependencies to install',
  AlreadyInstalled = 'Already installed',
  RestartRequired = 'Restart required',
}

export type DependencyStatus = {
  git: boolean;
  python: boolean;
  sdwebui: boolean;
  didAppInstallGit: boolean;
  didAppInstallPython: boolean;
  gpu: string[];
};
