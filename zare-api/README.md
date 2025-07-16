# 🛠️ Zareshop API Setup Guide

## 📦 Environment Variables

Create a `.env` file in the root of the `zareshop-api` directory with the following content:

```env
DATABASE_URL=postgresql://postgres:postgrespassword@postgres:5432/zareshopdb


## 🐳 Docker Compose – Build & Start Services

To build and start all services (API, Postgres, Redis, RabbitMQ, Elasticsearch), use:

```bash
docker-compose up -d --build --force-recreate

## 🧠 PostgreSQL – Access, Inspect & Migrate

### 🔗 Access the Postgres Container

To open a Postgres shell and interact with your `zareshopdb` database:

```bash
docker exec -it zare-postgres psql -U postgres -d zareshopdb


🔄 Migrate Prisma Schema (Force Reset)
To push new Prisma models and refresh your database:

bash
docker exec -it zare-api sh -c "npx prisma db push --force-reset"
⚠️ This will erase all current data and apply the updated Prisma schema.


````markdown
# 🧠 Prisma Migrations & Database Setup

## 🔗 Access the Postgres Container

```bash
docker exec -it zare-postgres psql -U postgres -d zareshopdb
````

## ❌ Reset Database (Optional)

Use this if you want to drop all tables and start clean:

```bash
npx prisma migrate reset
```

This will:

* Drop the database
* Recreate it
* Reapply all migrations
* Prompt to run any seed script

---

## 📥 Create Initial Migration

If no migration exists yet:

```bash
npx prisma migrate dev --name init
```

This will:

* Create a new folder in `prisma/migrations`
* Apply the schema to your DB
* Generate the Prisma Client

---

## 🚀 Deploy Migrations (CI/CD or production)

Use this in environments where migrations shouldn't be created interactively:

```bash
npx prisma migrate deploy
```

---

## 💥 Force Sync Without Migrations (Destructive)

This applies your schema directly to the DB and **drops all existing data**:

```bash
npx prisma db push --force-reset
```

Or via Docker:

```bash
docker exec -it zare-api sh -c "npx prisma db push --force-reset"
```

---

## ✅ Check Tables in Postgres

Inside the Postgres shell:

```sql
\dt
```

---

## 📦 Generate Prisma Client (if not auto-generated)

```bash
npx prisma generate
```

```

For installation of new node modules or remove 
docker-compose down
docker compose build --no-cache
docker compose up
