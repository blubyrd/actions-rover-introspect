"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const artifact = __importStar(require("@actions/artifact"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uploadArtifact = (name, path) => __awaiter(void 0, void 0, void 0, function* () {
    const client = artifact.create();
    const options = { continueOnError: false };
    return yield client.uploadArtifact(name, [path], __dirname, options);
});
const saveFile = (name, schema) => {
    const file = path.join(__dirname, `/${name}`);
    fs.writeFileSync(file, schema);
    return file;
};
const rover = (args = []) => __awaiter(void 0, void 0, void 0, function* () {
    let schema = "";
    const stdout = (data) => schema += data.toString();
    const listeners = { stdout };
    const options = { listeners };
    yield exec.exec("/root/.rover/bin/rover", args, options);
    return schema;
});
const setOutput = (schema) => {
    const encoded = Buffer.from(schema).toString('base64');
    core.setOutput('schema', encoded);
};
const getMultilineInput = (param) => {
    const input = core.getMultilineInput(param);
    if (input.length > 0)
        return input.join('');
};
const getInput = () => {
    const federated = core.getBooleanInput('federated');
    const subgraph = core.getInput('subgraph');
    const server = core.getInput('server', { required: true });
    const headersJSON = getMultilineInput('headers');
    return { federated, subgraph, server, headersJSON };
};
const parseHeaders = (headersJSON = "{}") => {
    try {
        const headers = JSON.parse(headersJSON);
        // @ts-ignore
        const headerFn = ([key, value]) => ['--header', `${key}:${value}`];
        return Object.entries(headers).map(headerFn).flat();
    }
    catch (error) {
        console.error(error);
        throw new Error('Failed to parse headers input, is it valid JSON?');
    }
};
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { federated, subgraph, server, headersJSON } = getInput();
            const headers = parseHeaders(headersJSON);
            const schema = yield rover([
                federated ? 'subgraph' : 'graph',
                'introspect',
                server,
                ...headers
            ]);
            const filename = federated ? `${subgraph}.graphql` : `graph.graphql`;
            const file = saveFile(filename, schema);
            yield uploadArtifact(filename, file);
            setOutput(schema);
        }
        catch (error) {
            console.error(error);
            core.setFailed(error.message);
        }
    });
}
run();
