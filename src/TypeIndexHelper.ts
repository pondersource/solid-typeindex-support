import {
    SolidDataset,
    ThingPersisted,
    addNamedNode,
    buildThing,
    createThing,
    getNamedNode,
    getSolidDataset,
    getThing,
    getThingAll,
    saveSolidDatasetAt,
    setThing
} from "@inrupt/solid-client";
import {
    BOOKMARK, RDF,
} from "@inrupt/vocab-common-rdf";
import { namedNode } from '@rdfjs/data-model';
import { __Bookmark, __foafPerson, __forClass, __privateTypeIndex, __publicTypeIndex, __schemaPerson, __solidTypeRegistration, __solid_instance, __solid_instance_container } from "./constants";
import { NamedNode } from '@rdfjs/types'

export class TypeIndexHelper {

    /**
     * Retrieves the profile of the logged-in user.
     *
     * @param {string} webId - The WebID of the user.
     * @param {any} fetch - The authenticated fetch function to use for HTTP requests.
     * @return {Promise<ThingPersisted | null>} - The user profile or null if not found.
     * @internal
     */
    public static async getMeProfile(webId: string, fetch: any): Promise<ThingPersisted | null> {

        const profileDS = await getSolidDataset(webId, { fetch: fetch });

        let profileMe = getThing(profileDS, webId);

        if (!profileMe) {
            const profileMeThing = buildThing(createThing({ name: "me" }))
                .addUrl(RDF.type, __foafPerson)
                .addUrl(RDF.type, __schemaPerson)
                .build();

            const updatedProfile = setThing(profileDS, profileMeThing);

            const updatedProfileDS = await saveSolidDatasetAt(webId!, updatedProfile, { fetch: fetch });

            profileMe = getThing(updatedProfileDS, webId);

        }

        return profileMe;
    }

    /**
     * Retrieves the typeIndex for a given webId.
     *
     * @param {string} webId - The WebID of the user.
     * @param {any} fetch - The authenticated fetch function to use for HTTP requests.
     * @param {boolean} isPrivate - Indicates whether the typeIndex is private or not.
     * @return {Promise<NamedNode<string>>} A Promise that resolves with the typeIndex.
     * @internal
     */
    public static async getTypeIndex(webId: string, fetch: any, isPrivate: boolean): Promise<NamedNode<string>> {
        const profileMe = await this.getMeProfile(webId, fetch)
        console.log("🚀 ~ file: TypeIndexHelper.ts:55 ~ TypeIndexHelper ~ getTypeIndex ~ profileMe:", profileMe)

        const typeIndexPredicate = TypeIndexHelper.getTypeIndexPredicate(isPrivate);
        const typeIndexFileName = TypeIndexHelper.getTypeIndexFileName(isPrivate);
        const typeIndexUrl = TypeIndexHelper.getTypeIndexURL(webId, typeIndexFileName);

        if (profileMe) {
            let typeIndex = getNamedNode(profileMe, typeIndexPredicate)

            if (typeIndex) return typeIndex;

            const typeIndexDS = await this.createTypeIndex(fetch, typeIndexUrl);

            const updatedProfileMe = addNamedNode(profileMe, typeIndexPredicate, namedNode(typeIndexUrl));

            const updatedTypeIndexDS = setThing(typeIndexDS!, updatedProfileMe);

            await saveSolidDatasetAt(typeIndexUrl, updatedTypeIndexDS, { fetch: fetch });

            return namedNode(typeIndexUrl)
        } else {
            const typeIndexDS = await this.createTypeIndex(fetch, typeIndexUrl);
            const profileDS = await getSolidDataset(webId, { fetch: fetch });

            const profileMeThing = buildThing(createThing({ name: "me" }))
                .addNamedNode(typeIndexPredicate, namedNode(typeIndexUrl))
                .addUrl(RDF.type, __foafPerson)
                .addUrl(RDF.type, __schemaPerson)
                .build();

            const updatedProfileDS = setThing(profileDS, profileMeThing);

            await saveSolidDatasetAt(webId, updatedProfileDS, { fetch: fetch });

            return namedNode(typeIndexUrl)
        }
    }

