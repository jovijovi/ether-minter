import {BigNumber, constants, utils} from 'ethers';
import {log} from '@jovijovi/pedrojs-common';
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
	const provider = network.MyProvider.Get();
	const blockNumber = await provider.getBlockNumber();

	const contract = GetContract(address);
	const totalSupply = await contract.totalSupply();

	log.RequestId().debug("BlockNumber=%s, address=%s, totalSupply=%s", blockNumber.toString(), address, totalSupply.toString());
	return {
		blockNumber: blockNumber,
		address: address,
		totalSupply: totalSupply.toString(),
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
export async function MintForCreator(address: string, to: string, contentHash: string, reqId?: string): Promise<any> {
	const provider = network.MyProvider.Get();
	const minter = GetMinter(customConfig.GetMint().randomMinter);
	const pk = await keystore.InspectKeystorePK(minter.address, KeystoreTypeMinter, minter.keyStoreSK);
	const contract = GetContract(address, pk);

	// Check if content hash exists
	if (await contract.contentHashExists(contentHash)) {
		const tokenId = await contract.getTokenIdByContentHash(contentHash);

		log.RequestId(reqId).info("Duplicate contentHash(%s) found. Token(ID=%s) with the same content hash. ContractAddress=%s, ToAddress=%s",
			contentHash, tokenId.toString(), address, to);

		// If content hash exists, return tokenId
		return {
			code: customConfig.GetMint().apiResponseCode.DUPLICATE,
			msg: "Duplicate contentHash",
			data: {
				"status": StatusSuccessful,
				"token_id": tokenId.toNumber(),
			}
		};
	}

	// Get gas price (Unit: Wei)
	const gasPrice = await provider.getGasPrice();

	// Check gasPrice by circuit breaker
	if (GasPriceCircuitBreaker(gasPrice)) {
		return {
			code: customConfig.GetMint().apiResponseCode.THRESHOLD,
			msg: "Gas price circuit breaker",
		};
	}

	const estimateGas = await contract.estimateGas.mintForCreator(to, MintQuantity, [contentHash]);
	const gasLimit = estimateGas.mul(BigNumber.from(customConfig.GetTxConfig().gasLimitC)).div(100);

	log.RequestId(reqId).info("Minting... ContractAddress=%s, ToAddress=%s, Minter=%s, EstimateGas=%s, GasLimit=%d, GasPrice=%sGwei",
		address, to, minter.address, estimateGas.toString(), gasLimit.toString(), utils.formatUnits(gasPrice, "gwei"));

	const tx = await contract.mintForCreator(to, MintQuantity, [contentHash], {
		gasPrice: gasPrice,
		gasLimit: gasLimit,
	});

	log.RequestId(reqId).info("Mint tx committed. ContractAddress=%s, ToAddress=%s, Minter=%s, TxHash=%s, GasLimit=%d, GasPrice=%sGwei",
		address, to, minter.address, tx.hash, tx.gasLimit, utils.formatUnits(tx.gasPrice, "gwei"));

	return {
		code: customConfig.GetMint().apiResponseCode.OK,
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
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: "transaction not exist",
		};
	}

	const tokenIds: number[] = [];
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
		code: customConfig.GetMint().apiResponseCode.OK,
		data: {
			token_id: tokenIds,
			status: receipt.status,
			receipt: receipt,
		}
	};
}
