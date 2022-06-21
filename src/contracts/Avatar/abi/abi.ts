import {BigNumber, constants, utils} from 'ethers';
import {auditor, log} from '@jovijovi/pedrojs-common';
import {keystore} from '@jovijovi/ether-keystore';
import {network} from '@jovijovi/ether-network';
import {core} from '@jovijovi/ether-core';
import {customConfig} from '../../../config';
import {GetContract} from './common';
import {GetMinter} from './minter';
import {KeystoreTypeMinter, MintQuantity, StatusSuccessful} from './params';
import {GasPriceCircuitBreaker} from './breaker';
import {CheckTopics} from './topics';

// GetTotalSupply returns NFT contract total supply
export async function GetTotalSupply(address: string): Promise<any> {
	const contract = GetContract(address);
	const totalSupply = await contract.totalSupply();

	const provider = network.MyProvider.Get();
	const blockNumber = await provider.getBlockNumber();

	log.RequestId().debug("BlockNumber=%s, address=%s, totalSupply=%s", blockNumber.toString(), address, totalSupply.toString());
	return {
		code: customConfig.GetMintRspCode().OK,
		data: {
			totalSupply: totalSupply.toString(),
			blockNumber: blockNumber,
		}
	}
}

// EstimateGasOfTransferNFT returns estimate Gas of transfer NFT tx
export async function EstimateGasOfTransferNFT(address: string, from: string, to: string, tokenId: number): Promise<string> {
	const provider = network.MyProvider.Get();
	const contract = GetContract(address);
	const price = await provider.getGasPrice();
	const gas = await contract.estimateGas.transferFrom(from, to, tokenId);
	return utils.formatEther(gas.mul(price));
}

// Mint
export async function MintForCreator(address: string, to: string, contentHash: string | string[], reqId?: string): Promise<any> {
	if (typeof contentHash === 'string') {
		// Single mint (for compatible)
		return await mintForCreator(address, to, [contentHash], MintQuantity, reqId);
	} else if (Array.isArray(contentHash)) {
		// Batch mint
		return await mintForCreator(address, to, contentHash, contentHash.length, reqId);
	}

	throw new Error(`invalid type of contentHash`);
}

// Mint to the specified address
async function mintForCreator(address: string, to: string, contentHashList: string[], quantity: number, reqId?: string): Promise<any> {
	// Step 1. Get minter
	const provider = network.MyProvider.Get();
	const minter = GetMinter(customConfig.GetMint().randomMinter);
	const pk = await keystore.InspectKeystorePK(minter.address, KeystoreTypeMinter, minter.keyStoreSK);
	const contract = GetContract(address, pk);

	// Step 2. Check if content hash exists
	const duplicateContentHash: string[] = [];
	if (contentHashList.length === 1) {
		if (await contract.contentHashExists(contentHashList[0])) {
			duplicateContentHash.push(contentHashList[0]);
		}
	} else {
		const allContentHash = await contract.getAllContentHash();
		for (const contentHash of contentHashList) {
			if (allContentHash.includes(contentHash)) {
				duplicateContentHash.push(contentHash);
			}
		}
	}

	if (duplicateContentHash.length > 0) {
		const duplicateTokenId: number[] = [];
		for (const contentHash of duplicateContentHash) {
			const tokenId = await contract.getTokenIdByContentHash(contentHash);
			duplicateTokenId.push(tokenId.toNumber());

			log.RequestId(reqId).warn("Duplicate contentHash(%s) found, mint request ignored. Token(ID=%s) with the same content hash. ContractAddress=%s, ToAddress=%s",
				contentHash, tokenId.toString(), address, to);
		}

		// If content hash exists, return tokenId
		return {
			code: customConfig.GetMintRspCode().DUPLICATE,
			msg: "Duplicate contentHash",
			data: {
				"status": StatusSuccessful,
				"tokenId": duplicateTokenId,
			}
		};
	}

	// Step 3. Check gas price
	// Get gas price (Unit: Wei)
	const gasPrice = await provider.getGasPrice();

	// Check gasPrice by circuit breaker
	if (GasPriceCircuitBreaker(gasPrice, reqId)) {
		log.RequestId(reqId).warn("Mint request terminated due to high gas price. ContractAddress=%s, ToAddress=%s, Minter=%s, GasPrice=%sGwei",
			address, to, minter.address, utils.formatUnits(gasPrice, "gwei"));
		return {
			code: customConfig.GetMintRspCode().THRESHOLD,
			msg: "Mint request terminated due to high gas price",
		};
	}

	// Step 4. Estimate gas
	const estimateGas = await contract.estimateGas.mintForCreator(to, quantity, contentHashList);
	const gasLimit = estimateGas.mul(BigNumber.from(customConfig.GetTxConfig().gasLimitC)).div(100);

	log.RequestId(reqId).info("Minting... ContractAddress=%s, ToAddress=%s, Minter=%s, EstimateGas=%s, GasLimit=%d, GasPrice=%sGwei",
		address, to, minter.address, estimateGas.toString(), gasLimit.toString(), utils.formatUnits(gasPrice, "gwei"));

	// Step 5. Mint
	const tx = await contract.mintForCreator(to, quantity, contentHashList, {
		gasPrice: gasPrice,
		gasLimit: gasLimit,
	});

	log.RequestId(reqId).info("Mint tx committed. ContractAddress=%s, ToAddress=%s, Minter=%s, TxHash=%s, GasLimit=%d, GasPrice=%sGwei",
		address, to, minter.address, tx.hash, tx.gasLimit, utils.formatUnits(tx.gasPrice ? tx.gasPrice : gasPrice, "gwei"));

	// Step 6. Build response
	return {
		code: customConfig.GetMintRspCode().OK,
		msg: "Mint tx committed",
		data: {
			"txHash": tx.hash,
			"tx": tx,
		}
	};
}

