import { SolanaChainIDs as Chains } from './constants.js';
export function getChainsFromChainId(chainId) {
    let chains = [chainId];
    if (chainId === Chains.Mainnet || chainId === Chains.Deprecated_Mainnet) {
        chains = [Chains.Mainnet, Chains.Deprecated_Mainnet];
        if (chainId === Chains.Deprecated_Mainnet)
            console.warn(chainWarns.mainnet);
    }
    else if (chainId === Chains.Deprecated_Devnet || chainId === Chains.Devnet) {
        chains = [Chains.Devnet, Chains.Deprecated_Devnet];
        if (Chains.Deprecated_Devnet)
            console.warn(chainWarns.devnet);
    }
    return chains;
}
const chainWarns = {
    mainnet: `You are using a deprecated chain ID for Solana Mainnet, please use ${Chains.Mainnet} instead.`,
    devnet: `You are using a deprecated chain ID for Solana Devnet, please use ${Chains.Devnet} instead.`,
    wallet: 'The connected wallet is using a deprecated chain ID for Solana. Please, contact them to upgrade. You can learn more at https://github.com/ChainAgnostic/namespaces/blob/main/solana/caip10.md#chain-ids',
};
export function getDefaultChainFromSession(session, selectedChain) {
    const chains = session.namespaces.solana?.accounts.map((account) => 'solana:' + account.split(':')[1]);
    if (selectedChain === Chains.Mainnet) {
        if (chains.find((chain) => chain === Chains.Mainnet)) {
            return Chains.Mainnet;
        }
        else {
            console.warn(chainWarns.wallet);
            return Chains.Deprecated_Mainnet;
        }
    }
    else if (selectedChain === Chains.Devnet) {
        if (chains.find((chain) => chain === Chains.Devnet)) {
            return Chains.Devnet;
        }
        else {
            console.warn(chainWarns.wallet);
            return Chains.Deprecated_Devnet;
        }
    }
    throw Error('WalletConnect Solana Adapter: Unable to get a default chain from the session.');
}
//# sourceMappingURL=chainIdPatch.js.map