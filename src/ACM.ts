import { existsSync, lstatSync, mkdirSync, PathLike, readFileSync, Stats, writeFileSync } from 'fs'
import { lstat, mkdir, readFile, writeFile } from 'fs/promises'
import { basename, dirname, join } from 'path'

module AccitroConfig {
  export function clone<T> (data: T): T {
    try {
      return JSON.parse(JSON.stringify(data))
    } catch (_v) {
      return data
    }
  }

  export interface ManagerOptions {
    /**
     * Directory where configuration files will be stored/retrieved.
     * @property {PathLike} path
    */
    path: PathLike

    /**
     * Name of the configuration file inside the directory.
     * @property {string} name
    */
    name: string

    /**
     * Text before configuration keys
     * @property {string} prefix
    */
    prefix: string

    /**
     * Configuration format
     * @property {string} format
    */
    format: 'json' | 'yaml'
  }

  export class Serializer {
    public type: ManagerOptions['format']

    private _serializer: JSON | typeof import('yaml')

    public serialize (data: any): string {
      const { _serializer: serializer } = this

      if (serializer === JSON) {
        return serializer.stringify(data, undefined, '  ')
      } else {
        return serializer.stringify(data)
      }
    }

    public unserialize (data: string): any {
      const { _serializer: serializer } = this

      return serializer.parse(data)
    }

    private static _getSerializer (type: ManagerOptions['format']) : JSON | typeof import('yaml') {
      switch (type) {
        case 'json':
          return JSON

        case 'yaml':
          return require('yaml')

        default:
          throw new Error(`Unknown format: ${type}`)
      }
    }

    public constructor (type: ManagerOptions['format']) {
      this.type = type
      this._serializer = Serializer._getSerializer(type)
    }
  }

  export class Manager {
    private readonly _serializer: Serializer

    private _dataCache?: {
      date: Date
      data: any
    }

    public get configFile () {
      const { options: { path, name, format } } = this
      const configFile = `${path}/${name}.${format}`

      return configFile
    }

