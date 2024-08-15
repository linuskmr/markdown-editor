/**
 * @example
 * const editorDomNode = document.querySelector(".editor")
 * const editor = new Editor(editorDomNode)
 */
class Editor {
	/**
	 * Handle to the editor HMTL-{Node}
	 */
	domNode

	/**
	 * Creates a new editor instance
	 * @param {HTMLElement} domNode The editor HTML element
	 */
	constructor(domNode) {
		if (!(domNode instanceof HTMLElement)) { // Don't remove the brackets! https://stackoverflow.com/a/15359468/14350146
			throw new Error(`No editor found with query selector '${querySelector}'`)
		}
		console.log(domNode.contentEditable)
		if (domNode.contentEditable !== "true") {
			throw new Error("Editor needs the domNode to have 'contentEditable=\"true\"'")
		}
		this.domNode = domNode

		// For `contenteditable` elements like the editor, there is no 'onkeyup' event but 'oninput' instead
		this.domNode.oninput = (event) => { this.#addLinkEdits() }
		// Initial transformation of the links already in the editor
		this.#addLinkEdits()
	}

	/**
	 * Adds a heading to the editor at the current cursor position
	 * @param {number} level The heading level (1-6)
	 */
	addHeading(level) {
		if (level < 1 || level > 6) {
			throw new Error(`Invalid heading level: ${level}`)
		}
		const headingTag = "h" + level
		const headingElement = document.createElement(headingTag)

		const selectionContent = this.#getCursorSelectionContent()
		if (selectionContent.textContent !== "") {
			headingElement.appendChild(selectionContent)
		} else {
			headingElement.innerText = headingTag
		}

		this.#insertNode(headingElement)
		// TODO: The newly inserted element is selected, so typing removes the element. Try to focus the inner text of the element instead.
	}

	addUnorderedList() {
		const ul = document.createElement("ul")
		const li = document.createElement("li")
		ul.appendChild(li)
		
		const selectionContent = this.#getCursorSelectionContent()
		if (selectionContent.textContent !== "") {
			li.appendChild(selectionContent)
		} else {
			li.innerText = "List item"
		}
		
		this.#insertNode(ul)
	}

	addOrderedList() {
		const ol = document.createElement("ol")
		const li = document.createElement("li")
		ol.appendChild(li)
		
		const selectionContent = this.#getCursorSelectionContent()
		if (selectionContent.textContent !== "") {
			li.appendChild(selectionContent)
		} else {
			li.innerText = "List item"
		}
		
		this.#insertNode(ol)
	}

	addLink() {
		const link = document.createElement('a')
		link.innerHTML = 'Link'
		link.href = '#'
		this.#insertNode(link)
		// TODO: The newly inserted element is selected, so typing removes the element. Try to focus the inner text of the element instead.
	}

	addImg() {
		const img = document.createElement('img')
		img.src = "#"
		this.#insertNode(img)
	}

	addItalic() {
		const italic = document.createElement('i')

		const selectionContent = this.#getCursorSelectionContent()
		if (selectionContent.textContent !== "") {
			italic.appendChild(selectionContent)
		} else {
			italic.innerText = "italic"
		}

		this.#insertNode(italic)
	}

	addBold() {
		const bold = document.createElement('b')

		const selectionContent = this.#getCursorSelectionContent()
		if (selectionContent.textContent !== "") {
			bold.appendChild(selectionContent)
		} else {
			bold.innerText = "bold"
		}

		this.#insertNode(bold)		
	}

	/**
	 * Inserts `element` at the current cursor position in the editor, or replaces the current cursor selection with the new element
	 * @param {Node} node The element to add
	 */
	#insertNode(node) {
		// From https://stackoverflow.com/a/4823925/14350146
		const cursorPosition = window.getSelection().getRangeAt(0)

		/* if (cursorPosition.startContainer.parentNode.class !== "editor") {
			console.log('Cursor is not inside the editor')
			console.log({pos: cursorPosition.startContainer.parentNode})
		} */

		cursorPosition.deleteContents()
		cursorPosition.insertNode(node)
		this.#addLinkEdits()
		this.domNode.focus()
	}

	/**
	 * Adds an onclick event to all links in the editor to allow them to be edited
	 */
	#addLinkEdits() {
		for (const link of this.domNode.querySelectorAll('a')) {
			link.onclick = (event) => {
				console.log(`Link clicked: ${link.text} -> ${link.href}`)
			}
		}
	}

	/**
	 * Returns the content of the current cursor selection in the editor, or null if nothing is selected
	 * @returns {DocumentFragment|null}
	 */
	#getCursorSelectionContent() {
		const cursorPosition = window.getSelection().getRangeAt(0)
		// Since the content is replaced/embedded into another node,
		// we don't need a copy as provided by `cursorPosition.cloneContents()`
		return cursorPosition.extractContents()
	}
}
