import {ethers} from 'hardhat';
import {utils} from 'ethers';
import {env} from 'process';
import {core} from '@jovijovi/ether-core';
import {network} from '@jovijovi/ether-network';
import {log} from '@jovijovi/pedrojs-common';
import {ContractName} from './params';
import {Avatar, Avatar__factory} from '../../../../typechain-types';
import {GasPriceCircuitBreaker} from './breaker';
import {customConfig} from '../../../config';

// Deploy contract
export async function Deploy(name: string, symbol: string, baseTokenURI: string, isWait = true, reqId?: string): Promise<any> {
	// Step 1. Get provider
	const provider = network.MyProvider.Get();

	// Step 2. Check gas price
	// Get gas price (Unit: Wei)
	const gasPrice = await provider.getGasPrice();

	// Check gasPrice by circuit breaker
	if (GasPriceCircuitBreaker(gasPrice, reqId)) {
		log.RequestId(reqId).warn("Deploy request terminated due to high gas price. Name=%s, Symbol=%s, BaseTokenURI=%s, GasPrice=%sGwei",
			name, symbol, baseTokenURI, utils.formatUnits(gasPrice, "gwei"));
		return {
			code: customConfig.GetMintRspCode().THRESHOLD,
			msg: "Deploy request terminated due to high gas price",
		};
	}

	// Step 3. Deploy
	const factory: Avatar__factory = await ethers.getContractFactory(ContractName, core.GetWallet(env.DEVELOPER_PK)) as Avatar__factory;
	const contract: Avatar = await factory.deploy(name, symbol, baseTokenURI);

	if (isWait) {
		await contract.deployTransaction.wait();
		log.RequestId(reqId).info("Contract(%s) deployed. Name=%s, Symbol=%s, BaseTokenURI=%s, GasPrice=%sGwei",
			contract.address, name, symbol, baseTokenURI, utils.formatUnits(gasPrice, "gwei"));
	} else {
		log.RequestId(reqId).info("Deploy contract(%s) tx committed. Name=%s, Symbol=%s, BaseTokenURI=%s, GasPrice=%sGwei",
			contract.address, name, symbol, baseTokenURI, utils.formatUnits(gasPrice, "gwei"));
	}

	return {
		name: name,
		symbol: symbol,
		baseTokenURI: baseTokenURI,
		address: contract.address,
		txHash: contract.deployTransaction.hash,
	}
}
