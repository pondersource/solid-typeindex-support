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
     * @internal
     */
    public static async getMeProfile(
        webId: string,
        fetch: any
    ): Promise<ThingPersisted | null> {
        const profileDS = await getSolidDataset(webId, { fetch });

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
                { fetch }
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
     * @internal
     */
    public static async getTypeIndex(
        webId: string,
        fetch: any,
        isPrivate: boolean
    ): Promise<NamedNode<string>> {
        const profileMe = await this.getMeProfile(webId, fetch);

        const typeIndexPredicate = TypeIndexHelper.getTypeIndexPredicate(isPrivate);
        const typeIndexUrl = TypeIndexHelper.getDefaultTypeIndexURL(webId, isPrivate);

        const profileDS = await getSolidDataset(webId, { fetch });

        if (profileMe) {
            let typeIndex = getNamedNode(profileMe, typeIndexPredicate);

            if (typeIndex) return typeIndex;

            await this.createTypeIndex(fetch, typeIndexUrl);

            const updatedProfileMe = addNamedNode(
                profileMe,
                typeIndexPredicate,
                namedNode(typeIndexUrl)
            );

            const updatedProfileDS = setThing(profileDS, updatedProfileMe);

            await saveSolidDatasetAt(webId, updatedProfileDS, { fetch });

            return namedNode(typeIndexUrl);
        } else {
            await this.createTypeIndex(fetch, typeIndexUrl);

            const profileMeThing = buildThing(createThing({ name: "me" }))
                .addNamedNode(typeIndexPredicate, namedNode(typeIndexUrl))
                .addUrl(RDF.type, __foafPerson)
                .addUrl(RDF.type, __schemaPerson)
                .build();

            const updatedProfileDS = setThing(profileDS, profileMeThing);

            await saveSolidDatasetAt(webId, updatedProfileDS, { fetch });

            return namedNode(typeIndexUrl);
        }
    }

    /**
     * Retrieves all instances of the given RDF class from the user's typeIndexe.
     *
     * @param webId - The user's WebID
     * @param rdfClass - The RDF class to retrieve instances for, as a Valid URL
     * @param fetch - Authenticated fetch function
     * @param isPrivate - Whether the typeIndexe is private or public
     * @returns Promise resolving to an object containing instance URLs and instanceContainers URLs.
     */
    public static async getFromTypeIndex(webId: string, rdfClass: string, fetch: any, isPrivate: boolean): Promise<{ instanceContainers: string[]; instances: string[]; }> {
        const typeIndex = await this.getTypeIndex(webId, fetch, isPrivate);

        const typeIndexDS = await getSolidDataset(typeIndex?.value, { fetch });

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

            const instanceContainerDS = await getSolidDataset(instanceContainer, { fetch })

            const all = getThingAll(instanceContainerDS); // all files under the instanceContainer

            const urls = all.filter(x => x.url !== "").map(x => x.url) // all file urls

            return urls.filter(url => url !== instanceContainer) // remove the instanceContainer itself, only file urls needed;
        })

        const innerInstances = (await Promise.all([...instanceContainersPromises])).flat();


        return {
            instanceContainers: instanceContainers,
            instances: [...new Set([...instances, ...innerInstances])]
        }
    }


    /**
     * Registers a typeRegistration in the user's typeIndexe.
     *
     * @param webId - The WebID of the user
     * @param typeRegistrationTitle - The title to use for the typeRegistration inside the typeIndex, 
     * @param rdfClass - The RDF class that this registration is for, as a Valid URL
     * @param fetch - The authenticated fetch function
     * @param registeryUrl - The URL of the solid:instance or solid:instanceContainer being registered
     * @param isContainer - Whether to register a solid:instanceContainer or a solid:instance
     * @param isPrivate - Whether to register in the private or public typeIndexe
     * @returns A Promise resolving to the updated typeIndexe dataset
     */
    public static async registerInTypeIndex(
        webId: string,
        typeRegistrationTitle: string,
        rdfClass: string,
        fetch: any,
        registeryUrl: string,
        isContainer: boolean,
        isPrivate: boolean,
    ): Promise<SolidDataset> {
        const typeIndex = await this.getTypeIndex(webId, fetch, isPrivate);

        const typeIndexDS = await getSolidDataset(typeIndex?.value, {
            fetch,
        });

        const registeryThing = buildThing(
            createThing({ name: typeRegistrationTitle })
        )
            .addNamedNode(__forClass, namedNode(rdfClass))
            .addNamedNode(isContainer ? __solid_instance_container : __solid_instance, namedNode(registeryUrl))
            .addUrl(RDF.type, __solidTypeRegistration)
            .build();

        const updatedTypeIndexDS = setThing(typeIndexDS, registeryThing);

        return await saveSolidDatasetAt(typeIndex?.value, updatedTypeIndexDS, {
            fetch,
        });
    }


    /**
     * Creates a new empty TypeIndex file at the given indexUrl.
     *
     * @param fetch - Authenticated fetch function
     * @param typeIndexUrl - URL where the new TypeIndex file will be created
     * @returns A Promise resolving to the created TypeIndex dataset if successful, or undefined if there was an error.
     * @internal
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

            return await getSolidDataset(typeIndexUrl, { fetch });
        } catch (error) { }
    }

    /**
     * Returns the predicate to use for the typeIndexe based on whether it is private or public.
     *
     * @param isPrivate - Whether the typeIndexe is private or public.
     * @returns The predicate to use - either __privateTypeIndex or __publicTypeIndex.
     * @internal
     */
    public static getTypeIndexPredicate(isPrivate: boolean): string {
        return isPrivate ? __privateTypeIndex : __publicTypeIndex;
    }


    /**
     * Generates the URL for the given user's typeIndexe file.
     *
     * @param webId - The user's WebID URL
     * @param isPrivate - Whether the typeIndexe is private or public.
     * @returns The full URL for the typeIndexe file in the user's /settings/ folder
     * @internal
     */
    public static getDefaultTypeIndexURL(
        webId: string,
        isPrivate: boolean,
    ): string {
        return `${webId.split("/profile")[0]}/settings/${isPrivate ? "privateTypeIndex" : "publicTypeIndex"}.ttl`;
    }
}