// Get mint receipt
export async function GetMintReceipt(txHash: string, reqId?: string): Promise<any> {
	const receipt = await core.GetTxReceipt(txHash);

	if (!receipt) {
		return {
			code: customConfig.GetMintRspCode().ERROR,
			msg: "transaction not exist",
		};
	}

	const tokenIds: number[] = [];

	// Check receipt status
	if (receipt.status === StatusSuccessful) {
		for (let i = 0; i < receipt.logs.length; i++) {
			if (!CheckTopics(receipt.logs[i].topics)) {
				log.RequestId(reqId).trace("not an ERC721 topics, topics=%o", receipt.logs[i].topics);
				continue;
			}

			if (receipt.logs[i].topics[1] !== constants.HashZero) {
				log.RequestId(reqId).trace("not Mint tx, topics=%o", receipt.logs[i].topics);
				continue;
			}

			const tokenId = receipt.logs[i].topics[3];
			tokenIds.push(Number(tokenId));
			log.RequestId(reqId).debug("TokenId=%s, status=minted, block=%d, tx=%s", utils.stripZeros(tokenId), receipt.blockNumber, txHash);
		}
	}

	log.RequestId(reqId).trace("Mint Receipt=%o", receipt);

	return {
		code: customConfig.GetMintRspCode().OK,
		data: {
			tokenId: tokenIds,
			status: receipt.status,
			receipt: receipt,
		}
	};
}

// Get tokenId by content hash
export async function GetTokenIdByContentHash(address: string, contentHash: string): Promise<any> {
	const contract = GetContract(address);
	if (!await contract.contentHashExists(contentHash)) {
		return {
			code: customConfig.GetMintRspCode().NOTFOUND,
			msg: "not found the content hash",
		};
	}
	const tokenId = await contract.getTokenIdByContentHash(contentHash);
	return {
		code: customConfig.GetMintRspCode().OK,
		data: {
			tokenId: tokenId.toNumber()
		}
	};
}

// Get contract info
export async function GetContractInfo(address: string): Promise<any> {
	const contract = GetContract(address);
	const name = await contract.name();
	const symbol = await contract.symbol();
	const totalSupply = await contract.totalSupply();
	const owner = await contract.owner();
	const mintable = await contract.finalization() ? 0 : 1;

	return {
		code: customConfig.GetMintRspCode().OK,
		data: {
			name: name,
			symbol: symbol,
			supply: totalSupply.toNumber(),
			owner: owner,
			address: address,
			mintable: mintable,
			burnable: 1,
			deploy: 1,
		}
	};
}

// Get token info
export async function GetTokenInfo(address: string, tokenId: string): Promise<any> {
	const contract = GetContract(address);
	if (!await contract.exists(tokenId)) {
		return {
			code: customConfig.GetMintRspCode().NOTFOUND,
			msg: "tokenId not exist"
		}
	}

	return {
		code: customConfig.GetMintRspCode().OK,
		data: {
			tokenURI: await contract.tokenURI(tokenId),
			contentHash: await contract.tokenContentHashes(tokenId),
		}
	}
}

// Get token content hash
export async function GetTokenContentHash(address: string, tokenId: string): Promise<any> {
	const contract = GetContract(address);
	if (!await contract.exists(tokenId)) {
		return {
			code: customConfig.GetMintRspCode().NOTFOUND,
			msg: "tokenId not exist"
		}
	}

	return {
		code: customConfig.GetMintRspCode().OK,
		data: {
			contentHash: await contract.tokenContentHashes(tokenId),
		}
	}
}

