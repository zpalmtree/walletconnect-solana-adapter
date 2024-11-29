import type { SessionTypes } from '@walletconnect/types';
import { SolanaChainIDs as Chains } from './constants.js';
type ChainIDType = (typeof Chains)[keyof typeof Chains];
export declare function getChainsFromChainId(chainId: ChainIDType): ChainIDType[];
export declare function getDefaultChainFromSession(session: SessionTypes.Struct, selectedChain: ChainIDType): "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" | "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" | "solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ" | "solana:8E9rvCKLFQia2Y35HXjjpWzj8weVo44K";
export {};
//# sourceMappingURL=chainIdPatch.d.ts.map