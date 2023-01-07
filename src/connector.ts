import { version } from '../package.json';
import { isAllowList } from './version';

export class Connector {
    static version = version;
    static HANDSHAKE_REQ = 'HANDSHAKE_REQ';
    static HANDSHAKE_ACK = 'HANDSHAKE_ACK';
    static HANDSHAKE_PORT_ACK = 'HANDSHAKE_PORT_REQ';
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

    static getVersionFromHandshake(data: string) {
        return String(data).split(':')[1];
    }

    static toHandshakeMessage(handshakeType: string, withVersion = true) {
        return withVersion ? `${handshakeType}:${Connector.version}` : handshakeType;
    }

    // client connect to server
    static async connect(targetWindow: any, origins: string[]): Promise<Connector> {
        return new Promise((resolve, rejected) => {
            let cleaner = () => { };
            let timer = setTimeout(() => {
                cleaner();
                rejected('connect timeout');
            }, 1000);
            const handle = (ev: MessageEvent) => {
                const port = ev.ports[0];
                if (!origins.includes(ev.origin)) return;
                if (!Connector.isHandshakeMessage(ev.data, Connector.HANDSHAKE_PORT_ACK)) return;
                cleaner();
                const version = Connector.getVersionFromHandshake(ev.data);
                resolve(new Connector(port, version));
            };
            cleaner = () => {
                clearTimeout(timer);
                window.removeEventListener('message', handle);
            };
            window.addEventListener('message', handle);
            targetWindow.postMessage(Connector.toHandshakeMessage(Connector.HANDSHAKE_REQ), '*');
        });
    }
    // server listening connection request
    static accepts(origin: string, handler: (connector: Connector) => void): () => void {
        origin = new URL(origin).origin;
        const handle = (ev: MessageEvent) => {
            if (ev.origin !== origin) return;
            if (!Connector.isHandshakeMessage(ev.data, Connector.HANDSHAKE_REQ)) return;
            const version = Connector.getVersionFromHandshake(ev.data);
            if (isAllowList(version)) {
                const channelPair = new MessageChannel();
                (ev.source as Window).postMessage(Connector.toHandshakeMessage(Connector.HANDSHAKE_PORT_ACK), ev.origin, [channelPair.port2]);
                handler(new Connector(channelPair.port1, version));
            } else {
                const port = ev.ports[0];
                port.postMessage(Connector.toHandshakeMessage(Connector.HANDSHAKE_ACK, version !== undefined));
                handler(new Connector(ev.ports[0], version));
            }
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