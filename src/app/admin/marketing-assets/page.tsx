"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Image, Upload, Trash2, Download, FileText, Video, RefreshCw } from "lucide-react";

interface MarketingAsset {
  id: string;
  name: string;
  type: string;
  category: string;
  file_url: string;
  thumbnail_url: string;
  dimensions: string;
  file_size: number;
  download_count: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminMarketingAssetsPage() {
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "",
    category: "banner",
    type: "image"
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const res = await fetch("/api/admin/marketing-assets", {
        credentials: "include"
      });
      const data = await res.json();

      if (data.success) {
        setAssets(data.assets);
      }
    } catch (error) {
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      const res = await fetch(`/api/admin/marketing-assets/${assetId}`, {
        method: "DELETE",
        credentials: "include"
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Asset deleted");
        loadAssets();
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleToggleActive = async (asset: MarketingAsset) => {
    try {
      const res = await fetch(`/api/admin/marketing-assets/${asset.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !asset.is_active })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Asset updated");
        loadAssets();
      }
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      default: return <Download className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006994]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Marketing Asset Management</h1>
          <p className="text-muted-foreground">Upload and manage marketing materials for resellers</p>
        </div>
        <Button variant="outline" onClick={loadAssets}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Upload New Asset */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload New Asset</CardTitle>
          <CardDescription>Add new marketing materials for resellers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Asset Name</Label>
              <Input
                placeholder="e.g., Banner Ad 300x250"
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <select
                className="w-full border rounded-md p-2"
                value={newAsset.category}
                onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
              >
                <option value="banner">Banner</option>
                <option value="social">Social Media</option>
                <option value="email">Email Template</option>
                <option value="flyer">Flyer</option>
                <option value="logo">Logo</option>
              </select>
            </div>
            <div>
              <Label>Type</Label>
              <select
                className="w-full border rounded-md p-2"
                value={newAsset.type}
                onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
              </select>
            </div>
          </div>
          <div className="mt-4 border-2 border-dashed border-muted rounded-lg p-8 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Drag and drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Supports images, videos, and documents up to 50MB</p>
          </div>
        </CardContent>
      </Card>

      {/* Assets List */}
      <Card>
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
          <CardDescription>Manage existing marketing materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="border rounded-lg overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {asset.thumbnail_url ? (
                    <img src={asset.thumbnail_url} alt={asset.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-muted-foreground">{getAssetIcon(asset.type)}</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{asset.name}</h3>
                      <p className="text-xs text-muted-foreground">{asset.category}</p>
                    </div>
                    <Badge variant={asset.is_active ? "default" : "secondary"}>
                      {asset.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(asset.file_size)}</span>
                    <span>{asset.dimensions}</span>
                    <span>{asset.download_count} downloads</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" asChild>
                      <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleToggleActive(asset)}
                    >
                      {asset.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {assets.length === 0 && (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-2" />
                <p>No marketing assets uploaded yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
