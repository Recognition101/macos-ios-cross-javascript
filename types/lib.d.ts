interface ArgStructure {
    help: string;
    inScriptable: boolean;
    args: ArgDescription[];
    bookmarks?: string[];
}

type ArgDescription = 
    | ArgDescriptionBase
    | ArgDescriptionEnum
    | ArgDescriptionPath;

type ArgDescriptionBase = {
    name: string;
    shortName: string;
    help: string;
    share?: boolean;
    type: 'boolean' | 'string' | 'date';
}

type ArgDescriptionEnum = Omit<ArgDescriptionBase, "type"> & {
    type: 'enum';
    choices: ArgChoice[];
}

type ArgDescriptionPath = Omit<ArgDescriptionBase, "type"> & {
    type: 'pathFolder' | 'pathFile';
    bookmarkName: string;
    pathType?:
        'public.folder'
        | 'public.json'
        | 'public.plain-text'
        | 'public.image';
}

interface ArgChoice {
    title: string;
    code: string;
}

type ObjectMap<T> = { [key: string]: T };

type Json =
    | string
    | number
    | boolean
    | null
    | undefined
    | Json[]
    | { [ key: string ]: Json };

type JsonDate =
    | string
    | number
    | boolean
    | Date
    | null
    | undefined
    | JsonDate[]
    | { [ key: string ]: JsonDate };

type TsConfig = {
    files: string[];
};

declare class TextEncoder {
    encode: (text: string) => Uint8Array;
}

