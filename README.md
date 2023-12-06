# solid-typeindex-support

## Development

```bash
git clone https://github.com/pondersource/solid-typeindex-support
npm install
npm run test
```

`TypeIndexHelper` This class provides methods for working with Solid Type Index, which is a way of storing and retrieving information about the types of data a user has in their personal online data store (POD).

## Methods: 
The `TypeIndexHelper` class has several methods, such as:
- `getMeProfile`: This method returns the user’s profile document from their WebID.
- `getTypeIndex`: This method returns the user’s typeIndex document URL as a `namedNode` from their profile document.
- `getFromTypeIndex`: This method returns an array of URLs that match a given type from the user’s typeIndex document.
- `registerInTypeIndex`: This method adds a new entry to the user’s typeIndex document for a given type and URL.
- `createTypeIndex`: This method creates a new typeIndex document for the user if they don’t have one.
- `getTypeIndexFileName`: This function returns the file name of the typeIndex document, which is settings.ttl.
- `getTypeIndexPredicate`: This function returns the predicate that links the user’s profile document to their typeIndex document.
- `getTypeIndexURL`: This function returns the full URL of the user’s typeIndex document by appending the file name to their POD root URL.

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