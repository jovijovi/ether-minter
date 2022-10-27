import LRUCache from 'lru-cache';
import {cache} from '@jovijovi/pedrojs-common';

export namespace Cache {
	const cacheSet = cache.New();

	// CacheBalanceObserver
	// Cache: balance observer cache
	// ttl: 3 seconds
	export const CacheBalanceObserver = cacheSet.New("balanceObserver", {
		max: 1000,
		ttl: 1000 * 3,
	});

	// CacheTotalSupplyOfNFT
	// Cache: NFT contract total supply
	// ttl: 3 seconds
	export const CacheTotalSupplyOfNFT = cacheSet.New("totalSupplyOfNFT", {
		max: 1000,
		ttl: 1000 * 3,
	});

	// CacheEstimateGasOfTransferNFT
	// Cache: estimate gas of transfer NFT
	// ttl: 60 seconds
	export const CacheEstimateGasOfTransferNFT = cacheSet.New("estimateGasOfTransferNFT", {
		max: 1000,
		ttl: 1000 * 60,
	});

	// CacheOwnerOfNFT
	// Cache: owner of NFT
	// ttl: 60 seconds
	export const CacheOwnerOfNFT = cacheSet.New("OwnerOfNFT", {
		max: 100000,
		ttl: 1000 * 60,
	});

	// CacheTxResponse
	// Cache: tx response
	// ttl: 30 seconds
	export const CacheTxResponse = cacheSet.New("TxResponse", {
		max: 100000,
		ttl: 1000 * 30,
	});

	export function MemCache(name: string, ttl: number = 1000 * 60, max = 10): LRUCache<any, any> {
		return cacheSet.New(name, {
			max: max,   // 10 by default
			ttl: ttl,   // 1 min by default
		});
	}

	// Combination key
	export function CombinationKey(keys: string[]): string {
		return keys.toString();
	}
}
