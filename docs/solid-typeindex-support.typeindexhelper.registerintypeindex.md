<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@rezasoltani/solid-typeindex-support](./solid-typeindex-support.md) &gt; [TypeIndexHelper](./solid-typeindex-support.typeindexhelper.md) &gt; [registerInTypeIndex](./solid-typeindex-support.typeindexhelper.registerintypeindex.md)

## TypeIndexHelper.registerInTypeIndex() method

Registers a typeRegistration in the user's typeIndexe.

**Signature:**

```typescript
static registerInTypeIndex(webId: string, typeRegistrationTitle: string, rdfClass: string, fetch: any, registeryUrl: string, isContainer: boolean, isPrivate: boolean): Promise<SolidDataset>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  webId | string | The WebID of the user |
|  typeRegistrationTitle | string | The title to use for the typeRegistration inside the typeIndex, |
|  rdfClass | string | The RDF class that this registration is for, as a Valid URL |
|  fetch | any | The authenticated fetch function |
|  registeryUrl | string | The URL of the solid:instance or solid:instanceContainer being registered |
|  isContainer | boolean | Whether to register a solid:instanceContainer or a solid:instance |
|  isPrivate | boolean | Whether to register in the private or public typeIndexe |

**Returns:**

Promise&lt;SolidDataset&gt;

A Promise resolving to the updated typeIndexe dataset

