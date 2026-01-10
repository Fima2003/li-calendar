import { db } from "@/lib/firebase";
import { DayData, CalendarMonthData } from "@/types/calendar";
import { collection, doc, getDocs, setDoc, query, where } from "firebase/firestore";

// Helper to get collection reference for a user
const getUserCalendarCollection = (userId: string) => {
    return collection(db, "users", userId, "calendar_data");
};

export const getCalendarData = async (month: number, year: number, userId: string): Promise<CalendarMonthData> => {
    const data: CalendarMonthData = {};

    if (!userId) {
        console.warn("No userId provided to getCalendarData");
        return data;
    }

    try {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const q = query(
            getUserCalendarCollection(userId),
            where("date", ">=", startDateStr),
            where("date", "<=", endDateStr)
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const d = doc.data() as any;
            if (d.notes && typeof d.notes === 'string') {
                d.notes = [d.notes];
            }
            data[doc.id] = d as DayData;
        });
    } catch (error) {
        console.error("Firestore fetch failed:", error);
    }

    return data;
};

export const updateDay = async (dayData: DayData, userId: string) => {
    if (!dayData.date) {
        console.error("Day date is missing");
        return false;
    }

    if (!userId) {
        console.error("No userId provided for updateDay");
        return false;
    }

    // Update Firestore
    try {
        const docRef = doc(db, "users", userId, "calendar_data", dayData.date);
        await setDoc(docRef, dayData, { merge: true });
        return true;
    } catch (error) {
        console.error("Firestore update failed:", error);
        return false;
    }
};
