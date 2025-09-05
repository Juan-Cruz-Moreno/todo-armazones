"use client";
import SkeletonProductCard from "../molecules/SkeletonProductCard";

const SKELETON_COUNT = 8;

export default function SkeletonProductList() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-0">
      {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
        <SkeletonProductCard key={idx} />
      ))}
    </div>
  );
}
