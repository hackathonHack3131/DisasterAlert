export default function OtpModal({ email, onVerify, onClose, loading, error }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    const otp = e.target.otp.value
    onVerify(otp)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="glass max-w-md w-full rounded-2xl p-8 shadow-glow">
        <h2 className="text-2xl font-bold text-headline">Verify Email</h2>
        <p className="text-body mt-2 text-sm">OTP sent to {email}. Expires in 5 minutes.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            name="otp"
            maxLength={6}
            placeholder="6-digit OTP"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-center text-2xl tracking-[0.5em] focus:border-accent-blue outline-none"
            required
          />
          {error && <p className="text-neon-red text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/20 text-body hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-accent-blue font-medium disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
