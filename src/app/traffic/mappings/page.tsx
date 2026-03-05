"use client";

import { useState, useEffect } from "react";
import {
  fetchPageMappings,
  createPageMapping,
  deletePageMapping,
} from "@/lib/api";
import { MappingEntry } from "@/data/page-mapping";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface MappingWithId extends MappingEntry {
  id?: number;
}

export default function PageMappingsSettings() {
  const [mappings, setMappings] = useState<MappingWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [newPlatform, setNewPlatform] = useState("Facebook");
  const [newPageName, setNewPageName] = useState("");
  const [newUtmSource, setNewUtmSource] = useState("fb");
  const [newMediums, setNewMediums] = useState("");

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    const data = await fetchPageMappings();
    setMappings(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageName || !newMediums) return;

    const mediumsArray = newMediums
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const newEntry: MappingEntry = {
      category: newCategory || "Uncategorized",
      platform: newPlatform,
      pageName: newPageName,
      utmSource: newUtmSource,
      utmMediums: mediumsArray,
    };

    try {
      await createPageMapping(newEntry);
      setNewPageName("");
      setNewMediums("");
      loadMappings();
    } catch (err) {
      console.error("Failed to add mapping", err);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this mapping?")) {
      await deletePageMapping(id);
      loadMappings();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-8 text-gray-900 dark:text-gray-100 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/traffic"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold">UTM Page Mappings</h1>
        </div>

        {/* Add New Form */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Add New Mapping</h2>
          <form
            onSubmit={handleAdd}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end"
          >
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">
                Category
              </label>
              <input
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. USS"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">
                Platform
              </label>
              <select
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
              >
                <option value="Facebook">Facebook</option>
                <option value="Threads">Threads</option>
              </select>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs font-bold uppercase text-gray-500">
                Page Name
              </label>
              <input
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                placeholder="Display Name"
              />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs font-bold uppercase text-gray-500">
                UTM Mediums (comma separated)
              </label>
              <input
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                value={newMediums}
                onChange={(e) => setNewMediums(e.target.value)}
                placeholder="uss_page_1, uss_page_2"
              />
            </div>
            <div className="lg:col-span-6 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" /> Add Mapping
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Page Name</th>
                <th className="px-6 py-4">UTM Mediums</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    Loading mappings...
                  </td>
                </tr>
              ) : (
                mappings.map((m) => (
                  <tr
                    key={m.id || m.pageName}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 font-medium">{m.category}</td>
                    <td className="px-6 py-4">{m.platform}</td>
                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                      {m.pageName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {m.utmMediums.map((med) => (
                          <span
                            key={med}
                            className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-700"
                          >
                            {med}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
