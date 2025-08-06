"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Store,
  Plus,
  Search,
  Users,
  TrendingUp,
} from "lucide-react"
import { useAuth } from "@/lib/supabase/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface StoreData {
  id: string
  name: string
  brand_id: string
  brand_name: string
  address: string
  phone: string
  type: string
  capacity: number
  created_at: string
}

interface BrandData {
  id: string
  name: string
  store_count: number
}

export default function StoresManagementPage() {
  const { user: _user, profile: _profile } = useAuth()
  const [stores, setStores] = useState<StoreData[]>([])
  const [brands, setBrands] = useState<BrandData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [brandFilter, setBrandFilter] = useState("all")
  const [_statusFilter, _setStatusFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchStores = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          address,
          phone,
          type,
          capacity,
          created_at,
          brand_id,
          brands!inner(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedStores = data?.map(store => ({
        ...store,
        brand_name: store.brands?.name || '알 수 없음'
      })) || []

       setStores(formattedStores as StoreData[])
    } catch (error) {
      console.error('매장 데이터 로딩 실패:', {
        message: error instanceof Error ? error.message : String(error),
        error: error
      })
      toast.error('매장 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchBrands = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('brands')
        .select(`
          id,
          name,
          stores(count)
        `)
        .order('name')

      if (error) throw error

      const formattedBrands = data?.map(brand => ({
        id: brand.id,
        name: brand.name,
        store_count: brand.stores?.[0]?.count || 0
      })) || []

      setBrands(formattedBrands)
    } catch (error) {
      console.error('브랜드 데이터 로딩 실패:', {
        message: error instanceof Error ? error.message : String(error),
        error: error
      })
      toast.error('브랜드 데이터를 불러오는데 실패했습니다.')
    }
  }

  // 데이터 로딩
  useEffect(() => {
    fetchStores()
    fetchBrands()
  }, [])

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBrand = brandFilter === "all" || store.brand_id === brandFilter
    
    return matchesSearch && matchesBrand
  })



  const totalStores = stores.length
  const totalCapacity = stores.reduce((sum, store) => sum + store.capacity, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">매장 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">매장 관리</h1>
          <p className="text-muted-foreground mt-2">
            전체 브랜드의 매장을 통합 관리합니다
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              새 매장 등록
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>새 매장 등록</DialogTitle>
              <DialogDescription>
                새로운 매장을 등록합니다. 모든 필수 정보를 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store-name">매장명</Label>
                  <Input id="store-name" placeholder="매장명을 입력하세요" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand-select">브랜드</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="브랜드를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <Input id="address" placeholder="매장 주소를 입력하세요" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input id="phone" placeholder="02-1234-5678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager">매니저</Label>
                  <Input id="manager" placeholder="매니저명을 입력하세요" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">운영시간</Label>
                <Input id="hours" placeholder="09:00 - 22:00" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={() => {
                toast.success('매장이 등록되었습니다.')
                setIsCreateDialogOpen(false)
              }}>
                등록
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 매장</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStores}</div>
            <p className="text-xs text-muted-foreground">
              등록된 매장 수
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수용인원</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}명</div>
            <p className="text-xs text-muted-foreground">
              평균 {Math.round(totalCapacity / Math.max(totalStores, 1))}명/매장
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">브랜드 수</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
            <p className="text-xs text-muted-foreground">
              활성 브랜드 수
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>매장 목록</CardTitle>
          <CardDescription>
            전체 브랜드의 매장을 조회하고 관리할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="매장명, 브랜드명, 주소로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="브랜드 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 브랜드</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name} ({brand.store_count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>매장명</TableHead>
                  <TableHead>브랜드</TableHead>
                  <TableHead>주소</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>수용인원</TableHead>
                  <TableHead>등록일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Store className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>조건에 맞는 매장이 없습니다.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell>{store.brand_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{store.address}</TableCell>
                      <TableCell>{store.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {store.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{store.capacity}명</TableCell>
                      <TableCell>{new Date(store.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}