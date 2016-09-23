import * as ts from "typescript";

import * as path from "path";
import * as fs from "fs";

import { Options } from "../";
import { getConfigFileName, parseJSON } from "../utils";

interface TslintSettings {
    rules: {
        indent: {
            0: boolean;
            1: string;
        };
        "no-consecutive-blank-lines": boolean,
        whitespace: {
            0: boolean;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            [key: string]: any;
        };
    };
}

export interface AdditionalFormatOptions {
    noConsecutiveBlankLines: boolean;
}

export default function makeFormatCodeOptions(fileName: string, opts: Options, formatOptions: ts.FormatCodeOptions): ts.FormatCodeOptions {

    let baseDir = opts.baseDir ? path.resolve(opts.baseDir) : path.dirname(path.resolve(fileName));
    let configFileName = getConfigFileName(baseDir, "tslint.json");
    if (!configFileName) {
        return formatOptions;
    }
    if (opts.verbose) {
        console.log(`read ${configFileName} for ${fileName}`);
    }

    let config: TslintSettings = parseJSON(fs.readFileSync(configFileName, "utf-8"));
    if (!config.rules) {
        return formatOptions;
    }
    if (config.rules.indent && config.rules.indent[0]) {
        if (config.rules.indent[1] === "spaces") {
            formatOptions.ConvertTabsToSpaces = true;
        } else if (config.rules.indent[1] === "tabs") {
            formatOptions.ConvertTabsToSpaces = false;
        }
    }
    if (config.rules.whitespace && config.rules.whitespace[0]) {
        for (let p in config.rules.whitespace) {
            let value = config.rules.whitespace[p];
            if (value === "check-branch") {
                formatOptions.InsertSpaceAfterKeywordsInControlFlowStatements = true;
            } else if (value === "check-decl") {
                // none?
            } else if (value === "check-operator") {
                formatOptions.InsertSpaceBeforeAndAfterBinaryOperators = true;
            } else if (value === "check-separator") {
                formatOptions.InsertSpaceAfterCommaDelimiter = true;
                formatOptions.InsertSpaceAfterSemicolonInForStatements = true;
            } else if (value === "check-type") {
                // none?
            }
        }
    }

    return formatOptions;
}

export function postProcess(fileName: string, formattedCode: string, opts: Options, _formatOptions: ts.FormatCodeOptions): string {

    let baseDir = opts.baseDir ? path.resolve(opts.baseDir) : path.dirname(path.resolve(fileName));
    let configFileName = getConfigFileName(baseDir, "tslint.json");
    if (!configFileName) {
        return formattedCode;
    }

    let config: TslintSettings = parseJSON(fs.readFileSync(configFileName, "utf-8"));
    if (!config.rules) {
        return formattedCode;
    }

    let additionalOptions = createDefaultAdditionalFormatCodeOptions();
    if (config.rules["no-consecutive-blank-lines"] === true) {
        additionalOptions.noConsecutiveBlankLines = true;
    }

    if (additionalOptions.noConsecutiveBlankLines) {
        formattedCode = formattedCode.replace(/\n+^$/mg, "\n");
    }

    return formattedCode;
}

function createDefaultAdditionalFormatCodeOptions(): AdditionalFormatOptions {

    return {
        noConsecutiveBlankLines: false,
    };
}
