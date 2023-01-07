import {toLegacyAccount} from "./utils";

export interface Account {
    publicKey: string[];
    address: string;
    authKey: string;
    minKeysRequired: number;
}

export interface LegacyAccount {
  address: string,
  publicKey: string,
}

export type Option = Partial<{
    max_gas_amount: string | bigint,
    gas_unit_price: string | bigint,
    expiration_timestamp_secs: string | bigint,
    sequence_number: string | bigint,
    sender: string,
}>;

type Array<T> = T[];
type Base = string | number | BigInt | Uint8Array | boolean;
type Arg<T> = T | Array<Base>;
type Args = Array<Arg<Base>>;

export type Payload = {
    function: string,
    type_arguments: string[],
    arguments: Args,
} | Uint8Array;

export interface WalletAPI {
    connect(): Promise<Account>,
    disconnect(): Promise<void>,
    isConnected(): Promise<boolean>,
    network(): Promise<string>,
    account(): Promise<Account>,
    chainId(): Promise<Number>,
    signAndSubmit(payload: Payload, option?: Option): Promise<Uint8Array>,
    signTransaction(payload: Payload, option?: Option): Promise<Uint8Array>,
    signMessage(message: string | Uint8Array): Promise<Uint8Array>,
}

export enum WalletEvent {
    ChangeAccount = 'ChangeAccountEvent',
    ChangeNetwork = 'ChangeNetworkEvent',
}

export enum WalletRPC {
    connect = 'connect',
    disconnect = 'disconnect',
    isConnected = 'isConnected',
    network = 'network',
    account = 'account',
    chainId = 'chainId',
    signAndSubmit = 'signAndSubmit',
    signTransaction = 'signTransaction',
    signMessage = 'signMessage',
}

// LegacyWalletAPI is the adapted version of walletAPI.
// It allows backward compatibility with legacy clients with account format `LegacyAccount`
export class LegacyWalletAPI {

    walletAPI: WalletAPI;

    constructor(walletAPI: WalletAPI) {
        this.walletAPI = walletAPI;
    }

    async connect(): Promise<LegacyAccount> {
        const account = await this.walletAPI.connect();
        return toLegacyAccount(account);
    }

    disconnect(): Promise<void> {
        return this.walletAPI.disconnect();
    }

    isConnected(): Promise<boolean> {
        return this.walletAPI.isConnected();
    }

    network(): Promise<string> {
        return this.walletAPI.network();
    }

    async account(): Promise<LegacyAccount> {
        const account = await this.walletAPI.account();
        return toLegacyAccount(account);
    }

    chainId(): Promise<Number> {
        return this.walletAPI.chainId();
    }

    signAndSubmit(payload: Payload, option?: Option): Promise<Uint8Array> {
        return this.walletAPI.signAndSubmit(payload, option);
    }

    signTransaction(payload: Payload, option?: Option): Promise<Uint8Array> {
        return this.walletAPI.signTransaction(payload, option);
    }

    signMessage(message: string | Uint8Array): Promise<Uint8Array> {
        return this.walletAPI.signMessage(message);
    }
}

export function adaptLegacyAccount(methods: WalletAPI): LegacyWalletAPI {
    // Adapt legacy account
    return new LegacyWalletAPI(methods)
}