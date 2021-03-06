import { compact } from "lodash";
import { clingyLogby } from "../logger";

/**
 * Manages parsing input strings into a path list.
 *
 * @private
 */
class InputParser {
    private static readonly logger = clingyLogby.getLogger(InputParser);

    public readonly legalQuotes: string[];
    public readonly pattern: RegExp;

    /**
     * Creates an {@link InputParser}.
     *
     * @param legalQuotes List of quotes to use when parsing strings.
     */
    public constructor(legalQuotes = ["\""]) {
        this.legalQuotes = legalQuotes;
        this.pattern = this.generateMatcher();
    }

    /**
     * Parses an input string.
     *
     * @param input Input string to parse.
     * @return Path list.
     */
    public parse(input: string): string[] {
        InputParser.logger.debug(`Parsing input '${input}'`);
        const result: string[] = [];
        const pattern = new RegExp(this.pattern);
        let match: RegExpExecArray | null;

        // Noinspection AssignmentResultUsedJS
        while ((match = pattern.exec(input))) {
            InputParser.logger.trace(`Found match '${match}'`);
            const groups = compact(match.slice(1));

            if (groups.length > 0) {
                InputParser.logger.trace(`Found group '${groups[0]}'`);
                result.push(groups[0]);
            }
        }

        return result;
    }

    private generateMatcher(): RegExp {
        InputParser.logger.debug("Creating matcher.");
        const matchBase = "(\\S+)";
        const matchItems = this.legalQuotes
            .map((str): string => `\\${str}`)
            .map(quote => `${quote}(.+?)${quote}`);

        matchItems.push(matchBase);

        let result: RegExp;
        try {
            result = new RegExp(matchItems.join("|"), "g");
        } catch (e) {
            InputParser.logger.error(
                "The parsing pattern is invalid, this should never happen.",
                e
            );
            throw e;
        }

        return result;
    }
}

export { InputParser };
