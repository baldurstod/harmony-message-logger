export class Message {
	#id;
	#type;
	#message;
	#dateCreated;
	#deleteAfter;
	constructor(type, message, retention) {
		this.#dateCreated = Date.now();
		this.#type = type;
		this.#message = message;
		if (retention) {
			this.#deleteAfter = this.#dateCreated + retention * 1000;
		}
	}

	set id(id) {
		this.#id = id;
	}

	get id() {
		return this.#id;
	}

	set type(type) {
		this.#type = type;
	}

	get type() {
		return this.#type;
	}

	set message(message) {
		this.#message = message;
	}

	get message() {
		return this.#message;
	}

	fromJSON(json) {
		this.#id = json.id;
		this.#type = json.type;
		this.#message = json.message;
		this.#dateCreated = json.dateCreated;
		this.#deleteAfter = json.deleteAfter;
	}

	toJSON() {
		return {
			id: this.#id,
			type: this.#type,
			message: this.#message,
			dateCreated: this.#dateCreated,
			deleteAfter: this.#deleteAfter,
		}
	}
}