// Get tokenURI
export async function GetTokenURI(address: string, tokenId: string): Promise<any> {
	const contract = GetContract(address);
	if (!await contract.exists(tokenId)) {
		return {
			code: customConfig.GetMintRspCode().NOTFOUND,
			msg: "tokenId not exist"
		}
	}

	return {
		code: customConfig.GetMintRspCode().OK,
		data: {
			tokenURI: await contract.tokenURI(tokenId),
		}
	}
}

// Get symbol
export async function GetSymbol(address: string) {
	const contract = GetContract(address);
	return {
		code: customConfig.GetMintRspCode().OK,
		data: {
			symbol: await contract.symbol(),
		}
	}
}

// Get owner of NFT by tokenId
export async function OwnerOf(address: string, tokenId: string) {
	const contract = GetContract(address);
	if (!await contract.exists(tokenId)) {
		return {
			code: customConfig.GetMintRspCode().NOTFOUND,
			msg: "tokenId not exist"
		}
	}

	return {
		code: customConfig.GetMintRspCode().OK,
		data: {
			owner: await contract.ownerOf(tokenId),
		}
	}
}

// Get balance of NFT owner
export async function BalanceOf(address: string, owner: string) {
	auditor.Check(utils.isAddress(owner), 'invalid owner address');
	const contract = GetContract(address);
	const balance = await contract.balanceOf(owner);
	return {
		code: customConfig.GetMintRspCode().OK,
		data: {
			balance: balance.toNumber(),
		}
	}
}

// Batch tokens transfer from 1 to 1
async function BatchTransfer(address: string, from: string, to: string, fromTokenId: string, toTokenId: string, pk: string, reqId?: string): Promise<any> {
	// Step 1. Get contract by PK
	const provider = network.MyProvider.Get();
	const contract = GetContract(address, pk);

	// Step 2. Check gas price
	// Get gas price (Unit: Wei)
	const gasPrice = await provider.getGasPrice();

	// Check gasPrice by circuit breaker
	if (GasPriceCircuitBreaker(gasPrice, reqId)) {
		log.RequestId(reqId).warn("BatchTransfer request terminated due to high gas price. ContractAddress=%s, From=%s, To=%s, FromTokenId=%s, ToTokenId=%s, GasPrice=%sGwei",
			address, from, to, fromTokenId, toTokenId, utils.formatUnits(gasPrice, "gwei"));
		return {
			code: customConfig.GetMintRspCode().THRESHOLD,
			msg: "BatchTransfer request terminated due to high gas price",
		};
	}

	// Step 3. Estimate gas
	const estimateGas = await contract.estimateGas.batchTransfer(from, to, fromTokenId, toTokenId);
	const gasLimit = estimateGas.mul(BigNumber.from(customConfig.GetTxConfig().gasLimitC)).div(100);

	log.RequestId(reqId).info("BatchTransferring... ContractAddress=%s, From=%s, To=%s, FromTokenId=%s, ToTokenId=%s, EstimateGas=%s, GasLimit=%d, GasPrice=%sGwei",
		address, from, to, fromTokenId, toTokenId, estimateGas.toString(), gasLimit.toString(), utils.formatUnits(gasPrice, "gwei"));

	// Step 4. BatchTransfer(1 to 1)
	const tx = await contract.batchTransfer(from, to, fromTokenId, toTokenId, {
		gasPrice: gasPrice,
		gasLimit: gasLimit,
	});

	log.RequestId(reqId).info("BatchTransfer tx committed. ContractAddress=%s, From=%s, To=%s, FromTokenId=%s, ToTokenId=%s, TxHash=%s, GasLimit=%d, GasPrice=%sGwei",
		address, from, to, fromTokenId, toTokenId, tx.hash, tx.gasLimit, utils.formatUnits(tx.gasPrice ? tx.gasPrice : gasPrice, "gwei"));

	// Step 5. Build response
	return {
		code: customConfig.GetMintRspCode().OK,
		msg: "BatchTransfer tx committed",
		data: {
			"txHash": tx.hash,
			"tx": tx,
		}
	};
}

