import {BigNumber, utils} from 'ethers';
import {network} from '@jovijovi/ether-network';
import {core} from '@jovijovi/ether-core';
import {log, util} from '@jovijovi/pedrojs-common';
import {Avatar, Avatar__factory} from '../../../../typechain-types';
import {customConfig} from '../../../config';
import {DefaultRetryMaxInterval, DefaultRetryMinInterval, DefaultRetryTimes} from './params';

// Get contract class
export function GetContract(address: string, pk?: string): Avatar {
	if (!pk) {
		return Avatar__factory.connect(address, network.MyProvider.Get());
	}
	return Avatar__factory.connect(address, core.GetWallet(pk));
}

// Get gas price (Unit: Wei)
// returns floating gas price by default
export async function GetGasPrice(): Promise<BigNumber> {
	const conf = customConfig.GetTxConfig();
	const gasPriceC = conf.gasPriceC >= 100 ? conf.gasPriceC : 100;

	const provider = network.MyProvider.Get();
	const gasPrice = await util.retry.Run(async (): Promise<BigNumber> => {
		return await provider.getGasPrice();
	}, DefaultRetryTimes, RandomRetryInterval(), false);

	const floatingGasPrice = gasPrice.mul(BigNumber.from(gasPriceC)).div(100);

	log.RequestId().debug("OriginalGasPrice=%sGwei, FloatingGasPrice=%sGwei, gasPriceC=%d",
		utils.formatUnits(gasPrice, "gwei"), utils.formatUnits(floatingGasPrice, "gwei"), gasPriceC);

	return floatingGasPrice;
}

// Random retry interval
export function RandomRetryInterval(): number {
	return util.retry.RandomRetryInterval(DefaultRetryMinInterval, DefaultRetryMaxInterval);
}
