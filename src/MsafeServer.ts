import {Connector} from "./connector";
import {JsonRPCServer} from "./JsonRPCServer";
import {Account, LegacyAccount, WalletAPI, WalletEvent} from "./WalletAPI";
import {isMultiSigFormatVersion} from "./version";
import {convertPKsToMultiSigPK} from "./utils";

export class MsafeServer {
  public server: JsonRPCServer;
  constructor(connector: Connector, methods: WalletAPI) {
      this.server = new JsonRPCServer(connector, methods as any);
  }
  changeNetwork(network: string) {
        this.server.notify(WalletEvent.ChangeNetwork, [network]);
  }
  changeAccount(account: Account) {
    const peerVersion = this.version.peer;
    if (isMultiSigFormatVersion(peerVersion)) {
      this.server.notify(WalletEvent.ChangeAccount, [account]);
    } else {
      const legacyAccount: LegacyAccount = {
        address: account.address,
        publicKey: convertPKsToMultiSigPK(account.publicKey, account.minKeysRequired),
      };
      this.server.notify(WalletEvent.ChangeAccount, [legacyAccount]);
    }
  }

  get version() {
    return this.server.version;
  }
}


