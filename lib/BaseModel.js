const prompt = require('prompt-async');

class BaseModel {
	static async prompt() {
		console.log(`Type 'yes' to continue`);

		prompt.start();
		const { proceed } = await prompt.get(['proceed']);

		if (proceed !== 'yes') {
			console.log('Operation Aborted');
			process.exit();
		}
	}
}

module.exports = BaseModel;
