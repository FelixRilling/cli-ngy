'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var lightdash = require('lightdash');
var logby = require('logby');

const getConstructorMap = (input) => {
    if (lightdash.isMap(input)) {
        return Array.from(input.entries());
    }
    else if (lightdash.isObject(input)) {
        return Array.from(Object.entries(input));
    }
    return null;
};
/**
 * Map containing {@link ICommand}s.
 */
class CommandMap extends Map {
    constructor(input) {
        super(getConstructorMap(input));
    }
    /**
     * Creates a new instance with {@link Clingy} options to inherit.
     *
     * @param commands Command input to use.
     * @param options Options for the Clingy instance.
     */
    static createWithOptions(commands, options) {
        if (lightdash.isMap(commands)) {
            commands.forEach(val => CommandMap.createWithOptionsHelper(val, options));
        }
        else if (lightdash.isObjectPlain(commands)) {
            lightdash.forEachEntry(commands, (key, val) => CommandMap.createWithOptionsHelper(val, options));
        }
        return new CommandMap(commands);
    }
    static createWithOptionsHelper(command, options) {
        if (lightdash.isObjectPlain(command.sub) || lightdash.isMap(command.sub)) {
            command.sub = new Clingy(CommandMap.createWithOptions(command.sub, options), options);
        }
    }
    /**
     * Checks if the map contains a key, ignoring case.
     *
     * @param key Key to check for.
     * @return If the map contains a key, ignoring case.
     */
    hasIgnoreCase(key) {
        return Array.from(this.keys())
            .map(k => k.toLowerCase())
            .includes(key.toLowerCase());
    }
    /**
     * Returns the value for the key, ignoring case.
     *
     * @param key Key to check for.
     * @return The value for the key, ignoring case.
     */
    getIgnoreCase(key) {
        let result = null;
        this.forEach((value, k) => {
            if (key.toLowerCase() === k.toLowerCase()) {
                result = value;
            }
        });
        return result;
    }
}

const clingyLogby = new logby.Logby();

/**
 * Orchestrates mapping of {@link IArgument}s to user-provided input.
 *
 * @private
 */
class ArgumentMatcher {
    /**
     * Matches a list of {@link IArgument}s to a list of string input arguments.
     *
     * @param expected {@link Argument} list of a {@link ICommand}
     * @param provided List of user-provided arguments.
     */
    constructor(expected, provided) {
        this.missing = [];
        this.result = new Map();
        ArgumentMatcher.logger.debug(`Matching arguments ${expected} with ${provided}`);
        expected.forEach((expectedArg, i) => {
            if (i < provided.length) {
                const providedArg = provided[i];
                ArgumentMatcher.logger.trace(`Found matching argument for ${expectedArg.name}, adding to result: ${providedArg}`);
                this.result.set(expectedArg.name, providedArg);
            }
            else if (!expectedArg.required &&
                !lightdash.isNil(expectedArg.defaultValue)) {
                ArgumentMatcher.logger.trace(`No matching argument found for ${expectedArg.name}, using default: ${expectedArg.defaultValue}`);
                this.result.set(expectedArg.name, expectedArg.defaultValue);
            }
            else {
                ArgumentMatcher.logger.trace(`No matching argument found for ${expectedArg.name}, adding to missing.`);
                this.missing.push(expectedArg);
            }
        });
        ArgumentMatcher.logger.debug(`Finished matching arguments: ${expected.length} expected, ${this.result.size} found and ${this.missing.length} missing.`);
    }
}
ArgumentMatcher.logger = clingyLogby.getLogger(ArgumentMatcher);

/**
 * Gets similar keys of a key based on their string distance.
 *
 * @private
 * @param mapAliased Map to use for lookup.
 * @param name       Key to use.
 * @return List of similar keys.
 */
const getSimilar = (mapAliased, name) => lightdash.strSimilar(name, Array.from(mapAliased.keys()), false);

