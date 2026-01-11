import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface HooksData {
    hooks: string[];
}

export const getHooks = async (userId: string): Promise<string[]> => {
    if (!userId) return [];

    try {
        const docRef = doc(db, "users", userId, "hooks_data", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as HooksData;
            return data.hooks || [];
        }
    } catch (error) {
        console.error("Error fetching hooks:", error);
    }
    return [];
};

export const saveHooks = async (userId: string, hooks: string[]): Promise<boolean> => {
    if (!userId) return false;

    try {
        const docRef = doc(db, "users", userId, "hooks_data", "main");
        await setDoc(docRef, { hooks });
        return true;
    } catch (error) {
        console.error("Error saving hooks:", error);
        return false;
    }
};
