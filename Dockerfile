# Utiliser une image Node officielle
FROM node:20

# Créer un dossier de travail
WORKDIR /app

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le reste du code
COPY . .

# Exposer le port
EXPOSE 5000

# Lancer l'app
CMD ["npm", "start"]
