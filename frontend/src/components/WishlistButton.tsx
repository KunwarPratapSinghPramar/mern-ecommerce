import { useState } from "react";
import { Heart } from "lucide-react";
import { addWishlistItem } from "../services/wishlistApi";

interface WishlistButtonProps {
  productId: string;
}

export default function WishlistButton({ productId }: WishlistButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (loading || added) return;

    try {
      setLoading(true);
      setError("");

      await addWishlistItem(productId);

      setAdded(true);
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch {
      setError("Could not add this product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={loading || added}
        aria-label={added ? "Added to wishlist" : "Add to wishlist"}
        className="inline-flex items-center gap-2 rounded-lg border border-pink-200 px-3 py-2 text-sm font-medium text-pink-700 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Heart size={17} fill={added ? "currentColor" : "none"} />
        {loading ? "Saving..." : added ? "Added" : "Add to Wishlist"}
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
