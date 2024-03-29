import {log} from '@jovijovi/pedrojs-common';
import {KEY} from '@jovijovi/pedrojs-network-http/middleware/requestid';
import {ABI, Deployer} from '../abi';
import {Cache} from '../../../common/cache';
import {customConfig} from '../../../config';
import * as MyResponse from '../../../common/response/response';
import {ErrorResponse} from './response';

// Get total supply
export async function GetGetTotalSupply(req, res) {
	if (!req.query ||
		!req.query.contractAddress
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, query=%o", req.url, req.query);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, query=%o", req.url, req.query);

	try {
		// Set cache ttl to 3 seconds by default
		if (Cache.CacheTotalSupplyOfNFT.has(req.query.contractAddress)) {
			res.send(Cache.CacheTotalSupplyOfNFT.get(req.query.contractAddress));
			return;
		}

		const result = await ABI.GetTotalSupply(req.query.contractAddress);

		res.send(result);

		Cache.CacheTotalSupplyOfNFT.set(req.query.contractAddress, result);
	} catch (e) {
		log.RequestId(req[KEY]).error("GetGetTotalSupply failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}

	return;
}

// EstimateGasOfTransferNFT returns estimateGas of transfer NFT tx
export async function EstimateGasOfTransferNFT(req, res) {
	if (!req.body ||
		!req.body.address ||
		!req.body.from ||
		!req.body.to ||
		!req.body.tokenId
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, body=%o", req.url, req.body);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, body=%o", req.url, req.body);

	try {
		const key = Cache.CombinationKey([req.body.address, req.body.from, req.body.to, req.body.tokenId])
		// Set cache
		if (Cache.CacheEstimateGasOfTransferNFT.has(key)) {
			res.send(Cache.CacheEstimateGasOfTransferNFT.get(key));
			return;
		}

		const result = {
			gasFee: await ABI.EstimateGasOfTransferNFT(req.body.address, req.body.from, req.body.to, req.body.tokenId)
		};
		const rsp = MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, result)

		res.send(rsp);

		Cache.CacheEstimateGasOfTransferNFT.set(key, rsp);

		log.RequestId(req[KEY]).info("Estimate transfer NFT tx(%o) gasFee=%s", req.body, result.gasFee);
	} catch (e) {
		log.RequestId(req[KEY]).error("EstimateGasOfTransferNFT failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}

	return;
}

// EstimateGasOfBatchTransfer returns estimateGas of Batch transfer (1 to 1)
export async function EstimateGasOfBatchTransfer(req, res) {
	if (!req.body ||
		!req.body.contractAddress ||
		!req.body.fromAddress ||
		!req.body.toAddress ||
		!req.body.fromTokenId ||
		!req.body.toTokenId
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, body=%o", req.url, req.body);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, body=%o", req.url, req.body);

	try {
		const result = await ABI.EstimateGasOfBatchTransfer(
			req.body.contractAddress,
			req.body.fromAddress,
			req.body.toAddress,
			req.body.fromTokenId,
			req.body.toTokenId);

		res.send(MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, {
			gas: result
		}));

		log.RequestId(req[KEY]).info("EstimateGasOfBatchTransfer=%sWei", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("EstimateGasOfBatchTransfer failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}

	return;
}

// EstimateGasOfBatchTransferToN Batch transfer (1 to N)
export async function EstimateGasOfBatchTransferToN(req, res) {
	if (!req.body ||
		!req.body.contractAddress ||
		!req.body.fromAddress ||
		!req.body.toAddress ||
		!req.body.tokenIds
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, body=%o", req.url, req.body);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, body=%o", req.url, req.body);

	try {
		const result = await ABI.EstimateGasOfBatchTransferN(
			req.body.contractAddress,
			req.body.fromAddress,
			req.body.toAddress,
			req.body.tokenIds);

		res.send(MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, {
			gas: result
		}));

		log.RequestId(req[KEY]).info("EstimateGasOfBatchTransferToN=%sWei", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("EstimateGasOfBatchTransferToN failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}

	return;
}

// MintTo returns mint tx
export async function MintTo(req, res) {
	if (!req.body ||
		!req.body.contractAddress ||
		!req.body.toAddress ||
		!req.body.quantity
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, body=%o", req.url, req.body);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, body=%o", req.url, req.body);

	try {
		const result = await ABI.MintTo(req.body.contractAddress, req.body.toAddress, req.body.quantity, req[KEY]);

		res.send(result);

		log.RequestId(req[KEY]).info("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("MintTo failed, error=", e);
		return ErrorResponse(e, res);
	}

	return;
}

// MintForCreator returns mint tx
export async function MintForCreator(req, res) {
	if (!req.body ||
		!req.body.contractAddress ||
		!req.body.toAddress ||
		!req.body.contentHash
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, body=%o", req.url, req.body);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, body=%o", req.url, req.body);

	try {
		const result = await ABI.MintForCreator(req.body.contractAddress, req.body.toAddress, req.body.contentHash, req[KEY]);

		res.send(result);

		log.RequestId(req[KEY]).info("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("MintForCreator failed, error=", e);
		return ErrorResponse(e, res);
	}

	return;
}

// Get mint status
export async function GetMintStatus(req, res) {
	if (!req.query ||
		!req.query.txHash
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, query=%o", req.url, req.query);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, query=%o", req.url, req.query);

	try {
		const result = await ABI.GetMintReceipt(req.query.txHash, req[KEY]);

		res.send(result);

		log.RequestId(req[KEY]).trace("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("GetMintStatus failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}

	return;
}

export async function GetTokenIdByContentHash(req, res) {
	if (!req.query ||
		!req.query.contractAddress ||
		!req.query.contentHash
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, query=%o", req.url, req.query);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, query=%o", req.url, req.query);

	try {
		const result = await ABI.GetTokenIdByContentHash(req.query.contractAddress, req.query.contentHash);

		res.send(result);

		log.RequestId(req[KEY]).debug("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("GetTokenIdByContentHash failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}
}

export async function GetContractInfo(req, res) {
	if (!req.query ||
		!req.query.contractAddress
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, query=%o", req.url, req.query);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, query=%o", req.url, req.query);

	try {
		const result = await ABI.GetContractInfo(req.query.contractAddress);

		res.send(result);

		log.RequestId(req[KEY]).debug("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("GetContractInfo failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}
}

export async function GetTokenInfo(req, res) {
	if (!req.query ||
		!req.query.contractAddress ||
		!req.query.tokenId
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, query=%o", req.url, req.query);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, query=%o", req.url, req.query);

	try {
		const result = await ABI.GetTokenInfo(req.query.contractAddress, req.query.tokenId);

		res.send(result);

		log.RequestId(req[KEY]).debug("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("GetTokenInfo failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}
}

export async function GetTokenContentHash(req, res) {
	if (!req.query ||
		!req.query.contractAddress ||
		!req.query.tokenId
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, query=%o", req.url, req.query);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, query=%o", req.url, req.query);

	try {
		const result = await ABI.GetTokenContentHash(req.query.contractAddress, req.query.tokenId);

		res.send(result);

		log.RequestId(req[KEY]).debug("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("GetTokenContentHash failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}
}

export async function GetTokenURI(req, res) {
	if (!req.query ||
		!req.query.contractAddress ||
		!req.query.tokenId
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, query=%o", req.url, req.query);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, query=%o", req.url, req.query);

	try {
		const result = await ABI.GetTokenURI(req.query.contractAddress, req.query.tokenId);

		res.send(result);

		log.RequestId(req[KEY]).debug("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("GetTokenURI failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}
}

export async function GetSymbol(req, res) {
	if (!req.query ||
		!req.query.contractAddress
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, query=%o", req.url, req.query);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, query=%o", req.url, req.query);

	try {
		const result = await ABI.GetSymbol(req.query.contractAddress);

		res.send(result);

		log.RequestId(req[KEY]).debug("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("GetContractSymbol failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}
}

export async function GetContractOwner(req, res) {
	if (!req.query ||
		!req.query.contractAddress
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, query=%o", req.url, req.query);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, query=%o", req.url, req.query);

	try {
		const result = await ABI.GetContractOwner(req.query.contractAddress);

		res.send(result);

		log.RequestId(req[KEY]).debug("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("GetContractOwner failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}
}

export async function GetMaxSupply(req, res) {
	if (!req.query ||
		!req.query.contractAddress
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, query=%o", req.url, req.query);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, query=%o", req.url, req.query);

	try {
		const result = await ABI.GetMaxSupply(req.query.contractAddress);

		res.send(result);

		log.RequestId(req[KEY]).debug("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("GetMaxSupply failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}
}

export async function OwnerOf(req, res) {
	if (!req.query ||
		!req.query.contractAddress ||
		!req.query.tokenId
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, query=%o", req.url, req.query);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, query=%o", req.url, req.query);

	try {
		const key = Cache.CombinationKey([req.query.contractAddress, req.query.tokenId]);
		if (Cache.CacheOwnerOfNFT.has(key)) {
			res.send(Cache.CacheOwnerOfNFT.get(key));
			return;
		}

		const result = await ABI.OwnerOf(req.query.contractAddress, req.query.tokenId);

		res.send(result);

		Cache.CacheOwnerOfNFT.set(key, result);

		log.RequestId(req[KEY]).trace("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("OwnerOf failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}
}

export async function BalanceOf(req, res) {
	if (!req.query ||
		!req.query.contractAddress ||
		!req.query.owner
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, query=%o", req.url, req.query);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, query=%o", req.url, req.query);

	try {
		const result = await ABI.BalanceOf(req.query.contractAddress, req.query.owner);

		res.send(result);

		log.RequestId(req[KEY]).trace("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("BalanceOf failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}
}

// Batch transfer (1 to 1)
export async function BatchTransfer(req, res) {
	if (!req.body ||
		!req.body.contractAddress ||
		!req.body.fromAddress ||
		!req.body.toAddress ||
		!req.body.fromTokenId ||
		!req.body.toTokenId
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, body=%o", req.url, req.body);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, body=%o", req.url, req.body);

	try {
		const result = await ABI.BatchTransfer(
			req.body.contractAddress,
			req.body.fromAddress,
			req.body.toAddress,
			req.body.fromTokenId,
			req.body.toTokenId,
			req.body.pk,
			req[KEY]);

		res.send(result);

		log.RequestId(req[KEY]).info("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("BatchTransfer failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}

	return;
}

// Batch transfer (1 to N)
export async function BatchTransferToN(req, res) {
	if (!req.body ||
		!req.body.contractAddress ||
		!req.body.fromAddress ||
		!req.body.toAddress ||
		!req.body.tokenIds
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, body=%o", req.url, req.body);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, body=%o", req.url, req.body);

	try {
		const result = await ABI.BatchTransferToN(
			req.body.contractAddress,
			req.body.fromAddress,
			req.body.toAddress,
			req.body.tokenIds,
			req.body.pk,
			req[KEY]);

		res.send(result);

		log.RequestId(req[KEY]).info("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("BatchTransferToN failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}

	return;
}

// Batch burn
export async function BatchBurn(req, res) {
	if (!req.body ||
		!req.body.contractAddress ||
		!req.body.pk ||
		!req.body.fromTokenId ||
		!req.body.toTokenId
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, body=%o", req.url, req.body);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, body=%o", req.url, req.body);

	try {
		const result = await ABI.BatchBurn(
			req.body.contractAddress,
			req.body.fromTokenId,
			req.body.toTokenId,
			req.body.pk,
			req[KEY]);

		res.send(result);

		log.RequestId(req[KEY]).info("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("BatchBurn failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}

	return;
}

// Burn
export async function Burn(req, res) {
	if (!req.body ||
		!req.body.contractAddress ||
		!req.body.tokenId
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, body=%o", req.url, req.body);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, body=%o", req.url, req.body);

	try {
		const result = await ABI.Burn(
			req.body.contractAddress,   // Contract address
			req.body.tokenId,           // TokenId
			req.body.pk,                // Token owner PK (Optional)
			req[KEY]);

		res.send(result);

		log.RequestId(req[KEY]).info("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("Burn failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}

	return;
}

// Deploy
export async function Deploy(req, res) {
	if (!req.body ||
		!req.body.name ||
		!req.body.symbol ||
		!req.body.baseTokenURI ||
		!req.body.maxSupply
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, body=%o", req.url, req.body);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, body=%o", req.url, req.body);

	try {
		const result = await Deployer.Deploy(
			req.body.name,
			req.body.symbol,
			req.body.baseTokenURI,
			req.body.maxSupply,
			req.body.pk,    // Contract owner PK (Optional)
			req.body.sync,  // true: sync; false: async (Optional)
			req.body.gasPriceC, // GasPrice coefficient (Optional)
			req.body.contractOwner, // Contract owner address (Optional)
			req[KEY]);

		const rsp = MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, result)
		res.send(rsp);

		log.RequestId(req[KEY]).info("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("Deploy failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}

	return;
}

// Set maxSupply
export async function SetMaxSupply(req, res) {
	if (!req.body ||
		!req.body.contractAddress ||
		!req.body.maxSupply
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, body=%o", req.url, req.body);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, body=%o", req.url, req.body);

	try {
		const result = await ABI.SetMaxSupply(
			req.body.contractAddress,
			req.body.maxSupply,
			req[KEY]);

		res.send(result);

		log.RequestId(req[KEY]).info("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("SetMaxSupply failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}

	return;
}

// Set baseTokenURI
export async function SetBaseTokenURI(req, res) {
	if (!req.body ||
		!req.body.contractAddress ||
		!req.body.baseTokenURI
	) {
		log.RequestId(req[KEY]).error("Bad request, url=%o, body=%o", req.url, req.body);
		return MyResponse.BadRequest(res);
	}
	log.RequestId(req[KEY]).info("New request, url=%o, body=%o", req.url, req.body);

	try {
		const result = await ABI.SetBaseTokenURI(
			req.body.contractAddress,
			req.body.baseTokenURI,
			req[KEY]);

		res.send(result);

		log.RequestId(req[KEY]).info("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("SetBaseTokenURI failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}

	return;
}
