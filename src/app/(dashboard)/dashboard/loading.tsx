import { Card, CardContent, CardHeader } from "@/components/ui/card"

import { Skeleton } from "@/components/ui/skeleton"



export default function Loading() {

  return (

    <div className="max-w-5xl mx-auto space-y-8 pb-16">

      {/* Header Skeleton */}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">

        <div className="space-y-2">

          <Skeleton className="h-10 w-64" />

          <Skeleton className="h-4 w-80" />

        </div>

        <Skeleton className="h-9 w-28" />

      </div>



      {/* Financial Overview Skeleton */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          {/* Wallet Card Skeleton */}

          <Card className="bg-gradient-to-br from-[#006994]/20 to-[#006994]/10">

            <CardContent className="p-6">

              <div className="flex items-center justify-between mb-4">

                <Skeleton className="h-5 w-32" />

                <Skeleton className="h-8 w-8 rounded-md" />

              </div>

              <Skeleton className="h-10 w-48 mb-6" />

              <Skeleton className="h-10 w-full" />

            </CardContent>

          </Card>



          {/* Stats Grid Skeleton */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {[1, 2, 3].map((i) => (

              <Card key={i} className="bg-muted/30">

                <CardContent className="p-4 space-y-3">

                  <div className="flex items-center justify-between">

                    <Skeleton className="h-3 w-20" />

                    <Skeleton className="h-4 w-4" />

                  </div>

                  <Skeleton className="h-7 w-24" />

                  <Skeleton className="h-2.5 w-32" />

                </CardContent>

              </Card>

            ))}

          </div>

        </div>



        {/* Quick Actions Skeleton */}

        <Card>

          <CardHeader className="pb-2">

            <Skeleton className="h-4 w-24" />

          </CardHeader>

          <CardContent className="p-3 space-y-3">

            {[1, 2].map((i) => (

              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border">

                <Skeleton className="h-10 w-10 rounded-lg" />

                <div className="flex-1 space-y-2">

                  <Skeleton className="h-4 w-24" />

                  <Skeleton className="h-3 w-32" />

                </div>

                <Skeleton className="h-4 w-4" />

              </div>

            ))}

            <Skeleton className="h-20 w-full rounded-lg" />

          </CardContent>

        </Card>

      </div>



      {/* Detailed Analysis Skeleton */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Column */}

        <div className="space-y-8">

          {/* System Activity Skeleton */}

          <section className="space-y-4">

            <Skeleton className="h-6 w-32" />

            <Card>

              <CardHeader className="pb-4 border-b">

                <Skeleton className="h-5 w-32" />

                <Skeleton className="h-3 w-64 mt-2" />

              </CardHeader>

              <CardContent className="p-8">

                <div className="flex flex-col items-center space-y-4">

                  <Skeleton className="h-12 w-12 rounded-full" />

                  <Skeleton className="h-4 w-48" />

                </div>

              </CardContent>

            </Card>

          </section>



          {/* Usage Metrics Skeleton */}

          <section className="space-y-4">

            <Skeleton className="h-6 w-32" />

            <Card>

              <CardHeader>

                <Skeleton className="h-5 w-32" />

                <Skeleton className="h-3 w-48 mt-2" />

              </CardHeader>

              <CardContent className="space-y-6">

                {[1, 2].map((i) => (

                  <div key={i} className="space-y-2">

                    <div className="flex items-center justify-between">

                      <Skeleton className="h-3 w-28" />

                      <Skeleton className="h-3 w-24" />

                    </div>

                    <Skeleton className="h-1.5 w-full" />

                  </div>

                ))}

              </CardContent>

            </Card>

          </section>

        </div>



        {/* Right Column - Activity Log Skeleton */}

        <div className="space-y-8">

          <section className="space-y-4">

            <Skeleton className="h-6 w-32" />

            <Card>

              <CardContent className="p-8">

                <div className="flex flex-col items-center space-y-4">

                  <Skeleton className="h-10 w-10 animate-spin rounded-full border-4 border-[#006994] border-t-transparent" />

                  <Skeleton className="h-4 w-36" />

                </div>

              </CardContent>

            </Card>

          </section>



          {/* Beneficiaries Skeleton */}

          <section className="space-y-4">

            <Skeleton className="h-6 w-40" />

            <Card>

              <CardContent className="p-4 space-y-3">

                {[1, 2, 3].map((i) => (

                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">

                    <div className="flex items-center gap-3">

                      <Skeleton className="h-8 w-8 rounded-full" />

                      <div className="space-y-1">

                        <Skeleton className="h-3 w-24" />

                        <Skeleton className="h-2.5 w-20" />

                      </div>

                    </div>

                    <div className="flex gap-1">

                      <Skeleton className="h-7 w-7 rounded-full" />

                      <Skeleton className="h-7 w-7 rounded-full" />

                    </div>

                  </div>

                ))}

              </CardContent>

            </Card>

          </section>

        </div>

      </div>



      {/* Footer Grid Skeleton */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {[1, 2].map((i) => (

          <Card key={i}>

            <CardHeader>

              <Skeleton className="h-5 w-32" />

              <Skeleton className="h-3 w-48 mt-2" />

            </CardHeader>

            <CardContent className="space-y-4">

              <Skeleton className="h-12 w-full" />

              <div className="grid grid-cols-2 gap-3">

                <Skeleton className="h-16 w-full" />

                <Skeleton className="h-16 w-full" />

              </div>

            </CardContent>

          </Card>

        ))}

      </div>

    </div>

  )

}

