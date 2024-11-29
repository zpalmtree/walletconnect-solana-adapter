import { Transaction, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { UniversalProvider } from '@walletconnect/universal-provider';
import { parseAccountId } from '@walletconnect/utils';
import base58 from 'bs58';
import { ClientNotInitializedError } from './errors.js';
import { getChainsFromChainId, getDefaultChainFromSession } from './utils/chainIdPatch.js';
import { WalletConnectionError } from '@solana/wallet-adapter-base';
export var WalletConnectChainID;
(function (WalletConnectChainID) {
    WalletConnectChainID["Mainnet"] = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
    WalletConnectChainID["Devnet"] = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
    WalletConnectChainID["Deprecated_Mainnet"] = "solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ";
    WalletConnectChainID["Deprecated_Devnet"] = "solana:8E9rvCKLFQia2Y35HXjjpWzj8weVo44K";
})(WalletConnectChainID || (WalletConnectChainID = {}));
export var WalletConnectRPCMethods;
(function (WalletConnectRPCMethods) {
    WalletConnectRPCMethods["signTransaction"] = "solana_signTransaction";
    WalletConnectRPCMethods["signMessage"] = "solana_signMessage";
    WalletConnectRPCMethods["signAndSendTransaction"] = "solana_signAndSendTransaction";
    WalletConnectRPCMethods["signAllTransactions"] = "solana_signAllTransactions";
})(WalletConnectRPCMethods || (WalletConnectRPCMethods = {}));
const getConnectParams = (chainId) => {
    /** Workaround to support old chain Id configuration */
    const chains = getChainsFromChainId(chainId);
    return {
        optionalNamespaces: {
            solana: {
                chains,
                methods: [WalletConnectRPCMethods.signTransaction, WalletConnectRPCMethods.signMessage],
                events: [],
            },
        },
    };
};
const isVersionedTransaction = (transaction) => 'version' in transaction;
export class WalletConnectWallet {
    _UniversalProvider;
    _session;
    _modal;
    _projectId;
    _network;
    _ConnectQueueResolver;
    constructor(config) {
        this.initClient(config.options);
        this._network = config.network;
        if (!config.options.projectId) {
            throw Error('WalletConnect Adapter: Project ID is undefined');
        }
        this._projectId = config.options.projectId;
    }
    async connect() {
        if (!this._UniversalProvider) {
            await new Promise((res) => {
                this._ConnectQueueResolver = res;
            });
        }
        if (!this._UniversalProvider) {
            throw new Error("WalletConnect Adapter - Universal Provider was undefined while calling 'connect()'");
        }
        if (this._UniversalProvider.session) {
            this._session = this._UniversalProvider.session;
            const defaultNetwork = getDefaultChainFromSession(this._session, this._network);
            this._network = defaultNetwork;
            this._UniversalProvider.setDefaultChain(defaultNetwork);
            return {
                publicKey: this.publicKey,
            };
        }
        else {
            try {
                // Lazy load the modal
                await this.initModal();
                //@ts-ignore AllWallets view type missing.
                this._modal?.open({ view: 'AllWallets' });
                let unsubscribeFromModalState;
                const session = await new Promise((res) => {
                    unsubscribeFromModalState = this._modal?.subscribeState(({ open }) => {
                        if (!open) {
                            res(this._UniversalProvider?.session);
                        }
                    });
                });
                this._session = session;
                unsubscribeFromModalState?.();
                if (!session) {
                    throw new WalletConnectionError();
                }
                const defaultNetwork = getDefaultChainFromSession(session, this._network);
                this._network = defaultNetwork;
                this._UniversalProvider?.setDefaultChain(defaultNetwork);
                return { publicKey: this.publicKey };
            }
            catch (error) {
                throw error;
            }
        }
    }
    async disconnect() {
        if (this._UniversalProvider?.session) {
            // Lazy load the modal
            await this.initModal();
            if (!this._modal)
                throw Error('WalletConnect Adapter -Modal is undefined: unable to disconnect');
            await this._modal.disconnect();
            this._session = undefined;
        }
        else {
            throw new ClientNotInitializedError();
        }
    }
    get client() {
        if (this._UniversalProvider) {
            // TODO: using client.off throws an error
            return this._UniversalProvider;
            // return this._client;
        }
        else {
            throw new ClientNotInitializedError();
        }
    }
    get session() {
        if (!this._session) {
            throw new ClientNotInitializedError();
        }
        return this._session;
    }
    get publicKey() {
        if (this._UniversalProvider?.session && this._session) {
            const { address } = parseAccountId(this._session.namespaces.solana.accounts[0]);
            return new PublicKey(address);
        }
        else {
            throw new ClientNotInitializedError();
        }
    }
    async signTransaction(transaction) {
        this.checkIfWalletSupportsMethod(WalletConnectRPCMethods.signTransaction);
        const isVersioned = isVersionedTransaction(transaction);
        const legacyTransaction = isVersioned ? {} : transaction;
        const { signature, transaction: signedSerializedTransaction } = await this.client.client.request({
            chainId: this._network,
            topic: this.session.topic,
            request: {
                method: WalletConnectRPCMethods.signTransaction,
                params: {
                    // Passing ...legacyTransaction is deprecated.
                    // All new clients should rely on the `transaction` parameter.
                    // The future versions will stop passing ...legacyTransaction.
                    ...legacyTransaction,
                    // New base64-encoded serialized transaction request parameter
                    transaction: this.serialize(transaction),
                },
            },
        });
        if (signedSerializedTransaction) {
            return this.deserialize(signedSerializedTransaction, isVersioned);
        }
        transaction.addSignature(this.publicKey, Buffer.from(base58.decode(signature)));
        return transaction;
    }
    async signMessage(message) {
        this.checkIfWalletSupportsMethod(WalletConnectRPCMethods.signMessage);
        const { signature } = await this.client.client.request({
            // The network does not change the output of message signing, but this is a required parameter for SignClient
            chainId: this._network,
            topic: this.session.topic,
            request: {
                method: WalletConnectRPCMethods.signMessage,
                params: {
                    pubkey: this.publicKey.toString(),
                    message: base58.encode(message),
                },
            },
        });
        return base58.decode(signature);
    }
    async signAndSendTransaction(transaction) {
        this.checkIfWalletSupportsMethod(WalletConnectRPCMethods.signAndSendTransaction);
        const { signature } = await this.client.client.request({
            chainId: this._network,
            topic: this.session.topic,
            request: {
                method: WalletConnectRPCMethods.signAndSendTransaction,
                params: { transaction: this.serialize(transaction) },
            },
        });
        return signature;
    }
    async signAllTransactions(transactions) {
        try {
            this.checkIfWalletSupportsMethod(WalletConnectRPCMethods.signAllTransactions);
            const serializedTransactions = transactions.map((transaction) => this.serialize(transaction));
            const { transactions: serializedSignedTransactions } = await this.client.client.request({
                chainId: this._network,
                topic: this.session.topic,
                request: {
                    method: WalletConnectRPCMethods.signAllTransactions,
                    params: { transactions: serializedTransactions },
                },
            });
            return transactions.map((transaction, index) => {
                if (isVersionedTransaction(transaction)) {
                    return this.deserialize(serializedSignedTransactions[index], true);
                }
                return this.deserialize(serializedSignedTransactions[index]);
            });
        }
        catch (error) {
            if (error instanceof WalletConnectFeatureNotSupportedError) {
                const signedTransactions = [];
                for (const transaction of transactions) {
                    signedTransactions.push(await this.signTransaction(transaction));
                }
                return signedTransactions;
            }
            throw error;
        }
    }
    async initClient(options) {
        const provider = await UniversalProvider.init(options);
        this._UniversalProvider = provider;
        if (this._ConnectQueueResolver)
            this._ConnectQueueResolver(true);
    }
    async initModal() {
        if (this._modal)
            return;
        if (!this._UniversalProvider)
            throw new Error('WalletConnect Adapter - cannot init modal when Universal Provider is undefined');
        const { WalletConnectModal } = await import('@walletconnect/solana-adapter-ui');
        this._modal = new WalletConnectModal({
            projectId: this._projectId,
            universalProvider: this._UniversalProvider,
            namespaces: getConnectParams(this._network).optionalNamespaces,
        });
    }
    serialize(transaction) {
        return Buffer.from(transaction.serialize({ verifySignatures: false })).toString('base64');
    }
    deserialize(serializedTransaction, versioned = false) {
        if (versioned) {
            return VersionedTransaction.deserialize(Buffer.from(serializedTransaction, 'base64'));
        }
        return Transaction.from(Buffer.from(serializedTransaction, 'base64'));
    }
    checkIfWalletSupportsMethod(method) {
        if (!this.session.namespaces['solana']?.methods.includes(method)) {
            throw new WalletConnectFeatureNotSupportedError(method);
        }
    }
}
export class WalletConnectFeatureNotSupportedError extends Error {
    constructor(method) {
        super(`WalletConnect Adapter - Method ${method} is not supported by the wallet`);
        this.name = 'WalletConnectFeatureNotSupportedError';
    }
}
//# sourceMappingURL=core.js.map