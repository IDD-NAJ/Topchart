"use client"



import { useState, useEffect } from "react"

import { DataTable } from "@/components/admin/DataTable"

import { Layers } from "lucide-react"



interface Network {

  id: string

  name: string

  code: string

}



export default function BundleCategoriesPage() {

  const [networks, setNetworks] = useState<Network[]>([])

  const [loading, setLoading] = useState(true)



  useEffect(() => {

    const fetchNetworks = async () => {

      try {

        const res = await fetch("/api/admin/tables?table=networks&page=1&pageSize=100&orderBy=name", {

          credentials: "include",

        })

        const json = await res.json()

        if (json.success) {

          setNetworks(json.data || [])

        }

      } catch (err) {

        console.error("Failed to fetch networks:", err)

      } finally {

        setLoading(false)

      }

    }



    fetchNetworks()

  }, [])



  const networkOptions = networks.map((n) => ({

    value: n.id,

    label: `${n.name} (${n.code})`,

  }))



  if (loading) {

    return (

      <div className="flex items-center justify-center h-64">

        <div className="w-6 h-6 border-2 border-[#006994] border-t-transparent rounded-full animate-spin" />

      </div>

    )

  }



  return (

    <DataTable

      title="Bundle Categories"

      tableName="data_bundle_categories"

      icon={<Layers className="h-5 w-5" />}

      columns={[

        { key: "id", label: "ID" },

        { key: "networkId", label: "Network", type: "select", options: networkOptions },

        { key: "name", label: "Name" },

        { key: "createdAt", label: "Created", type: "date" },

      ]}

      searchableColumns={["name", "networkId"]}

      defaultOrderBy="createdAt"

    />

  )

}

