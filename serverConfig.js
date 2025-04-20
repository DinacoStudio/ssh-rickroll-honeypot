const Server = require("ssh2").Server;
const { processFrames } = require("./frameProcessor");
const { generateResponse } = require("./responseGenerator");
const logger = require("./logger");
const { constants } = require("buffer");

const FRAME_RATE = 10;

function createServer(hostKey) {
	const frames = processFrames();
	const totalFrames = frames.length;

	const server = new Server(
		{
			hostKeys: [hostKey],
			algorithms: {
				kex: [
					"ecdh-sha2-nistp256",
					"ecdh-sha2-nistp384",
					"ecdh-sha2-nistp521",
					"diffie-hellman-group14-sha1",
					"diffie-hellman-group-exchange-sha1",
					"diffie-hellman-group-exchange-sha256"
				],
				cipher: ["aes128-ctr", "aes192-ctr", "aes256-ctr"],
				serverHostKey: ["ssh-ed25519", "ecdsa-sha2-nistp256", "ecdsa-sha2-nistp384", "ecdsa-sha2-nistp521"],
				hmac: ["hmac-sha2-256", "hmac-sha2-512"]
			},
			banner: "Ubuntu 22.04.6 LTS\n",
			ident: "SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.6"
		},
		(client) => {
			const clientIP = client._sock.localAddress;
			client.on("authentication", (ctx) => {
				const { username, password = "no password", method } = ctx;
				logger.log(
					"info",
					`Попытка аутентификации - IP: ${clientIP}, User: ${username}, Method: ${method}, Password: ${password}`
				);
				ctx.accept();
			});

			client.on("ready", () => {
				client.on("session", (accept) => {
					const session = accept();
					let termInfo = { rows: 24, cols: 80 };

					session.on("pty", (accept, _, info) => {
						termInfo = info;
						accept();
					});

					let response = null;
					session.on("exec", (accept, reject, info) => {
						if (info.command.includes("/proc/")) {
							const stream = accept();
							const send = () => {
								try {
									stream.write(generateResponse());
								} catch {}
							};
							response = setInterval(send, 1000);
						} else {
							clearInterval(response);
						}
					});

					session.on("shell", (accept) => {
						const stream = accept();
						let interval;
						let currentFrame = 0;

						const showAnimation = () => {
							try {
								if (!stream.writable) {
									cleanup();
									return;
								}

								stream.write("\x1b[2J\x1b[H\x1b[?25l");

								const frameLines = frames[currentFrame].split("\n");
								const maxWidth = Math.max(...frameLines.map((line) => line.length));
								const padding = " ".repeat(Math.floor((termInfo.cols - maxWidth) / 2));

								frameLines.forEach((line) => {
									if (stream.writable) {
										stream.write(padding + line + "\r\n");
									}
								});

								if (stream.writable) {
									stream.write("\x1b[?25h");
								}
								currentFrame = (currentFrame + 1) % totalFrames;
							} catch (err) {
								cleanup();
							}
						};

						interval = setInterval(showAnimation, 1000 / FRAME_RATE);

						const cleanup = () => {
							if (interval) {
								clearInterval(interval);
								interval = null;
							}
							try {
								if (stream.writable) {
									stream.write("\x1b[?25h");
									stream.end();
								}
							} catch (err) {
								// Игнорируем ошибки при закрытии
							}
						};
						const disconnect = () => {
							client.end();
							cleanup();
						};
						setTimeout(disconnect, 60_000);

						stream.on("close", cleanup);
						stream.on("eof", cleanup);
						stream.on("end", cleanup);
						stream.on("error", cleanup);
						stream.on("finish", cleanup);
					});
				});
			});

			client.on("error", (err) => {
				if (err.code !== "ECONNRESET") {
					logger.log("error", `Ошибка клиента - IP: ${clientIP}, Error: ${err.message}`);
				}
			});
		}
	);

	server.on("error", (err) => {
		if (err.code !== "ECONNRESET") {
			logger.log("error", `Ошибка сервера: ${err.message}`);
		}
	});

	return server;
}

module.exports = { createServer };
