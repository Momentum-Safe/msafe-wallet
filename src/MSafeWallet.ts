import { Connector } from "./connector";
import { JsonRPCClient } from "./JsonRPCClient";
import { Account, WalletAPI, Option, Payload, WalletEvent, WalletRPC } from "./WalletAPI";
type onEventFunc = (data: any) => void

/// MSafe website urls, it acts as the default allowlist.
const MSafeOrigins = {
    Mainnet: 'https://app.m-safe.io',
    Testnet: 'https://testnet.m-safe.io',
    Partner: 'https://partner.m-safe.io',
};

/// Network type of MSafe websites. It can be 'Mainnet', 'Testnet' or 'Partner'. 
type NetworkType = keyof typeof MSafeOrigins;
/// NetworkType or MSafe website url.
type MSafeNetwork = NetworkType | string;
/// MSafeNetwork or array of MSafeNetwork.
type MSafeNetworks = MSafeNetwork | MSafeNetwork[];

export class MSafeWallet implements WalletAPI {

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

    /**
     * @description check if current page is running under MSafe wallet
     */
    static inMSafeWallet(): boolean {
        return typeof window !== 'undefined' &&
            typeof document !== 'undefined' &&
            typeof parent !== 'undefined' &&
            typeof parent.window !== 'undefined' &&
            parent.window !== window
    }
    /**
     * @deprecated use inMSafeWallet instead 
     */
    static inMsafeWallet(): boolean {
        return MSafeWallet.inMSafeWallet();
    }

    /** 
     * @description Get msafe dapp url, which can be used to open dapp under msafe wallet.
     * @param msafe network type or msafe website url
     * @param dappUrl dapp url
     */
    static getAppUrl(msafe: MSafeNetwork = 'Mainnet', dappUrl = `${window.location.href}`): string {
        const msafeOrigin = MSafeWallet.getOrigin(msafe);
        return `${msafeOrigin}/apps/0?url=${encodeURIComponent(dappUrl)}`;
    }

    /**
     * @description Get msafe origin by network type or url
     * @param msafe network type or msafe website url
     * @returns msafe origin
     */
    static getOrigin(msafe: MSafeNetwork = 'Mainnet'): string {
        return new URL(MSafeOrigins[msafe as NetworkType] || msafe).origin;
    }

    /**
     * @description Open msafe wallet and establish communication with the msafe website.
     *              The allowlist is used to check if the msafe website is trusted.
     * @param allowlist allowlist of msafe website url, omit means accpets all msafe websites. you can pass a single url or an array of urls.
     * @returns MSafeWallet instance
     * @example
     *  // 1. Initialize MSafeWallet with default allowlist:
     *      const wallet = await MSafeWallet.new();
     *  // 2. Initialize MSafeWallet with a single MSafe url:
     *      const wallet = await MSafeWallet.new('https://app.m-safe.io');
     *  // 3. Initialize MSafeWallet with an array of MSafe urls:
     *      const wallet = await MSafeWallet.new(['https://app.m-safe.io', 'https://testnet.m-safe.io', 'https://partner.m-safe.io']);
     *  // 4. Initialize MSafeWallet with a single network type:
     *      const wallet = await MSafeWallet.new('Mainnet');
     *  // 5. Initialize MSafeWallet with an array of network types:
     *      const wallet = await MSafeWallet.new(['Mainnet', 'Testnet', 'Partner']);
     */
    static async new(allowlist: MSafeNetworks = Object.values(MSafeOrigins)): Promise<MSafeWallet> {
        const msafeOrigin = allowlist instanceof Array ? allowlist.map(m=>MSafeWallet.getOrigin(m)) : [MSafeWallet.getOrigin(allowlist)];
        const connector = await Connector.connect(window.parent, msafeOrigin);
        return new MSafeWallet(connector);
    }
}

/**
 * @deprecated use MSafeWallet instead, it will be removed in the future.
 */
export class MsafeWallet extends MSafeWallet{}