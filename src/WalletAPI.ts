export type Account = {
    address: string,
    publicKey: string,
}

export type Option = {
    max_gas_amount: string,
    gas_unit_price: string,
    expiration_timestamp_secs: string,
    sequence_number: string,
    sender: string,
}

type Array<T> = T[];
type Base = string | number | Uint8Array | boolean;
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