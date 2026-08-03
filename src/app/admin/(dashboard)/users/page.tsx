export default function AdminUsersPage() {
  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">จัดการผู้ใช้ (Manage Users)</h1>
        <p className="admin-page-desc">ระบบจัดการและดูแลบัญชีผู้ใช้งานในระบบ Prompty</p>
      </div>

      <div className="admin-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          ระบบจัดการผู้ใช้
        </h2>
        <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
          ส่วนนี้อยู่ในระหว่างการพัฒนา จะพร้อมใช้งานในเวอร์ชันถัดไป
        </p>
      </div>
    </div>
  );
}
