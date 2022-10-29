import { Connector } from "./connector";
import { JsonRPCClient } from "./JsonRPCClient";
import { Account, WalletAPI, Option, Payload, WalletEvent, WalletRPC } from "./WalletAPI";
type onEventFunc = (data: any) => void;

const MsafeOrigin = 'https://app.m-safe.io';
export class MsafeWallet implements WalletAPI {
    public client: JsonRPCClient;
    events: { [key: string]: onEventFunc } = {};
    constructor(connector: Connector) {
        const onEvent = (type: string, ...params: any[]) => {
            const cbk = this.events[type];
            cbk && cbk(params[0]);
        };
        const entries = [
            WalletEvent.ChangeAccount,
            WalletEvent.ChangeNetwork
        ].map(event => [event, (...params: any[]) => onEvent(event, ...params)]);
        const notifiers = Object.fromEntries(entries);
        this.client = new JsonRPCClient(connector, notifiers);
    }
    async connect(): Promise<Account> {
        return this.client.request(WalletRPC.connect);
    }
    async isConnected(): Promise<boolean> {
        return this.client.request(WalletRPC.isConnected);
    }
    async disconnect() {
        return this.client.request(WalletRPC.disconnect);
    }
    onChangeAccount(cbk: (account: Account) => void) {
        this.events[WalletEvent.ChangeAccount] = cbk;
    }
    onChangeNetwork(cbk: (network: string) => void) {
        this.events[WalletEvent.ChangeNetwork] = cbk;
    }
    async network(): Promise<string> {
        return this.client.request(WalletRPC.connect);
    }
    async account(): Promise<Account> {
        return this.client.request(WalletRPC.account);
    }
    async chainId(): Promise<Number> {
        return this.client.request(WalletRPC.chainId);
    }
    async signAndSubmit(payload: Payload, option?: Option): Promise<Uint8Array> {
        return this.client.request(WalletRPC.signAndSubmit, [payload, option]);
    }

    async signTransaction(payload: Payload, option?: Option): Promise<Uint8Array> {
        return this.client.request(WalletRPC.signTransaction, [payload, option]);
    }

    async signMessage(message: string | Uint8Array): Promise<Uint8Array> {
        return this.client.request(WalletRPC.signMessage, [message]);
    }
    static async new(msafe = MsafeOrigin): Promise<MsafeWallet> {
        const connector = await Connector.connect(window.parent, msafe);
        return new MsafeWallet(connector);
    }
}
