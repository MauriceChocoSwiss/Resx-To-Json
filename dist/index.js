import * as fs from 'fs';
import * as path from 'path';
import fileSeek from 'fileseek_plus';
import { Parser as XmlParser } from 'xml2js';
class Options {
    mergeCulturesToSingleFile = true;
    generateTypeScriptResourceManager = true;
    searchRecursive = false;
    defaultResxCulture = 'en';
    ressourcesManagerName = '';
    startDynamicTokenChars = '{{';
    endDynamicTokenChars = '}}';
    withCustomCultureStore = false;
    constructor(optionsObject) {
        if (optionsObject == null) {
            return;
        }
        if (optionsObject['mergeCulturesToSingleFile'] !== undefined && typeof optionsObject.mergeCulturesToSingleFile == 'boolean') {
            this.mergeCulturesToSingleFile = optionsObject.mergeCulturesToSingleFile;
        }
        if (optionsObject['generateTypeScriptResourceManager'] !== undefined && typeof optionsObject.generateTypeScriptResourceManager == 'boolean') {
            this.generateTypeScriptResourceManager = optionsObject.generateTypeScriptResourceManager;
        }
        if (optionsObject['searchRecursive'] !== undefined && typeof optionsObject.searchRecursive == 'boolean') {
            this.searchRecursive = optionsObject.searchRecursive;
        }
        if (optionsObject['defaultResxCulture'] !== undefined && typeof optionsObject.defaultResxCulture == 'string') {
            this.defaultResxCulture = optionsObject.defaultResxCulture;
        }
        if (optionsObject['ressourcesManagerName'] !== undefined && typeof optionsObject.ressourcesManagerName == 'string') {
            this.ressourcesManagerName = optionsObject.ressourcesManagerName;
        }
        if (optionsObject['startDynamicTokenChars'] !== undefined && typeof optionsObject.startDynamicTokenChars == 'string') {
            this.startDynamicTokenChars = optionsObject.startDynamicTokenChars;
        }
        if (optionsObject['endDynamicTokenChars'] !== undefined && typeof optionsObject.endDynamicTokenChars == 'string') {
            this.endDynamicTokenChars = optionsObject.endDynamicTokenChars;
        }
        if (optionsObject['withCustomCultureStore'] !== undefined && typeof optionsObject.withCustomCultureStore == 'boolean') {
            this.withCustomCultureStore = optionsObject.withCustomCultureStore;
        }
    }
}
export function convertResx(resxInput, outputFolder, options = null) {
    // Read and validate the users options
    let OptionsInternal = new Options(options);
    // Check if an Input-Path was given
    if (resxInput === undefined || resxInput === '') {
        // files = search.recursiveSearchSync(/.resx$/, __dirname + virtualProjectRoot );
        console.error('No input-path given');
        return;
    }
    // Normalize the output path
    outputFolder = path.normalize(outputFolder);
    // Get the resx-file(s) from the input path
    let files;
    files = findFiles(resxInput, OptionsInternal.searchRecursive);
    // Check whether there are some files in the Input path
    if (files.length < 1) {
        console.log('No *.resx-files found in the input path.');
        return;
    }
    // Sort the files for their base resource and their culture
    let filesSorted = sortFilesByRes(files, OptionsInternal.defaultResxCulture);
    // Generate the JSON from the files (and get a list of all keys for the resource-manager generation)
    let resourceNameList = generateJson(filesSorted, outputFolder, OptionsInternal.mergeCulturesToSingleFile);
    // Generate the resource-manager (if set in the options)
    if (OptionsInternal.generateTypeScriptResourceManager) {
        generateResourceManager(outputFolder, resourceNameList, OptionsInternal.mergeCulturesToSingleFile, OptionsInternal.defaultResxCulture, OptionsInternal.startDynamicTokenChars, OptionsInternal.endDynamicTokenChars, OptionsInternal.ressourcesManagerName, OptionsInternal.withCustomCultureStore);
    }
    return;
}
let parser;
function findFiles(resxInput, recursiveSearch) {
    if (resxInput == null) {
        console.error('No input filepath given');
        return [];
    }
    if (typeof resxInput == 'string') {
        return getFilesForPath(resxInput, recursiveSearch);
    }
    if (!Array.isArray(resxInput)) {
        console.warn('The given input path is neither an string[] nor a single string');
        return [];
    }
    let files = [];
    for (let inPath of resxInput) {
        let filesInPath = getFilesForPath(inPath, recursiveSearch);
        for (let file of filesInPath) {
            if (!files.includes(file)) {
                files.push(file);
            }
        }
    }
    return files;
}
function getFilesForPath(inputPath, recursiveSearch) {
    let files = [];
    if (inputPath.endsWith('.resx')) {
        if (!fs.existsSync(inputPath)) {
            console.warn(`The file or path '${inputPath}' could not be found.`);
            return files;
        }
        files.push(inputPath);
        return files;
    }
    //TODO wait for the fileseek maintainer to merge my pull request
    files = fileSeek(inputPath, /.resx$/, recursiveSearch);
    return files;
}
function sortFilesByRes(inputFiles, defaultCulture) {
    let sorted = {};
    for (let file of inputFiles) {
        //Filename and Culture
        let info = getResxFileInfo(file);
        if (info.culture == null) {
            info.culture = defaultCulture;
        }
        if (!Object.hasOwnProperty.call(sorted, info.name)) {
            sorted[info.name] = {};
        }
        sorted[info.name][info.culture] = file;
    }
    return sorted;
}
function generateJson(resxFiles, outputFolder, mergeCultures) {
    if (parser == undefined) {
        parser = new XmlParser();
    }
    //Create the Directory before we write to it
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
    }
    let resourceFileKeyCollection = {};
    for (const resxFileName in resxFiles) {
        let cultureFiles = resxFiles[resxFileName];
        let resourceKeys;
        if (mergeCultures) {
            resourceKeys = generateJsonMerged(outputFolder, cultureFiles, resxFileName);
        }
        else {
            resourceKeys = generateJsonSingle(outputFolder, cultureFiles, resxFileName);
        }
        resourceFileKeyCollection[resxFileName] = resourceKeys;
    }
    return resourceFileKeyCollection;
}
function generateJsonMerged(outputFolder, cultureFiles, resourceName) {
    let resKeys = [];
    let o = {};
    for (let culture in cultureFiles) {
        let file = cultureFiles[culture];
        let resxContentObject = getResxKeyValues(file);
        o[culture] = resxContentObject;
        // Add the ResourceKeys to the key collection
        for (let key of Object.keys(resxContentObject)) {
            if (!resKeys.includes(key)) {
                resKeys.push(key);
            }
        }
    }
    //JSON stringify
    let content = JSON.stringify(o);
    //Write the file
    let targetFileName = `${resourceName}.json`;
    let targetPath = path.join(outputFolder, targetFileName);
    targetPath = path.normalize(targetPath);
    fs.writeFileSync(targetPath, content, { encoding: 'utf-8' });
    return {
        resourceName: resourceName,
        generatedFiles: [targetFileName],
        resxKeys: resKeys
    };
}
function generateJsonSingle(outputFolder, cultureFiles, resourceName) {
    let resKeys = [];
    let targetFiles = [];
    for (let culture in cultureFiles) {
        let file = cultureFiles[culture];
        let resxContentObject = getResxKeyValues(file);
        let o = {};
        o[culture] = resxContentObject;
        //JSON stringify
        let content = JSON.stringify(o);
        //Write the file
        let targetFileName = `${resourceName}.${culture}.json`;
        let targetPath = path.join(outputFolder, targetFileName);
        targetPath = path.normalize(targetPath);
        fs.writeFileSync(targetPath, content, { encoding: 'utf-8' });
        targetFiles.push(targetFileName);
        // Add the ResourceKeys to the key collection
        for (let key of Object.keys(resxContentObject)) {
            if (!resKeys.includes(key)) {
                resKeys.push(key);
            }
        }
    }
    return {
        resourceName: resourceName,
        generatedFiles: targetFiles,
        resxKeys: resKeys
    };
}
function generateResourceManager(outputFolder, resourceNameList, isResourcesMergedByCulture, defaultCulture, startDynamicTokenChars, endDynamicTokenChars, ressourcesManagerName, withCustomCultureStore) {
    let classesString = '';
    let classInstancesString = '';
    for (let resourceInfo of Object.values(resourceNameList)) {
        let resourceName = resourceInfo.resourceName;
        if (!withCustomCultureStore) {
            classInstancesString += `
                private _${resourceName}: ${resourceName} = new ${resourceName}(this);
                get ${resourceName}(): ${resourceName} {
                    return this._${resourceName};
                }
            `;
        }
        let resourceGetters = '';
        for (let resxIdentifier of resourceInfo.resxKeys) {
            resourceGetters += `
                get ${resxIdentifier}(): string {
                    return this.getTranslation('${resxIdentifier}');
                }
            `;
        }
        if (isResourcesMergedByCulture) {
            classesString += `
                import * as resx${resourceName} from './${resourceInfo.generatedFiles[0].trim()}';
                
                export class ${resourceName} extends resourceFile {

                    constructor(resourceManager: resourceManager) {
                        super(resourceManager);
                        this.resources = (<any>resx${resourceName}).default;
                    }
                    ${resourceGetters}
                }
            `;
        }
        else {
            let importStatements = '';
            let importNames = [];
            let resourceConstruction = '';
            for (let filename of resourceInfo.generatedFiles) {
                let importName = '' + filename;
                importName = importName.replace('.json', '');
                importName = importName.replace('.', '_');
                importNames.push(importName);
                importStatements += `
                import * as ${importName} from './${filename}'`;
            }
            resourceConstruction = importNames.join(', ');
            classesString = `
                ${importStatements}
                
                export class ${resourceName} extends resourceFile {
                
                constructor(${withCustomCultureStore ? '' : 'resourceManager: resourceManager'}) {
                    super(${withCustomCultureStore ? '' : 'resourceManager'});
                    this.resources = Object.assign({}, ${resourceConstruction});
                }
                
                ${resourceGetters}
                }
            `;
        }
    }
    let resxManagerString = `
        /**
         * This class gives you type-hinting for the automatic generated resx-json files
         */
        
        export default class resourceManager {
        
            public language: string;
        
            constructor(language: string) {
                this.language = language;
            }
        
            public setLanguage(language: string) {
                this.language = language;
            };
        
            // Generated class instances start
            ${classInstancesString}
            // Gen end
        }`;
    if (withCustomCultureStore) {
        resxManagerString = 'import { useUserCultureStore } from \'@stores/userCulture\';';
    }
    resxManagerString += `
        abstract class resourceFile {
            ${withCustomCultureStore ? 'private userCultureStore = useUserCultureStore();' : 'protected resMan: resourceManager;'}
            protected resources: { [langKey: string]: { [resKey: string]: string } } = {};
        
            ${withCustomCultureStore ? '' : `constructor(resourceManager: resourceManager}) {
                this.resMan = resourceManager;        
            }`}
        
            public getTranslation
            (resKey: string) {
                const language = ${withCustomCultureStore ? 'this.userCultureStore.userIsoCountryCode' : 'this.resMan.language'};
        
                // Check if the language exists for this resource and if the language has an corresponding key
                if (this.resources[language] !== undefined && this.resources[language][resKey] !== undefined) {
                    return this.resources[language][resKey];
                }
        
                // If no entry could be found in the currently active language, try the default language
                if (this.resources['${defaultCulture}'] !== undefined && this.resources['${defaultCulture}'][resKey] !== undefined) {
                    console.log(\`No text resource in the language "\${language}" with the key "\${resKey}".\`);
                    return this.resources['${defaultCulture}'][resKey];
                }
        
                // If there is still no resource found output a warning and return the key.
                console.warn(\`No text-resource for the key \${resKey} found.\`);
                return '/!\\\\' + resKey;
            };
            
            public getDynamicTranslation(resKey: string, params: { key: string; value: string }[]): string {
                let translation = this.getTranslation(resKey);
                for (const param of params) {
                    const reg = RegExp('(${startDynamicTokenChars}' + ' ?[' + param.key + ']* ?' + '${endDynamicTokenChars})');
                    translation = translation.replace(reg, param.value);
                }
                return translation;
            }
        }
        
        // Gen Classes start
        ${classesString}
        // Gen Classes end
    `;
    //Write the file
    let targetFileName = (ressourcesManagerName && ressourcesManagerName !== '' ? ressourcesManagerName : 'resourceManager') + '.ts';
    let targetPath = path.join(outputFolder, targetFileName);
    targetPath = path.normalize(targetPath);
    fs.writeFileSync(targetPath, resxManagerString, { encoding: 'utf-8' });
}
function getResxFileInfo(filePath) {
    let fileCulture = null;
    let nameClean;
    let filename = path.basename(filePath);
    let filenameSplit = filename.split('.');
    filenameSplit.pop();
    if (filenameSplit.length > 1) {
        fileCulture = filenameSplit.pop();
    }
    nameClean = filenameSplit.join('.');
    return {
        name: nameClean,
        culture: fileCulture
    };
}
function getResxKeyValues(filepath) {
    const resources = {};
    parser.reset();
    let fileContentString = fs.readFileSync(filepath, { encoding: 'utf-8' });
    parser.parseString(fileContentString, function (_err, xmlObject) {
        if (xmlObject == undefined || xmlObject['root'] === undefined || xmlObject.root['data'] === undefined ||
            xmlObject.root.data == undefined) {
            return;
        }
        for (let i in xmlObject.root.data) {
            const name = xmlObject.root.data[i].$.name;
            resources[name] = xmlObject.root.data[i].value.toString();
        }
    });
    return resources;
}
//# sourceMappingURL=index.js.map