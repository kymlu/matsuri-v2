export default function PositionHint () {
return (
  <div className="fixed bottom-3 left-3 z-10 w-56 rounded-lg border border-primary bg-white/90 shadow-lg backdrop-blur p-3 text-sm text-gray-800">
    {/* Header */}
    <div className="flex mb-2 border-b border-gray-200 pb-1">
      <span className="font-semibold text-base">田中</span>
    </div>

    {/* Position info */}
    <div className="space-y-1 mb-2">
      <div className="flex justify-between">
        <span className="text-gray-500">現在</span>
        <span className="font-medium">←5m ↕︎6m</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">次(サビ)</span>
        <span className="font-medium">5m / 2m</span>
      </div>
    </div>

    {/* Count / actions */}
    <div className="border-t border-gray-200 pt-2 space-y-1">
      <div className="text-gray-500">カウント</div>
      <div className="flex justify-between pl-2">
        <span>アクション 1</span>
        <span className="font-medium">2と</span>
      </div>
      <div className="flex justify-between pl-2">
        <span>アクション 2</span>
        <span className="font-medium">5</span>
      </div>
    </div>
  </div>
  );
} 