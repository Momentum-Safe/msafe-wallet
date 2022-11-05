import { Connector } from "./connector";
import { JsonRPCServer } from "./JsonRPCServer";
import { Account, WalletAPI, WalletEvent } from "./WalletAPI";

export class MsafeServer {
    public server: JsonRPCServer;
    constructor(connector: Connector, methods: WalletAPI) {
        this.server = new JsonRPCServer(connector, methods as any);
    }
    changeNetwork(network: string) {
        this.server.notify(WalletEvent.ChangeNetwork, [network]);
    }
    changeAccount(account: Account) {
        this.server.notify(WalletEvent.ChangeAccount, [account]);
    }
}