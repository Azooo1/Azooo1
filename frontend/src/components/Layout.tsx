import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ChatWidget from './ChatWidget'
import { THEME_STYLE } from '../data/site'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#141c2a] text-gray-200 overflow-x-hidden" style={THEME_STYLE}>
      <Navbar
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((v) => !v)}
        onOpenChat={() => setChatOpen(true)}
      />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
