import Server from "../../Server.js";
import Database from "../../Database.js";

const limit = 10;

Server.register("GET", "/api/v1/articles", async (request, response) => {
    const start = Math.max(0, parseInt(request.server.url.searchParams.get("start")));

    let query = `
        SELECT articles.id, articles.slug, (article_tags.tag = 1) AS featured FROM articles
            INNER JOIN article_tags ON article_tags.article = articles.id
        WHERE hidden != 1 ${(start != 0)?(`AND articles.id < ${start}`):("")}
        GROUP BY articles.slug
        ORDER BY
            featured DESC, timestamp DESC
        LIMIT ${limit}
    `;

    const tagsParams = request.server.url.searchParams.get("tags");

    if(tagsParams) {
        query = `
            SELECT articles.id, articles.slug, (article_tags.tag = 1) AS featured FROM articles
                INNER JOIN tags ON (${tagsParams.split(',').map((tag) => `tags.slug = ${Database.escape(tag)}`).join(" OR ")})
                INNER JOIN article_tags ON tag = tags.id
            WHERE articles.id = article_tags.article ${(start != 0)?(`AND articles.id < ${start}`):("")}
            ORDER BY featured DESC, articles.timestamp DESC
            LIMIT ${limit}
        `;
    }

    const rows = await Database.queryAsync(query);

    if(!rows.length) {
        return {
            articles: [],
            paginatable: false
        }
    }

    return {
        paginatable: rows.length == limit,

        articles: rows.map((row) => {
            return row.slug;
        }),

        end: rows.sort((a, b) => b.id - a.id)[0].id
    };
});
