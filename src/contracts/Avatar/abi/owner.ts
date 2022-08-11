import {utils} from 'ethers';
import {log} from '@jovijovi/pedrojs-common';
import {customConfig} from '../../../config';
import {GetContractOwner} from './abi';

// GetContractOwnerKeyStoreSK returns contract owner keystore SK
export function GetContractOwnerKeyStoreSK(address: string): string {
	const ownerList = customConfig.GetContractOwnerList();

	for (const owner of ownerList) {
		if (utils.getAddress(owner.address) === utils.getAddress(address)) {
			if (!owner.keyStoreSK) {
				throw new Error(`Invalid keystore SK`);
			}
			return owner.keyStoreSK;
		}
	}

	throw new Error(`No matching address in keystore`);
}

// GetDefaultContractOwner returns default contract owner (1st)
export function GetDefaultContractOwner(): customConfig.Wallet {
	const ownerList = customConfig.GetContractOwnerList();
	if (ownerList.length === 0) {
		throw new Error(`Invalid contract owner list`);
	}

	return ownerList[0];
}


// MatchContractOwner returns contract owner matched
export async function MatchContractOwner(address: string, reqId?: string): Promise<string> {
	const contractOwner = (await GetContractOwner(address)).data.owner.toLowerCase();
	if (!customConfig.GetMint().contractOwner.map(x => x.address.toLowerCase()).includes(contractOwner)) {
		log.RequestId(reqId).error("No matching address(%s) in contractOwner list", contractOwner);
		throw new Error(`No matching address in contractOwner list`);
	}

	return contractOwner;
}
