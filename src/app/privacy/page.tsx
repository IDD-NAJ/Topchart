"use client"



import React from "react"

import Link from "next/link"

import { Header } from "@/components/header"

import { Footer } from "@/components/footer"

import { ArrowLeft, Shield, Database, Eye, Lock, Share2, Cookie, Trash2, Phone, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"



export default function PrivacyPage() {

  return (

    <div className="min-h-screen flex flex-col bg-background selection:bg-[#006994]/15 selection:text-foreground">

      <Header />

      

      <main className="flex-1 pt-32 pb-12 px-4">

        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">

          {/* Header */}

          <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500 delay-100">

            <div>

              <h1 className="font-heading text-3xl font-normal text-foreground">Privacy Policy</h1>

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

        <Card className="animate-fade-in border-border/50 hover:border-[#006994]/20 transition-all duration-300" style={{ transitionTimingFunction: 'var(--ease-out-expo)', animationDelay: '200ms' }}>

          <CardHeader>

            <CardTitle className="flex items-center gap-2 font-heading text-xl font-normal">

              <Shield className="w-5 h-5 text-[#006994]" />

              Your Privacy Matters

            </CardTitle>

            <CardDescription className="font-body">

              Topchart is committed to protecting your personal information and privacy.

            </CardDescription>

          </CardHeader>

          <CardContent className="space-y-4 font-body">

            <p>

              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Topchart service.

            </p>

            <p>

              By using Topchart, you consent to the collection and use of information in accordance with this policy.

            </p>

          </CardContent>

        </Card>



        {/* Information We Collect */}

        <Card className="border-border/50 hover:border-[#006994]/20 transition-all duration-300">

          <CardHeader>

            <CardTitle className="flex items-center gap-2 font-heading text-xl font-normal">

              <Database className="w-5 h-5 text-[#006994]" />

              Information We Collect

            </CardTitle>

          </CardHeader>

          <CardContent className="space-y-6">

            <div>

              <h3 className="font-semibold mb-3">Personal Information</h3>

              <ul className="space-y-2 text-sm text-muted-foreground">

                <li>• Full name (first name, last name)</li>

                <li>• Email address</li>

                <li>• Phone number</li>

                <li>• Payment information (processed securely)</li>

                <li>• Transaction history</li>

              </ul>

            </div>

            

            <div>

              <h3 className="font-semibold mb-3">Technical Information</h3>

              <ul className="space-y-2 text-sm text-muted-foreground">

                <li>• IP address</li>

                <li>• Device information</li>

                <li>• Browser type and version</li>

                <li>• Operating system</li>

                <li>• Usage data and analytics</li>

              </ul>

            </div>

          </CardContent>

        </Card>



        {/* How We Use Your Information */}

        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">

          <Card className="animate-in fade-in slide-in-from-left-4 duration-500 delay-500">

            <CardHeader>

              <CardTitle className="flex items-center gap-2 text-lg">

                <Eye className="w-5 h-5" />

                How We Use Your Information

              </CardTitle>

            </CardHeader>

            <CardContent className="space-y-3">

              <ul className="space-y-2 text-sm text-muted-foreground">

                <li>• Process transactions</li>

                <li>• Send transaction confirmations</li>

                <li>• Provide customer support</li>

                <li>• Improve our services</li>

                <li>• Send important notifications</li>

                <li>• Detect and prevent fraud</li>

              </ul>

            </CardContent>

          </Card>



          <Card className="animate-in fade-in slide-in-from-right-4 duration-500 delay-600">

            <CardHeader>

              <CardTitle className="flex items-center gap-2 text-lg">

                <Lock className="w-5 h-5" />

                Data Protection

              </CardTitle>

            </CardHeader>

            <CardContent className="space-y-3">

              <ul className="space-y-2 text-sm text-muted-foreground">

                <li>• SSL encryption for all data</li>

                <li>• Secure payment processing</li>

                <li>• Regular security audits</li>

                <li>• Limited employee access</li>

                <li>• Secure data storage</li>

                <li>• Compliance with data laws</li>

              </ul>

            </CardContent>

          </Card>

        </div>



        {/* Data Sharing */}

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">

          <CardHeader>

            <CardTitle className="flex items-center gap-2">

              <Share2 className="w-5 h-5" />

              Information Sharing

            </CardTitle>

          </CardHeader>

          <CardContent className="space-y-4">

            <p className="text-sm text-muted-foreground">

              We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:

            </p>

            <ul className="space-y-2 text-sm text-muted-foreground">

              <li>• Payment processors for transaction completion</li>

              <li>• Telecommunication providers for service delivery</li>

              <li>• Legal authorities when required by law</li>

              <li>• Service providers who assist in operating our service</li>

            </ul>

          </CardContent>

        </Card>



        {/* Cookies and Tracking */}

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600">

          <CardHeader>

            <CardTitle className="flex items-center gap-2">

              <Cookie className="w-5 h-5" />

              Cookies and Tracking

            </CardTitle>

          </CardHeader>

          <CardContent className="space-y-4">

            <p className="text-sm text-muted-foreground">

              We use cookies and similar tracking technologies to enhance your experience:

            </p>

            <ul className="space-y-2 text-sm text-muted-foreground">

              <li>• Essential cookies for service functionality</li>

              <li>• Authentication cookies for secure login</li>

              <li>• Analytics cookies to improve our service</li>

              <li>• You can control cookies through your browser settings</li>

            </ul>

          </CardContent>

        </Card>



        {/* Data Retention */}

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">

          <CardHeader>

            <CardTitle className="flex items-center gap-2">

              <Trash2 className="w-5 h-5" />

              Data Retention

            </CardTitle>

          </CardHeader>

          <CardContent className="space-y-4">

            <p className="text-sm text-muted-foreground">

              We retain your personal information only as long as necessary for the purposes outlined in this policy:

            </p>

            <ul className="space-y-2 text-sm text-muted-foreground">

              <li>• Account information: Until account deletion</li>

              <li>• Transaction records: 7 years for legal compliance</li>

              <li>• Support tickets: 2 years</li>

              <li>• Analytics data: 13 months</li>

            </ul>

          </CardContent>

        </Card>



        {/* Your Rights */}

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-800">

          <CardHeader>

            <CardTitle>Your Privacy Rights</CardTitle>

          </CardHeader>

          <CardContent className="space-y-4">

            <p className="text-sm text-muted-foreground">

              You have the following rights regarding your personal information:

            </p>

            <ul className="space-y-2 text-sm text-muted-foreground">

              <li>• Access to your personal data</li>

              <li>• Correction of inaccurate data</li>

              <li>• Deletion of your account and data</li>

              <li>• Restriction of processing</li>

              <li>• Data portability</li>

              <li>• Opt-out of marketing communications</li>

            </ul>

          </CardContent>

        </Card>



        {/* Contact */}

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-900">

          <CardHeader>

            <CardTitle className="flex items-center gap-2">

              <Phone className="w-5 h-5" />

              Contact Us

            </CardTitle>

          </CardHeader>

          <CardContent>

            <p className="text-sm text-muted-foreground">

              If you have any questions about this Privacy Policy or want to exercise your rights, please contact us:

            </p>

            <div className="mt-3 space-y-1">

              <p className="text-sm">Email: privacy@Topchart.com</p>

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

