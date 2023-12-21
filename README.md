# solid-typeindex-support

See [Docs](https://pondersource.github.io/solid-typeindex-support/)

## Development

```bash
git clone https://github.com/pondersource/solid-typeindex-support
npm install
npm run test
```

## Dependencies:
- `@inrupt/solid-client`: This module provides methods for interacting with the Solid Pod.
- `@inrupt/vocab-common-rdf`: This module provides methods for working with RDF data.
- `@rdfjs/data-model`: This module provides methods for working with RDF data.


## Usage
```bash
mpm install @rezasoltani/solid-typeindex-support
```

```typescript
import { TypeIndexHelper } from '@rezasoltani/solid-typeindex-support';

const webId = 'https://example.com/profile#me';
const solidInstanceUrl = 'https://example.com/type-index.ttl';
const rdfClass = "http://schema.org/Book";

const instances = await TypeIndexHelper.getFromTypeIndex(webId, rdfClass, fetch, true);

const updatedIndex = await TypeIndexHelper.registerInTypeIndex(webId, 'My Book List', rdfClass, fetch, solidInstanceUrl, true);

```

## Classes

|  Class | Description |
|  --- | --- |
|  TypeIndexHelper | TypeIndexHelper provides helper methods for working with typeIndexes in Solid. This includes methods for getting and updating a user's public and private typeIndexes. |


## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  getFromTypeIndex(webId, rdfClass, fetch, isPrivate) | <code>static</code> | Retrieves all instances of the given RDF class from the user's typeIndexe. |
|  registerInTypeIndex(webId, typeRegistrationTitle, rdfClass, fetch, solidInstanceUrl, isPrivate) | <code>static</code> | Registers a type registration in the user's typeIndexe. |




## TypeIndexHelper.getFromTypeIndex() method

Retrieves all instances of the given RDF class from the user's typeIndexe.

**Signature:**

```typescript
static getFromTypeIndex(webId: string, rdfClass: string, fetch: any, isPrivate: true): Promise<string[]>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  webId | string | The user's WebID |
|  rdfClass | string | The RDF class to retrieve instances for |
|  fetch | any | Authenticated fetch function |
|  isPrivate | true | Whether the typeIndexe is private or public |

**Returns:**

Promise&lt;string\[\]&gt;



## TypeIndexHelper.registerInTypeIndex() method

Registers a type registration in the user's typeIndexe.

**Signature:**

```typescript
static registerInTypeIndex(webId: string, typeRegistrationTitle: string, rdfClass: string, fetch: any, solidInstanceUrl: string, isPrivate: boolean): Promise<SolidDataset>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  webId | string | The WebID of the user |
|  typeRegistrationTitle | string | The title to use for the type registration |
|  rdfClass | string | The RDF class that this registration is for |
|  fetch | any | The authenticated fetch function |
|  solidInstanceUrl | string | The URL of the index being registered |
|  isPrivate | boolean | Whether to register in the private or public typeIndexe |

**Returns:**

Promise&lt;SolidDataset&gt;

A Promise resolving to the updated typeIndexe dataset