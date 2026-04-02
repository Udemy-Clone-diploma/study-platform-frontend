# Study Platform — Frontend

Клієнтська частина навчальної платформи на Next.js 16, React 19 та TypeScript.

## Технології

- [Next.js 16](https://nextjs.org/) — App Router
- [React 19](https://react.dev/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)

## Вимоги

- Node.js 20+
- npm

## Встановлення

### 1. Клонування репозиторію

```bash
git clone https://github.com/YOUR_ORG/study-platform-frontend.git
cd study-platform-frontend
```

### 2. Встановлення залежностей

```bash
npm install
```

### 3. Налаштування змінних середовища

```bash
cp .env.local.example .env.local
```

Вкажіть URL бекенд API у `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 4. Запуск у режимі розробки

```bash
npm run dev
```

Застосунок доступний за адресою: `http://localhost:3000`

## Команди

```bash
npm run dev    # Сервер розробки
npm run build  # Збірка для продакшену
npm run start  # Запуск продакшен-збірки
npm run lint   # Перевірка коду (ESLint)
```

## Структура проєкту

```
src/
└── app/          # App Router — усі маршрути тут
    ├── layout.tsx
    ├── page.tsx
    └── globals.css
```
