"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function createProjectAsync() {
    console.log('cos');
}
exports.default = (program) => {
    program
        .command('create-project')
        .option('--configuration [string]', 'Project configuration')
        .action(createProjectAsync);
};
//# sourceMappingURL=create-project.js.map