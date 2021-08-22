import spawnAsync from '@expo/spawn-async';
import { Definitions } from 'dot';

import BundlerController from '../BundlerController';
import { Dependency, DetoxTest } from '../Config';
import { Platform } from '../Platform';
import { ProjectFile, TemplateFilesFactory, UserFile } from '../TemplateFile';
import { killVirtualDevicesAsync } from '../Utils';
import PresetTemplate from './PresetTemplate';

export default class DetoxPreset extends PresetTemplate {
  override getDependencies(): Dependency[] {
    return [
      ...super.getDependencies(),
      {
        name: 'detox',
        path: '18.20.1',
      },
    ];
  }

  override getDevDependencies(): Dependency[] {
    return [
      ...super.getDevDependencies(),
      {
        name: '@types/react-native',
        path: this.config.reactNativeVersion,
      },
    ];
  }

  override getDefinitions(): Definitions {
    return {
      ...super.getDefinitions(),
      appEntryPoint: this.config.appEntryPoint,
    };
  }
  override getTemplateFiles(): { [path: string]: ProjectFile } {
    const tff = new TemplateFilesFactory('detox');

    const additionalFiles: { [path: string]: ProjectFile } = this.config.additionalFiles?.reduce(
      (reducer, file) => ({
        ...reducer,
        [file]: new UserFile(this.userFilePath(file)),
      }),
      {}
    );

    if (this.config.android?.detoxTestFile) {
      additionalFiles['android/app/src/androidTest/java/com/testrunner/DetoxTest.java'] =
        new UserFile(this.userFilePath(this.config.android.detoxTestFile), Platform.Android);
    }

    return {
      ...super.getTemplateFiles(),
      'android/build.gradle': tff.androidFile(),
      'android/app/build.gradle': tff.androidFile(),
      'android/app/src/androidTest/java/com/testrunner/DetoxTest.java': tff.androidFile(),
      'index.js': tff.file(true),
      [this.config.detoxConfigFile]: new UserFile(this.userFilePath(this.config.detoxConfigFile)),
      ...additionalFiles,
    };
  }

  override async build(projectPath: string, test: DetoxTest): Promise<void> {
    for (const conf of test.configurations) {
      await spawnAsync('yarn', ['detox', 'build', '-c', conf], {
        cwd: projectPath,
        stdio: 'inherit',
      });
    }
  }

  override async run(projectPath: string, test: DetoxTest): Promise<void> {
    let bundler: BundlerController | undefined;
    try {
      bundler = new BundlerController(projectPath);

      if (test.shouldRunBundler) {
        await bundler.start();
      }

      for (const conf of test.configurations) {
        await spawnAsync(
          'yarn',
          ['detox', 'test', '-c', conf, '--ci', '--headless', '--gpu', 'swiftshader_indirect'],
          {
            cwd: projectPath,
            stdio: 'inherit',
          }
        );

        await killVirtualDevicesAsync(this.platform);
      }
    } finally {
      // If bundler wasn't started is noop.
      await bundler?.stop();
    }
  }
}
