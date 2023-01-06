import { Connector } from "./connector";
import { JsonRPCClient } from "./JsonRPCClient";
import { Account, WalletAPI, Option, Payload, WalletEvent, WalletRPC } from "./WalletAPI";
type onEventFunc = (data: any) => void

const MsafeOrigins = {
    Mainnet: 'https://app.m-safe.io',
    Testnet: 'https://testnet.m-safe.io',
    Partner: 'https://partner.m-safe.io',
};

type NetworkType = keyof typeof MsafeOrigins;
type MsafeNetwork = NetworkType | string;
type MsafeNetworks = MsafeNetwork | MsafeNetwork[];

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
        return this.client.request(WalletRPC.network);
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

    get version() {
        return this.client.version;
    }

    /// check if current page is running under msafe wallet
    static inMsafeWallet(): boolean {
        return typeof window !== 'undefined' &&
            typeof document !== 'undefined' &&
            typeof parent !== 'undefined' &&
            typeof parent.window !== 'undefined' &&
            parent.window !== window
    }

    /// Get msafe dapp url, which can be used to open dapp under msafe wallet.
    /// @param msafe: network type or msafe website url
    /// @param dappUrl: dapp url
    static getAppUrl(msafe: MsafeNetwork = 'Mainnet', dappUrl = `${window.location.href}`): string {
        const msafeOrigin = MsafeWallet.getOrigin(msafe);
        return `${msafeOrigin}/apps/0?url=${encodeURIComponent(dappUrl)}`;
    }

    /// Get msafe origin by network type or url
    /// @param msafe: network type or msafe website url
    static getOrigin(msafe: MsafeNetwork = 'Mainnet'): string {
        return new URL(MsafeOrigins[msafe as NetworkType] || msafe).origin;
    }

    /// Open msafe wallet and establish communication with the msafe website.
    /// The allowlist is used to check if the msafe website is trusted.
    /// @param allowlist: allowlist of msafe website url, omit means accpets all msafe websites. you can pass a single url or an array of urls.
    static async new(allowlist: MsafeNetworks = Object.values(MsafeOrigins)): Promise<MsafeWallet> {
        const msafeOrigin = allowlist instanceof Array ? allowlist.map(m=>MsafeWallet.getOrigin(m)) : [MsafeWallet.getOrigin(allowlist)];
        const connector = await Connector.connect(window.parent, msafeOrigin);
        return new MsafeWallet(connector);
    }
}
