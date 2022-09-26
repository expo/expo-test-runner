import { Definitions } from 'dot';
import { ProjectFile } from '../TemplateFile';
import DetoxTemplate from './DetoxTemplate';
export default class CEATemplate extends DetoxTemplate {
    getDefinitions(): Definitions;
    createApplicationAsync(projectPath: string): Promise<void>;
    getTemplateFiles(): {
        [path: string]: ProjectFile;
    };
}
