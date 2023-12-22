// import inruptSOLIDClient, { Thing } from '@inrupt/solid-client';
// import { TypeIndexHelper } from '../../src/utils/TypeIndexHelper'; // Replace with the actual import statement for your API class
// import { Session } from "@inrupt/solid-client-authn-browser";
// import { readFileSync } from 'fs';
// import { namedNode } from '@rdfjs/data-model';
import inruptSOLIDClient, { Thing } from '@inrupt/solid-client';
import { readFileSync } from 'fs';
import { namedNode } from '@rdfjs/data-model';
import { TypeIndexHelper } from '../../src/TypeIndexHelper'; // Replace 'your-module' with the actual module name
import { __forClass, __privateTypeIndex, __publicTypeIndex, __solid_instance, __solid_instance_container } from '../../src/constants';
import { BOOKMARK } from '@inrupt/vocab-common-rdf';


export function loadFixture<T = string>(name: string): T {
    const raw = readFileSync(`${__dirname}/fixtures/${name}`).toString();

    return /\.json(ld)$/.test(name) ? JSON.parse(raw) : raw;
}

let publicTypeIndexPath = "https://fake-pod.net/settings/publicTypeIndex.ttl";
let privateTypeIndexPath = "https://fake-pod.net/settings/privateTypeIndex.ttl";
let emptyTypeIndexPath = "https://fake-pod.net/settings/emptyTypeIndex.ttl";
let indexUrl = "https://fake-pod.net/module/index.ttl";
let session: jest.Mocked<any>;


// beforeAll(() => console.log('1 - beforeAll'));

// afterAll(() => console.log('1 - afterAll'));

beforeEach(() => {
    session = {
        fetch: jest.fn(),
        info: {
            webId: "https://fake-pod.net/profile/card#me",
            isLoggedIn: true,
            sessionId: "123",
            clientAppId: "https://clientAppId.com",
            expirationDate: new Date().getDate() + 1000000000,
        },
        logout: jest.fn(),
        login: jest.fn(),
    } as unknown as jest.Mocked<any>;
});

afterEach(() => { jest.restoreAllMocks() });

describe('getMeProfile', () => {

    it('Should return meProfile', async () => {
        // Arrange
        const mock_Fetch = jest.spyOn(session, "fetch").mockResolvedValue(fetchResponse("profile.ttl"));

        const mockGetThing = jest.spyOn(inruptSOLIDClient, 'getThing').mockResolvedValue(loadFixture("me.json"));

        // Act
        const result = await TypeIndexHelper.getMeProfile(session.info.webId, session.fetch);

        // Assert
        expect(result).toEqual(loadFixture("me.json"));

        // Tear down
        mock_Fetch.mockRestore();
        mockGetThing.mockRestore();
    })
});


describe("getTypeIndex", () => {

    it("should return the typeIndex if it already exists in the profileMe object", async () => {
        // Arrange
        jest.spyOn(session, "fetch").mockReturnValue(Promise.resolve(fetchResponse("profile.ttl")));
        jest.spyOn(inruptSOLIDClient, 'getThing').mockResolvedValue(loadFixture("me.json"));
        jest.spyOn(inruptSOLIDClient, 'getNamedNode').mockResolvedValue(namedNode(privateTypeIndexPath) as never);

        // Act
        const result = await TypeIndexHelper.getTypeIndex(session.info.webId, session.fetch, true);

        // Assert
        expect(result).toEqual(namedNode(privateTypeIndexPath));
    })
    it("should create a typeIndex if it doesn't exist in the profileMe object", async () => {
        // Arrange
        jest.spyOn(session, "fetch").mockResolvedValue(fetchResponse("profile.ttl"));
        jest.spyOn(inruptSOLIDClient, 'getThing').mockResolvedValue(loadFixture("me.json"));
        jest.spyOn(inruptSOLIDClient, 'getNamedNode').mockReturnValue(null);
        jest.spyOn(inruptSOLIDClient, 'addNamedNode').mockResolvedValue(loadFixture("me.json"));
        jest.spyOn(inruptSOLIDClient, 'setThing').mockResolvedValue(loadFixture("profileDS.json"));
        jest.spyOn(inruptSOLIDClient, 'saveSolidDatasetAt').mockResolvedValue(loadFixture("profileDS.json"));

        // Act
        const result = await TypeIndexHelper.getTypeIndex(session.info.webId, session.fetch, true);

        // Assert
        expect(session.fetch).toHaveBeenCalledWith(privateTypeIndexPath, {
            method: 'PUT',
            headers: {
                'Content-Type': 'text/turtle',
            },
            body: `@prefix solid: <http://www.w3.org/ns/solid/terms#>.\n\n<> a solid:TypeIndex, solid:UnlistedDocument.`,
        });

        expect(result).toEqual(namedNode(privateTypeIndexPath));
    })
    // Add more test cases as needed
});

