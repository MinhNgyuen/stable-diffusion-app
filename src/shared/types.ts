export enum InstallationInfo {
  Success = 'Successfully',
  AlreadyCompleted = 'Already complete',
  RestartRequired = 'Restart required',
  Fail = 'Failed',
  MissingDependency = 'Missing dependencies',
}

export type DependencyStatus = {
  git: boolean;
  python: boolean;
  sdwebui: boolean;
  didAppInstallGit: boolean;
  didAppInstallPython: boolean;
  gpu: string[];
};
