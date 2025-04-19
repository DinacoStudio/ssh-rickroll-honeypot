const { generateKey } = require("./keyManager");
const { createServer } = require("./serverConfig");
const logger = require("./logger");

(async () => {
	try {
		const hostKey = await generateKey();
		const server = createServer(hostKey);

		server.listen(22, "0.0.0.0", () => {
			logger.log("info", "SSH-сервер запущен на порту 22");
		});
	} catch (error) {
		logger.log("error", `Ошибка при запуске сервера: ${error.message}`);
	}
})();
