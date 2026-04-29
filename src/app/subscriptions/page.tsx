"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import SubscriptionList from "@/components/SubscriptionList";
import { Subscription } from "@/types";

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchSubscriptions();
  }, [session, fetchSubscriptions]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubscriptionList
          subscriptions={subscriptions}
          loading={loading}
          onRefresh={fetchSubscriptions}
        />
      </main>
    </div>
  );
}
