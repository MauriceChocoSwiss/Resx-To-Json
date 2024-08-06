export interface res2TsOptions {
    mergeCulturesToSingleFile: boolean;
    generateTypeScriptResourceManager: boolean;
    searchRecursive: boolean;
    defaultResxCulture: string;
    ressourcesManagerName: string;
    startDynamicTokenChars: string;
    endDynamicTokenChars: string;
    withCustomCultureStore: boolean;
}
export declare function convertResx(resxInput: string | string[], outputFolder: string, options?: res2TsOptions): void;
