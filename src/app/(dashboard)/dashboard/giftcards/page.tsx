"use client"



import { useState, useEffect } from "react"

import Link from "next/link"

import { useAuth } from "@/lib/auth-context"

import { formatCurrency } from "@/lib/networks"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { motion } from "framer-motion"

import {

  Gift,

  Search,

  Filter,

  ShoppingCart,

  Loader2,

  CheckCircle,

  XCircle,

  Clock,

  Copy,

  ExternalLink,

  History,

  User,

  Mail,

  MessageSquare,

  CreditCard,

  Wallet,

  ArrowRight,

  RefreshCw,

  Heart,

  HeartOff,

  Info,

  Layers,

} from "lucide-react"

import { toast } from "sonner"



const CATEGORIES = [

  { id: "gaming", name: "Gaming", icon: "Gamepad2" },

  { id: "shopping", name: "Shopping", icon: "ShoppingCart" },

  { id: "entertainment", name: "Entertainment", icon: "Play" },

  { id: "lifestyle", name: "Lifestyle", icon: "Heart" },

  { id: "software", name: "Software", icon: "Monitor" },

  { id: "food", name: "Food & Dining", icon: "Utensils" },

]



export default function GiftcardsPage() {

  const { user, isLoading } = useAuth()

  const [products, setProducts] = useState<any[]>([])

  const [filteredProducts, setFilteredProducts] = useState<any[]>([])

  const [orders, setOrders] = useState<any[]>([])

  const [favorites, setFavorites] = useState<any[]>([])

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])

  const [sortBy, setSortBy] = useState<string>("name")

  const [showFilters, setShowFilters] = useState(false)

  const [bulkSelectMode, setBulkSelectMode] = useState(false)

  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set())

  const [showBulkModal, setShowBulkModal] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")

  const [loadingProducts, setLoadingProducts] = useState(true)

  const [loadingOrders, setLoadingOrders] = useState(true)

  const [loadingFavorites, setLoadingFavorites] = useState(true)

  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  const [purchaseForm, setPurchaseForm] = useState({

    recipientEmail: "",

    recipientPhone: "",

    recipientName: "",

    isGift: false,

    senderMessage: "",

    paymentMethod: "wallet",

  })

  const [purchasing, setPurchasing] = useState(false)



  useEffect(() => {

    if (user) {

      loadProducts()

      loadOrders()

      loadFavorites()

    }

  }, [user])



  useEffect(() => {

    let filtered = products



    if (selectedCategory) {

      filtered = filtered.filter(p => p.category === selectedCategory)

    }



    if (selectedCountry) {

      filtered = filtered.filter(p => p.country_code === selectedCountry)

    }



    if (searchQuery) {

      const query = searchQuery.toLowerCase()

      filtered = filtered.filter(p => 

        p.product_name.toLowerCase().includes(query) ||

        p.brand_name.toLowerCase().includes(query)

      )

    }



    filtered = filtered.filter(p => 

      p.price_ghs >= priceRange[0] && p.price_ghs <= priceRange[1]

    )



    if (sortBy === 'price-asc') {

      filtered = filtered.sort((a, b) => a.price_ghs - b.price_ghs)

    } else if (sortBy === 'price-desc') {

      filtered = filtered.sort((a, b) => b.price_ghs - a.price_ghs)

    } else if (sortBy === 'name') {

      filtered = filtered.sort((a, b) => a.product_name.localeCompare(b.product_name))

    }



    setFilteredProducts(filtered)

  }, [selectedCategory, selectedCountry, searchQuery, priceRange, sortBy, products])



  const loadProducts = async () => {

    try {

      setLoadingProducts(true)

      const res = await fetch("/api/giftcards/products", {

        credentials: "include"

      })

      const data = await res.json()

      if (data.success) {

        setProducts(data.data.products)

        setFilteredProducts(data.data.products)

      } else {

        toast.error(data.error || "Failed to load products")

      }

    } catch (error) {

      console.error("Error loading products:", error)

      toast.error("Failed to load products")

    } finally {

      setLoadingProducts(false)

    }

  }



  const loadOrders = async () => {

    try {

      setLoadingOrders(true)

      const res = await fetch("/api/giftcards/orders?limit=10", {

        credentials: "include"

      })

      const data = await res.json()

      if (data.success) {

        setOrders(data.data.orders)

      } else {

        toast.error(data.error || "Failed to load orders")

      }

    } catch (error) {

      console.error("Error loading orders:", error)

      toast.error("Failed to load orders")

    } finally {

      setLoadingOrders(false)

    }

  }



  const handlePurchase = async () => {

    if (!selectedProduct) return



    if (!purchaseForm.recipientEmail) {

      toast.error("Recipient email is required")

      return

    }



    setPurchasing(true)

    try {

      const res = await fetch("/api/giftcards/purchase", {

        method: "POST",

        credentials: "include",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          productId: selectedProduct.reloadly_product_id,

          recipientEmail: purchaseForm.recipientEmail,

          recipientPhone: purchaseForm.recipientPhone,

          recipientName: purchaseForm.recipientName,

          isGift: purchaseForm.isGift,

          senderMessage: purchaseForm.senderMessage,

          paymentMethod: purchaseForm.paymentMethod,

        }),

      })



      const data = await res.json()

      if (data.success) {

        toast.success("Gift card purchased successfully!")

        setShowPurchaseModal(false)

        setPurchaseForm({

          recipientEmail: "",

          recipientPhone: "",

          recipientName: "",

          isGift: false,

          senderMessage: "",

          paymentMethod: "wallet",

        })

        loadOrders()

      } else {

        toast.error(data.error || "Failed to purchase gift card")

      }

    } catch (error) {

      console.error("Error purchasing gift card:", error)

      toast.error("Failed to purchase gift card")

    } finally {

      setPurchasing(false)

    }

  }



  const loadFavorites = async () => {

    try {

      setLoadingFavorites(true)

      const res = await fetch("/api/giftcards/favorites", {

        credentials: "include"

      })

      const data = await res.json()

      if (data.success) {

        setFavorites(data.data.favorites)

        setFavoriteIds(new Set(data.data.favorites.map((f: any) => f.reloadly_product_id)))

      }

    } catch (error) {

      console.error("Error loading favorites:", error)

    } finally {

      setLoadingFavorites(false)

    }

  }



  const toggleFavorite = async (product: any) => {

    const productId = product.reloadly_product_id

    const isFavorite = favoriteIds.has(productId)



    try {

      if (isFavorite) {

        await fetch(`/api/giftcards/favorites/${productId}`, {

          method: "DELETE",

          credentials: "include"

        })

        setFavoriteIds(prev => {

          const newSet = new Set(prev)

          newSet.delete(productId)

          return newSet

        })

        setFavorites(prev => prev.filter(f => f.reloadly_product_id !== productId))

        toast.success("Removed from favorites")

      } else {

        await fetch("/api/giftcards/favorites", {

          method: "POST",

          credentials: "include",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({

            reloadly_product_id: product.reloadly_product_id,

            product_name: product.product_name,

            brand_name: product.brand_name,

            logo_url: product.logo_url,

            price_ghs: product.price_ghs,

            currency: product.currency_code,

            category: product.category,

            country_code: product.country_code,

          })

        })

        setFavoriteIds(prev => new Set(prev).add(productId))

        setFavorites(prev => [{

          reloadly_product_id: product.reloadly_product_id,

          product_name: product.product_name,

          brand_name: product.brand_name,

          logo_url: product.logo_url,

          price_ghs: product.price_ghs,

          currency: product.currency_code,

          category: product.category,

          country_code: product.country_code,

          created_at: new Date().toISOString(),

        }, ...prev])

        toast.success("Added to favorites")

      }

    } catch (error) {

      console.error("Error toggling favorite:", error)

      toast.error("Failed to update favorites")

    }

  }



  const copyToClipboard = (text: string) => {

    navigator.clipboard.writeText(text)

    toast.success("Copied to clipboard")

  }



  if (isLoading || !user) {

    return (

      <div className="flex items-center justify-center min-h-screen">

        <Loader2 className="h-8 w-8 animate-spin text-[#006994]" />

      </div>

    )

  }



  return (

    <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">

        <div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Gift Cards</h1>

          <p className="text-sm sm:text-base text-slate-600 mt-1">Purchase digital gift cards instantly</p>

        </div>

        <Link href="/dashboard/history">

          <Button variant="outline" className="w-full sm:w-auto">

            <History className="h-4 w-4 mr-2" />

            View History

          </Button>

        </Link>

      </div>



      <Tabs defaultValue="browse" className="space-y-6">

        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">

          <TabsTrigger value="browse">Browse Cards</TabsTrigger>

          <TabsTrigger value="favorites">

            Favorites {favoriteIds.size > 0 && `(${favoriteIds.size})`}

          </TabsTrigger>

          <TabsTrigger value="orders">My Orders</TabsTrigger>

        </TabsList>



        <TabsContent value="browse" className="space-y-6">

          <Card className="border-slate-200">

            <CardHeader>

              <div className="flex flex-col gap-4">

                <div className="flex flex-col sm:flex-row gap-4">

                  <div className="flex-1 relative">

                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                    <Input

                      placeholder="Search gift cards..."

                      value={searchQuery}

                      onChange={(e) => setSearchQuery(e.target.value)}

                      className="pl-10"

                    />

                  </div>

                  <Button

                    variant={showFilters ? "default" : "outline"}

                    onClick={() => setShowFilters(!showFilters)}

                    size="sm"

                    className="sm:w-auto"

                  >

                    <Filter className="h-4 w-4 mr-2" />

                    Filters

                    {(selectedCategory || selectedCountry || priceRange[0] > 0 || priceRange[1] < 1000) && (

                      <Badge className="ml-2 h-5 px-1.5 text-xs">

                        {[selectedCategory, selectedCountry, priceRange[0] > 0 || priceRange[1] < 1000 ? 'price' : null].filter(Boolean).length}

                      </Badge>

                    )}

                  </Button>

                </div>



                {showFilters && (

                  <div className="space-y-4 p-4 bg-slate-50 rounded-lg">

                    <div className="flex flex-col sm:flex-row gap-4">

                      <div className="flex-1">

                        <Label className="text-sm mb-2 block">Sort By</Label>

                        <select

                          value={sortBy}

                          onChange={(e) => setSortBy(e.target.value)}

                          className="w-full p-2 border rounded-md"

                        >

                          <option value="name">Name (A-Z)</option>

                          <option value="price-asc">Price (Low to High)</option>

                          <option value="price-desc">Price (High to Low)</option>

                        </select>

                      </div>

                      <div className="flex-1">

                        <Label className="text-sm mb-2 block">Country</Label>

                        <select

                          value={selectedCountry || ""}

                          onChange={(e) => setSelectedCountry(e.target.value || null)}

                          className="w-full p-2 border rounded-md"

                        >

                          <option value="">All Countries</option>

                          {Array.from(new Set(products.map(p => p.country_code))).map(country => (

                            <option key={country} value={country}>{country}</option>

                          ))}

                        </select>

                      </div>

                    </div>

                    <div>

                      <Label className="text-sm mb-2 block">Price Range (GHS)</Label>

                      <div className="flex items-center gap-4">

                        <Input

                          type="number"

                          value={priceRange[0]}

                          onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}

                          className="w-24"

                          placeholder="Min"

                        />

                        <span className="text-slate-400">-</span>

                        <Input

                          type="number"

                          value={priceRange[1]}

                          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}

                          className="w-24"

                          placeholder="Max"

                        />

                        <Button

                          variant="ghost"

                          size="sm"

                          onClick={() => {

                            setSelectedCountry(null)

                            setPriceRange([0, 1000])

                            setSortBy('name')

                          }}

                        >

                          Clear

                        </Button>

                      </div>

                    </div>

                  </div>

                )}



                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">

                  <div className="flex gap-2 flex-wrap">

                    <Button

                      variant={selectedCategory === null ? "default" : "outline"}

                      onClick={() => setSelectedCategory(null)}

                      size="sm"

                    >

                      All

                    </Button>

                    {CATEGORIES.map((cat) => (

                      <Button

                        key={cat.id}

                        variant={selectedCategory === cat.id ? "default" : "outline"}

                        onClick={() => setSelectedCategory(cat.id)}

                        size="sm"

                      >

                        {cat.name}

                      </Button>

                    ))}

                  </div>

                  <div className="flex gap-2">

                    <Button

                      variant={bulkSelectMode ? "default" : "outline"}

                      onClick={() => {

                        setBulkSelectMode(!bulkSelectMode)

                        setSelectedForBulk(new Set())

                      }}

                      size="sm"

                    >

                      <Layers className="h-4 w-4 mr-2" />

                      Bulk Select

                    </Button>

                    {bulkSelectMode && selectedForBulk.size > 0 && (

                      <>

                        <Button

                          variant="outline"

                          onClick={() => setSelectedForBulk(new Set())}

                          size="sm"

                        >

                          Clear ({selectedForBulk.size})

                        </Button>

                        <Button

                          onClick={() => setShowBulkModal(true)}

                          size="sm"

                        >

                          Purchase Selected ({selectedForBulk.size})

                        </Button>

                      </>

                    )}

                  </div>

                </div>

              </div>

            </CardHeader>

          </Card>



          {loadingProducts ? (

            <div className="flex items-center justify-center py-12">

              <Loader2 className="h-8 w-8 animate-spin text-[#006994]" />

            </div>

          ) : filteredProducts.length === 0 ? (

            <Card className="border-slate-200">

              <CardContent className="flex flex-col items-center justify-center py-12">

                <Gift className="h-12 w-12 text-slate-400 mb-4" />

                <p className="text-slate-600">No gift cards found</p>

              </CardContent>

            </Card>

          ) : (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

              {filteredProducts.map((product) => (

                <motion.div

                  key={product.id}

                  initial={{ opacity: 0, y: 20 }}

                  animate={{ opacity: 1, y: 0 }}

                  transition={{ duration: 0.3 }}

                >

                  <Card className="border-slate-200 hover:border-[#006994]/30 hover:shadow-lg transition-all cursor-pointer group relative">

                    {bulkSelectMode && (

                      <div className="absolute top-2 left-2 z-10">

                        <input

                          type="checkbox"

                          checked={selectedForBulk.has(product.reloadly_product_id)}

                          onChange={(e) => {

                            e.stopPropagation()

                            const newSet = new Set(selectedForBulk)

                            if (e.target.checked) {

                              newSet.add(product.reloadly_product_id)

                            } else {

                              newSet.delete(product.reloadly_product_id)

                            }

                            setSelectedForBulk(newSet)

                          }}

                          className="w-5 h-5 rounded"

                        />

                      </div>

                    )}

                    <CardContent className="p-4">

                      <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">

                        {product.logo_url ? (

                          <img

                            src={product.logo_url}

                            alt={product.brand_name}

                            className="w-full h-full object-cover"

                          />

                        ) : (

                          <Gift className="h-16 w-16 text-slate-300" />

                        )}

                      </div>

                      <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">

                        {product.product_name}

                      </h3>

                      <p className="text-xs text-slate-500 mb-2">{product.brand_name}</p>

                      <div className="flex items-center justify-between mb-3">

                        <div>

                          <p className="text-lg font-bold text-[#006994]">

                            GHS {formatCurrency(product.price_ghs)}

                          </p>

                          <p className="text-xs text-slate-500">

                            {product.denomination} {product.currency}

                          </p>

                        </div>

                        {product.is_restricted_to_resellers && (

                          <Badge variant="outline" className="text-xs">

                            Reseller Only

                          </Badge>

                        )}

                      </div>

                      <div className="flex gap-2">

                        <Button

                          variant="ghost"

                          size="icon"

                          onClick={(e) => {

                            e.stopPropagation()

                            toggleFavorite(product)

                          }}

                          className="flex-shrink-0"

                        >

                          {favoriteIds.has(product.reloadly_product_id) ? (

                            <Heart className="h-4 w-4 text-red-500 fill-red-500" />

                          ) : (

                            <Heart className="h-4 w-4" />

                          )}

                        </Button>

                        <Button

                          variant="outline"

                          size="sm"

                          onClick={(e) => {

                            e.stopPropagation()

                            setSelectedProduct(product)

                            setShowDetailsModal(true)

                          }}

                          className="flex-shrink-0"

                        >

                          <Info className="h-3 w-3" />

                        </Button>

                        <Button

                          className="flex-1"

                          onClick={() => {

                            setSelectedProduct(product)

                            setShowPurchaseModal(true)

                          }}

                        >

                          <ShoppingCart className="h-4 w-4 mr-2" />

                          Buy Now

                        </Button>

                      </div>

                    </CardContent>

                  </Card>

                </motion.div>

              ))}

            </div>

          )}

        </TabsContent>



        <TabsContent value="favorites" className="space-y-6">

          <Card className="border-slate-200">

            <CardHeader>

              <CardTitle>My Favorites</CardTitle>

              <CardDescription>Your saved gift cards</CardDescription>

            </CardHeader>

            <CardContent>

              {loadingFavorites ? (

                <div className="flex items-center justify-center py-12">

                  <Loader2 className="h-8 w-8 animate-spin text-[#006994]" />

                </div>

              ) : favorites.length === 0 ? (

                <div className="flex flex-col items-center justify-center py-12">

                  <HeartOff className="h-12 w-12 text-slate-400 mb-4" />

                  <p className="text-slate-600">No favorites yet</p>

                  <p className="text-sm text-slate-500 mt-2">Click the heart icon on any product to save it</p>

                </div>

              ) : (

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

                  {favorites.map((favorite) => (

                    <motion.div

                      key={favorite.reloadly_product_id}

                      initial={{ opacity: 0, y: 20 }}

                      animate={{ opacity: 1, y: 0 }}

                      transition={{ duration: 0.3 }}

                    >

                      <Card className="border-slate-200 hover:border-[#006994]/30 hover:shadow-lg transition-all">

                        <CardContent className="p-4">

                          <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">

                            {favorite.logo_url ? (

                              <img

                                src={favorite.logo_url}

                                alt={favorite.brand_name}

                                className="w-full h-full object-cover"

                              />

                            ) : (

                              <Gift className="h-16 w-16 text-slate-300" />

                            )}

                            <Button

                              variant="ghost"

                              size="icon"

                              className="absolute top-2 right-2 bg-white/90 hover:bg-white"

                              onClick={() => toggleFavorite(favorite)}

                            >

                              <Heart className="h-4 w-4 text-red-500 fill-red-500" />

                            </Button>

                          </div>

                          <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">

                            {favorite.product_name}

                          </h3>

                          <p className="text-xs text-slate-500 mb-2">{favorite.brand_name}</p>

                          <div className="flex items-center justify-between">

                            <p className="text-lg font-bold text-[#006994]">

                              GHS {formatCurrency(favorite.price_ghs)}

                            </p>

                            <Button

                              size="sm"

                              onClick={() => {

                                setSelectedProduct(favorite)

                                setShowPurchaseModal(true)

                              }}

                            >

                              <ShoppingCart className="h-3 w-3 mr-1" />

                              Buy

                            </Button>

                          </div>

                        </CardContent>

                      </Card>

                    </motion.div>

                  ))}

                </div>

              )}

            </CardContent>

          </Card>

        </TabsContent>



        <TabsContent value="orders" className="space-y-6">

          <Card className="border-slate-200">

            <CardHeader>

              <CardTitle>Recent Orders</CardTitle>

              <CardDescription>Your gift card purchase history</CardDescription>

            </CardHeader>

            <CardContent>

              {loadingOrders ? (

                <div className="flex items-center justify-center py-12">

                  <Loader2 className="h-8 w-8 animate-spin text-[#006994]" />

                </div>

              ) : orders.length === 0 ? (

                <div className="flex flex-col items-center justify-center py-12">

                  <ShoppingCart className="h-12 w-12 text-slate-400 mb-4" />

                  <p className="text-slate-600">No orders yet</p>

                </div>

              ) : (

                <div className="space-y-4">

                  {orders.map((order) => (

                    <div

                      key={order.id}

                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"

                    >

                      <div className="flex items-start gap-3 mb-3 sm:mb-0">

                        <div className={`p-2 rounded-lg ${

                          order.status === 'success' ? 'bg-green-100' :

                          order.status === 'pending' ? 'bg-yellow-100' :

                          'bg-red-100'

                        }`}>

                          {order.status === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> :

                           order.status === 'pending' ? <Clock className="h-4 w-4 text-yellow-600" /> :

                           <XCircle className="h-4 w-4 text-red-600" />}

                        </div>

                        <div>

                          <p className="font-medium text-slate-900">{order.product.name}</p>

                          <p className="text-sm text-slate-500">{order.product.brand}</p>

                          <p className="text-xs text-slate-400 mt-1">

                            {new Date(order.createdAt).toLocaleDateString()}

                          </p>

                        </div>

                      </div>

                      <div className="flex flex-col sm:items-end gap-2">

                        <span className="font-semibold text-[#006994]">

                          GHS {formatCurrency(order.amountGHS)}

                        </span>

                        <Badge variant={

                          order.status === 'success' ? 'default' :

                          order.status === 'pending' ? 'secondary' :

                          'destructive'

                        }>

                          {order.status}

                        </Badge>

                        {order.status === 'success' && order.giftCardCode && (

                          <Button

                            variant="ghost"

                            size="sm"

                            onClick={() => copyToClipboard(order.giftCardCode)}

                          >

                            <Copy className="h-3 w-3 mr-1" />

                            Copy Code

                          </Button>

                        )}

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </CardContent>

          </Card>

        </TabsContent>

      </Tabs>



      {showDetailsModal && selectedProduct && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <CardHeader>

              <div className="flex items-start justify-between">

                <div className="flex-1">

                  <CardTitle className="text-xl">{selectedProduct.product_name}</CardTitle>

                  <CardDescription className="mt-1">{selectedProduct.brand_name}</CardDescription>

                </div>

                <Button

                  variant="ghost"

                  size="icon"

                  onClick={() => setShowDetailsModal(false)}

                >

                  <XCircle className="h-5 w-5" />

                </Button>

              </div>

            </CardHeader>

            <CardContent className="space-y-6">

              <div className="flex items-center gap-4">

                <div className="w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center overflow-hidden">

                  {selectedProduct.logo_url ? (

                    <img

                      src={selectedProduct.logo_url}

                      alt={selectedProduct.brand_name}

                      className="w-full h-full object-cover"

                    />

                  ) : (

                    <Gift className="h-16 w-16 text-slate-300" />

                  )}

                </div>

                <div className="flex-1">

                  <p className="text-3xl font-bold text-[#006994]">

                    GHS {formatCurrency(selectedProduct.price_ghs)}

                  </p>

                  <p className="text-sm text-slate-500">

                    {selectedProduct.min_denomination} - {selectedProduct.max_denomination} {selectedProduct.currency_code}

                  </p>

                  <div className="flex gap-2 mt-2">

                    <Badge variant="outline">{selectedProduct.country_code}</Badge>

                    <Badge variant="outline">{selectedProduct.category}</Badge>

                    {selectedProduct.card_type && (

                      <Badge variant="outline">{selectedProduct.card_type}</Badge>

                    )}

                  </div>

                </div>

              </div>



              <div className="grid grid-cols-2 gap-4">

                <div className="p-4 bg-slate-50 rounded-lg">

                  <p className="text-sm text-slate-500 mb-1">Minimum Denomination</p>

                  <p className="font-semibold">{selectedProduct.min_denomination} {selectedProduct.currency_code}</p>

                </div>

                <div className="p-4 bg-slate-50 rounded-lg">

                  <p className="text-sm text-slate-500 mb-1">Maximum Denomination</p>

                  <p className="font-semibold">{selectedProduct.max_denomination} {selectedProduct.currency_code}</p>

                </div>

                {selectedProduct.sender_fee && (

                  <div className="p-4 bg-slate-50 rounded-lg">

                    <p className="text-sm text-slate-500 mb-1">Sender Fee</p>

                    <p className="font-semibold">{selectedProduct.sender_fee} USD</p>

                  </div>

                )}

                {selectedProduct.discount_percentage && (

                  <div className="p-4 bg-slate-50 rounded-lg">

                    <p className="text-sm text-slate-500 mb-1">Discount</p>

                    <p className="font-semibold text-green-600">{selectedProduct.discount_percentage}% off</p>

                  </div>

                )}

              </div>



              {selectedProduct.fixed_denominations && selectedProduct.fixed_denominations.length > 0 && (

                <div>

                  <h4 className="font-semibold mb-2">Available Denominations</h4>

                  <div className="flex flex-wrap gap-2">

                    {selectedProduct.fixed_denominations.map((denom: any, idx: number) => (

                      <Badge key={idx} variant="secondary">

                        {denom.denomination} {denom.currencyCode}

                      </Badge>

                    ))}

                  </div>

                </div>

              )}



              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">

                <h4 className="font-semibold text-blue-900 mb-2">Delivery Information</h4>

                <ul className="text-sm text-blue-800 space-y-1">

                  <li>• Instant delivery via email</li>

                  <li>• SMS delivery available (optional)</li>

                  <li>• Gift card codes stored securely</li>

                  <li>• Valid in {selectedProduct.country_name || selectedProduct.country_code}</li>

                </ul>

              </div>



              <div className="p-4 bg-slate-50 rounded-lg">

                <h4 className="font-semibold mb-2">Terms & Conditions</h4>

                <ul className="text-sm text-slate-600 space-y-1">

                  <li>• Gift cards are non-refundable once purchased</li>

                  <li>• Valid for use in {selectedProduct.country_name || selectedProduct.country_code} only</li>

                  <li>• Check expiry date upon receipt</li>

                  <li>• Keep your gift card code secure</li>

                </ul>

              </div>



              <div className="flex gap-2">

                <Button

                  variant="outline"

                  onClick={() => {

                    toggleFavorite(selectedProduct)

                  }}

                  className="flex-1"

                >

                  {favoriteIds.has(selectedProduct.reloadly_product_id) ? (

                    <>

                      <HeartOff className="h-4 w-4 mr-2" />

                      Remove from Favorites

                    </>

                  ) : (

                    <>

                      <Heart className="h-4 w-4 mr-2" />

                      Add to Favorites

                    </>

                  )}

                </Button>

                <Button

                  onClick={() => {

                    setShowDetailsModal(false)

                    setShowPurchaseModal(true)

                  }}

                  className="flex-1"

                >

                  <ShoppingCart className="h-4 w-4 mr-2" />

                  Purchase Now

                </Button>

              </div>

            </CardContent>

          </Card>

        </div>

      )}



      {showBulkModal && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <CardHeader>

              <CardTitle>Bulk Purchase ({selectedForBulk.size} items)</CardTitle>

              <CardDescription>Purchase multiple gift cards at once</CardDescription>

            </CardHeader>

            <CardContent className="space-y-4">

              <div className="space-y-2 max-h-60 overflow-y-auto">

                {filteredProducts.filter(p => selectedForBulk.has(p.reloadly_product_id)).map(product => (

                  <div key={product.reloadly_product_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">

                    <div className="flex items-center gap-3">

                      <div className="w-12 h-12 bg-white rounded flex items-center justify-center overflow-hidden">

                        {product.logo_url ? (

                          <img src={product.logo_url} alt={product.brand_name} className="w-full h-full object-cover" />

                        ) : (

                          <Gift className="h-6 w-6 text-slate-300" />

                        )}

                      </div>

                      <div>

                        <p className="font-medium text-sm">{product.product_name}</p>

                        <p className="text-xs text-slate-500">{product.brand_name}</p>

                      </div>

                    </div>

                    <div className="flex items-center gap-2">

                      <Label className="text-xs">Qty:</Label>

                      <Input

                        type="number"

                        min="1"

                        defaultValue="1"

                        className="w-16 h-8 text-sm"

                        id={`bulk-qty-${product.reloadly_product_id}`}

                      />

                      <p className="font-semibold text-[#006994] text-sm">

                        GHS {formatCurrency(product.price_ghs)}

                      </p>

                    </div>

                  </div>

                ))}

              </div>



              <div className="space-y-3">

                <Label htmlFor="bulk-recipient-email">Recipient Email *</Label>

                <Input

                  id="bulk-recipient-email"

                  type="email"

                  placeholder="recipient@example.com"

                  value={purchaseForm.recipientEmail}

                  onChange={(e) => setPurchaseForm({ ...purchaseForm, recipientEmail: e.target.value })}

                />

              </div>



              <div className="space-y-3">

                <Label htmlFor="bulk-payment-method">Payment Method</Label>

                <div className="flex gap-2">

                  <Button

                    type="button"

                    variant={purchaseForm.paymentMethod === 'wallet' ? 'default' : 'outline'}

                    onClick={() => setPurchaseForm({ ...purchaseForm, paymentMethod: 'wallet' })}

                    className="flex-1"

                  >

                    <Wallet className="h-4 w-4 mr-2" />

                    Wallet

                  </Button>

                  <Button

                    type="button"

                    variant={purchaseForm.paymentMethod === 'paystack' ? 'default' : 'outline'}

                    onClick={() => setPurchaseForm({ ...purchaseForm, paymentMethod: 'paystack' })}

                    className="flex-1"

                  >

                    <CreditCard className="h-4 w-4 mr-2" />

                    Card

                  </Button>

                </div>

              </div>



              <div className="flex gap-2">

                <Button

                  variant="outline"

                  onClick={() => setShowBulkModal(false)}

                  className="flex-1"

                >

                  Cancel

                </Button>

                <Button

                  onClick={async () => {

                    if (!purchaseForm.recipientEmail) {

                      toast.error("Recipient email is required")

                      return

                    }



                    setPurchasing(true)

                    try {

                      const purchases = filteredProducts

                        .filter(p => selectedForBulk.has(p.reloadly_product_id))

                        .map(product => {

                          const qtyInput = document.getElementById(`bulk-qty-${product.reloadly_product_id}`) as HTMLInputElement

                          const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1

                          return {

                            productId: product.reloadly_product_id,

                            recipientEmail: purchaseForm.recipientEmail,

                            recipientPhone: purchaseForm.recipientPhone,

                            recipientName: purchaseForm.recipientName,

                            isGift: purchaseForm.isGift,

                            senderMessage: purchaseForm.senderMessage,

                            quantity,

                          }

                        })



                      const res = await fetch("/api/giftcards/bulk-purchase", {

                        method: "POST",

                        credentials: "include",

                        headers: { "Content-Type": "application/json" },

                        body: JSON.stringify({

                          purchases,

                          paymentMethod: purchaseForm.paymentMethod,

                        }),

                      })



                      const data = await res.json()

                      if (data.success) {

                        const { results, errors, successful, failed } = data.data

                        toast.success(`Purchased ${successful} gift cards${failed > 0 ? `, ${failed} failed` : ''}`)

                        setShowBulkModal(false)

                        setSelectedForBulk(new Set())

                        setBulkSelectMode(false)

                        loadOrders()

                      } else {

                        toast.error(data.error || "Failed to purchase gift cards")

                      }

                    } catch (error) {

                      console.error("Error bulk purchasing:", error)

                      toast.error("Failed to purchase gift cards")

                    } finally {

                      setPurchasing(false)

                    }

                  }}

                  disabled={purchasing}

                  className="flex-1"

                >

                  {purchasing ? (

                    <>

                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />

                      Processing...

                    </>

                  ) : (

                    <>

                      <ShoppingCart className="h-4 w-4 mr-2" />

                      Purchase All

                    </>

                  )}

                </Button>

              </div>

            </CardContent>

          </Card>

        </div>

      )}



      {showPurchaseModal && selectedProduct && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">

            <CardHeader>

              <CardTitle>Purchase Gift Card</CardTitle>

              <CardDescription>

                {selectedProduct.product_name} - {selectedProduct.brand_name}

              </CardDescription>

            </CardHeader>

            <CardContent className="space-y-4">

              <div className="p-4 bg-slate-50 rounded-lg">

                <p className="text-lg font-bold text-[#006994]">

                  GHS {formatCurrency(selectedProduct.price_ghs)}

                </p>

                <p className="text-sm text-slate-500">

                  {selectedProduct.denomination} {selectedProduct.currency}

                </p>

              </div>



              <div className="space-y-3">

                <Label htmlFor="recipientEmail">Recipient Email *</Label>

                <Input

                  id="recipientEmail"

                  type="email"

                  value={purchaseForm.recipientEmail}

                  onChange={(e) => setPurchaseForm({ ...purchaseForm, recipientEmail: e.target.value })}

                  placeholder="recipient@example.com"

                />

              </div>



              <div className="space-y-3">

                <Label htmlFor="recipientPhone">Recipient Phone (Optional)</Label>

                <Input

                  id="recipientPhone"

                  type="tel"

                  value={purchaseForm.recipientPhone}

                  onChange={(e) => setPurchaseForm({ ...purchaseForm, recipientPhone: e.target.value })}

                  placeholder="+233..."

                />

              </div>



              <div className="space-y-3">

                <Label htmlFor="recipientName">Recipient Name (Optional)</Label>

                <Input

                  id="recipientName"

                  value={purchaseForm.recipientName}

                  onChange={(e) => setPurchaseForm({ ...purchaseForm, recipientName: e.target.value })}

                  placeholder="John Doe"

                />

              </div>



              <div className="flex items-center space-x-2">

                <input

                  type="checkbox"

                  id="isGift"

                  checked={purchaseForm.isGift}

                  onChange={(e) => setPurchaseForm({ ...purchaseForm, isGift: e.target.checked })}

                  className="rounded"

                />

                <Label htmlFor="isGift">This is a gift</Label>

              </div>



              {purchaseForm.isGift && (

                <div className="space-y-3">

                  <Label htmlFor="senderMessage">Gift Message (Optional)</Label>

                  <textarea

                    id="senderMessage"

                    value={purchaseForm.senderMessage}

                    onChange={(e) => setPurchaseForm({ ...purchaseForm, senderMessage: e.target.value })}

                    placeholder="Add a personal message..."

                    className="w-full p-2 border rounded-md min-h-[80px]"

                  />

                </div>

              )}



              <div className="space-y-3">

                <Label>Payment Method</Label>

                <div className="flex gap-2">

                  <Button

                    type="button"

                    variant={purchaseForm.paymentMethod === 'wallet' ? 'default' : 'outline'}

                    onClick={() => setPurchaseForm({ ...purchaseForm, paymentMethod: 'wallet' })}

                    className="flex-1"

                  >

                    <Wallet className="h-4 w-4 mr-2" />

                    Wallet

                  </Button>

                  <Button

                    type="button"

                    variant={purchaseForm.paymentMethod === 'paystack' ? 'default' : 'outline'}

                    onClick={() => setPurchaseForm({ ...purchaseForm, paymentMethod: 'paystack' })}

                    className="flex-1"

                  >

                    <CreditCard className="h-4 w-4 mr-2" />

                    Card

                  </Button>

                </div>

              </div>



              <div className="flex gap-2">

                <Button

                  variant="outline"

                  onClick={() => setShowPurchaseModal(false)}

                  className="flex-1"

                >

                  Cancel

                </Button>

                <Button

                  onClick={handlePurchase}

                  disabled={purchasing}

                  className="flex-1"

                >

                  {purchasing ? (

                    <>

                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />

                      Processing...

                    </>

                  ) : (

                    <>

                      <ShoppingCart className="h-4 w-4 mr-2" />

                      Purchase

                    </>

                  )}

                </Button>

              </div>

            </CardContent>

          </Card>

        </div>

      )}

    </div>

  )

}

