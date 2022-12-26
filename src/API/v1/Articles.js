import Server from "../../Server.js";
import Database from "../../Database.js";

Server.register("GET", "/api/v1/articles", async (request, response) => {
    let query = "SELECT slug FROM articles WHERE hidden != 1 ORDER BY timestamp DESC";

    const tagsParams = request.server.url.searchParams.get("tags");

    if(tagsParams) {
        query = `
            SELECT articles.slug FROM articles
                INNER JOIN tags ON (${tagsParams.split(',').map((tag) => `tags.slug = ${Database.escape(tag)}`).join(" OR ")})
                INNER JOIN article_tags ON tag = tags.id
            WHERE articles.id = article_tags.article
            ORDER BY articles.timestamp DESC
        `;

        console.log(query);
    }

    const rows = await Database.queryAsync(query);

    return rows.map((row) => {
        return row.slug;
    });
});
