import {customConfig} from '../../../config';
import {ErrContractReachTheMaxSupply} from '../errors';

export async function ErrorResponse(e, res) {
	let code = customConfig.GetMint().apiResponseCode.ERROR;
	let msg = e.toString();

	if (e.reason.includes(ErrContractReachTheMaxSupply)) {
		code = customConfig.GetMint().apiResponseCode.MAXSUPPLY;
		msg = e.reason;
	}

	res.send({
		code: code,
		msg: msg,
	});

	return;
}
