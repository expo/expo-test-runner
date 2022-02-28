import { Definitions } from 'dot';
import { Dependency, DetoxTest } from '../Config';
import { ProjectFile } from '../TemplateFile';
import PresetTemplate from './PresetTemplate';
export default class DetoxPreset extends PresetTemplate {
    getDependencies(): Dependency[];
    getDefinitions(): Definitions;
    getTemplateFiles(): {
        [path: string]: ProjectFile;
    };
    build(projectPath: string, test: DetoxTest): Promise<void>;
    run(projectPath: string, test: DetoxTest): Promise<void>;
}
