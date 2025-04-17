# backend/Dockerfile

FROM node:20 AS development

WORKDIR /usr/src/app

# Először másold a függőségi fájlokat és telepítsd őket
# Ez kihasználja a Docker build cache-t
COPY package*.json ./
RUN npm install

# Másold a többi forráskódot
COPY . .

# NestJS alapértelmezett portja
EXPOSE 3000

# Indítsd el az alkalmazást fejlesztői módban (hot-reload)
CMD ["npm", "run", "start:dev"]

# --- Production Stage (ha később kell) ---
# FROM node:20-alpine AS production
# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}
# WORKDIR /usr/src/app
# COPY package*.json ./
# RUN npm install --only=production
# COPY --from=development /usr/src/app/dist ./dist
# CMD ["node", "dist/main"]