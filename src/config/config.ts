import {config} from '@jovijovi/pedrojs-common';

export namespace customConfig {
	class TxConfig {
		gasLimitC: number
		gasPriceC: number
		confirmations: number
	}

	export class Wallet {
		address: string
		keyStoreSK?: string
	}

	class Mint {
		contractOwner: Wallet
		gasPrice: {
			upper: {
				threshold: string
				callback: string
			},
			lower: {
				threshold: string
				callback: string
			},
		}
		apiResponseCode: any
		randomMinter: boolean
		minterList: Wallet[]
	}

	export class CustomConfig {
		tx: TxConfig
		mint: Mint
	}

	let customConfig: CustomConfig;

	export function LoadCustomConfig() {
		customConfig = config.GetYmlConfig().custom;
	}

	export function Get() {
		return customConfig;
	}

	// GetTxConfig returns tx config
	export function GetTxConfig(): TxConfig {
		return customConfig.tx;
	}

	// GetMint returns mint config
	export function GetMint(): Mint {
		if (customConfig.mint) {
			return customConfig.mint;
		}

		throw new Error(`GetMint Failed, invalid config`);
	}

	// GetMintRspCode returns mint response code
	export function GetMintRspCode(): any {
		if (customConfig.mint) {
			return customConfig.mint.apiResponseCode;
		}

		throw new Error(`GetMintRspCode Failed, invalid config`);
	}
}