// Batch tokens transfer from 1 to N
async function BatchTransferToN(address: string, from: string, to: string[], tokenIds: string[], pk: string, reqId?: string): Promise<any> {
	// Step 1. Get contract by PK
	const provider = network.MyProvider.Get();
	const contract = GetContract(address, pk);

	// Step 2. Check gas price
	// Get gas price (Unit: Wei)
	const gasPrice = await provider.getGasPrice();

	// Check gasPrice by circuit breaker
	if (GasPriceCircuitBreaker(gasPrice, reqId)) {
		log.RequestId(reqId).warn("BatchTransferToN request terminated due to high gas price. ContractAddress=%s, From=%s, To=%o, TokenIds=%o, GasPrice=%sGwei",
			address, from, to, tokenIds, utils.formatUnits(gasPrice, "gwei"));
		return {
			code: customConfig.GetMintRspCode().THRESHOLD,
			msg: "BatchTransferToN request terminated due to high gas price",
		};
	}

	// Step 3. Estimate gas
	const estimateGas = await contract.estimateGas.batchTransferToN(from, to, tokenIds);
	const gasLimit = estimateGas.mul(BigNumber.from(customConfig.GetTxConfig().gasLimitC)).div(100);

	log.RequestId(reqId).info("BatchTransferToN... ContractAddress=%s, From=%s, To=%o, TokenIds=%o, EstimateGas=%s, GasLimit=%d, GasPrice=%sGwei",
		address, from, to, tokenIds, estimateGas.toString(), gasLimit.toString(), utils.formatUnits(gasPrice, "gwei"));

	// Step 4. BatchTransferToN(1 to N)
	const tx = await contract.batchTransferToN(from, to, tokenIds, {
		gasPrice: gasPrice,
		gasLimit: gasLimit,
	});

	log.RequestId(reqId).info("BatchTransferToN tx committed. ContractAddress=%s, From=%s, To=%o, TokenIds=%o, TxHash=%s, GasLimit=%d, GasPrice=%sGwei",
		address, from, to, tokenIds, tx.hash, tx.gasLimit, utils.formatUnits(tx.gasPrice ? tx.gasPrice : gasPrice, "gwei"));

	// Step 5. Build response
	return {
		code: customConfig.GetMintRspCode().OK,
		msg: "BatchTransferToN tx committed",
		data: {
			"txHash": tx.hash,
			"tx": tx,
		}
	};
}

// Batch tokens burn
async function BatchBurn(address: string, fromTokenId: string, toTokenId: string, pk: string, reqId?: string): Promise<any> {
	// Step 1. Get contract by PK
	const provider = network.MyProvider.Get();
	const contract = GetContract(address, pk);
	const owner = utils.computeAddress(pk);

	// Step 2. Check gas price
	// Get gas price (Unit: Wei)
	const gasPrice = await provider.getGasPrice();

	// Check gasPrice by circuit breaker
	if (GasPriceCircuitBreaker(gasPrice, reqId)) {
		log.RequestId(reqId).warn("BatchBurn request terminated due to high gas price. ContractAddress=%s, Owner=%s, FromTokenId=%s, ToTokenId=%s, GasPrice=%sGwei",
			address, owner, fromTokenId, toTokenId, utils.formatUnits(gasPrice, "gwei"));
		return {
			code: customConfig.GetMintRspCode().THRESHOLD,
			msg: "BatchBurn request terminated due to high gas price",
		};
	}

	// Step 3. Estimate gas
	const estimateGas = await contract.estimateGas.batchBurn(fromTokenId, toTokenId);
	const gasLimit = estimateGas.mul(BigNumber.from(customConfig.GetTxConfig().gasLimitC)).div(100);

	log.RequestId(reqId).info("BatchBurning... ContractAddress=%s, Owner=%s, FromTokenId=%s, ToTokenId=%s, EstimateGas=%s, GasLimit=%d, GasPrice=%sGwei",
		address, owner, fromTokenId, toTokenId, estimateGas.toString(), gasLimit.toString(), utils.formatUnits(gasPrice, "gwei"));

	// Step 4. BatchBurn
	const tx = await contract.batchBurn(fromTokenId, toTokenId, {
		gasPrice: gasPrice,
		gasLimit: gasLimit,
	});

	log.RequestId(reqId).info("BatchBurn tx committed. ContractAddress=%s, Owner=%s, FromTokenId=%s, ToTokenId=%s, TxHash=%s, GasLimit=%d, GasPrice=%sGwei",
		address, owner, fromTokenId, toTokenId, tx.hash, tx.gasLimit, utils.formatUnits(tx.gasPrice ? tx.gasPrice : gasPrice, "gwei"));

	// Step 5. Build response
	return {
		code: customConfig.GetMintRspCode().OK,
		msg: "BatchBurn tx committed",
		data: {
			"txHash": tx.hash,
			"tx": tx,
		}
	};
}
