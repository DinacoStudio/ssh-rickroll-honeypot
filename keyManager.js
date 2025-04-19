const fs = require("fs");
const { execSync } = require("child_process");
const logger = require("./logger");

function generateKey() {
	return new Promise((resolve, reject) => {
		const tempKeyPath = "temp_host_key_ed25519";
		try {
			execSync(`ssh-keygen -t ed25519 -f ${tempKeyPath} -N "" -m PEM`);
			const hostKey = fs.readFileSync(tempKeyPath);
			fs.unlinkSync(tempKeyPath);
			resolve(hostKey);
		} catch (error) {
			logger.log("error", `Ошибка при генерации ключа: ${error.message}`);
			reject(error);
		}
	});
}

module.exports = { generateKey };
