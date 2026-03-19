import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <Button variant="ghost" asChild className="-ml-4">
          <Link href="/login" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </Button>

        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </header>

        <section className="space-y-4 text-pretty">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Personal Finance Explorer, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the application.
          </p>

          <h2 className="text-xl font-semibold">2. Description of Service</h2>
          <p>
            Personal Finance Explorer is a tool designed to help users visualize and analyze their personal
            financial data stored in Google Sheets. The application provides dashboards, charts, and transaction
            management features.
          </p>

          <h2 className="text-xl font-semibold">3. User Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your Google account credentials.
            You agree to use the application only for lawful purposes and in a way that does not infringe
            upon the rights of others.
          </p>

          <h2 className="text-xl font-semibold">4. Data Ownership and Privacy</h2>
          <p>
            You retain all rights to your data. Personal Finance Explorer does not store your financial
            transactions on its servers. Data is fetched directly from your Google Sheets and processed
            in your browser or temporary server memory for display purposes.
          </p>

          <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
          <p>
            Personal Finance Explorer is provided "as is" without any warranties. We are not liable for any
            financial losses, data loss, or other damages resulting from the use of this application.
          </p>

          <h2 className="text-xl font-semibold">6. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Your continued use of the application
            after changes are posted constitutes your acceptance of the new terms.
          </p>
        </section>

        <footer className="pt-8 border-t text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Personal Finance Explorer. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
