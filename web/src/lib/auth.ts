"use client";

import { Amplify } from "aws-amplify";
import {
  fetchAuthSession,
  signIn,
  signOut,
  getCurrentUser,
} from "aws-amplify/auth";

let configured = false;

export function configureAuth() {
  if (configured || typeof window === "undefined") return;
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  if (!userPoolId || !userPoolClientId) return;
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
      },
    },
  });
  configured = true;
}

export async function login(username: string, password: string) {
  configureAuth();
  try {
    await signOut();
  } catch {
    /* ignore — may not be signed in */
  }
  await signIn({
    username,
    password,
    options: { authFlowType: "USER_PASSWORD_AUTH" },
  });
}

/** Demo Cognito user — same API access, one-click for judges/guests. */
export async function loginAsGuest() {
  const username =
    process.env.NEXT_PUBLIC_GUEST_USERNAME || "demotest";
  const password =
    process.env.NEXT_PUBLIC_GUEST_PASSWORD || "DemoTest123!";
  await login(username, password);
}

export async function logout() {
  configureAuth();
  await signOut();
}

export async function isLoggedIn() {
  configureAuth();
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

export async function getIdToken(): Promise<string | null> {
  configureAuth();
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}
