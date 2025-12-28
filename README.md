# TasksCatt – Project Management System (Mini Jira/Trello)

> Monorepo setup with **NestJS (Backend)** + **Next.js (Frontend)** using **pnpm Workspaces** & **Turborepo**

---

## 📋 Mục lục

- [Kiến trúc tổng thể](#kiến-trúc-tổng-thể)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt & Khởi chạy](#cài-đặt--khởi-chạy)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Shared Package Convention](#shared-package-convention)
- [Backend Convention (NestJS)](#backend-convention-nestjs)
- [Frontend Convention (Next.js)](#frontend-convention-nextjs)
- [Naming Convention](#naming-convention)
- [API & DTO Flow](#api--dto-flow)
- [Quản lý Package với pnpm](#quản-lý-package-với-pnpm)
- [Testing & Build](#testing--build)
- [Docker & Deployment](#docker--deployment)
- [Git Workflow](#git-workflow)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Kiến trúc tổng thể

Dự án được tổ chức theo mô hình **Monorepo**, bao gồm:

| Thành phần | Công nghệ | Mô tả |
|------------|-----------|-------|
| **Backend** | NestJS | API, Worker |
| **Frontend** | Next.js | Web App |
| **Database** | PostgreSQL | Prisma ORM |
| **Real-time** | Socket.io | WebSocket |
| **Shared** | TypeScript | DTOs, Types, Utils |

Việc quản lý dependency, build và chạy song song được thực hiện bằng **pnpm** và **Turborepo**.

---

## 💻 Yêu cầu hệ thống

| Tool | Phiên bản |
|------|-----------|
| Node.js | >= 20 (Khuyến nghị: 24.12.0) |
| pnpm | >= 10 (Khuyến nghị: 10.26.2) |
| Docker & Docker Compose | Dùng cho Production |

**Cài đặt pnpm (nếu chưa có):**

```bash
npm install -g pnpm
```

---

## 🚀 Cài đặt & Khởi chạy

### 1. Cài đặt dependencies

Chạy lệnh sau **tại thư mục gốc của monorepo**:

```bash
pnpm install
```

### 2. Cấu hình môi trường

- Copy file `.env.example` thành `.env`
- Chỉnh các biến kết nối Database

### 3. Chạy môi trường Development

```bash
pnpm dev
```

**Truy cập dịch vụ:**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:1005 |
| Backend API | http://localhost:5001 |

---

## 📁 Cấu trúc dự án

```text
taskscatt/
│
├── apps/
│   ├── frontend/              # Next.js
│   └── backend/               # NestJS
│
├── packages/
│   └── shared/                # Code dùng chung FE & BE
│       ├── src/
│       │   ├── entities/
│       │   ├── dtos/
│       │   ├── enums/
│       │   ├── constants/
│       │   └── index.ts
│       └── package.json
│
├── docs/
│   ├── conventions.md
│   ├── architecture.md
│   └── api-contract.md
│
├── tsconfig.base.json
├── .editorconfig
├── .prettierrc
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 📦 Shared Package Convention

### Nguyên tắc

✅ **Chỉ chứa pure TypeScript** - Không import framework-specific code

**Có thể dùng được cho:**
- Next.js
- NestJS
- Worker / CLI (sau này)

**Không được dùng:**
- `@nestjs/*`
- `typeorm`, `sequelize`
- React / JSX / TSX

### Cấu trúc chi tiết

```text
packages/shared/src/
├── entities/
│   └── user.entity.ts
│
├── dtos/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── user-response.dto.ts
│
├── enums/
│   └── user-role.enum.ts
│
├── constants/
│   └── pagination.ts
│
└── index.ts
```

### Quy ước Entity

```ts
// entities/user.entity.ts
export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
};
```

> Entity chỉ mô tả **business shape**, không có decorator DB/UI

### Khi nào được phép tách entity riêng?

Chỉ khi:
- FE cần computed field
- BE có internal field
- Security / Performance

**Giải pháp:**
- FE: extend shared entity
- BE: response DTO riêng

---

## ⚙️ Backend Convention (NestJS)

### Cấu trúc module

```text
src/
├── modules/
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   └── auth/
├── entities/
│   └── user.orm-entity.ts      # ORM entity (Prisma)
│
├── mappers/
│   └── user.mapper.ts          # Map ORM ↔ Shared Entity
│
└── dtos/
    └── index.ts                # Re-export từ shared
```

### Mapping Pattern (BẮT BUỘC)

```ts
// user.mapper.ts
import { User } from '@shared/entities/user.entity';
import { UserOrmEntity } from '../entities/user.orm-entity';

export function toDomain(entity: UserOrmEntity): User {
  return {
    id: entity.id,
    email: entity.email,
    fullName: entity.fullName,
    role: entity.role,
    isActive: entity.isActive,
  };
}
```

> Controller & Service **chỉ làm việc với shared entity / DTO**

---

## 🎨 Frontend Convention (Next.js)

### Feature-based Structure

```text
src/
├── app/
├── features/
│   └── users/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       │   └── userService.ts
│       └── utils/
│
├── shared/
│   ├── ui/
│   └── hooks/
└── styles/
```

### Sử dụng shared entity

```ts
import type { User } from '@shared/entities/user.entity';
```

> ⚠️ Không định nghĩa lại entity trong FE

---

## 📝 Naming Convention

### File & Folder

| Loại | Quy ước | Ví dụ |
|------|---------|-------|
| Folder | kebab-case | `user-profile` |
| TS file | kebab-case | `user.service.ts` |
| Entity | camelCase | `user.entity.ts` |
| DTO | kebab-case | `create-user.dto.ts` |
| Enum | kebab-case | `user-role.enum.ts` |

### Code

| Thành phần | Quy ước |
|------------|---------|
| Variable | camelCase |
| Constant | UPPER_SNAKE_CASE |
| Function | camelCase |
| Class | PascalCase |
| React Component | PascalCase |
| Hook | useXxx |

---

## 🔄 API & DTO Flow

```text
Next.js (Client)
   ↓
Shared DTO (Zod)
   ↓
NestJS Controller
   ↓
Service
   ↓
Mapper
   ↓
ORM Entity (PostgreSQL)
```

> - FE không biết DB
> - BE không expose ORM entity

---

## 📦 Quản lý Package với pnpm

> ⚠️ **Lưu ý quan trọng:** Trong Monorepo **không dùng `npm install` hoặc `pnpm add` trực tiếp**. Luôn dùng `pnpm` kèm theo cờ `--filter`.

### Cài đặt thư viện

| Mục tiêu | Lệnh mẫu | Ví dụ |
|----------|----------|-------|
| Backend | `pnpm add <lib> --filter backend` | `pnpm add @prisma/client --filter backend` |
| Frontend | `pnpm add <lib> --filter frontend` | `pnpm add axios --filter frontend` |
| Shared | `pnpm add <lib> --filter @packages/shared` | `pnpm add zod --filter @packages/shared` |
| Root (Dev tools) | `pnpm add -D <lib>` | `pnpm add -D turbo typescript` |

> Tên sau `--filter` là **`name` trong `package.json`**, **không phải đường dẫn thư mục**.

### Link package nội bộ

```bash
pnpm add @packages/shared --filter backend --workspace
```

---

## 🧪 Testing & Build

### Unit Test

```bash
# Test toàn bộ monorepo
pnpm turbo test

# Test riêng cho Backend
pnpm test --filter backend
```

### Build Production

```bash
pnpm build
```

**Output:**
- Backend → `dist/`
- Frontend → `.next/`

---

## 🐳 Docker & Deployment

Dự án hỗ trợ Docker hóa tối ưu bằng **Turbo Prune** (chỉ đóng gói dependency cần thiết, giảm size image).

### Chạy toàn bộ hệ thống

```bash
docker-compose up -d --build
```

### Các lệnh Docker khác

```bash
# Xem log backend
docker logs -f taskscatt-backend

# Tắt toàn bộ container
docker-compose down
```

---

## 🌿 Git Workflow

### Tooling bắt buộc

- ESLint (shared config)
- Prettier
- EditorConfig
- Husky + lint-staged
- Commitlint

### Các nhánh chính

| Nhánh | Mô tả |
|-------|-------|
| `main` | Mã nguồn ổn định, đã kiểm thử |
| `develop` | Nhánh phát triển chính |
| `staging` | Kiểm thử trước production |
| `feature/*` | Phát triển tính năng mới |
| `bugfix/*` | Sửa lỗi trong quá trình phát triển |
| `hotfix/*` | Sửa lỗi khẩn cấp trên production |
| `release/*` | Chuẩn bị bản phát hành |

### Cách đặt tên nhánh

```
<loại>/<mô-tả-ngắn>-<issueID>
```

**Ví dụ:**
- `feature/add-login-api-123`
- `bugfix/fix-cart-total-456`
- `hotfix/fix-payment-error-789`

### Commit Message Convention

Tuân theo chuẩn [Conventional Commits](https://www.conventionalcommits.org/):

```
<loại>: <mô tả ngắn> (#<issueID>)
```

| Loại | Ý nghĩa |
|------|---------|
| `feat` | Thêm tính năng mới |
| `fix` | Sửa lỗi |
| `docs` | Thay đổi về tài liệu |
| `style` | Thay đổi format, không ảnh hưởng logic |
| `refactor` | Cải thiện code mà không thay đổi tính năng |
| `perf` | Cải thiện hiệu năng |
| `test` | Thêm hoặc sửa test |
| `chore` | Công việc không ảnh hưởng code (CI/CD, build,...) |

**Ví dụ:**

```bash
git commit -m "feat: thêm chức năng đăng nhập (#123)"
```

### Quy trình làm việc

```bash
# 1. Tạo nhánh mới từ develop
git checkout develop
git pull origin develop
git checkout -b feature/add-login-api-123

# 2. Commit theo convention
git commit -m "feat: thêm chức năng đăng nhập (#123)"

# 3. Push lên remote
git push origin feature/add-login-api-123

# 4. Tạo Pull Request về develop
# 5. Sau khi được duyệt, merge và xóa nhánh cũ
# 6. Khi release: develop → staging → main
```

---

## 🔧 Troubleshooting

Nếu gặp các lỗi như:
- Cache cũ không cập nhật
- Code thay đổi nhưng dev không reload
- Lỗi lạ từ Turbo hoặc pnpm

**Xoá cache & thư mục build:**

```bash
# Git Bash / Linux / macOS
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf apps/*/dist
rm -rf apps/*/.next
rm -rf packages/*/dist

# Cài đặt lại và chạy lại
pnpm install
pnpm dev
```

> ⚠️ Luôn chạy lệnh pnpm **tại thư mục gốc monorepo** để tránh lỗi workspace.

---

## 📄 License

MIT © TasksCatt Team
