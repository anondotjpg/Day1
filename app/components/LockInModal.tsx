export function LockInModal({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-[280px] rounded-2xl bg-[#1c1c1f]/90 backdrop-blur-xl p-6 text-center">
        <p className="text-zinc-200 text-sm font-medium mb-4">Are you locked in?</p>
        <button onClick={onConfirm} className="w-full rounded-full py-2.5 bg-[#2c2c2e] text-white hover:bg-[#3a3a3c] transition cursor-pointer">
          Yes
        </button>
      </div>
    </div>
  );
}