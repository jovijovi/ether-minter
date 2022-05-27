import * as core from 'express-serve-static-core';
import {API} from '../api';

export function APIs(router: core.Express) {
	defaultAPIs(router);
}

function defaultAPIs(router: core.Express) {
	router.get('/api/v1/nft/totalsupply/:address', API.GetGetTotalSupply);
	router.post('/api/v1/nft/estimate/transfer', API.EstimateGasOfTransferNFT);

	router.post('/api/v3/contracts/mint', API.MintForCreator);
}
