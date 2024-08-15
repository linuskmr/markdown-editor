/**
 * Converts an HTML {Node} tree to a markdown string.
 * 
 * @example
 * const nodeTree = document.querySelector(".nodeTree")
 * const markdownExporter = MarkdownExporter(nodeTree)
 * const markdown = markdownExporter.export()
 */
class MarkdownExporter {
	/**
	 * Handle to the HTML {Node}
	 */
	domNode

	/**
	 * @param {Node} domNode Handle to the node tree to be converted to markdown.
	 */
	constructor(domNode) {
		if (!(domNode instanceof Node)) { // Don't remove the brackets! https://stackoverflow.com/a/15359468/14350146
			throw new Error("Invalid DOM node")
		}
		this.domNode = domNode
	}

	/**
	 * Recursively converts `this.domNode` to markdown.
	 * @returns {string} Markdown
	 */
	export() {
		return this.#node(this.domNode)
	}

	/**
	 * Converts an `Node` to markdown by invoking the corresponding function based on its tag name.
	 * @param {Node} node
	 * @param {int} listIndentDepth
	 * @returns {string} Markdown
	 */
	#node(node, listIndentDepth = 0) {
		if (node instanceof Text) {
			return node.textContent
		}

		switch (node.tagName.toLowerCase()) {
			case "h1":
			case "h2":
			case "h3":
			case "h4":
			case "h5":
				return this.#heading(node)
			case "div":
			case "p":
				return this.#childNodes(node) + "\n\n"
			case "ul":
			case "ol":
				return this.#list(node, listIndentDepth)
			case "a":
				return this.#link(node)
			case "b":
			case "strong":
				return this.#surroundWithMarker(node, "**")
			case "i":
				return this.#surroundWithMarker(node, "_")
			case "br":
				return "\n\n"
			case "italic":
			default:
				throw new Error(`Unknown tag '${node.tagName}' with content '${node.textContent}'`)
		}
	}

	/**
	 * Converts a heading (i.e. `h1` - `h6`) to markdown.
	 * @param {Node} headingNode
	 * @returns {string} Markdown
	 */
	#heading(headingNode) {
		const headingLevel = Number.parseInt(headingNode.tagName.substring(1))
		return "#".repeat(headingLevel) + " " + this.#childNodes(headingNode) + "\n\n"
	}

	/**
	 * Converts an ordered or unordered list (`ol` or `ul`) to markdown.
	 * @param {Node} listNode
	 * @param {int} indentDepth
	 * @returns {string} Markdown
	 */
	#list(listNode, indentDepth) {
		let listEntries = Array.from(listNode.childNodes)

		const listEntryNotEmpty = node => node.textContent.trim() !== ""
		listEntries = listEntries.filter(listEntryNotEmpty)

		listEntries = listEntries.map((listEntryNode, listIndex) => {
			if (listEntryNode.tagName !== "LI") {
				// Likely an indented sublist
				return this.#node(listEntryNode, indentDepth + 1)
			}

			switch (listNode.tagName) {
				case "UL":
					return this.unorderedListEntry(listEntryNode, indentDepth)
				case "OL":
					return this.orderedListEntry(listEntryNode, indentDepth, listIndex)
				default:
					throw new Error(`Unknown tag name '${listEntryNode.tagName}' in list '${listNode.textContent}'`)
			}
		})
		
		let md = listEntries.join('')
		if (indentDepth == 0) {
			md += "\n"
		}
		return md
	}

	/**
	 * Converts an unordered list entry (i.e. `li`) to markdown.
	 * @param {Node} listEntryNode
	 * @param {int} indentDepth
	 * @returns {string} Markdown
	 */
	unorderedListEntry(listEntryNode, indentDepth) {
		const indent = '\t'.repeat(indentDepth)
		const liMarker = "- "
		return indent + liMarker + this.#childNodes(listEntryNode, indentDepth + 1) + '\n'
	}

	/**
	 * Converts an ordered list entry (i.e. `li`) to markdown.
	 * @param {Node} listEntryNode
	 * @param {int} indentDepth
	 * @param {int} listIndex
	 * @returns {string} Markdown
	 */
	orderedListEntry(listEntryNode, indentDepth, listIndex) {
		const indent = '\t'.repeat(indentDepth)
		const liMarker = `${listIndex + 1}. `
		return indent + liMarker + this.#childNodes(listEntryNode, indentDepth + 1) + '\n'
	}

	/**
	 * Converts a link (i.e. `a`) to markdown.
	 * @param {Node} linkNode
	 * @returns {string} Markdown
	 */
	#link(linkNode) {
		const text = this.#childNodes(linkNode)
		const href = linkNode.href
		return '[' + text + ']' + '(' + href + ')'
	}

	/**
	 * Adds `marker` before and after the `node`.
	 * @param {Node} node 
	 * @param {string} marker E.g. `_` for italic or `**` for bold.
	 * @returns {string} Markdown
	 */
	#surroundWithMarker(node, marker) {
		return marker + this.#childNodes(node) + marker
	}

	/**
	 * Converts all children of `node` to markdown.
	 * @param {Node} node
	 * @param {int} listIndentDepth
	 * @returns {string} Markdown
	 */
	#childNodes(node, listIndentDepth = 0) {
		const children = Array.from(node.childNodes)
		return children.map(node => this.#node(node, listIndentDepth)).join('')
	}
}