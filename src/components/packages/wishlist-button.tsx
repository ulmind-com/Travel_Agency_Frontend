import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import { apiErrorMessage } from "@/lib/api";
import { wishlistQuery } from "@/lib/queries";
import { wishlistService } from "@/services/wishlist.service";
import { cn } from "@/lib/utils";

export function WishlistButton({ packageId }: { packageId: string }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const { data: wishlist } = useQuery({
    ...wishlistQuery(),
    enabled: isAuthenticated,
  });
  const active = Boolean(wishlist?.some((p) => p.id === packageId));

  const mutation = useMutation({
    mutationFn: () => wishlistService.toggle(packageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(active ? "Removed from wishlist" : "Saved to wishlist");
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not update wishlist")),
  });

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
          toast.info("Sign in to save escapes to your wishlist.");
          return;
        }
        mutation.mutate();
      }}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-cream-50/85 text-ink-900 backdrop-blur transition-transform hover:scale-105 active:scale-95",
        active && "text-destructive",
      )}
    >
      <Heart className={cn("size-4", active && "fill-current")} />
    </button>
  );
}