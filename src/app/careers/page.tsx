"use client"



import React, { useEffect, useState } from "react"

import { Header } from "@/components/header"

import { Footer } from "@/components/footer"

import { Briefcase, MapPin, Clock, ArrowRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Card, CardContent } from "@/components/ui/card"

import * as LucideIcons from "lucide-react"



interface Job {

  id: string

  title: string

  location: string

  type: string

  department: string

  description: string | null

  requirements: string[] | null

}



interface Perk {

  id: string

  title: string

  description: string

  icon_name: string

  color_gradient: string

}



const deptColors: Record<string, string> = {

  "Engineering": "bg-violet-500/10 text-violet-700 dark:text-violet-400",

  "Design": "bg-pink-500/10 text-pink-700 dark:text-pink-400",

  "Operations": "bg-orange-500/10 text-orange-700 dark:text-orange-400",

  "Marketing": "bg-blue-500/10 text-blue-700 dark:text-blue-400",

  "Sales": "bg-green-500/10 text-green-700 dark:text-green-400",

}



function getIconComponent(iconName: string) {

  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>

  return icons[iconName] || LucideIcons.Star

}



export default function CareersPage() {

  const [jobs, setJobs] = useState<Job[]>([])

  const [perks, setPerks] = useState<Perk[]>([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)



  useEffect(() => {

    const loadData = async () => {

      try {

        const [jobsRes, perksRes] = await Promise.all([

          fetch("/api/content/jobs", { cache: "no-store" }),

          fetch("/api/content/perks", { cache: "no-store" })

        ])



        const jobsData = await jobsRes.json()

        const perksData = await perksRes.json()



        if (jobsData.success) setJobs(jobsData.jobs)

        if (perksData.success) setPerks(perksData.perks)

      } catch (err) {

        console.error("Failed to load careers data:", err)

        setError("Failed to load content. Please try again.")

      } finally {

        setLoading(false)

      }

    }



    loadData()

  }, [])



  return (

    <div className="min-h-screen flex flex-col bg-background selection:bg-[#006994]/15 selection:text-foreground">

      <Header />

      <main className="flex-1 pt-32 pb-20">

        {/* Hero */}

        <div className="relative bg-gradient-hero border-b border-border/40 pb-16 mb-16 overflow-hidden">

          <div className="absolute inset-0 bg-[radial-gradient(45%_60%_at_50%_0%,rgba(0,105,148,0.06)_0%,transparent_100%)]" />

          <div className="absolute top-10 -right-24 w-80 h-80 rounded-full bg-[#006994]/5 blur-[100px]" />

          <div className="container mx-auto px-4 relative text-center">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#006994]/10 border border-[#006994]/25 text-[#006994] text-xs font-bold uppercase tracking-widest mb-6">

              <Briefcase className="h-3.5 w-3.5" />

              We&apos;re Hiring

            </div>

            <h1 className="font-heading text-4xl font-normal tracking-tight mb-4">Join the Team</h1>

            <p className="text-xl text-muted-foreground font-body max-w-xl mx-auto">Help us build the financial infrastructure for the next generation of Ghanaian businesses.</p>

          </div>

        </div>



        {/* Why Join Us */}

        <div className="container mx-auto px-4 mb-20">

          <div className="text-center mb-12">

            <h2 className="text-sm font-bold uppercase tracking-widest text-[#722F37] mb-3 font-body">Why Topchart</h2>

            <h3 className="font-heading text-3xl font-normal">Perks & Benefits</h3>

          </div>

          

          {loading ? (

            <div className="flex items-center justify-center py-12">

              <Loader2 className="h-8 w-8 animate-spin text-primary" />

            </div>

          ) : error ? (

            <div className="text-center py-12 text-muted-foreground">{error}</div>

          ) : (

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">

              {perks.map((perk) => {

                const IconComponent = getIconComponent(perk.icon_name)

                return (

                  <div key={perk.id} className={`p-6 rounded-2xl bg-gradient-to-br ${perk.color_gradient} border border-border/50`}>

                    <div className="h-10 w-10 rounded-xl bg-background/60 flex items-center justify-center mb-4">

                      <IconComponent className="h-5 w-5 text-foreground" />

                    </div>

                    <h4 className="font-heading text-base font-normal mb-2">{perk.title}</h4>

                    <p className="text-sm text-muted-foreground font-body leading-relaxed">{perk.description}</p>

                  </div>

                )

              })}

            </div>

          )}

        </div>



        {/* Open Positions */}

        <div className="container mx-auto px-4">

          <div className="max-w-4xl mx-auto">

            <h2 className="font-heading text-2xl font-normal mb-8">Open Positions</h2>

            

            {loading ? (

              <div className="flex items-center justify-center py-12">

                <Loader2 className="h-8 w-8 animate-spin text-primary" />

              </div>

            ) : error ? (

              <div className="text-center py-12 text-muted-foreground">{error}</div>

            ) : jobs.length === 0 ? (

              <div className="text-center py-12 text-muted-foreground">

                No open positions at the moment. Check back soon!

              </div>

            ) : (

              <div className="space-y-4">

                {jobs.map((job) => (

                  <Card key={job.id} className="border-[#006994]/15 hover:border-[#006994]/35 hover:shadow-lg hover:shadow-[#006994]/10 transition-all duration-300 cursor-pointer group overflow-hidden" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>

                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">

                      <div>

                        <div className="flex items-center gap-3 mb-2">

                          <h3 className="font-heading text-lg font-normal group-hover:text-[#006994] transition-colors duration-300">{job.title}</h3>

                          <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${deptColors[job.department] ?? 'bg-muted text-muted-foreground'}`}>{job.department}</span>

                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-body">

                          <div className="flex items-center gap-1.5">

                            <MapPin className="h-3.5 w-3.5" />

                            {job.location}

                          </div>

                          <div className="flex items-center gap-1.5">

                            <Clock className="h-3.5 w-3.5" />

                            {job.type}

                          </div>

                        </div>

                      </div>

                      <Button variant="outline" className="shrink-0 group-hover:bg-[#722F37] group-hover:text-white group-hover:border-[#722F37] transition-all duration-300 rounded-xl" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>

                        Apply Now

                        <ArrowRight className="ml-2 h-4 w-4" />

                      </Button>

                    </CardContent>

                  </Card>

                ))}

              </div>

            )}

          </div>

        </div>

      </main>

      <Footer />

    </div>

  )

}

