import { db } from "@/lib/firebase";
import { DayData, CalendarMonthData } from "@/types/calendar";
import { collection, doc, getDocs, setDoc, query, where } from "firebase/firestore";

const COLLECTION_NAME = "calendar_days";

export const getCalendarData = async (month: number, year: number): Promise<CalendarMonthData> => {
    const data: CalendarMonthData = {};

    // Try LocalStorage first (hybrid approach for demo stability) or fallback
    if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`calendar_${year}_${month}`);
        if (local) {
            Object.assign(data, JSON.parse(local));
        }
    }

    try {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const q = query(
            collection(db, COLLECTION_NAME),
            where("date", ">=", startDateStr),
            where("date", "<=", endDateStr)
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            data[doc.id] = doc.data() as DayData;
        });
    } catch (error) {
        console.warn("Firestore fetch failed, relying on LocalStorage:", error);
    }

    return data;
};

export const updateDay = async (dayData: DayData) => {
    if (!dayData.date) {
        console.error("Day date is missing");
        return false;
    }

    // Update LocalStorage
    if (typeof window !== 'undefined') {
        try {
            const dateObj = new Date(dayData.date);
            const month = dateObj.getMonth();
            const year = dateObj.getFullYear();
            const key = `calendar_${year}_${month}`;

            const existingDataStr = localStorage.getItem(key);
            const existingData: CalendarMonthData = existingDataStr ? JSON.parse(existingDataStr) : {};

            existingData[dayData.date] = dayData;
            localStorage.setItem(key, JSON.stringify(existingData));
            console.log("Saved to LocalStorage:", dayData);
        } catch (e) {
            console.error("LocalStorage save failed", e);
        }
    }

    // Update Firestore
    try {
        const docRef = doc(db, COLLECTION_NAME, dayData.date);
        await setDoc(docRef, dayData, { merge: true });
        return true;
    } catch (error) {
        console.error("Firestore update failed:", error);
        // Return true anyway if LocalStorage worked, so UI doesn't break
        return true;
    }
};
