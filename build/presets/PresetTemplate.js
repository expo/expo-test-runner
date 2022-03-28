"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const fs = __importStar(require("fs-extra"));
const path_1 = require("path");
const Paths_1 = require("../Paths");
const Platform_1 = require("../Platform");
const TemplateEvaluator_1 = __importDefault(require("../TemplateEvaluator"));
const TemplateFile_1 = require("../TemplateFile");
const Utils_1 = require("../Utils");
class PresetTemplate {
    constructor(config, name, platform, configFilePath) {
        this.config = config;
        this.name = name;
        this.platform = platform;
        this.configFilePath = configFilePath;
    }
    async createApplicationAsync(projectPath) {
        if (!fs.existsSync(projectPath)) {
            await fs.mkdir(projectPath, { recursive: true });
        }
        const templateFiles = Object.fromEntries(Object.entries(this.getTemplateFiles()).filter(([_, info]) => (info.platform & this.platform) > 0));
        await this.copyFilesAsync(projectPath, templateFiles);
        await this.evaluateFiles(projectPath, templateFiles);
        Utils_1.yarnInstall(projectPath);
        if ((this.platform & Platform_1.Platform.iOS) > 0) {
            await spawn_async_1.default('yarn', [
                '--silent',
                'run',
                'xcodegen',
                '--quiet',
                '--spec',
                path_1.join(projectPath, 'ios', 'project.yml'),
            ], {
                cwd: Paths_1.SelfPath,
                stdio: 'inherit',
            });
            await spawn_async_1.default('pod', ['install'], { cwd: path_1.join(projectPath, 'ios'), stdio: 'inherit' });
        }
    }
    getDefinitions() {
        return {
            ...this.config,
            name: this.name,
            dependencies: this.getDependencies(),
            devDependencies: this.getDevDependencies(),
        };
    }
    getDependencies() {
        return this.resolveDependencies();
    }
    getDevDependencies() {
        return [];
    }
    async build(projectPath, test) { }
    async run(projectPath, test) { }
    getTemplateFiles() {
        var _a, _b, _c, _d;
        const tff = new TemplateFile_1.TemplateFilesFactory('basic');
        const overrides = {};
        if ((_a = this.config.android) === null || _a === void 0 ? void 0 : _a.mainActivity) {
            overrides['android/app/src/main/java/com/testrunner/MainActivity.java'] = new TemplateFile_1.UserFile(this.userFilePath(this.config.android.mainActivity), Platform_1.Platform.Android);
        }
        if ((_b = this.config.android) === null || _b === void 0 ? void 0 : _b.mainApplication) {
            overrides['android/app/src/main/java/com/testrunner/MainApplication.java'] = new TemplateFile_1.UserFile(this.userFilePath(this.config.android.mainApplication), Platform_1.Platform.Android);
        }
        if ((_c = this.config.ios) === null || _c === void 0 ? void 0 : _c.appDelegateHeader) {
            overrides['ios/src/AppDelegate.h'] = new TemplateFile_1.UserFile(this.userFilePath(this.config.ios.appDelegateHeader), Platform_1.Platform.iOS);
        }
        if ((_d = this.config.ios) === null || _d === void 0 ? void 0 : _d.appDelegate) {
            overrides['ios/src/AppDelegate.m'] = new TemplateFile_1.UserFile(this.userFilePath(this.config.ios.appDelegate), Platform_1.Platform.iOS);
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
    userFilePath(relativePath) {
        return path_1.join(this.configFilePath, '..', relativePath);
    }
    resolveDependencies() {
        var _a, _b;
        return ((_b = (_a = this.config.dependencies) === null || _a === void 0 ? void 0 : _a.map(dependency => ({
            ...dependency,
            path: this.resolvePath(dependency.path),
        }))) !== null && _b !== void 0 ? _b : []);
    }
    async copyFilesAsync(projectPath, files) {
        await Promise.all(Object.entries(files).map(([path, file]) => file.copy(projectPath, path)));
    }
    async evaluateFiles(projectPath, files) {
        const templateEvaluator = new TemplateEvaluator_1.default(this.getDefinitions());
        await Promise.all(Object.entries(files).map(([path, file]) => file.evaluate(projectPath, path, templateEvaluator)));
    }
    resolvePath(relativePath) {
        return 'file://' + fs.realpathSync(path_1.join(this.configFilePath, '..', relativePath));
    }
}
exports.default = PresetTemplate;
//# sourceMappingURL=PresetTemplate.js.map