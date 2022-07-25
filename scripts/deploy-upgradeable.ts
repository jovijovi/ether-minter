import {ethers, upgrades} from 'hardhat';
import {env} from 'process';
import {AvatarUpgradeable__factory} from '../typechain-types';

// Params for upgradeable contract
// (default params used for test only)
const params = {
	ContractName: 'AvatarUpgradeable',
	ContractInitializer: '__Avatar_init',
	NFTName: env.NFT_NAME ? env.NFT_NAME : 'AvatarNFT',
	NFTSymbol: env.NFT_SYMBOL ? env.NFT_SYMBOL : 'AvatarNFTSymbol',
	NFTBaseTokenURI: env.NFT_BASETOKENURI ? env.NFT_BASETOKENURI : 'https://localhost:2022/nft/',
	MaxSupply: env.MAX_SUPPLY ? env.MAX_SUPPLY : 1000,
}

async function main(): Promise<void> {
	const factory: AvatarUpgradeable__factory = await ethers.getContractFactory(params.ContractName) as AvatarUpgradeable__factory;
	const contract = await upgrades.deployProxy(factory,
		[params.NFTName, params.NFTSymbol, params.NFTBaseTokenURI, params.MaxSupply, []],
		{initializer: params.ContractInitializer});
	await contract.deployed();
	console.log("Contract deployed to: ", contract.address);
}

main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});
