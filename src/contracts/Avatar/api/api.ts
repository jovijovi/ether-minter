import {log} from '@jovijovi/pedrojs-common';
import {response as MyResponse} from '@jovijovi/pedrojs-network-http/server';
import {ABI} from '../abi';
import {Cache} from '../../../common/cache';
import {customConfig} from '../../../config';
import {KEY} from '@jovijovi/pedrojs-network-http/middleware/requestid';

// Get total supply
export async function GetGetTotalSupply(req, res) {
	if (!req.query ||
		!req.query.contractAddress
	) {
		return MyResponse.BadRequest(res);
	}

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
		return MyResponse.Error(res, e);
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
		return MyResponse.BadRequest(res);
	}

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
		res.send(result);

		Cache.CacheEstimateGasOfTransferNFT.set(key, result);

		log.RequestId().info("Estimate transfer NFT tx(%o) gasFee=%s", req.body, result.gasFee);
	} catch (e) {
		return MyResponse.Error(res, e);
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
		return MyResponse.BadRequest(res);
	}

	try {
		log.RequestId(req[KEY]).info("Request=\n%o", req.body);

		const result = await ABI.MintForCreator(req.body.contractAddress, req.body.toAddress, req.body.contentHash, req[KEY]);

		res.send(result);

		log.RequestId(req[KEY]).info("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("MintForCreator failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}

	return;
}

// Get mint status
export async function GetMintStatus(req, res) {
	if (!req.query ||
		!req.query.txHash
	) {
		return MyResponse.BadRequest(res);
	}

	try {
		log.RequestId(req[KEY]).debug("Request\n=%o", req.query);

		const result = await ABI.GetMintReceipt(req.query.txHash, req[KEY]);

		res.send(result);

		log.RequestId(req[KEY]).info("Result=\n%o", result);
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
		return MyResponse.BadRequest(res);
	}

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
		return MyResponse.BadRequest(res);
	}

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
		return MyResponse.BadRequest(res);
	}

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
		return MyResponse.BadRequest(res);
	}

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
		return MyResponse.BadRequest(res);
	}

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
		return MyResponse.BadRequest(res);
	}

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

export async function OwnerOf(req, res) {
	if (!req.query ||
		!req.query.contractAddress ||
		!req.query.tokenId
	) {
		return MyResponse.BadRequest(res);
	}

	try {
		const result = await ABI.OwnerOf(req.query.contractAddress, req.query.tokenId);

		res.send(result);

		log.RequestId(req[KEY]).debug("Result=\n%o", result);
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
		return MyResponse.BadRequest(res);
	}

	try {
		const result = await ABI.BalanceOf(req.query.contractAddress, req.query.owner);

		res.send(result);

		log.RequestId(req[KEY]).debug("Result=\n%o", result);
	} catch (e) {
		log.RequestId(req[KEY]).error("BalanceOf failed, error=", e);

		res.send({
			code: customConfig.GetMint().apiResponseCode.ERROR,
			msg: e.toString(),
		});

		return;
	}
}