    private static _ensureDirectory (path: PathLike) {
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true })
      }

      return path
    }

    private _readConfig () {
      const { configFile } = this
      let configFileStat: Stats | undefined

      if (existsSync(configFile)) {
        configFileStat = lstatSync(configFile)

        if (configFileStat.isDirectory()) {
          throw new Error(`"${configFile}" is a directory`)
        } else if ((this._dataCache?.date?.getTime() || 0) < Math.round(configFileStat.mtimeMs)) {
          delete this._dataCache
        }

        return (this._dataCache?.data) || (() => {
          const { _serializer: serializer } = this
          let date = new Date()
          let data = {}

          try {
            const configDataRaw = readFileSync(configFile).toString('utf-8')
            const configDataParsed = serializer.unserialize(configDataRaw)

            data = configDataParsed
            date = new Date(configFileStat.mtime)
          } catch (error) {}

          return (this._dataCache = { data, date }).data
        })()
      } else if (this._dataCache) {
        delete this._dataCache
      }

      return {}
    }

    private _writeConfig (data: any) {
      const { configFile, _serializer: serializer } = this
      const configData = (() => {
        const configData = Object.assign({}, this._readConfig(), data)

        for (const configDataKey in configData) {
          const configDataEntry = configData[configDataKey]

          if (typeof (configDataEntry) === 'undefined') {
            delete configData[configDataKey]
          }
        }

        return configData
      })()

      Manager._ensureDirectory(dirname(configFile))
      writeFileSync(configFile, serializer.serialize(configData))

      return (this._dataCache = {
        data: configData,
        date: new Date(lstatSync(configFile).mtimeMs)
      }).data
    }

    private _resolveKey (key: string) {
      const { options: { prefix } } = this

      return `${prefix ? `${prefix}.` : ''}${key}`
    }

    public get data () {
      return clone(this._readConfig())
    }

    public set data (data: any) {
      this._writeConfig(clone(data))
    }

    public readonly options: ManagerOptions

    public get (key: string): any {
      return this.data[this._resolveKey(key)]
    }

    public set <T> (key: string, value: T): T {
      const configData = this.data
      const configDataKey = this._resolveKey(key)

      if (configData[configDataKey] !== value) {
        configData[configDataKey] = value

        this.data = configData
      }

      return value
    }

    public defaults <T> (key: string, value: T): T | any {
      const configData = this.data
      const configDataKey = this._resolveKey(key)

      if (typeof (configData[configDataKey]) === 'undefined') {
        configData[configDataKey] = value

        this.data = configData
      }

      return configData[configDataKey]
    }

    public isset (key: string): boolean {
      const configData = this.data
      const configDataKey = this._resolveKey(key)

      return typeof (configData[configDataKey]) !== 'undefined'
    }

    public unset (key: string) {
      const configData = this.data
      const configDataKey = this._resolveKey(key)

      if (typeof (configData[configDataKey]) !== 'undefined') {
        configData[configDataKey] = undefined

        this.data = configData
      }
    }

    public summon (options?: Partial<ManagerOptions>) {
      return new Manager(parseOptions(Object.assign({}, options), Object.assign({}, this.options)))
    }

    public constructor (options?: Partial<ManagerOptions>) {
      this.options = parseOptions(options)
      this._serializer = new Serializer(this.options.format)
    }
  }

  export class AsyncManager {
    private readonly _serializer: Serializer

    private _dataCache?: {
      date: Date
      data: any
    }

    public get configFile () {
      const { options: { path, name, format } } = this
      const configFile = `${path}/${name}.${format}`

      return configFile
    }

    private static async _ensureDirectory (path: PathLike) {
      if (!existsSync(path)) {
        await mkdir(path, { recursive: true })
      }

      return path
    }

    private async _readConfig () {
      const { configFile } = this
      let configFileStat: Stats | undefined

      if (existsSync(configFile)) {
        configFileStat = await lstat(configFile)

        if (configFileStat.isDirectory()) {
          throw new Error(`"${configFile}" is a direrctory`)
        } else if ((this._dataCache?.date?.getTime() || 0) < Math.round(configFileStat.mtimeMs)) {
          delete this._dataCache
        }

        return (this._dataCache?.data) || await (async () => {
          const { _serializer: serializer } = this
          let date = new Date()
          let data = {}

          try {
            const configDataRaw = (await readFile(configFile)).toString('utf-8')
            const configDataParsed = serializer.unserialize(configDataRaw)

            data = configDataParsed
            date = new Date(configFileStat.mtime)
          } catch (error) {}

          return (this._dataCache = { data, date }).data
        })()
      } else if (this._dataCache) {
        delete this._dataCache
      }

      return {}
    }

    private async _writeConfig (data: any) {
      const { configFile, _serializer: serializer } = this
      const configData = await (async () => {
        const configData = Object.assign({}, await this._readConfig(), data)

        for (const configDataKey in configData) {
          const configDataEntry = configData[configDataKey]

          if (typeof (configDataEntry) === 'undefined') {
            delete configData[configDataKey]
          }
        }

        return configData
      })()

      await AsyncManager._ensureDirectory(dirname(configFile))
      await writeFile(configFile, serializer.serialize(configData))

      return (this._dataCache = {
        data: configData,
        date: new Date(await lstatSync(configFile).mtimeMs)
      }.data)
    }

    private _resolveKey (key: string) {
      const { options: { prefix } } = this

      return `${prefix ? `${prefix}.` : ''}${key}`
    }

    public readonly options: ManagerOptions

    public async getData () {
      return clone(await this._readConfig())
    }

    public async setData (data: { [key: string]: any }) {
      return await this._writeConfig(clone(data))
    }

    public async get (key: string): Promise<any> {
      const data = await this._readConfig()

      return data[this._resolveKey(key)]
    }

    public async set <T> (key: string, value: T): Promise<T> {
      const configData = await this._readConfig()
      const configDataKey = this._resolveKey(key)

      if (configData[configDataKey] !== value) {
        configData[configDataKey] = value

        await this._writeConfig(configData)
      }

      return value
    }

    public async defaults <T> (key: string, value: T): Promise<T | any> {
      const configData = await this._readConfig()
      const configDataKey = this._resolveKey(key)

      if (typeof (configData[configDataKey]) === 'undefined') {
        configData[configDataKey] = value

        await this._writeConfig(configData)
      }

      return configData[configDataKey]
    }

    public async isset (key: string): Promise<boolean> {
      const configData = await this._readConfig()
      const configDataKey = this._resolveKey(key)

      return typeof (configData[configDataKey]) !== 'undefined'
    }

    public async unset (key: string): Promise<void> {
      const configData = await this._readConfig()
      const configDataKey = this._resolveKey(key)

      if (typeof (configData[configDataKey]) !== 'undefined') {
        configData[configDataKey] = undefined

        await this._writeConfig(configData)
      }
    }

    public summon (options?: Partial<ManagerOptions>) {
      return new AsyncManager(parseOptions(Object.assign({}, options), Object.assign({}, this.options)))
    }

    public constructor (options?: Partial<ManagerOptions>) {
      this.options = parseOptions(options)
      this._serializer = new Serializer(this.options.format)
    }
  }

  function parseOptions (options?: Partial<ManagerOptions>, defaults?: ManagerOptions): ManagerOptions {
    const parsedOptions: ManagerOptions = defaults || {
      path: `${process.cwd()}/.Accitro`,
      name: 'index',
      prefix: '',
      format: 'json'
    }

    if (options?.path) {
      parsedOptions.path = options.path
    }

    if (options?.name) {
      parsedOptions.path = join(`${parsedOptions.path}`, dirname(options.name))
      parsedOptions.name = basename(options.name)
    }

    if (options?.prefix) {
      parsedOptions.prefix = options.prefix
    }

    if (options?.format) {
      parsedOptions.format = options.format
    }

    return parsedOptions
  }
}

export = AccitroConfig
