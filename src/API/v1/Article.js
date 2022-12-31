import Server from "../../Server.js";
import Database from "../../Database.js";

import shiki from "shiki";

let highlighter = null;

shiki.getHighlighter({ theme: "github-dark" }).then((_highlighter) => {
    highlighter = _highlighter;
});

Server.register("META", "/articles/(.*)", async (request, response, matches) => {
    const slug = matches[1];

    const article = await Database.querySingleAsync(`SELECT title, description, timestamp FROM articles WHERE slug = ${Database.escape(slug)}`);

    if(!article)
        return null;

    return {
        type: "article",

        title: article.title,
        description: article.description,
        type_published_time: new Date(article.timestamp).toISOString()
    };
});

Server.register("GET", "/api/v1/article", async (request, response) => {
    const compact = request.server.url.searchParams.get("compact");
    const slug = request.server.url.searchParams.get("slug");

    const article = await Database.querySingleAsync(`SELECT id, slug, title, short, content, timestamp FROM articles WHERE slug = ${Database.escape(slug)}`);

    if(!article)
        return null;

    const articleTags = await Database.queryAsync(`SELECT tag FROM article_tags WHERE article = ${Database.escape(article.id)}`);

    let tags = [];

    if(articleTags.length)
        tags = await Database.queryAsync(`SELECT slug, text, icon, shimmer, color FROM tags WHERE (${articleTags.map((articleTag) => `id = ${Database.escape(articleTag.tag)}`).join(" OR ")})`);

    let content = article.content;

    const matches = Array.from(article.content.matchAll(/\{CODE (\d+)\}/g));

    if(matches.length) {
        const codes = await Database.queryAsync(`SELECT id, language, code FROM codes WHERE (${matches.map((match) => `id = ${Database.escape(match[1])}`).join(" OR ")})`);

        codes.forEach((code) => {
            const html = highlighter.codeToHtml(code.code, { lang: code.language });

            content = content.replaceAll(`{CODE ${code.id}}`, `<div class="article-code">${html}</div>`);
        });
    }

    let feedback = null;

    if(!compact) {
        const user = request.socket.remoteAddress;

        feedback = await Database.querySingleAsync(`SELECT positive FROM article_feedback WHERE article = ${Database.escape(article.id)} AND user = ${Database.escape(user)}`);
    }

    return {
        slug: article.slug,

        title: article.title,
        short: article.short,
        content,
        feedback,

        timestamp: article.timestamp,

        tags: tags.map((tag) => {
            return {
                slug: tag.slug,
                text: tag.text,
                icon: tag.icon,
                shimmer: tag.shimmer,
                color: tag.color
            };
        })
    };
});
