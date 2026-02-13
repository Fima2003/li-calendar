import { db } from "@/lib/firebase";
import { Resource } from "@/types/resource";
import { collection, addDoc, deleteDoc, doc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";

// Helper to get collection reference for a user
const getUserResourcesCollection = (userId: string) => {
    return collection(db, "users", userId, "resources");
};

export const getResources = async (userId: string): Promise<Resource[]> => {
    if (!userId) return [];

    try {
        const q = query(
             getUserResourcesCollection(userId),
             orderBy("createdAt", "asc")
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Resource));
    } catch (error) {
        console.error("Error fetching resources:", error);
        return [];
    }
};

export const addResource = async (userId: string, title: string, url?: string): Promise<Resource | null> => {
    if (!userId || !title.trim()) return null;

    try {
        const newResource = {
            title,
            url: url || "",
            createdAt: new Date().toISOString()
        };
        
        const docRef = await addDoc(getUserResourcesCollection(userId), newResource);
        return {
            id: docRef.id,
            ...newResource
        };
    } catch (error) {
        console.error("Error adding resource:", error);
        return null;
    }
};

export const deleteResource = async (userId: string, resourceId: string): Promise<boolean> => {
    if (!userId || !resourceId) return false;

    try {
        await deleteDoc(doc(db, "users", userId, "resources", resourceId));
        return true;
    } catch (error) {
        console.error("Error deleting resource:", error);
        return false;
    }
};
