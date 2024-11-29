import { Transaction, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { UniversalProvider } from '@walletconnect/universal-provider';
import type { SessionTypes, SignClientTypes } from '@walletconnect/types';
type UniversalProviderType = Awaited<ReturnType<typeof UniversalProvider.init>>;
export interface WalletConnectWalletAdapterConfig {
    network: WalletConnectChainID;
    options: SignClientTypes.Options;
}
export declare enum WalletConnectChainID {
    Mainnet = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    Devnet = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    Deprecated_Mainnet = "solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ",
    Deprecated_Devnet = "solana:8E9rvCKLFQia2Y35HXjjpWzj8weVo44K"
}
export declare enum WalletConnectRPCMethods {
    signTransaction = "solana_signTransaction",
    signMessage = "solana_signMessage",
    signAndSendTransaction = "solana_signAndSendTransaction",
    signAllTransactions = "solana_signAllTransactions"
}
interface WalletConnectWalletInit {
    publicKey: PublicKey;
}
export declare class WalletConnectWallet {
    private _UniversalProvider;
    private _session;
    private _modal;
    private _projectId;
    private _network;
    private _ConnectQueueResolver;
    constructor(config: WalletConnectWalletAdapterConfig);
    connect(): Promise<WalletConnectWalletInit>;
    disconnect(): Promise<void>;
    get client(): UniversalProviderType;
    get session(): SessionTypes.Struct;
    get publicKey(): PublicKey;
    signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    signAndSendTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<string>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
    initClient(options: SignClientTypes.Options): Promise<void>;
    initModal(): Promise<void>;
    private serialize;
    private deserialize;
    private checkIfWalletSupportsMethod;
}
export declare class WalletConnectFeatureNotSupportedError extends Error {
    constructor(method: WalletConnectRPCMethods);
}
export {};
//# sourceMappingURL=core.d.ts.map