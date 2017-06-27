The server is built on node. It uses PostgreSQL. So you have to install that before using the server. The script to write the db is in this file named server.sql. You should also peruse services/admin, as that has an example editorial data endpoint, from which the server can cron for news. The authorization bearer is missing though, so it would be faster to contact the author or to put another site into it to start it.
1. To start, open the console in this folder (/server)
2. install npm configurations with: npm i
3. start the server with: npm start

swagger: http://localhost:3000/api/v1/swagger/