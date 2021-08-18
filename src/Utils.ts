import { spawnSync } from 'child_process';

export function yarnInstall(path: string) {
  spawnSync('yarn', ['install', '--silent'], { stdio: 'inherit', cwd: path });
}

export const delay: (ms: number) => Promise<void> = ms =>
  new Promise(resolve => setTimeout(resolve, ms));
