'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, PieChart, List, LogOut, Menu, X, RefreshCw, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/categories', label: 'Categories', icon: PieChart },
  { href: '/transactions', label: 'Transactions', icon: List },
]

export function Nav() {
  const pathname = usePathname()
  const { signOut, isExpiring, refreshSession } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {isExpiring && (
        <div className="bg-amber-500 text-white px-4 py-1 text-xs font-medium flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Session expiring soon</span>
          <button 
            onClick={refreshSession}
            className="underline underline-offset-2 hover:text-amber-100 flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      )}
      <div className="container px-4 md:px-6 lg:px-8 mx-auto max-w-7xl flex h-14 items-center">
        <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-lg">Finance Explorer</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Sign Out */}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="hidden md:flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>

        {/* Mobile Menu Button */}
        <button
          className="ml-auto md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t bg-background px-4 md:px-6 lg:px-8 mx-auto max-w-7xl py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              signOut()
              setMobileMenuOpen(false)
            }}
            className="w-full justify-start gap-3 px-3"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </nav>
      )}
    </header>
  )
}
