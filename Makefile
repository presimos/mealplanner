.PHONY: install dev backend frontend db-reset clean

install: ## Установить зависимости
	cd backend && npm install
	cd frontend && npm install

dev: ## Запустить проект
	cd backend && npm run dev &
	cd frontend && npm run dev

backend: ## Только бэкенд
	cd backend && npm run dev

frontend: ## Только фронтенд
	cd frontend && npm run dev

db-reset: ## Сбросить базу
	rm -f backend/database.sqlite*

clean: ## Очистить
	rm -rf backend/node_modules frontend/node_modules frontend/dist