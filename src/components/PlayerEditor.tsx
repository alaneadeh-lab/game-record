// src/components/PlayerEditor.tsx
import React, { useEffect, useState, useCallback } from "react";
import type { Player } from "../types";
import { compressImage, isImageTooLarge } from "../utils/imageCompression";

interface PlayerEditorProps {
  player: Player;
  onSave: (updates: Partial<Player>) => void;
  onCancel: () => void;
}

export const PlayerEditor: React.FC<PlayerEditorProps> = ({
  player,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(player.name || "");
  const [photoPreview, setPhotoPreview] = useState<string>(player.photo || "");
  const [photoUrl, setPhotoUrl] = useState<string>("");

  // Keep local state in sync when editing a different player
  useEffect(() => {
    setName(player.name || "");
    setPhotoPreview(player.photo || "");
    setPhotoUrl("");
  }, [player.id, player.name, player.photo]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === "string") {
          let base64 = reader.result;
          
          // Compress if image is too large
          if (isImageTooLarge(base64)) {
            try {
              base64 = await compressImage(base64);
              console.log('✅ Image compressed for storage');
            } catch (error) {
              console.error('Failed to compress image:', error);
              alert('Image is very large. Please use a smaller image or it may not save properly.');
            }
          }
          
          setPhotoPreview(base64);
        }
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Optional: allow paste image (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;
      const item = Array.from(items).find((it) => it.type.startsWith("image/"));
      if (!item) return;
      const file = item.getAsFile();
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === "string") {
          let base64 = reader.result;
          
          // Compress if image is too large
          if (isImageTooLarge(base64)) {
            try {
              base64 = await compressImage(base64);
              console.log('✅ Image compressed for storage');
            } catch (error) {
              console.error('Failed to compress image:', error);
              alert('Image is very large. Please use a smaller image or it may not save properly.');
            }
          }
          
          setPhotoPreview(base64);
        }
      };
      reader.readAsDataURL(file);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      alert('Please enter a player name');
      return;
    }

    const updates: Partial<Player> = {
      name: trimmedName,
      photo: photoPreview || player.photo || undefined,
    };

    console.log('💾 Saving player:', updates);
    onSave(updates);
  };

  const handleApplyUrl = () => {
    if (!photoUrl.trim()) return;
    setPhotoPreview(photoUrl.trim());
  };

  const handleClearPhoto = () => {
    setPhotoPreview("");
    setPhotoUrl("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Name */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Player Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border-2 border-gray-300 px-3 py-2 text-base shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Photo preview + upload */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Player Photo
        </label>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shadow-md bg-gray-100 flex items-center justify-center">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt={name || player.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-400 text-center px-1">
                No photo
              </span>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <div className="flex gap-2">
              <label className="flex-1 inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-3d hover:bg-blue-700 cursor-pointer">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <button
                type="button"
                onClick={handleClearPhoto}
                className="inline-flex items-center justify-center rounded-xl bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 shadow hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Or paste an image (Ctrl+V / Cmd+V) while this window is focused.
            </p>
          </div>
        </div>

        {/* Optional URL input */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Or enter photo URL</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="flex-1 rounded-xl border-2 border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700"
            >
              Use
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-3d hover:shadow-3d-hover"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};