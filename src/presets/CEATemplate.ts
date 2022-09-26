import spawnAsync from '@expo/spawn-async';
import { Definitions } from 'dot';
import fs from 'fs';
import path from 'path';

import { Platform } from '../Platform';
import { ProjectFile, TemplateFilesFactory, UserFile } from '../TemplateFile';
import DetoxTemplate from './DetoxTemplate';

export default class CEATemplate extends DetoxTemplate {
  override getDefinitions(): Definitions {
    return {
      name: 'devcliente2e',
      appEntryPoint: 'e2e/app/App',
    };
  }

  override async createApplicationAsync(projectPath: string) {
    // TODO: this assumes there is a parent folder
    const parentFolder = path.resolve(projectPath, '..');
    if (!fs.existsSync(parentFolder)) {
      fs.mkdirSync(parentFolder, { recursive: true });
    }

    const appName = 'dev-client-e2e';
    await spawnAsync('yarn', ['create', 'expo-app', appName], {
      stdio: 'inherit',
      cwd: parentFolder,
    });
    fs.renameSync(path.join(parentFolder, appName), projectPath);

    await spawnAsync('yarn', ['expo', 'install', 'detox', 'jest'], {
      stdio: 'inherit',
      cwd: projectPath,
    });

    // add local dependencies
    const repoRoot = path.resolve(this.configFilePath, '..', '..', '..');
    let packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'));
    packageJson = {
      ...packageJson,
      dependencies: {
        ...packageJson.dependencies,
        'expo-dev-client': `file:${repoRoot}/packages/expo-dev-client`,
        'expo-dev-menu-interface': `file:${repoRoot}/packages/expo-dev-menu-interface`,
        'expo-status-bar': `file:${repoRoot}/packages/expo-status-bar`,
        expo: `file:${repoRoot}/packages/expo`,
        'jest-circus': packageJson.dependencies.jest,
      },
      resolutions: {
        ...packageJson.resolutions,
        'expo-application': `file:${repoRoot}/packages/expo-application`,
        'expo-asset': `file:${repoRoot}/packages/expo-asset`,
        'expo-constants': `file:${repoRoot}/packages/expo-constants`,
        'expo-dev-launcher': `file:${repoRoot}/packages/expo-dev-launcher`,
        'expo-dev-menu': `file:${repoRoot}/packages/expo-dev-menu`,
        'expo-error-recovery': `file:${repoRoot}/packages/expo-error-recovery`,
        'expo-file-system': `file:${repoRoot}/packages/expo-file-system`,
        'expo-font': `file:${repoRoot}/packages/expo-font`,
        'expo-keep-awake': `file:${repoRoot}/packages/expo-keep-awake`,
        'expo-manifests': `file:${repoRoot}/packages/expo-manifests`,
        'expo-modules-autolinking': `file:${repoRoot}/packages/expo-modules-autolinking`,
        'expo-modules-core': `file:${repoRoot}/packages/expo-modules-core`,
        'expo-updates-interface': `file:${repoRoot}/packages/expo-updates-interface`,
      },
    };
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2),
      'utf-8'
    );

    // configure app.json
    let appJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'app.json'), 'utf-8'));
    appJson = {
      ...appJson,
      expo: {
        ...appJson.expo,
        android: { ...appJson.android, package: 'com.testrunner' },
        ios: { ...appJson.ios, bundleIdentifier: 'com.testrunner' },
      },
    };
    fs.writeFileSync(path.join(projectPath, 'app.json'), JSON.stringify(appJson, null, 2), 'utf-8');

    await spawnAsync('yarn', ['expo', 'prebuild'], {
      stdio: 'inherit',
      cwd: projectPath,
    });

    const templateFiles = this.getTemplateFiles();
    await this.copyFilesAsync(projectPath, templateFiles);
    await this.evaluateFiles(projectPath, templateFiles);

    // workaround for instrumented unit test files not compiling in this
    // configuration (ignored in .npmignore)
    await spawnAsync('rm', ['-rf', 'node_modules/expo-dev-client/android/src/androidTest'], {
      stdio: 'inherit',
      cwd: projectPath,
    });
  }

  override getTemplateFiles(): { [path: string]: ProjectFile } {
    const tff = new TemplateFilesFactory('detox-cea');

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
      'android/build.gradle': tff.androidFile(),
      'android/app/build.gradle': tff.androidFile(),
      'android/app/src/androidTest/java/com/testrunner/DetoxTest.java': tff.androidFile(),
      'android/app/src/main/java/com/testrunner/MainApplication.java': tff.androidFile(),
      'index.js': tff.file(true),
      'ios/devcliente2e/main.m': tff.iosFile(),
      [this.config.detoxConfigFile]: new UserFile(
        this.userFilePath(this.config.detoxConfigFile),
        Platform.Both,
        true
      ),
      ...additionalFiles,
    };
  }
}
