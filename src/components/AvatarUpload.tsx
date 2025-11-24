import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';

interface AvatarUploadProps {
  userId: string;
  onUpload?: (url: string) => void;
  className?: string;
}

export default function AvatarUpload({ userId, onUpload, className = '' }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) downloadAvatar();
  }, [userId]);

  async function downloadAvatar() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error downloading avatar:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la photo de profil',
        variant: 'destructive',
      });
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Veuillez sélectionner une image');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Vérifier le type de fichier
      if (!file.type.match('image.*')) {
        throw new Error('Veuillez sélectionner une image valide (JPEG, PNG, GIF)');
      }

      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('La taille de l\'image ne doit pas dépasser 2MB');
      }

      // Supprimer l'ancien avatar s'il existe
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        await supabase.storage
          .from('avatars')
          .remove([`${userId}/${oldPath}`]);
      }

      // Télécharger le nouvel avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Mettre à jour le profil avec la nouvelle URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      if (onUpload) onUpload(publicUrl);

      toast({
        title: 'Succès',
        description: 'Photo de profil mise à jour avec succès',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-32 h-32 mb-4">
        <img
          src={avatarUrl || '/default-avatar.png'}
          alt="Photo de profil"
          className="w-full h-full rounded-full object-cover border-2 border-gray-200"
        />
      </div>
      <div className="relative">
        <label
          className={`px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          htmlFor="single"
        >
          {uploading ? 'Téléchargement...' : 'Changer la photo'}
        </label>
        <input
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
