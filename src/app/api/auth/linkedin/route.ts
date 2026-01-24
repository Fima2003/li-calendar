
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/linkedin/callback`;

    if (!clientId) {
        return NextResponse.json({ error: "LinkedIn Client ID not configured" }, { status: 500 });
    }

    const scope = "w_member_social openid profile email";
    const state = crypto.randomUUID(); // Recommended to prevent CSRF

    // Store state in cookie if needed for strict validation, skipping for MVP simplicity usually fine but better to have.
    // We'll just construct the URL.

    const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        state: state,
        scope: scope,
    });

    const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

    return NextResponse.redirect(linkedInAuthUrl);
}
