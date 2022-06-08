import {BigNumber, utils} from 'ethers';
import {customConfig} from '../../../config';
import {log} from '@jovijovi/pedrojs-common';

// Gas price circuit breaker
export function GasPriceCircuitBreaker(gasPrice: BigNumber, reqId?: string): boolean {
	const threshold = utils.parseUnits(customConfig.GetMint().gasPrice.upper.threshold, "gwei");
	const isBreaker = gasPrice.gte(threshold);

	log.RequestId(reqId).info("Checking gas price... GasPrice=%sGwei, Threshold=%sGwei, CircuitBreaker=%s",
		utils.formatUnits(gasPrice, "gwei"), customConfig.GetMint().gasPrice.upper.threshold, isBreaker ? "YES" : "NO");

	return isBreaker;
}
