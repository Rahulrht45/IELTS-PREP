import React from 'react';

/**
 * SmartText component
 * 1. Parses HTML content safely.
 * 2. Identifies words in text nodes.
 * 3. Wraps words in interactive spans for vocab lookup.
 * 4. Preserves HTML structure and styles.
 */
const SmartText = ({ text, onLookup }) => {
    if (!text) return null;

    // Helper to process text content and wrap words
    const wrapWords = (textContent, nodeIndex) => {
        if (!textContent) return null;

        // Split by gap pattern first: ____1____
        // We use a regex that captures the delimiter so it's included in the result array
        const parts = textContent.split(/(____\d+____)/g);

        return parts.map((part, partIndex) => {
            // Check if this part is a gap placeholder
            const gapMatch = part.match(/^____(\d+)____$/);
            if (gapMatch) {
                const number = gapMatch[1];
                return (
                    <span key={`${nodeIndex}-gap-${partIndex}`} className="gap-widget">
                        <span className="gap-badge">{number}</span>
                        <input type="text" className="gap-input" readOnly disabled />
                    </span>
                );
            }

            // Normal text processing for non-gap parts
            // Split by whitespace but keep the whitespace tokens
            const tokens = part.split(/(\s+)/);

            return tokens.map((token, i) => {
                if (/\s+/.test(token)) {
                    return <span key={`${nodeIndex}-${partIndex}-${i}`}>{token}</span>;
                }

                // Improved regex to handle:
                // - Leading/trailing non-alpha (punctuation, brackets)
                // - Internal apostrophes (don't, it's)
                // - Internal hyphens (state-of-the-art)
                const match = token.match(/^([^a-zA-Z]*)([a-zA-Z]+(?:[''-][a-zA-Z]+)*)([^a-zA-Z]*)$/);

                if (match) {
                    const [_, pre, word, post] = match;
                    return (
                        <span key={`${nodeIndex}-${partIndex}-${i}`}>
                            {pre}
                            <span
                                className="live-word"
                                onClick={(e) => onLookup(word, e)}
                            >
                                {word}
                            </span>
                            {post}
                        </span>
                    );
                }

                // Fallback for tokens that don't match
                return <span key={`${nodeIndex}-${partIndex}-${i}`}>{token}</span>;
            });
        });
    };

    // Recursive function to convert DOM nodes to React elements
    const renderNode = (node, index) => {
        // Text Node
        if (node.nodeType === 3) {
            return wrapWords(node.textContent, index);
        }

        // Element Node
        if (node.nodeType === 1) {
            const tagName = node.tagName.toLowerCase();

            // Skip script and style tags for safety
            if (tagName === 'script' || tagName === 'style') return null;

            const children = Array.from(node.childNodes).map((child, i) =>
                renderNode(child, `${index}-${i}`)
            );

            // Convert attributes
            const props = { key: index };
            Array.from(node.attributes).forEach(attr => {
                const name = attr.name === 'class' ? 'className' : attr.name;

                // Special mapping for style string to object
                if (name === 'style') {
                    const styleObj = {};
                    attr.value.split(';').forEach(pair => {
                        const [key, value] = pair.split(':').map(s => s.trim());
                        if (key && value) {
                            // camelCase the style property (e.g. background-color -> backgroundColor)
                            const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
                            styleObj[camelKey] = value;
                        }
                    });
                    props.style = styleObj;
                } else {
                    props[name] = attr.value;
                }
            });

            return React.createElement(tagName, props, children);
        }

        return null;
    };

    // Parse the HTML string
    // We wrap it in a div to ensure we have a root if multiple nodes are provided
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${text}</div>`, 'text/html');
    const root = doc.body.firstChild;

    return (
        <>
            {Array.from(root.childNodes).map((node, i) => renderNode(node, i))}
        </>
    );
};

export default SmartText;
