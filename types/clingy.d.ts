import * as loglevel from "loglevel";
import { CommandMap } from "./command/commandMap";
import { ICommand } from "./command/ICommand";
import { LookupResolver } from "./lookup/lookupResolver";
import { ILookupResult } from "./lookup/result/ILookupResult";
import { InputParser } from "./parser/inputParser";
declare type commandPath = string[];
/**
 * Core {@link Clingy} class, entry point for creation of a new instance.
 */
declare class Clingy {
    readonly logger: loglevel.Logger;
    readonly lookupResolver: LookupResolver;
    readonly inputParser: InputParser;
    readonly map: CommandMap;
    readonly mapAliased: CommandMap;
    /**
     * Creates a new {@link Clingy} instance.
     *
     * @param commands      Map of commands to create the instance with.
     * @param caseSensitive If commands names should be treated as case sensitive during lookup.
     * @param legalQuotes   List of quotes to use when parsing strings.
     */
    constructor(commands?: CommandMap, caseSensitive?: boolean, legalQuotes?: commandPath);
    setCommand(key: string, command: ICommand): void;
    getCommand(key: string): ICommand | undefined;
    hasCommand(key: string): boolean;
    /**
     * Checks if a pathUsed resolves to a command.
     *
     * @param path Path to look up.
     * @return If the pathUsed resolves to a command.
     */
    hasPath(path: commandPath): boolean;
    /**
     * Resolves a pathUsed to a command.
     *
     * @param path Path to look up.
     * @return Lookup result, either {@link ILookupSuccess} or {@link ILookupErrorNotFound}.
     */
    getPath(path: commandPath): ILookupResult;
    /**
     * Parses a string into a command and arguments.
     *
     * @param input String to parse.
     * @return Lookup result, either {@link ILookupSuccess}, {@link ILookupErrorNotFound}
     * or {@link ILookupErrorMissingArgs}.
     */
    parse(input: string): ILookupResult;
    /**
     * @private
     */
    updateAliases(): void;
}
export { Clingy, commandPath };
