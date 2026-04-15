"use client"



import React, { useEffect, useState } from "react"

import Link from "next/link"

import { Header } from "@/components/header"

import { Footer } from "@/components/footer"

import { Download, FileText, Image as ImageIcon, Mail, Newspaper, TrendingUp, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Card, CardContent } from "@/components/ui/card"

import { motion } from "framer-motion"



interface PressStat {

  id: string

  value: string

  label: string

  color_gradient: string

}



interface PressAsset {

  id: string

  name: string

  asset_type: string

  description: string

  download_url: string | null

  file_size: string | null

}



const brandColors = [

  { name: 'Sea Blue', hex: '#006994', label: 'Primary' },

  { name: 'Wine', hex: '#722F37', label: 'Accent' },

  { name: 'Mid Blue', hex: '#1A85B8', label: 'Secondary' },

  { name: 'Grey', hex: '#6B7280', label: 'Neutral' },

]



const fadeInUp = {

  initial: { opacity: 0, y: 20 },

  animate: { opacity: 1, y: 0 },

  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }

}



const staggerContainer = {

  animate: {

    transition: {

      staggerChildren: 0.1

    }

  }

}



export default function PressPage() {

  const [stats, setStats] = useState<PressStat[]>([])

  const [assets, setAssets] = useState<PressAsset[]>([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)



  useEffect(() => {

    const loadData = async () => {

      try {

        const res = await fetch("/api/content/press", { cache: "no-store" })

        

        if (!res.ok) {

          throw new Error(`HTTP error ${res.status}`)

        }

        

        const data = await res.json()



        if (data.success) {

          setStats(data.stats)

          setAssets(data.assets)

        } else {

          setError(data.error || "Failed to load press data")

        }

      } catch (err) {

        console.error("Failed to load press data:", err)

        setError("Failed to load press kit data. Please try again.")

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

        <motion.div 

          initial={{ opacity: 0, y: 30 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}

          className="relative bg-gradient-hero border-b border-border/40 pb-16 mb-16 overflow-hidden"

        >

          <div className="absolute inset-0 bg-[radial-gradient(45%_60%_at_50%_0%,rgba(0,105,148,0.06)_0%,transparent_100%)]" />

          <div className="container mx-auto px-4 relative text-center">

            <motion.div 

              initial={{ opacity: 0, scale: 0.9 }}

              animate={{ opacity: 1, scale: 1 }}

              transition={{ duration: 0.5, delay: 0.2 }}

              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#006994]/10 border border-[#006994]/25 text-[#006994] text-xs font-bold uppercase tracking-widest mb-6"

            >

              <Newspaper className="h-3.5 w-3.5" />

              Press Room

            </motion.div>

            <motion.h1 

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.6, delay: 0.3 }}

              className="font-heading text-4xl font-normal tracking-tight mb-4"

            >Press Kit</motion.h1>

            <motion.p 

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.6, delay: 0.4 }}

              className="text-xl text-muted-foreground font-body max-w-xl mx-auto"

            >Resources, assets, and information for media and press inquiries about Topchart Ghana.</motion.p>

          </div>

        </motion.div>



        <div className="container mx-auto px-4">

          {loading ? (

            <div className="flex items-center justify-center py-20">

              <Loader2 className="h-8 w-8 animate-spin text-primary" />

            </div>

          ) : error ? (

            <div className="text-center py-20 text-muted-foreground">{error}</div>

          ) : (

            <>

              {/* Key Stats for Press */}

              <motion.div 

                variants={staggerContainer}

                initial="initial"

                animate="animate"

                className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16"

              >

                {stats.length > 0 ? stats.map((s, index) => (

                  <motion.div 

                    key={s.id} 

                    variants={fadeInUp}

                    transition={{ delay: index * 0.1 }}

                    className={`p-5 rounded-2xl bg-gradient-to-br ${s.color_gradient} border border-border/50 text-center`}

                  >

                    <p className="font-heading text-2xl font-normal text-foreground">{s.value}</p>

                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1 font-body">{s.label}</p>

                  </motion.div>

                )) : (

                  <div className="col-span-4 text-center text-muted-foreground py-8">

                    No statistics available

                  </div>

                )}

              </motion.div>



              {/* Brand Colours */}

              <motion.div 

                initial={{ opacity: 0, y: 20 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ duration: 0.6, delay: 0.5 }}

                className="max-w-4xl mx-auto mb-12"

              >

                <h2 className="font-heading text-xl font-normal mb-6">Brand Colours</h2>

                <motion.div 

                  variants={staggerContainer}

                  initial="initial"

                  animate="animate"

                  className="flex flex-wrap gap-4"

                >

                  {brandColors.map((c, index) => (

                    <motion.div 

                      key={c.name} 

                      variants={fadeInUp}

                      transition={{ delay: index * 0.1 }}

                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}

                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-background"

                    >

                      <div className="w-8 h-8 rounded-lg shadow-sm" style={{ backgroundColor: c.hex }} />

                      <div>

                        <p className="text-xs font-bold text-foreground">{c.name}</p>

                        <p className="text-[10px] font-mono text-muted-foreground">{c.hex}</p>

                      </div>

                      <span className="ml-2 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{c.label}</span>

                    </motion.div>

                  ))}

                </motion.div>

              </motion.div>



              {/* Downloads */}

              <motion.div 

                variants={staggerContainer}

                initial="initial"

                animate="animate"

                className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"

              >

                {assets.length > 0 ? assets.map((asset, index) => (

                  <motion.div

                    key={asset.id}

                    variants={fadeInUp}

                    transition={{ delay: index * 0.15 }}

                  >

                    <Card className="border-[#006994]/15 hover:border-[#006994]/35 transition-all duration-300 group overflow-hidden" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>

                      <div className={`h-2 bg-gradient-to-r ${asset.asset_type === 'logo_pack' ? 'from-[#006994] to-[#1A85B8]' : 'from-[#722F37] to-[#9B4450]'}`} />

                      <CardContent className="p-8">

                        <motion.div 

                          whileHover={{ scale: 1.1 }}

                          transition={{ duration: 0.3 }}

                          className={`h-12 w-12 rounded-xl ${asset.asset_type === 'logo_pack' ? 'bg-[#006994]/10 text-[#006994]' : 'bg-[#722F37]/10 text-[#722F37]'} flex items-center justify-center mb-6`}

                        >

                          {asset.asset_type === 'logo_pack' ? <ImageIcon className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}

                        </motion.div>

                        <h3 className="font-heading text-xl font-normal mb-3">{asset.name}</h3>

                        <p className="text-muted-foreground text-sm mb-6 leading-relaxed font-body">{asset.description}</p>

                        <Button 

                          variant="outline" 

                          className="rounded-xl hover:border-[#006994] hover:text-[#006994] transition-all"

                          disabled={!asset.download_url}

                          asChild={!!asset.download_url}

                        >

                          {asset.download_url ? (

                            <a href={asset.download_url} download>

                              <Download className="mr-2 h-4 w-4" />

                              Download {asset.file_size ? `(${asset.file_size})` : ''}

                            </a>

                          ) : (

                            <>

                              <Download className="mr-2 h-4 w-4" />

                              Coming Soon

                            </>

                          )}

                        </Button>

                      </CardContent>

                    </Card>

                  </motion.div>

                )) : (

                  <div className="col-span-2 text-center text-muted-foreground py-8">

                    No assets available

                  </div>

                )}

              </motion.div>

            </>

          )}



          {/* Press Contact */}

          <motion.div 

            initial={{ opacity: 0, y: 30 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ duration: 0.7, delay: 0.6 }}

            className="mt-16 max-w-4xl mx-auto"

          >

            <Card className="border-[#006994]/20 bg-[#EFF6FA]/40 overflow-hidden">

              <div className="absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_100%,rgba(0,105,148,0.04)_0%,transparent_100%)]" />

              <CardContent className="p-8">

                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">

                  <motion.div 

                    initial={{ scale: 0.8, opacity: 0 }}

                    animate={{ scale: 1, opacity: 1 }}

                    transition={{ duration: 0.5, delay: 0.7 }}

                    className="h-14 w-14 rounded-2xl bg-[#006994]/10 text-[#006994] flex items-center justify-center flex-shrink-0"

                  >

                    <Mail className="h-7 w-7" />

                  </motion.div>

                  <div className="flex-1">

                    <h3 className="font-heading text-xl font-normal mb-2">Press Inquiries</h3>

                    <p className="text-muted-foreground text-sm font-body">For media inquiries, interview requests, or to be added to our press list, please reach out to our communications team.</p>

                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>

                    <Link href="mailto:press@topchart.gh">

                      <Button className="rounded-xl bg-gradient-to-r from-[#006994] to-[#1A85B8] text-white hover:from-[#00567A] hover:to-[#006994] shadow-lg shrink-0">press@topchart.gh</Button>

                    </Link>

                  </motion.div>

                </div>

              </CardContent>

            </Card>

          </motion.div>

        </div>

      </main>

      <Footer />

    </div>

  )

}

