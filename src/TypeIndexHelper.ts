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
    RDF,
} from "@inrupt/vocab-common-rdf";
import { namedNode } from '@rdfjs/data-model';
import { __foafPerson, __forClass, __privateTypeIndex, __publicTypeIndex, __schemaPerson, __solidTypeRegistration, __solid_instance, __solid_instance_container } from "./constants";
import { NamedNode } from '@rdfjs/types'

/**
 * TypeIndexHelper provides helper methods for working with typeIndexes in Solid.
 * This includes methods for getting and updating a user's public and private
 * typeIndexes.
 * @public
 */
export class TypeIndexHelper {

    /**
     * Retrieves the profile for the given WebID.
     * If no profile exists, creates a default profile.
     *
     * @param webId - The WebID URL to retrieve the profile for
     * @param fetch - The authenticated fetch function
     * @returns The profile Thing for the given WebID, or null if not found
     */
    public static async getMeProfile(
        webId: string,
        fetch: any
    ): Promise<ThingPersisted | null> {
        const profileDS = await getSolidDataset(webId, { fetch: fetch });

        let profileMe = getThing(profileDS, webId);

        if (!profileMe) {
            const profileMeThing = buildThing(createThing({ name: "me" }))
                .addUrl(RDF.type, __foafPerson)
                .addUrl(RDF.type, __schemaPerson)
                .build();

            const updatedProfile = setThing(profileDS, profileMeThing);

            const updatedProfileDS = await saveSolidDatasetAt(
                webId!,
                updatedProfile,
                { fetch: fetch }
            );

            profileMe = getThing(updatedProfileDS, webId);
        }

        return profileMe;
    }

    /**
     * Retrieves the typeIndexe for the given WebID, creating one if it does not exist.
     *
     * @param webId - The WebID of the user
     * @param fetch - The authenticated fetch function to use for requests
     * @param isPrivate - Whether to get the private or public typeIndexe
     * @returns A NamedNode containing the typeIndexe URL
     */
    public static async getTypeIndex(
        webId: string,
        fetch: any,
        isPrivate: boolean
    ): Promise<NamedNode<string>> {
        const profileMe = await this.getMeProfile(webId, fetch);

        const typeIndexPredicate = TypeIndexHelper.getTypeIndexPredicate(isPrivate);
        const typeIndexFileName = TypeIndexHelper.getTypeIndexFileName(isPrivate);
        const typeIndexUrl = TypeIndexHelper.getTypeIndexURL(
            webId,
            typeIndexFileName
        );

        if (profileMe) {
            let typeIndex = getNamedNode(profileMe, typeIndexPredicate);

            if (typeIndex) return typeIndex;

            const typeIndexDS = await this.createTypeIndex(fetch, typeIndexUrl);

            const updatedProfileMe = addNamedNode(
                profileMe,
                typeIndexPredicate,
                namedNode(typeIndexUrl)
            );

            const updatedTypeIndexDS = setThing(typeIndexDS!, updatedProfileMe);

            await saveSolidDatasetAt(typeIndexUrl, updatedTypeIndexDS, {
                fetch: fetch,
            });

            return namedNode(typeIndexUrl);
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

            return namedNode(typeIndexUrl);
        }
    }

    /**
     * Retrieves all instances of the given RDF class from the user's typeIndexe.
     *
     * @param webId - The user's WebID
     * @param rdfClass - The RDF class to retrieve instances for
     * @param fetch - Authenticated fetch function
     * @param isPrivate - Whether the typeIndexe is private or public
     * @returns Promise resolving to an array of instance URLs
     */
    public static async getFromTypeIndex(webId: string, rdfClass: string, fetch: any, isPrivate: true): Promise<string[]> {
        const typeIndex = await this.getTypeIndex(webId, fetch, isPrivate);

        const typeIndexDS = await getSolidDataset(typeIndex?.value, { fetch: fetch });

        const allRegisteries = getThingAll(typeIndexDS);

        const instances: string[] = []
        const instanceContainers: string[] = []


        allRegisteries.forEach(registery => {
            const forClass = getNamedNode(registery, __forClass)

            if (forClass?.value === rdfClass) {

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
     * Registers a type registration in the user's typeIndexe.
     *
     * @param webId - The WebID of the user
     * @param typeRegistrationTitle - The title to use for the type registration
     * @param rdfClass - The RDF class that this registration is for
     * @param fetch - The authenticated fetch function
     * @param indexUrl - The URL of the index being registered
     * @param isPrivate - Whether to register in the private or public typeIndexe
     * @returns A Promise resolving to the updated typeIndexe dataset
     */
    public static async registerInTypeIndex(
        webId: string,
        typeRegistrationTitle: string,
        rdfClass: string,
        fetch: any,
        indexUrl: string,
        isPrivate: boolean
    ): Promise<SolidDataset> {
        const typeIndex = await this.getTypeIndex(webId, fetch, isPrivate);

        const typeIndexDS = await getSolidDataset(typeIndex?.value, {
            fetch: fetch,
        });

        const registeryThing = buildThing(
            createThing({ name: typeRegistrationTitle })
        )
            .addNamedNode(__forClass, namedNode(rdfClass))
            .addNamedNode(__solid_instance, namedNode(indexUrl))
            .addUrl(RDF.type, __solidTypeRegistration)
            .build();

        const updatedTypeIndexDS = setThing(typeIndexDS, registeryThing);

        return await saveSolidDatasetAt(typeIndex?.value, updatedTypeIndexDS, {
            fetch: fetch,
        });
    }


    /**
     * Creates a new empty TypeIndex file at the given indexUrl.
     *
     * @param fetch - Authenticated fetch function
     * @param typeIndexUrl - URL where the new TypeIndex file will be created
     * @returns A Promise resolving to the created TypeIndex dataset if successful, or undefined if there was an error.
     */
    public static async createTypeIndex(
        fetch: any,
        typeIndexUrl: string
    ): Promise<SolidDataset | undefined> {
        try {
            await fetch(typeIndexUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "text/turtle",
                },
                body: `@prefix solid: <http://www.w3.org/ns/solid/terms#>.\n\n<> a solid:TypeIndex, solid:UnlistedDocument.`,
            });

            return await getSolidDataset(typeIndexUrl, { fetch: fetch });
        } catch (error) { }
    }

    /**
     * Returns the name of the typeIndexe file based on the isPrivate flag.
     *
     * @param isPrivate - Whether the typeIndexe file should be private or public.
     * @returns The name of the typeIndexe file - either "privateTypeIndex" or "publicTypeIndex".
     */
    public static getTypeIndexFileName(
        isPrivate: boolean
    ): "privateTypeIndex" | "publicTypeIndex" {
        return isPrivate ? "privateTypeIndex" : "publicTypeIndex";
    }


    /**
     * Returns the predicate to use for the typeIndexe based on whether it is private or public.
     *
     * @param isPrivate - Whether the typeIndexe is private or public.
     * @returns The predicate to use - either __privateTypeIndex or __publicTypeIndex.
     */
    public static getTypeIndexPredicate(isPrivate: boolean): string {
        return isPrivate ? __privateTypeIndex : __publicTypeIndex;
    }


    /**
     * Generates the URL for the given user's typeIndexe file.
     *
     * @param webId - The user's WebID URL
     * @param typeIndexFileName - The name of the typeIndexe file
     * @returns The full URL for the typeIndexe file in the user's /settings/ folder
     */
    public static getTypeIndexURL(
        webId: string,
        typeIndexFileName: string
    ): string {
        return `${webId.split("/profile")[0]}/settings/${typeIndexFileName}.ttl`;
    }
}