'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  order: number;
  _count: { videos: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories));
  }

  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setName('');
      setDescription('');
      setImageUrl('');
      toast.success('Category created');
      load();
    } catch (err: any) {
      toast.error(err.message ?? 'Could not create category.');
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this category? Videos will become uncategorized.')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    toast.success('Category deleted');
    load();
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...categories];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next);
    await fetch('/api/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: next.map((c) => c.id) }),
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      <form onSubmit={create} className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-xl border border-surface-200 dark:border-surface-800 p-4">
        <FormField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <FormField label="Image URL (optional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        <FormField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="sm:col-span-3">
          <Button type="submit" loading={creating}>
            <Plus size={15} /> Add category
          </Button>
        </div>
      </form>

      <div className="divide-y divide-surface-100 dark:divide-surface-800 rounded-xl border border-surface-200 dark:border-surface-800">
        {categories.map((c, i) => (
          <div key={c.id} className="flex items-center gap-4 p-4">
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-surface-400 disabled:opacity-30">
                <ArrowUp size={14} />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === categories.length - 1} className="text-surface-400 disabled:opacity-30">
                <ArrowDown size={14} />
              </button>
            </div>
            {c.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-surface-400">
                {c._count.videos} videos · /{c.slug}
              </p>
            </div>
            <button onClick={() => remove(c.id)} className="text-red-400 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {categories.length === 0 && <p className="p-4 text-sm text-surface-400">No categories yet.</p>}
      </div>
    </div>
  );
}
