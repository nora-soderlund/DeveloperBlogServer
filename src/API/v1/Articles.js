import Server from "../../Server.js";
import Database from "../../Database.js";

Server.register("GET", "/api/v1/articles", async (request, response) => {
    let query = `
        SELECT articles.slug, (article_tags.tag = 1) AS featured FROM articles
            INNER JOIN article_tags ON article_tags.article = articles.id
        WHERE hidden != 1
        GROUP BY articles.slug
        ORDER BY
            featured DESC, timestamp DESC
    `;

    const tagsParams = request.server.url.searchParams.get("tags");

    if(tagsParams) {
        query = `
            SELECT articles.slug, (article_tags.tag = 1) AS featured FROM articles
                INNER JOIN tags ON (${tagsParams.split(',').map((tag) => `tags.slug = ${Database.escape(tag)}`).join(" OR ")})
                INNER JOIN article_tags ON tag = tags.id
            WHERE articles.id = article_tags.article
            ORDER BY featured DESC, articles.timestamp DESC
        `;
    }

    const rows = await Database.queryAsync(query);

    return rows.map((row) => {
        return row.slug;
    });
});
