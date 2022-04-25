/// <reference types="node" />
import { PathLike } from 'fs';
declare module AccitroConfig {
    function clone<T>(data: T): T;
    interface ManagerOptions {
        /**
         * Directory where configuration files will be stored/retrieved.
         * @property {PathLike} path
        */
        path: PathLike;
        /**
         * Name of the configuration file inside the directory.
         * @property {string} name
        */
        name: string;
        /**
         * Text before configuration keys
         * @property {string} prefix
        */
        prefix: string;
        /**
         * Configuration format
         * @property {string} format
        */
        format: 'json' | 'yaml';
    }
    class Serializer {
        type: ManagerOptions['format'];
        private _serializer;
        serialize(data: any): string;
        unserialize(data: string): any;
        private static _getSerializer;
        constructor(type: ManagerOptions['format']);
    }
    class Manager {
        private readonly _serializer;
        private _dataCache?;
        get configFile(): string;
        private static _ensureDirectory;
        private _readConfig;
        private _writeConfig;
        private _resolveKey;
        get data(): any;
        set data(data: any);
        readonly options: ManagerOptions;
        get(key: string): any;
        set<T>(key: string, value: T): T;
        defaults<T>(key: string, value: T): T | any;
        isset(key: string): boolean;
        unset(key: string): void;
        summon(options?: Partial<ManagerOptions>): Manager;
        constructor(options?: Partial<ManagerOptions>);
    }
    class AsyncManager {
        private readonly _serializer;
        private _dataCache?;
        get configFile(): string;
        private static _ensureDirectory;
        private _readConfig;
        private _writeConfig;
        private _resolveKey;
        readonly options: ManagerOptions;
        getData(): Promise<any>;
        setData(data: {
            [key: string]: any;
        }): Promise<any>;
        get(key: string): Promise<any>;
        set<T>(key: string, value: T): Promise<T>;
        defaults<T>(key: string, value: T): Promise<T | any>;
        isset(key: string): Promise<boolean>;
        unset(key: string): Promise<void>;
        summon(options?: Partial<ManagerOptions>): AsyncManager;
        constructor(options?: Partial<ManagerOptions>);
    }
}
export = AccitroConfig;
