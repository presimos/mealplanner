.PHONY: install dev backend frontend db-reset clean

check:
	@node --version | grep -q "v20" && echo "✅ Node.js v20 OK" || echo "❌ Нужен Node.js v20! Выполните: nvm use 20"

install: check
	cd backend && npm install
	cd frontend && npm install

dev: check
	cd backend && npm run dev &
	cd frontend && npm run dev

backend:
	cd backend && npm run dev

frontend:
	cd frontend && npm run dev

db-reset:
	rm -f backend/database.sqlite*

clean:
	rm -rf backend/node_modules frontend/node_modules frontend/dist