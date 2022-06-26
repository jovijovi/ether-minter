import {auditor, log} from '@jovijovi/pedrojs-common';
import {core} from '@jovijovi/ether-core';
import {Cache} from '../../common/cache';
import {customConfig} from '../../config';
import * as MyResponse from '../../common/response/response';

// Get gas price
export async function getGasPrice(req, res) {
	try {
		const result = await core.GetGasPrice();

		res.send(MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, result));

		log.RequestId().debug(result);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Get tx receipt
export async function getTxReceipt(req, res) {
	if (!req.query ||
		!req.query.txHash
	) {
		return MyResponse.BadRequest(res);
	}

	log.RequestId().debug("New request query=", req.query);

	try {
		const receipt: any = await core.GetTxReceipt(req.query.txHash);

		if (!receipt) {
			return MyResponse.NotFound(res);
		}
		// Set value in response
		const tx = await core.GetTxResponse(req.query.txHash);
		receipt.value = tx.value.toString();

		res.send(MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, {
			status: receipt.status,
			receipt: receipt,
		}));

		log.RequestId().info("receipt=", receipt);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Get tx
export async function getTxResponse(req, res) {
	if (!req.query ||
		!req.query.txHash
	) {
		return MyResponse.BadRequest(res);
	}

	log.RequestId().debug("New request query=", req.query);

	try {
		const tx = await core.GetTxResponse(req.query.txHash);

		if (!tx) {
			return MyResponse.NotFound(res);
		}
		res.send(MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, tx));

		log.RequestId().info("tx=", tx);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Get block number
export async function getBlockNumber(req, res) {
	try {
		const blockNumber = await core.GetBlockNumber();

		res.send(MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, {
			"blockNumber": blockNumber,
		}));

		log.RequestId().info("blockNumber=", blockNumber);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Get block by hash
export async function getBlock(req, res) {
	if (!req.query ||
		!req.query.blockHash
	) {
		return MyResponse.BadRequest(res);
	}

	try {
		const block = await core.GetBlock(req.query.blockHash);

		res.send(MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, block));

		log.RequestId().info("block=", block);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Get balance of address
export async function getBalanceOf(req, res) {
	if (!req.query ||
		!req.query.address
	) {
		return MyResponse.BadRequest(res);
	}

	log.RequestId().debug("New request query=", req.query);

	try {
		const balanceResult = await core.GetBalanceOf(req.query.address);

		res.send(MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, balanceResult));

		log.RequestId().info("balance(%s)=%o", req.query.address, balanceResult);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Observer address balance
export async function observer(req, res) {
	if (!req.params ||
		!req.params.address
	) {
		return MyResponse.BadRequest(res);
	}

	try {
		// Set cache ttl to 3 seconds by default
		if (Cache.CacheBalanceObserver.has(req.params.address)) {
			res.send(Cache.CacheBalanceObserver.get(req.params.address));
			return;
		}

		const balanceResult = await core.Observer(req.params.address);
		const rsp = MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, balanceResult);

		res.send(rsp);

		Cache.CacheBalanceObserver.set(req.params.address, rsp);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Transfer
export async function transfer(req, res) {
	if (!req.body ||
		!req.body.from ||
		!req.body.to ||
		!req.body.amount ||
		!req.body.pk
	) {
		return MyResponse.BadRequest(res);
	}

	log.RequestId().debug("New request body=", req.body);

	try {
		auditor.Check(customConfig.GetTxConfig().confirmations > 0, "invalid tx confirmations");
		const receipt = await core.Transfer(req.body.from, req.body.to, req.body.amount, req.body.pk,
			customConfig.GetTxConfig().gasLimitC, customConfig.GetTxConfig().confirmations);

		res.send(MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, {
			"txHash": receipt.transactionHash,
		}));

		log.RequestId().info("txHash=", receipt.transactionHash);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Verify signature
export async function verifySignature(req, res) {
	if (!req.body ||
		!req.body.address ||
		!req.body.msg ||
		!req.body.sig
	) {
		return MyResponse.BadRequest(res);
	}

	log.RequestId().debug("New request url=%o, body=%o", req.url, req.body);

	try {
		// Set cache, ttl: 10min, max items: 1000
		const cache = Cache.MemCache("verifySignature", 1000 * 60 * 10, 1000);

		// Build compose key
		const composeKey = req.body.address + req.body.msg + req.body.sig;
		if (cache.has(composeKey)) {
			res.send(cache.get(composeKey));
			return;
		}

		const result = await core.VerifySig(req.body.address, req.body.msg, req.body.sig);
		const rsp = MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, {
			"verified": result,
		});

		res.send(rsp);

		// Update cache
		cache.set(composeKey, rsp);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Verify address
export async function verifyAddress(req, res) {
	if (!req.params ||
		!req.params.address
	) {
		return MyResponse.BadRequest(res);
	}

	try {
		// Set cache, ttl: 10min, max items: 1000
		const cache = Cache.MemCache("verifyAddress", 1000 * 60 * 10, 1000);

		// Check cache
		if (cache.has(req.params.address)) {
			res.send(cache.get(req.params.address));
			return;
		}

		const result = core.VerifyAddress(req.params.address);
		const rsp = MyResponse.BuildResponse(customConfig.GetMintRspCode().OK, {
			"verified": result,
		});

		res.send(rsp);

		// Update cache
		cache.set(req.params.address, rsp);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// New wallet
export async function newWallet(req, res) {
	try {
		const wallet = await core.NewWallet(req.body.entropy);
		res.send(wallet);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// New JSON wallet
export async function newJsonWallet(req, res) {
	if (!req.body.password) {
		return MyResponse.BadRequest(res);
	}

	try {
		const jsonWallet = await core.NewJsonWallet(req.body.password, req.body.entropy);
		res.send(jsonWallet);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Retrieve JSON wallet from mnemonic
export async function retrieveJsonWalletFromMnemonic(req, res) {
	if (!req.body.password
		|| !req.body.mnemonic) {
		return MyResponse.BadRequest(res);
	}

	try {
		const jsonWallet = await core.RetrieveJsonWalletFromMnemonic(req.body.password, req.body.mnemonic);
		res.send(jsonWallet);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Retrieve JSON wallet from pk
export async function retrieveJsonWalletFromPK(req, res) {
	if (!req.body.password
		|| !req.body.pk) {
		return MyResponse.BadRequest(res);
	}

	try {
		const jsonWallet = await core.RetrieveJsonWalletFromPK(req.body.password, req.body.pk);
		res.send(jsonWallet);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Inspect JSON wallet
export async function inspectJsonWallet(req, res) {
	if (!req.body.password
		|| !req.body.jsonWallet) {
		return MyResponse.BadRequest(res);
	}

	try {
		const jsonWallet = await core.InspectJsonWallet(req.body.password, req.body.jsonWallet);
		res.send(jsonWallet);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}
