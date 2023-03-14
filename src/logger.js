import Datastore from '@seald-io/nedb';
import {setTimeoutPromise} from 'harmony-utils';

const AUTO_PURGE_DELAY = 15 * 60 * 1000;

export class Logger {
	#loggerDB;
	#closePromise;
	#closePromiseResolve;
	constructor({databasePath, autoPurge} = {}) {
		this.#closePromise = new Promise(resolve => this.#closePromiseResolve = resolve);
		if (!databasePath) {
			throw 'No database path provided';
		}
		this.#loggerDB = new Datastore({filename: databasePath, autoload: true});
		if (autoPurge) {
			this.#autoPurge();
		}
	}

	close() {
		this.#closePromiseResolve('closed');
	}

	async #autoPurge() {
		await this.purgeOldMessages();
		const raceResult = await Promise.race([this.#closePromise, setTimeoutPromise(AUTO_PURGE_DELAY)]);
		if (raceResult != 'closed') {
			this.#autoPurge();
		}
	}

	async purgeOldMessages() {
		try {
			const now = Date.now();
			await this.#loggerDB.removeAsync({deleteAfter: {$lt: now}}, {multi: true});

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
