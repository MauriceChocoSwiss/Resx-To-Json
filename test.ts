import {convertResx} from './index';
//resxConv('./test/', 'resOut', {defaultResxCulture: 'de', mergeCulturesToSingleFile: true, generateTypeScriptResourceManager: true, searchRecursive: true });

//resxConv(['./test/P3JS.en.resx'], 'resOut', {defaultResxCulture: 'de', mergeCulturesToSingleFile: true, generateTypeScriptResourceManager: true, searchRecursive: true });
convertResx(['./test/P3JS.en.resx', './test/P3JS.resx'], 'resOut', {
    defaultResxCulture: 'de',
    mergeCulturesToSingleFile: true,
    generateTypeScriptResourceManager: true,
    searchRecursive: true,
    startDynamicTokenChars: '{{',
    endDynamicTokenChars: '}}',
    ressourcesManagerName: 'test',
    withCustomCultureStore: false
});