# Developer Blog Server
An API endpoint for the [Developer Blog](https://github.com/nora-soderlund/DeveloperBlog) repository.

## Get started
1. Clone the repository
    ```bat
    git clone https://github.com/nora-soderlund/DeveloperBlogServer
    ```
2. Install the packages.
    ```bat
    npm install
    ```
3. Import database.sql to a MySQL server.
4. Set up a config.json file in the root directory:
    ```json
    {
        "port": 80,

        "cors": {},

        "database": {
            "host": "localhost",
            "user": "root",
            "password": "password",
            "database": "developer_blog"
        }
    }
    ```
    The cors property accepts any [HTTP response header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers) property.
5. Start the project
    - Run in development environment:
        1. Run the start script:
            ```bat
            npm run dev
            ```
    - Build static files for production
        1. Build [Developer Blog](https://github.com/nora-soderlund/DeveloperBlog) in production mode.
        2. Copy the static files to a "build" folder in the server root directory.
        3. Run the start script:
            ```bat
            npm run start
            ```
            
