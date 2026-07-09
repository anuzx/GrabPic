
## Getting Started

1. Clone or open the repository folder.
2. Install the workspace dependencies:
   ```bash
   bun install
   ```

### 1. Start Development Server
Running at `http://localhost:5174`:
```bash
bun run dev
```

### 2. Run TypeScript Typechecking
```bash
bun run typecheck
```

### 3. Build for Production
```bash
PORT=5174 bun run build
```
The compiled output -----------> `dist/public`.
