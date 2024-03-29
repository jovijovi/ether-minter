import * as core from 'express-serve-static-core';
import {ITaskHandler} from '@jovijovi/pedrojs-network-http';
import {TwoFAToken} from '@jovijovi/express-2fa-token';
import * as eth from '../eth';
import {avatar} from '../contracts';

function defaultAPIs(router: core.Express) {
	router.use(notFound);
}

class privateImplHandlers implements ITaskHandler {
	RegisterHandlers(router: core.Express) {
		eth.Handler.APIs(router);
		avatar.Handler.APIs(router);
		defaultAPIs(router);
	}

	UseMiddleware(app: core.Express) {
		app.use(TwoFAToken);
	}
}

function notFound(req, res, next) {
	res.status(404).send({
		error: 'Not found',
	});
	next();
}

export const RestfulHandlers = new privateImplHandlers();
