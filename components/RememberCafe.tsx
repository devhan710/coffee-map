"use client";

import { useEffect } from "react";
import { rememberCafe } from "@/lib/recent-cafes";

type RememberCafeProps = {
  cafeId: string;
};

export function RememberCafe({ cafeId }: RememberCafeProps) {
  useEffect(() => {
    rememberCafe(cafeId);
  }, [cafeId]);

  return null;
}
