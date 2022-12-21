import { Connector } from '../src/connector'


test("Connector integration test", async () => {
    let done: (v: any) => void;
    const serverOrigin = 'https://m-safe.io';
    const clientOrigin = 'https://dapp.io';
    const fakeWindows = {
        handle: (ev: MessageEvent) => { },
        addEventListener: (type = 'message', handle: any) => fakeWindows.handle = handle,
        removeEventListener: (type = 'message', handle: any) => { fakeWindows.handle = () => { } },
        postMessage: (message: string, origin = serverOrigin, ports: MessagePort[]) => {
            fakeWindows.handle(new MessageEvent('message', { data: message, origin: clientOrigin, ports: ports }));
        }
    };
    global.window = fakeWindows as any;

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