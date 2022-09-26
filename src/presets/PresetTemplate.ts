import spawnAsync from '@expo/spawn-async';
import { Definitions } from 'dot';
import * as fs from 'fs-extra';
import { join } from 'path';

import { Application, Dependency, Test } from '../Config';
import { SelfPath } from '../Paths';
import { Platform } from '../Platform';
import TemplateEvaluator from '../TemplateEvaluator';
import { ProjectFile, TemplateFilesFactory, UserFile } from '../TemplateFile';
import { yarnInstall } from '../Utils';

export default class PresetTemplate {
  constructor(
    protected config: Application,
    protected name: string,
    protected platform: Platform,
    protected configFilePath: string
  ) {}

  async createApplicationAsync(projectPath: string) {
    if (!fs.existsSync(projectPath)) {
      await fs.mkdir(projectPath, { recursive: true });
    }

    const templateFiles = Object.fromEntries(
      Object.entries(this.getTemplateFiles()).filter(
        ([_, info]) => (info.platform & this.platform) > 0
      )
    );

    await this.copyFilesAsync(projectPath, templateFiles);
    await this.evaluateFiles(projectPath, templateFiles);

    yarnInstall(projectPath);

    if ((this.platform & Platform.iOS) > 0) {
      await spawnAsync(
        'yarn',
        [
          '--silent',
          'run',
          'xcodegen',
          '--quiet',
          '--spec',
          join(projectPath, 'ios', 'project.yml'),
        ],
        {
          cwd: SelfPath,
          stdio: 'inherit',
        }
      );

      await spawnAsync('pod', ['install'], { cwd: join(projectPath, 'ios'), stdio: 'inherit' });
    }
  }

  protected getDefinitions(): Definitions {
    return {
      ...this.config,
      name: this.name,
      dependencies: this.getDependencies(),
      devDependencies: this.getDevDependencies(),
    };
  }

  protected getDependencies(): Dependency[] {
    return this.resolveDependencies();
  }

  protected getDevDependencies(): Dependency[] {
    return [];
  }

  protected async build(projectPath: string, test: Test) {}

  protected async run(projectPath: string, test: Test) {}

  protected getTemplateFiles(): { [path: string]: ProjectFile } {
    const tff = new TemplateFilesFactory('basic');

    const overrides: { [path: string]: ProjectFile } = {};
    if (this.config.android?.mainActivity) {
      overrides['android/app/src/main/java/com/testrunner/MainActivity.java'] = new UserFile(
        this.userFilePath(this.config.android.mainActivity),
        Platform.Android
      );
    }

    if (this.config.android?.mainApplication) {
      overrides['android/app/src/main/java/com/testrunner/MainApplication.java'] = new UserFile(
        this.userFilePath(this.config.android.mainApplication),
        Platform.Android
      );
    }

    if (this.config.ios?.appDelegateHeader) {
      overrides['ios/src/AppDelegate.h'] = new UserFile(
        this.userFilePath(this.config.ios.appDelegateHeader),
        Platform.iOS
      );
    }

    if (this.config.ios?.appDelegate) {
      overrides['ios/src/AppDelegate.m'] = new UserFile(
        this.userFilePath(this.config.ios.appDelegate),
        Platform.iOS
      );
    }

    return {
      'babel.config.js': tff.file(),
      'tsconfig.json': tff.file(),
      'package.json': tff.file(true),
      'android/build.gradle': tff.androidFile(),
      'android/gradle.properties': tff.androidFile(),
      'android/gradlew': tff.androidFile(),
      'android/gradlew.bat': tff.androidFile(),
      'android/settings.gradle': tff.androidFile(true),
      'android/gradle/': tff.androidFile(),
      'android/app/build_defs.bzl': tff.androidFile(),
      'android/app/build.gradle': tff.androidFile(),
      'android/app/debug.keystore': tff.androidFile(),
      'android/app/proguard-rules.pro': tff.androidFile(),
      'android/app/src/main/java/com/testrunner/MainActivity.java': tff.androidFile(),
      'android/app/src/main/java/com/testrunner/MainApplication.java': tff.androidFile(),
      'android/app/src/main/AndroidManifest.xml': tff.androidFile(true),
      'android/app/src/main/res/': tff.androidFile(),
      'ios/src/Images.xcassets': tff.iosFile(),
      'ios/src/AppDelegate.h': tff.iosFile(),
      'ios/src/AppDelegate.m': tff.iosFile(),
      'ios/src/Info.plist': tff.iosFile(true),
      'ios/src/LaunchScreen.storyboard': tff.iosFile(true),
      'ios/src/main.m': tff.iosFile(),
      'ios/project.yml': tff.iosFile(true),
      'ios/Podfile': tff.iosFile(true),
      'ios/src/dummy.swift': tff.iosFile(),
      ...overrides,
    };
  }

  protected userFilePath(relativePath: string): string {
    return join(this.configFilePath, '..', relativePath);
  }

  private resolveDependencies(): Dependency[] {
    return (
      this.config.dependencies?.map(dependency => ({
        ...dependency,
        path: this.resolvePath(dependency.path),
      })) ?? []
    );
  }

  protected async copyFilesAsync(projectPath: string, files: { [path: string]: ProjectFile }) {
    await Promise.all(Object.entries(files).map(([path, file]) => file.copy(projectPath, path)));
  }

  protected async evaluateFiles(projectPath: string, files: { [path: string]: ProjectFile }) {
    const templateEvaluator = new TemplateEvaluator(this.getDefinitions());
    await Promise.all(
      Object.entries(files).map(([path, file]) =>
        file.evaluate(projectPath, path, templateEvaluator)
      )
    );
  }

  private resolvePath(relativePath: string): string {
    return 'file://' + fs.realpathSync(join(this.configFilePath, '..', relativePath));
  }
}