/**
 * Lookup tools for resolving paths through {@link CommandMap}s.
 *
 * @private
 */
class LookupResolver {
    /**
     * Creates a new {@link LookupResolver}.
     *
     * @param caseSensitive If the lookup should honor case.
     */
    constructor(caseSensitive = true) {
        this.caseSensitive = caseSensitive;
    }
    /**
     * Resolves a pathUsed through a {@link CommandMap}.
     *
     * @param mapAliased     Map to use.
     * @param path           Path to getPath.
     * @param parseArguments If dangling pathUsed items should be treated as arguments.
     * @return Lookup result, either {@link ILookupSuccess}, {@link ILookupErrorNotFound}
     * or {@link ILookupErrorMissingArgs}.
     */
    resolve(mapAliased, path, parseArguments = false) {
        if (path.length === 0) {
            throw new Error("Path cannot be empty.");
        }
        return this.resolveInternal(mapAliased, path, [], parseArguments);
    }
    resolveInternal(mapAliased, path, pathUsed, parseArguments) {
        const currentPathFragment = path[0];
        const pathNew = path.slice(1);
        pathUsed.push(currentPathFragment);
        if (this.caseSensitive
            ? !mapAliased.has(currentPathFragment)
            : !mapAliased.hasIgnoreCase(currentPathFragment)) {
            LookupResolver.logger.warn(`Command '${currentPathFragment}' could not be found.`);
            return {
                successful: false,
                pathUsed,
                pathDangling: pathNew,
                type: 1 /* ERROR_NOT_FOUND */,
                missing: currentPathFragment,
                similar: getSimilar(mapAliased, currentPathFragment)
            };
        }
        const command = ((this.caseSensitive
            ? mapAliased.get(currentPathFragment)
            : mapAliased.getIgnoreCase(currentPathFragment)));
        LookupResolver.logger.debug(`Successfully looked up command: ${currentPathFragment}`);
        if (pathNew.length > 0 && lightdash.isInstanceOf(command.sub, Clingy)) {
            LookupResolver.logger.debug(`Resolving sub-commands: ${command.sub} ${pathNew}`);
            return this.resolveInternal(command.sub.mapAliased, pathNew, pathUsed, parseArguments);
        }
        let argumentsResolved;
        if (!parseArguments ||
            lightdash.isNil(command.args) ||
            command.args.length === 0) {
            LookupResolver.logger.debug("No arguments defined, using empty list.");
            argumentsResolved = new Map();
        }
        else {
            LookupResolver.logger.debug(`Looking up arguments: ${pathNew}`);
            const argumentMatcher = new ArgumentMatcher(command.args, pathNew);
            if (argumentMatcher.missing.length > 0) {
                LookupResolver.logger.warn(`Some arguments could not be found: ${argumentMatcher.missing.map(arg => arg.name)}`);
                return {
                    successful: false,
                    pathUsed,
                    pathDangling: pathNew,
                    type: 2 /* ERROR_MISSING_ARGUMENT */,
                    missing: argumentMatcher.missing
                };
            }
            argumentsResolved = argumentMatcher.result;
            LookupResolver.logger.debug(`Successfully looked up arguments: ${argumentsResolved}`);
        }
        const lookupSuccess = {
            successful: true,
            pathUsed,
            pathDangling: pathNew,
            type: 0 /* SUCCESS */,
            command,
            args: argumentsResolved
        };
        LookupResolver.logger.debug(`Returning successful lookup result: ${lookupSuccess}`);
        return lookupSuccess;
    }
}
LookupResolver.logger = clingyLogby.getLogger(LookupResolver);

/**
 * Manages parsing input strings into a path list.
 *
 * @private
 */
