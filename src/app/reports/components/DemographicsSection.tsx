"use client";

import React, { useMemo } from "react";
import { DemographicData } from "../types";
import { Users, MapPin, Globe, BarChart3 } from "lucide-react";

interface DemographicsSectionProps {
  data: DemographicData | null;
  loading?: boolean;
}

// Parse "M.25-34" → { gender: "Male", ageRange: "25-34" }
function parseGenderAgeKey(key: string) {
  const [genderCode, ageRange] = key.split(".");
  const gender =
    genderCode === "M" ? "Male" : genderCode === "F" ? "Female" : "Other";
  return { gender, ageRange: ageRange || "Unknown" };
}

// Sort entries by value descending and take top N
function topEntries(
  data: Record<string, number>,
  limit: number,
): [string, number][] {
  return Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);
}

export default function DemographicsSection({
  data,
  loading,
}: DemographicsSectionProps) {
  // Process gender/age data into chart-friendly format
  const genderAgeData = useMemo(() => {
    if (!data?.genderAge || Object.keys(data.genderAge).length === 0)
      return null;

    const ageGroups: Record<
      string,
      { male: number; female: number; other: number }
    > = {};
    let totalMale = 0;
    let totalFemale = 0;
    let totalOther = 0;

    for (const [key, rawValue] of Object.entries(data.genderAge)) {
      const value = Number(rawValue);
      const { gender, ageRange } = parseGenderAgeKey(key);
      if (!ageGroups[ageRange]) {
        ageGroups[ageRange] = { male: 0, female: 0, other: 0 };
      }
      if (gender === "Male") {
        ageGroups[ageRange].male += value;
        totalMale += value;
      } else if (gender === "Female") {
        ageGroups[ageRange].female += value;
        totalFemale += value;
      } else {
        ageGroups[ageRange].other += value;
        totalOther += value;
      }
    }

    const sortedAgeRanges = Object.keys(ageGroups).sort((a, b) => {
      const aStart = parseInt(a.split("-")[0]) || 0;
      const bStart = parseInt(b.split("-")[0]) || 0;
      return aStart - bStart;
    });

    const total = totalMale + totalFemale + totalOther;

    return {
      ageGroups,
      sortedAgeRanges,
      totalMale,
      totalFemale,
      totalOther,
      total,
      malePercent: total > 0 ? ((totalMale / total) * 100).toFixed(1) : "0",
      femalePercent: total > 0 ? ((totalFemale / total) * 100).toFixed(1) : "0",
    };
  }, [data?.genderAge]);

  const topCities = useMemo(
    () => (data?.topCities ? topEntries(data.topCities, 10) : []),
    [data?.topCities],
  );

  const topCountries = useMemo(
    () => (data?.topCountries ? topEntries(data.topCountries, 10) : []),
    [data?.topCountries],
  );

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasAnyData =
    genderAgeData || topCities.length > 0 || topCountries.length > 0;

  if (!hasAnyData) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 text-center">
        <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          No demographic data available yet.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Requires 100+ followers. Data updates on sync.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Audience Demographics
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender & Age */}
        {genderAgeData && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                Gender & Age
              </h3>
            </div>

            {/* Gender Summary */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-blue-600">Male</span>
                  <span className="font-bold text-blue-600">
                    {genderAgeData.malePercent}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${genderAgeData.malePercent}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-pink-600">Female</span>
                  <span className="font-bold text-pink-600">
                    {genderAgeData.femalePercent}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${genderAgeData.femalePercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Age Range Bars */}
            <div className="space-y-2.5">
              {genderAgeData.sortedAgeRanges.map((ageRange) => {
                const group = genderAgeData.ageGroups[ageRange];
                const groupTotal = group.male + group.female + group.other;
                const pct =
                  genderAgeData.total > 0
                    ? (groupTotal / genderAgeData.total) * 100
                    : 0;

                return (
                  <div key={ageRange} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-12 shrink-0">
                      {ageRange}
                    </span>
                    <div className="flex-1 flex h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      {group.male > 0 && (
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(group.male / groupTotal) * 100}%`,
                          }}
                        />
                      )}
                      {group.female > 0 && (
                        <div
                          className="h-full bg-pink-500"
                          style={{
                            width: `${(group.female / groupTotal) * 100}%`,
                          }}
                        />
                      )}
                      {group.other > 0 && (
                        <div
                          className="h-full bg-gray-400"
                          style={{
                            width: `${(group.other / groupTotal) * 100}%`,
                          }}
                        />
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-12 text-right">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Countries */}
        {topCountries.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-gray-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                Top Countries
              </h3>
            </div>
            <div className="space-y-3">
              {topCountries.map(([country, count], idx) => {
                const maxVal = topCountries[0][1];
                const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;

                return (
                  <div key={country} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-12 shrink-0">
                      {country}
                    </span>
                    <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-14 text-right">
                      {count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Cities */}
        {topCities.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-gray-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                Top Cities
              </h3>
            </div>
            <div className="space-y-3">
              {topCities.map(([city, count], idx) => {
                const maxVal = topCities[0][1];
                const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;

                return (
                  <div key={city} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4">
                      {idx + 1}
                    </span>
                    <span
                      className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-28 shrink-0 truncate"
                      title={city}
                    >
                      {city}
                    </span>
                    <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-14 text-right">
                      {count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
