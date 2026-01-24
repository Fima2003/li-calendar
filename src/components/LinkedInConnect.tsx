
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, deleteDoc } from "firebase/firestore";

export default function LinkedInConnect() {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const unsub = onSnapshot(doc(db, "users", user.uid, "integrations", "linkedin"), (doc) => {
            setIsConnected(doc.exists());
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    const handleConnect = async () => {
        if (!user) return;
        window.location.href = `/api/auth/linkedin?userId=${user.uid}`;
    };

    if (loading) return null;

    const handleDisconnect = async () => {
        if (!user) return;
        if (confirm("Are you sure you want to disconnect your LinkedIn account?")) {
            try {
                await deleteDoc(doc(db, "users", user.uid, "integrations", "linkedin"));
            } catch (e) {
                console.error("Failed to disconnect", e);
                alert("Failed to disconnect");
            }
        }
    };

    if (isConnected) {
        return (
            <div className="flex gap-2 items-center">
                <button className="neo-button bg-neo-blue text-white px-3 py-2 text-sm flex items-center gap-2 cursor-default">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                        <rect x="2" y="9" width="4" height="12"></rect>
                        <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                    Connected
                </button>
                <button
                    onClick={handleDisconnect}
                    className="neo-button bg-neo-red text-white px-2 py-2 text-xs hover:brightness-110"
                    title="Disconnect"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleConnect}
            className="neo-button bg-white hover:bg-gray-50 px-3 py-2 text-sm flex items-center gap-2"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
            </svg>
            Connect LinkedIn
        </button>
    );
}
