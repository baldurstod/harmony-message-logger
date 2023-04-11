import Datastore from '@seald-io/nedb';
import {setTimeoutPromise} from 'harmony-utils';

const AUTO_PURGE_DELAY = 15 * 60 * 1000;
const DEFAULT_RETENTION = 30 * 24 * 60 * 60;

export class Logger {
	#loggerDB;
	#closePromise;
	#closePromiseResolve;
	#retention;
	#abortController;
	constructor({databasePath, retention = DEFAULT_RETENTION} = {}) {
		this.#retention = retention;
		this.#closePromise = new Promise(resolve => this.#closePromiseResolve = resolve);
		if (!databasePath) {
			throw 'No database path provided';
		}
		this.#loggerDB = new Datastore({filename: databasePath, autoload: true});
		this.#autoPurge();
	}

	close() {
		this.#closePromiseResolve('closed');
		this.#abortController?.abort();
	}

	async #autoPurge() {
		this.#abortController = new AbortController();
		const signal = this.#abortController.signal;
		await this.purgeOldMessages();
		try {
			const raceResult = await Promise.race([this.#closePromise, setTimeoutPromise(AUTO_PURGE_DELAY, signal)]);
			if (raceResult != 'closed') {
				this.#autoPurge();
			}
		} catch (e) {}
	}

	async purgeOldMessages() {
		try {
			const now = Date.now();
			await this.#loggerDB.removeAsync({deleteAfter: {$lt: now}}, {multi: true});
			if (this.#retention !== 0) {
				const createdBefore = now - this.#retention * 1000;
				await this.#loggerDB.removeAsync({dateCreated: {$lt: createdBefore}}, {multi: true});
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
