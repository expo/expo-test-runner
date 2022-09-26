import { Definitions } from 'dot';
import { Application, Dependency, Test } from '../Config';
import { Platform } from '../Platform';
import { ProjectFile } from '../TemplateFile';
export default class PresetTemplate {
    protected config: Application;
    protected name: string;
    protected platform: Platform;
    protected configFilePath: string;
    constructor(config: Application, name: string, platform: Platform, configFilePath: string);
    createApplicationAsync(projectPath: string): Promise<void>;
    protected getDefinitions(): Definitions;
    protected getDependencies(): Dependency[];
    protected getDevDependencies(): Dependency[];
    protected build(projectPath: string, test: Test): Promise<void>;
    protected run(projectPath: string, test: Test): Promise<void>;
    protected getTemplateFiles(): {
        [path: string]: ProjectFile;
    };
    protected userFilePath(relativePath: string): string;
    private resolveDependencies;
    protected copyFilesAsync(projectPath: string, files: {
        [path: string]: ProjectFile;
    }): Promise<void>;
    protected evaluateFiles(projectPath: string, files: {
        [path: string]: ProjectFile;
    }): Promise<void>;
    private resolvePath;
}
