# My TypeScript Library

emiTS is a typesafe event emitter library aiming to work on both node and browser environments

## Installation

TBA...

## Usage

### In Node.js

```typescript
import Emitter from 'emits'

interface Events {
  'event': { message: string };
}

const emitter = new Emitter<Events>()

emitter.on('event', (payload) => {
  console.log(payload)
})

await emitter.emit('event', { message: 'Hello World!' })
```
## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/abdullahcanakci/emiTS.git
cd emiTS

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