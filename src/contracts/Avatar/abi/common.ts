import {network} from '@jovijovi/ether-network';
import {core} from '@jovijovi/ether-core';
import {Avatar, Avatar__factory, AvatarUpgradeable, AvatarUpgradeable__factory} from '../../../../typechain-types';
import {IsProxyContract} from './proxy';

// Get contract class
export async function GetContract(address: string, pk?: string): Promise<Avatar | AvatarUpgradeable> {
	if (!pk) {
		if (await IsProxyContract(address)) {
			return AvatarUpgradeable__factory.connect(address, network.MyProvider.Get());
		}
		return Avatar__factory.connect(address, network.MyProvider.Get());
	}

	if (await IsProxyContract(address)) {
		return AvatarUpgradeable__factory.connect(address, core.GetWallet(pk));
	}
	return Avatar__factory.connect(address, core.GetWallet(pk));
}
