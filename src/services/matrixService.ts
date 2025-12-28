import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface MatrixData {
    colHeaders: string[];
    rowHeaders: string[];
    cells: string[][];
    cellUsage?: { [key: string]: string }; // key: "row-col", value: ISO date string
}

interface MatrixFirestoreData {
    colHeaders: string[];
    rowHeaders: string[];
    rows: { data: string[] }[];
    cellUsage?: { [key: string]: string };
}

const getUserMatrixDoc = (userId: string) => {
    return doc(db, "users", userId, "settings", "matrix");
};

export const getMatrix = async (userId: string): Promise<MatrixData | null> => {
    if (!userId) return null;
    try {
        const docRef = getUserMatrixDoc(userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as MatrixFirestoreData;
            // Backwards compatibility or transform
            let cells: string[][] = [];
            if (data.rows && Array.isArray(data.rows)) {
                cells = data.rows.map(r => r.data);
            } else if ((data as any).cells) {
                // Handle legacy if any (though we know it failed to save, just in case)
                cells = (data as any).cells;
            }

            return {
                colHeaders: data.colHeaders || [],
                rowHeaders: data.rowHeaders || [],
                cells: cells,
                cellUsage: data.cellUsage || {}
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching matrix:", error);
        return null;
    }
};

export const saveMatrix = async (userId: string, data: MatrixData): Promise<boolean> => {
    if (!userId) return false;
    try {
        const docRef = getUserMatrixDoc(userId);

        // Transform 2D array to object list for Firestore
        const firestoreData: MatrixFirestoreData = {
            colHeaders: data.colHeaders,
            rowHeaders: data.rowHeaders,
            rows: data.cells.map(row => ({ data: row })),
            cellUsage: data.cellUsage || {}
        };

        await setDoc(docRef, firestoreData, { merge: true });
        return true;
    } catch (error) {
        console.error("Error saving matrix:", error);
        return false;
    }
};

export const recordCellUsage = async (
    userId: string,
    rowIndex: number,
    colIndex: number,
    date: string
): Promise<boolean> => {
    if (!userId) return false;
    try {
        const matrix = await getMatrix(userId);
        if (!matrix) return false;

        const cellKey = `${rowIndex}-${colIndex}`;
        const updatedMatrix: MatrixData = {
            ...matrix,
            cellUsage: {
                ...matrix.cellUsage,
                [cellKey]: date
            }
        };

        return await saveMatrix(userId, updatedMatrix);
    } catch (error) {
        console.error("Error recording cell usage:", error);
        return false;
    }
};
