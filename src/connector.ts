import { version } from '../package.json';

export class Connector {
    static version = version;
    static HANDSHAKE_REQ = 'HANDSHAKE_REQ';
    static HANDSHAKE_ACK = 'HANDSHAKE_ACK';
    connected = true;
    onClose?: () => void;
    onMessage?: (data: any) => void;
    constructor(public readonly port: MessagePort, public readonly peerVersion?: string) {
        this.port.onmessage = (ev) => {
            this.onMessage && this.onMessage(ev.data);
        };
        this.port.onmessageerror = () => {
            this.close();
        };
    }

    send(data: any) {
        this.port.postMessage(data);
    }

    on(type: 'close' | 'message', handle: (data?: string) => void) {
        switch (type) {
            case 'close':
                this.onClose = handle;
                break;
            case 'message':
                this.onMessage = handle;
                break;
            default:
                throw Error("invlaid type");
        }
    }

    get version() {
        return {
            self: Connector.version,
            peer: this.peerVersion,
        }
    }

    close() {
        if (this.connected) {
            this.port.close();
            this.connected = false;
            this.onClose && this.onClose();
        }
    }

    static isHandshakeMessage(data: string, handshakeType: string) {
        return data.startsWith(handshakeType);
    }

    static getHandshakeVersion(data: string) {
        return String(data).split(':')[1];
    }

    static toHandshakeVersion(handshakeType: string, withVersion = true) {
        return withVersion ? `${handshakeType}:${Connector.version}` : handshakeType;
    }

    // client connect to server
    static async connect(targetWindow: any, origin: string): Promise<Connector> {
        return new Promise((resolve, rejected) => {
            const channelPair = new MessageChannel();
            let timer = setTimeout(rejected, 1000);
            channelPair.port1.onmessage = ev => {
                if (Connector.isHandshakeMessage(ev.data, Connector.HANDSHAKE_ACK)) {
                    clearTimeout(timer);
                    const version = Connector.getHandshakeVersion(ev.data);
                    resolve(new Connector(channelPair.port1, version));
                }
            };
            targetWindow.postMessage(Connector.toHandshakeVersion(Connector.HANDSHAKE_REQ), origin, [channelPair.port2]);
        });
    }
    // server listening connection request
    static accepts(origin: string, fallback: (connector: Connector) => void): () => void {
        const handle = (ev: MessageEvent) => {
            if (ev.origin !== origin) return;
            if (!Connector.isHandshakeMessage(ev.data, Connector.HANDSHAKE_REQ)) return;
            const version = Connector.getHandshakeVersion(ev.data);
            const port = ev.ports[0];
            port.postMessage(Connector.toHandshakeVersion(Connector.HANDSHAKE_ACK, version !== undefined));
            fallback(new Connector(ev.ports[0], version));
        };
        window.addEventListener('message', handle);
        return () => window.removeEventListener('message', handle);
    }

    static async accept(origin: string): Promise<Connector> {
        return new Promise((resolve) => {
            const cleaner = this.accepts(origin, (connector) => {
                resolve(connector);
                cleaner();
            });
        });
    }
}