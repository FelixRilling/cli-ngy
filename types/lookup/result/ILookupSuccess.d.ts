import { ILookupResult, ResultType } from "./ILookupResult";
import { ICommand } from "../../command/ICommand";
import { resolvedArgumentMap } from "../../argument/argumentMatcher";
interface ILookupSuccess extends ILookupResult {
    type: ResultType.SUCCESS;
    command: ICommand;
    args: resolvedArgumentMap;
}
export { ILookupSuccess };
