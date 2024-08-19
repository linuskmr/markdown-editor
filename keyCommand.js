class KeyCommand {
	/**
	 * Reference to the {Editor}.
	 */
	editor

	constructor(editor) {
		this.editor = editor
	}
	is(event) {
		throw new Error("Method `is` not implemented for abstract base class `KeyCommand`")
	}
	action(event) {
		throw new Error("Method `action` is not implemented for abstract base class `KeyCommand`")
	}
}

class BoldItalicCommand extends KeyCommand {
	is(event) {
		return event.ctrlKey && ["b", "i"].includes(event.key)
	}
	action(event) {
		this.editor.toggleTag(event.key)
	}
}

class HeadingCommand extends KeyCommand {
	is(event) {
		return event.ctrlKey && ["1", "2", "3"].includes(event.key)
	}
	action(event) {
		const tagName = `h${event.key}`
		this.editor.toggleTag(tagName)
	}
}


class TabCommand extends KeyCommand {
	is(event) {
		return event.key === "Tab"
	}
	action(event) {
		const selectedRange = window.getSelection().getRangeAt(0)
		const selectedContents = selectedRange.extractContents()
		console.log(selectedContents.parentElement)
		console.log(selectedContents.parentNode)
		// const isListItem = Array.from(selectedContents.childNodes).filter(node => node.textContent !== "").some(node => node.tagName === tagName)
		const isListItem = true
		if (!isListItem) {
			console.log(selectedContents)
			return
		}
		const sublist = document.createElement("ul")
		sublist.appendChild(selectedContents)
		selectedRange.insertNode(sublist)
	}
}

const keyCommandClasses = [HeadingCommand, TabCommand, BoldItalicCommand]