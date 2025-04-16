# My TypeScript Library

A TypeScript library designed to work in both Node.js and browser environments.

## Installation

```bash
npm install my-ts-lib
# or
yarn add my-ts-lib
```

## Usage

### In Node.js

```typescript
import { someFunction } from 'my-ts-lib';

someFunction();
```

### In Browser

```html
<script type="module">
  import { someFunction } from 'my-ts-lib';
  
  someFunction();
</script>
```

Or using UMD build:

```html
<script src="./node_modules/my-ts-lib/dist/my-ts-lib.umd.cjs"></script>
<script>
  MyTsLib.someFunction();
</script>
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/my-ts-lib.git
cd my-ts-lib

# Install dependencies
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

## License

MIT