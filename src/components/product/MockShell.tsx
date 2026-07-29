interface MockShellProps {
  url: string;
  children: React.ReactNode;
}

export function MockShell({ url, children }: MockShellProps) {
  return (
    <div
      className="rounded-[14px] overflow-hidden"
      style={{
        background: '#f7f4ee',
        boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
      }}
    >
      {/* Chrome bar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{
          background: '#eeebe0',
          borderBottom: '1px solid rgba(12,14,26,0.08)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <div
          className="mx-auto px-4 py-1 rounded-md"
          style={{
            background: 'rgba(12,14,26,0.04)',
            border: '1px solid rgba(12,14,26,0.06)',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            color: '#787a92',
          }}
        >
          {url}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[75vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
