import {ethers, upgrades} from 'hardhat';
import {BigNumber, utils} from 'ethers';
import {core} from '@jovijovi/ether-core';
import {network} from '@jovijovi/ether-network';
import {log} from '@jovijovi/pedrojs-common';
import {keystore} from '@jovijovi/ether-keystore';
import {
	ContractName,
	DefaultContractInitializer,
	DefaultPollingInterval,
	DefaultProxyPattern,
	KeystoreTypeContractOwner
} from './params';
import {Avatar, Avatar__factory} from '../../../../typechain-types';
import {GasPriceCircuitBreaker} from './breaker';
import {customConfig} from '../../../config';

function getOperators(): string[] {
	// If enable random minter, returns all operators
	if (customConfig.GetMint().randomMinter) {
		const operators: string[] = [];
		for (const minter of customConfig.GetMint().minterList) {
			operators.push(minter.address);
		}
		return operators;
	}

	// Else returns 1st operator
	return [customConfig.GetMint().minterList[0].address];
}

// Deploy contract
export async function Deploy(name: string, symbol: string, baseTokenURI: string, maxSupply: number, pk: string, isWait = true, gasPriceC: number, reqId?: string): Promise<any> {
	// Step 1. Get provider
	const provider = network.MyProvider.Get();

	// Step 2. Check gas price
	// Get gas price (Unit: Wei)
	const gasPrice = await provider.getGasPrice();
	// Calc floating gas price by gasPriceC (GasPrice coefficient), get gasPriceC from the request, otherwise from config
	const floatingGasPrice = gasPrice.mul(BigNumber.from(gasPriceC ? gasPriceC : customConfig.GetTxConfig().gasPriceC)).div(100);
	// Calc final gas price
	const finalGasPrice = floatingGasPrice.gt(gasPrice) ? floatingGasPrice : gasPrice;
	log.RequestId(reqId).info("OriginalGasPrice=%sGwei, FinalGasPrice=%sGwei",
		utils.formatUnits(gasPrice, "gwei"), utils.formatUnits(finalGasPrice, "gwei"));

	// Check gasPrice by circuit breaker
	if (GasPriceCircuitBreaker(finalGasPrice, reqId)) {
		log.RequestId(reqId).warn("Deploy request terminated due to high gas price. Name=%s, Symbol=%s, BaseTokenURI=%s, GasPrice=%sGwei",
			name, symbol, baseTokenURI, utils.formatUnits(finalGasPrice, "gwei"));
		return {
			code: customConfig.GetMintRspCode().THRESHOLD,
			msg: "Deploy request terminated due to high gas price",
		};
	}

	// Step 3. Deploy
	const operators = getOperators();
	const contractOwnerPK = pk ? pk : await keystore.InspectKeystorePK(customConfig.GetMint().contractOwner.address,
		KeystoreTypeContractOwner, customConfig.GetMint().contractOwner.keyStoreSK);
	const factory: Avatar__factory = await ethers.getContractFactory(ContractName, core.GetWallet(contractOwnerPK)) as Avatar__factory;

	// Deploy upgradeable contract via the transparent proxy pattern
	// TODO: deploy contracts by custom gasPrice, ref: https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/85
	const contract = await upgrades.deployProxy(factory,
		[name, symbol, baseTokenURI, maxSupply, operators],
		{
			initializer: DefaultContractInitializer,
			kind: DefaultProxyPattern,
			pollingInterval: DefaultPollingInterval,
		}) as Avatar;

	if (isWait) {
		log.RequestId(reqId).info("Contract(%s) deploying... Name=%s, Symbol=%s, BaseTokenURI=%s, GasPrice=%sGwei",
			contract.address, name, symbol, baseTokenURI, utils.formatUnits(finalGasPrice, "gwei"));

		await contract.deployed();

		log.RequestId(reqId).info("Contract(%s) deployed. Name=%s, Symbol=%s, BaseTokenURI=%s, GasPrice=%sGwei",
			contract.address, name, symbol, baseTokenURI, utils.formatUnits(finalGasPrice, "gwei"));
	} else {
		log.RequestId(reqId).info("Deploy contract(%s) tx committed. Name=%s, Symbol=%s, BaseTokenURI=%s, GasPrice=%sGwei",
			contract.address, name, symbol, baseTokenURI, utils.formatUnits(finalGasPrice, "gwei"));
	}

	return {
		name: name,
		symbol: symbol,
		baseTokenURI: baseTokenURI,
		address: contract.address,
		txHash: contract.deployTransaction.hash,
	}
}
