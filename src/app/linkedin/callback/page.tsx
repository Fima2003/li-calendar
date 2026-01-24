
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function LinkedInCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [status, setStatus] = useState("Processing...");

    // Extract params outside effect to include in dependency array correctly
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    useEffect(() => {
        const processCallback = async () => {
            // code and error are now from closure scope

            if (error) {
                setStatus(`Error from LinkedIn: ${error}`);
                return;
            }

            if (!code) {
                setStatus("No code received.");
                return;
            }

            if (!user) {
                // Wait for user or redirect to login.
                // If the user isn't logged in, we can't save the token essentially.
                // Assuming the session persists or they log in.
                setStatus("Waiting for authentication...");
                return;
            }

            try {
                setStatus("Exchanging code...");
                const response = await fetch("/api/linkedin/exchange", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || "Failed to exchange token");
                }

                const data = await response.json();
                const { access_token, expires_in } = data;

                // Save to Firestore
                setStatus("Saving connection...");
                const tokenRef = doc(db, "users", user.uid, "integrations", "linkedin");
                await setDoc(tokenRef, {
                    accessToken: access_token,
                    expiresIn: expires_in,
                    connectedAt: new Date().toISOString()
                });

                setStatus("Connected! Redirecting...");
                setTimeout(() => router.push("/"), 1500);

            } catch (err: any) {
                console.error("Callback error", err);
                setStatus(`Error: ${err.message}`);
            }
        };

        processCallback();
    }, [code, error, user, router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-xl font-semibold">{status}</div>
        </div>
    );
}
