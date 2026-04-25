"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Calendar, ArrowRight, Newspaper, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  author: string
  gradient: string
  icon_color: string
  published_at: string
  category_name: string | null
  category_color: string | null
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await fetch("/api/content/posts", { cache: "no-store" })
        
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`)
        }
        
        const data = await res.json()

        if (data.success) {
          setPosts(data.posts)
        } else {
          setError(data.error || "Failed to load posts")
        }
      } catch (err) {
        console.error("Failed to load blog posts:", err)
        setError("Failed to load blog posts. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--marketing-cream)] selection:bg-[color:var(--marketing-accent)]/15">
      <Header />
      <main className="flex-1 pb-20 pt-[calc(72px+1.5rem)]">
        {/* Hero */}
        <div className="relative bg-gradient-hero border-b border-border/40 pb-16 mb-16">
          <div className="absolute inset-0 bg-[radial-gradient(45%_60%_at_50%_0%,rgba(0,105,148,0.05)_0%,transparent_100%)]" />
          <div className="container mx-auto px-4 relative text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--marketing-accent)]/25 bg-[color:var(--marketing-accent)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[color:var(--marketing-accent)]">
              <Newspaper className="h-3.5 w-3.5" />
              Topchart Blog
            </div>
            <h1 className="font-heading text-4xl font-normal tracking-tight mb-4">News & Updates</h1>
            <p className="text-xl text-muted-foreground font-body max-w-xl mx-auto">The latest product updates, security guides, and company announcements from the Topchart team.</p>
          </div>
        </div>

        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-muted-foreground">{error}</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No blog posts yet. Check back soon!
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="group overflow-hidden border-border/50 transition-all duration-300 hover:border-[color:var(--marketing-accent)]/30 hover:shadow-lg hover:shadow-[color:var(--marketing-accent)]/10"
                  style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
                >
                  <CardContent className="p-0">
                    {/* Colorful thumbnail */}
                    <div className={`aspect-video bg-gradient-to-br ${post.gradient} flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                      <div className={`h-16 w-16 rounded-2xl ${post.icon_color} flex items-center justify-center`}>
                        <Newspaper className="h-8 w-8" />
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${post.category_color ?? 'bg-muted text-muted-foreground'}`}>
                          {post.category_name ?? 'General'}
                        </span>
                      </div>
                      <h3 className="mb-3 font-heading text-xl font-normal leading-snug transition-colors duration-300 group-hover:text-[color:var(--marketing-accent)]">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-6 leading-relaxed font-body">{post.excerpt}</p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium font-body">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(post.published_at)}</span>
                        </div>
                        <Link href={`/blog/${post.slug}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="group/btn h-8 text-xs transition-colors duration-300 hover:text-[color:var(--marketing-accent)]"
                          >
                            Read More
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
