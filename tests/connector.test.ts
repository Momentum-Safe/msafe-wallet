import { Connector } from '../src/connector'

const serverOrigin = 'https://m-safe.io';
const clientOrigin = 'https://dapp.io';
const fakeWindows = {
    handle: (ev: MessageEvent) => { },
    addEventListener: (type = 'message', handle: any) => fakeWindows.handle = handle,
    removeEventListener: (type = 'message', handle: any) => { fakeWindows.handle = () => { } },
    postMessage: (message: string, origin: string, ports: MessagePort[]) => {
        fakeWindows.handle(new MessageEvent('message', { data: message, origin: clientOrigin, ports: ports }));
    }
};
global.window = fakeWindows as any;

test("Connector integration test", async () => {
    let done: (v: any) => void;
    const cleaner = Connector.accepts(clientOrigin, (connector: Connector) => {
        expect(connector.connected).toEqual(true);
        connector.on("message", (data: any) => {
            expect(data).toEqual("ping");
            connector.send("pong");
        })
    });

    const connector = await Connector.connect(fakeWindows, serverOrigin);
    cleaner();
    expect(connector.connected).toEqual(true);
    connector.on("message", (data: any) => {
        expect(data).toEqual("pong");
        connector.close();
        done(undefined);
    });
    connector.send("ping");

    return new Promise(resolve => done = resolve);
});

describe("Connector unit test", () => {
    it("connect with client has version", async () => {
        const cleaner = Connector.accepts(clientOrigin, (connector: Connector) => {
            expect(connector.version.peer).toEqual(connector.version.self);
        });

        const connector = await Connector.connect(fakeWindows, serverOrigin);
        cleaner();
        // check version
        expect(connector.version.peer).toEqual(connector.version.self);
        connector.close();
    });

    it("connect with client without version", async () => {
        const cleaner = Connector.accepts(clientOrigin, (connector: Connector) => {
            expect(connector.version.peer).toEqual(undefined);
        });

        const postMessage = fakeWindows.postMessage;
        fakeWindows.postMessage = (message: string, origin: string, ports: MessagePort[]) => {
            if (Connector.isHandshakeMessage(message, Connector.HANDSHAKE_REQ)) {
                message = Connector.toHandshakeVersion(Connector.HANDSHAKE_REQ, false);
            }
            return postMessage(message, origin, ports);
        }

        const connector = await Connector.connect(fakeWindows, serverOrigin);
        cleaner();

        // check version
        expect(connector.version.peer).toEqual(undefined);
        connector.close();
    });

});