import {ethers, upgrades} from 'hardhat';
import {env} from 'process';

// Params for upgradeable contract
// (default params used for test only)
const params = {
	ContractName: 'AvatarUpgradeable',
	ProxyContract: env.PROXY_CONTRACT ? env.PROXY_CONTRACT : '0x0000000000000000000000000000000000000000',
}

async function main(): Promise<void> {
	const factory = await ethers.getContractFactory(params.ContractName);
	console.log('Upgrading contract...');
	const newVersionContract = await upgrades.upgradeProxy(params.ProxyContract, factory);
	console.log('Logical contract upgraded. TxHash=', newVersionContract.deployTransaction.hash);
}

main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});
