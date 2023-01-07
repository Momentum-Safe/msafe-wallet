import {Account, adaptLegacyAccount, LegacyAccount, Option, Payload, WalletAPI} from "../src";

const fakeAccount: Account = {
  publicKey: ["0x1", "0x2", "0x3"],
  address: "0x123",
  minKeysRequired: 3,
  authKey: "0x456",
}

const fakeLegacyAccount: LegacyAccount = {
  publicKey: "0x12303",
  address: "0x123",
}

const fakeLatestWalletAPI: WalletAPI = {
  async connect(): Promise<Account> {return fakeAccount},
  async disconnect(): Promise<void> {},
  async isConnected(): Promise<boolean> {return true},
  async network(): Promise<string> {return 'unit test'},
  async account(): Promise<Account> {return fakeAccount},
  async chainId(): Promise<Number> {return 1234},
  async signAndSubmit(payload: Payload, option?: Option): Promise<Uint8Array> {return new Uint8Array(64)},
  async signTransaction(payload: Payload, option?: Option): Promise<Uint8Array> {return new Uint8Array(64)},
  async signMessage(message: string | Uint8Array): Promise<Uint8Array> {return new Uint8Array(64)},
}

describe('LegacyWalletAPI', () => {

  it('legacy compatibility', async () => {
    const legacyWA = adaptLegacyAccount(fakeLatestWalletAPI);
    expect(await legacyWA.account()).toEqual(fakeLegacyAccount);
  })

})
