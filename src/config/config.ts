import {config} from '@jovijovi/pedrojs-common';

export namespace customConfig {
	class TxConfig {
		gasLimitC: number
		confirmations: number
	}

	export class CustomConfig {
		tx: TxConfig
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
}
