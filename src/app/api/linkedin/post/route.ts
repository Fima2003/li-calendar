
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // Using generic export
import { doc, getDoc } from "firebase/firestore";

// Helper to post to LinkedIn
async function postToLinkedInAPI(accessToken: string, urn: string, text: string) {
    const body = {
        author: `urn:li:person:${urn}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
            "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                    text: text
                },
                shareMediaCategory: "NONE"
            }
        },
        visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        },
        body: JSON.stringify(body)
    });

    return response;
}

// Helper to get user profile (URN)
async function getLinkedInProfile(accessToken: string) {
    const response = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });
    return response.json();
}

export async function POST(request: NextRequest) {
    try {
        const { userId, content } = await request.json();

        if (!userId || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Get Token from Firestore
        // Note: In a real app, verify the request is from the user (session/token).

        let accessToken = "";
        try {
            // Using setDoc(merge) in cal service.. reading here.
            // CAUTION: This might fail if using Client SDK on server without auth.
            // If it fails, I'll need to figure out the admin story.
            const docRef = doc(db, "users", userId, "integrations", "linkedin");
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return NextResponse.json({ error: "Not connected to LinkedIn" }, { status: 404 });
            }

            accessToken = docSnap.data().accessToken;
        } catch (e) {
            console.error("Firestore Error", e);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        // 2. Get User URN (needed for posting)
        const profile = await getLinkedInProfile(accessToken);
        if (!profile.sub) {
            return NextResponse.json({ error: "Failed to fetch LinkedIn Profile" }, { status: 500 });
        }
        const urn = profile.sub; // 'sub' is the ID in OpenID Connect

        // 3. Post
        const postResp = await postToLinkedInAPI(accessToken, urn, content);
        const postData = await postResp.json();

        if (!postResp.ok) {
            console.error("LinkedIn Post Error", postData);
            return NextResponse.json({ error: "Failed to post to LinkedIn" }, { status: postResp.status });
        }

        return NextResponse.json({ success: true, data: postData });

    } catch (error) {
        console.error("Post API Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
