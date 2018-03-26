import { IClingyCommand, IClingyLookupMissingArg, IClingyLookupMissingCommand, IClingyLookupSuccessful, IClingyOptions } from "./interfaces";
/**
 * Clingy class
 *
 * @class
 */
declare const Clingy: {
    new (commands?: any, options?: any): {
        options: IClingyOptions;
        map: Map<string, IClingyCommand>;
        mapAliased: Map<string, IClingyCommand>;
        getAll(): {
            map: Map<string, IClingyCommand>;
            mapAliased: Map<string, IClingyCommand>;
        };
        getCommand(path: string[], pathUsed?: string[]): IClingyLookupSuccessful | IClingyLookupMissingCommand;
        parse(input: string): IClingyLookupSuccessful | IClingyLookupMissingCommand | IClingyLookupMissingArg;
    };
};
export default Clingy;