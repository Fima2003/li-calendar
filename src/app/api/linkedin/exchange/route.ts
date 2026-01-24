
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/linkedin/callback`;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
        }

        const params = new URLSearchParams();
        params.append("grant_type", "authorization_code");
        params.append("code", code);
        params.append("client_id", clientId);
        params.append("client_secret", clientSecret);
        params.append("redirect_uri", redirectUri);

        const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("LinkedIn Token Error", data);
            return NextResponse.json({ error: data.error_description || "Failed to exchange token" }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Exchange API Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
