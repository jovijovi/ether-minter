import {network} from '@jovijovi/ether-network';
import {core} from '@jovijovi/ether-core';
import {Avatar, Avatar__factory} from '../../../../typechain-types';

// Get contract class
export function GetContract(address: string, pk?: string): Avatar {
	if (!pk) {
		return Avatar__factory.connect(address, network.MyProvider.Get());
	}
	return Avatar__factory.connect(address, core.GetWallet(pk));
}
