import {ethers, upgrades} from 'hardhat';
import {BigNumber, utils} from 'ethers';
import {JsonRpcProvider} from '@ethersproject/providers';
import {core} from '@jovijovi/ether-core';
import {network} from '@jovijovi/ether-network';
import {log} from '@jovijovi/pedrojs-common';
import {keystore} from '@jovijovi/ether-keystore';
import {
	ContractNameImmutable,
	ContractNameUpgradeable,
	DefaultContractInitializer,
	DefaultPollingInterval,
	DefaultProxyPattern,
	KeystoreTypeContractOwner
} from './params';
import {Avatar, Avatar__factory, AvatarUpgradeable, AvatarUpgradeable__factory} from '../../../../typechain-types';
import {GasPriceCircuitBreaker} from './breaker';
import {customConfig} from '../../../config';
import {GetOperators} from './minter';

// Deploy contract options
type DeployContractOptions = {
	contractName: string;
	contractOwnerPK: string;
	name: string;
	symbol: string;
	baseTokenURI: string;
	maxSupply: number;
	finalGasPrice: BigNumber;
	operators: string[];
	provider: JsonRpcProvider;
	isUpgradeable: boolean;
}

// deployImmutableContract deploys immutable contract
async function deployImmutableContract(opts: DeployContractOptions): Promise<Avatar> {
	const factory: Avatar__factory = await ethers.getContractFactory(opts.contractName, core.GetWallet(opts.contractOwnerPK)) as Avatar__factory;
	return await factory.deploy(opts.name, opts.symbol, opts.baseTokenURI, opts.maxSupply, opts.operators, {
		gasPrice: opts.finalGasPrice,
	});
}

// deployUpgradeableContract deploys upgradeable contract
async function deployUpgradeableContract(opts: DeployContractOptions): Promise<AvatarUpgradeable> {
	// Deploy contracts by custom gasPrice
	// Wrap the provider to override fee data. ref: https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/85
	const fallbackProvider = new ethers.providers.FallbackProvider([opts.provider], 1);
	const FeeData = {
		maxFeePerGas: null,
		maxPriorityFeePerGas: null,
		gasPrice: opts.finalGasPrice,
	};
	fallbackProvider.getFeeData = async () => FeeData;

	// Deploy upgradeable contract via the transparent proxy pattern
	const factory: AvatarUpgradeable__factory = await ethers.getContractFactory(opts.contractName,
		core.GetWallet(opts.contractOwnerPK).connect(fallbackProvider)) as AvatarUpgradeable__factory;
	return await upgrades.deployProxy(factory,
		[opts.name, opts.symbol, opts.baseTokenURI, opts.maxSupply, opts.operators],
		{
			initializer: DefaultContractInitializer,
			kind: DefaultProxyPattern,
			pollingInterval: DefaultPollingInterval,
		}) as AvatarUpgradeable;
}

async function deployContract(opts: DeployContractOptions): Promise<Avatar | AvatarUpgradeable> {
	if (!opts.isUpgradeable) {
		return await deployImmutableContract(opts);
	}
	return await deployUpgradeableContract(opts);
}

// Deploy contract
export async function Deploy(name: string, symbol: string, baseTokenURI: string, maxSupply: number, pk: string, isWait = true, gasPriceC: number, isUpgradeable = false, reqId?: string): Promise<any> {
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

	// Step 3. Deploy contract
	const contractOwnerPK = pk ? pk : await keystore.InspectKeystorePK(customConfig.GetMint().contractOwner.address,
		KeystoreTypeContractOwner, customConfig.GetMint().contractOwner.keyStoreSK);

	const contract = await deployContract({
		isUpgradeable: isUpgradeable,
		contractName: isUpgradeable ? ContractNameUpgradeable : ContractNameImmutable,
		contractOwnerPK: contractOwnerPK,
		baseTokenURI: baseTokenURI,
		name: name,
		symbol: symbol,
		maxSupply: maxSupply,
		finalGasPrice: finalGasPrice,
		operators: GetOperators(),
		provider: provider,
	})

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
