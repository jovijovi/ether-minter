import * as core from 'express-serve-static-core';
import {API} from '../api';

export function APIs(router: core.Express) {
	defaultAPIs(router);
	v3APIs(router);
}

function defaultAPIs(router: core.Express) {
	router.post('/api/v1/nft/estimate/transfer', API.EstimateGasOfTransferNFT);
}

function v3APIs(router: core.Express) {
	router.post('/api/v3/contracts/deploy', API.Deploy);
	router.post('/api/v3/contracts/maxSupply', API.SetMaxSupply);
	router.post('/api/v3/contracts/baseTokenURI', API.SetBaseTokenURI);
	router.post('/api/v3/contracts/mint', API.MintForCreator);
	router.post('/api/v3/contracts/burn', API.Burn);
	router.post('/api/v3/contracts/batch/mint', API.MintTo);
	router.post('/api/v3/nft/estimate/batch/transfer', API.EstimateGasOfBatchTransfer);
	router.post('/api/v3/nft/estimate/batch/transfer2n', API.EstimateGasOfBatchTransferToN);
	router.post('/api/v3/contracts/batch/transfer', API.BatchTransfer);
	router.post('/api/v3/contracts/batch/transfer2n', API.BatchTransferToN);
	router.post('/api/v3/contracts/batch/burn', API.BatchBurn);
	router.get('/api/v3/contracts/mintStatus', API.GetMintStatus);
	router.get('/api/v3/contracts/tokenIdByContentHash', API.GetTokenIdByContentHash);
	router.get('/api/v3/contracts/info', API.GetContractInfo);
	router.get('/api/v3/contracts/tokenInfo', API.GetTokenInfo);
	router.get('/api/v3/contracts/tokenContentHash', API.GetTokenContentHash);
	router.get('/api/v3/contracts/tokenURI', API.GetTokenURI);
	router.get('/api/v3/contracts/symbol', API.GetSymbol);
	router.get('/api/v3/contracts/ownerOf', API.OwnerOf);
	router.get('/api/v3/contracts/balanceOf', API.BalanceOf);
	router.get('/api/v3/contracts/totalsupply', API.GetGetTotalSupply);
	router.get('/api/v3/contracts/maxSupply', API.GetMaxSupply);
	router.get('/api/v3/contracts/owner', API.GetContractOwner);
}
