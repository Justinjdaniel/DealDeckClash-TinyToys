import React, { useState, useEffect, useRef } from "react";
import { CustomGameRules } from "../../types/game";
import { DEFAULT_CUSTOM_RULES } from "./rules";
import { Play, RotateCcw, Shield, Trophy, Zap, Sliders } from "lucide-react";

interface GameRulesDashboardProps {
  initialRules?: CustomGameRules;
  onSaveAndApply: (rules: CustomGameRules) => void;
  onClose?: () => void;
}

export const GameRulesDashboard: React.FC<GameRulesDashboardProps> = ({
  initialRules = DEFAULT_CUSTOM_RULES,
  onSaveAndApply,
  onClose,
}) => {
  const [rules, setRules] = useState<CustomGameRules>({ ...initialRules });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus first focusable element inside modal on mount
    const focusableElements =
      containerRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
    if (focusableElements && focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle Escape key to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSetsChange = (delta: number) => {
    setRules((prev) => ({
      ...prev,
      setsRequiredToFinish: Math.max(
        1,
        Math.min(10, prev.setsRequiredToFinish + delta),
      ),
    }));
  };

  const handleToggle = (key: keyof CustomGameRules) => {
    setRules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectChange = (
    key: "initialHandSize" | "actionLimitPerTurn",
    value: number,
  ) => {
    setRules((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setRules({ ...DEFAULT_CUSTOM_RULES });
  };

  const handleSave = () => {
    onSaveAndApply(rules);
    if (onClose) onClose();
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-heading"
      className="w-full max-w-4xl mx-auto bg-[#181920] border border-gray-800 rounded-xl shadow-2xl p-6 text-white font-sans"
    >
      {/* Header */}
      <div className="border-b border-gray-800 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h2
            id="dashboard-heading"
            className="text-2xl font-black uppercase tracking-wider text-yellow-400 flex items-center gap-2"
          >
            <Sliders className="w-6 h-6 text-yellow-400" />
            Game Rules Dashboard
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Customize Monopoly Deal match rules, special card abilities, and
            limits.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close rules dashboard"
            className="text-gray-400 hover:text-white transition-colors text-xl font-bold px-3 py-1 rounded-lg hover:bg-gray-800"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* WIN CONDITION */}
          <div className="bg-[#20222c] border border-gray-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold tracking-wider text-gray-200 uppercase">
                Win Condition
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Set the number of completed property sets required for victory.
            </p>

            <div className="flex items-center justify-between bg-[#15161d] p-3 rounded-lg border border-gray-700/50">
              <span className="text-sm font-medium text-gray-300">
                Property sets required
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease required property sets"
                  onClick={() => handleSetsChange(-1)}
                  disabled={rules.setsRequiredToFinish <= 1}
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 text-white font-extrabold flex items-center justify-center transition-all border border-gray-600"
                >
                  -
                </button>
                <span className="text-lg font-black w-6 text-center text-yellow-400">
                  {rules.setsRequiredToFinish}
                </span>
                <button
                  type="button"
                  aria-label="Increase required property sets"
                  onClick={() => handleSetsChange(1)}
                  disabled={rules.setsRequiredToFinish >= 10}
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 text-white font-extrabold flex items-center justify-center transition-all border border-gray-600"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* SPECIAL CARDS */}
          <div className="bg-[#20222c] border border-gray-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold tracking-wider text-gray-200 uppercase">
                Special Cards
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Toggle permission for specific high-impact action cards.
            </p>

            <div className="space-y-3">
              {/* Deal Breakers */}
              <div className="flex items-center justify-between bg-[#15161d] p-3 rounded-lg border border-gray-700/50">
                <label
                  htmlFor="rule-deal-breakers"
                  className="text-sm font-medium text-gray-300 cursor-pointer"
                >
                  Allow "Deal Breakers"
                </label>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="rule-deal-breakers"
                    type="checkbox"
                    checked={rules.allowDealBreakers}
                    onChange={() => handleToggle("allowDealBreakers")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
              </div>

              {/* Forced Deals */}
              <div className="flex items-center justify-between bg-[#15161d] p-3 rounded-lg border border-gray-700/50">
                <label
                  htmlFor="rule-forced-deals"
                  className="text-sm font-medium text-gray-300 cursor-pointer"
                >
                  Allow "Forced Deals"
                </label>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="rule-forced-deals"
                    type="checkbox"
                    checked={rules.allowForcedDeals}
                    onChange={() => handleToggle("allowForcedDeals")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
              </div>

              {/* Rent Collection */}
              <div className="flex items-center justify-between bg-[#15161d] p-3 rounded-lg border border-gray-700/50">
                <label
                  htmlFor="rule-rent-collection"
                  className="text-sm font-medium text-gray-300 cursor-pointer"
                >
                  Allow Rent Collection
                </label>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="rule-rent-collection"
                    type="checkbox"
                    checked={rules.allowRentCollection}
                    onChange={() => handleToggle("allowRentCollection")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* PROPERTY PROTECTION */}
          <div className="bg-[#20222c] border border-gray-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold tracking-wider text-gray-200 uppercase">
                Property Protection
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Rule settings regarding immunity and stealing full property sets.
            </p>

            <div className="flex items-center justify-between bg-[#15161d] p-3 rounded-lg border border-gray-700/50">
              <label
                htmlFor="rule-full-set-immunity"
                className="text-sm font-medium text-gray-300 cursor-pointer"
              >
                Full Set Immunity from Steal
              </label>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  id="rule-full-set-immunity"
                  type="checkbox"
                  checked={rules.fullSetImmunity}
                  onChange={() => handleToggle("fullSetImmunity")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </div>
          </div>

          {/* OTHER PARAMETERS */}
          <div className="bg-[#20222c] border border-gray-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold tracking-wider text-gray-200 uppercase">
                Other Parameters
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Configure turn actions, initial hands, and wildcard availability.
            </p>

            <div className="space-y-3">
              {/* Initial Hand Size */}
              <div className="flex items-center justify-between bg-[#15161d] p-3 rounded-lg border border-gray-700/50">
                <label
                  htmlFor="rule-hand-size"
                  className="text-sm font-medium text-gray-300 cursor-pointer"
                >
                  Initial Hand Size
                </label>
                <select
                  id="rule-hand-size"
                  value={rules.initialHandSize}
                  onChange={(e) =>
                    handleSelectChange(
                      "initialHandSize",
                      Number(e.target.value),
                    )
                  }
                  className="bg-gray-800 text-white font-bold text-sm border border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-yellow-400"
                >
                  <option value={3}>3 Cards</option>
                  <option value={4}>4 Cards</option>
                  <option value={5}>5 Cards (Standard)</option>
                  <option value={6}>6 Cards</option>
                  <option value={7}>7 Cards</option>
                </select>
              </div>

              {/* Action Limit Per Turn */}
              <div className="flex items-center justify-between bg-[#15161d] p-3 rounded-lg border border-gray-700/50">
                <label
                  htmlFor="rule-action-limit"
                  className="text-sm font-medium text-gray-300 cursor-pointer"
                >
                  Action Limit Per Turn
                </label>
                <select
                  id="rule-action-limit"
                  value={rules.actionLimitPerTurn}
                  onChange={(e) =>
                    handleSelectChange(
                      "actionLimitPerTurn",
                      Number(e.target.value),
                    )
                  }
                  className="bg-gray-800 text-white font-bold text-sm border border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-yellow-400"
                >
                  <option value={2}>2 Actions</option>
                  <option value={3}>3 Actions (Standard)</option>
                  <option value={4}>4 Actions</option>
                  <option value={5}>5 Actions</option>
                </select>
              </div>

              {/* Wildcards Allowed */}
              <div className="flex items-center justify-between bg-[#15161d] p-3 rounded-lg border border-gray-700/50">
                <label
                  htmlFor="rule-allow-wildcards"
                  className="text-sm font-medium text-gray-300 cursor-pointer"
                >
                  Wildcards Allowed
                </label>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="rule-allow-wildcards"
                    type="checkbox"
                    checked={rules.allowWildcards}
                    onChange={() => handleToggle("allowWildcards")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-4 border-t border-gray-800 flex flex-col sm:flex-row justify-end gap-4">
        <button
          type="button"
          onClick={handleSave}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play className="w-5 h-5 fill-current" />
          SAVE & APPLY
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <RotateCcw className="w-5 h-5" />
          RESET TO STANDARD RULES
        </button>
      </div>
    </div>
  );
};
