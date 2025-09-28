"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAuthSession, signInWithRedirect, signOut } from "aws-amplify/auth";
import { DashboardStats } from "@/components/organisms/DashboardStats";
import { DistributionHistory } from "@/components/organisms/DistributionHistory";
import { EventManager } from "@/components/organisms/EventManager";
import { WorkForm } from "@/components/organisms/WorkForm";
import { WorkList } from "@/components/organisms/WorkList";

type AuthStatus = "checking" | "signedIn" | "signedOut";

type UserInfo = {
  email: string | null;
};

const getEmailFromIdToken = (tokenPayload: Record<string, unknown> | undefined) => {
  if (!tokenPayload) {
    return null;
  }

  const emailClaim = tokenPayload.email;
  return typeof emailClaim === "string" ? emailClaim : null;
};

const isAmplifyError = (error: unknown, name: string) =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  (error as { name?: string }).name === name;

export default function Home() {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [userInfo, setUserInfo] = useState<UserInfo>({ email: null });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;

      if (idToken) {
        setUserInfo({ email: getEmailFromIdToken(idToken.payload) });
        setStatus("signedIn");
        return true;
      }
    } catch (error) {
      console.error("Failed to fetch auth session", error);
    }

    setUserInfo({ email: null });
    setStatus("signedOut");
    return false;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const url = new URL(window.location.href);
      const hadCode = url.searchParams.has("code");
      const hadState = url.searchParams.has("state");

      const signedIn = await loadSession();

      if (hadCode || hadState) {
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        const cleanedSearch = url.searchParams.toString();
        const cleanedUrl = cleanedSearch ? `${url.pathname}?${cleanedSearch}` : url.pathname;
        window.history.replaceState({}, "", cleanedUrl + url.hash);
      }

      if (signedIn) {
        setErrorMessage(null);
      } else if (hadCode) {
        setErrorMessage("サインインに失敗しました。もう一度お試しください。");
      }
    };

    void initAuth();
  }, [loadSession]);

  const startSignIn = async () => {
    try {
      setErrorMessage(null);
      await signInWithRedirect();
    } catch (error) {
      if (isAmplifyError(error, "UserAlreadyAuthenticatedException")) {
        await loadSession();
        setErrorMessage(null);
        return;
      }

      console.error("Failed to start sign-in redirect", error);
      setErrorMessage("サインインを開始できませんでした。");
    }
  };

  const startSignOut = async () => {
    try {
      setErrorMessage(null);
      await signOut({ global: true });
    } catch (error) {
      console.error("Failed to sign out", error);
      setErrorMessage("サインアウトに失敗しました。");
    } finally {
      await loadSession();
    }
  };

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-sm text-slate-500">認証状態を確認しています...</div>
      </main>
    );
  }

  if (status === "signedOut") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl">
          <div className="space-y-2">
            <span className="text-sm font-semibold text-indigo-500">DouKeeper</span>
            <h1 className="text-2xl font-bold text-slate-900">サインインが必要です</h1>
            <p className="text-sm text-slate-600">
              CognitoのHosted UIにリダイレクトして、ダッシュボードにアクセスしてください。
            </p>
          </div>
          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </p>
          )}
          <button
            type="button"
            onClick={startSignIn}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Cognitoでサインイン
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {errorMessage && (
        <div className="bg-red-50 py-3 text-center text-sm text-red-600">
          {errorMessage}
        </div>
      )}
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:px-8 lg:px-10">
        <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-slate-900 text-white shadow-lg">
          <div className="space-y-6 px-6 py-10 sm:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide text-white/90">
                  DouKeeper MVP
                </span>
                <h1 className="text-3xl font-bold leading-snug sm:text-4xl">
                  在庫と頒布記録をひと目で把握
                </h1>
                <p className="max-w-2xl text-base text-white/80 sm:text-lg">
                  DouKeeperは、イベント当日の忙しさの中でも在庫と頒布状況を確認できるように設計されたWebアプリです。作品登録、頒布記録、イベント管理までワンストップでサポートします。
                </p>
              </div>
              <div className="flex items-center gap-3 self-start rounded-full bg-white/10 px-4 py-2 text-sm text-white/90">
                {userInfo.email && <span>{userInfo.email}</span>}
                <button
                  type="button"
                  onClick={startSignOut}
                  className="rounded-full border border-white/40 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20"
                >
                  サインアウト
                </button>
              </div>
            </div>
            <DashboardStats />
          </div>
        </header>

        <section className="space-y-6">
          <WorkForm />
          <WorkList />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <DistributionHistory />
          <EventManager />
        </section>
      </div>
    </main>
  );
}
