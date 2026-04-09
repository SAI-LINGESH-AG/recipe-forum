export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer style={{
      borderTop: '1px solid #e5e7eb',
      padding: '24px',
      textAlign: 'center',
      fontSize: '14px',
      color: 'gray',
      marginTop: 'auto',
    }}>
      <p>© {currentYear} Sai Lingesh. All rights reserved.</p>
      <p style={{ marginTop: '8px' }}>
        <a href="/" style={{ color: 'gray', textDecoration: 'none', marginRight: '16px' }}>Home</a>
        <a href="/about" style={{ color: 'gray', textDecoration: 'none', marginRight: '16px' }}>About</a>
        <a href="/privacy" style={{ color: 'gray', textDecoration: 'none' }}>Privacy Policy</a>
      </p>
    </footer>
  )
}