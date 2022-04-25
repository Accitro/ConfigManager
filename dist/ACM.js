"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var fs_1 = require("fs");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var AccitroConfig;
(function (AccitroConfig) {
    function clone(data) {
        try {
            return JSON.parse(JSON.stringify(data));
        }
        catch (_v) {
            return data;
        }
    }
    AccitroConfig.clone = clone;
    var Serializer = /** @class */ (function () {
        function Serializer(type) {
            this.type = type;
            this._serializer = Serializer._getSerializer(type);
        }
        Serializer.prototype.serialize = function (data) {
            var serializer = this._serializer;
            if (serializer === JSON) {
                return serializer.stringify(data, undefined, '  ');
            }
            else {
                return serializer.stringify(data);
            }
        };
        Serializer.prototype.unserialize = function (data) {
            var serializer = this._serializer;
            return serializer.parse(data);
        };
        Serializer._getSerializer = function (type) {
            switch (type) {
                case 'json':
                    return JSON;
                case 'yaml':
                    return require('yaml');
                default:
                    throw new Error("Unknown format: ".concat(type));
            }
        };
        return Serializer;
    }());
    AccitroConfig.Serializer = Serializer;
    var Manager = /** @class */ (function () {
        function Manager(options) {
            this.options = parseOptions(options);
            this._serializer = new Serializer(this.options.format);
        }
        Object.defineProperty(Manager.prototype, "configFile", {
            get: function () {
                var _a = this.options, path = _a.path, name = _a.name, format = _a.format;
                var configFile = "".concat(path, "/").concat(name, ".").concat(format);
                return configFile;
            },
            enumerable: false,
            configurable: true
        });
        Manager._ensureDirectory = function (path) {
            if (!(0, fs_1.existsSync)(path)) {
                (0, fs_1.mkdirSync)(path, { recursive: true });
            }
            return path;
        };
        Manager.prototype._readConfig = function () {
            var _this = this;
            var _a, _b, _c;
            var configFile = this.configFile;
            var configFileStat;
            if ((0, fs_1.existsSync)(configFile)) {
                configFileStat = (0, fs_1.lstatSync)(configFile);
                if (configFileStat.isDirectory()) {
                    throw new Error("\"".concat(configFile, "\" is a directory"));
                }
                else if ((((_b = (_a = this._dataCache) === null || _a === void 0 ? void 0 : _a.date) === null || _b === void 0 ? void 0 : _b.getTime()) || 0) < Math.round(configFileStat.mtimeMs)) {
                    delete this._dataCache;
                }
                return ((_c = this._dataCache) === null || _c === void 0 ? void 0 : _c.data) || (function () {
                    var serializer = _this._serializer;
                    var date = new Date();
                    var data = {};
                    try {
                        var configDataRaw = (0, fs_1.readFileSync)(configFile).toString('utf-8');
                        var configDataParsed = serializer.unserialize(configDataRaw);
                        data = configDataParsed;
                        date = new Date(configFileStat.mtime);
                    }
                    catch (error) { }
                    return (_this._dataCache = { data: data, date: date }).data;
                })();
            }
            else if (this._dataCache) {
                delete this._dataCache;
            }
            return {};
        };
        Manager.prototype._writeConfig = function (data) {
            var _this = this;
            var _a = this, configFile = _a.configFile, serializer = _a._serializer;
            var configData = (function () {
                var configData = Object.assign({}, _this._readConfig(), data);
                for (var configDataKey in configData) {
                    var configDataEntry = configData[configDataKey];
                    if (typeof (configDataEntry) === 'undefined') {
                        delete configData[configDataKey];
                    }
                }
                return configData;
            })();
            Manager._ensureDirectory((0, path_1.dirname)(configFile));
            (0, fs_1.writeFileSync)(configFile, serializer.serialize(configData));
            return (this._dataCache = {
                data: configData,
                date: new Date((0, fs_1.lstatSync)(configFile).mtimeMs)
            }).data;
        };
        Manager.prototype._resolveKey = function (key) {
            var prefix = this.options.prefix;
            return "".concat(prefix ? "".concat(prefix, ".") : '').concat(key);
        };
        Object.defineProperty(Manager.prototype, "data", {
            get: function () {
                return clone(this._readConfig());
            },
            set: function (data) {
                this._writeConfig(clone(data));
            },
            enumerable: false,
            configurable: true
        });
        Manager.prototype.get = function (key) {
            return this.data[this._resolveKey(key)];
        };
        Manager.prototype.set = function (key, value) {
            var configData = this.data;
            var configDataKey = this._resolveKey(key);
            if (configData[configDataKey] !== value) {
                configData[configDataKey] = value;
                this.data = configData;
            }
            return value;
        };
        Manager.prototype.defaults = function (key, value) {
            var configData = this.data;
            var configDataKey = this._resolveKey(key);
            if (typeof (configData[configDataKey]) === 'undefined') {
                configData[configDataKey] = value;
                this.data = configData;
            }
            return configData[configDataKey];
        };
        Manager.prototype.isset = function (key) {
            var configData = this.data;
            var configDataKey = this._resolveKey(key);
            return typeof (configData[configDataKey]) !== 'undefined';
        };
        Manager.prototype.unset = function (key) {
            var configData = this.data;
            var configDataKey = this._resolveKey(key);
            if (typeof (configData[configDataKey]) !== 'undefined') {
                configData[configDataKey] = undefined;
                this.data = configData;
            }
        };
        Manager.prototype.summon = function (options) {
            return new Manager(parseOptions(Object.assign({}, options), Object.assign({}, this.options)));
        };
        return Manager;
    }());
    AccitroConfig.Manager = Manager;
    var AsyncManager = /** @class */ (function () {
        function AsyncManager(options) {
            this.options = parseOptions(options);
            this._serializer = new Serializer(this.options.format);
        }
        Object.defineProperty(AsyncManager.prototype, "configFile", {
            get: function () {
                var _a = this.options, path = _a.path, name = _a.name, format = _a.format;
                var configFile = "".concat(path, "/").concat(name, ".").concat(format);
                return configFile;
            },
            enumerable: false,
            configurable: true
        });
        AsyncManager._ensureDirectory = function (path) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!!(0, fs_1.existsSync)(path)) return [3 /*break*/, 2];
                            return [4 /*yield*/, (0, promises_1.mkdir)(path, { recursive: true })];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/, path];
                    }
                });
            });
        };
        AsyncManager.prototype._readConfig = function () {
            var _a, _b, _c;
            return __awaiter(this, void 0, void 0, function () {
                var configFile, configFileStat, _d;
                var _this = this;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            configFile = this.configFile;
                            if (!(0, fs_1.existsSync)(configFile)) return [3 /*break*/, 4];
                            return [4 /*yield*/, (0, promises_1.lstat)(configFile)];
                        case 1:
                            configFileStat = _e.sent();
                            if (configFileStat.isDirectory()) {
                                throw new Error("\"".concat(configFile, "\" is a direrctory"));
                            }
                            else if ((((_b = (_a = this._dataCache) === null || _a === void 0 ? void 0 : _a.date) === null || _b === void 0 ? void 0 : _b.getTime()) || 0) < Math.round(configFileStat.mtimeMs)) {
                                delete this._dataCache;
                            }
                            _d = ((_c = this._dataCache) === null || _c === void 0 ? void 0 : _c.data);
                            if (_d) return [3 /*break*/, 3];
                            return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var serializer, date, data, configDataRaw, configDataParsed, error_1;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                serializer = this._serializer;
                                                date = new Date();
                                                data = {};
                                                _a.label = 1;
                                            case 1:
                                                _a.trys.push([1, 3, , 4]);
                                                return [4 /*yield*/, (0, promises_1.readFile)(configFile)];
                                            case 2:
                                                configDataRaw = (_a.sent()).toString('utf-8');
                                                configDataParsed = serializer.unserialize(configDataRaw);
                                                data = configDataParsed;
                                                date = new Date(configFileStat.mtime);
                                                return [3 /*break*/, 4];
                                            case 3:
                                                error_1 = _a.sent();
                                                return [3 /*break*/, 4];
                                            case 4: return [2 /*return*/, (this._dataCache = { data: data, date: date }).data];
                                        }
                                    });
                                }); })()];
                        case 2:
                            _d = (_e.sent());
                            _e.label = 3;
                        case 3: return [2 /*return*/, _d];
                        case 4:
                            if (this._dataCache) {
                                delete this._dataCache;
                            }
                            _e.label = 5;
                        case 5: return [2 /*return*/, {}];
                    }
                });
            });
        };
        AsyncManager.prototype._writeConfig = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, configFile, serializer, configData, _b, _c;
                var _d;
                var _this = this;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            _a = this, configFile = _a.configFile, serializer = _a._serializer;
                            return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var configData, _a, _b, _c, configDataKey, configDataEntry;
                                    return __generator(this, function (_d) {
                                        switch (_d.label) {
                                            case 0:
                                                _b = (_a = Object).assign;
                                                _c = [{}];
                                                return [4 /*yield*/, this._readConfig()];
                                            case 1:
                                                configData = _b.apply(_a, _c.concat([_d.sent(), data]));
                                                for (configDataKey in configData) {
                                                    configDataEntry = configData[configDataKey];
                                                    if (typeof (configDataEntry) === 'undefined') {
                                                        delete configData[configDataKey];
                                                    }
                                                }
                                                return [2 /*return*/, configData];
                                        }
                                    });
                                }); })()];
                        case 1:
                            configData = _e.sent();
                            return [4 /*yield*/, AsyncManager._ensureDirectory((0, path_1.dirname)(configFile))];
                        case 2:
                            _e.sent();
                            return [4 /*yield*/, (0, promises_1.writeFile)(configFile, serializer.serialize(configData))];
                        case 3:
                            _e.sent();
                            _b = this;
                            _d = {
                                data: configData
                            };
                            _c = Date.bind;
                            return [4 /*yield*/, (0, fs_1.lstatSync)(configFile).mtimeMs];
                        case 4: return [2 /*return*/, (_b._dataCache = (_d.date = new (_c.apply(Date, [void 0, _e.sent()]))(),
                                _d).data)];
                    }
                });
            });
        };
        AsyncManager.prototype._resolveKey = function (key) {
            var prefix = this.options.prefix;
            return "".concat(prefix ? "".concat(prefix, ".") : '').concat(key);
        };
        AsyncManager.prototype.getData = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = clone;
                            return [4 /*yield*/, this._readConfig()];
                        case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                    }
                });
            });
        };
        AsyncManager.prototype.setData = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._writeConfig(clone(data))];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        AsyncManager.prototype.get = function (key) {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._readConfig()];
                        case 1:
                            data = _a.sent();
                            return [2 /*return*/, data[this._resolveKey(key)]];
                    }
                });
            });
        };
        AsyncManager.prototype.set = function (key, value) {
            return __awaiter(this, void 0, void 0, function () {
                var configData, configDataKey;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._readConfig()];
                        case 1:
                            configData = _a.sent();
                            configDataKey = this._resolveKey(key);
                            if (!(configData[configDataKey] !== value)) return [3 /*break*/, 3];
                            configData[configDataKey] = value;
                            return [4 /*yield*/, this._writeConfig(configData)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/, value];
                    }
                });
            });
        };
        AsyncManager.prototype.defaults = function (key, value) {
            return __awaiter(this, void 0, void 0, function () {
                var configData, configDataKey;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._readConfig()];
                        case 1:
                            configData = _a.sent();
                            configDataKey = this._resolveKey(key);
                            if (!(typeof (configData[configDataKey]) === 'undefined')) return [3 /*break*/, 3];
                            configData[configDataKey] = value;
                            return [4 /*yield*/, this._writeConfig(configData)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/, configData[configDataKey]];
                    }
                });
            });
        };
        AsyncManager.prototype.isset = function (key) {
            return __awaiter(this, void 0, void 0, function () {
                var configData, configDataKey;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._readConfig()];
                        case 1:
                            configData = _a.sent();
                            configDataKey = this._resolveKey(key);
                            return [2 /*return*/, typeof (configData[configDataKey]) !== 'undefined'];
                    }
                });
            });
        };
        AsyncManager.prototype.unset = function (key) {
            return __awaiter(this, void 0, void 0, function () {
                var configData, configDataKey;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._readConfig()];
                        case 1:
                            configData = _a.sent();
                            configDataKey = this._resolveKey(key);
                            if (!(typeof (configData[configDataKey]) !== 'undefined')) return [3 /*break*/, 3];
                            configData[configDataKey] = undefined;
                            return [4 /*yield*/, this._writeConfig(configData)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        AsyncManager.prototype.summon = function (options) {
            return new AsyncManager(parseOptions(Object.assign({}, options), Object.assign({}, this.options)));
        };
        return AsyncManager;
    }());
    AccitroConfig.AsyncManager = AsyncManager;
    function parseOptions(options, defaults) {
        var parsedOptions = defaults || {
            path: "".concat(process.cwd(), "/.Accitro"),
            name: 'index',
            prefix: '',
            format: 'json'
        };
        if (options === null || options === void 0 ? void 0 : options.path) {
            parsedOptions.path = options.path;
        }
        if (options === null || options === void 0 ? void 0 : options.name) {
            parsedOptions.path = (0, path_1.join)("".concat(parsedOptions.path), (0, path_1.dirname)(options.name));
            parsedOptions.name = (0, path_1.basename)(options.name);
        }
        if (options === null || options === void 0 ? void 0 : options.prefix) {
            parsedOptions.prefix = options.prefix;
        }
        if (options === null || options === void 0 ? void 0 : options.format) {
            parsedOptions.format = options.format;
        }
        return parsedOptions;
    }
})(AccitroConfig || (AccitroConfig = {}));
module.exports = AccitroConfig;
