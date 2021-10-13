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
- Express: to handle request.

If you feel you need more packages, just install node and npm in your host.
