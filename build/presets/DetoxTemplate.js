"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const BundlerController_1 = __importDefault(require("../BundlerController"));
const Platform_1 = require("../Platform");
const TemplateFile_1 = require("../TemplateFile");
const Utils_1 = require("../Utils");
const PresetTemplate_1 = __importDefault(require("./PresetTemplate"));
class DetoxPreset extends PresetTemplate_1.default {
    getDependencies() {
        return [
            ...super.getDependencies(),
            {
                name: 'detox',
                path: '19.1.0',
            },
        ];
    }
    getDefinitions() {
        return {
            ...super.getDefinitions(),
            appEntryPoint: this.config.appEntryPoint,
        };
    }
    getTemplateFiles() {
        var _a, _b;
        const tff = new TemplateFile_1.TemplateFilesFactory('detox');
        const additionalFiles = (_a = this.config.additionalFiles) === null || _a === void 0 ? void 0 : _a.reduce((reducer, file) => ({
            ...reducer,
            [file]: new TemplateFile_1.UserFile(this.userFilePath(file)),
        }), {});
        if ((_b = this.config.android) === null || _b === void 0 ? void 0 : _b.detoxTestFile) {
            additionalFiles['android/app/src/androidTest/java/com/testrunner/DetoxTest.java'] =
                new TemplateFile_1.UserFile(this.userFilePath(this.config.android.detoxTestFile), Platform_1.Platform.Android);
        }
        return {
            ...super.getTemplateFiles(),
            'android/build.gradle': tff.androidFile(),
            'android/app/build.gradle': tff.androidFile(),
            'android/app/src/androidTest/java/com/testrunner/DetoxTest.java': tff.androidFile(),
            'index.js': tff.file(true),
            [this.config.detoxConfigFile]: new TemplateFile_1.UserFile(this.userFilePath(this.config.detoxConfigFile), Platform_1.Platform.Both, true),
            ...additionalFiles,
        };
    }
    async build(projectPath, test) {
        for (const conf of test.configurations) {
            await spawn_async_1.default('yarn', ['detox', 'build', '-c', conf], {
                cwd: projectPath,
                stdio: 'inherit',
            });
        }
    }
    async run(projectPath, test) {
        let bundler;
        try {
            bundler = new BundlerController_1.default(projectPath);
            if (test.shouldRunBundler) {
                await bundler.start();
            }
            for (const conf of test.configurations) {
                await spawn_async_1.default('yarn', ['detox', 'test', '-c', conf, '--ci', '--headless', '--gpu', 'swiftshader_indirect'], {
                    cwd: projectPath,
                    stdio: 'inherit',
                });
                await Utils_1.killVirtualDevicesAsync(this.platform);
            }
        }
        finally {
            // If bundler wasn't started is noop.
            await (bundler === null || bundler === void 0 ? void 0 : bundler.stop());
        }
    }
}
exports.default = DetoxPreset;
//# sourceMappingURL=DetoxTemplate.js.map