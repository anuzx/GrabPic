
## Getting Started

```bash

npm install -g pnpm
```
1. Clone or open the repository folder.
2. Install the workspace dependencies:
   ```bash
   pnpm install
   ```

### 1. Start Development Server
running at `http://localhost:5174`:
```bash
pnpm --filter @workspace/grabpic run dev
```

### 2. Run TypeScript Typechecking
```bash
pnpm run typecheck
```

### 3. Build for Production
```bash
PORT=5174 pnpm run build
```
The compiled output -----------> `artifacts/grabpic/dist/public`.
