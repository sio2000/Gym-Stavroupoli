import React, { useEffect, useState } from 'react';
import { Image, Plus, Loader2, Trash2, Eye, EyeOff, RefreshCw, Link as LinkIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Banner,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadBannerImage
} from '@/utils/bannersApi';

const AdminBannersManager: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [backendMissing, setBackendMissing] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAllBanners();
      setBanners(data);
    } catch (err) {
      console.error('Load banners error', err);
      if (err instanceof Error && err.message?.includes('Table banners missing')) {
        setBackendMissing(true);
      }
      toast.error('Σφάλμα φόρτωσης banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Επίλεξε εικόνα (1080x1080)');
      return;
    }
    try {
      setCreating(true);
      const imageUrl = await uploadBannerImage(file);
      await createBanner({
        title: title || undefined,
        image_url: imageUrl,
        target_url: targetUrl || undefined
      });
      toast.success('Το banner δημιουργήθηκε');
      setTitle('');
      setTargetUrl('');
      setFile(null);
      await load();
    } catch (err) {
      console.error('Create banner error', err);
      toast.error('Σφάλμα δημιουργίας banner');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      await updateBanner(banner.id, { is_active: !banner.is_active });
      await load();
    } catch (err) {
      console.error('Toggle banner error', err);
      toast.error('Σφάλμα ενημέρωσης banner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Να διαγραφεί το banner;')) return;
    try {
      await deleteBanner(id);
      await load();
    } catch (err) {
      console.error('Delete banner error', err);
      toast.error('Σφάλμα διαγραφής banner');
    }
  };

  const handleOrderChange = async (id: string, order: number) => {
    try {
      await updateBanner(id, { display_order: order });
      await load();
    } catch (err) {
      console.error('Order update error', err);
      toast.error('Σφάλμα σειράς εμφάνισης');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 sm:p-6 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Image className="h-5 w-5" /> Διαχείριση Banners (μέχρι 5)
          </h2>
          <p className="text-sm text-blue-100">Ανεβάστε εικόνα 1080x1080 και ορίστε προαιρετικό link.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg text-white hover:bg-white/30"
        >
          <RefreshCw className="h-4 w-4" /> Ανανέωση
        </button>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4 shadow">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-700 font-medium">Τίτλος (προαιρετικό)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="π.χ. Νέα προσφορά"
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 font-medium flex items-center gap-1">
              <LinkIcon className="h-4 w-4" /> Σύνδεσμος (προαιρετικό)
            </label>
            <input
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 font-medium flex items-center gap-1">
              <Upload className="h-4 w-4" /> Εικόνα 1080x1080
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 w-full"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Προσθήκη Banner
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Image className="h-5 w-5 text-blue-500" /> Υπάρχοντα Banners
        </h3>
        {backendMissing ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
            <p>Δεν υπάρχει ο πίνακας <code>banners</code> στο Supabase.</p>
            <p>Δημιούργησε τον με πεδία: id uuid PK (default uuid_generate_v4), title text, image_url text, target_url text, display_order int, is_active bool (default true), created_at timestamptz default now(), updated_at timestamptz.</p>
            <p>Μετά πάτησε “Ανανέωση”.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Φόρτωση...
          </div>
        ) : banners.length === 0 ? (
          <div className="text-gray-500">Δεν υπάρχουν banners.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div key={b.id} className="border rounded-lg overflow-hidden shadow-sm">
                <img src={b.image_url} alt={b.title || 'Banner'} className="w-full h-40 object-cover" />
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{b.title || 'Χωρίς τίτλο'}</div>
                      <div className="text-xs text-gray-500">Σειρά: {b.display_order}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(b)}
                        className={`px-2 py-1 rounded text-xs ${
                          b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {b.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {b.target_url && (
                    <a href={b.target_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                      {b.target_url}
                    </a>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Σειρά εμφάνισης</span>
                    <input
                      type="number"
                      value={b.display_order}
                      onChange={(e) => handleOrderChange(b.id, Number(e.target.value))}
                      className="w-20 border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBannersManager;

