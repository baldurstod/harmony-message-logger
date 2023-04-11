import Datastore from '@seald-io/nedb';
import {setTimeoutPromise} from 'harmony-utils';

const AUTO_PURGE_DELAY = 15 * 60 * 1000;
const DEFAULT_RETENTION = 30 * 24 * 60 * 60;

export class Logger {
	#loggerDB;
	#retention;
	#intervalID;
	constructor({databasePath, retention = DEFAULT_RETENTION} = {}) {
		this.#retention = retention;
		if (!databasePath) {
			throw 'No database path provided';
		}
		this.#loggerDB = new Datastore({filename: databasePath, autoload: true});

		this.#intervalID = setInterval(() => this.#purgeOldMessages(), AUTO_PURGE_DELAY);
		this.#purgeOldMessages();
	}

	close() {
		clearInterval(this.#intervalID);
	}

	async #purgeOldMessages() {
		try {
			const now = Date.now();
			await this.#loggerDB.removeAsync({deleteAfter: {$lt: now}}, {multi: true});
			if (this.#retention !== 0) {
				const createdBefore = now - this.#retention * 1000;
				await this.#loggerDB.removeAsync({deleteAfter: {$exists: false}, dateCreated: {$lt: createdBefore}}, {multi: true});
			}

			await this.#loggerDB.compactDatafileAsync();
		} catch (e) {}
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
