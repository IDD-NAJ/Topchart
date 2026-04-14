"use client"

import React from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowLeft, Shield, Users, CreditCard, Mail, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--marketing-cream)] selection:bg-[color:var(--marketing-accent)]/15">
      <Header />

      <main className="flex-1 px-4 pb-12 pt-[calc(72px+1.5rem)]">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
          {/* Header */}
          <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
            <div>
              <h1 className="font-heading text-3xl font-normal text-foreground">Terms of Service</h1>
              <p className="text-muted-foreground mt-2 font-body">Last updated: January 18, 2026</p>
            </div>
            <Link href="/register">
              <Button variant="outline" size="sm" className="rounded-xl transition-all duration-300" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Registration
              </Button>
            </Link>
          </div>

        {/* Introduction */}
        <Card className="animate-fade-in border-border/50 hover:border-[color:var(--marketing-accent)]/20 transition-all duration-300" style={{ transitionTimingFunction: 'var(--ease-out-expo)', animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-xl font-normal">
              <Shield className="w-5 h-5 text-[color:var(--marketing-accent)]" />
              Welcome to Topchart
            </CardTitle>
            <CardDescription className="font-body">
              These terms and conditions outline the rules and regulations for the use of Topchart's services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              By accessing and using Topchart, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
            <p>
              Topchart is a platform that allows users to purchase airtime, data bundles, and other telecommunication services in Ghana.
            </p>
          </CardContent>
        </Card>

        {/* Key Terms */}
        <div className="grid gap-6 md:grid-cols-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Card className="animate-fade-in border-border/50 hover:border-[color:var(--marketing-accent)]/20 transition-all duration-300" style={{ animationDelay: '400ms', transitionTimingFunction: 'var(--ease-out-expo)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-lg font-normal">
                <Users className="w-5 h-5 text-[color:var(--marketing-accent)]" />
                User Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• You must be at least 18 years old to create an account</li>
                <li>• You are responsible for maintaining account security</li>
                <li>• You must provide accurate and complete information</li>
                <li>• One account per person is allowed</li>
                <li>• You agree to receive transaction notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="animate-in fade-in slide-in-from-right-4 duration-500 delay-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5" />
                Payments & Refunds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• All payments are processed through secure payment gateways</li>
                <li>• Prices are subject to change without notice</li>
                <li>• Refunds are handled on a case-by-case basis</li>
                <li>• Failed transactions will be automatically refunded</li>
                <li>• You are responsible for payment method security</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Service Terms */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Service Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Acceptable Use</h3>
              <p className="text-sm text-muted-foreground">
                You agree to use our services only for lawful purposes and in accordance with these Terms.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Service Availability</h3>
              <p className="text-sm text-muted-foreground">
                We strive to maintain high service availability but cannot guarantee 100% uptime due to technical factors.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Limitation of Liability</h3>
              <p className="text-sm text-muted-foreground">
                Topchart shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Termination</h3>
              <p className="text-sm text-muted-foreground">
                We reserve the right to terminate or suspend accounts that violate these terms.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-3 space-y-1">
              <p className="text-sm">Email: support@Topchart.com</p>
              <p className="text-sm">Phone: +233 24 123 4567</p>
              <p className="text-sm">Address: Accra, Ghana</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>

    <Footer />
  </div>
)
}
