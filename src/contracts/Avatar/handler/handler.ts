import * as core from 'express-serve-static-core';
import {API} from '../api';

export function APIs(router: core.Express) {
	defaultAPIs(router);
	v3APIs(router);
}

function defaultAPIs(router: core.Express) {
	router.get('/api/v1/nft/totalsupply/:address', API.GetGetTotalSupply);
	router.post('/api/v1/nft/estimate/transfer', API.EstimateGasOfTransferNFT);
}

function v3APIs(router: core.Express) {
	router.post('/api/v3/contracts/mint', API.MintForCreator);
	router.get('/api/v3/contracts/mintStatus', API.GetMintStatus);
	router.get('/api/v3/contracts/tokenIdByContentHash', API.GetTokenIdByContentHash);
	router.get('/api/v3/contracts/info', API.GetContractInfo);
}
