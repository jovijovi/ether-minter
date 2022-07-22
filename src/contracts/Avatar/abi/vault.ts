import {utils} from 'ethers';
import {customConfig} from '../../../config';

// GetVaultKeyStoreSK returns vault keystore SK
export function GetVaultKeyStoreSK(address: string): string {
	const vaultList = customConfig.GetVaultList();

	for (const vault of vaultList) {
		if (utils.getAddress(vault.address) === utils.getAddress(address)) {
			if (!vault.keyStoreSK) {
				throw new Error(`Invalid keystore SK`);
			}
			return vault.keyStoreSK;
		}
	}

	throw new Error(`No matching address in keystore`);
}
