export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer style={{
      padding: '30px 24px 28px',
      textAlign: 'center',
      fontSize: '14px',
      color: 'var(--muted-foreground)',
      marginTop: 'auto',
      opacity: 0.9,
    }}>
      <p>
        © {currentYear} Recipe Forum · All rights reserved {' · '}
        <a href="mailto:sailingesh664@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>
          Support
        </a>
      </p>
    </footer>
  )
}