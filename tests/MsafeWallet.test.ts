import { Connector } from '../src/connector'
import { MsafeWallet } from '../src/MsafeWallet';
import { MsafeServer } from '../src/MsafeServer';
import { Account, Payload, Option } from '../src/WalletAPI';
import { version } from '../package.json';

const TestData = {
    account: {
        address: "0xffeeddccbbaa9988776655443322110000112233445566778899aabbccddeeff",
        publicKey: ["0x00112233445566778899aabbccddeeffffeeddccbbaa99887766554433221100", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"],
        authKey: "0xaa9988776655443322110000112233445566778899aabbccddeeff0011223344",
        minKeysRequired: 2,
    },
    isConnected: false,
    network: "mainnet",
    chainId: 1,
    mockTxn: Uint8Array.from(Buffer.from("mockTxn")),
    mockTxnHash: Uint8Array.from(Buffer.from("mockTxnHash")),
    mockTxnSigned: Uint8Array.from(Buffer.from("mockTxnSigned")),
    message: "message",
}

test("MsafeWallet integration test", async () => {
    const channel = new MessageChannel();
    const msafeServer = new MsafeServer(new Connector(channel.port1, version), {
        async connect(): Promise<Account> {
            TestData.isConnected = true;
            return TestData.account;
        },
        async disconnect(): Promise<void> {
            TestData.isConnected = false;
        },
        async isConnected(): Promise<boolean> {
            return TestData.isConnected;
        },
        async network(): Promise<string> {
            return TestData.network;
        },
        async account(): Promise<Account> {
            if (!TestData.isConnected) throw "unauthorized";
            return TestData.account;
        },
        async chainId(): Promise<Number> {
            return TestData.chainId;
        },
        async signAndSubmit(
            payload: Payload,
            option?: Option
        ): Promise<Uint8Array> {
            expect(payload).toEqual(TestData.mockTxn);
            return TestData.mockTxnHash;
        },
        async signTransaction(
            payload: Payload,
            option?: Option
        ): Promise<Uint8Array> {
            expect(payload).toEqual(TestData.mockTxn);
            return TestData.mockTxnSigned;
        },
        async signMessage(
            message: string | Uint8Array
        ): Promise<Uint8Array> {
            expect(message).toEqual(TestData.message);
            throw "unsupport";
        },
    });
    const msafeWallet = new MsafeWallet(new Connector(channel.port2, version));
    // check version match
    expect(msafeWallet.version.peer).toEqual(version);
    expect(msafeServer.version.peer).toEqual(version);
    expect(msafeWallet.version.self).toEqual(msafeServer.version.self);

    await expect(msafeWallet.isConnected()).resolves.toEqual(false);
    await expect(msafeWallet.signMessage(TestData.message)).rejects.toEqual('unsupport');
    await expect(msafeWallet.account()).rejects.toEqual('unauthorized');
    await expect(msafeWallet.connect()).resolves.toEqual(TestData.account);
    await expect(msafeWallet.isConnected()).resolves.toEqual(true);
    await expect(msafeWallet.network()).resolves.toEqual(TestData.network);
    await expect(msafeWallet.chainId()).resolves.toEqual(TestData.chainId);
    await expect(msafeWallet.signAndSubmit(TestData.mockTxn)).resolves.toEqual(TestData.mockTxnHash);
    await expect(msafeWallet.signTransaction(TestData.mockTxn)).resolves.toEqual(TestData.mockTxnSigned);
    await msafeWallet.disconnect();
    await expect(msafeWallet.isConnected()).resolves.toEqual(false);

    msafeWallet.onChangeAccount((account) => {
        expect(account).toEqual(TestData.account)
    });

    msafeWallet.onChangeNetwork((network) => {
        expect(network).toEqual(TestData.network)
    });

    await msafeServer.changeAccount(TestData.account);
    await msafeServer.changeNetwork(TestData.network);
    channel.port1.close();
    channel.port2.close();
});

describe("MsafeWallet unit test", () => {
    it("getOrigin test", async () => {
        const msafeMainnet = MsafeWallet.getOrigin("Mainnet");
        expect(msafeMainnet).toEqual("https://app.m-safe.io");
        const msafeTestnet = MsafeWallet.getOrigin("Testnet");
        expect(msafeTestnet).toEqual("https://testnet.m-safe.io");
        const msafeLocal = MsafeWallet.getOrigin("http://localhost:3000");
        expect(msafeLocal).toEqual("http://localhost:3000");
    });

    it("getAppUrl test", () => {
        const dappUrl = "https://dapp.io";
        const msafeMainnetDapp = MsafeWallet.getAppUrl('Mainnet', dappUrl);
        expect(msafeMainnetDapp).toEqual("https://app.m-safe.io/apps/0?url=https%3A%2F%2Fdapp.io");
        const msafeTestnetDapp = MsafeWallet.getAppUrl('Testnet', dappUrl);
        expect(msafeTestnetDapp).toEqual("https://testnet.m-safe.io/apps/0?url=https%3A%2F%2Fdapp.io");
        const msafeLocalDapp = MsafeWallet.getAppUrl('http://localhost:3000', dappUrl);
        expect(msafeLocalDapp).toEqual("http://localhost:3000/apps/0?url=https%3A%2F%2Fdapp.io");
    });

    it("inMsafeWallet test", () => {
        expect(MsafeWallet.inMsafeWallet()).toEqual(false);

        global.window = {} as any;
        global.document = {} as any;
        global.parent = { window: {} } as any;
        expect(MsafeWallet.inMsafeWallet()).toEqual(true);
    });
});