class InputParser {
    // noinspection TsLint
    /**
     * Creates an {@link InputParser}.
     *
     * @param legalQuotes List of quotes to use when parsing strings.
     */
    constructor(legalQuotes = ['"']) {
        this.legalQuotes = legalQuotes;
        this.pattern = this.generateMatcher();
    }
    /**
     * Parses an input string.
     *
     * @param input Input string to parse.
     * @return Path list.
     */
    parse(input) {
        InputParser.logger.debug(`Parsing input '${input}'`);
        const result = [];
        const pattern = new RegExp(this.pattern);
        let match;
        // noinspection AssignmentResultUsedJS
        while ((match = pattern.exec(input))) {
            InputParser.logger.trace(`Found match '${match}'`);
            const groups = lightdash.arrCompact(match.slice(1));
            if (groups.length > 0) {
                InputParser.logger.trace(`Found group '${groups[0]}'`);
                result.push(groups[0]);
            }
        }
        return result;
    }
    generateMatcher() {
        InputParser.logger.debug("Creating matcher.");
        const matchBase = "(\\S+)";
        const matchItems = this.legalQuotes
            .map((str) => `\\${str}`)
            .map(quote => `${quote}(.+?)${quote}`);
        matchItems.push(matchBase);
        let result;
        try {
            result = new RegExp(matchItems.join("|"), "g");
        }
        catch (e) {
            InputParser.logger.error("The parsing pattern is invalid, this should never happen.", e);
            throw e;
        }
        return result;
    }
}
InputParser.logger = clingyLogby.getLogger(InputParser);

/**
 * Core {@link Clingy} class, entry point for creation of a new instance.
 */
class Clingy {
    /**
     * Creates a new {@link Clingy} instance.
     *
     * @param commands      Map of commands to create the instance with.
     * @param options       Option object.
     */
    constructor(commands = {}, options = {}) {
        this.lookupResolver = new LookupResolver(options.caseSensitive);
        this.inputParser = new InputParser(options.legalQuotes);
        this.map = CommandMap.createWithOptions(commands, options);
        this.mapAliased = new CommandMap();
        this.updateAliases();
    }
    setCommand(key, command) {
        this.map.set(key, command);
        this.updateAliases();
    }
    getCommand(key) {
        return this.mapAliased.get(key);
    }
    hasCommand(key) {
        return this.mapAliased.has(key);
    }
    /**
     * Checks if a pathUsed resolves to a command.
     *
     * @param path Path to look up.
     * @return If the pathUsed resolves to a command.
     */
    hasPath(path) {
        return this.getPath(path).successful;
    }
    /**
     * Resolves a pathUsed to a command.
     *
     * @param path Path to look up.
     * @return Lookup result, either {@link ILookupSuccess} or {@link ILookupErrorNotFound}.
     */
    getPath(path) {
        Clingy.logger.debug(`Resolving pathUsed: ${path}`);
        return this.lookupResolver.resolve(this.mapAliased, path);
    }
    /**
     * Parses a string into a command and arguments.
     *
     * @param input String to parse.
     * @return Lookup result, either {@link ILookupSuccess}, {@link ILookupErrorNotFound}
     * or {@link ILookupErrorMissingArgs}.
     */
    parse(input) {
        Clingy.logger.debug(`Parsing input: '${input}'`);
        return this.lookupResolver.resolve(this.mapAliased, this.inputParser.parse(input), true);
    }
    /**
     * @private
     */
    updateAliases() {
        Clingy.logger.debug("Updating aliased map.");
        this.mapAliased.clear();
        this.map.forEach((value, key) => {
            this.mapAliased.set(key, value);
            value.alias.forEach(alias => {
                if (this.mapAliased.has(alias)) {
                    Clingy.logger.warn(`Alias '${alias}' conflicts with a previously defined key, will be ignored.`);
                }
                else {
                    Clingy.logger.trace(`Created alias '${alias}' for '${key}'`);
                    this.mapAliased.set(alias, value);
                }
            });
        });
        Clingy.logger.debug("Done updating aliased map.");
    }
}
Clingy.logger = clingyLogby.getLogger(Clingy);

exports.Clingy = Clingy;
exports.clingyLogby = clingyLogby;
