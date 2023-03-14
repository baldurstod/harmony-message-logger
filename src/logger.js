import Datastore from '@seald-io/nedb';

export class Logger {
	#loggerDB;
	constructor({databasePath, autoPurge} = {}) {
		if (!databasePath) {
			throw 'No database path provided';
		}
		this.#loggerDB = new Datastore({filename: databasePath, autoload: true});
		if (autoPurge) {
			this.#autoPurge();
		}
	}

	async #autoPurge() {
		await this.purgeOldMessages();
	}

	async purgeOldMessages() {
		const now = Date.now();
		const numRemoved = await this.#loggerDB.removeAsync({deleteAfter: {$lt: now}}, {multi: true});

		await this.#loggerDB.compactDatafileAsync();
	}

	async addMessage(message) {
		const newDoc = await this.#loggerDB.insertAsync(message.toJSON());
		message.id = newDoc._id;
	}

	async getMessage(messageId) {
		return await this.#loggerDB.findOneAsync({_id: messageId});
	}

	async getLastMessages(limit, createdBefore) {
		let result;

		if (createdBefore) {
			result = this.#loggerDB.findAsync({dateCreated: {$lt: createdBefore}});
		} else {
			result = this.#loggerDB.findAsync({});
		}

		result = result.sort({dateCreated: -1});
		if (limit) {
			result = result.limit(limit);
		}


		return result;
	}

	async removeMessage(messageId) {
		await await db.removeAsync({ _id: messageId}, {});
	}
}
