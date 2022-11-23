export class Connector {
    static HANDSHAKE_REQ = 'HANDSHAKE_REQ';
    static HANDSHAKE_ACK = 'HANDSHAKE_ACK';
    // REVIEW: Shall there be multiple onClose event? Shall it be a structure of queue?
    onClose?: () => void;
    // REVIEW: message handle queue?
    onMessage?: (data: any) => void;
    constructor(public readonly port: MessagePort, public connected: boolean) {
        this.port.onmessage = (ev) => {
            this.onMessage && this.onMessage(ev.data);
        };
        this.port.onmessageerror = () => {
            this.close();
            this.onClose && this.onClose();
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

    close() {
        if (this.connected) {
            this.port.close();
            // REVIEW: this.port.onClose && this.port.onClose()
            this.connected = false
        }
    }
    // client connect to server
    static async connect(targetWindow: any, origin: string): Promise<Connector> {
        return new Promise((resolve, rejected) => {
            const channelPair = new MessageChannel();
            let timer = setTimeout(rejected, 1000);
            channelPair.port1.onmessage = ev => {
                if (ev.data === this.HANDSHAKE_ACK) {
                    clearTimeout(timer);
                    resolve(new Connector(channelPair.port1, true));
                }
            };
            targetWindow.postMessage(Connector.HANDSHAKE_REQ, origin, [channelPair.port2]);
        });
    }
    // server listening connection request
    static accepts(origin: string, fallback: (connector: Connector) => void): () => void {
        const handle = (ev: MessageEvent) => {
            // REVIEW: shall we throw an error?
            if (ev.origin !== origin) return;
            // REVIEW: throw an error?
            if (ev.data !== Connector.HANDSHAKE_REQ) return;
            const port = ev.ports[0];
            port.postMessage(this.HANDSHAKE_ACK);
            fallback(new Connector(ev.ports[0], true));
        };
        window.addEventListener('message', handle);
        return () => window.removeEventListener('message', handle);
    }

    static async accept(origin: string): Promise<Connector> {
        return new Promise((resolve) => {
            const cleaner = this.accepts(origin, (connector) => {
                resolve(connector);
                // REVIEW: Is this correct? Looks like an infinite loop?
                cleaner();
            });
        });
    }
}