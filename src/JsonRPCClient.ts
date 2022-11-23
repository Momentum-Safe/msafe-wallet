import { Connector } from "./connector";
import { JsonRpcParamsSchemaByPositional, parse, format, JsonRpcPayloadResponse, JsonRpcPayloadNotification, JsonRpcPayloadError } from 'json-rpc-protocol'
import { encodeToStr, decodeFromStr } from "./coder";

type executorFunc = (data: any) => void;
type executor = { resolve: executorFunc, reject: executorFunc };
type notifier = (...params: any[]) => void;

export class JsonRPCClient {
    id: number = 0;
    executors: { [id: number]: executor } = {};
    constructor(public readonly connector: Connector, readonly notifiers: { [type: string]: notifier }) {
        this.connector.on('message', data => this.onMessage(data!));
        this.connector.on('close', () => this.onClose());
    }
    private onMessage(data: string) {
        // REVIEW: Shortage for message is msg.
        const mesg = parse(data) as JsonRpcPayloadResponse | JsonRpcPayloadNotification | JsonRpcPayloadError;
        switch (mesg.type) {
            case 'notification':
                return this.onNotify(mesg.method, (mesg.params as JsonRpcParamsSchemaByPositional).map(decodeFromStr));
            case 'response':
                return this.executors[Number(mesg.id)]?.resolve(decodeFromStr(mesg.result));
            case 'error':
                return this.executors[Number(mesg.id)]?.reject(mesg.error.message);
        }

    }
    async request(method: string, params: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            const reqId = this.id++;
            // REVIEW: Is there a mechanism to remove the finished requests?
            this.executors[reqId] = { resolve, reject };
            const req = format.request(reqId, method, params.map(encodeToStr));
            this.connector.send(req);
        });
    }
    private onNotify(type: string, data: any[]) {
        this.notifiers[type](...data);
    }
    private onClose() {

    }
}