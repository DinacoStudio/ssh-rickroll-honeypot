const frameSeq = require("./rickroll");
const LINES_PER_FRAME = 36;

function processFrames() {
	return frameSeq
		.split("\n")
		.map((line) => line.trim())
		.reduce((acc, line, i) => {
			const frameIndex = Math.floor(i / LINES_PER_FRAME);
			if (!acc[frameIndex]) acc[frameIndex] = [];
			acc[frameIndex].push(line);
			return acc;
		}, [])
		.map((frame) => frame.join("\n"));
}

module.exports = { processFrames };
