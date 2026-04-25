import { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { Navbar } from "../LandingDashboard/components/Navbar";
import { api } from "../../../services/apiClient";

const plans = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    perks: ["Core learning path", "Basic analytics", "Community support"]
  },
  {
    key: "pro",
    name: "Pro",
    price: "$9/mo",
    perks: ["Advanced analytics", "Priority support", "Enhanced practice insights"]
  },
  {
    key: "premium",
    name: "Premium",
    price: "$19/mo",
    perks: ["Everything in Pro", "Premium mentoring", "Future premium features"]
  }
];

export default function Billing() {
  const [currentTier, setCurrentTier] = useState("free");
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchTier = async () => {
      setLoading(true);
      try {
        const response = await api.getStudentProfile();
        const tier = response?.user_profile?.basic_info?.membership_tier || "free";
        setCurrentTier(tier);
      } catch {
        setMessage({ type: "error", text: "Unable to load billing details." });
      } finally {
        setLoading(false);
      }
    };
    fetchTier();
  }, []);

  const handleUpgrade = async (tier) => {
    if (tier === currentTier) return;

    setSavingPlan(tier);
    setMessage({ type: "", text: "" });
    try {
      await api.upgradeMembership(tier);
      setCurrentTier(tier);
      setMessage({ type: "success", text: `Membership upgraded to ${tier}.` });
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message || "Failed to upgrade membership."
      });
    } finally {
      setSavingPlan("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-6">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-gray-800/70 p-6">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-5 w-5 text-blue-300" />
            <h1 className="text-2xl font-bold text-white">Billing & Membership</h1>
          </div>
          <p className="text-gray-400">
            Manage your subscription tier and compare plan features.
          </p>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-xl border ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="h-40 bg-black/40 rounded-2xl border border-gray-800/70 animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentTier === plan.key;
              const isSaving = savingPlan === plan.key;
              return (
                <div
                  key={plan.key}
                  className={`rounded-2xl border p-6 backdrop-blur-xl ${
                    isCurrent
                      ? "bg-blue-500/10 border-blue-500/40"
                      : "bg-black/40 border-gray-800/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
                    {isCurrent && <span className="text-xs text-blue-300">Current</span>}
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{plan.price}</p>

                  <ul className="mt-4 space-y-2">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-gray-300 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={isCurrent || !!savingPlan}
                    onClick={() => handleUpgrade(plan.key)}
                    className="mt-6 w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white transition-colors"
                  >
                    {isSaving ? (
                      <span className="inline-flex items-center gap-2 justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </span>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : (
                      `Switch to ${plan.name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
