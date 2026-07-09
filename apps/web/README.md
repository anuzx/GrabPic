
## Getting Started

1. Clone or open the repository folder.
2. Install the workspace dependencies:
   ```bash
   bun install # or: npx pnpm install
   ```

### 1. Start Development Server
Running at `http://localhost:5174`:
```bash
bun run dev # or: npx pnpm --filter @workspace/grabpic run dev
```

### 2. Run TypeScript Typechecking
```bash
bun run typecheck # or: npx pnpm run typecheck
```

### 3. Build for Production
```bash
PORT=5174 bun run build # or: PORT=5174 npx pnpm run build
```
The compiled output -----------> `grabpic/dist/public`.
