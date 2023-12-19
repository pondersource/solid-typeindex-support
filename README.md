# solid-typeindex-support

See [Docs](https://pondersource.github.io/solid-typeindex-support/)

## Development

```bash
git clone https://github.com/pondersource/solid-typeindex-support
npm install
npm run test
```

## Dependencies:
`@inrupt/solid-client`: This module provides methods for interacting with the Solid Pod.
`@inrupt/vocab-common-rdf`: This module provides methods for working with RDF data.
`@rdfjs/data-model`: This module provides methods for working with RDF data.


## Usage

```bash
mpm install solid-typeindex-support
```

```typescript
import { TypeIndexHelper } from "solid-typeindex-support";
```

```typescript
const webId = "https://fake-pod.net/profile/card#me";
const indexUrl = "https://fake-pod.net/settings/privateTypeIndex.ttl";
const isPrivate = true;

const registeries: string[] = await TypeIndexHelper.getFromTypeIndex(webId, session.fetch, isPrivate);

const result: SolidDataset = await TypeIndexHelper.registerInTypeIndex(webId, session.fetch, indexUrl, isPrivate);
```