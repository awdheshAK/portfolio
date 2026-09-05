'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count: { videos: number };
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);

  function load() {
    fetch('/api/admin/tags')
      .then((r) => r.json())
      .then((d) => setTags(d.tags));
  }

  useEffect(load, []);

  async function remove(id: string) {
    if (!confirm('Delete this tag?')) return;
    await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' });
    toast.success('Tag deleted');
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tags</h1>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t.id}
            className="flex items-center gap-2 rounded-full bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-sm"
          >
            #{t.name} <span className="text-surface-400">({t._count.videos})</span>
            <button onClick={() => remove(t.id)} className="text-red-400 hover:text-red-600">
              <Trash2 size={13} />
            </button>
          </span>
        ))}
        {tags.length === 0 && <p className="text-sm text-surface-400">No tags yet.</p>}
      </div>
    </div>
  );
}
