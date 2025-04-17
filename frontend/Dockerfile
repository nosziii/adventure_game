# frontend/Dockerfile

FROM node:20-alpine

WORKDIR /app

# Függőségek telepítése cache kihasználásával
COPY package*.json ./
RUN npm install

# Forráskód másolása
COPY . .

# Vite alapértelmezett portja [FRONTEND_PORT a .env-ből]
# Az EXPOSE csak dokumentációs célú a compose-ban
EXPOSE 5173

# Indítsd a Vite fejlesztői szervert, hogy kívülről is elérhető legyen
# A --host kapcsoló fontos a Docker konténeren belüli futtatáshoz
CMD ["npm", "run", "dev", "--", "--host"]

# --- Production Stage (ha később kell) ---
# Építsd a statikus fájlokat
# RUN npm run build
# Második stage egy Nginx szerverrel a statikus fájlok kiszolgálására
# FROM nginx:stable-alpine
# COPY --from=0 /app/dist /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]