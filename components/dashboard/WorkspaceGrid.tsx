"use client";
import WorkspaceCard from "./WorkspaceCard";

type Workspace = { id: string; name: string };

// Workspaces grid component
export default function WorkspacesGrid({
  workspaces,
  loading,
  error,
  success,
  onCreateWorkspace,
  onDeleteWorkspace
}: {
  workspaces: Workspace[];
  loading: boolean;
  error: string;
  success: string;
  onCreateWorkspace: () => void;
  onDeleteWorkspace: (id: string) => void;
}) {
  return (
    <main className="flex-1 p-8">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-8"
        onClick={onCreateWorkspace}
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Workspace"}
      </button>

      {error && <div className="text-red-500 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">{success}</div>}

      <h3 className="text-xl font-semibold mt-8 mb-4">Your Workspaces</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {workspaces.length === 0 && (
          <div className="text-gray-400 col-span-full">No workspaces</div>
        )}
        {workspaces.map((ws) => (
          <WorkspaceCard key={ws.id} workspace={ws} onDeleteWorkspace={onDeleteWorkspace} />
        ))}
      </div>
    </main>
  );
}