describe('getFromTypeIndex', () => {
    // afterEach(() => {
    //     jest.restoreAllMocks();
    // });
    it('should return an empty array if typeIndex is null', async () => {
        const isPrivate = true;

        jest.spyOn(TypeIndexHelper, 'getTypeIndex').mockResolvedValueOnce(namedNode(emptyTypeIndexPath));
        jest.spyOn(session, "fetch").mockReturnValue(Promise.resolve(fetchResponse("emptyTypeIndex.ttl")));

        const result = await TypeIndexHelper.getFromTypeIndex(session.info.webId, BOOKMARK.Bookmark, session.fetch, isPrivate);

        expect(result).toEqual([]);
    });
    it('should return an array of instances', async () => {
        const isPrivate = true;

        jest.spyOn(TypeIndexHelper, 'getTypeIndex').mockResolvedValueOnce(namedNode(privateTypeIndexPath));
        jest.spyOn(session, "fetch").mockReturnValue(Promise.resolve(fetchResponse("privateTypeIndex.ttl")));

        const result = await TypeIndexHelper.getFromTypeIndex(session.info.webId, BOOKMARK.Bookmark, session.fetch, isPrivate);

        expect(result.length).toBeGreaterThan(0);
    });

});

describe("registerInTypeIndex", () => {
    // afterEach(() => {
    //     jest.restoreAllMocks();
    // });
    test('Register in typeIndex - Private typeIndex', async () => {
        const isPrivate = true;

        jest.spyOn(TypeIndexHelper, 'getTypeIndex').mockResolvedValueOnce(namedNode(privateTypeIndexPath));
        jest.spyOn(inruptSOLIDClient, "getSolidDataset").mockResolvedValue(loadFixture("privateTypeIndexDS.json"));
        jest.spyOn(inruptSOLIDClient, 'setThing').mockReturnValueOnce(loadFixture("privateTypeIndexDS.json"));
        jest.spyOn(inruptSOLIDClient, 'saveSolidDatasetAt').mockResolvedValueOnce(loadFixture("privateTypeIndexDS.json"));

        const res = await TypeIndexHelper.registerInTypeIndex(session.info.webId, "bookmarks", BOOKMARK.bookmarks, session.fetch, indexUrl, isPrivate);

        expect(res).toEqual(loadFixture("privateTypeIndexDS.json"));
        expect(TypeIndexHelper.getTypeIndex).toHaveBeenCalledWith(session.info.webId, session.fetch, isPrivate);
        expect(inruptSOLIDClient.getSolidDataset).toHaveBeenCalledWith(privateTypeIndexPath, { fetch: session.fetch });
        expect(inruptSOLIDClient.setThing).toHaveBeenCalled();
        expect(inruptSOLIDClient.saveSolidDatasetAt).toHaveBeenCalledWith(privateTypeIndexPath, loadFixture("privateTypeIndexDS.json"), { fetch: session.fetch });
    });

    test('Register in typeIndex - Public typeIndex', async () => {
        const isPrivate = false;

        jest.spyOn(TypeIndexHelper, 'getTypeIndex').mockResolvedValueOnce(namedNode(privateTypeIndexPath));
        jest.spyOn(inruptSOLIDClient, "getSolidDataset").mockResolvedValue(loadFixture("publicTypeIndexDS.json"));
        jest.spyOn(inruptSOLIDClient, 'setThing').mockReturnValueOnce(loadFixture("publicTypeIndexDS.json"));
        jest.spyOn(inruptSOLIDClient, 'saveSolidDatasetAt').mockResolvedValueOnce(loadFixture("publicTypeIndexDS.json"));

        const res = await TypeIndexHelper.registerInTypeIndex(session.info.webId, "bookmarks", BOOKMARK.bookmarks, session.fetch, indexUrl, isPrivate);

        expect(res).toEqual(loadFixture("publicTypeIndexDS.json"));
        expect(TypeIndexHelper.getTypeIndex).toHaveBeenCalledWith(session.info.webId, session.fetch, isPrivate);
        expect(inruptSOLIDClient.getSolidDataset).toHaveBeenCalledWith(privateTypeIndexPath, { fetch: session.fetch });
        expect(inruptSOLIDClient.setThing).toHaveBeenCalled();
        expect(inruptSOLIDClient.saveSolidDatasetAt).toHaveBeenCalledWith(privateTypeIndexPath, loadFixture("publicTypeIndexDS.json"), { fetch: session.fetch });
    });
})

