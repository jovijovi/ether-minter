// Proxy
// ERC-1967 Ref: https://eips.ethereum.org/EIPS/eip-1967

import {constants, utils} from 'ethers';
import {network} from '@jovijovi/ether-network';
import {DefaultLogicContractImplSlot} from './params';
import {Cache} from '../../../common/cache';

// GetImplContractAddress returns logical contract address
export async function GetLogicalContractAddress(address: string): Promise<string> {
	const provider = network.MyProvider.Get();
	const result = await provider.getStorageAt(address, DefaultLogicContractImplSlot);
	return utils.hexZeroPad(utils.hexStripZeros(result), 20);
}

// IsProxyContract returns whether the address is a proxy contract address
export async function IsProxyContract(address: string): Promise<boolean> {
	// Check cache
	if (Cache.CacheProxyContractAddress.has(address)) {
		return Cache.CacheProxyContractAddress.get(address);
	}

	const result = await GetLogicalContractAddress(address) !== constants.AddressZero;

	// Update cache
	Cache.CacheProxyContractAddress.set(address, result);

	return result;
}
