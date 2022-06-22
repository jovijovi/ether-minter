import {ethers} from 'hardhat';
import {env} from 'process';
import {Avatar, Avatar__factory} from '../typechain-types';

// Params for contract
// (default params used for test only)
const params = {
	NFTName: env.NFT_NAME ? env.NFT_NAME : 'AvatarNFT',
	NFTSymbol: env.NFT_SYMBOL ? env.NFT_SYMBOL : 'AvatarNFTSymbol',
	NFTBaseTokenURI: env.NFT_BASETOKENURI ? env.NFT_BASETOKENURI : 'https://localhost:2022/nft/',
	MaxSupply: env.MAX_SUPPLY ? env.MAX_SUPPLY : 1000,
}

async function main(): Promise<void> {
	const factory: Avatar__factory = await ethers.getContractFactory("Avatar") as Avatar__factory;
	const contract: Avatar = await factory.deploy(params.NFTName, params.NFTSymbol, params.NFTBaseTokenURI, params.MaxSupply, []);
	await contract.deployed();
	console.log("Contract deployed to: ", contract.address);
}

main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});
