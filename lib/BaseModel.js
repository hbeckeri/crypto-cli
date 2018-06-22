class BaseModel {
	static async prompt() {
		try {
			const prompt = require('prompt-async');
			console.log(`\nType 'yes' to continue\n`);

			prompt.start();
			const { proceed } = await prompt.get(['proceed']);

			if (proceed !== 'yes') {
				console.log('Operation Aborted');
				process.exit();
			}
		} catch (e) {
			console.log('\nOperation Aborted');
			process.exit();
		}
	}
}

module.exports = BaseModel;
