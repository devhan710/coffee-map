export type Menu = {
  name: string;
  evidenceCount?: number;
  label?: string;
};

export type MenuEvidence = {
  url: string;
  title: string;
  kind: "official" | "menu" | "review" | "search";
  note?: string;
};

export type Cafe = {
  id: string;
  name: string;
  address: string;
  roadAddress?: string;
  lat: number;
  lng: number;
  photoThumb?: string;
  photoSourceUrl?: string;
  photoKind?: "menu-item" | "menu-board";
  dong: string;
  signature: Menu | null;
  candidates?: Menu[];
  evidence?: MenuEvidence[];
  verification: {
    confidence: "high" | "medium" | "low" | "unverified";
    checkedAt: string;
    notes?: string;
  };
};
