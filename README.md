# Msafe Iframe SDK
Msafe Iframe SDK is used to integrate any dapp into msafe multi-sign wallet.  
The frontend of dapp will run in a sub-iframe of msafe, this SDK can be used for the interaction between dapp and msafe wallet. 

## Install

Installation of the [npm package]:

```
> npm install --save msafe-iframe
```

## Usage
### Init msafe wallet
You should initialize it once and use it later.
```typescript
import { MsafeWallet } from "msafe-iframe";
const msafe = await MsafeWallet.new();
```

### Connect/Disconnect to a msafe account
Connect/Disconnect to a account.
```typescript
import { MsafeWallet } from "msafe-iframe";
const msafe = await MsafeWallet.new();
const account = await msafe.connect(); // {addres:string, publicKey:string}
await msafe.isConnected(); // true
await msafe.disconnect();
await msafe.isConnected(); // false
```

### Get Network
Get current network.
```typescript
import { MsafeWallet } from "msafe-iframe";
const msafe = await MsafeWallet.new();
const network:string = await msafe.network(); // mainnet
```

### Get Account
Get current msafe account.
```typescript
import { MsafeWallet } from "msafe-iframe";
const msafe = await MsafeWallet.new();
const account:Account = await msafe.account();
console.log("address:", account.address);
console.log("public key:", account.publicKey);
```

### Get ChainId
Get current ChainId.
```typescript
import { MsafeWallet } from "msafe-iframe";
const msafe = await MsafeWallet.new();
const account = await msafe.chainId();  // 1
```

### Submit Transaction
Request a signature and send a transaction to the blockchain.
- `payload` - mandatory parameter containing the transaction body.
- `option` - optional parameter that overrides transaction parameters.
> - For arguments of type vector, you can pass in an array.
> - For `vector<u8>`, you can pass in `Uint8Array`.
> - You can also pass in a BCS serialized transaction as payload(`Uint8Array`), which ignores option.
```typescript
import { MsafeWallet } from "msafe-iframe";
const msafe = await MsafeWallet.new();
const payload = {
    function: "0x1::coin::transfer",
    type_arguments: ["0x1::aptos_coin::AptosCoin"],
    arguments: ["0x997b38d2127711011462bc42e788a537eae77806404769188f20d3dc46d72750", 50]
};
const option = {
   sender: account.address,
   sequence_number: "1",
   max_gas_amount: "4000",
   gas_unit_price: "1",
   // Unix timestamp, in seconds + 10 seconds
   expiration_timestamp_secs: (Math.floor(Date.now() / 1000) + 10).toString(),
}
const txid:Uint8Array = await msafe.signAndSubmit(payload, option); // 32 bytes tx hash
```

### Sign Transaction
Request a signature of transaction.
- `payload` - mandatory parameter containing the transaction body.
- `option` - optional parameter that overrides transaction parameters.
> - For arguments of type vector, you can pass in an array.
> - For `vector<u8>`, you can pass in `Uint8Array`.
> - You can also pass in a BCS serialized transaction as payload(`Uint8Array`), which ignores option.

```typescript
import { MsafeWallet } from "msafe-iframe";
const msafe = await MsafeWallet.new();
const payload = {
    function: "0x1::coin::transfer",
    type_arguments: ["0x1::aptos_coin::AptosCoin"],
    arguments: ["0x997b38d2127711011462bc42e788a537eae77806404769188f20d3dc46d72750", 50]
};
const option = {
   sender: msafeAddress.hex(),
   sequence_number: "1",
   max_gas_amount: "4000",
   gas_unit_price: "1",
   // Unix timestamp, in seconds + 10 seconds
   expiration_timestamp_secs: (Math.floor(Date.now() / 1000) + 10).toString(),
}
const signedTxn:Uint8Array = await msafe.signTransaction(payload, option); // BCS serialized signed transaction
```

### Sign Message
Unsupported now.

### Network Change Event
Network change event.
```typescript
import { MsafeWallet } from "msafe-iframe";
const msafe = await MsafeWallet.new();
msafe.onChangeAccount((network:string)=>{
    console.log("network change to:", network)
});
```

### Account Change Event
Account change event.
```typescript
import { MsafeWallet } from "msafe-iframe";
const msafe = await MsafeWallet.new();
msafe.onChangeAccount((account:Account)=>{
    console.log("address:", account.address);
    console.log("public key:", account.publicKey);
});
```

## Development

```
# Install dependencies
> npm install

# Build
> npm run build

# Publish
> npm publish
```

[npm package]: https://www.npmjs.com/package/msafe-iframe