describe('createTypeIndex', () => {

    it('Should create a typeIndex and return the solidDataset', async () => {

        jest.spyOn(inruptSOLIDClient, "getSolidDataset").mockResolvedValue(loadFixture("privateTypeIndex.ttl"));

        const res = await TypeIndexHelper.createTypeIndex(session.fetch, privateTypeIndexPath);

        expect(session.fetch).toHaveBeenCalledWith(privateTypeIndexPath, {
            method: 'PUT',
            headers: {
                'Content-Type': 'text/turtle',
            },
            body: `@prefix solid: <http://www.w3.org/ns/solid/terms#>.\n\n<> a solid:TypeIndex, solid:UnlistedDocument.`,
        });

        expect(inruptSOLIDClient.getSolidDataset).toHaveBeenCalledWith(privateTypeIndexPath, { fetch: session.fetch });
        expect(res).toBeDefined();
    });


    it("should Create type index", async () => {
        const fetch = jest.fn();

        await TypeIndexHelper.createTypeIndex(fetch, privateTypeIndexPath);

        expect(fetch).toHaveBeenCalledWith(privateTypeIndexPath, {
            method: "PUT",
            headers: {
                "Content-Type": "text/turtle",
            },
            body: `@prefix solid: <http://www.w3.org/ns/solid/terms#>.\n\n<> a solid:TypeIndex, solid:UnlistedDocument.`,
        });
    });

    it('should return undefined if an error occurs', async () => {
        const fetchMock = jest.fn(() => { throw new Error('Some error'); });

        const result = await TypeIndexHelper.createTypeIndex(fetchMock, privateTypeIndexPath);

        expect(result).toBeUndefined();
    });
})

describe("getTypeIndexPredicate", () => {
    it("returns __privateTypeIndex if isPrivate is true", () => {
        const isPrivate = true;
        const result = TypeIndexHelper.getTypeIndexPredicate(isPrivate);
        console.log("🚀 ~ file: TypeIndexHelper.test.ts:223 ~ it ~ result:", result)
        expect(result).toBe(__privateTypeIndex);
    });

    it("returns __publicTypeIndex if isPrivate is false", () => {
        const isPrivate = false;
        const result = TypeIndexHelper.getTypeIndexPredicate(isPrivate);
        expect(result).toBe(__publicTypeIndex);
    });
});


describe("getDefaultTypeIndexURL", () => {
    it("should return the correct URL when given a valid webId and ", () => {
        const webId = "https://example.com/profile/user123";
        const expectedURL = "https://example.com/settings/privateTypeIndex.ttl";

        const result = TypeIndexHelper.getDefaultTypeIndexURL(webId, true);

        expect(result).toEqual(expectedURL);
    });

    it("should return the correct URL when given a webId with a trailing slash and typeIndexFileName", () => {
        const webId = "https://example.com/profile/user123/";
        const expectedURL = "https://example.com/settings/privateTypeIndex.ttl";

        const result = TypeIndexHelper.getDefaultTypeIndexURL(webId, true);

        expect(result).toEqual(expectedURL);
    });
});

const fetchResponse = (fileName: string): Promise<Response> => {
    return Promise.resolve({
        status: 200,
        ok: true,
        headers: {
            get: (h: string) => (h == "Content-Type" ? "text/turtle" : undefined)
        },
        text: () => {
            return Promise.resolve(loadFixture(fileName));
        }
    }) as any;
}
