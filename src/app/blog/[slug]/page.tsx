"use client"

import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Calendar, User, ArrowLeft, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { notFound } from "next/navigation"

const posts = [
  {
    slug: "new-data-bundles-2026",
    title: "Expanding our Network: New Data Bundles for 2026",
    excerpt: "We are excited to announce a range of new, more affordable data bundles across all networks.",
    content: `
      <p>We're thrilled to announce a major expansion of our data bundle offerings across all major networks in Ghana. Starting this month, Topchart users will have access to a wider range of data packages designed to meet every need and budget.</p>
      
      <h3>What's New?</h3>
      <p>We've worked closely with MTN, Vodafone, and AirtelTigo to bring you:</p>
      <ul>
        <li>More affordable daily bundles starting from just GH₵1</li>
        <li>Flexible weekly packages for moderate users</li>
        <li>Enhanced monthly plans with bonus data</li>
        <li>Special night bundles for heavy downloaders</li>
      </ul>

      <h3>Better Value for Everyone</h3>
      <p>Whether you're a student on a budget, a professional needing constant connectivity, or a family looking for shared data plans, we've got you covered. Our new bundles offer up to 30% more data for the same price compared to previous offerings.</p>

      <h3>How to Purchase</h3>
      <p>Getting your new data bundle is as simple as:</p>
      <ol>
        <li>Log into your Topchart dashboard</li>
        <li>Navigate to "Buy Data"</li>
        <li>Select your preferred network</li>
        <li>Choose from the new bundle options</li>
        <li>Complete payment and receive instant delivery</li>
      </ol>

      <p>We're committed to making digital connectivity accessible to all Ghanaians. Stay tuned for more exciting updates!</p>
    `,
    date: "Jan 15, 2026",
    author: "Product Team",
    category: "Product Updates",
    readTime: "3 min read"
  },
  {
    slug: "security-best-practices",
    title: "Securing your Transactions: Best Practices",
    excerpt: "Learn how to keep your Topchart account and transactions secure with these simple tips.",
    content: `
      <p>In today's digital world, security is paramount. At Topchart, we employ bank-grade encryption and security measures to protect your transactions, but there are also steps you can take to enhance your account security.</p>

      <h3>Use a Strong, Unique Password</h3>
      <p>Your password is your first line of defense. Make sure it's:</p>
      <ul>
        <li>At least 8 characters long</li>
        <li>Contains uppercase and lowercase letters</li>
        <li>Includes numbers and special characters</li>
        <li>Not used on any other website or service</li>
      </ul>

      <h3>Enable Two-Factor Authentication</h3>
      <p>Whenever possible, enable 2FA on your account. This adds an extra layer of security by requiring a second form of verification beyond your password.</p>

      <h3>Be Wary of Phishing Attempts</h3>
      <p>Topchart will never ask you to provide your password via email or SMS. If you receive suspicious communications:</p>
      <ul>
        <li>Don't click on unknown links</li>
        <li>Verify the sender's email address</li>
        <li>Contact our support team directly if unsure</li>
      </ul>

      <h3>Monitor Your Account Regularly</h3>
      <p>Check your transaction history frequently. If you notice any unauthorized activity, report it immediately through our dispute system.</p>

      <h3>Keep Your Devices Secure</h3>
      <p>Ensure your phone and computer have:</p>
      <ul>
        <li>Updated operating systems</li>
        <li>Reliable antivirus software</li>
        <li>Screen locks with PINs or biometrics</li>
      </ul>

      <p>Remember, security is a shared responsibility. Together, we can keep your digital transactions safe and secure.</p>
    `,
    date: "Jan 10, 2026",
    author: "Security Team",
    category: "Security",
    readTime: "4 min read"
  },
  {
    slug: "500k-users-milestone",
    title: "Topchart Reaches 500,000 Users in Ghana",
    excerpt: "A major milestone in our journey to build the ultimate digital infrastructure for Ghana.",
    content: `
      <p>Today marks a monumental milestone for our team and community: Topchart now serves over 500,000 registered users across Ghana! This achievement represents more than just a number—it's a testament to the trust you've placed in us to handle your digital transactions.</p>

      <h3>Our Journey So Far</h3>
      <p>Since our launch, we've:</p>
      <ul>
        <li>Processed over 2 million transactions</li>
        <li>Maintained 99.9% uptime</li>
        <li>Expanded from 3 to 10 team members</li>
        <li>Partnered with all major Ghanaian networks</li>
        <li>Launched our dispute resolution system</li>
      </ul>

      <h3>What Our Users Say</h3>
      <p>We're humbled by the feedback from our community. Users consistently praise our:</p>
      <ul>
        <li>Lightning-fast delivery (average 5 seconds)</li>
        <li>Reliable service even during peak hours</li>
        <li>Responsive customer support team</li>
        <li>Easy-to-use interface</li>
      </ul>

      <h3>Looking Ahead</h3>
      <p>This milestone fuels our ambition to do more. Our roadmap for 2026 includes:</p>
      <ul>
        <li>Launching utility bill payments</li>
        <li>Introducing international airtime top-ups</li>
        <li>Developing a mobile app for iOS and Android</li>
        <li>Expanding to additional African markets</li>
      </ul>

      <h3>Thank You</h3>
      <p>To every user who has chosen Topchart for their digital needs: thank you. Your trust drives us to build better infrastructure every day. Here's to the next 500,000!</p>
    `,
    date: "Jan 5, 2026",
    author: "Press Office",
    category: "Company News",
    readTime: "3 min read"
  }
]

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const post = posts.find(p => p.slug === slug)
  
  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10 selection:text-primary">
      <Header />
      
      <main className="flex-1 pt-28 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Back Link */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                {post.category}
              </span>
              <span className="text-xs text-muted-foreground">{post.readTime}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{post.date}</span>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <Card className="border-border/50">
            <CardContent className="p-8 md:p-12">
              <div 
                className="prose prose-slate max-w-none dark:prose-invert
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                  prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                  prose-ul:my-6 prose-ul:space-y-2 prose-ul:text-muted-foreground
                  prose-ol:my-6 prose-ol:space-y-2 prose-ol:text-muted-foreground
                  prose-li:marker:text-primary"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </CardContent>
          </Card>

          {/* Share Section */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-4">Share this article</p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
