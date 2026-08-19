import React from "react";

/**
 * Inline markers, matched in one pass so the first one to open wins.
 *
 * <p>The same set WhatsApp uses, because that is what the squad already types out of habit - people
 * were writing *bold* long before it rendered as anything. Deliberately not full Markdown: headings
 * and lists in a chat bubble read as noise, and a stray underscore in a file name should not
 * silently italicise half a sentence, so every marker has to close on the same line.
 */
const TOKEN_PATTERN =
    /(https?:\/\/[^\s]+)|\*([^*\n]+)\*|_([^_\n]+)_|~([^~\n]+)~|`([^`\n]+)`/g;

/**
 * A message body as React nodes.
 *
 * <p>Built as elements rather than an HTML string: a chat body is the one place in the app where a
 * player types content other players will see rendered, so there is no innerHTML anywhere in this
 * path for someone to write a tag into. Links match only http(s), which rules out `javascript:`.
 *
 * <p>Markers do not nest - *bold with _italic_ inside* renders bold, with the underscores showing.
 * Supporting it would mean a real parser, for something nobody types in a team chat.
 */
export function renderMessageBody(text: string): React.ReactNode {
    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Reset because the regex is module-level and stateful with the /g flag; without this, every
    // second call would resume from wherever the previous message finished.
    TOKEN_PATTERN.lastIndex = 0;

    while ((match = TOKEN_PATTERN.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        const [full, link, bold, italic, strike, code] = match;
        if (link) {
            nodes.push(
                <a href={link} target="_blank" rel="noreferrer noopener">
                    {link}
                </a>
            );
        } else if (bold) {
            nodes.push(<strong>{bold}</strong>);
        } else if (italic) {
            nodes.push(<em>{italic}</em>);
        } else if (strike) {
            nodes.push(<s>{strike}</s>);
        } else if (code) {
            nodes.push(<code className="team-chat__code">{code}</code>);
        }

        lastIndex = match.index + full.length;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    // Keyed by position, which is stable: the nodes are derived from a message body that never
    // changes once sent.
    return nodes.map((node, index) => (
        <React.Fragment key={index}>{node}</React.Fragment>
    ));
}