    /**
     * Retrieves a list of instances from the typeIndex.
     *
     * @param {string} webId - The WebID of the user.
     * @param {any} fetch - The authenticated fetch function to use for HTTP requests.
     * @param {true} isPrivate - Indicates if the instances are private.
     * @return {Promise<string[]>} - A promise that resolves to an array of instance URLs.
     */
    public static async getFromTypeIndex(webId: string, fetch: any, isPrivate: true): Promise<string[]> {
        const typeIndex = await this.getTypeIndex(webId, fetch, isPrivate);

        const typeIndexDS = await getSolidDataset(typeIndex?.value, { fetch: fetch });

        const allRegisteries = getThingAll(typeIndexDS);

        const instances: string[] = []
        const instanceContainers: string[] = []


        allRegisteries.forEach(registery => {
            const forClass = getNamedNode(registery, __forClass)

            if (forClass?.value === BOOKMARK.Bookmark) {

                const instance = getNamedNode(registery, __solid_instance)?.value
                const instanceContainer = getNamedNode(registery, __solid_instance_container)?.value

                instance && instances?.push(instance)
                instanceContainer && instanceContainers?.push(instanceContainer)
            }
        })

        const instanceContainersPromises = instanceContainers.map(async (instanceContainer) => {

            const instanceContainerDS = await getSolidDataset(instanceContainer, { fetch: fetch })

            const all = getThingAll(instanceContainerDS); // all files under the instanceContainer

            const urls = all.map(x => x.url) // all file urls

            return urls.filter(url => url !== instanceContainer) // remove the instanceContainer itself, only file urls needed;
        })

        const innerInstances = (await Promise.all([...instanceContainersPromises])).flat();

        return [...new Set([...instances, ...innerInstances])]
    }

    /**
     * Registers the given webId in the typeIndex.
     *
     * @param {string} webId - The WebID of the user.
     * @param {any} fetch - The authenticated fetch function to use for HTTP requests.
     * @param {string} indexUrl - The URL of the typeIndex.
     * @param {boolean} isPrivate - Flag indicating if the typeIndex is private.
     * @return {Promise<SolidDataset>} The updated typeIndex dataset.
     */
    public static async registerInTypeIndex(webId: string, fetch: any, indexUrl: string, isPrivate: boolean): Promise<SolidDataset> {
        const typeIndex = await this.getTypeIndex(webId, fetch, isPrivate);

        const typeIndexDS = await getSolidDataset(typeIndex?.value, { fetch: fetch });

        const bookmarksRegistery = buildThing(createThing({ name: "bookmarks_registery" }))
            .addNamedNode(__forClass, namedNode(__Bookmark))
            .addNamedNode(__solid_instance, namedNode(indexUrl))
            .addUrl(RDF.type, __solidTypeRegistration)
            .build();

        const updatedTypeIndexDS = setThing(typeIndexDS, bookmarksRegistery);

        return await saveSolidDatasetAt(typeIndex?.value, updatedTypeIndexDS, { fetch: fetch });
    }

    /**
     * Creates a typeIndex using the provided fetch function and typeIndex URL.
     *
     * @param {any} fetch - The authenticated fetch function to use for HTTP requests.
     * @param {string} typeIndexUrl - The URL of the typeIndex.
     * @return {Promise<SolidDataset | undefined>} A promise that resolves to the created typeIndex SolidDataset, or undefined if there was an error.
     * @internal
     */
    public static async createTypeIndex(fetch: any, typeIndexUrl: string): Promise<SolidDataset | undefined> {
        try {
            await fetch(typeIndexUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "text/turtle",
                },
                body: `@prefix solid: <http://www.w3.org/ns/solid/terms#>.\n\n<> a solid:TypeIndex, solid:UnlistedDocument.`
            })

            return await getSolidDataset(typeIndexUrl, { fetch: fetch })
        } catch (error) {

        }
    }

    /**
     * Returns the name of the typeIndex file based on the given isPrivate flag.
     *
     * @param {boolean} isPrivate - Indicates whether the typeIndex file is private or public.
     * @return {"privateTypeIndex" | "publicTypeIndex"} - The name of the typeIndex file.
     * @internal
     */
    public static getTypeIndexFileName(isPrivate: boolean): "privateTypeIndex" | "publicTypeIndex" {
        return isPrivate ? "privateTypeIndex" : "publicTypeIndex";
    }

    /**
     * Returns the typeIndex predicate based on the given isPrivate flag.
     *
     * @param {boolean} isPrivate - A flag indicating whether the typeIndex should be private.
     * @return {string} The typeIndex predicate.
     * @internal
     */
    public static getTypeIndexPredicate(isPrivate: boolean): string {
        return isPrivate ? __privateTypeIndex : __publicTypeIndex;
    }

    /**
     * Returns the URL for the typeIndex file based on the given webId and typeIndexFileName.
     *
     * @param {string} webId - The webId used to construct the URL.
     * @param {string} typeIndexFileName - The name of the typeIndex file.
     * @return {string} The URL for the typeIndex file.
     * @internal
     */
    public static getTypeIndexURL(webId: string, typeIndexFileName: string): string {
        return `${webId.split("/profile")[0]}/settings/${typeIndexFileName}.ttl`;
    }
}