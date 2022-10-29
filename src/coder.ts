import { Buffer } from "buffer";
enum Type {
    Boolean,
    Number,
    BigInt,
    String,
    Uint8Array,
    Object,
    Array,
    Undefined,
    Null,
}

class Decoder {
    offset = 0;
    constructor(readonly data: Uint8Array) { }

    read(n: number): Uint8Array {
        const start = this.offset;
        this.offset += n;
        if (this.offset > this.data.length) throw Error("read overflow");
        return this.data.subarray(start, this.offset);
    }

    decodeBigInt(): bigint {
        return BigInt(this.decodeString());
    }

    decodeNumber(): number {
        return Number(this.decodeString());
    }

    decodeUint8Array(): Uint8Array {
        const length = Buffer.from(this.read(4)).readUInt32LE(0);
        return this.read(length);
    }

    decodeBoolean(): boolean {
        return Boolean(this.read(1));
    }

    decodeString(): string {
        const de = this.decodeUint8Array();
        return Buffer.from(de).toString();
    }

    decodeArray(): any[] {
        const length = this.decode<number>(); // decodeNumber
        return Array(length).fill(0).map(() => this.decode());
    }

    decodeObject(): { [key: string]: any } {
        const length = this.decode<number>(); // decodeNumber
        const entries = Array(length).fill(0).map(() => [this.decode<string>(), this.decode()]);
        return Object.fromEntries(entries);
    }

    decode<T>(): T {
        const type = this.read(1)[0] as Type;
        switch (type) {
            case Type.BigInt:
                return this.decodeBigInt() as any;
            case Type.Number:
                return this.decodeNumber() as any;
            case Type.Boolean:
                return this.decodeBoolean() as any;
            case Type.String:
                return this.decodeString() as any;
            case Type.Uint8Array:
                return this.decodeUint8Array() as any;
            case Type.Array:
                return this.decodeArray() as any;
            case Type.Object:
                return this.decodeObject() as any;
            case Type.Undefined:
                return undefined as any;
            case Type.Null:
                return null as any;
        }
        throw `unkonw type: ${type}`;
    }
}

function encodeUint8Array(data: Uint8Array): Uint8Array {
    const en = Buffer.alloc(data.length + 5);
    en[0] = Type.Uint8Array;
    en.writeUInt32LE(data.length, 1);
    en.set(data, 5);
    return en;
}


function encodeUndefined(): Uint8Array {
    return Buffer.from([Type.Undefined])
}

function encodeNull(): Uint8Array {
    return Buffer.from([Type.Null])
}

function encodeBigInt(data: bigint): Uint8Array {
    const en = encodeString(data.toString());
    en[0] = Type.BigInt;
    return en;
}

function encodeNumber(data: number): Uint8Array {
    const en = encodeString(data.toString());
    en[0] = Type.Number;
    return en;
}

function encodeBoolean(data: boolean): Uint8Array {
    return new Uint8Array([Type.Boolean, Number(data)]);
}

function encodeString(data: string): Uint8Array {
    const en = encodeUint8Array(Buffer.from(data));
    en[0] = Type.String;
    return en;
}

function encodeObject(data: { [key: string]: any }): Uint8Array {
    const entries = Object.entries(data);
    const ens = entries.map(([key, value]) => {
        const keyBuf = encode<string>(key);
        const valueBuf = encode(value);
        return Buffer.concat([keyBuf, valueBuf]);
    });
    return Buffer.concat([Buffer.from([Type.Object]), encode<number>(entries.length), ...ens]);
}


function encodeArray(data: any[]): Uint8Array {
    const ens = data.map(elem => encode(elem));
    return Buffer.concat([Buffer.from([Type.Array]), encode<number>(ens.length), ...ens]);
}


export function encode<T>(data: T): Uint8Array {
    if (data instanceof Uint8Array) {
        return encodeUint8Array(data);
    }
    if (data instanceof Array) {
        return encodeArray(data);
    }
    if (data instanceof Object) {
        return encodeObject(data);
    }
    if (data === null) {
        return encodeNull();
    }
    switch (typeof data) {
        case 'string':
            return encodeString(data);
        case 'number':
            return encodeNumber(data);
        case 'bigint':
            return encodeBigInt(data);
        case 'boolean':
            return encodeBoolean(data);
        case 'undefined':
            return encodeUndefined();
    }
    throw `unsuport type: ${data}`;
}

export function decode<T>(data: Uint8Array): T {
    const decoder = new Decoder(data);
    return decoder.decode();
}

export function encodeToStr<T>(data: T): string {
    return Buffer.from(encode(data)).toString('hex');
}

export function decodeFromStr<T>(data: string): T {
    return decode(Buffer.from(data, 'hex'));
}

