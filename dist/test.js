"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
//resxConv('./test/', 'resOut', {defaultResxCulture: 'de', mergeCulturesToSingleFile: true, generateTypeScriptResourceManager: true, searchRecursive: true });
//resxConv(['./test/P3JS.en.resx'], 'resOut', {defaultResxCulture: 'de', mergeCulturesToSingleFile: true, generateTypeScriptResourceManager: true, searchRecursive: true });
(0, index_1.convertResx)(['./test/P3JS.en.resx', './test/P3JS.resx'], 'resOut', {
    defaultResxCulture: 'de',
    mergeCulturesToSingleFile: true,
    generateTypeScriptResourceManager: true,
    searchRecursive: true,
    startDynamicTokenChars: '{{',
    endDynamicTokenChars: '}}',
    ressourcesManagerName: 'test'
});
//# sourceMappingURL=test.js.map