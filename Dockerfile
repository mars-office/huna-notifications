FROM node:alpine
WORKDIR /app
COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json
RUN npm i
COPY . .
ARG DEPLOYABLE_VERSION
RUN echo "export const VERSION = '${DEPLOYABLE_VERSION}'" > ./src/version.ts
RUN npm run build
ARG TARGETPLATFORM
RUN [ "$TARGETPLATFORM" = "linux/amd64" ] && npm run test || echo "Skipping tests on ARM64"
CMD npm run prod

EXPOSE 3003
LABEL org.opencontainers.image.source=https://github.com/mars-office/huna-notifications
