# SOUQDZ.COM — Boutique en ligne (Node.js + Express + SQLite)

Site e-commerce complet avec vraie base de données : catalogue de produits, panier,
commandes en paiement à la livraison, comptes clients, et espace admin pour tout gérer.

## 🚀 Installation

Prérequis : **Node.js 22 ou plus récent** (le projet utilise le module `node:sqlite`,
disponible nativement dans Node — aucune compilation, aucune base externe à installer).

```bash
npm install
npm start
```

Le site est alors disponible sur : **http://localhost:3000**

Une base de données SQLite est créée automatiquement dans `data/souqdz.db` au premier
démarrage, avec 12 produits de démonstration et un compte admin.

## 🔑 Comptes

- **Admin** : `admin@souqdz.com` / `admin123`
  → Tableau de bord : http://localhost:3000/admin/login.html
  ⚠️ Changez ce mot de passe avant toute mise en ligne réelle (voir plus bas).
- **Client** : créez un compte via http://localhost:3000/register.html

## 🗂️ Structure du projet

```
souqdz-app/
├── server.js              → serveur Express principal
├── db.js                  → schéma SQLite + données de démonstration
├── middleware/auth.js     → authentification par JWT (cookie httpOnly)
├── routes/
│   ├── auth.js            → inscription / connexion / profil
│   ├── products.js        → catalogue public + gestion admin (CRUD)
│   ├── orders.js          → création de commande + suivi + gestion admin
│   └── stats.js           → statistiques du tableau de bord admin
├── public/                → site (HTML/CSS/JS, servi tel quel)
│   ├── index.html          → page d'accueil / catalogue
│   ├── product.html        → fiche produit
│   ├── checkout.html       → tunnel de commande (paiement à la livraison)
│   ├── login.html / register.html / account.html
│   └── admin/
│       ├── login.html
│       └── dashboard.html  → gestion produits + commandes + stats
└── data/souqdz.db          → base de données (créée automatiquement)
```

## ✏️ Fonctionnalités

- Catalogue filtrable par catégorie + recherche
- Panier persistant (navigateur), calcul du total recalculé côté serveur à la commande
- Commande sans obligation de compte (checkout invité), paiement à la livraison
- Comptes clients avec historique des commandes
- Espace admin protégé :
  - Ajouter / modifier / supprimer des produits
  - Voir toutes les commandes et changer leur statut (en attente → confirmée → expédiée → livrée / annulée)
  - Statistiques (chiffre d'affaires, nombre de commandes, produits, etc.)

## 🖼️ À propos des images

Depuis le tableau de bord admin, vous pouvez maintenant **uploader vos propres photos**
directement depuis votre ordinateur (JPG, PNG, WEBP, GIF, 6 Mo max) lors de l'ajout ou de
la modification d'un produit. Les photos sont stockées dans `public/uploads/` et servies
automatiquement par le site.

Les produits de démonstration (créés au premier démarrage) utilisent encore des photos
génériques (picsum.photos) tant que vous ne les modifiez pas avec une vraie photo.

## 🌍 Mettre le site en ligne (hébergement)

Ce projet fonctionne tel quel sur n'importe quel hébergeur Node.js :
- **Render.com / Railway.app** (gratuit pour démarrer, très simple : connectez votre repo Git)
- **VPS classique** (OVH, Hostinger, etc.) avec Node.js installé + un reverse proxy (nginx)

Avant la mise en ligne réelle, pensez à :
1. Changer le mot de passe admin (ou le recréer via SQL directement dans `data/souqdz.db`)
2. Définir vos propres secrets : variables d'environnement `JWT_SECRET` et `PORT`
3. Mettre en place un vrai système de paiement si besoin (CIB/EDAHABIA via un prestataire
   agréé) — actuellement seul le paiement à la livraison est géré
4. Sauvegarder régulièrement le fichier `data/souqdz.db`

## 🛠️ Support technique

Le module `node:sqlite` est encore marqué "expérimental" par Node.js (un simple message
d'avertissement s'affiche au démarrage, sans impact sur le fonctionnement). Si vous
préférez une base de données plus classique (PostgreSQL, MySQL) pour un projet à plus
grande échelle, la structure des routes est prête à être adaptée.
