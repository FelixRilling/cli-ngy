import { IClingyCommand, IClingyOptions, IClingyLookupSuccessful, IClingyLookupUnsuccessful } from "./interfaces";
/**
 * Clingy class
 *
 * @class
 */
declare const Clingy: {
    new (commands: any, options?: any): {
        options: IClingyOptions;
        map: Map<string, IClingyCommand>;
        mapAliased: Map<string, IClingyCommand>;
        getAll(): {
            map: Map<string, IClingyCommand>;
            mapAliased: Map<string, IClingyCommand>;
        };
        getCommand(path: string[], pathUsed?: string[]): IClingyLookupSuccessful | IClingyLookupUnsuccessful;
        parse(input: string): IClingyLookupSuccessful | IClingyLookupUnsuccessful;
    };
};
export default Clingy;
