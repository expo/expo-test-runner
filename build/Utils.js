"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.yarnInstall = void 0;
const child_process_1 = require("child_process");
function yarnInstall(path) {
    child_process_1.spawnSync('yarn', ['install', '--silent'], { stdio: 'inherit', cwd: path });
}
exports.yarnInstall = yarnInstall;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
exports.delay = delay;
//# sourceMappingURL=Utils.js.map