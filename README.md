# bignovatest-backend

Urdocto Backend

Backend pour l’application mobile patient Urdocto, développé avec Express.js, Prisma, et PostgreSQL.

Installation
git clone https://github.com/moncef2009/bignovatest-backend.git
cd bignovatest-backend
npm install

Créer un fichier .env avec :

DATABASE_URL=postgresql://user:password@localhost:5432/urdocto
JWT_SECRET=ton_secret
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
PORT=5000

Démarrer le serveur :

npm run dev

Seeding
node prisma/seed.js

Crée un utilisateur test : mohamed.bensalem@example.com / password123

Crée 5 médecins avec spécialités et informations complètes

Routes principales

Auth :

POST /api/auth/register → Inscription

POST /api/auth/login → Connexion

POST /api/auth/refresh-token → Rafraîchissement tokens

POST /api/auth/logout → Déconnexion

GET /api/auth/profile → Profil utilisateur (auth requis)

Médecins :

GET /api/doctors → Liste des médecins (filtres specialty & search)

GET /api/doctors/specialties → Liste des spécialités

Middleware

auth.js → protège les routes et ajoute req.user

errorHandler.js → gestion globale des erreurs

Technologies

Node.js, Express.js, Prisma, PostgreSQL

bcryptjs, JWT, CORS
