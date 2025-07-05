# Generates OpenAPI schema from the most recent version of the Telegram API
FROM ghcr.io/sysbot-org/tgscraper:latest AS tgscraper

RUN php /app/vendor/bin/tgscraper app:export-schema --openapi /out/openapi.json


# Generates the TypeScript client from the OpenAPI schema
FROM node:23-alpine AS node

VOLUME /results

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY eslint.config.mjs tsconfig.json .editorconfig .prettierrc ./
COPY src ./src

COPY --from=tgscraper /out/openapi.json /app/schema/openapi.json

RUN npm start

RUN mkdir /results && cp -r /app/schema/openapi.json /app/output/ /results/
