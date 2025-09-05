"use client";

const SkeletonProductCard = () => (
  <div className="card card-border border-[#e1e1e1] bg-white rounded-none animate-pulse">
    <div className="card-body">
      <div className="w-full h-48 bg-gray-200 rounded-none mb-2"></div>
      <div className="flex gap-2 text-xs mb-2">
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
        <div className="h-4 w-10 bg-gray-200 rounded"></div>
      </div>
      <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 rounded-full bg-gray-200"></div>
        <div className="w-4 h-4 rounded-full bg-gray-200"></div>
        <div className="w-4 h-4 rounded-full bg-gray-200"></div>
      </div>
      <div className="flex justify-center">
        <div className="h-10 w-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

export default SkeletonProductCard;
