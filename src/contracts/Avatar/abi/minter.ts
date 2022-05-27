import {customConfig} from '../../../config';
import {auditor, util} from '@jovijovi/pedrojs-common';

// GetMinter returns minter config
// TODO: Get idle minter randomly.
export function GetMinter(randomMinter = false): customConfig.Minter {
	auditor.Check(customConfig.GetMint().minterList.length > 0, "no minter exist");

	if (!randomMinter) {
		return customConfig.GetMint().minterList[0];
	}

	const index = util.random.RandIntBetween(0, customConfig.GetMint().minterList.length);

	return customConfig.GetMint().minterList[index];
}
