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
		if (domNode.contentEditable !== "true") {
			throw new Error("Editor needs the domNode to have 'contentEditable=\"true\"'")
		}
		this.domNode = domNode

		
		document.addEventListener("selectionchange", event => {
			// We work with opacity instead of `display: none` so that JS can get a height for the tooltip even if it's not visible
			const selectedRange = window.getSelection().getRangeAt(0)
			const tooltip = document.querySelector(".editor-tooltip-outer")


			if (selectedRange.cloneContents().textContent === "") {
				// Nothing is selected. The cursor is just blinking and pointing into the editor.
				// Don't show the tooltip.
				tooltip.style.opacity = 0
				return
			}

			const selectionPosition = selectedRange.getBoundingClientRect()
			const selectionCenterXPosition = (selectionPosition.left + selectionPosition.right) / 2
			const positionX = selectionCenterXPosition - tooltip.getBoundingClientRect().width / 2
			const marginY = 0
			const positionY = selectionPosition.top - tooltip.getBoundingClientRect().height - marginY

			tooltip.style.position = "absolute"
			tooltip.style.top = `${positionY}px`
			tooltip.style.left = `${positionX}px`
			tooltip.style.opacity = 1
		})

		this.#setupKeyboardCommands()
		
		// Initial transformation of the links already in the editor
		this.#addLinkEdits()
	}

	addUnorderedList() {
		const ul = document.createElement("ul")
		const li = document.createElement("li")
		ul.appendChild(li)
		
		const selectedRange = window.getSelection().getRangeAt(0)
		const selectionContent = selectedRange.extractContents()
		if (selectionContent.textContent !== "") {
			li.appendChild(selectionContent)
		} else {
			li.innerText = "List item"
		}
		
		selectedRange.insertNode(ul)
		this.#addLinkEdits()
		this.domNode.focus()
		this.domNode.dispatchEvent(new Event("keyup"))
	}

	addOrderedList() {
		const ol = document.createElement("ol")
		const li = document.createElement("li")
		ol.appendChild(li)
		
		const selectedRange = window.getSelection().getRangeAt(0)
		const selectionContent = selectedRange.extractContents()
		if (selectionContent.textContent !== "") {
			li.appendChild(selectionContent)
		} else {
			li.innerText = "List item"
		}
		
		selectedRange.insertNode(ol)
		this.#addLinkEdits()
		this.domNode.focus()
		this.domNode.dispatchEvent(new Event("keyup"))
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

	/**
	 * Toggles the tag of the current cursor position/selection.
	 * 
	 * If nothing is selected and the cursor just blinks and points into the editor,
	 * a new node with the tag type `tagName` is created with the tag type as default text.
	 * 
	 * If something is selected and not all children are of the tag type `tagName`,
	 * the whole selected text is wrapped in *one* new node of the tag type,
	 * while children of the selected text already having the tag type are removed from them.
	 * This way, tags are merged, e.g. a `hello <b>world</b>` becomes `<b>hello world<b>` when toggling bold.
	 * 
	 * If something is selected and either is a tag of type `tagName` or all children are already of the tag type `tagName`,
	 * the tag type is removed from all children of the selected text.
	 * 
	 * @param {string} tagName `b` (bold), `i` (italics), `u` (underline)
	 * @returns 
	 */
	toggleTag(tagName, attributes) {
		tagName = tagName.toUpperCase()
		const selectedRange = window.getSelection().getRangeAt(0)
		const selectedContents = selectedRange.extractContents()
		const isSelected = selectedContents.textContent !== ""
		
		if (!isSelected) {
			// Create a new node with the tag type,
			// optionally with attributes and the selected text as inner text
			// with the tag type as default text (the node isn't visible otherwise).
			const node = document.createElement(tagName)
			for (const [key, value] of Object.entries(attributes || [])) {
				node.setAttribute(key, value)
			}
			node.innerText = tagName
			selectedRange.insertNode(node)
			this.#addLinkEdits()
			this.domNode.focus()
			this.domNode.dispatchEvent(new Event("keyup"))
			return
		}

		const isRootOfTagType = selectedContents.tagName === tagName
		const areAllChildrenOfTagType = Array.from(selectedContents.childNodes).filter(node => node.textContent !== "").every(node => node.nodeName === tagName)
		const isAlreadyOfTagType = isRootOfTagType || areAllChildrenOfTagType

		// Remove the tag type from all children of the selected text.
		// Later, the whole selected text will be wrapped in *one* new node of the tag type.
		for (const child of selectedContents.childNodes) {
			this.#removeInnerTag(child, tagName)
		}

		let node;
		if (!isAlreadyOfTagType) {
			// The selected text is not already of the tag type,
			// so wrap it in a new node of the tag type
			node = document.createElement(tagName)
		} else {
			// Use a DocumentFragment as temporary container without being a tag itself
			node = document.createDocumentFragment()
		}
		node.appendChild(selectedContents)
		selectedRange.insertNode(node)
		this.#addLinkEdits()
		this.domNode.focus()
		this.domNode.dispatchEvent(new Event("keyup"))
	}

	/**
	 * Removes the tag `tagName` from the node and all its children.
	 * @param {*} node The node and its children to remove the tag from.
	 * @param {*} tagName The tag to remove.
	 */
	#removeInnerTag(node, tagName) {
		tagName = tagName.toUpperCase()
		for (const child of node.childNodes) {
			this.#removeInnerTag(child, tagName)
		}
		if (node.tagName === tagName && node.parentNode !== undefined) {
			while (node.firstChild) {
				node.parentNode.insertBefore(node.firstChild, node)
			}
			node.parentNode.removeChild(node)
		}
	}

	/**
	 * Inserts `node` at the current cursor position into the editor,
	 * or replaces the current cursor selection with the new element.
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
		this.domNode.dispatchEvent(new Event("input"))
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
	 * Sets up keyboard commands for the editor, so that you can toggle headings, bold, italics using keyboard shortcuts.
	 */
	#setupKeyboardCommands() {
		// Instantiate all key command classes with `this` as the reference to the editor
		const keyCommands = keyCommandClasses.map(keyCommand => new keyCommand(this))

		this.domNode.addEventListener("keydown", (event) => {
			const isKeyCommand = keyCommands.some(keyCommand => keyCommand.is(event))
			if (!isKeyCommand) {
				return
			}
			event.preventDefault();
		})

		this.domNode.addEventListener("keyup", (event) => {
			const keyCommand = keyCommands.find(keyCommand => keyCommand.is(event))
			if (keyCommand === undefined) {
				return
			}
			keyCommand.action(event)
		})
	}
}

