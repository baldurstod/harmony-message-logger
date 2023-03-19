export class Message {
	#id;
	#type;
	#title;
	#content;
	#dateCreated;
	#deleteAfter;
	constructor(type, title, content, retention) {
		this.#dateCreated = Date.now();
		this.#type = type;
		this.#title = title;
		this.#content = content;
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

	set title(title) {
		this.#title = title;
	}

	get title() {
		return this.#title;
	}

	set content(content) {
		this.#content = content;
	}

	get content() {
		return this.#content;
	}

	fromJSON(json) {
		this.#id = json.id;
		this.#type = json.type;
		this.#title = json.title;
		this.#content = json.content;
		this.#dateCreated = json.dateCreated;
		this.#deleteAfter = json.deleteAfter;
	}

	toJSON() {
		return {
			id: this.#id,
			type: this.#type,
			title: this.#title,
			content: this.#content,
			dateCreated: this.#dateCreated,
			deleteAfter: this.#deleteAfter,
		}
	}
}
