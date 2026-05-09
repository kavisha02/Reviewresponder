"use client";

import { useState } from "react";

interface NotificationSettings {
  negativeAlerts: boolean;
  weeklyDigest: boolean;
  digestDay: string;
  digestTime: string;
  email: string;
}

export default function NotificationSettingsClient({
  businessId,
  userEmail,
}: {
  businessId: string;
  userEmail: string;
}) {
  const [settings, setSettings] = useState<NotificationSettings>({
    negativeAlerts: true,
    weeklyDigest: true,
    digestDay: "monday",
    digestTime: "09:00",
    email: userEmail,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: typeof prev[key] === "boolean" ? !prev[key] : prev[key],
    }));
  };

  const handleChange = (key: keyof NotificationSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/notifications/update-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          ...settings,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      setMessage("✓ Settings saved successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("✗ Failed to save settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Negative Review Alerts */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-white">
              🚨 Negative Review Alerts
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Get instant email alerts when a 1 or 2-star review is posted
            </p>
          </div>
          <button
            onClick={() => handleToggle("negativeAlerts")}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              settings.negativeAlerts ? "bg-emerald-600" : "bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                settings.negativeAlerts ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <p className="text-slate-500 text-xs">
          {settings.negativeAlerts
            ? "You'll receive alerts for negative reviews"
            : "Alerts are disabled"}
        </p>
      </div>

      {/* Weekly Digest */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              📊 Weekly Digest
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Receive a weekly summary of reviews, ratings, and response metrics
            </p>
          </div>
          <button
            onClick={() => handleToggle("weeklyDigest")}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              settings.weeklyDigest ? "bg-emerald-600" : "bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                settings.weeklyDigest ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {settings.weeklyDigest && (
          <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Day of week
              </label>
              <select
                value={settings.digestDay}
                onChange={(e) => handleChange("digestDay", e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Preferred time for digest
              </label>
              <input
                type="time"
                value={settings.digestTime}
                onChange={(e) => handleChange("digestTime", e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-slate-500 text-xs mt-2">
                Digest will be sent every {settings.digestDay} at {settings.digestTime} (your timezone)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Email Address */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">📧 Email Address</h3>
        <input
          type="email"
          value={settings.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
        />
        <p className="text-slate-500 text-xs mt-2">
          All notifications will be sent to this email address
        </p>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
        {message && (
          <span
            className={`text-sm font-medium ${
              message.includes("✓") ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {message}
          </span>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-indigo-950/30 border border-indigo-700/50 rounded-lg p-4">
        <p className="text-sm text-indigo-200">
          <strong>💡 Tip:</strong> Enable both negative alerts and weekly digest to stay
          on top of your reviews. Alerts notify you immediately of issues, while the
          digest gives you a complete overview once a week.
        </p>
      </div>
    </div>
  );
}
