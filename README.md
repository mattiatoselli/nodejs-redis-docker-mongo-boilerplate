# A simple NodeJs Dockerized development environment
A boilerplate for your nodejs app. Comes with a built in docker configuration, and a basic yet secure and light jwt authentication system.

## Installation Requirements
- Docker and Docker Compose. https://docs.docker.com/
- NodeJs & npm (if you need to install other packages in your app).

## Installation
Pull the repo, and launch the build.
```bash
git clone https://github.com/mattiatoselli/nodejs-redis-docker-mongo-boilerplate.git app
cd app
docker-compose up
```

## Packages
- Joi: for data validation.
- Cors: to enable CORS requests.
- Mongodb: Node driver for Mongo.
- Express: to handle requests faster.
- Redis: Redis driver for Node.

If you feel you need more packages, just install node and npm in your host.

## Configuration
Copy the .envexamplefile in .env and change the configurations.
```bash
scp .envexample .env
```

Change the token secret and the db name, if you want to use the mongo container, just maintain the string as it is. 
If you want to use other mongo providers just change it with the correct one.
